-- Atomically decrements qty_for_sale by 1 when stock is available.
-- Returns the product id on success, empty result set if out of stock.
-- SECURITY DEFINER runs as the postgres owner so RLS does not block the UPDATE;
-- the function itself is the guard (only decrements, only when stock >= 1).
CREATE OR REPLACE FUNCTION claim_part(product_id uuid)
RETURNS TABLE (id uuid)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
    UPDATE products
    SET qty_for_sale = qty_for_sale - 1
    WHERE products.id = product_id
      AND qty_for_sale >= 1
    RETURNING products.id;
END;
$$;

COMMENT ON FUNCTION claim_part(uuid) IS
  'Atomically claims one unit for checkout. Returns id on success, empty on out-of-stock. Safe for anon: conditional decrement only, cannot go negative.';

-- Releases a hold created by claim_part.
-- Called on Stripe error, 409 conflict, or (Phase 2) session expiry.
-- Phase 2 webhooks will also call this on Stripe session expiry.
CREATE OR REPLACE FUNCTION release_part(product_id uuid)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE products
  SET qty_for_sale = qty_for_sale + 1
  WHERE products.id = product_id;
END;
$$;

COMMENT ON FUNCTION release_part(uuid) IS
  'Releases a claim created by claim_part. Called on error or timeout. Phase 2 webhooks will handle session expiry.';

GRANT EXECUTE ON FUNCTION claim_part(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION release_part(uuid) TO anon, authenticated;
