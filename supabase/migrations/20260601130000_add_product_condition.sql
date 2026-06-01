-- Add condition enum for product/listing condition
create type product_condition as enum (
  'new',
  'nos',
  'used_good',
  'used_fair',
  'needs_rebuild',
  'parts_only'
);

comment on type product_condition is 'Physical condition of a part listing. NOS = New Old Stock (never used but old).';

alter table products
  add column condition product_condition null;

comment on column products.condition is 'Optional. Physical condition of this specific listing. May be null if unknown or not applicable.';
