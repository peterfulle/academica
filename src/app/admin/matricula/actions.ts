"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { rutSchema } from "@/lib/rut";
import { requireDevSession } from "@/server/auth/session";
import { withTenant } from "@/server/db/client";
import { matricularAlumno, retirarAlumno } from "@/server/services/matricula";

const nuevoAlumnoSchema = z.object({
  alumnoRut: rutSchema,
  alumnoNombres: z.string().min(1),
  alumnoApellidos: z.string().min(1),
  alumnoFechaNacimiento: z.string().optional(),
  cursoId: z.string().uuid(),
  apoderadoRut: rutSchema,
  apoderadoNombres: z.string().min(1),
  apoderadoApellidos: z.string().min(1),
  apoderadoEmail: z.string().email(),
  tipoRelacion: z.enum(["madre", "padre", "tutor", "otro"]),
});

export async function crearAlumnoConMatricula(formData: FormData) {
  const session = await requireDevSession("admin");
  const input = nuevoAlumnoSchema.parse({
    alumnoRut: formData.get("alumnoRut"),
    alumnoNombres: formData.get("alumnoNombres"),
    alumnoApellidos: formData.get("alumnoApellidos"),
    alumnoFechaNacimiento: formData.get("alumnoFechaNacimiento") || undefined,
    cursoId: formData.get("cursoId"),
    apoderadoRut: formData.get("apoderadoRut"),
    apoderadoNombres: formData.get("apoderadoNombres"),
    apoderadoApellidos: formData.get("apoderadoApellidos"),
    apoderadoEmail: formData.get("apoderadoEmail"),
    tipoRelacion: formData.get("tipoRelacion"),
  });

  await withTenant(session.colegioId, (tx) =>
    matricularAlumno(tx, {
      colegioId: session.colegioId,
      alumno: {
        rut: input.alumnoRut,
        nombres: input.alumnoNombres,
        apellidos: input.alumnoApellidos,
        fechaNacimiento: input.alumnoFechaNacimiento,
      },
      cursoId: input.cursoId,
      apoderado: {
        rut: input.apoderadoRut,
        nombres: input.apoderadoNombres,
        apellidos: input.apoderadoApellidos,
        email: input.apoderadoEmail,
        tipoRelacion: input.tipoRelacion,
      },
    })
  );

  revalidatePath("/admin/matricula");
  redirect("/admin/matricula");
}

export async function retirarAlumnoAction(formData: FormData) {
  const session = await requireDevSession("admin");
  const matriculaId = z.string().uuid().parse(formData.get("matriculaId"));

  await withTenant(session.colegioId, (tx) => retirarAlumno(tx, matriculaId));

  revalidatePath("/admin/matricula");
}
