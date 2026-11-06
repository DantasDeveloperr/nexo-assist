
import { prisma } from "../../db/prisma";
import type { AgentInterpretation } from "../../../types/agent";

interface PersistAgentDecisionInput {
  conversationId: string;
  messageId: string;
  interpretation: AgentInterpretation;
  outcome: string;
  modelVersion?: string | null;
  promptVersion?: string | null;
}

export async function persistAgentDecision({
  conversationId,
  messageId,
  interpretation,
  outcome,
  modelVersion = null,
  promptVersion = null,
}: PersistAgentDecisionInput) {
  return prisma.agentDecision.create({
    data: {
      conversationId,
      messageId,
      intent: interpretation.intent,
      understanding: interpretation.understanding,
      action: interpretation.action,
      confidence: interpretation.confidence,
      justification: interpretation.justification,
      outcome,
      modelVersion,
      promptVersion,
    },
  });
}
