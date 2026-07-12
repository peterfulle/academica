"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { rutSchema } from "@/lib/rut";
import { requireDevSession } from "@/server/auth/session";
import { withTenant } from "@/server/db/client";
import { crearProfesor } from "@/server/services/profesor";

const profesorSchema = z.object({
  rut: rutSchema,
  nombres: z.string().min(1),
  apellidos: z.string().min(1),
  email: z.string().email(),
  especialidad: z.string().optional(),
});

export async function crearProfesorAction(formData: FormData) {
  const session = await requireDevSession("admin");
  const input = profesorSchema.parse({
    rut: formData.get("rut"),
    nombres: formData.get("nombres"),
    apellidos: formData.get("apellidos"),
    email: formData.get("email"),
    especialidad: formData.get("especialidad") || undefined,
  });

  await withTenant(session.colegioId, (tx) => crearProfesor(tx, { colegioId: session.colegioId, ...input }));

  revalidatePath("/admin/profesores");
}
