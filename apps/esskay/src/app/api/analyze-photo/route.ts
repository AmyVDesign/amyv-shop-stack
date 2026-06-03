import { NextResponse } from 'next/server'
import taxonomyJson from '@/data/google-taxonomy.json'

// ── Types ───────────────────────────────────────────────────────────────────

interface TaxonomyEntry {
  id: string
  path: string
  name: string
}

interface VisionResult {
  suggested_title: string | null
  suggested_part_number: string | null
  suggested_vendor: string | null
  suggested_category_hint: string | null
  suggested_product_type: string | null
  suggested_condition_notes: string | null
  confidence: Record<string, 'high' | 'medium' | 'low'>
}

const taxonomy = taxonomyJson as TaxonomyEntry[]

// ── Rate limiting (in-memory, resets on server restart) ─────────────────────

const dailyCounts = new Map<string, number>()

function todayKey() {
  return new Date().toISOString().slice(0, 10) // YYYY-MM-DD
}

function checkAndIncrementRate(max: number): boolean {
  const key = todayKey()
  const count = dailyCounts.get(key) ?? 0
  if (count >= max) return false
  dailyCounts.set(key, count + 1)
  return true
}

// ── Category matching (Jaccard token overlap) ────────────────────────────────

function tokenize(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .split(/[\s>\/,&]+/)
      .map((t) => t.replace(/[^a-z0-9]/g, ''))
      .filter(Boolean)
  )
}

function jaccardScore(a: Set<string>, b: Set<string>): number {
  let intersection = 0
  for (const t of a) if (b.has(t)) intersection++
  const union = a.size + b.size - intersection
  return union === 0 ? 0 : intersection / union
}

function matchCategory(hint: string): { id: string; path: string } | null {
  const hintTokens = tokenize(hint)
  if (hintTokens.size === 0) return null

  let bestScore = 0
  let bestEntry: TaxonomyEntry | null = null

  for (const entry of taxonomy) {
    const score = jaccardScore(hintTokens, tokenize(entry.path))
    if (score > bestScore) {
      bestScore = score
      bestEntry = entry
    }
  }

  if (bestScore < 0.3 || !bestEntry) return null
  return { id: bestEntry.id, path: bestEntry.path }
}

// ── Vision prompt ────────────────────────────────────────────────────────────

const VISION_PROMPT = `You are analyzing a photo of an item for a marine parts business inventory system. The business sells parts (engines, filters, electrical), nautical books, and charts.

Examine the image and return ONLY a JSON object (no markdown, no commentary) with this exact shape:

{
  "suggested_title": string | null,
  "suggested_part_number": string | null,
  "suggested_vendor": string | null,
  "suggested_category_hint": string | null,
  "suggested_product_type": string | null,
  "suggested_condition_notes": string | null,
  "confidence": {
    "title": "high" | "medium" | "low",
    "part_number": "high" | "medium" | "low",
    "vendor": "high" | "medium" | "low",
    "category": "high" | "medium" | "low",
    "product_type": "high" | "medium" | "low",
    "condition_notes": "high" | "medium" | "low"
  }
}

For category_hint, return a natural language description like "Watercraft Parts > Engine Components" or "Books > Boating Manuals" — we'll match to a real taxonomy node server-side.

If a field is not determinable from the image, set it to null and confidence to "low".`

// ── Route handler ─────────────────────────────────────────────────────────────

export async function POST(request: Request) {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'ANTHROPIC_API_KEY not configured' }, { status: 500 })
  }

  const isProduction = process.env.NODE_ENV === 'production'
  const defaultMax = isProduction ? 500 : 50
  const maxDaily = parseInt(process.env.RATE_LIMIT_DAILY ?? String(defaultMax), 10)

  if (!checkAndIncrementRate(maxDaily)) {
    return NextResponse.json({ error: 'Daily rate limit exceeded' }, { status: 429 })
  }

  let photoUrl: string
  try {
    const body = await request.json() as { photoUrl?: unknown }
    if (typeof body.photoUrl !== 'string' || !body.photoUrl) {
      return NextResponse.json({ error: 'photoUrl required' }, { status: 400 })
    }
    photoUrl = body.photoUrl
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  let claudeRes: Response
  try {
    claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1024,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: { type: 'url', url: photoUrl },
              },
              {
                type: 'text',
                text: VISION_PROMPT,
              },
            ],
          },
        ],
      }),
    })
  } catch (err) {
    console.error('[analyze-photo] fetch failed:', err)
    return NextResponse.json({ error: 'Failed to reach vision API' }, { status: 502 })
  }

  if (!claudeRes.ok) {
    const errText = await claudeRes.text()
    console.error('[analyze-photo] Anthropic error:', claudeRes.status, errText)
    return NextResponse.json({ error: 'Vision API error' }, { status: 502 })
  }

  const claudeData = await claudeRes.json() as { content?: Array<{ text?: string }> }
  const rawText = claudeData.content?.[0]?.text ?? '{}'

  let parsed: VisionResult
  try {
    parsed = JSON.parse(rawText) as VisionResult
  } catch {
    console.error('[analyze-photo] Failed to parse Claude response:', rawText)
    return NextResponse.json({ error: 'Unparseable response from vision API' }, { status: 502 })
  }

  const matchedCategory = parsed.suggested_category_hint
    ? matchCategory(parsed.suggested_category_hint)
    : null

  return NextResponse.json({
    suggestions: {
      title:           parsed.suggested_title ?? null,
      part_number:     parsed.suggested_part_number ?? null,
      vendor:          parsed.suggested_vendor ?? null,
      category:        matchedCategory,
      product_type:    parsed.suggested_product_type ?? null,
      condition_notes: parsed.suggested_condition_notes ?? null,
    },
    confidence: parsed.confidence ?? {},
  })
}
