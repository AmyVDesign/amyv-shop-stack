alter table products
  add column condition_notes text null;

comment on column products.condition_notes is
  'Per-listing condition details for non-new items (e.g. minor patina, missing hardware). Distinct from description which is the canonical product description.';
