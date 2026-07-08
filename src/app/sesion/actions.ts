"use server";

import { redirect } from "next/navigation";
import type { Rol } from "@/lib/nav";
import { setDevSession } from "@/server/auth/session";

export async function iniciarSesionDev(colegioId: string, usuarioId: string, rol: Rol) {
  await setDevSession({ colegioId, usuarioId, rol });
  redirect(`/${rol}`);
}
