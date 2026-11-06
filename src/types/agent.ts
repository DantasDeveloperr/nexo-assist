
import type { TicketCategory, TicketType } from "./ticket";

export type AgentIntent =
  | "KNOWLEDGE_QUERY"
  | "LIST_TICKETS"
  | "CREATE_TICKET"
  | "UPDATE_TICKET"
  | "HUMAN_HANDOFF"
  | "OUT_OF_SCOPE"
  | "UNKNOWN";

export type AgentAction =
  | "ANSWER_FROM_KNOWLEDGE"
  | "LIST_TICKETS"
  | "PREPARE_TICKET"
  | "PREPARE_TICKET_UPDATE"
  | "TRANSFER_TO_ANALYST"
  | "ASK_CLARIFICATION"
  | "REDIRECT_OUT_OF_SCOPE";

export interface AgentTicketDraft {
  title: string;
  type: TicketType | null;
  category: TicketCategory | null;
}

/**
 * Interpretação produzida pelo modelo de IA.
 * Não contém a ação executável, pois essa decisão
 * pertence ao orquestrador do backend.
 */
export interface AgentModelInterpretation {
  intent: AgentIntent;
  understanding: string;
  confidence: number;
  justification: string;
  clarificationQuestion: string | null;
  ticketDraft: AgentTicketDraft | null;
}

/**
 * Resultado completo após o backend determinar
 * qual ação deve ser tomada.
 */
export interface AgentInterpretation
  extends AgentModelInterpretation {
  action: AgentAction;
}
