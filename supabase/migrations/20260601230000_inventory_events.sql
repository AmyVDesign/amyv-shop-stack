create table inventory_events (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  event_date timestamptz not null default now(),
  qty_on_hand_delta int not null,
  qty_for_sale_delta int not null,
  note text null,
  created_at timestamptz not null default now()
);

create index inventory_events_product_id_idx on inventory_events(product_id);
create index inventory_events_event_date_idx on inventory_events(event_date desc);

alter table inventory_events enable row level security;

create policy "Authenticated users can view inventory events"
  on inventory_events for select to authenticated using (true);

create policy "Authenticated users can insert inventory events"
  on inventory_events for insert to authenticated with check (true);

grant select, insert on inventory_events to authenticated;

comment on table inventory_events is
  'Append-only log of inventory additions and adjustments per product. Used to track batch history for new condition consolidated listings.';
