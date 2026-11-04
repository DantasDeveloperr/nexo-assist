
import { prisma } from "../../db/prisma";
import type { CreateTicketInput } from "../../schemas/ticket-schema";
import { findDuplicateTicket } from "../../services/ticket-duplicate";
import { findReopenableResolvedTicket } from "../../services/ticket-reopening";
import { canTransitionTicketStatus } from "../../services/ticket-status-transition";

type CreateTicketResult =
  | {
      outcome: "DUPLICATE";
      ticket: NonNullable<
        Awaited<ReturnType<typeof prisma.ticket.findFirst>>
      >;
    }
  | {
      outcome: "REOPENED";
      ticket: Awaited<ReturnType<typeof prisma.ticket.update>>;
    }
  | {
      outcome: "CREATED";
      ticket: Awaited<ReturnType<typeof prisma.ticket.create>>;
    };

export async function createTicket(
  input: CreateTicketInput,
  requesterEmployeeId: string,
): Promise<CreateTicketResult> {
  if (!requesterEmployeeId.trim()) {
    throw new Error("O solicitante do chamado é obrigatório.");
  }

  const ticketData = {
    title: input.title,
    type: input.type,
    category: input.category,
    affectedEmployeeId: input.affectedEmployeeId,
  };

  const activeTickets = await prisma.ticket.findMany({
    where: {
      requestedByEmployeeId: requesterEmployeeId,
      affectedEmployeeId: input.affectedEmployeeId,
      type: input.type,
      category: input.category,
      status: {
        in: ["OPEN", "IN_PROGRESS", "WAITING_FOR_EMPLOYEE"],
      },
    },
  });

  const duplicateTicket = findDuplicateTicket(
    ticketData,
    activeTickets,
  );

  if (duplicateTicket) {
    return {
      outcome: "DUPLICATE",
      ticket: duplicateTicket,
    };
  }

  const resolvedTickets = await prisma.ticket.findMany({
    where: {
      requestedByEmployeeId: requesterEmployeeId,
      affectedEmployeeId: input.affectedEmployeeId,
      type: input.type,
      category: input.category,
      status: "RESOLVED",
      resolvedAt: {
        not: null,
      },
    },
  });

  const ticketToReopen = findReopenableResolvedTicket(
    ticketData,
    resolvedTickets,
  );

  if (ticketToReopen) {
    const canTransition = canTransitionTicketStatus(
      ticketToReopen.status,
      "IN_PROGRESS",
    );

    if (!canTransition) {
      throw new Error(
        "Não foi possível reabrir o chamado. Tente novamente.",
      );
    }

    const ticket = await prisma.ticket.update({
      where: {
        id: ticketToReopen.id,
      },
      data: {
        status: "IN_PROGRESS",
        resolvedAt: null,
      },
    });

    return {
      outcome: "REOPENED",
      ticket,
    };
  }

  const ticket = await prisma.ticket.create({
    data: {
      ...input,
      requestedByEmployeeId: requesterEmployeeId,
    },
  });

  return {
    outcome: "CREATED",
    ticket,
  };
}
