"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireDevSession } from "@/server/auth/session";
import { withTenant } from "@/server/db/client";
import { anioEscolar, curso } from "@/server/db/schema";

const anioEscolarSchema = z.object({
  anio: z.coerce.number().int().min(2000).max(2100),
  fechaInicio: z.string().min(1),
  fechaTermino: z.string().min(1),
});

export async function crearAnioEscolar(formData: FormData) {
  const session = await requireDevSession("admin");
  const input = anioEscolarSchema.parse({
    anio: formData.get("anio"),
    fechaInicio: formData.get("fechaInicio"),
    fechaTermino: formData.get("fechaTermino"),
  });

  await withTenant(session.colegioId, (tx) =>
    tx.insert(anioEscolar).values({
      colegioId: session.colegioId,
      anio: input.anio,
      fechaInicio: input.fechaInicio,
      fechaTermino: input.fechaTermino,
    })
  );

  revalidatePath("/admin/anios-cursos");
}

const cursoSchema = z.object({
  anioEscolarId: z.string().uuid(),
  nivel: z.string().min(1),
  paralelo: z.string().min(1),
});

export async function crearCurso(formData: FormData) {
  const session = await requireDevSession("admin");
  const input = cursoSchema.parse({
    anioEscolarId: formData.get("anioEscolarId"),
    nivel: formData.get("nivel"),
    paralelo: formData.get("paralelo"),
  });

  await withTenant(session.colegioId, (tx) =>
    tx.insert(curso).values({
      colegioId: session.colegioId,
      anioEscolarId: input.anioEscolarId,
      nivel: input.nivel,
      paralelo: input.paralelo,
    })
  );

  revalidatePath("/admin/anios-cursos");
}
