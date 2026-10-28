
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/server", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("next/server")>();

  return {
    ...actual,
    connection: vi.fn().mockResolvedValue(undefined),
  };
});

vi.mock("../../../../server/auth/current-employee", () => ({
  getAuthenticatedEmployee: vi.fn(),
}));

vi.mock("../../../../server/services/ticket-ai-assistant", () => ({
  interpretTicketMessage: vi.fn(),
}));

import { getAuthenticatedEmployee } from "../../../../server/auth/current-employee";
import { interpretTicketMessage } from "../../../../server/services/ticket-ai-assistant";
import { POST } from "./route";

const authenticatedEmployee = {
  id: "employee-123",
  name: "Funcionario de Teste",
  email: "funcionario@teste.com",
};

const validInterpretation = {
  title: "Notebook com tela azul",
  type: "INC" as const,
  category: "HARDWARE" as const,
  needsClarification: false,
  clarifyingQuestion: "",
};

function createRequest(body: string): Request {
  return new Request("http://localhost/api/tickets/interpret", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body,
  });
}

describe("POST /api/tickets/interpret", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(getAuthenticatedEmployee).mockResolvedValue(
      authenticatedEmployee,
    );

    vi.mocked(interpretTicketMessage).mockResolvedValue(
      validInterpretation,
    );
  });

  it("retorna 401 quando o funcionario nao esta autenticado", async () => {
    vi.mocked(getAuthenticatedEmployee).mockResolvedValue(null);

    const response = await POST(
      createRequest(JSON.stringify({ message: "Meu notebook parou." })),
    );

    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.message).toBe("Não autenticado.");
    expect(interpretTicketMessage).not.toHaveBeenCalled();
  });

  it("retorna 400 quando o JSON e invalido", async () => {
    const response = await POST(createRequest("{json-invalido"));

    expect(response.status).toBe(400);
    expect(interpretTicketMessage).not.toHaveBeenCalled();
  });

  it("retorna 400 quando o relato esta vazio", async () => {
    const response = await POST(
      createRequest(JSON.stringify({ message: "   " })),
    );

    expect(response.status).toBe(400);
    expect(interpretTicketMessage).not.toHaveBeenCalled();
  });

  it("retorna 400 quando o relato ultrapassa 2000 caracteres", async () => {
    const response = await POST(
      createRequest(JSON.stringify({ message: "a".repeat(2001) })),
    );

    expect(response.status).toBe(400);
    expect(interpretTicketMessage).not.toHaveBeenCalled();
  });

  it("retorna 200 com a interpretacao do assistente", async () => {
    const message =
      "Meu notebook parou de funcionar e aparece uma tela azul.";

    const response = await POST(
      createRequest(JSON.stringify({ message })),
    );

    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.message).toBe("Relato interpretado com sucesso.");
    expect(body.data).toEqual(validInterpretation);
    expect(interpretTicketMessage).toHaveBeenCalledWith(message);
  });

  it("retorna 503 quando a chave do Gemini nao esta configurada", async () => {
    vi.mocked(interpretTicketMessage).mockRejectedValue(
      new Error("A variável GEMINI_API_KEY não está configurada."),
    );

    const response = await POST(
      createRequest(JSON.stringify({ message: "Preciso de acesso ao sistema." })),
    );

    const body = await response.json();

    expect(response.status).toBe(503);
    expect(body.message).toBe(
      "O assistente de IA está temporariamente indisponível.",
    );
  });

  it("retorna 502 quando ocorre uma falha na interpretacao", async () => {
    vi.mocked(interpretTicketMessage).mockRejectedValue(
      new Error("Falha interna simulada."),
    );

    const response = await POST(
      createRequest(JSON.stringify({ message: "Meu computador não liga." })),
    );

    const body = await response.json();

    expect(response.status).toBe(502);
    expect(body.message).toBe(
      "Não foi possível interpretar o relato neste momento.",
    );
    expect(body.message).not.toContain("Falha interna simulada.");
  });
});
