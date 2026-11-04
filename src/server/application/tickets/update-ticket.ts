import { prisma } from "../../db/prisma";
import type { UpdateTicketInput } from "../../schemas/ticket-schema";
import { canReopenResolvedTicket } from "../../services/ticket-reopening";
import { canTransitionTicketStatus } from "../../services/ticket-status-transition";

const editableTicketStatuses = [
  "OPEN",
  "IN_PROGRESS",
  "WAITING_FOR_EMPLOYEE",
] as const;

type UpdateTicketResult =
  | { outcome: "NOT_FOUND" }
  | { outcome: "CLOSED" }
  | { outcome: "REOPEN_NOT_ALLOWED" }
  | { outcome: "REOPEN_EXPIRED" }
  | { outcome: "INVALID_TRANSITION" }
  | { outcome: "STATUS_NOT_EDITABLE" }
  | {
      outcome: "UPDATED";
      ticket: Awaited<ReturnType<typeof prisma.ticket.update>>;
    };

export async function updateTicket(
  ticketId: string,
  requesterEmployeeId: string,
  input: UpdateTicketInput,
): Promise<UpdateTicketResult> {
  if (!ticketId.trim() || !requesterEmployeeId.trim()) {
    return { outcome: "NOT_FOUND" };
  }

  const existingTicket = await prisma.ticket.findFirst({
    where: {
      id: ticketId,
      requestedByEmployeeId: requesterEmployeeId,
    },
  });

  if (!existingTicket) {
    return { outcome: "NOT_FOUND" };
  }

  const { status: newStatus, ...otherFields } = input;

  const hasTextChanges =
    otherFields.title !== undefined ||
    otherFields.description !== undefined;

  if (existingTicket.status === "CLOSED") {
    return { outcome: "CLOSED" };
  }

  if (existingTicket.status === "RESOLVED") {
    const isReopening = newStatus === "IN_PROGRESS";

    if (!isReopening || hasTextChanges) {
      return { outcome: "REOPEN_NOT_ALLOWED" };
    }

    if (!canReopenResolvedTicket(existingTicket.resolvedAt, new Date())) {
      return { outcome: "REOPEN_EXPIRED" };
    }

    if (!canTransitionTicketStatus(existingTicket.status, newStatus)) {
      return { outcome: "INVALID_TRANSITION" };
    }

    const ticket = await prisma.ticket.update({
      where: { id: ticketId },
      data: {
        status: "IN_PROGRESS",
        resolvedAt: null,
      },
    });

    return {
      outcome: "UPDATED",
      ticket,
    };
  }

  if (
    !editableTicketStatuses.includes(
      existingTicket.status as (typeof editableTicketStatuses)[number],
    )
  ) {
    return { outcome: "STATUS_NOT_EDITABLE" };
  }

  const now = new Date();

  if (
    newStatus !== undefined &&
    newStatus !== existingTicket.status &&
    !canTransitionTicketStatus(existingTicket.status, newStatus)
  ) {
    return { outcome: "INVALID_TRANSITION" };
  }

  const isResolving =
    newStatus === "RESOLVED" &&
    existingTicket.status !== "RESOLVED";

  const ticket = await prisma.ticket.update({
    where: { id: ticketId },
    data: {
      ...otherFields,
      ...(newStatus !== undefined ? { status: newStatus } : {}),
      ...(isResolving ? { resolvedAt: now } : {}),
    },
  });

  return {
    outcome: "UPDATED",
    ticket,
  };
}
