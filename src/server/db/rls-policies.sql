-- Row-Level Security policies for tenant isolation.
-- Drizzle-kit does not manage RLS DDL, so this file is applied manually (or via
-- a plain SQL migration step) after `drizzle-kit push`/`migrate`. Safe to re-run:
-- every step below is idempotent (enable/force RLS are no-ops if already set,
-- and the policy is dropped and recreated rather than erroring if it exists).
--
-- Every tenant-scoped table is isolated by colegio_id, compared against the
-- session-local setting `app.current_colegio_id`, which the app sets via
-- `withTenant()` (see src/server/db/client.ts) at the start of each request's
-- transaction. Application code must never rely on a WHERE colegio_id clause
-- alone — RLS is the backstop that holds even if that clause is forgotten.
--
-- To add a table in a future phase: add its name to the array below. Nothing
-- else about this file needs to change as long as the table has a colegio_id
-- column with the same semantics as every table listed here.

do $$
declare
  t text;
  policy_name text;
begin
  foreach t in array array[
    'usuario',
    'persona',
    'profesor',
    'apoderado',
    'anio_escolar',
    'curso',
    'alumno',
    'apoderado_alumno',
    'matricula'
  ]
  loop
    policy_name := t || '_tenant_isolation';
    execute format('alter table %I enable row level security', t);
    execute format('alter table %I force row level security', t);
    execute format('drop policy if exists %I on %I', policy_name, t);
    execute format(
      'create policy %I on %I using (colegio_id = nullif(current_setting(''app.current_colegio_id'', true), '''')::uuid) with check (colegio_id = nullif(current_setting(''app.current_colegio_id'', true), '''')::uuid)',
      policy_name, t
    );
  end loop;
end
$$;

-- `colegio` itself is intentionally NOT RLS-scoped here: it is the tenant root,
-- not a tenant-owned row. Cross-tenant listing of `colegio` (e.g. for platform
-- admin tooling, or the dev session switcher) happens through the unscoped
-- `db` client, never `withTenant`.
