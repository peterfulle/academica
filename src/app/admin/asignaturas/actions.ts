"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireDevSession } from "@/server/auth/session";
import { withTenant } from "@/server/db/client";
import { asignatura } from "@/server/db/schema";

const asignaturaSchema = z.object({
  nombre: z.string().min(1),
});

export async function crearAsignatura(formData: FormData) {
  const session = await requireDevSession("admin");
  const input = asignaturaSchema.parse({ nombre: formData.get("nombre") });

  await withTenant(session.colegioId, (tx) =>
    tx.insert(asignatura).values({ colegioId: session.colegioId, nombre: input.nombre })
  );

  revalidatePath("/admin/asignaturas");
}
