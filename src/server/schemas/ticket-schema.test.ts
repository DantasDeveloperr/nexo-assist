
import { describe, expect, it } from "vitest";
import {
  createTicketSchema,
  updateTicketSchema,
} from "./ticket-schema";

const validTicket = {
  title: "VPN não funciona",
  description: "Recebo o erro 809 ao tentar conectar.",
  type: "INC",
  category: "NETWORK_VPN",
  priority: "HIGH",
  affectedEmployeeId: "EMP001",
};

describe("createTicketSchema", () => {
  it("aceita um chamado válido", () => {
    const result = createTicketSchema.safeParse(validTicket);

    expect(result.success).toBe(true);
  });

  it("rejeita um título vazio", () => {
    const result = createTicketSchema.safeParse({
      ...validTicket,
      title: "   ",
    });

    expect(result.success).toBe(false);
  });

  it("rejeita uma descrição vazia", () => {
    const result = createTicketSchema.safeParse({
      ...validTicket,
      description: "",
    });

    expect(result.success).toBe(false);
  });

  it("rejeita um tipo de chamado inválido", () => {
    const result = createTicketSchema.safeParse({
      ...validTicket,
      type: "BUG",
    });

    expect(result.success).toBe(false);
  });

  it("rejeita uma categoria inválida", () => {
    const result = createTicketSchema.safeParse({
      ...validTicket,
      category: "PRINTER",
    });

    expect(result.success).toBe(false);
  });

  it("rejeita uma prioridade inválida", () => {
    const result = createTicketSchema.safeParse({
      ...validTicket,
      priority: "URGENT",
    });

    expect(result.success).toBe(false);
  });

  it("rejeita o identificador da pessoa afetada vazio", () => {
    const result = createTicketSchema.safeParse({
      ...validTicket,
      affectedEmployeeId: "   ",
    });

    expect(result.success).toBe(false);
  });

  it("remove espaços extras do título e da descrição", () => {
    const result = createTicketSchema.safeParse({
      ...validTicket,
      title: "  VPN não funciona  ",
      description: "  Recebo o erro 809.  ",
    });

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data.title).toBe("VPN não funciona");
      expect(result.data.description).toBe("Recebo o erro 809.");
    }
  });

  it("rejeita um título com mais de 120 caracteres", () => {
    const result = createTicketSchema.safeParse({
      ...validTicket,
      title: "A".repeat(121),
    });

    expect(result.success).toBe(false);
  });
});

describe("updateTicketSchema", () => {
  it("aceita a atualização somente do título", () => {
    const result = updateTicketSchema.safeParse({
      title: "VPN apresenta erro de conexão",
    });

    expect(result.success).toBe(true);
  });

  it("aceita a atualização somente da descrição", () => {
    const result = updateTicketSchema.safeParse({
      description: "O erro acontece ao iniciar a VPN.",
    });

    expect(result.success).toBe(true);
  });

  it("aceita a atualização do título e da descrição", () => {
    const result = updateTicketSchema.safeParse({
      title: "VPN não conecta",
      description: "Erro 809 ao conectar.",
    });

    expect(result.success).toBe(true);
  });

  it("aceita um status válido", () => {
    const result = updateTicketSchema.safeParse({
      status: "IN_PROGRESS",
    });

    expect(result.success).toBe(true);
  });

  it("rejeita um status inválido", () => {
    const result = updateTicketSchema.safeParse({
      status: "CANCELLED",
    });

    expect(result.success).toBe(false);
  });

  it("rejeita um objeto vazio", () => {
    const result = updateTicketSchema.safeParse({});

    expect(result.success).toBe(false);
  });

  it("rejeita a alteração de prioridade", () => {
    const result = updateTicketSchema.safeParse({
      priority: "CRITICAL",
    });

    expect(result.success).toBe(false);
  });

  it("rejeita a alteração de categoria", () => {
    const result = updateTicketSchema.safeParse({
      category: "ACCESS",
    });

    expect(result.success).toBe(false);
  });

  it("rejeita a alteração do tipo", () => {
    const result = updateTicketSchema.safeParse({
      type: "REQ",
    });

    expect(result.success).toBe(false);
  });

  it("rejeita a alteração do funcionário afetado", () => {
    const result = updateTicketSchema.safeParse({
      affectedEmployeeId: "EMP002",
    });

    expect(result.success).toBe(false);
  });

  it("rejeita propriedades desconhecidas", () => {
    const result = updateTicketSchema.safeParse({
      title: "VPN não conecta",
      unknownField: "valor",
    });

    expect(result.success).toBe(false);
  });

  it("rejeita um título vazio na atualização", () => {
    const result = updateTicketSchema.safeParse({
      title: "   ",
    });

    expect(result.success).toBe(false);
  });

  it("remove espaços extras do título atualizado", () => {
    const result = updateTicketSchema.safeParse({
      title: "  VPN não funciona  ",
    });

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data.title).toBe("VPN não funciona");
    }
  });
});
