import { sql } from "drizzle-orm";
import { boolean, date, jsonb, pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const rolEnum = pgEnum("rol", ["admin", "profesor", "alumno", "apoderado"]);

/** Tenant root. Not RLS-scoped itself — everything else hangs off colegio_id. */
export const colegio = pgTable("colegio", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  nombre: text("nombre").notNull(),
  rbd: text("rbd"),
  razonSocial: text("razon_social"),
  plan: text("plan").notNull().default("piloto"),
  activo: boolean("activo").notNull().default(true),
  configuracion: jsonb("configuracion").notNull().default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/** Identity + role binding for a tenant member. Source of truth for rol/colegio_id, not just Supabase auth.users. */
export const usuario = pgTable("usuario", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  colegioId: uuid("colegio_id")
    .notNull()
    .references(() => colegio.id, { onDelete: "cascade" }),
  authUserId: uuid("auth_user_id").notNull(),
  rol: rolEnum("rol").notNull(),
  email: text("email").notNull(),
  activo: boolean("activo").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/** Shared identity data (RUT, nombre, etc.) — base for profesor/alumno/apoderado in later phases. */
export const persona = pgTable("persona", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  colegioId: uuid("colegio_id")
    .notNull()
    .references(() => colegio.id, { onDelete: "cascade" }),
  rut: text("rut").notNull(),
  nombres: text("nombres").notNull(),
  apellidos: text("apellidos").notNull(),
  fechaNacimiento: date("fecha_nacimiento"),
  telefono: text("telefono"),
  direccion: text("direccion"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
