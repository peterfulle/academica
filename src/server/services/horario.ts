import { and, eq } from "drizzle-orm";
import type { Tx } from "@/server/db/client";
import type { DiaSemana } from "@/lib/horario";
import { asignatura, asignaturaCurso, bloqueHorario, curso, horarioClase, persona, profesor } from "@/server/db/schema";

export type AsignarAsignaturaCursoInput = {
  colegioId: string;
  cursoId: string;
  asignaturaId: string;
  profesorId?: string;
  horasSemanales?: number;
};

/** Upserts by (cursoId, asignaturaId) — one row per subject taught in a curso. */
export async function asignarAsignaturaCurso(tx: Tx, input: AsignarAsignaturaCursoInput) {
  const [existing] = await tx
    .select()
    .from(asignaturaCurso)
    .where(and(eq(asignaturaCurso.cursoId, input.cursoId), eq(asignaturaCurso.asignaturaId, input.asignaturaId)));

  if (existing) {
    const [updated] = await tx
      .update(asignaturaCurso)
      .set({ profesorId: input.profesorId, horasSemanales: input.horasSemanales, updatedAt: new Date() })
      .where(eq(asignaturaCurso.id, existing.id))
      .returning();
    return updated;
  }

  const [created] = await tx
    .insert(asignaturaCurso)
    .values({
      colegioId: input.colegioId,
      cursoId: input.cursoId,
      asignaturaId: input.asignaturaId,
      profesorId: input.profesorId,
      horasSemanales: input.horasSemanales,
    })
    .returning();
  return created;
}

export type AsignarClaseInput = {
  colegioId: string;
  asignaturaCursoId: string;
  bloqueHorarioId: string;
  diaSemana: DiaSemana;
  sala?: string;
};

/**
 * Assigns a subject to a (bloque, día) timetable cell for a curso. A curso can
 * only have one class per (bloque, día), so if that cell is already occupied —
 * by this same asignaturaCurso or a different one — it's replaced, matching
 * the "click a grid cell, pick a subject" UX rather than rejecting the write.
 */
export async function asignarClase(tx: Tx, input: AsignarClaseInput) {
  const [asignaturaCursoRow] = await tx
    .select()
    .from(asignaturaCurso)
    .where(eq(asignaturaCurso.id, input.asignaturaCursoId));
  if (!asignaturaCursoRow) {
    throw new Error("Asignatura de curso no encontrada");
  }

  const clasesEnLaCelda = await tx
    .select({ id: horarioClase.id })
    .from(horarioClase)
    .innerJoin(asignaturaCurso, eq(asignaturaCurso.id, horarioClase.asignaturaCursoId))
    .where(
      and(
        eq(horarioClase.bloqueHorarioId, input.bloqueHorarioId),
        eq(horarioClase.diaSemana, input.diaSemana),
        eq(asignaturaCurso.cursoId, asignaturaCursoRow.cursoId)
      )
    );

  for (const clase of clasesEnLaCelda) {
    await tx.delete(horarioClase).where(eq(horarioClase.id, clase.id));
  }

  const [created] = await tx
    .insert(horarioClase)
    .values({
      colegioId: input.colegioId,
      asignaturaCursoId: input.asignaturaCursoId,
      bloqueHorarioId: input.bloqueHorarioId,
      diaSemana: input.diaSemana,
      sala: input.sala,
    })
    .returning();
  return created;
}

export async function quitarClase(tx: Tx, horarioClaseId: string) {
  await tx.delete(horarioClase).where(eq(horarioClase.id, horarioClaseId));
}

/** All bloques for the colegio, sorted by start time — the row axis for every horario grid. */
export async function obtenerBloques(tx: Tx) {
  const bloques = await tx.select().from(bloqueHorario);
  return [...bloques].sort((a, b) => a.horaInicio.localeCompare(b.horaInicio));
}

/** Read-only grid data for a curso's timetable — used by admin, alumno, and apoderado views. */
export async function obtenerClasesDeCurso(tx: Tx, cursoId: string) {
  return tx
    .select({
      id: horarioClase.id,
      bloqueHorarioId: horarioClase.bloqueHorarioId,
      diaSemana: horarioClase.diaSemana,
      asignaturaNombre: asignatura.nombre,
      profesorNombres: persona.nombres,
      profesorApellidos: persona.apellidos,
    })
    .from(horarioClase)
    .innerJoin(asignaturaCurso, eq(asignaturaCurso.id, horarioClase.asignaturaCursoId))
    .innerJoin(asignatura, eq(asignatura.id, asignaturaCurso.asignaturaId))
    .leftJoin(profesor, eq(profesor.id, asignaturaCurso.profesorId))
    .leftJoin(persona, eq(persona.id, profesor.personaId))
    .where(eq(asignaturaCurso.cursoId, cursoId));
}

/** Read-only grid data for a profesor's own timetable — one row per class they teach, across every curso. */
export async function obtenerClasesDeProfesor(tx: Tx, profesorId: string) {
  return tx
    .select({
      id: horarioClase.id,
      bloqueHorarioId: horarioClase.bloqueHorarioId,
      diaSemana: horarioClase.diaSemana,
      asignaturaNombre: asignatura.nombre,
      cursoNivel: curso.nivel,
      cursoParalelo: curso.paralelo,
    })
    .from(horarioClase)
    .innerJoin(asignaturaCurso, eq(asignaturaCurso.id, horarioClase.asignaturaCursoId))
    .innerJoin(asignatura, eq(asignatura.id, asignaturaCurso.asignaturaId))
    .innerJoin(curso, eq(curso.id, asignaturaCurso.cursoId))
    .where(eq(asignaturaCurso.profesorId, profesorId));
}
