
import type { TicketPriority } from "@/types/ticket";

export type TicketImpact =
  | "ENTIRE_TEAM_STOPPED"
  | "ONE_PERSON_BLOCKED"
  | "WORK_IMPAIRED"
  | "NO_SIGNIFICANT_IMPACT";

export type TicketUrgency =
  | "SAME_DAY_COMMITMENT_AT_RISK"
  | "NO_WORKAROUND"
  | "WORKAROUND_AVAILABLE"
  | "NO_URGENCY";

export interface PriorityAssessment {
  impact: TicketImpact;
  urgency: TicketUrgency;
}

export interface PriorityDecision {
  priority: TicketPriority;
  rationale: string;
}

export function assessTicketPriority(
  assessment: PriorityAssessment,
): PriorityDecision | null {
  const { impact, urgency } = assessment;

  if (impact === "ENTIRE_TEAM_STOPPED") {
    return {
      priority: "CRITICAL",
      rationale: "A equipe inteira está impedida de trabalhar.",
    };
  }

  if (impact === "ONE_PERSON_BLOCKED") {
  return {
    priority: "HIGH",
    rationale: "Uma pessoa está impedida de trabalhar.",
  };
}

if (urgency === "SAME_DAY_COMMITMENT_AT_RISK") {
  return {
    priority: "HIGH",
    rationale: "Há um compromisso do mesmo dia em risco.",
  };
}

  if (
    impact === "WORK_IMPAIRED" &&
    urgency === "WORKAROUND_AVAILABLE"
  ) {
    return {
      priority: "MEDIUM",
      rationale:
        "O trabalho está prejudicado, mas existe uma alternativa.",
    };
  }

  if (
    impact === "NO_SIGNIFICANT_IMPACT" &&
    urgency === "NO_URGENCY"
  ) {
    return {
      priority: "LOW",
      rationale: "Não há impacto significativo nem urgência.",
    };
  }

  return null;
}
