import { z } from "zod";

function cleanRut(rut: string): string {
  return rut.replace(/[^0-9kK]/g, "").toUpperCase();
}

function computeDv(rutBody: string): string {
  let sum = 0;
  let multiplier = 2;
  for (let i = rutBody.length - 1; i >= 0; i--) {
    sum += Number(rutBody[i]) * multiplier;
    multiplier = multiplier === 7 ? 2 : multiplier + 1;
  }
  const remainder = 11 - (sum % 11);
  if (remainder === 11) return "0";
  if (remainder === 10) return "K";
  return String(remainder);
}

/** True if `rut` (with or without dots/dash) has a valid check digit. */
export function isValidRut(rut: string): boolean {
  const clean = cleanRut(rut);
  if (clean.length < 2) return false;
  const body = clean.slice(0, -1);
  const dv = clean.slice(-1);
  if (!/^\d+$/.test(body)) return false;
  return computeDv(body) === dv;
}

/** Canonical storage form: digits + check digit, no dots or dash (e.g. "123456785"). */
export function normalizeRut(rut: string): string {
  return cleanRut(rut);
}

/** Display form with thousands dots and dash (e.g. "12.345.678-5"). */
export function formatRut(rut: string): string {
  const clean = cleanRut(rut);
  if (clean.length < 2) return clean;
  const body = clean.slice(0, -1);
  const dv = clean.slice(-1);
  const bodyWithDots = body.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${bodyWithDots}-${dv}`;
}

/** Zod schema accepting any common RUT format, normalizing to the canonical storage form. */
export const rutSchema = z
  .string()
  .trim()
  .refine(isValidRut, { message: "RUT inválido" })
  .transform(normalizeRut);
