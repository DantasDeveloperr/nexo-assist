
import type {
  AgentAction,
  AgentInterpretation,
  AgentModelInterpretation,
} from "../../../types/agent";

const MINIMUM_CONFIDENCE = 0.7;

function askForClarification(
  interpretation: AgentModelInterpretation,
): AgentInterpretation {
  return {
    ...interpretation,
    action: "ASK_CLARIFICATION",
    clarificationQuestion:
      interpretation.clarificationQuestion?.trim() ||
      "Não consegui compreender completamente sua solicitação. Poderia explicar um pouco melhor?",
  };
}

function hasCompleteTicketDraft(
  interpretation: AgentModelInterpretation,
): boolean {
  const draft = interpretation.ticketDraft;

  return Boolean(
    draft &&
      draft.title.trim() &&
      draft.type &&
      draft.category,
  );
}

function resolveAction(
  interpretation: AgentModelInterpretation,
): AgentAction {
  switch (interpretation.intent) {
    case "KNOWLEDGE_QUERY":
      return "ANSWER_FROM_KNOWLEDGE";

    case "LIST_TICKETS":
      return "LIST_TICKETS";

    case "CREATE_TICKET":
      return "PREPARE_TICKET";

    case "UPDATE_TICKET":
      return "PREPARE_TICKET_UPDATE";

    case "HUMAN_HANDOFF":
      return "TRANSFER_TO_ANALYST";

    case "OUT_OF_SCOPE":
      return "REDIRECT_OUT_OF_SCOPE";

    case "UNKNOWN":
      return "ASK_CLARIFICATION";
  }
}

export function orchestrateAgent(
  interpretation: AgentModelInterpretation,
): AgentInterpretation {
  if (interpretation.intent === "HUMAN_HANDOFF") {
    return {
      ...interpretation,
      action: "TRANSFER_TO_ANALYST",
    };
  }

  if (interpretation.confidence < MINIMUM_CONFIDENCE) {
    return askForClarification(interpretation);
  }

  if (
    interpretation.intent === "CREATE_TICKET" ||
    interpretation.intent === "UPDATE_TICKET"
  ) {
    if (!hasCompleteTicketDraft(interpretation)) {
      return askForClarification(interpretation);
    }
  }

  const action = resolveAction(interpretation);

  if (action === "ASK_CLARIFICATION") {
    return askForClarification(interpretation);
  }

  return {
    ...interpretation,
    action,
  };
}
