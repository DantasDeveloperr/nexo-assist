
import { prisma } from "../../db/prisma";

export async function listConversations(employeeId: string) {
  if (!employeeId.trim()) {
    throw new Error("O funcionário responsável pelas conversas é obrigatório.");
  }

  const conversations = await prisma.conversation.findMany({
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

  return conversations;
}
