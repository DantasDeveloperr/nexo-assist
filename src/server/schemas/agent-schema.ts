
import { z } from "zod";

export const agentIntentSchema = z.enum([
  "KNOWLEDGE_QUERY",
  "LIST_TICKETS",
  "CREATE_TICKET",
  "UPDATE_TICKET",
  "HUMAN_HANDOFF",
  "OUT_OF_SCOPE",
  "UNKNOWN",
]);

export const agentActionSchema = z.enum([
  "ANSWER_FROM_KNOWLEDGE",
  "LIST_TICKETS",
  "PREPARE_TICKET",
  "PREPARE_TICKET_UPDATE",
  "TRANSFER_TO_ANALYST",
  "ASK_CLARIFICATION",
  "REDIRECT_OUT_OF_SCOPE",
]);

export const agentTicketDraftSchema = z.object({
  title: z.string().trim().min(1).max(120),
  type: z.enum(["INC", "REQ"]).nullable(),
  category: z.enum([
    "ACCESS",
    "NETWORK_VPN",
    "HARDWARE",
    "SOFTWARE",
    "EMAIL",
    "OTHER",
  ]).nullable(),
});

export const agentModelInterpretationSchema = z.object({
  intent: agentIntentSchema,
  understanding: z.string().trim().min(1).max(1000),
  confidence: z.number().min(0).max(1),
  justification: z.string().trim().min(1).max(1000),
  clarificationQuestion: z.string().trim().max(500).nullable(),
  ticketDraft: agentTicketDraftSchema.nullable(),
});

export const agentInterpretationSchema =
  agentModelInterpretationSchema.extend({
    action: agentActionSchema,
  });

export type ValidatedAgentModelInterpretation = z.infer<
  typeof agentModelInterpretationSchema
>;

export type ValidatedAgentInterpretation = z.infer<
  typeof agentInterpretationSchema
>;
