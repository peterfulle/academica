"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireDevSession } from "@/server/auth/session";
import { withTenant } from "@/server/db/client";
import { asignarAsignaturaCurso, asignarClase, quitarClase } from "@/server/services/horario";

const asignaturaCursoSchema = z.object({
  cursoId: z.string().uuid(),
  asignaturaId: z.string().uuid(),
  profesorId: z.string().uuid().optional(),
  horasSemanales: z.coerce.number().int().positive().optional(),
});

export async function crearAsignaturaCursoAction(formData: FormData) {
  const session = await requireDevSession("admin");
  const input = asignaturaCursoSchema.parse({
    cursoId: formData.get("cursoId"),
    asignaturaId: formData.get("asignaturaId"),
    profesorId: formData.get("profesorId") || undefined,
    horasSemanales: formData.get("horasSemanales") || undefined,
  });

  await withTenant(session.colegioId, (tx) => asignarAsignaturaCurso(tx, { colegioId: session.colegioId, ...input }));

  revalidatePath("/admin/horarios");
}

const asignarClaseSchema = z.object({
  asignaturaCursoId: z.string().uuid(),
  bloqueHorarioId: z.string().uuid(),
  diaSemana: z.enum(["lunes", "martes", "miercoles", "jueves", "viernes"]),
});

export async function asignarClaseAction(formData: FormData) {
  const session = await requireDevSession("admin");
  const input = asignarClaseSchema.parse({
    asignaturaCursoId: formData.get("asignaturaCursoId"),
    bloqueHorarioId: formData.get("bloqueHorarioId"),
    diaSemana: formData.get("diaSemana"),
  });

  await withTenant(session.colegioId, (tx) => asignarClase(tx, { colegioId: session.colegioId, ...input }));

  revalidatePath("/admin/horarios");
}

export async function quitarClaseAction(formData: FormData) {
  const session = await requireDevSession("admin");
  const horarioClaseId = z.string().uuid().parse(formData.get("horarioClaseId"));

  await withTenant(session.colegioId, (tx) => quitarClase(tx, horarioClaseId));

  revalidatePath("/admin/horarios");
}
