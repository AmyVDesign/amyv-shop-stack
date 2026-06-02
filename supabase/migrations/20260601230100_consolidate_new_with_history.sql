-- Consolidate redundant new variants per canonical product, preserving batch history
-- as inventory_events. Keeper = highest price_cents (tiebreak: oldest created_at).
-- Note: if 20260601220000_consolidate_new_variants.sql already ran, new_groups will
-- be empty and this migration is a safe no-op for the cleanup portion.

begin;

create temp table new_groups as
with keepers as (
  select distinct on (lower(trim(part_number)), lower(trim(manufacturer)))
    id as keeper_id,
    lower(trim(part_number)) as pn_key,
    lower(trim(manufacturer)) as mfr_key
  from products
  where condition = 'new'
    and part_number is not null
    and manufacturer is not null
    and trim(part_number) != ''
    and trim(manufacturer) != ''
  order by
    lower(trim(part_number)),
    lower(trim(manufacturer)),
    price_cents desc,
    created_at asc
)
select k.keeper_id, k.pn_key, k.mfr_key
from keepers k
where (
  select count(*) from products p
  where lower(trim(p.part_number)) = k.pn_key
    and lower(trim(p.manufacturer)) = k.mfr_key
    and p.condition = 'new'
) > 1;

-- Log every existing new row (including the keeper's original qty) as an event
insert into inventory_events (product_id, event_date, qty_on_hand_delta, qty_for_sale_delta, note)
select
  ng.keeper_id,
  p.created_at,
  p.qty_on_hand,
  p.qty_for_sale,
  case
    when p.id = ng.keeper_id then 'Initial inventory (canonical keeper)'
    else 'Migrated from consolidated listing: ' || coalesce(p.sku, p.id::text)
  end
from new_groups ng
join products p
  on lower(trim(p.part_number)) = ng.pn_key
  and lower(trim(p.manufacturer)) = ng.mfr_key
where p.condition = 'new';

-- Update keeper qty to summed totals
update products p
set
  qty_on_hand = totals.total_on_hand,
  qty_for_sale = totals.total_for_sale
from (
  select
    ng.keeper_id,
    sum(p2.qty_on_hand) as total_on_hand,
    sum(p2.qty_for_sale) as total_for_sale
  from new_groups ng
  join products p2
    on lower(trim(p2.part_number)) = ng.pn_key
    and lower(trim(p2.manufacturer)) = ng.mfr_key
  where p2.condition = 'new'
  group by ng.keeper_id
) totals
where p.id = totals.keeper_id;

-- Delete non-keeper new rows
delete from products
where condition = 'new'
  and id in (
    select p.id from products p
    join new_groups ng
      on lower(trim(p.part_number)) = ng.pn_key
      and lower(trim(p.manufacturer)) = ng.mfr_key
    where p.id != ng.keeper_id
  );

drop table new_groups;

commit;
