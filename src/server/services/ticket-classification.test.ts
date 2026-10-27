
import { describe, expect, it } from "vitest";
import { classifyTicketType } from "./ticket-classification";

describe("classifyTicketType", () => {
  it("classifica uma falha como incidente (INC)", () => {
    expect(
      classifyTicketType("Meu notebook parou de funcionar"),
    ).toBe("INC");
  });

  it("classifica uma solicitação de acesso como REQ", () => {
    expect(
      classifyTicketType("Preciso de acesso ao sistema"),
    ).toBe("REQ");
  });

  it("ignora diferenças entre letras maiúsculas e minúsculas", () => {
    expect(
      classifyTicketType("O SISTEMA NÃO FUNCIONA"),
    ).toBe("INC");
  });

  it("retorna null para uma mensagem vazia", () => {
    expect(classifyTicketType("")).toBeNull();
  });

  it("retorna null quando não há informação suficiente", () => {
    expect(
      classifyTicketType("Preciso de ajuda com meu computador"),
    ).toBeNull();
  });

  it("retorna null quando há sinais de incidente e solicitação na mesma mensagem", () => {
    expect(
      classifyTicketType(
        "O sistema não funciona e preciso de acesso",
      ),
    ).toBeNull();
  });
});
