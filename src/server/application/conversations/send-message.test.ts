
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  transaction: vi.fn(),
  findFirst: vi.fn(),
  count: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
}));

vi.mock("../../db/prisma", () => ({
  prisma: {
    $transaction: mocks.transaction,
  },
}));

import { prisma } from "../../db/prisma";
import { sendMessage } from "./send-message";

describe("sendMessage", () => {
  const employeeId = "employee-123";
  const conversationId = "conversation-001";

  const conversation = {
    id: conversationId,
    status: "ACTIVE",
  };

  const savedMessage = {
    id: "message-001",
    conversationId,
    senderEmployeeId: employeeId,
    senderType: "EMPLOYEE",
    content: "Preciso de ajuda com meu acesso.",
    processingStatus: "PENDING",
    createdAt: new Date("2026-11-06T12:00:00.000Z"),
    updatedAt: new Date("2026-11-06T12:00:00.000Z"),
  };

  beforeEach(() => {
    vi.clearAllMocks();

    mocks.transaction.mockImplementation(
      async (callback: (tx: unknown) => Promise<unknown>) =>
        callback({
          conversation: {
            findFirst: mocks.findFirst,
            update: mocks.update,
          },
          message: {
            count: mocks.count,
            create: mocks.create,
          },
        }),
    );

    mocks.findFirst.mockResolvedValue(conversation);
    mocks.count.mockResolvedValue(0);
    mocks.create.mockResolvedValue(savedMessage);
    mocks.update.mockResolvedValue({});
  });

  it("envia e persiste uma mensagem do funcionário", async () => {
    const result = await sendMessage(employeeId, {
      conversationId,
      content: savedMessage.content,
    });

    expect(result).toEqual({
      outcome: "SENT",
      message: savedMessage,
    });

    expect(mocks.findFirst).toHaveBeenCalledWith({
      where: {
        id: conversationId,
        employeeId,
        deletedAt: null,
      },
      select: {
        id: true,
        status: true,
      },
    });

    expect(mocks.count).toHaveBeenCalledWith({
      where: { conversationId },
    });

    expect(mocks.create).toHaveBeenCalledWith({
      data: {
        conversationId,
        senderEmployeeId: employeeId,
        senderType: "EMPLOYEE",
        content: savedMessage.content,
        processingStatus: "PENDING",
      },
    });

    expect(mocks.update).toHaveBeenCalledWith({
      where: { id: conversationId },
      data: {
        lastMessageAt: savedMessage.createdAt,
      },
    });
  });

  it("rejeita o envio quando o identificador do funcionário está vazio", async () => {
    await expect(
      sendMessage("", {
        conversationId,
        content: "Mensagem de teste",
      }),
    ).rejects.toThrow(
      "O funcionário responsável pela mensagem é obrigatório.",
    );

    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it("rejeita o envio quando o identificador da conversa está vazio", async () => {
    await expect(
      sendMessage(employeeId, {
        conversationId: " ",
        content: "Mensagem de teste",
      }),
    ).rejects.toThrow(
      "O identificador da conversa é obrigatório.",
    );

    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it("rejeita o envio quando o conteúdo está vazio", async () => {
    await expect(
      sendMessage(employeeId, {
        conversationId,
        content: " ",
      }),
    ).rejects.toThrow(
      "O conteúdo da mensagem é obrigatório.",
    );

    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it("retorna NOT_FOUND quando a conversa não pertence ao funcionário", async () => {
    mocks.findFirst.mockResolvedValue(null);

    const result = await sendMessage(employeeId, {
      conversationId,
      content: "Mensagem de teste",
    });

    expect(result).toEqual({ outcome: "NOT_FOUND" });
    expect(mocks.count).not.toHaveBeenCalled();
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it("retorna CLOSED quando a conversa está encerrada", async () => {
    mocks.findFirst.mockResolvedValue({
      ...conversation,
      status: "CLOSED",
    });

    const result = await sendMessage(employeeId, {
      conversationId,
      content: "Mensagem de teste",
    });

    expect(result).toEqual({ outcome: "CLOSED" });
    expect(mocks.count).not.toHaveBeenCalled();
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it("permite o envio da 31ª mensagem", async () => {
    mocks.count.mockResolvedValue(30);

    const result = await sendMessage(employeeId, {
      conversationId,
      content: "Última mensagem permitida",
    });

    expect(result.outcome).toBe("SENT");
    expect(mocks.create).toHaveBeenCalledOnce();
  });

  it("bloqueia o envio quando já existem 31 mensagens", async () => {
    mocks.count.mockResolvedValue(31);

    const result = await sendMessage(employeeId, {
      conversationId,
      content: "Mensagem excedente",
    });

    expect(result).toEqual({
      outcome: "MESSAGE_LIMIT_REACHED",
    });

    expect(mocks.create).not.toHaveBeenCalled();
    expect(mocks.update).not.toHaveBeenCalled();
  });

  it.each([
    "ACTIVE",
    "WAITING_FOR_ANALYST",
    "IN_PROGRESS",
  ])("permite mensagens do funcionário quando a conversa está em %s", async (status) => {
    mocks.findFirst.mockResolvedValue({
      ...conversation,
      status,
    });

    const result = await sendMessage(employeeId, {
      conversationId,
      content: "Mensagem de teste",
    });

    expect(result.outcome).toBe("SENT");
  });

  it("propaga falhas ocorridas durante a transação", async () => {
    mocks.transaction.mockRejectedValue(
      new Error("Falha simulada no banco"),
    );

    await expect(
      sendMessage(employeeId, {
        conversationId,
        content: "Mensagem de teste",
      }),
    ).rejects.toThrow("Falha simulada no banco");
  });

  it("solicita isolamento Serializable na transação", async () => {
    await sendMessage(employeeId, {
      conversationId,
      content: "Mensagem de teste",
    });

    expect(prisma.$transaction).toHaveBeenCalledWith(
      expect.any(Function),
      {
        isolationLevel: "Serializable",
      },
    );
  });
});
