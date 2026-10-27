
import { describe, expect, it } from "vitest";
import { updateTicketSchema } from "./ticket-schema";

describe("updateTicketSchema", () => {
  it("aceita atualizar apenas o título", () => {
    const result = updateTicketSchema.safeParse({
      title: "VPN não conecta",
    });

    expect(result.success).toBe(true);
  });

  it("aceita atualizar apenas o status", () => {
    const result = updateTicketSchema.safeParse({
      status: "IN_PROGRESS",
    });

    expect(result.success).toBe(true);
  });

  it("aceita atualizar vários campos válidos", () => {
    const result = updateTicketSchema.safeParse({
      title: "VPN não conecta",
      description: "Erro 809 ao conectar.",
      priority: "HIGH",
      status: "OPEN",
    });

    expect(result.success).toBe(true);
  });

  it("rejeita um objeto vazio", () => {
    const result = updateTicketSchema.safeParse({});

    expect(result.success).toBe(false);
  });

  it("rejeita um status inválido", () => {
    const result = updateTicketSchema.safeParse({
      status: "CANCELLED",
    });

    expect(result.success).toBe(false);
  });

  it("rejeita um título vazio", () => {
    const result = updateTicketSchema.safeParse({
      title: "   ",
    });

    expect(result.success).toBe(false);
  });

  it("rejeita campos desconhecidos", () => {
    const result = updateTicketSchema.safeParse({
      affectedEmployeeId: "EMP002",
    });

    expect(result.success).toBe(false);
  });

  it("rejeita uma prioridade inválida", () => {
    const result = updateTicketSchema.safeParse({
      priority: "URGENT",
    });

    expect(result.success).toBe(false);
  });
});
