import type { diaSemanaEnum } from "@/server/db/schema";

export type DiaSemana = (typeof diaSemanaEnum.enumValues)[number];

/** Monday-to-Friday, in display order. */
export const DIAS_SEMANA: DiaSemana[] = ["lunes", "martes", "miercoles", "jueves", "viernes"];

export const DIA_LABEL: Record<DiaSemana, string> = {
  lunes: "Lunes",
  martes: "Martes",
  miercoles: "Miércoles",
  jueves: "Jueves",
  viernes: "Viernes",
};
