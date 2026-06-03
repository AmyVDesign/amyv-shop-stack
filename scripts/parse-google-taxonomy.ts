/**
 * Downloads Google's Product Taxonomy (with IDs) and converts it to JSON.
 * Output: apps/esskay/src/data/google-taxonomy.json
 *
 * Usage: npx tsx scripts/parse-google-taxonomy.ts
 */

import { writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

const TAXONOMY_URL =
  'https://www.google.com/basepages/producttype/taxonomy-with-ids.en-US.txt'
const OUT_PATH = resolve(
  import.meta.dirname,
  '../apps/esskay/src/data/google-taxonomy.json'
)

interface TaxonomyEntry {
  id: string
  path: string
  name: string
  parent_id: string | null
}

async function main() {
  console.log(`Fetching ${TAXONOMY_URL} …`)
  const res = await fetch(TAXONOMY_URL)
  if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`)
  const text = await res.text()

  const entries: TaxonomyEntry[] = []

  // Build a map from path prefix → id for parent resolution
  const pathToId = new Map<string, string>()

  for (const raw of text.split('\n')) {
    const line = raw.trim()
    // Skip blank lines and the header comment
    if (!line || line.startsWith('#')) continue

    // Format: <id> - <full > separated path>
    const dashIdx = line.indexOf(' - ')
    if (dashIdx === -1) continue

    const id = line.slice(0, dashIdx).trim()
    const path = line.slice(dashIdx + 3).trim()

    pathToId.set(path, id)

    // name = last segment of the path
    const segments = path.split(' > ')
    const name = segments[segments.length - 1]

    // parent_id = id of path without the last segment
    let parent_id: string | null = null
    if (segments.length > 1) {
      const parentPath = segments.slice(0, -1).join(' > ')
      parent_id = pathToId.get(parentPath) ?? null
    }

    entries.push({ id, path, name, parent_id })
  }

  writeFileSync(OUT_PATH, JSON.stringify(entries, null, 2) + '\n')
  console.log(`Wrote ${entries.length} entries → ${OUT_PATH}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
