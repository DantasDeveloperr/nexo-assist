import { prisma } from "../../db/prisma";

export async function getTicket(
  ticketId: string,
  requesterEmployeeId: string,
) {
  if (!ticketId.trim() || !requesterEmployeeId.trim()) {
    return null;
  }

  const ticket = await prisma.ticket.findFirst({
    where: {
      id: ticketId,
      requestedByEmployeeId: requesterEmployeeId,
    },
  });

  return ticket;
}
