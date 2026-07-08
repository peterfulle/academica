import { randomUUID } from "node:crypto";
import { and, eq } from "drizzle-orm";
import type { Tx } from "@/server/db/client";
import { alumno, apoderado, apoderadoAlumno, curso, matricula, persona, usuario } from "@/server/db/schema";

type TipoRelacion = "madre" | "padre" | "tutor" | "otro";

export type MatricularAlumnoInput = {
  colegioId: string;
  alumno: { rut: string; nombres: string; apellidos: string; fechaNacimiento?: string };
  cursoId: string;
  apoderado: { rut: string; nombres: string; apellidos: string; email: string; tipoRelacion: TipoRelacion };
};

/**
 * Creates (or reuses, by RUT) the alumno and apoderado personas, links them,
 * and records a new matricula. anioEscolarId is always derived from the
 * chosen curso — never taken from caller input — so a matricula can never
 * point at a curso from a different año escolar than the one it records.
 */
export async function matricularAlumno(tx: Tx, input: MatricularAlumnoInput) {
  const [cursoRow] = await tx.select().from(curso).where(eq(curso.id, input.cursoId));
  if (!cursoRow) {
    throw new Error("Curso no encontrado");
  }

  const alumnoRow = await upsertAlumno(tx, input.colegioId, input.alumno, input.cursoId);
  const apoderadoRow = await upsertApoderado(tx, input.colegioId, input.apoderado);

  const [vinculoExistente] = await tx
    .select()
    .from(apoderadoAlumno)
    .where(and(eq(apoderadoAlumno.apoderadoId, apoderadoRow.id), eq(apoderadoAlumno.alumnoId, alumnoRow.id)));

  if (!vinculoExistente) {
    await tx.insert(apoderadoAlumno).values({
      colegioId: input.colegioId,
      apoderadoId: apoderadoRow.id,
      alumnoId: alumnoRow.id,
      tipoRelacion: input.apoderado.tipoRelacion,
      esApoderadoPrincipal: true,
    });
  }

  const [matriculaRow] = await tx
    .insert(matricula)
    .values({
      colegioId: input.colegioId,
      alumnoId: alumnoRow.id,
      cursoId: input.cursoId,
      anioEscolarId: cursoRow.anioEscolarId,
      fechaMatricula: new Date().toISOString().slice(0, 10),
      estado: "vigente",
    })
    .returning();

  return { alumno: alumnoRow, apoderado: apoderadoRow, matricula: matriculaRow };
}

async function upsertAlumno(
  tx: Tx,
  colegioId: string,
  input: { rut: string; nombres: string; apellidos: string; fechaNacimiento?: string },
  cursoId: string
) {
  const personaRow = await upsertPersona(tx, colegioId, input);

  const [existing] = await tx.select().from(alumno).where(eq(alumno.personaId, personaRow.id));
  if (existing) {
    const [updated] = await tx
      .update(alumno)
      .set({ cursoId, updatedAt: new Date() })
      .where(eq(alumno.id, existing.id))
      .returning();
    return updated;
  }

  const [created] = await tx
    .insert(alumno)
    .values({ colegioId, personaId: personaRow.id, cursoId })
    .returning();
  return created;
}

async function upsertApoderado(
  tx: Tx,
  colegioId: string,
  input: { rut: string; nombres: string; apellidos: string; email: string }
) {
  const personaRow = await upsertPersona(tx, colegioId, input);

  const [existing] = await tx.select().from(apoderado).where(eq(apoderado.personaId, personaRow.id));
  if (existing) {
    return existing;
  }

  const [usuarioRow] = await tx
    .insert(usuario)
    .values({ colegioId, authUserId: randomUUID(), rol: "apoderado", email: input.email })
    .returning();

  const [created] = await tx
    .insert(apoderado)
    .values({ colegioId, personaId: personaRow.id, usuarioId: usuarioRow.id })
    .returning();
  return created;
}

async function upsertPersona(
  tx: Tx,
  colegioId: string,
  input: { rut: string; nombres: string; apellidos: string; fechaNacimiento?: string }
) {
  const [existing] = await tx
    .select()
    .from(persona)
    .where(and(eq(persona.colegioId, colegioId), eq(persona.rut, input.rut)));
  if (existing) {
    return existing;
  }

  const [created] = await tx
    .insert(persona)
    .values({
      colegioId,
      rut: input.rut,
      nombres: input.nombres,
      apellidos: input.apellidos,
      fechaNacimiento: input.fechaNacimiento,
    })
    .returning();
  return created;
}

/** Marks a matricula as retirado and clears the alumno's current cursoId — never deletes the record. */
export async function retirarAlumno(tx: Tx, matriculaId: string) {
  const hoy = new Date().toISOString().slice(0, 10);
  const [matriculaRow] = await tx
    .update(matricula)
    .set({ estado: "retirado", fechaRetiro: hoy, updatedAt: new Date() })
    .where(eq(matricula.id, matriculaId))
    .returning();

  if (matriculaRow) {
    await tx.update(alumno).set({ cursoId: null, updatedAt: new Date() }).where(eq(alumno.id, matriculaRow.alumnoId));
  }

  return matriculaRow;
}
