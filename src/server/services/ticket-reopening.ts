
const REOPENING_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

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
