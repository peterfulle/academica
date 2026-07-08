import type { rolEnum } from "@/server/db/schema";

export type Rol = (typeof rolEnum.enumValues)[number];

export type NavItem = {
  label: string;
  /** Roadmap phase this module ships in — Fase 0 is the shell you're looking at now. */
  fase: 0 | 1 | 2 | 3 | 4;
};

export const ROL_LABEL: Record<Rol, string> = {
  admin: "Administrador",
  profesor: "Profesor",
  alumno: "Alumno",
  apoderado: "Apoderado",
};

export const NAV_BY_ROL: Record<Rol, NavItem[]> = {
  admin: [
    { label: "Inicio", fase: 0 },
    { label: "Matrícula", fase: 1 },
    { label: "Horarios", fase: 2 },
    { label: "Asistencia", fase: 3 },
    { label: "Notas", fase: 4 },
  ],
  profesor: [
    { label: "Inicio", fase: 0 },
    { label: "Mis cursos", fase: 1 },
    { label: "Horario", fase: 2 },
    { label: "Asistencia", fase: 3 },
    { label: "Notas", fase: 4 },
  ],
  apoderado: [
    { label: "Inicio", fase: 0 },
    { label: "Mis hijos", fase: 1 },
    { label: "Horario", fase: 2 },
    { label: "Asistencia", fase: 3 },
    { label: "Boletín", fase: 4 },
  ],
  alumno: [
    { label: "Inicio", fase: 0 },
    { label: "Horario", fase: 2 },
    { label: "Asistencia", fase: 3 },
    { label: "Notas", fase: 4 },
  ],
};
