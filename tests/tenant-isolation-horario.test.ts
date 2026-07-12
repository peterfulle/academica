import { eq, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import * as schema from "../src/server/db/schema";
import { asignarAsignaturaCurso, asignarClase, obtenerClasesDeCurso } from "../src/server/services/horario";
import { crearProfesor } from "../src/server/services/profesor";

// Same dual-role setup as tests/tenant-isolation-matricula.test.ts: ownerSql
// seeds cross-tenant fixtures and acts as a control; appSql is the restricted,
// non-owner role RLS actually applies to.
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

type Fixture = {
  colegioId: string;
  cursoId: string;
  bloqueId: string;
  asignaturaCursoId: string;
};

async function crearFixture(nombreColegio: string, ruts: { profesor: string }): Promise<Fixture> {
  const [colegioRow] = await ownerDb.insert(schema.colegio).values({ nombre: nombreColegio }).returning();
  const colegioId = colegioRow.id;

  return withTenant(colegioId, async (tx) => {
    const [anioEscolarRow] = await tx
      .insert(schema.anioEscolar)
      .values({ colegioId, anio: 2026, fechaInicio: "2026-03-01", fechaTermino: "2026-12-15" })
      .returning();
    const [cursoRow] = await tx
      .insert(schema.curso)
      .values({ colegioId, anioEscolarId: anioEscolarRow.id, nivel: "1ro Básico", paralelo: "A" })
      .returning();
    const [asignaturaRow] = await tx.insert(schema.asignatura).values({ colegioId, nombre: "Matemática" }).returning();
    const profesorRow = await crearProfesor(tx, {
      colegioId,
      rut: ruts.profesor,
      nombres: "Profe",
      apellidos: nombreColegio,
      email: `profe.${ruts.profesor}@dev.local`,
    });
    const [bloqueRow] = await tx
      .insert(schema.bloqueHorario)
      .values({ colegioId, nombre: "Bloque 1", horaInicio: "08:00", horaTermino: "08:45" })
      .returning();
    const asignaturaCursoRow = await asignarAsignaturaCurso(tx, {
      colegioId,
      cursoId: cursoRow.id,
      asignaturaId: asignaturaRow.id,
      profesorId: profesorRow.id,
    });
    await asignarClase(tx, {
      colegioId,
      asignaturaCursoId: asignaturaCursoRow.id,
      bloqueHorarioId: bloqueRow.id,
      diaSemana: "lunes",
    });

    return { colegioId, cursoId: cursoRow.id, bloqueId: bloqueRow.id, asignaturaCursoId: asignaturaCursoRow.id };
  });
}

let fixtureA: Fixture;
let fixtureB: Fixture;

beforeAll(async () => {
  await ownerSql`delete from horario_clase`;
  await ownerSql`delete from asignatura_curso`;
  await ownerSql`delete from bloque_horario`;
  await ownerSql`delete from asignatura`;
  await ownerSql`delete from matricula`;
  await ownerSql`delete from apoderado_alumno`;
  await ownerSql`delete from alumno`;
  await ownerSql`delete from apoderado`;
  await ownerSql`delete from profesor`;
  await ownerSql`delete from curso`;
  await ownerSql`delete from anio_escolar`;
  await ownerSql`delete from usuario`;
  await ownerSql`delete from persona`;
  await ownerSql`delete from colegio`;

  fixtureA = await crearFixture("Colegio Horario A", { profesor: "555555555" });
  fixtureB = await crearFixture("Colegio Horario B", { profesor: "666666666" });
});

afterAll(async () => {
  await ownerSql.end();
  await appSql.end();
});

describe("tenant isolation (RLS) — tablas de horario", () => {
  it("una sesión de colegio A solo ve sus propias asignaturas, profesores, bloques y clases", async () => {
    const asignaturas = await withTenant(fixtureA.colegioId, (tx) => tx.select().from(schema.asignatura));
    const profesores = await withTenant(fixtureA.colegioId, (tx) => tx.select().from(schema.profesor));
    const bloques = await withTenant(fixtureA.colegioId, (tx) => tx.select().from(schema.bloqueHorario));
    const clases = await withTenant(fixtureA.colegioId, (tx) => tx.select().from(schema.horarioClase));

    expect(asignaturas).toHaveLength(1);
    expect(profesores).toHaveLength(1);
    expect(bloques).toHaveLength(1);
    expect(clases).toHaveLength(1);
    expect(bloques[0].colegioId).toBe(fixtureA.colegioId);
  });

  it("una sesión de colegio B solo ve sus propias asignaturas, profesores, bloques y clases", async () => {
    const asignaturas = await withTenant(fixtureB.colegioId, (tx) => tx.select().from(schema.asignatura));
    const bloques = await withTenant(fixtureB.colegioId, (tx) => tx.select().from(schema.bloqueHorario));
    const clases = await withTenant(fixtureB.colegioId, (tx) => tx.select().from(schema.horarioClase));

    expect(asignaturas).toHaveLength(1);
    expect(bloques).toHaveLength(1);
    expect(clases).toHaveLength(1);
    expect(bloques[0].colegioId).toBe(fixtureB.colegioId);
  });

  it("control: las fixtures realmente abarcan dos tenants distintos", async () => {
    const rows = await ownerSql`select colegio_id from bloque_horario`;
    const distinctTenants = new Set(rows.map((r) => r.colegio_id));
    expect(distinctTenants.size).toBe(2);
  });

  it("obtenerClasesDeCurso de colegio A nunca devuelve clases de colegio B aunque se pida por su propio cursoId", async () => {
    const clasesA = await withTenant(fixtureA.colegioId, (tx) => obtenerClasesDeCurso(tx, fixtureA.cursoId));
    expect(clasesA).toHaveLength(1);

    // Pedir explícitamente el curso de B desde una sesión de A: RLS debe devolver vacío, no un error.
    const clasesCruzadas = await withTenant(fixtureA.colegioId, (tx) => obtenerClasesDeCurso(tx, fixtureB.cursoId));
    expect(clasesCruzadas).toHaveLength(0);
  });
});

describe("asignarClase — reglas de negocio", () => {
  it("reemplaza la clase existente en la misma celda (bloque, día, curso) en vez de duplicarla", async () => {
    await withTenant(fixtureA.colegioId, async (tx) => {
      const [otraAsignatura] = await tx
        .insert(schema.asignatura)
        .values({ colegioId: fixtureA.colegioId, nombre: "Lenguaje" })
        .returning();
      const otraAsignaturaCurso = await asignarAsignaturaCurso(tx, {
        colegioId: fixtureA.colegioId,
        cursoId: fixtureA.cursoId,
        asignaturaId: otraAsignatura.id,
      });

      await asignarClase(tx, {
        colegioId: fixtureA.colegioId,
        asignaturaCursoId: otraAsignaturaCurso.id,
        bloqueHorarioId: fixtureA.bloqueId,
        diaSemana: "lunes",
      });

      const clasesEnLaCelda = await tx
        .select()
        .from(schema.horarioClase)
        .where(eq(schema.horarioClase.bloqueHorarioId, fixtureA.bloqueId));

      expect(clasesEnLaCelda).toHaveLength(1);
      expect(clasesEnLaCelda[0].asignaturaCursoId).toBe(otraAsignaturaCurso.id);
    });
  });
});
