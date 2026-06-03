-- Add Google Product Taxonomy fields and vendor column to products
-- vendor is backfilled from manufacturer; manufacturer is kept for one release

ALTER TABLE products
  ADD COLUMN google_category_id   text,
  ADD COLUMN google_category_path text,
  ADD COLUMN product_type         text,
  ADD COLUMN vendor               text;

-- Backfill vendor from manufacturer for existing rows
UPDATE products SET vendor = manufacturer WHERE manufacturer IS NOT NULL;
