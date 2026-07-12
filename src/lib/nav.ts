import type { rolEnum } from "@/server/db/schema";

export type Rol = (typeof rolEnum.enumValues)[number];

export type NavItem = {
  label: string;
  /** Roadmap phase this module ships in — 0 means it's already built (no "Fase N" badge shown). */
  fase: 0 | 1 | 2 | 3 | 4;
  /** Only set for items with their own route; unset items render as plain text. */
  href?: string;
};

export const ROL_LABEL: Record<Rol, string> = {
  admin: "Administrador",
  profesor: "Profesor",
  alumno: "Alumno",
  apoderado: "Apoderado",
};

export const NAV_BY_ROL: Record<Rol, NavItem[]> = {
  admin: [
    { label: "Inicio", fase: 0, href: "/admin" },
    { label: "Matrícula", fase: 0, href: "/admin/matricula" },
    { label: "Horarios", fase: 0, href: "/admin/horarios" },
    { label: "Asistencia", fase: 3 },
    { label: "Notas", fase: 4 },
  ],
  profesor: [
    { label: "Inicio", fase: 0, href: "/profesor" },
    { label: "Mis cursos", fase: 1 },
    { label: "Horario", fase: 0 },
    { label: "Asistencia", fase: 3 },
    { label: "Notas", fase: 4 },
  ],
  apoderado: [
    { label: "Inicio", fase: 0, href: "/apoderado" },
    { label: "Mis hijos", fase: 0 },
    { label: "Horario", fase: 0 },
    { label: "Asistencia", fase: 3 },
    { label: "Boletín", fase: 4 },
  ],
  alumno: [
    { label: "Inicio", fase: 0, href: "/alumno" },
    { label: "Horario", fase: 0 },
    { label: "Asistencia", fase: 3 },
    { label: "Notas", fase: 4 },
  ],
};
