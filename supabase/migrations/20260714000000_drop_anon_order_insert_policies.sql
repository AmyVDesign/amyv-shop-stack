-- Drop unused guest-checkout insert policies.
-- Checkout is not yet built; when it is, order writes will go through a
-- service-role Stripe webhook handler, not anon RLS inserts.
DROP POLICY orders_anon_insert ON orders;
DROP POLICY order_items_anon_insert ON order_items;
