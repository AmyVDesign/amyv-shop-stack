-- Add indexes and column comments for product categorization fields.
-- Columns were added in 20260601240000; these complete the schema.

CREATE INDEX products_google_category_id_idx ON products(google_category_id);
CREATE INDEX products_product_type_idx ON products(product_type);

COMMENT ON COLUMN products.google_category_id IS 'Google Product Taxonomy ID, e.g. 888 for Watercraft Parts & Accessories. Used for Google Shopping feeds and SEO.';
COMMENT ON COLUMN products.google_category_path IS 'Full hierarchical category path, e.g. "Vehicles & Parts > Vehicle Parts & Accessories > Watercraft Parts & Accessories".';
COMMENT ON COLUMN products.product_type IS 'Store-specific descriptor (e.g. "Lube Oil Filter Element", "Nautical Chart"). More granular than Google category.';
