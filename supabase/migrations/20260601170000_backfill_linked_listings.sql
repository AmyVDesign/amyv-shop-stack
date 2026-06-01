-- One-time backfill: link any same-part listings that aren't already linked
-- For each (lower(trim(part_number)), lower(trim(manufacturer))) group,
-- pick the oldest row with linked_listing_id IS NULL as canonical.
-- Link all OTHER rows in the same group to that canonical row.

WITH canonical_rows AS (
  SELECT DISTINCT ON (LOWER(TRIM(part_number)), LOWER(TRIM(manufacturer)))
    id AS canonical_id,
    LOWER(TRIM(part_number)) AS pn_key,
    LOWER(TRIM(manufacturer)) AS mfr_key
  FROM products
  WHERE part_number IS NOT NULL
    AND manufacturer IS NOT NULL
    AND TRIM(part_number) != ''
    AND TRIM(manufacturer) != ''
    AND linked_listing_id IS NULL
  ORDER BY
    LOWER(TRIM(part_number)),
    LOWER(TRIM(manufacturer)),
    created_at ASC
)
UPDATE products p
SET linked_listing_id = c.canonical_id
FROM canonical_rows c
WHERE LOWER(TRIM(p.part_number)) = c.pn_key
  AND LOWER(TRIM(p.manufacturer)) = c.mfr_key
  AND p.id != c.canonical_id
  AND p.linked_listing_id IS NULL;
