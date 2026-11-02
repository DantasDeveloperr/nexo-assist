
const REOPENING_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

type NewTicketData = {
  title: string;
  type: string;
  category: string;
  affectedEmployeeId: string;
};

type ResolvedTicket = NewTicketData & {
  id: string;
  status: string;
  resolvedAt: Date | null;
};

function normalizeTitle(title: string): string {
  return title
    .trim()
    .replace(/\s+/g, " ")
    .toLocaleLowerCase("pt-BR");
}

export function canReopenResolvedTicket(
  resolvedAt: Date | null,
  now: Date = new Date(),
): boolean {
  if (resolvedAt === null) {
    return false;
  }

  const resolvedTime = resolvedAt.getTime();
  const currentTime = now.getTime();

  if (
    !Number.isFinite(resolvedTime) ||
    !Number.isFinite(currentTime) ||
    resolvedTime > currentTime
  ) {
    return false;
  }

  return currentTime - resolvedTime <= REOPENING_WINDOW_MS;
}

export function findReopenableResolvedTicket(
  newTicket: NewTicketData,
  existingTickets: ResolvedTicket[],
  now: Date = new Date(),
): ResolvedTicket | null {
  const normalizedNewTitle = normalizeTitle(newTicket.title);

  const eligibleTickets = existingTickets.filter((ticket) => {
    return (
      ticket.status === "RESOLVED" &&
      ticket.affectedEmployeeId === newTicket.affectedEmployeeId &&
      ticket.type === newTicket.type &&
      ticket.category === newTicket.category &&
      normalizeTitle(ticket.title) === normalizedNewTitle &&
      canReopenResolvedTicket(ticket.resolvedAt, now)
    );
  });

  eligibleTickets.sort((a, b) => {
    return (
      (b.resolvedAt?.getTime() ?? 0) -
      (a.resolvedAt?.getTime() ?? 0)
    );
  });

  return eligibleTickets[0] ?? null;
}
