-- =============================================================================
-- Phase 1.2 — Ess-Kay Yards Marina: Initial Schema
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Extensions
-- -----------------------------------------------------------------------------

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- -----------------------------------------------------------------------------
-- Enums
-- -----------------------------------------------------------------------------

CREATE TYPE product_visibility AS ENUM ('public', 'internal', 'wholesale', 'ebay_only');
CREATE TYPE product_source AS ENUM ('manual', 'shopify_import', 'sheets_import');
CREATE TYPE qb_status AS ENUM ('pending_mom_review', 'approved_for_qb', 'pushed_to_qb');
CREATE TYPE inventory_movement_reason AS ENUM ('sale', 'return', 'manual_adjustment', 'migration', 'damaged', 'found_in_stock');

-- -----------------------------------------------------------------------------
-- Tables
-- -----------------------------------------------------------------------------

CREATE TABLE products (
  id                  uuid             PRIMARY KEY DEFAULT gen_random_uuid(),
  sku                 text             UNIQUE NOT NULL,
  part_number         text,
  manufacturer        text,
  title               text             NOT NULL,
  description         text,
  slug                text             UNIQUE NOT NULL,
  price_cents         integer          NOT NULL CHECK (price_cents >= 0),
  qty_on_hand         integer          NOT NULL DEFAULT 0 CHECK (qty_on_hand >= 0),
  qty_for_sale        integer          NOT NULL DEFAULT 0 CHECK (qty_for_sale >= 0 AND qty_for_sale <= qty_on_hand),
  visibility          product_visibility NOT NULL DEFAULT 'internal',
  acquired_date       date,
  compatibility       text[]           NOT NULL DEFAULT '{}',
  compatibility_likely text[]          NOT NULL DEFAULT '{}',
  photo_urls          text[]           NOT NULL DEFAULT '{}',
  source              product_source   NOT NULL DEFAULT 'manual',
  source_ref          text,
  created_at          timestamptz      NOT NULL DEFAULT now(),
  updated_at          timestamptz      NOT NULL DEFAULT now()
);

-- phone is the PRIMARY KEY (E.164 format, normalized by app layer via libphonenumber).
-- Walk-in customers without email still get a record.
CREATE TABLE customers (
  phone          text        PRIMARY KEY CHECK (length(phone) BETWEEN 8 AND 20),
  email          text,
  first_name     text,
  last_name      text,
  address_line_1 text,
  address_line_2 text,
  city           text,
  state          text,
  postal_code    text,
  country        text        DEFAULT 'US',
  notes          text,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE wholesale_partners (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name          text        UNIQUE NOT NULL,
  contact_email text,
  contact_phone text,
  notes         text,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE wholesale_allocations (
  id                  uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id          uuid    NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  partner_id          uuid    NOT NULL REFERENCES wholesale_partners(id) ON DELETE CASCADE,
  allocated_qty       integer NOT NULL CHECK (allocated_qty >= 0),
  partner_price_cents integer CHECK (partner_price_cents >= 0),
  UNIQUE (product_id, partner_id),
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE orders (
  id                       uuid       PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_phone           text       REFERENCES customers(phone) ON DELETE RESTRICT,
  subtotal_cents           integer    NOT NULL DEFAULT 0,
  tax_cents                integer    NOT NULL DEFAULT 0,
  shipping_cents           integer    NOT NULL DEFAULT 0,
  total_cents              integer    NOT NULL DEFAULT 0,
  qb_status                qb_status  NOT NULL DEFAULT 'pending_mom_review',
  qb_invoice_id            text,
  qb_pushed_at             timestamptz,
  qb_push_error            text,
  notes                    text,
  stripe_payment_intent_id text       UNIQUE,
  created_at               timestamptz NOT NULL DEFAULT now(),
  updated_at               timestamptz NOT NULL DEFAULT now()
);

-- product_snapshot captures the product state at sale time so receipts stay accurate forever.
CREATE TABLE order_items (
  id               uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id         uuid    NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id       uuid    REFERENCES products(id) ON DELETE SET NULL,
  quantity         integer NOT NULL CHECK (quantity > 0),
  unit_price_cents integer NOT NULL CHECK (unit_price_cents >= 0),
  product_snapshot jsonb   NOT NULL
);

CREATE TABLE parts_watch_list (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_phone text        REFERENCES customers(phone) ON DELETE SET NULL,
  part_description text      NOT NULL,
  part_number    text,
  manufacturer   text,
  sourcing_notes text,
  status         text        NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'sourced', 'cancelled')),
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);

-- Immutable audit trail: every quantity change logged with reason, actor, and timestamp.
-- No updated_at — movements are never modified after creation.
CREATE TABLE inventory_movements (
  id         uuid                     PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid                     NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  delta      integer                  NOT NULL,
  reason     inventory_movement_reason NOT NULL,
  actor_id   uuid                     REFERENCES auth.users(id) ON DELETE SET NULL,
  notes      text,
  order_id   uuid                     REFERENCES orders(id) ON DELETE SET NULL,
  created_at timestamptz              NOT NULL DEFAULT now()
);

-- -----------------------------------------------------------------------------
-- Multi-channel inventory trigger (CRITICAL)
-- Per Section 6: sum of (qty_for_sale + all wholesale allocations + ebay_held)
-- must never exceed qty_on_hand.
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION enforce_inventory_invariant()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  v_product_id     uuid;
  v_sku            text;
  v_qty_on_hand    integer;
  v_qty_for_sale   integer;
  v_wholesale_total integer;
BEGIN
  IF TG_TABLE_NAME = 'products' THEN
    -- Use values directly from the NEW row (already reflects the pending change).
    v_product_id   := NEW.id;
    v_sku          := NEW.sku;
    v_qty_on_hand  := NEW.qty_on_hand;
    v_qty_for_sale := NEW.qty_for_sale;
  ELSE
    -- wholesale_allocations: look up the current product state.
    v_product_id := NEW.product_id;
    SELECT sku, qty_on_hand, qty_for_sale
      INTO v_sku, v_qty_on_hand, v_qty_for_sale
      FROM products
      WHERE id = v_product_id;
  END IF;

  -- Sum all wholesale allocations for this product (includes the NEW row for AFTER triggers).
  SELECT COALESCE(SUM(allocated_qty), 0)
    INTO v_wholesale_total
    FROM wholesale_allocations
    WHERE product_id = v_product_id;

  -- ebay_held is reserved for a future column; add to this sum when implemented.
  IF (v_qty_for_sale + v_wholesale_total) > v_qty_on_hand THEN
    RAISE EXCEPTION
      'Inventory invariant violated for product %: claimed (qty_for_sale=% + wholesale=%) exceeds qty_on_hand=%',
      v_sku, v_qty_for_sale, v_wholesale_total, v_qty_on_hand;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER enforce_inventory_invariant_products
  AFTER INSERT OR UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION enforce_inventory_invariant();

CREATE TRIGGER enforce_inventory_invariant_wholesale_allocations
  AFTER INSERT OR UPDATE ON wholesale_allocations
  FOR EACH ROW EXECUTE FUNCTION enforce_inventory_invariant();

-- -----------------------------------------------------------------------------
-- updated_at trigger
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_updated_at_products
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER set_updated_at_customers
  BEFORE UPDATE ON customers
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER set_updated_at_wholesale_partners
  BEFORE UPDATE ON wholesale_partners
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER set_updated_at_wholesale_allocations
  BEFORE UPDATE ON wholesale_allocations
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER set_updated_at_orders
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER set_updated_at_parts_watch_list
  BEFORE UPDATE ON parts_watch_list
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- -----------------------------------------------------------------------------
-- Indexes
-- -----------------------------------------------------------------------------

-- products
CREATE INDEX ON products (visibility);
CREATE INDEX ON products (manufacturer);
CREATE INDEX ON products (part_number);
CREATE INDEX ON products (created_at);
-- sku and slug are already indexed via UNIQUE constraints

-- orders
CREATE INDEX ON orders (qb_status);
CREATE INDEX ON orders (customer_phone);
CREATE INDEX ON orders (created_at);
-- stripe_payment_intent_id is already indexed via UNIQUE constraint

-- order_items
CREATE INDEX ON order_items (order_id);
CREATE INDEX ON order_items (product_id);

-- customers
CREATE INDEX ON customers (email) WHERE email IS NOT NULL;

-- inventory_movements
CREATE INDEX ON inventory_movements (product_id);
CREATE INDEX ON inventory_movements (created_at);

-- parts_watch_list
CREATE INDEX ON parts_watch_list (status);
CREATE INDEX ON parts_watch_list (customer_phone);

-- wholesale_allocations
CREATE INDEX ON wholesale_allocations (partner_id);
CREATE INDEX ON wholesale_allocations (product_id);

-- -----------------------------------------------------------------------------
-- Row Level Security
-- -----------------------------------------------------------------------------

ALTER TABLE products             ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers            ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders               ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items          ENABLE ROW LEVEL SECURITY;
ALTER TABLE wholesale_partners   ENABLE ROW LEVEL SECURITY;
ALTER TABLE wholesale_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE parts_watch_list     ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_movements  ENABLE ROW LEVEL SECURITY;

-- products —————————————————————————————————————————————————————————————————

-- Public website (anon) can only browse products that are explicitly marked public.
-- Internal, wholesale, and ebay_only items are never exposed to unauthenticated requests.
CREATE POLICY products_public_select ON products
  FOR SELECT TO anon
  USING (visibility = 'public');

-- Staff (authenticated) have full CRUD access to all products.
CREATE POLICY products_staff_all ON products
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

-- customers ————————————————————————————————————————————————————————————————

-- Customers table is staff-only; anon has no access.
-- Walk-in records are always created server-side by staff.
CREATE POLICY customers_staff_all ON customers
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

-- orders ———————————————————————————————————————————————————————————————————

-- Anon can insert an order for guest checkout but cannot read, update, or delete orders.
CREATE POLICY orders_anon_insert ON orders
  FOR INSERT TO anon
  WITH CHECK (true);

-- Staff have full CRUD access to all orders.
CREATE POLICY orders_staff_all ON orders
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

-- order_items ——————————————————————————————————————————————————————————————

-- Anon can insert order items alongside a guest checkout order.
CREATE POLICY order_items_anon_insert ON order_items
  FOR INSERT TO anon
  WITH CHECK (true);

-- Staff have full CRUD access to all order items.
CREATE POLICY order_items_staff_all ON order_items
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

-- wholesale_partners ———————————————————————————————————————————————————————

-- Wholesale partner records are staff-only; no public exposure.
CREATE POLICY wholesale_partners_staff_all ON wholesale_partners
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

-- wholesale_allocations ————————————————————————————————————————————————————

-- Wholesale allocation details are staff-only.
CREATE POLICY wholesale_allocations_staff_all ON wholesale_allocations
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

-- parts_watch_list —————————————————————————————————————————————————————————

-- Anon can submit a parts watch request (INSERT only).
-- They cannot see or modify existing requests.
CREATE POLICY parts_watch_list_anon_insert ON parts_watch_list
  FOR INSERT TO anon
  WITH CHECK (true);

-- Staff have full CRUD access to all watch list entries.
CREATE POLICY parts_watch_list_staff_all ON parts_watch_list
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

-- inventory_movements ——————————————————————————————————————————————————————

-- Inventory movements are an internal audit trail; staff-only.
CREATE POLICY inventory_movements_staff_all ON inventory_movements
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);
