-- Grant table privileges so RLS policies can evaluate.
-- Policies filter what each role sees; these grants allow evaluation in the first place.

-- authenticated: full CRUD on all tables, sequences, and functions
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- anon: read-only (RLS policies further restrict to visibility = 'public' rows)
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;

-- Default privileges so future tables automatically inherit these grants
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT ALL ON TABLES TO authenticated;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT ALL ON SEQUENCES TO authenticated;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT EXECUTE ON FUNCTIONS TO authenticated;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT ON TABLES TO anon;
