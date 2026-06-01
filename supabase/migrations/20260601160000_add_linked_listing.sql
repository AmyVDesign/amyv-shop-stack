alter table products
  add column linked_listing_id uuid null references products(id) on delete set null;

comment on column products.linked_listing_id is 'If set, this listing displays as a variant of the referenced product on its public product page. If null, this listing has its own standalone public page. Only meaningful when visibility = public.';

create index idx_products_linked_listing on products(linked_listing_id) where linked_listing_id is not null;
