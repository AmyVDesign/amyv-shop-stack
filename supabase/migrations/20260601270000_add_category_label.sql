ALTER TABLE products ADD COLUMN category_label text NULL;

COMMENT ON COLUMN products.category_label IS 'User-facing curated marine category label (e.g. "Marine Oil Filters"). Backs the browsable storefront taxonomy. google_category_id/path remain for Shopping feed compatibility.';
