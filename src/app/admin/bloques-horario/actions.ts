"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireDevSession } from "@/server/auth/session";
import { withTenant } from "@/server/db/client";
import { bloqueHorario } from "@/server/db/schema";

const bloqueSchema = z.object({
  horaInicio: z.string().min(1),
  horaTermino: z.string().min(1),
  nombre: z.string().min(1),
});

export async function crearBloqueHorario(formData: FormData) {
  const session = await requireDevSession("admin");
  const input = bloqueSchema.parse({
    horaInicio: formData.get("horaInicio"),
    horaTermino: formData.get("horaTermino"),
    nombre: formData.get("nombre"),
  });

  await withTenant(session.colegioId, (tx) =>
    tx.insert(bloqueHorario).values({
      colegioId: session.colegioId,
      horaInicio: input.horaInicio,
      horaTermino: input.horaTermino,
      nombre: input.nombre,
    })
  );

  revalidatePath("/admin/bloques-horario");
}
