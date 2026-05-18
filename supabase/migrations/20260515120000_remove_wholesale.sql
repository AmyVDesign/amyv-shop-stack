-- Drop wholesale tables (CASCADE removes indexes, constraints, triggers on these tables)
DROP TABLE IF EXISTS wholesale_allocations CASCADE;
DROP TABLE IF EXISTS wholesale_partners CASCADE;

-- Drop the existing inventory invariant function and its trigger
DROP FUNCTION IF EXISTS enforce_inventory_invariant() CASCADE;

-- Recreate simpler version: only checks qty_for_sale <= qty_on_hand
CREATE OR REPLACE FUNCTION enforce_inventory_invariant()
RETURNS trigger AS $$
BEGIN
  IF NEW.qty_for_sale > NEW.qty_on_hand THEN
    RAISE EXCEPTION
      'qty_for_sale (%) cannot exceed qty_on_hand (%)',
      NEW.qty_for_sale, NEW.qty_on_hand;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enforce_inventory_invariant
  BEFORE INSERT OR UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION enforce_inventory_invariant();

-- Remove 'wholesale' from product_visibility enum
-- Postgres requires: rename-recreate-migrate pattern, plus
--   - drop the column default (auto-cast doesn't apply during type change)
--   - drop any policies referencing the column

-- 1. Rename old enum
ALTER TYPE product_visibility RENAME TO product_visibility_old;

-- 2. Create new enum without 'wholesale'
CREATE TYPE product_visibility AS ENUM ('public', 'internal', 'ebay_only');

-- 3a. Drop the policy that references visibility (recreated below)
DROP POLICY IF EXISTS products_public_select ON products;

-- 3b. Drop the default (Postgres can't auto-cast a default during type change)
ALTER TABLE products ALTER COLUMN visibility DROP DEFAULT;

-- 3c. Migrate column: any existing 'wholesale' rows become 'internal'
ALTER TABLE products
  ALTER COLUMN visibility TYPE product_visibility
  USING (
    CASE visibility::text
      WHEN 'wholesale' THEN 'internal'::product_visibility
      ELSE visibility::text::product_visibility
    END
  );

-- 3d. Restore default with the new enum type
ALTER TABLE products ALTER COLUMN visibility SET DEFAULT 'internal'::product_visibility;

-- 3e. Recreate the public-select policy
CREATE POLICY products_public_select ON products
  FOR SELECT TO anon
  USING (visibility = 'public');

-- 4. Drop old enum
DROP TYPE product_visibility_old;