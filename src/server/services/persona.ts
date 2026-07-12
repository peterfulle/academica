import { and, eq } from "drizzle-orm";
import type { Tx } from "@/server/db/client";
import { persona } from "@/server/db/schema";

export type UpsertPersonaInput = {
  rut: string;
  nombres: string;
  apellidos: string;
  fechaNacimiento?: string;
};

/** Reuses an existing persona by (colegioId, rut) instead of duplicating it. */
export async function upsertPersona(tx: Tx, colegioId: string, input: UpsertPersonaInput) {
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
