
import { describe, expect, it } from "vitest";
import { findDuplicateTicket } from "./ticket-duplicate";

const newTicket = {
  title: "Notebook não conecta ao Wi-Fi",
  type: "INC",
  category: "NETWORK_VPN",
  affectedEmployeeId: "employee-1",
};

const existingTicket = {
  id: "ticket-123",
  title: "Notebook não conecta ao Wi-Fi",
  type: "INC",
  category: "NETWORK_VPN",
  affectedEmployeeId: "employee-1",
  status: "OPEN",
};

describe("findDuplicateTicket", () => {
  it("encontra um chamado ativo com os mesmos dados", () => {
    const result = findDuplicateTicket(newTicket, [existingTicket]);

    expect(result).toEqual(existingTicket);
  });

  it("ignora diferenças de maiúsculas e minúsculas no título", () => {
    const result = findDuplicateTicket(newTicket, [
      {
        ...existingTicket,
        title: "NOTEBOOK NÃO CONECTA AO WI-FI",
      },
    ]);

    expect(result).not.toBeNull();
  });

  it("ignora espaços extras no título", () => {
    const result = findDuplicateTicket(newTicket, [
      {
        ...existingTicket,
        title: "  Notebook   não conecta ao Wi-Fi  ",
      },
    ]);

    expect(result).not.toBeNull();
  });

  it("não considera duplicado quando o funcionário afetado é diferente", () => {
    const result = findDuplicateTicket(newTicket, [
      { ...existingTicket, affectedEmployeeId: "employee-2" },
    ]);

    expect(result).toBeNull();
  });

  it("não considera duplicado quando o tipo é diferente", () => {
    const result = findDuplicateTicket(newTicket, [
      { ...existingTicket, type: "REQ" },
    ]);

    expect(result).toBeNull();
  });

  it("não considera duplicado quando a categoria é diferente", () => {
    const result = findDuplicateTicket(newTicket, [
      { ...existingTicket, category: "HARDWARE" },
    ]);

    expect(result).toBeNull();
  });

  it("não considera duplicado quando o título é diferente", () => {
    const result = findDuplicateTicket(newTicket, [
      { ...existingTicket, title: "Mouse não funciona" },
    ]);

    expect(result).toBeNull();
  });

  it.each(["RESOLVED", "CLOSED"])(
    "ignora chamados com status %s",
    (status) => {
      const result = findDuplicateTicket(newTicket, [
        { ...existingTicket, status },
      ]);

      expect(result).toBeNull();
    },
  );

  it("retorna null quando não existem chamados para comparar", () => {
    const result = findDuplicateTicket(newTicket, []);

    expect(result).toBeNull();
  });
});
