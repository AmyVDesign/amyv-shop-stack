alter table products
  add column standalone_listing boolean not null default false;

comment on column products.standalone_listing is
  'When this listing is linked to a parent (linked_listing_id set) and visibility is public, true means this variant gets its own storefront page instead of appearing on the parent product page. Default false = shows as variant on parent. Has no effect for internal/eBay-only listings.';
