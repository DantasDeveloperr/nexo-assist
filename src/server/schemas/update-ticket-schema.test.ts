
import { describe, expect, it } from "vitest";
import { updateTicketSchema } from "./ticket-schema";

describe("updateTicketSchema", () => {
  it("aceita atualizar apenas o título", () => {
    const result = updateTicketSchema.safeParse({
      title: "VPN não conecta",
    });

    expect(result.success).toBe(true);
  });

  it("aceita atualizar apenas a descrição", () => {
    const result = updateTicketSchema.safeParse({
      description: "Erro 809 ao conectar.",
    });

    expect(result.success).toBe(true);
  });

  it("aceita atualizar apenas o status", () => {
    const result = updateTicketSchema.safeParse({
      status: "IN_PROGRESS",
    });

    expect(result.success).toBe(true);
  });

  it("aceita atualizar vários campos permitidos", () => {
    const result = updateTicketSchema.safeParse({
      title: "VPN não conecta",
      description: "Erro 809 ao conectar.",
      status: "IN_PROGRESS",
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

  it("rejeita alteração de prioridade", () => {
    const result = updateTicketSchema.safeParse({
      priority: "HIGH",
    });

    expect(result.success).toBe(false);
  });

  it("rejeita alteração de categoria", () => {
    const result = updateTicketSchema.safeParse({
      category: "HARDWARE",
    });

    expect(result.success).toBe(false);
  });

  it("rejeita alteração do tipo", () => {
    const result = updateTicketSchema.safeParse({
      type: "REQ",
    });

    expect(result.success).toBe(false);
  });
});