-- =============================================================================
-- DEV SEED: fake customers for testing the customer profile screen
-- =============================================================================
-- NOT a migration. Safe to remove at any time.
-- Apply manually:
--   pnpm --filter @amyv/supabase exec supabase db execute --file supabase/seeds/dev_customers.sql
-- Or paste directly into the Supabase SQL editor.
--
-- All seed phones are in the +1315555xxxx range for easy identification.
-- Teardown snippet is at the bottom of this file.
-- =============================================================================

BEGIN;

-- ── 1. Remove any previous run of this seed ──────────────────────────────────
DELETE FROM order_items
  WHERE order_id IN (
    SELECT id FROM orders WHERE customer_phone LIKE '+1315555%'
  );
DELETE FROM customer_tasks WHERE customer_phone LIKE '+1315555%';
DELETE FROM orders        WHERE customer_phone LIKE '+1315555%';
DELETE FROM customers     WHERE phone          LIKE '+1315555%';


-- ── 2. Customers ──────────────────────────────────────────────────────────────

INSERT INTO customers
  (phone, first_name, last_name, email, address_line_1, city, state, postal_code, country)
VALUES
  -- Full contact info
  ( '+13155550101', 'Ron',    'Castellano',
    'ron.castellano@sunfish-marina.com',
    '47 Dock Lane', 'Oswego', 'NY', '13126', 'US' ),
  -- Email + city only
  ( '+13155550102', 'Diana',  'Ferrero',
    'dferrero@lakeview-service.net',
    '8 Harbor View Rd', 'Sackets Harbor', 'NY', '13147', 'US' ),
  -- Full contact, no tasks
  ( '+13155550103', 'Bill',   'Marsh',
    'wmarsh55@gmail.com',
    '113 State Route 3', 'Pulaski', 'NY', '13142', 'US' ),
  -- Sparse: no email, no address, no orders -- exercises empty states
  ( '+13155550104', 'Marcus', 'Guzman',
    NULL, NULL, NULL, NULL, NULL, 'US' );


-- ── 3. Orders ────────────────────────────────────────────────────────────────
-- UUIDs use the a1000000-... prefix so they are easy to spot in logs.

-- Ron -- Order 1: two-item, fully synced to QB (oldest)
INSERT INTO orders
  (id, customer_phone, subtotal_cents, tax_cents, shipping_cents, total_cents, qb_status, created_at)
VALUES (
  'a1000000-0000-0000-0000-000000000001',
  '+13155550101',
  7445, 596, 895, 8936,
  'pushed_to_qb',
  now() - interval '45 days'
);

INSERT INTO order_items
  (order_id, product_id, quantity, unit_price_cents, product_snapshot)
VALUES
  ( 'a1000000-0000-0000-0000-000000000001', NULL, 1, 4595,
    '{"title":"Jabsco Impeller Kit 18753-0001","sku":"JBS-18753-0001","part_number":"18753-0001","vendor":"Jabsco","condition":"new","price_cents":4595}' ),
  ( 'a1000000-0000-0000-0000-000000000001', NULL, 1, 2850,
    '{"title":"Johnson Pump Impeller F35B-9","sku":"JPN-F35B9","part_number":"F35B-9","vendor":"Johnson Pump","condition":"new","price_cents":2850}' );


-- Ron -- Order 2: single-item fuel pump, approved for QB
INSERT INTO orders
  (id, customer_phone, subtotal_cents, tax_cents, shipping_cents, total_cents, qb_status, created_at)
VALUES (
  'a1000000-0000-0000-0000-000000000002',
  '+13155550101',
  8995, 720, 1200, 10915,
  'approved_for_qb',
  now() - interval '18 days'
);

INSERT INTO order_items
  (order_id, product_id, quantity, unit_price_cents, product_snapshot)
VALUES
  ( 'a1000000-0000-0000-0000-000000000002', NULL, 1, 8995,
    '{"title":"Carter P4070 Marine Fuel Pump","sku":"CTR-P4070","part_number":"P4070","vendor":"Carter","condition":"new","price_cents":8995}' );


-- Ron -- Order 3: three-item Onan parts order, pending review (newest)
-- subtotal: 18750 + 14200 + (1448 * 2) = 35846
INSERT INTO orders
  (id, customer_phone, subtotal_cents, tax_cents, shipping_cents, total_cents, qb_status, created_at)
VALUES (
  'a1000000-0000-0000-0000-000000000003',
  '+13155550101',
  35846, 2868, 0, 38714,
  'pending_mom_review',
  now() - interval '3 days'
);

INSERT INTO order_items
  (order_id, product_id, quantity, unit_price_cents, product_snapshot)
VALUES
  ( 'a1000000-0000-0000-0000-000000000003', NULL, 1, 18750,
    '{"title":"Onan 122-0836 Carburetor MDKD","sku":"ONN-122-0836","part_number":"122-0836","vendor":"Onan / Cummins","condition":"new","price_cents":18750}' ),
  ( 'a1000000-0000-0000-0000-000000000003', NULL, 1, 14200,
    '{"title":"Onan A034F955 Generator Control Board","sku":"ONN-A034F955","part_number":"A034F955","vendor":"Onan / Cummins","condition":"used_good","price_cents":14200}' ),
  ( 'a1000000-0000-0000-0000-000000000003', NULL, 2, 1448,
    '{"title":"Onan 149-2362 Air Filter Element","sku":"ONN-149-2362","part_number":"149-2362","vendor":"Onan / Cummins","condition":"new","price_cents":1448}' );


-- Diana -- Order: single Sierra fuel pump, approved for QB
INSERT INTO orders
  (id, customer_phone, subtotal_cents, tax_cents, shipping_cents, total_cents, qb_status, created_at)
VALUES (
  'a1000000-0000-0000-0000-000000000004',
  '+13155550102',
  6700, 536, 895, 8131,
  'approved_for_qb',
  now() - interval '7 days'
);

INSERT INTO order_items
  (order_id, product_id, quantity, unit_price_cents, product_snapshot)
VALUES
  ( 'a1000000-0000-0000-0000-000000000004', NULL, 1, 6700,
    '{"title":"Sierra 18-7350 Mechanical Fuel Pump","sku":"SRR-18-7350","part_number":"18-7350","vendor":"Sierra","condition":"new","price_cents":6700}' );


-- Bill -- Order 1: Volvo Penta water pump kit, fully synced
INSERT INTO orders
  (id, customer_phone, subtotal_cents, tax_cents, shipping_cents, total_cents, qb_status, created_at)
VALUES (
  'a1000000-0000-0000-0000-000000000005',
  '+13155550103',
  15600, 1248, 1200, 18048,
  'pushed_to_qb',
  now() - interval '30 days'
);

INSERT INTO order_items
  (order_id, product_id, quantity, unit_price_cents, product_snapshot)
VALUES
  ( 'a1000000-0000-0000-0000-000000000005', NULL, 1, 15600,
    '{"title":"Volvo Penta 3860227 Raw Water Pump Kit","sku":"VP-3860227","part_number":"3860227","vendor":"Volvo Penta","condition":"new","price_cents":15600}' );


-- Bill -- Order 2: Mercruiser gasket set, pending review (newest)
INSERT INTO orders
  (id, customer_phone, subtotal_cents, tax_cents, shipping_cents, total_cents, qb_status, created_at)
VALUES (
  'a1000000-0000-0000-0000-000000000006',
  '+13155550103',
  3895, 312, 895, 5102,
  'pending_mom_review',
  now() - interval '5 days'
);

INSERT INTO order_items
  (order_id, product_id, quantity, unit_price_cents, product_snapshot)
VALUES
  ( 'a1000000-0000-0000-0000-000000000006', NULL, 1, 3895,
    '{"title":"Mercruiser Alpha One Gasket Set 27-97253A1","sku":"MCR-27-97253A1","part_number":"27-97253A1","vendor":"Mercury Marine","condition":"new","price_cents":3895}' );


-- ── 4. Customer tasks ─────────────────────────────────────────────────────────

-- Ron: two open tasks
INSERT INTO customer_tasks
  (customer_phone, type, body, status, created_by, created_at)
VALUES
  ( '+13155550101', 'call_back',
    'Confirm shipping address before the Onan order ships. He has a new slip at Oswego Marina starting July.',
    'open', 'admin@esskayyards.com', now() - interval '2 days' ),
  ( '+13155550101', 'follow_up',
    'Check whether the Onan carburetor resolved the surging issue he described. Intermittent at idle.',
    'open', 'admin@esskayyards.com', now() - interval '1 day' );

-- Ron: one completed task
INSERT INTO customer_tasks
  (customer_phone, type, body, status, created_by, created_at, completed_at)
VALUES
  ( '+13155550101', 'refund',
    'Duplicate charge on first order from a gateway retry. Issued $89.95 credit to the card on file.',
    'done', 'admin@esskayyards.com',
    now() - interval '40 days', now() - interval '39 days' );

-- Diana: one open task
INSERT INTO customer_tasks
  (customer_phone, type, body, status, created_by, created_at)
VALUES
  ( '+13155550102', 'order_issue',
    'Fuel pump arrived with a cracked inlet fitting. Customer sent photo. Arrange replacement or refund.',
    'open', 'admin@esskayyards.com', now() - interval '2 days' );

COMMIT;


-- =============================================================================
-- TEARDOWN -- copy-paste this block to remove all seed data cleanly
-- =============================================================================
-- BEGIN;
-- DELETE FROM order_items
--   WHERE order_id IN (
--     SELECT id FROM orders WHERE customer_phone LIKE '+1315555%'
--   );
-- DELETE FROM customer_tasks WHERE customer_phone LIKE '+1315555%';
-- DELETE FROM orders        WHERE customer_phone LIKE '+1315555%';
-- DELETE FROM customers     WHERE phone          LIKE '+1315555%';
-- COMMIT;
