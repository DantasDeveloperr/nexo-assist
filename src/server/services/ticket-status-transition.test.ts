
import { describe, expect, it } from "vitest";
import { canTransitionTicketStatus } from "./ticket-status-transition";

describe("canTransitionTicketStatus", () => {
  it.each([
    ["OPEN", "IN_PROGRESS"],
    ["IN_PROGRESS", "WAITING_FOR_EMPLOYEE"],
    ["IN_PROGRESS", "RESOLVED"],
    ["WAITING_FOR_EMPLOYEE", "IN_PROGRESS"],
    ["RESOLVED", "CLOSED"],
  ])("permite a transição de %s para %s", (currentStatus, newStatus) => {
    expect(
      canTransitionTicketStatus(currentStatus, newStatus),
    ).toBe(true);
  });

  it.each([
    ["OPEN", "CLOSED"],
    ["OPEN", "RESOLVED"],
    ["WAITING_FOR_EMPLOYEE", "CLOSED"],
    ["CLOSED", "IN_PROGRESS"],
    ["CLOSED", "OPEN"],
    ["RESOLVED", "IN_PROGRESS"],
  ])("bloqueia a transição de %s para %s", (currentStatus, newStatus) => {
    expect(
      canTransitionTicketStatus(currentStatus, newStatus),
    ).toBe(false);
  });

  it("rejeita um status atual desconhecido", () => {
    expect(
      canTransitionTicketStatus("UNKNOWN", "IN_PROGRESS"),
    ).toBe(false);
  });

  it("rejeita um novo status desconhecido", () => {
    expect(
      canTransitionTicketStatus("OPEN", "UNKNOWN"),
    ).toBe(false);
  });
});
