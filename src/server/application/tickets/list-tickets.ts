
import { prisma } from "../../db/prisma";
import type { TicketStatus } from "../../../types/ticket";

interface ListTicketsFilters {
  status?: TicketStatus;
  affectedEmployeeId?: string;
}

export async function listTickets(
  requesterEmployeeId: string,
  filters: ListTicketsFilters = {},
) {
  if (!requesterEmployeeId.trim()) {
    throw new Error("O solicitante dos chamados é obrigatório.");
  }

  const tickets = await prisma.ticket.findMany({
    where: {
      requestedByEmployeeId: requesterEmployeeId,
      ...(filters.affectedEmployeeId
        ? { affectedEmployeeId: filters.affectedEmployeeId }
        : {}),
      ...(filters.status ? { status: filters.status } : {}),
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return tickets;
}
