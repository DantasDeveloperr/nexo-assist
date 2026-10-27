
import { describe, expect, it } from "vitest";
import { assessTicketPriority } from "./ticket-priority";

describe("assessTicketPriority", () => {
  it("classifica equipe inteira parada como CRITICAL", () => {
    expect(
      assessTicketPriority({
        impact: "ENTIRE_TEAM_STOPPED",
        urgency: "NO_URGENCY",
      })?.priority,
    ).toBe("CRITICAL");
  });

  it("classifica uma pessoa bloqueada como HIGH", () => {
    expect(
      assessTicketPriority({
        impact: "ONE_PERSON_BLOCKED",
        urgency: "NO_WORKAROUND",
      })?.priority,
    ).toBe("HIGH");
  });

  it("classifica compromisso do mesmo dia em risco como HIGH", () => {
    expect(
      assessTicketPriority({
        impact: "WORK_IMPAIRED",
        urgency: "SAME_DAY_COMMITMENT_AT_RISK",
      })?.priority,
    ).toBe("HIGH");
  });

  it("classifica trabalho prejudicado com alternativa como MEDIUM", () => {
    expect(
      assessTicketPriority({
        impact: "WORK_IMPAIRED",
        urgency: "WORKAROUND_AVAILABLE",
      })?.priority,
    ).toBe("MEDIUM");
  });

  it("classifica situação sem impacto e sem urgência como LOW", () => {
    expect(
      assessTicketPriority({
        impact: "NO_SIGNIFICANT_IMPACT",
        urgency: "NO_URGENCY",
      })?.priority,
    ).toBe("LOW");
  });

  it("classifica uma pessoa bloqueada como HIGH mesmo sem urgência declarada", () => {
    expect(
      assessTicketPriority({
        impact: "ONE_PERSON_BLOCKED",
        urgency: "NO_URGENCY",
      })?.priority,
    ).toBe("HIGH");
  });

  it("retorna null quando não há regra suficiente para decidir", () => {
    expect(
      assessTicketPriority({
        impact: "WORK_IMPAIRED",
        urgency: "NO_URGENCY",
      }),
    ).toBeNull();
  });

});
