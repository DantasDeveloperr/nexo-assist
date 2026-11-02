
import { describe, expect, it } from "vitest";
import {
  canReopenResolvedTicket,
  findReopenableResolvedTicket,
} from "./ticket-reopening";

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

describe("findReopenableResolvedTicket", () => {
  const now = new Date("2026-10-27T12:00:00.000Z");

  const newTicket = {
    title: "VPN não funciona",
    type: "INC",
    category: "NETWORK_VPN",
    affectedEmployeeId: "EMP001",
  };

  const resolvedTicket = {
    id: "ticket-001",
    ...newTicket,
    status: "RESOLVED",
    resolvedAt: new Date("2026-10-25T12:00:00.000Z"),
  };

  it("encontra um chamado resolvido correspondente", () => {
    const result = findReopenableResolvedTicket(
      newTicket,
      [resolvedTicket],
      now,
    );

    expect(result?.id).toBe("ticket-001");
  });

  it("ignora diferenças de maiúsculas, minúsculas e espaços no título", () => {
    const result = findReopenableResolvedTicket(
      newTicket,
      [{
        ...resolvedTicket,
        title: "  vpn   NÃO FUNCIONA  ",
      }],
      now,
    );

    expect(result?.id).toBe("ticket-001");
  });

  it("não encontra chamado com funcionário afetado diferente", () => {
    const result = findReopenableResolvedTicket(
      newTicket,
      [{
        ...resolvedTicket,
        affectedEmployeeId: "EMP002",
      }],
      now,
    );

    expect(result).toBeNull();
  });

  it("não encontra chamado com tipo diferente", () => {
    const result = findReopenableResolvedTicket(
      newTicket,
      [{ ...resolvedTicket, type: "REQ" }],
      now,
    );

    expect(result).toBeNull();
  });

  it("não encontra chamado com categoria diferente", () => {
    const result = findReopenableResolvedTicket(
      newTicket,
      [{ ...resolvedTicket, category: "HARDWARE" }],
      now,
    );

    expect(result).toBeNull();
  });

  it("não encontra chamado com título diferente", () => {
    const result = findReopenableResolvedTicket(
      newTicket,
      [{ ...resolvedTicket, title: "Computador não liga" }],
      now,
    );

    expect(result).toBeNull();
  });

  it("ignora chamados que não estão resolvidos", () => {
    const result = findReopenableResolvedTicket(
      newTicket,
      [{ ...resolvedTicket, status: "CLOSED" }],
      now,
    );

    expect(result).toBeNull();
  });

  it("ignora chamados resolvidos há mais de sete dias", () => {
    const result = findReopenableResolvedTicket(
      newTicket,
      [{
        ...resolvedTicket,
        resolvedAt: new Date("2026-10-19T11:59:59.999Z"),
      }],
      now,
    );

    expect(result).toBeNull();
  });

  it("seleciona o chamado elegível resolvido mais recentemente", () => {
    const olderTicket = {
      ...resolvedTicket,
      id: "ticket-older",
      resolvedAt: new Date("2026-10-22T12:00:00.000Z"),
    };

    const newerTicket = {
      ...resolvedTicket,
      id: "ticket-newer",
      resolvedAt: new Date("2026-10-26T12:00:00.000Z"),
    };

    const result = findReopenableResolvedTicket(
      newTicket,
      [olderTicket, newerTicket],
      now,
    );

    expect(result?.id).toBe("ticket-newer");
  });

  it("retorna null quando não existem chamados para analisar", () => {
    const result = findReopenableResolvedTicket(
      newTicket,
      [],
      now,
    );

    expect(result).toBeNull();
  });
});
