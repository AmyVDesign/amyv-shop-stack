-- Rename manufacturer to vendor.
-- The vendor column added in 20260601240000 was a backfill copy of manufacturer.
-- Drop that temporary copy first so the rename doesn't conflict.
ALTER TABLE products DROP COLUMN vendor;
ALTER TABLE products RENAME COLUMN manufacturer TO vendor;
