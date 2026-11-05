
import { prisma } from "../../db/prisma";

export async function createConversation(employeeId: string) {
  if (!employeeId.trim()) {
    throw new Error("O funcionário responsável pela conversa é obrigatório.");
  }

  const conversation = await prisma.conversation.create({
    data: {
      employeeId,
      title: "Novo atendimento",
      status: "ACTIVE",
      waitingForEmployee: false,
    },
  });

  return conversation;
}
