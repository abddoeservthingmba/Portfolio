-- Closes the public schema to Supabase's auto-generated REST API.
--
-- WHY THIS IS NEEDED
--
-- Supabase exposes every table in `public` through PostgREST, and its default
-- grants give the `anon` and `authenticated` roles full DML on them. The anon
-- key that authorises those roles is compiled into the browser bundle — it is
-- public by design (see apps/web/src/lib/supabase.ts). Without row level
-- security, anyone holding that key could read the contact inbox, the user
-- table and unpublished projects with a single GET.
--
-- WHY DENY-ALL IS THE RIGHT POLICY SET
--
-- The browser uses Supabase for exactly one thing: signing the administrator
-- in. It never queries data. Every read and write goes through the Express API,
-- which owns validation, authorisation and the service-role key. So no role
-- reachable from a browser needs any access here, and the correct policy set is
-- the empty one: RLS enabled, no policies, everything denied.
--
-- WHY THIS DOES NOT BREAK THE API
--
-- Prisma connects as the role that owns these tables, and Postgres exempts a
-- table's owner from its policies. Note the deliberate absence of FORCE ROW
-- LEVEL SECURITY below — adding it would extend RLS to the owner as well and
-- would take the entire API offline against an empty policy set.

ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "projects" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "skills" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "project_skills" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "experience" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "certifications" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "education" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "messages" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "resume_versions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "site_settings" ENABLE ROW LEVEL SECURITY;

-- Prisma's own bookkeeping table. It carries no personal data, but it maps the
-- schema's history and there is no reason for it to be readable either. Safe to
-- alter from inside a migration: the statement runs on the same connection that
-- already holds this migration's row, so it cannot block on itself.
ALTER TABLE "_prisma_migrations" ENABLE ROW LEVEL SECURITY;

-- Belt and braces. RLS alone is sufficient, but removing the grants means a
-- future policy added by mistake still has nothing to act on, and PostgREST
-- fails at the permission check rather than silently returning an empty set —
-- a much louder signal if this boundary is ever crossed by accident.
REVOKE ALL ON ALL TABLES IN SCHEMA "public" FROM anon, authenticated;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA "public" FROM anon, authenticated;

-- The same treatment for tables that do not exist yet. Supabase installs
-- default privileges that grant every new table in `public` to anon and
-- authenticated, so without this the next migration silently reopens the hole.
--
-- Wrapped because ALTER DEFAULT PRIVILEGES FOR ROLE requires membership of that
-- role. If the migration credential is not a member of `postgres`, this is a
-- no-op rather than a failed deploy — the ALTER TABLE statements above have
-- already done the load-bearing work, and the README records the follow-up.
DO $$
BEGIN
  ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA "public"
    REVOKE ALL ON TABLES FROM anon, authenticated;
  ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA "public"
    REVOKE ALL ON SEQUENCES FROM anon, authenticated;
EXCEPTION
  WHEN insufficient_privilege OR undefined_object THEN
    RAISE NOTICE 'Default privileges left unchanged: the migration role cannot alter them for "postgres". New tables must have RLS enabled explicitly.';
END
$$;
