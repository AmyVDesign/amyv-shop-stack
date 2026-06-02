-- One-time cleanup: consolidate redundant "new" condition variants
-- For each (part_number, manufacturer) group with multiple new rows:
--   Pick the row with highest price_cents (tiebreak: oldest created_at) as keeper
--   Sum qty_on_hand and qty_for_sale from others into the keeper
--   Delete the other new rows
-- This is destructive — batch history is lost. Future "new" additions will be
-- handled by upcoming inventory_events feature (not yet built).

BEGIN;

-- Identify keepers and totals per group
CREATE TEMP TABLE new_cleanup AS
WITH keepers AS (
  SELECT DISTINCT ON (LOWER(TRIM(part_number)), LOWER(TRIM(manufacturer)))
    id AS keeper_id,
    LOWER(TRIM(part_number)) AS pn_key,
    LOWER(TRIM(manufacturer)) AS mfr_key
  FROM products
  WHERE condition = 'new'
    AND part_number IS NOT NULL
    AND manufacturer IS NOT NULL
    AND TRIM(part_number) != ''
    AND TRIM(manufacturer) != ''
  ORDER BY
    LOWER(TRIM(part_number)),
    LOWER(TRIM(manufacturer)),
    price_cents DESC,
    created_at ASC
),
group_totals AS (
  SELECT
    k.keeper_id,
    SUM(p.qty_on_hand) AS total_on_hand,
    SUM(p.qty_for_sale) AS total_for_sale
  FROM keepers k
  JOIN products p
    ON LOWER(TRIM(p.part_number)) = k.pn_key
    AND LOWER(TRIM(p.manufacturer)) = k.mfr_key
  WHERE p.condition = 'new'
  GROUP BY k.keeper_id
  HAVING COUNT(p.id) > 1
)
SELECT
  gt.keeper_id,
  gt.total_on_hand,
  gt.total_for_sale,
  k.pn_key,
  k.mfr_key
FROM group_totals gt
JOIN keepers k ON k.keeper_id = gt.keeper_id;

-- Update keepers with summed qty
UPDATE products p
SET
  qty_on_hand = nc.total_on_hand,
  qty_for_sale = nc.total_for_sale
FROM new_cleanup nc
WHERE p.id = nc.keeper_id;

-- Delete non-keeper new rows in cleaned groups
DELETE FROM products
WHERE condition = 'new'
  AND id IN (
    SELECT p.id
    FROM products p
    JOIN new_cleanup nc
      ON LOWER(TRIM(p.part_number)) = nc.pn_key
      AND LOWER(TRIM(p.manufacturer)) = nc.mfr_key
    WHERE p.id != nc.keeper_id
  );

DROP TABLE new_cleanup;

COMMIT;
