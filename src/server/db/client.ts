import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

if (!process.env.APP_DATABASE_URL) {
  throw new Error("APP_DATABASE_URL is not set");
}

// Deliberately APP_DATABASE_URL, not DATABASE_URL: the app must connect as a
// non-superuser role that does not own the tables, otherwise Postgres bypasses
// RLS entirely and tenant isolation silently stops being enforced.
const queryClient = postgres(process.env.APP_DATABASE_URL);

/**
 * Connected as the restricted app role but with no `app.current_colegio_id`
 * set, so every RLS-scoped table reads as empty (fail closed). Only safe to
 * use directly for tables that are not tenant-scoped (e.g. `colegio`) — for
 * anything else, go through `withTenant`.
 */
export const db = drizzle(queryClient, { schema });

/**
 * Runs `fn` inside a transaction with `app.current_colegio_id` set for the session,
 * so every RLS policy scoped to that setting applies for the duration of `fn`.
 * This is the only way application code should read/write tenant data.
 */
type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

export async function withTenant<T>(colegioId: string, fn: (tx: Tx) => Promise<T>): Promise<T> {
  return db.transaction(async (tx) => {
    await tx.execute(sql`select set_config('app.current_colegio_id', ${colegioId}, true)`);
    return fn(tx);
  });
}
