
import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  mockFindFirst,
  mockUpdateMany,
  mockTransaction,
  mockConversationFindFirst,
  mockMessageCount,
  mockDecisionCreate,
  mockMessageCreate,
  mockMessageUpdate,
  mockConversationUpdate,
  mockInterpretTicketMessage,
} = vi.hoisted(() => ({
  mockFindFirst: vi.fn(),
  mockUpdateMany: vi.fn(),
  mockTransaction: vi.fn(),
  mockConversationFindFirst: vi.fn(),
  mockMessageCount: vi.fn(),
  mockDecisionCreate: vi.fn(),
  mockMessageCreate: vi.fn(),
  mockMessageUpdate: vi.fn(),
  mockConversationUpdate: vi.fn(),
  mockInterpretTicketMessage: vi.fn(),
}));

vi.mock("../../db/prisma", () => ({
  prisma: {
    message: {
      findFirst: mockFindFirst,
      updateMany: mockUpdateMany,
    },
    $transaction: mockTransaction,
  },
}));

vi.mock("../../services/ticket-ai-assistant", () => ({
  interpretTicketMessage: mockInterpretTicketMessage,
}));

import { processAgentMessage } from "./process-agent-message";

describe("processAgentMessage", () => {
  const conversationId = "conversation-123";
  const messageId = "message-123";

  const modelInterpretation = {
    intent: "UNKNOWN" as const,
    understanding: "O funcionário relatou uma situação que precisa de esclarecimento.",
    confidence: 0.95,
    justification: "Não foi possível identificar uma intenção específica.",
    clarificationQuestion: "Poderia explicar melhor o que aconteceu?",
    ticketDraft: null,
  };

  const transaction = {
    conversation: {
      findFirst: mockConversationFindFirst,
      update: mockConversationUpdate,
    },
    message: {
      count: mockMessageCount,
      create: mockMessageCreate,
      update: mockMessageUpdate,
    },
    agentDecision: {
      create: mockDecisionCreate,
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();

    mockFindFirst.mockResolvedValue({
      id: messageId,
      content: "Meu computador está apresentando um problema.",
      processingStatus: "PENDING",
      conversation: {
        id: conversationId,
        status: "ACTIVE",
        deletedAt: null,
      },
    });

    mockUpdateMany.mockResolvedValue({ count: 1 });

    mockTransaction.mockImplementation(async (callback) =>
      callback(transaction),
    );

    mockConversationFindFirst.mockResolvedValue({
      id: conversationId,
    });

    mockMessageCount.mockResolvedValue(2);

    mockDecisionCreate.mockResolvedValue({
      id: "decision-123",
    });

    mockMessageCreate.mockResolvedValue({
      id: "agent-message-123",
    });

    mockMessageUpdate.mockResolvedValue({});
    mockConversationUpdate.mockResolvedValue({});

    mockInterpretTicketMessage.mockResolvedValue(
      modelInterpretation,
    );
  });

  it("retorna NOT_FOUND quando a mensagem nao existe", async () => {
    mockFindFirst.mockResolvedValue(null);

    const result = await processAgentMessage({
      conversationId,
      messageId,
    });

    expect(result).toEqual({
      status: "NOT_FOUND",
    });

    expect(mockInterpretTicketMessage).not.toHaveBeenCalled();
    expect(mockUpdateMany).not.toHaveBeenCalled();
  });

  it("ignora mensagens de conversas que nao estao ativas", async () => {
    mockFindFirst.mockResolvedValue({
      id: messageId,
      content: "Preciso de ajuda.",
      processingStatus: "PENDING",
      conversation: {
        id: conversationId,
        status: "WAITING_FOR_ANALYST",
        deletedAt: null,
      },
    });

    const result = await processAgentMessage({
      conversationId,
      messageId,
    });

    expect(result).toEqual({
      status: "SKIPPED",
      reason: "CONVERSATION_NOT_ACTIVE",
    });

    expect(mockUpdateMany).not.toHaveBeenCalled();
    expect(mockInterpretTicketMessage).not.toHaveBeenCalled();
  });

  it("ignora mensagens que ja foram processadas ou reivindicadas", async () => {
    mockUpdateMany.mockResolvedValue({ count: 0 });

    const result = await processAgentMessage({
      conversationId,
      messageId,
    });

    expect(result).toEqual({
      status: "SKIPPED",
      reason: "MESSAGE_ALREADY_PROCESSED_OR_CLAIMED",
    });

    expect(mockInterpretTicketMessage).not.toHaveBeenCalled();
  });

  it("processa a mensagem, registra a decisao e salva a resposta do agente", async () => {
    const result = await processAgentMessage({
      conversationId,
      messageId,
    });

    expect(result).toEqual({
      status: "PROCESSED",
      action: "ASK_CLARIFICATION",
    });

    expect(mockInterpretTicketMessage).toHaveBeenCalledWith(
      "Meu computador está apresentando um problema.",
    );

    expect(mockDecisionCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        conversationId,
        messageId,
        intent: "UNKNOWN",
        action: "ASK_CLARIFICATION",
        outcome: "RESPONSE_SENT",
      }),
    });

    expect(mockMessageCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        conversationId,
        senderType: "AGENT",
        senderEmployeeId: null,
        content: "Poderia explicar melhor o que aconteceu?",
        processingStatus: "NOT_REQUIRED",
      }),
      select: {
        id: true,
      },
    });

    expect(mockMessageUpdate).toHaveBeenCalledWith({
      where: { id: messageId },
      data: {
        processingStatus: "COMPLETED",
      },
    });

    expect(mockConversationUpdate).toHaveBeenCalledWith({
      where: { id: conversationId },
      data: {
        lastMessageAt: expect.any(Date),
      },
    });
  });

  it("nao envia resposta quando a conversa deixa de estar ativa", async () => {
    mockConversationFindFirst.mockResolvedValue(null);

    const result = await processAgentMessage({
      conversationId,
      messageId,
    });

    expect(result).toEqual({
      status: "SKIPPED",
      reason: "RESPONSE_NOT_SENT",
    });

    expect(mockDecisionCreate).not.toHaveBeenCalled();
    expect(mockMessageCreate).not.toHaveBeenCalled();

    expect(mockMessageUpdate).toHaveBeenCalledWith({
      where: { id: messageId },
      data: {
        processingStatus: "NOT_REQUIRED",
      },
    });
  });

  it("nao envia resposta quando o limite de mensagens foi atingido", async () => {
    mockMessageCount.mockResolvedValue(31);

    const result = await processAgentMessage({
      conversationId,
      messageId,
    });

    expect(result).toEqual({
      status: "SKIPPED",
      reason: "RESPONSE_NOT_SENT",
    });

    expect(mockDecisionCreate).not.toHaveBeenCalled();
    expect(mockMessageCreate).not.toHaveBeenCalled();

    expect(mockMessageUpdate).toHaveBeenCalledWith({
      where: { id: messageId },
      data: {
        processingStatus: "FAILED",
      },
    });
  });

  it("marca a mensagem como FAILED quando ocorre uma falha no processamento", async () => {
    mockInterpretTicketMessage.mockRejectedValue(
      new Error("Falha simulada no Gemini."),
    );

    await expect(
      processAgentMessage({
        conversationId,
        messageId,
      }),
    ).rejects.toThrow("Falha simulada no Gemini.");

    expect(mockUpdateMany).toHaveBeenLastCalledWith({
      where: {
        id: messageId,
        processingStatus: "PROCESSING",
      },
      data: {
        processingStatus: "FAILED",
      },
    });
  });
});
