import { NextResponse } from 'next/server'
import { MARINE_CATEGORIES } from '@/data/marine-categories'

// ── Types ───────────────────────────────────────────────────────────────────

interface VisionResult {
  suggested_title: string | null
  suggested_part_number: string | null
  suggested_vendor: string | null
  suggested_category_hint: string | null
  suggested_product_type: string | null
  suggested_condition_notes: string | null
  suggested_summary: string | null
  confidence: Record<string, 'high' | 'medium' | 'low'>
}

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

// ── Category matching against curated marine categories ──────────────────────

function matchCategory(hint: string): { id: string; path: string; label: string } | null {
  if (!hint.trim()) return null
  const h = hint.toLowerCase()

  // First try direct substring match on label
  const direct = MARINE_CATEGORIES.find((c) => c.label.toLowerCase().includes(h) || h.includes(c.label.toLowerCase()))
  if (direct) return { id: direct.google_category_id, path: direct.google_category_path, label: direct.label }

  // Fall back to token overlap scoring
  const hTokens = h.split(/[\s>\/,&]+/).filter(Boolean)
  let best: (typeof MARINE_CATEGORIES)[number] | null = null
  let bestScore = 0
  for (const cat of MARINE_CATEGORIES) {
    const cTokens = cat.label.toLowerCase().split(/[\s>\/,&]+/).filter(Boolean)
    const intersection = hTokens.filter((t) => cTokens.some((c) => c.includes(t) || t.includes(c))).length
    const union = new Set([...hTokens, ...cTokens]).size
    const score = union === 0 ? 0 : intersection / union
    if (score > bestScore) { bestScore = score; best = cat }
  }
  if (bestScore < 0.3 || !best) return null
  return { id: best.google_category_id, path: best.google_category_path, label: best.label }
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
  "suggested_summary": string | null,
  "confidence": {
    "title": "high" | "medium" | "low",
    "part_number": "high" | "medium" | "low",
    "vendor": "high" | "medium" | "low",
    "category": "high" | "medium" | "low",
    "product_type": "high" | "medium" | "low",
    "condition_notes": "high" | "medium" | "low",
    "summary": "high" | "medium" | "low"
  }
}

For category_hint, return a natural language description like "Watercraft Parts > Engine Components" or "Books > Boating Manuals" — we'll match to a real taxonomy node server-side.

suggested_summary: a 1 to 3 sentence storefront product description written for customers browsing the shop. Describe the product itself — what the part is, what it's used for, and the key functional characteristics visible in the photos (size, fitting type, material, application). Do NOT describe the photos, packaging, or labels. Do NOT mention what languages text appears in. Do NOT use auction-style language ("genuine", "presented", "this is a"). Write in plain confident product-listing prose. Start with the part itself, not "This is" or "Here we have". Example tone: "Spin-on style oil filter for Kohler marine generators. Compatible with select Kohler engine models. Made in USA."

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
        max_tokens: 1536,
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
      summary:         parsed.suggested_summary ?? null,
    },
    confidence: parsed.confidence ?? {},
  })
}
