ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS stripe_session_id text;

COMMENT ON COLUMN orders.stripe_session_id IS
  'Idempotency key for webhook order creation. Set when an order is created from a Stripe checkout.session.completed event. Null for orders created through other channels.';

-- Allows multiple NULLs (Postgres standard for unique indexes) so admin-created
-- orders without a Stripe session can coexist.
CREATE UNIQUE INDEX IF NOT EXISTS orders_stripe_session_id_key
  ON orders (stripe_session_id);
