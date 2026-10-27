
/**
 * Tipos fundamentais do domínio de chamados do Nexo Assist.
 * Este arquivo define os conceitos e seus valores permitidos.
 */

export type TicketType = "INC" | "REQ";

export type TicketCategory =
  | "ACCESS"
  | "NETWORK_VPN"
  | "HARDWARE"
  | "SOFTWARE"
  | "EMAIL"
  | "OTHER";

export type TicketPriority = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type TicketStatus =
  | "OPEN"
  | "IN_PROGRESS"
  | "WAITING_FOR_EMPLOYEE"
  | "RESOLVED"
  | "CLOSED";

export interface Ticket {
  id: string;
  title: string;
  description: string;
  type: TicketType;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  affectedEmployeeId: string;
  createdAt: string;
  updatedAt: string;
}
