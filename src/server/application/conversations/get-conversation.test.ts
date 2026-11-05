import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../db/prisma", () => ({
  prisma: {
    conversation: {
      findFirst: vi.fn(),
    },
  },
}));

import { prisma } from "../../db/prisma";
import { getConversation } from "./get-conversation";

describe("getConversation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("retorna a conversa com mensagens e decisões do agente", async () => {
    const conversationId = "conversation-001";
    const employeeId = "employee-123";

    const conversation = {
      id: conversationId,
      title: "Problema com VPN",
      status: "ACTIVE",
      messages: [
        {
          id: "message-001",
          senderType: "EMPLOYEE",
          content: "Não consigo conectar à VPN.",
          agentDecisions: [],
        },
        {
          id: "message-002",
          senderType: "AGENT",
          content: "Vou verificar o problema.",
          agentDecisions: [
            {
              intent: "INCIDENT",
              action: "CONSULT_HELP_CENTER",
              confidence: 0.95,
            },
          ],
        },
      ],
    };

    vi.mocked(prisma.conversation.findFirst).mockResolvedValue(
      conversation as never,
    );

    const result = await getConversation(conversationId, employeeId);

    expect(result).toEqual(conversation);

    expect(prisma.conversation.findFirst).toHaveBeenCalledWith({
      where: {
        id: conversationId,
        employeeId,
        deletedAt: null,
      },
      select: {
        id: true,
        title: true,
        status: true,
        waitingForEmployee: true,
        assignedAnalystId: true,
        lastMessageAt: true,
        createdAt: true,
        updatedAt: true,
        closedAt: true,
        messages: {
          orderBy: {
            createdAt: "asc",
          },
          select: {
            id: true,
            senderType: true,
            content: true,
            processingStatus: true,
            createdAt: true,
            agentDecisions: {
              select: {
                intent: true,
                understanding: true,
                action: true,
                confidence: true,
                justification: true,
                outcome: true,
                modelVersion: true,
                promptVersion: true,
                createdAt: true,
              },
            },
          },
        },
      },
    });
  });

  it("retorna null quando a conversa não existe ou não pertence ao funcionário", async () => {
    vi.mocked(prisma.conversation.findFirst).mockResolvedValue(null);

    const result = await getConversation(
      "conversation-inexistente",
      "employee-123",
    );

    expect(result).toBeNull();
  });

  it("retorna null quando o identificador da conversa está vazio", async () => {
    const result = await getConversation("", "employee-123");

    expect(result).toBeNull();
    expect(prisma.conversation.findFirst).not.toHaveBeenCalled();
  });

  it("retorna null quando o identificador do funcionário está vazio", async () => {
    const result = await getConversation("conversation-001", "");

    expect(result).toBeNull();
    expect(prisma.conversation.findFirst).not.toHaveBeenCalled();
  });

  it("retorna null quando os identificadores contêm apenas espaços", async () => {
    const result = await getConversation("   ", "   ");

    expect(result).toBeNull();
    expect(prisma.conversation.findFirst).not.toHaveBeenCalled();
  });

  it("propaga a falha quando o banco não consegue consultar a conversa", async () => {
    vi.mocked(prisma.conversation.findFirst).mockRejectedValue(
      new Error("Falha simulada no banco"),
    );

    await expect(
      getConversation("conversation-001", "employee-123"),
    ).rejects.toThrow("Falha simulada no banco");
  });
});