import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import * as schema from "../src/server/db/schema";

// This suite is the load-bearing proof that Row-Level Security, not
// application-level WHERE clauses, is what keeps one colegio's data from
// leaking into another's. It talks to its own dedicated test database via
// TWO roles on purpose:
//   - ownerSql: the table-owning/superuser role (TEST_DATABASE_URL), used only
//     to seed cross-tenant fixtures and as a control to prove fixtures really
//     span two tenants.
//   - appSql: the restricted, non-owner role (TEST_APP_DATABASE_URL) that the
//     real app connects as — RLS only takes effect for a role that is neither
//     superuser nor table owner, so this suite must exercise that exact role.
const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL;
const TEST_APP_DATABASE_URL = process.env.TEST_APP_DATABASE_URL;

if (!TEST_DATABASE_URL || !TEST_APP_DATABASE_URL) {
  throw new Error("TEST_DATABASE_URL and TEST_APP_DATABASE_URL must be set to run tenant-isolation tests");
}

const ownerSql = postgres(TEST_DATABASE_URL);
const ownerDb = drizzle(ownerSql, { schema });
const appSql = postgres(TEST_APP_DATABASE_URL);
const appDb = drizzle(appSql, { schema });

type Tx = Parameters<Parameters<typeof appDb.transaction>[0]>[0];

async function withTenant<T>(colegioId: string, fn: (tx: Tx) => Promise<T>): Promise<T> {
  return appDb.transaction(async (tx) => {
    await tx.execute(sql`select set_config('app.current_colegio_id', ${colegioId}, true)`);
    return fn(tx);
  });
}

let colegioAId: string;
let colegioBId: string;

beforeAll(async () => {
  await ownerSql`delete from persona`;
  await ownerSql`delete from usuario`;
  await ownerSql`delete from colegio`;

  const [colegioA] = await ownerDb.insert(schema.colegio).values({ nombre: "Colegio A" }).returning();
  const [colegioB] = await ownerDb.insert(schema.colegio).values({ nombre: "Colegio B" }).returning();
  colegioAId = colegioA.id;
  colegioBId = colegioB.id;

  await withTenant(colegioAId, (tx) =>
    tx.insert(schema.persona).values({
      colegioId: colegioAId,
      rut: "111111111",
      nombres: "Alumno",
      apellidos: "DelColegioA",
    })
  );
  await withTenant(colegioBId, (tx) =>
    tx.insert(schema.persona).values({
      colegioId: colegioBId,
      rut: "222222222",
      nombres: "Alumno",
      apellidos: "DelColegioB",
    })
  );
});

afterAll(async () => {
  await ownerSql.end();
  await appSql.end();
});

describe("tenant isolation (RLS)", () => {
  it("fixtures genuinely span two distinct tenants (control check)", async () => {
    const rows = await ownerSql`select colegio_id from persona`;
    const distinctTenants = new Set(rows.map((r) => r.colegio_id));
    expect(distinctTenants.size).toBe(2);
  });

  it("a session scoped to colegio A only ever sees colegio A's rows", async () => {
    const rows = await withTenant(colegioAId, (tx) => tx.select().from(schema.persona));
    expect(rows).toHaveLength(1);
    expect(rows[0].colegioId).toBe(colegioAId);
  });

  it("a session scoped to colegio B only ever sees colegio B's rows", async () => {
    const rows = await withTenant(colegioBId, (tx) => tx.select().from(schema.persona));
    expect(rows).toHaveLength(1);
    expect(rows[0].colegioId).toBe(colegioBId);
  });

  it("rejects inserting a row tagged for a different tenant than the active session", async () => {
    await expect(
      withTenant(colegioAId, (tx) =>
        tx.insert(schema.persona).values({
          colegioId: colegioBId,
          rut: "333333333",
          nombres: "Intento",
          apellidos: "CrossTenant",
        })
      )
    ).rejects.toThrow();
  });

  it("fails closed: no rows are visible when no tenant session is set", async () => {
    const rows = await appSql`select * from persona`;
    expect(rows).toHaveLength(0);
  });
});
