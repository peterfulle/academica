import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { Rol } from "@/lib/nav";

const COOKIE_NAME = "academica_dev_session";

export type DevSession = {
  colegioId: string;
  usuarioId: string;
  rol: Rol;
};

/**
 * TEMPORARY stand-in for real authentication (Fase 1 explicitly defers login —
 * see the project plan). Unsigned and unverified: it trusts whatever JSON is in
 * this cookie. Safe only because there are no real user accounts yet — this
 * must be replaced before any real colegio data exists.
 *
 * Deliberately shaped like a real session (`colegioId` + `usuarioId` + `rol`)
 * so that swapping this out for real auth later only changes this file, not
 * every call site that reads a session.
 */
export async function getDevSession(): Promise<DevSession | null> {
  const store = await cookies();
  const raw = store.get(COOKIE_NAME)?.value;
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw);
    if (
      typeof parsed?.colegioId !== "string" ||
      typeof parsed?.usuarioId !== "string" ||
      typeof parsed?.rol !== "string"
    ) {
      return null;
    }
    return parsed as DevSession;
  } catch {
    return null;
  }
}

export async function setDevSession(session: DevSession): Promise<void> {
  const store = await cookies();
  store.set(COOKIE_NAME, JSON.stringify(session), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });
}

export async function clearDevSession(): Promise<void> {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

/** Redirects to /sesion if there's no session or it's for a different rol than the page requires. */
export async function requireDevSession(rol: Rol): Promise<DevSession> {
  const session = await getDevSession();
  if (!session || session.rol !== rol) {
    redirect("/sesion");
  }
  return session;
}
