
import type { TicketType } from "@/types/ticket";

export function classifyTicketType(
  message: string,
): TicketType | null {
  const normalizedMessage = message.trim().toLowerCase();

  if (!normalizedMessage) {
    return null;
  }

  const incidentKeywords = [
    "parou de funcionar",
    "não funciona",
    "nao funciona",
    "erro",
    "falha",
    "quebrou",
    "está lento",
    "esta lento",
    "indisponível",
    "indisponivel",
  ];

  const requestKeywords = [
    "preciso de acesso",
    "solicitar acesso",
    "instalar",
    "instalação",
    "instalacao",
    "novo notebook",
    "novo monitor",
    "solicitar equipamento",
    "criar usuário",
    "criar usuario",
  ];

  const hasIncidentKeyword = incidentKeywords.some(
    (keyword) => normalizedMessage.includes(keyword),
  );

  const hasRequestKeyword = requestKeywords.some(
    (keyword) => normalizedMessage.includes(keyword),
  );

  if (hasIncidentKeyword && hasRequestKeyword) {
    return null;
  }

  if (hasIncidentKeyword) {
    return "INC";
  }

  if (hasRequestKeyword) {
    return "REQ";
  }

  return null;
}
