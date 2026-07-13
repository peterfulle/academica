import { sql } from "drizzle-orm";
import { boolean, date, integer, jsonb, pgEnum, pgTable, text, time, timestamp, uuid } from "drizzle-orm/pg-core";

export const rolEnum = pgEnum("rol", ["admin", "profesor", "alumno", "apoderado"]);
export const tipoRelacionEnum = pgEnum("tipo_relacion", ["madre", "padre", "tutor", "otro"]);
export const estadoAnioEscolarEnum = pgEnum("estado_anio_escolar", ["planificacion", "activo", "cerrado"]);
export const estadoMatriculaEnum = pgEnum("estado_matricula", ["vigente", "retirado", "egresado", "trasladado"]);
export const diaSemanaEnum = pgEnum("dia_semana", ["lunes", "martes", "miercoles", "jueves", "viernes"]);

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

/**
 * Every tenant-scoped table below calls `.enableRLS()`. This isn't cosmetic:
 * without it, `drizzle-kit push` treats "RLS enabled" as configuration drift
 * (since we manage the actual policies out-of-band in rls-policies.sql, not
 * via Drizzle's schema) and silently runs `ALTER TABLE ... DISABLE ROW LEVEL
 * SECURITY` on every push to "correct" it — which happened to us once
 * already. `.enableRLS()` tells drizzle-kit that enabled RLS *is* the
 * declared state, so it stops fighting rls-policies.sql. Always re-run
 * rls-policies.sql after a push regardless — this only preserves the enabled
 * flag, not FORCE or the policies themselves.
 */

/** Identity + role binding for a tenant member — the source of truth for rol/colegio_id once real auth exists. */
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
}).enableRLS();

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
}).enableRLS();

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
}).enableRLS();

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
}).enableRLS();

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
}).enableRLS();

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
}).enableRLS();

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
}).enableRLS();

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
}).enableRLS();

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
}).enableRLS();

/** Subject catalog, e.g. "Matemática". */
export const asignatura = pgTable("asignatura", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  colegioId: uuid("colegio_id")
    .notNull()
    .references(() => colegio.id, { onDelete: "cascade" }),
  nombre: text("nombre").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}).enableRLS();

/** Which asignatura is taught in which curso this year, and by whom. */
export const asignaturaCurso = pgTable("asignatura_curso", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  colegioId: uuid("colegio_id")
    .notNull()
    .references(() => colegio.id, { onDelete: "cascade" }),
  cursoId: uuid("curso_id")
    .notNull()
    .references(() => curso.id, { onDelete: "cascade" }),
  asignaturaId: uuid("asignatura_id")
    .notNull()
    .references(() => asignatura.id, { onDelete: "cascade" }),
  profesorId: uuid("profesor_id").references(() => profesor.id, { onDelete: "set null" }),
  horasSemanales: integer("horas_semanales"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}).enableRLS();

/**
 * Timetable slot template, e.g. "Bloque 1, 08:00-08:45". Day-agnostic and
 * colegio-wide — the same bloque is reused for every weekday and every curso;
 * `horario_clase` is what pins a bloque to a specific día for a specific curso.
 */
export const bloqueHorario = pgTable("bloque_horario", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  colegioId: uuid("colegio_id")
    .notNull()
    .references(() => colegio.id, { onDelete: "cascade" }),
  horaInicio: time("hora_inicio").notNull(),
  horaTermino: time("hora_termino").notNull(),
  nombre: text("nombre").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}).enableRLS();

/** The actual timetable: which asignatura_curso happens in which bloque, on which día. */
export const horarioClase = pgTable("horario_clase", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  colegioId: uuid("colegio_id")
    .notNull()
    .references(() => colegio.id, { onDelete: "cascade" }),
  asignaturaCursoId: uuid("asignatura_curso_id")
    .notNull()
    .references(() => asignaturaCurso.id, { onDelete: "cascade" }),
  bloqueHorarioId: uuid("bloque_horario_id")
    .notNull()
    .references(() => bloqueHorario.id, { onDelete: "cascade" }),
  diaSemana: diaSemanaEnum("dia_semana").notNull(),
  sala: text("sala"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}).enableRLS();
