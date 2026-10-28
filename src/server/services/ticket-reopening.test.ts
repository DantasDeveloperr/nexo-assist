
import { describe, expect, it } from "vitest";
import { canReopenResolvedTicket } from "./ticket-reopening";

describe("canReopenResolvedTicket", () => {
  const now = new Date("2026-10-27T12:00:00.000Z");
  const sevenDaysInMs = 7 * 24 * 60 * 60 * 1000;

  it("permite reabrir quando passaram menos de sete dias", () => {
    const resolvedAt = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);

    expect(canReopenResolvedTicket(resolvedAt, now)).toBe(true);
  });

  it("permite reabrir exatamente no limite de sete dias", () => {
    const resolvedAt = new Date(now.getTime() - sevenDaysInMs);

    expect(canReopenResolvedTicket(resolvedAt, now)).toBe(true);
  });

  it("não permite reabrir depois de sete dias", () => {
    const resolvedAt = new Date(now.getTime() - sevenDaysInMs - 1);

    expect(canReopenResolvedTicket(resolvedAt, now)).toBe(false);
  });

  it("não permite reabrir quando não existe data de resolução", () => {
    expect(canReopenResolvedTicket(null, now)).toBe(false);
  });

  it("não permite reabrir quando a data de resolução está no futuro", () => {
    const resolvedAt = new Date(now.getTime() + 1000);

    expect(canReopenResolvedTicket(resolvedAt, now)).toBe(false);
  });

  it("não permite reabrir com uma data inválida", () => {
    const resolvedAt = new Date(Number.NaN);

    expect(canReopenResolvedTicket(resolvedAt, now)).toBe(false);
  });
});
