
import { prisma } from "../../db/prisma";
import type { SendMessageInput } from "../../../types/message";

const MAX_MESSAGES_PER_CONVERSATION = 31;
const RESERVED_RESPONSE_MESSAGES = 1;
const MAX_MESSAGES_BEFORE_EMPLOYEE_SEND =
  MAX_MESSAGES_PER_CONVERSATION - RESERVED_RESPONSE_MESSAGES;

type SendMessageResult =
  | {
      outcome: "NOT_FOUND";
    }
  | {
      outcome: "CLOSED";
    }
  | {
      outcome: "MESSAGE_LIMIT_REACHED";
    }
  | {
      outcome: "SENT";
      message: Awaited<ReturnType<typeof prisma.message.create>>;
    };

export async function sendMessage(
  employeeId: string,
  input: SendMessageInput,
): Promise<SendMessageResult> {
  if (!employeeId.trim()) {
    throw new Error("O funcionário responsável pela mensagem é obrigatório.");
  }

  if (!input.conversationId.trim()) {
    throw new Error("O identificador da conversa é obrigatório.");
  }

  if (!input.content.trim()) {
    throw new Error("O conteúdo da mensagem é obrigatório.");
  }

  return prisma.$transaction(
    async (tx) => {
      const conversation = await tx.conversation.findFirst({
        where: {
          id: input.conversationId,
          employeeId,
          deletedAt: null,
        },
        select: {
          id: true,
          status: true,
        },
      });

      if (!conversation) {
        return { outcome: "NOT_FOUND" };
      }

      if (conversation.status === "CLOSED") {
        return { outcome: "CLOSED" };
      }

      const messageCount = await tx.message.count({
        where: {
          conversationId: conversation.id,
        },
      });

      if (messageCount >= MAX_MESSAGES_BEFORE_EMPLOYEE_SEND) {
        return { outcome: "MESSAGE_LIMIT_REACHED" };
      }

      const message = await tx.message.create({
        data: {
          conversationId: conversation.id,
          senderEmployeeId: employeeId,
          senderType: "EMPLOYEE",
          content: input.content.trim(),
          processingStatus: "PENDING",
        },
      });

      await tx.conversation.update({
        where: {
          id: conversation.id,
        },
        data: {
          lastMessageAt: message.createdAt,
        },
      });

      return {
        outcome: "SENT",
        message,
      };
    },
    {
      isolationLevel: "Serializable",
    },
  );
}
