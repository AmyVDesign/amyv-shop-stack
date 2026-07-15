-- service_role is server-only (admin client: checkout route, Stripe webhooks),
-- bypasses RLS by design, and standard Supabase posture gives it full table
-- access; an earlier hardening pass had stripped these.
--
-- These grants were applied directly to the remote and are recorded here so the
-- migration history stays in sync. Do not re-apply to a database that already
-- has them.

GRANT USAGE ON SCHEMA public TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO service_role;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO service_role;
