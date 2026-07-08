import { describe, expect, it } from "vitest";
import { formatRut, isValidRut, normalizeRut, rutSchema } from "../src/lib/rut";

describe("isValidRut", () => {
  it("accepts valid RUTs regardless of formatting", () => {
    expect(isValidRut("12345678-5")).toBe(true);
    expect(isValidRut("12.345.678-5")).toBe(true);
    expect(isValidRut("123456785")).toBe(true);
  });

  it("accepts a RUT whose check digit is K, in either case", () => {
    expect(isValidRut("999999-K")).toBe(true);
    expect(isValidRut("999999-k")).toBe(true);
  });

  it("rejects a wrong check digit", () => {
    expect(isValidRut("12345678-9")).toBe(false);
  });

  it("rejects malformed input", () => {
    expect(isValidRut("")).toBe(false);
    expect(isValidRut("5")).toBe(false);
    expect(isValidRut("abcdefgh-5")).toBe(false);
  });
});

describe("normalizeRut / formatRut", () => {
  it("normalizes to digits + check digit with no punctuation", () => {
    expect(normalizeRut("12.345.678-5")).toBe("123456785");
  });

  it("formats with thousands dots and a dash", () => {
    expect(formatRut("123456785")).toBe("12.345.678-5");
    expect(formatRut("999999K")).toBe("999.999-K");
  });
});

describe("rutSchema", () => {
  it("parses and normalizes a valid RUT", () => {
    expect(rutSchema.parse("12.345.678-5")).toBe("123456785");
  });

  it("throws on an invalid RUT", () => {
    expect(() => rutSchema.parse("12.345.678-9")).toThrow();
  });
});
