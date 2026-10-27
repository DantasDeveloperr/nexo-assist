
import { describe, expect, it } from "vitest";
import {
  SLA_DEADLINES,
  calculateSlaDeadline,
} from "./ticket-sla";

describe("SLA_DEADLINES", () => {
  it("define o prazo de 1 hora para chamados críticos", () => {
    expect(SLA_DEADLINES.CRITICAL).toEqual({
      amount: 1,
      unit: "hour",
      businessHoursOnly: false,
    });
  });

  it("define o prazo de 4 horas úteis para chamados de alta prioridade", () => {
    expect(SLA_DEADLINES.HIGH).toEqual({
      amount: 4,
      unit: "hour",
      businessHoursOnly: true,
    });
  });

  it("define o prazo de 3 dias úteis para chamados de média prioridade", () => {
    expect(SLA_DEADLINES.MEDIUM).toEqual({
      amount: 3,
      unit: "business-day",
      businessHoursOnly: true,
    });
  });

  it("define o prazo de 5 dias úteis para chamados de baixa prioridade", () => {
    expect(SLA_DEADLINES.LOW).toEqual({
      amount: 5,
      unit: "business-day",
      businessHoursOnly: true,
    });
  });
});

describe("calculateSlaDeadline", () => {
  it("calcula 4 horas úteis a partir das 8h para HIGH", () => {
    const deadline = calculateSlaDeadline(
      "HIGH",
      new Date("2026-10-27T08:00:00-03:00"),
    );

    expect(deadline.toISOString()).toBe(
      "2026-10-27T15:00:00.000Z",
    );
  });

  it("conta horas corridas para CRITICAL", () => {
    const deadline = calculateSlaDeadline(
      "CRITICAL",
      new Date("2026-10-27T23:00:00-03:00"),
    );

    expect(deadline.toISOString()).toBe(
      "2026-10-28T03:00:00.000Z",
    );
  });

  it("continua o prazo HIGH no próximo expediente quando aberto às 17h", () => {
    const deadline = calculateSlaDeadline(
      "HIGH",
      new Date("2026-10-27T17:00:00-03:00"),
    );

    expect(deadline.toISOString()).toBe(
      "2026-10-28T14:00:00.000Z",
    );
  });

  it("ignora o fim de semana para HIGH", () => {
    const deadline = calculateSlaDeadline(
      "HIGH",
      new Date("2026-10-30T16:00:00-03:00"),
    );

    expect(deadline.toISOString()).toBe(
      "2026-11-02T13:00:00.000Z",
    );
  });

  it("inicia o prazo HIGH às 8h quando aberto às 18h", () => {
    const deadline = calculateSlaDeadline(
      "HIGH",
      new Date("2026-10-27T18:00:00-03:00"),
    );

    expect(deadline.toISOString()).toBe(
      "2026-10-28T15:00:00.000Z",
    );
  });

  it("inicia o prazo HIGH às 8h quando aberto antes do expediente", () => {
    const deadline = calculateSlaDeadline(
      "HIGH",
      new Date("2026-10-27T07:00:00-03:00"),
    );

    expect(deadline.toISOString()).toBe(
      "2026-10-27T15:00:00.000Z",
    );
  });

  it("calcula 3 dias de expediente para MEDIUM", () => {
    const deadline = calculateSlaDeadline(
      "MEDIUM",
      new Date("2026-10-27T08:00:00-03:00"),
    );

    expect(deadline.toISOString()).toBe(
      "2026-10-29T21:00:00.000Z",
    );
  });

  it("calcula 5 dias de expediente para LOW", () => {
    const deadline = calculateSlaDeadline(
      "LOW",
      new Date("2026-10-27T08:00:00-03:00"),
    );

    expect(deadline.toISOString()).toBe(
      "2026-11-02T21:00:00.000Z",
    );
  });
});
