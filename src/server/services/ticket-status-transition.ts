
type TicketStatus =
  | "OPEN"
  | "IN_PROGRESS"
  | "WAITING_FOR_EMPLOYEE"
  | "RESOLVED"
  | "CLOSED";

const allowedTransitions: Record<TicketStatus, TicketStatus[]> = {
  OPEN: ["IN_PROGRESS"],
  IN_PROGRESS: ["WAITING_FOR_EMPLOYEE", "RESOLVED"],
  WAITING_FOR_EMPLOYEE: ["IN_PROGRESS"],
  RESOLVED: ["CLOSED"],
  CLOSED: [],
};

export function canTransitionTicketStatus(
  currentStatus: string,
  newStatus: string,
): boolean {
  if (
    !Object.prototype.hasOwnProperty.call(
      allowedTransitions,
      currentStatus,
    ) ||
    !Object.prototype.hasOwnProperty.call(
      allowedTransitions,
      newStatus,
    )
  ) {
    return false;
  }

  return allowedTransitions[currentStatus as TicketStatus].includes(
    newStatus as TicketStatus,
  );
}
