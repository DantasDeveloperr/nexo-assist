import { prisma } from "../../db/prisma";
import { interpretTicketMessage } from "../../services/ticket-ai-assistant";
import { orchestrateAgent } from "./orchestrate-agent";
import type { AgentInterpretation } from "../../../types/agent";

interface ProcessAgentMessageInput {
  conversationId: string;
  messageId: string;
}

type ProcessAgentMessageResult =
  | { status: "PROCESSED"; action: AgentInterpretation["action"] }
  | { status: "SKIPPED"; reason: string }
  | { status: "NOT_FOUND" };

function buildAgentResponse(
  interpretation: AgentInterpretation,
): string {
  switch (interpretation.action) {
    case "ASK_CLARIFICATION":
      return (
        interpretation.clarificationQuestion ??
        "Não consegui compreender completamente sua solicitação. Poderia explicar um pouco melhor?"
      );

    case "REDIRECT_OUT_OF_SCOPE":
      return (
        "Posso ajudar com solicitações relacionadas à área de TI. " +
        "Para esse assunto, procure o setor responsável pelo atendimento."
      );

    case "ANSWER_FROM_KNOWLEDGE":
      return (
        "Entendi sua dúvida, mas ainda não consegui consultar a central de ajuda " +
        "para localizar uma orientação confiável. Poderia aguardar enquanto essa etapa é concluída?"
      );

    case "LIST_TICKETS":
      return (
        "Entendi que você deseja consultar seus chamados. " +
        "Essa consulta ainda não está disponível nesta etapa do atendimento."
      );

    case "PREPARE_TICKET":
      return (
        "Entendi que você deseja abrir um chamado. " +
        "A preparação e a confirmação do chamado ainda não estão disponíveis nesta etapa."
      );

    case "PREPARE_TICKET_UPDATE":
      return (
        "Entendi que você deseja atualizar um chamado. " +
        "A preparação e a confirmação dessa alteração ainda não estão disponíveis nesta etapa."
      );

    case "TRANSFER_TO_ANALYST":
      return (
        "Entendi que você precisa de atendimento humano. " +
        "A transferência para um analista ainda não está disponível nesta etapa. " +
        "Sua solicitação não foi encaminhada."
      );

    case "ASK_CLARIFICATION":
      return (
        interpretation.clarificationQuestion ??
        "Poderia explicar um pouco melhor o que você precisa?"
      );
  }
}

export async function processAgentMessage({
  conversationId,
  messageId,
}: ProcessAgentMessageInput): Promise<ProcessAgentMessageResult> {
  const message = await prisma.message.findFirst({
    where: {
      id: messageId,
      conversationId,
      senderType: "EMPLOYEE",
    },
    select: {
      id: true,
      content: true,
      processingStatus: true,
      conversation: {
        select: {
          id: true,
          status: true,
          deletedAt: true,
        },
      },
    },
  });

  if (!message || !message.conversation) {
    return { status: "NOT_FOUND" };
  }

  if (
    message.conversation.deletedAt !== null ||
    message.conversation.status !== "ACTIVE"
  ) {
    return {
      status: "SKIPPED",
      reason: "CONVERSATION_NOT_ACTIVE",
    };
  }

  const claimedMessage = await prisma.message.updateMany({
    where: {
      id: messageId,
      conversationId,
      senderType: "EMPLOYEE",
      processingStatus: "PENDING",
    },
    data: {
      processingStatus: "PROCESSING",
    },
  });

  if (claimedMessage.count === 0) {
    return {
      status: "SKIPPED",
      reason: "MESSAGE_ALREADY_PROCESSED_OR_CLAIMED",
    };
  }

  try {
    const modelInterpretation = await interpretTicketMessage(
      message.content,
    );

    const interpretation = orchestrateAgent(modelInterpretation);
    const responseContent = buildAgentResponse(interpretation);

    const result = await prisma.$transaction(
      async (transaction) => {
        const currentConversation =
          await transaction.conversation.findFirst({
            where: {
              id: conversationId,
              status: "ACTIVE",
              deletedAt: null,
            },
            select: {
              id: true,
            },
          });

        if (!currentConversation) {
          await transaction.message.update({
            where: { id: messageId },
            data: {
              processingStatus: "NOT_REQUIRED",
            },
          });

          return { sent: false };
        }

        const messageCount = await transaction.message.count({
          where: { conversationId },
        });

        // A conversa permite até 31 mensagens.
        // A última posição fica reservada para a resposta do agente.
        if (messageCount >= 31) {
          await transaction.message.update({
            where: { id: messageId },
            data: {
              processingStatus: "FAILED",
            },
          });

          return { sent: false };
        }

        await transaction.agentDecision.create({
          data: {
            conversationId,
            messageId,
            intent: interpretation.intent,
            understanding: interpretation.understanding,
            action: interpretation.action,
            confidence: interpretation.confidence,
            justification: interpretation.justification,
            outcome: "RESPONSE_SENT",
            modelVersion:
              process.env.GEMINI_MODEL ?? "gemini-3.5-flash-lite",
            promptVersion:
              process.env.AGENT_PROMPT_VERSION ?? null,
          },
        });

        const agentMessage = await transaction.message.create({
          data: {
            conversationId,
            senderType: "AGENT",
            senderEmployeeId: null,
            content: responseContent,
            processingStatus: "NOT_REQUIRED",
          },
          select: {
            id: true,
          },
        });

        await transaction.message.update({
          where: { id: messageId },
          data: {
            processingStatus: "COMPLETED",
          },
        });

        await transaction.conversation.update({
          where: { id: conversationId },
          data: {
            lastMessageAt: new Date(),
          },
        });

        return {
          sent: true,
          agentMessageId: agentMessage.id,
        };
      },
      {
        isolationLevel: "Serializable",
      },
    );

    if (!result.sent) {
      return {
        status: "SKIPPED",
        reason: "RESPONSE_NOT_SENT",
      };
    }

    return {
      status: "PROCESSED",
      action: interpretation.action,
    };
  } catch (error) {
    await prisma.message.updateMany({
      where: {
        id: messageId,
        processingStatus: "PROCESSING",
      },
      data: {
        processingStatus: "FAILED",
      },
    });

    throw error;
  }
}