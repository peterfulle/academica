import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import type { Tx } from "@/server/db/client";
import { profesor, usuario } from "@/server/db/schema";
import { upsertPersona } from "./persona";

export type CrearProfesorInput = {
  colegioId: string;
  rut: string;
  nombres: string;
  apellidos: string;
  email: string;
  especialidad?: string;
};

/** Reuses the persona/profesor by RUT if one already exists in this colegio, instead of duplicating it. */
export async function crearProfesor(tx: Tx, input: CrearProfesorInput) {
  const personaRow = await upsertPersona(tx, input.colegioId, input);

  const [existing] = await tx.select().from(profesor).where(eq(profesor.personaId, personaRow.id));
  if (existing) {
    return existing;
  }

  const [usuarioRow] = await tx
    .insert(usuario)
    .values({ colegioId: input.colegioId, authUserId: randomUUID(), rol: "profesor", email: input.email })
    .returning();

  const [created] = await tx
    .insert(profesor)
    .values({
      colegioId: input.colegioId,
      personaId: personaRow.id,
      usuarioId: usuarioRow.id,
      especialidad: input.especialidad,
    })
    .returning();
  return created;
}
