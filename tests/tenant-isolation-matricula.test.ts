import { eq, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import * as schema from "../src/server/db/schema";
import { matricularAlumno, retirarAlumno } from "../src/server/services/matricula";

// Extends the Fase 0 tenant-isolation suite to the Fase 1 tables (profesor,
// alumno, apoderado, apoderado_alumno, anio_escolar, curso, matricula), using
// the real matricularAlumno/retirarAlumno service so this also doubles as an
// integration test of that service. Same dual-role setup as
// tests/tenant-isolation.test.ts: ownerSql seeds cross-tenant fixtures and
// acts as a control; appSql is the restricted, non-owner role RLS actually
// applies to.
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
let cursoAId: string;
let cursoBId: string;

async function crearCursoDemo(colegioId: string, anio: number) {
  return withTenant(colegioId, async (tx) => {
    const [anioEscolarRow] = await tx
      .insert(schema.anioEscolar)
      .values({ colegioId, anio, fechaInicio: `${anio}-03-01`, fechaTermino: `${anio}-12-15` })
      .returning();
    const [cursoRow] = await tx
      .insert(schema.curso)
      .values({ colegioId, anioEscolarId: anioEscolarRow.id, nivel: "1ro Básico", paralelo: "A" })
      .returning();
    return cursoRow.id;
  });
}

beforeAll(async () => {
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

  const [colegioA] = await ownerDb.insert(schema.colegio).values({ nombre: "Colegio A" }).returning();
  const [colegioB] = await ownerDb.insert(schema.colegio).values({ nombre: "Colegio B" }).returning();
  colegioAId = colegioA.id;
  colegioBId = colegioB.id;

  cursoAId = await crearCursoDemo(colegioAId, 2026);
  cursoBId = await crearCursoDemo(colegioBId, 2026);

  await withTenant(colegioAId, (tx) =>
    matricularAlumno(tx, {
      colegioId: colegioAId,
      alumno: { rut: "111111111", nombres: "Ana", apellidos: "DelColegioA" },
      cursoId: cursoAId,
      apoderado: { rut: "222222222", nombres: "Mama", apellidos: "DeAna", email: "mama.ana@a.cl", tipoRelacion: "madre" },
    })
  );

  await withTenant(colegioBId, (tx) =>
    matricularAlumno(tx, {
      colegioId: colegioBId,
      alumno: { rut: "333333333", nombres: "Beto", apellidos: "DelColegioB" },
      cursoId: cursoBId,
      apoderado: { rut: "444444444", nombres: "Papa", apellidos: "DeBeto", email: "papa.beto@b.cl", tipoRelacion: "padre" },
    })
  );
});

afterAll(async () => {
  await ownerSql.end();
  await appSql.end();
});

describe("tenant isolation (RLS) — tablas de matrícula", () => {
  it("una sesión de colegio A solo ve sus propios alumnos, apoderados y matrículas", async () => {
    const alumnos = await withTenant(colegioAId, (tx) => tx.select().from(schema.alumno));
    const apoderados = await withTenant(colegioAId, (tx) => tx.select().from(schema.apoderado));
    const matriculas = await withTenant(colegioAId, (tx) => tx.select().from(schema.matricula));

    expect(alumnos).toHaveLength(1);
    expect(alumnos[0].colegioId).toBe(colegioAId);
    expect(apoderados).toHaveLength(1);
    expect(apoderados[0].colegioId).toBe(colegioAId);
    expect(matriculas).toHaveLength(1);
    expect(matriculas[0].colegioId).toBe(colegioAId);
  });

  it("una sesión de colegio B solo ve sus propios alumnos, apoderados y matrículas", async () => {
    const alumnos = await withTenant(colegioBId, (tx) => tx.select().from(schema.alumno));
    const apoderados = await withTenant(colegioBId, (tx) => tx.select().from(schema.apoderado));
    const matriculas = await withTenant(colegioBId, (tx) => tx.select().from(schema.matricula));

    expect(alumnos).toHaveLength(1);
    expect(alumnos[0].colegioId).toBe(colegioBId);
    expect(apoderados).toHaveLength(1);
    expect(apoderados[0].colegioId).toBe(colegioBId);
    expect(matriculas).toHaveLength(1);
    expect(matriculas[0].colegioId).toBe(colegioBId);
  });

  it("control: las fixtures realmente abarcan dos tenants distintos", async () => {
    const rows = await ownerSql`select colegio_id from alumno`;
    const distinctTenants = new Set(rows.map((r) => r.colegio_id));
    expect(distinctTenants.size).toBe(2);
  });
});

describe("matricularAlumno / retirarAlumno — reglas de negocio", () => {
  it("reutiliza la persona/apoderado existente por RUT en vez de duplicarla", async () => {
    // Re-matricular a la misma alumna (mismo RUT) en el mismo curso no debe crear una segunda persona.
    await withTenant(colegioAId, (tx) =>
      matricularAlumno(tx, {
        colegioId: colegioAId,
        alumno: { rut: "111111111", nombres: "Ana", apellidos: "DelColegioA" },
        cursoId: cursoAId,
        apoderado: { rut: "222222222", nombres: "Mama", apellidos: "DeAna", email: "mama.ana@a.cl", tipoRelacion: "madre" },
      })
    );

    const alumnos = await withTenant(colegioAId, (tx) => tx.select().from(schema.alumno));
    const matriculas = await withTenant(colegioAId, (tx) => tx.select().from(schema.matricula));

    expect(alumnos).toHaveLength(1);
    expect(matriculas.length).toBeGreaterThanOrEqual(2); // segunda matrícula registrada, misma alumna
  });

  it("retirarAlumno marca estado=retirado, fecha de retiro, y limpia el curso actual del alumno", async () => {
    const [matriculaVigente] = await withTenant(colegioAId, (tx) =>
      tx.select().from(schema.matricula).where(eq(schema.matricula.estado, "vigente"))
    );
    expect(matriculaVigente).toBeDefined();

    await withTenant(colegioAId, (tx) => retirarAlumno(tx, matriculaVigente.id));

    const [actualizada] = await withTenant(colegioAId, (tx) =>
      tx.select().from(schema.matricula).where(eq(schema.matricula.id, matriculaVigente.id))
    );
    expect(actualizada.estado).toBe("retirado");
    expect(actualizada.fechaRetiro).not.toBeNull();

    const [alumnoRow] = await withTenant(colegioAId, (tx) =>
      tx.select().from(schema.alumno).where(eq(schema.alumno.id, matriculaVigente.alumnoId))
    );
    expect(alumnoRow.cursoId).toBeNull();
  });
});
