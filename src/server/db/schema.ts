import { sql } from "drizzle-orm";
import { boolean, date, integer, jsonb, pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const rolEnum = pgEnum("rol", ["admin", "profesor", "alumno", "apoderado"]);
export const tipoRelacionEnum = pgEnum("tipo_relacion", ["madre", "padre", "tutor", "otro"]);
export const estadoAnioEscolarEnum = pgEnum("estado_anio_escolar", ["planificacion", "activo", "cerrado"]);
export const estadoMatriculaEnum = pgEnum("estado_matricula", ["vigente", "retirado", "egresado", "trasladado"]);

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

export const profesor = pgTable("profesor", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  colegioId: uuid("colegio_id")
    .notNull()
    .references(() => colegio.id, { onDelete: "cascade" }),
  personaId: uuid("persona_id")
    .notNull()
    .references(() => persona.id, { onDelete: "cascade" }),
  usuarioId: uuid("usuario_id").references(() => usuario.id, { onDelete: "set null" }),
  especialidad: text("especialidad"),
  activo: boolean("activo").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const apoderado = pgTable("apoderado", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  colegioId: uuid("colegio_id")
    .notNull()
    .references(() => colegio.id, { onDelete: "cascade" }),
  personaId: uuid("persona_id")
    .notNull()
    .references(() => persona.id, { onDelete: "cascade" }),
  usuarioId: uuid("usuario_id").references(() => usuario.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/** Chilean academic year container — periodo_academico (semestre/trimestre) nests under this in a later phase. */
export const anioEscolar = pgTable("anio_escolar", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  colegioId: uuid("colegio_id")
    .notNull()
    .references(() => colegio.id, { onDelete: "cascade" }),
  anio: integer("anio").notNull(),
  fechaInicio: date("fecha_inicio").notNull(),
  fechaTermino: date("fecha_termino").notNull(),
  estado: estadoAnioEscolarEnum("estado").notNull().default("planificacion"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/** e.g. "4to Básico A". */
export const curso = pgTable("curso", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  colegioId: uuid("colegio_id")
    .notNull()
    .references(() => colegio.id, { onDelete: "cascade" }),
  anioEscolarId: uuid("anio_escolar_id")
    .notNull()
    .references(() => anioEscolar.id, { onDelete: "cascade" }),
  nivel: text("nivel").notNull(),
  paralelo: text("paralelo").notNull(),
  profesorJefeId: uuid("profesor_jefe_id").references(() => profesor.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/** cursoId is the denormalized "current course" for quick lookup — historical placement lives in `matricula`. */
export const alumno = pgTable("alumno", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  colegioId: uuid("colegio_id")
    .notNull()
    .references(() => colegio.id, { onDelete: "cascade" }),
  personaId: uuid("persona_id")
    .notNull()
    .references(() => persona.id, { onDelete: "cascade" }),
  usuarioId: uuid("usuario_id").references(() => usuario.id, { onDelete: "set null" }),
  cursoId: uuid("curso_id").references(() => curso.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/** Join table: supports multiple apoderados per alumno and one apoderado with multiple alumnos. */
export const apoderadoAlumno = pgTable("apoderado_alumno", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  colegioId: uuid("colegio_id")
    .notNull()
    .references(() => colegio.id, { onDelete: "cascade" }),
  apoderadoId: uuid("apoderado_id")
    .notNull()
    .references(() => apoderado.id, { onDelete: "cascade" }),
  alumnoId: uuid("alumno_id")
    .notNull()
    .references(() => alumno.id, { onDelete: "cascade" }),
  tipoRelacion: tipoRelacionEnum("tipo_relacion").notNull(),
  esApoderadoPrincipal: boolean("es_apoderado_principal").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/** Historical enrollment record — one per alumno per anio_escolar. This is what the matrícula module manages. */
export const matricula = pgTable("matricula", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  colegioId: uuid("colegio_id")
    .notNull()
    .references(() => colegio.id, { onDelete: "cascade" }),
  alumnoId: uuid("alumno_id")
    .notNull()
    .references(() => alumno.id, { onDelete: "cascade" }),
  cursoId: uuid("curso_id")
    .notNull()
    .references(() => curso.id, { onDelete: "restrict" }),
  anioEscolarId: uuid("anio_escolar_id")
    .notNull()
    .references(() => anioEscolar.id, { onDelete: "restrict" }),
  fechaMatricula: date("fecha_matricula").notNull(),
  estado: estadoMatriculaEnum("estado").notNull().default("vigente"),
  fechaRetiro: date("fecha_retiro"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
