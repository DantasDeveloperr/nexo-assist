import { prisma } from "../../db/prisma";

export async function getConversation(
  conversationId: string,
  employeeId: string,
) {
  if (!conversationId.trim() || !employeeId.trim()) {
    return null;
  }

  const conversation = await prisma.conversation.findFirst({
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

  return conversation;
}
