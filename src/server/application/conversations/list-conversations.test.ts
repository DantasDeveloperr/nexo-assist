import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../db/prisma", () => ({
  prisma: {
    conversation: {
      findMany: vi.fn(),
    },
  },
}));

import { prisma } from "../../db/prisma";
import { listConversations } from "./list-conversations";

describe("listConversations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("lista somente as conversas do funcionário e exclui as removidas", async () => {
    const employeeId = "employee-123";

    const conversations = [
      {
        id: "conversation-002",
        title: "Problema com VPN",
        status: "ACTIVE",
      },
      {
        id: "conversation-001",
        title: "Solicitação de acesso",
        status: "CLOSED",
      },
    ];

    vi.mocked(prisma.conversation.findMany).mockResolvedValue(
      conversations as never,
    );

    const result = await listConversations(employeeId);

    expect(result).toEqual(conversations);

    expect(prisma.conversation.findMany).toHaveBeenCalledWith({
      where: {
        employeeId,
        deletedAt: null,
      },
      orderBy: {
        updatedAt: "desc",
      },
      select: {
        id: true,
        title: true,
        status: true,
        waitingForEmployee: true,
        lastMessageAt: true,
        createdAt: true,
        updatedAt: true,
        closedAt: true,
      },
    });
  });

  it("retorna uma lista vazia quando o funcionário não possui conversas", async () => {
    vi.mocked(prisma.conversation.findMany).mockResolvedValue([]);

    const result = await listConversations("employee-123");

    expect(result).toEqual([]);
  });

  it("rejeita a consulta quando o identificador do funcionário está vazio", async () => {
    await expect(listConversations("")).rejects.toThrow(
      "O funcionário responsável pelas conversas é obrigatório.",
    );

    expect(prisma.conversation.findMany).not.toHaveBeenCalled();
  });

  it("rejeita a consulta quando o identificador contém apenas espaços", async () => {
    await expect(listConversations("   ")).rejects.toThrow(
      "O funcionário responsável pelas conversas é obrigatório.",
    );

    expect(prisma.conversation.findMany).not.toHaveBeenCalled();
  });

  it("propaga a falha quando o banco não consegue listar as conversas", async () => {
    vi.mocked(prisma.conversation.findMany).mockRejectedValue(
      new Error("Falha simulada no banco"),
    );

    await expect(
      listConversations("employee-123"),
    ).rejects.toThrow("Falha simulada no banco");
  });
});