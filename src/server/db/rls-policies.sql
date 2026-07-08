-- Row-Level Security policies for tenant isolation.
-- Drizzle-kit does not manage RLS DDL, so this file is applied manually (or via
-- a plain SQL migration step) after `drizzle-kit push`/`migrate`.
--
-- Every tenant-scoped table is isolated by colegio_id, compared against the
-- session-local setting `app.current_colegio_id`, which the app sets via
-- `withTenant()` (see src/server/db/client.ts) at the start of each request's
-- transaction. Application code must never rely on a WHERE colegio_id clause
-- alone — RLS is the backstop that holds even if that clause is forgotten.

alter table usuario enable row level security;
alter table usuario force row level security;

create policy usuario_tenant_isolation on usuario
  using (colegio_id = nullif(current_setting('app.current_colegio_id', true), '')::uuid)
  with check (colegio_id = nullif(current_setting('app.current_colegio_id', true), '')::uuid);

alter table persona enable row level security;
alter table persona force row level security;

create policy persona_tenant_isolation on persona
  using (colegio_id = nullif(current_setting('app.current_colegio_id', true), '')::uuid)
  with check (colegio_id = nullif(current_setting('app.current_colegio_id', true), '')::uuid);

-- `colegio` itself is intentionally NOT RLS-scoped here: it is the tenant root,
-- not a tenant-owned row. Cross-tenant listing of `colegio` (e.g. for platform
-- admin tooling) happens through the unscoped `db` client, never `withTenant`.
