alter table products
  add constraint products_no_self_link check (id != linked_listing_id);
