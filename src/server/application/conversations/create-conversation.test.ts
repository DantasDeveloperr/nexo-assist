import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../db/prisma", () => ({
  prisma: {
    conversation: {
      create: vi.fn(),
    },
  },
}));

import { prisma } from "../../db/prisma";
import { createConversation } from "./create-conversation";

describe("createConversation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("cria uma conversa vinculada ao funcionário informado", async () => {
    const employeeId = "employee-123";

    const savedConversation = {
      id: "conversation-001",
      employeeId,
      title: "Novo atendimento",
      status: "ACTIVE",
      waitingForEmployee: false,
    };

    vi.mocked(prisma.conversation.create).mockResolvedValue(
      savedConversation as never,
    );

    const result = await createConversation(employeeId);

    expect(result).toEqual(savedConversation);

    expect(prisma.conversation.create).toHaveBeenCalledWith({
      data: {
        employeeId,
        title: "Novo atendimento",
        status: "ACTIVE",
        waitingForEmployee: false,
      },
    });
  });

  it("rejeita a criação quando o identificador do funcionário está vazio", async () => {
    await expect(createConversation("")).rejects.toThrow(
      "O funcionário responsável pela conversa é obrigatório.",
    );

    expect(prisma.conversation.create).not.toHaveBeenCalled();
  });

  it("rejeita a criação quando o identificador contém apenas espaços", async () => {
    await expect(createConversation("   ")).rejects.toThrow(
      "O funcionário responsável pela conversa é obrigatório.",
    );

    expect(prisma.conversation.create).not.toHaveBeenCalled();
  });

  it("propaga a falha quando o banco de dados não consegue criar a conversa", async () => {
    vi.mocked(prisma.conversation.create).mockRejectedValue(
      new Error("Falha simulada no banco"),
    );

    await expect(
      createConversation("employee-123"),
    ).rejects.toThrow("Falha simulada no banco");
  });
});