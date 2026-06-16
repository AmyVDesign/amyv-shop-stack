-- Append-only audit log for customer contact edits.
-- Records each logical field change with old/new values and the staff member who made it.
-- No UPDATE or DELETE policy: rows are immutable once written.

CREATE TABLE customer_changes (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_phone text       NOT NULL REFERENCES customers(phone) ON DELETE CASCADE,
  field         text        NOT NULL,
  old_value     text,
  new_value     text,
  changed_by    text,
  changed_at    timestamptz NOT NULL DEFAULT now()
);

COMMENT ON COLUMN customer_changes.id             IS 'Unique identifier for this change event.';
COMMENT ON COLUMN customer_changes.customer_phone IS 'Customer this change belongs to; cascades on customer delete.';
COMMENT ON COLUMN customer_changes.field          IS 'Logical field that changed: "Name", "Email", "Boat", "Address".';
COMMENT ON COLUMN customer_changes.old_value      IS 'Value before the change. NULL when the field was previously empty.';
COMMENT ON COLUMN customer_changes.new_value      IS 'Value after the change. NULL when the field was cleared.';
COMMENT ON COLUMN customer_changes.changed_by     IS 'Email of the staff member who made the change.';
COMMENT ON COLUMN customer_changes.changed_at     IS 'Timestamp when the change was recorded.';

ALTER TABLE customer_changes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "staff select customer_changes"
  ON customer_changes FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "staff insert customer_changes"
  ON customer_changes FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE INDEX customer_changes_phone_at_idx
  ON customer_changes (customer_phone, changed_at DESC);
