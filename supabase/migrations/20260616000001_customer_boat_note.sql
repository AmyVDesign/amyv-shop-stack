-- Add staff-editable boat note to the customers table.
-- Used by staff to record make/model/year/engine for faster parts matching.
-- No new RLS policy needed: the existing staff-all authenticated policy covers this column.

ALTER TABLE customers
  ADD COLUMN IF NOT EXISTS boat_note text;

COMMENT ON COLUMN customers.boat_note
  IS 'Free-form staff note about the customer''s boat (make, model, year, engine, special notes for parts matching).';
