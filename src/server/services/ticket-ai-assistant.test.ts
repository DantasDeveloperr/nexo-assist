
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { mockGenerateContent } = vi.hoisted(() => ({
  mockGenerateContent: vi.fn(),
}));

vi.mock("@google/genai", () => ({
  GoogleGenAI: vi.fn().mockImplementation(function () {
    return {
      models: {
        generateContent: mockGenerateContent,
      },
    };
  }),
}));

import { interpretTicketMessage } from "./ticket-ai-assistant";

const validInterpretation = {
  intent: "CREATE_TICKET",
  understanding: "O funcionário está com problema de acesso.",
  confidence: 0.95,
  justification: "A mensagem relata uma falha de acesso.",
  clarificationQuestion: null,
  ticketDraft: {
    title: "Problema de acesso ao sistema",
    type: "INC",
    category: "ACCESS",
  },
};

describe("interpretTicketMessage", () => {
  beforeEach(() => {
    vi.stubEnv("GEMINI_API_KEY", "test-api-key");
    vi.stubEnv("GEMINI_MODEL", "gemini-test-model");

    mockGenerateContent.mockReset();
    mockGenerateContent.mockResolvedValue({
      text: JSON.stringify(validInterpretation),
    });
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("deve retornar uma interpretação válida do Gemini", async () => {
    const result = await interpretTicketMessage(
      "Não consigo acessar o sistema.",
    );

    expect(result).toEqual(validInterpretation);
  });

  it("deve utilizar o modelo configurado no ambiente", async () => {
    await interpretTicketMessage("Não consigo acessar o sistema.");

    expect(mockGenerateContent).toHaveBeenCalledWith(
      expect.objectContaining({
        model: "gemini-test-model",
      }),
    );
  });

  it("deve utilizar o modelo padrão quando não houver configuração", async () => {
    vi.stubEnv("GEMINI_MODEL", "");

    await interpretTicketMessage("Não consigo acessar o sistema.");

    expect(mockGenerateContent).toHaveBeenCalledWith(
      expect.objectContaining({
        model: "gemini-3.5-flash-lite",
      }),
    );
  });

  it("deve rejeitar uma mensagem vazia", async () => {
    await expect(
      interpretTicketMessage("   "),
    ).rejects.toThrow("A mensagem do chamado não pode estar vazia.");

    expect(mockGenerateContent).not.toHaveBeenCalled();
  });

  it("deve rejeitar mensagens com mais de 2000 caracteres", async () => {
    await expect(
      interpretTicketMessage("a".repeat(2001)),
    ).rejects.toThrow("A mensagem deve ter no máximo 2000 caracteres.");

    expect(mockGenerateContent).not.toHaveBeenCalled();
  });

  it("deve rejeitar a execução sem chave da API", async () => {
    vi.stubEnv("GEMINI_API_KEY", "");

    await expect(
      interpretTicketMessage("Não consigo acessar o sistema."),
    ).rejects.toThrow("A variável GEMINI_API_KEY não está configurada.");

    expect(mockGenerateContent).not.toHaveBeenCalled();
  });

  it("deve rejeitar uma resposta JSON inválida", async () => {
    mockGenerateContent.mockResolvedValue({
      text: "resposta inválida",
    });

    await expect(
      interpretTicketMessage("Não consigo acessar o sistema."),
    ).rejects.toThrow("O Gemini retornou uma resposta JSON inválida.");
  });

  it("deve rejeitar uma resposta que não passe pela validação Zod", async () => {
    mockGenerateContent.mockResolvedValue({
      text: JSON.stringify({
        ...validInterpretation,
        intent: "EXECUTE_SQL",
      }),
    });

    await expect(
      interpretTicketMessage("Não consigo acessar o sistema."),
    ).rejects.toThrow("A resposta do Gemini não passou pela validação.");
  });

  it("deve rejeitar uma resposta sem conteúdo", async () => {
    mockGenerateContent.mockResolvedValue({
      text: "",
    });

    await expect(
      interpretTicketMessage("Não consigo acessar o sistema."),
    ).rejects.toThrow("O Gemini não retornou uma interpretação.");
  });
});
