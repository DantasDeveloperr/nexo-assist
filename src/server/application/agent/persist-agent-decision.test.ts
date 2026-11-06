
import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockCreate } = vi.hoisted(() => ({
  mockCreate: vi.fn(),
}));

vi.mock("../../db/prisma", () => ({
  prisma: {
    agentDecision: {
      create: mockCreate,
    },
  },
}));

import { persistAgentDecision } from "./persist-agent-decision";
import type { AgentInterpretation } from "../../../types/agent";

describe("persistAgentDecision", () => {
  const interpretation: AgentInterpretation = {
    intent: "CREATE_TICKET",
    understanding: "O funcionário relatou uma falha de acesso à VPN.",
    confidence: 0.92,
    justification: "A mensagem descreve uma falha técnica.",
    clarificationQuestion: null,
    ticketDraft: {
      title: "Falha de acesso à VPN",
      type: "INC",
      category: "NETWORK_VPN",
    },
    action: "PREPARE_TICKET",
  };

  beforeEach(() => {
    vi.clearAllMocks();

    mockCreate.mockResolvedValue({
      id: "decision-123",
      conversationId: "conversation-123",
      messageId: "message-123",
      ...interpretation,
      outcome: "INTERPRETED",
    });
  });

  it("deve persistir a decisão associada à conversa e mensagem", async () => {
    await persistAgentDecision({
      conversationId: "conversation-123",
      messageId: "message-123",
      interpretation,
      outcome: "INTERPRETED",
    });

    expect(mockCreate).toHaveBeenCalledWith({
      data: {
        conversationId: "conversation-123",
        messageId: "message-123",
        intent: "CREATE_TICKET",
        understanding: interpretation.understanding,
        action: "PREPARE_TICKET",
        confidence: 0.92,
        justification: interpretation.justification,
        outcome: "INTERPRETED",
        modelVersion: null,
        promptVersion: null,
      },
    });
  });

  it("deve persistir a versão do modelo e do prompt", async () => {
    await persistAgentDecision({
      conversationId: "conversation-123",
      messageId: "message-123",
      interpretation,
      outcome: "INTERPRETED",
      modelVersion: "gemini-3.5-flash-lite",
      promptVersion: "1.0.0",
    });

    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          modelVersion: "gemini-3.5-flash-lite",
          promptVersion: "1.0.0",
        }),
      }),
    );
  });

  it("deve retornar o registro criado pelo Prisma", async () => {
    const result = await persistAgentDecision({
      conversationId: "conversation-123",
      messageId: "message-123",
      interpretation,
      outcome: "INTERPRETED",
    });

    expect(result.id).toBe("decision-123");
  });

  it("deve propagar erros de persistência do Prisma", async () => {
    mockCreate.mockRejectedValueOnce(
      new Error("Falha ao persistir decisão"),
    );

    await expect(
      persistAgentDecision({
        conversationId: "conversation-123",
        messageId: "message-123",
        interpretation,
        outcome: "INTERPRETED",
      }),
    ).rejects.toThrow("Falha ao persistir decisão");
  });
});
