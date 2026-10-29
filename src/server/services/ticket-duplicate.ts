
type NewTicketData = {
  title: string;
  type: string;
  category: string;
  affectedEmployeeId: string;
};

type ExistingTicket = NewTicketData & {
  id: string;
  status: string;
};

const ACTIVE_STATUSES = [
  "OPEN",
  "IN_PROGRESS",
  "WAITING_FOR_EMPLOYEE",
];

function normalizeTitle(title: string): string {
  return title
    .trim()
    .replace(/\s+/g, " ")
    .toLocaleLowerCase("pt-BR");
}

export function findDuplicateTicket(
  newTicket: NewTicketData,
  existingTickets: ExistingTicket[],
): ExistingTicket | null {
  const normalizedNewTitle = normalizeTitle(newTicket.title);

  return (
    existingTickets.find((ticket) => {
      return (
        ACTIVE_STATUSES.includes(ticket.status) &&
        ticket.affectedEmployeeId === newTicket.affectedEmployeeId &&
        ticket.type === newTicket.type &&
        ticket.category === newTicket.category &&
        normalizeTitle(ticket.title) === normalizedNewTitle
      );
    }) ?? null
  );
}
