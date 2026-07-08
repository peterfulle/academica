import "dotenv/config";
import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { db, withTenant } from "./client";
import { colegio, usuario } from "./schema";

const COLEGIOS_DEMO = ["Colegio Piloto Uno", "Colegio Piloto Dos"];

/**
 * Idempotent dev/demo seed: creates COLEGIOS_DEMO with one admin usuario each.
 * authUserId is a random placeholder — there is no real auth provider yet
 * (see src/server/auth/session.ts), so it doesn't need to reference anything real.
 */
async function seed() {
  for (const nombre of COLEGIOS_DEMO) {
    const [existing] = await db.select().from(colegio).where(eq(colegio.nombre, nombre));

    const colegioRow =
      existing ??
      (await db.insert(colegio).values({ nombre }).returning())[0];

    if (existing) {
      console.log(`ya existe: ${nombre}`);
    } else {
      console.log(`creado: ${nombre}`);
    }

    await withTenant(colegioRow.id, async (tx) => {
      const [existingAdmin] = await tx
        .select()
        .from(usuario)
        .where(eq(usuario.email, `admin@${slug(nombre)}.cl`));

      if (existingAdmin) {
        console.log(`  ya existe admin para: ${nombre}`);
        return;
      }

      await tx.insert(usuario).values({
        colegioId: colegioRow.id,
        authUserId: randomUUID(),
        rol: "admin",
        email: `admin@${slug(nombre)}.cl`,
      });
      console.log(`  admin creado para: ${nombre}`);
    });
  }
}

function slug(nombre: string): string {
  return nombre
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-");
}

seed()
  .then(() => {
    console.log("seed completo");
    process.exit(0);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
