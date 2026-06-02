-- Normalize linked_listing_id so every linked row points directly to its root canonical,
-- not to a child that itself points elsewhere.

WITH RECURSIVE link_chain AS (
  SELECT id, linked_listing_id, id AS root_id
  FROM products
  WHERE linked_listing_id IS NULL

  UNION ALL

  SELECT p.id, p.linked_listing_id, lc.root_id
  FROM products p
  JOIN link_chain lc ON p.linked_listing_id = lc.id
)
UPDATE products p
SET linked_listing_id = lc.root_id
FROM link_chain lc
WHERE p.id = lc.id
  AND p.linked_listing_id IS NOT NULL
  AND p.linked_listing_id != lc.root_id;
