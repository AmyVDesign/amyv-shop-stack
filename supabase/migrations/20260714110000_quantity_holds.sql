-- Drop single-unit functions; replaced by quantity-aware variants below.
DROP FUNCTION IF EXISTS claim_part(uuid);
DROP FUNCTION IF EXISTS release_part(uuid);

-- Atomically claims qty units. Returns 1 if the row was updated, 0 otherwise
-- (insufficient stock, bad product_id, or qty < 1). All-or-nothing per product;
-- never partial, never negative.
CREATE FUNCTION claim_parts(product_id uuid, qty int)
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  rows_updated int;
BEGIN
  IF qty < 1 THEN RETURN 0; END IF;
  UPDATE products
  SET qty_for_sale = qty_for_sale - qty
  WHERE products.id = product_id
    AND qty_for_sale >= qty;
  GET DIAGNOSTICS rows_updated = ROW_COUNT;
  RETURN rows_updated;
END;
$$;

COMMENT ON FUNCTION claim_parts(uuid, int) IS
  'Atomically claims qty units for checkout. Returns 1 on success, 0 on insufficient stock. All-or-nothing, never partial. Service-role only; called exclusively by the server checkout route.';

-- Releases qty units back to stock. Called on checkout error or session expiry.
-- Raises if qty < 1 to surface bugs in callers.
CREATE FUNCTION release_parts(product_id uuid, qty int)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF qty < 1 THEN
    RAISE EXCEPTION 'release_parts: qty must be >= 1 (got %)', qty;
  END IF;
  UPDATE products
  SET qty_for_sale = qty_for_sale + qty
  WHERE products.id = product_id;
END;
$$;

COMMENT ON FUNCTION release_parts(uuid, int) IS
  'Releases a hold created by claim_parts. Raises if qty < 1. Called on checkout error or timeout. Service-role only; called exclusively by the server checkout route. Phase 2 webhooks will handle session expiry.';

REVOKE EXECUTE ON FUNCTION claim_parts(uuid, int) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION release_parts(uuid, int) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION claim_parts(uuid, int) TO service_role;
GRANT EXECUTE ON FUNCTION release_parts(uuid, int) TO service_role;
