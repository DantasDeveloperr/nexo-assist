
import type { TicketPriority } from "@/types/ticket";

export const SLA_DEADLINES = {
  CRITICAL: {
    amount: 1,
    unit: "hour",
    businessHoursOnly: false,
  },
  HIGH: {
    amount: 4,
    unit: "hour",
    businessHoursOnly: true,
  },
  MEDIUM: {
    amount: 3,
    unit: "business-day",
    businessHoursOnly: true,
  },
  LOW: {
    amount: 5,
    unit: "business-day",
    businessHoursOnly: true,
  },
} as const satisfies Record<
  TicketPriority,
  {
    amount: number;
    unit: "hour" | "business-day";
    businessHoursOnly: boolean;
  }
>;

const BUSINESS_START_HOUR = 8;
const BUSINESS_END_HOUR = 18;
const BUSINESS_HOURS_PER_DAY = 10;
const MILLISECONDS_PER_HOUR = 60 * 60 * 1000;

function isBusinessDay(date: Date): boolean {
  const day = date.getDay();

  return day >= 1 && day <= 5;
}

function startOfBusinessDay(date: Date): Date {
  const result = new Date(date);

  result.setHours(BUSINESS_START_HOUR, 0, 0, 0);

  return result;
}

function moveToNextBusinessDay(date: Date): Date {
  const result = new Date(date);

  result.setDate(result.getDate() + 1);
  result.setHours(BUSINESS_START_HOUR, 0, 0, 0);

  while (!isBusinessDay(result)) {
    result.setDate(result.getDate() + 1);
  }

  return result;
}

function normalizeBusinessStart(date: Date): Date {
  const result = new Date(date);

  if (!isBusinessDay(result)) {
    result.setHours(BUSINESS_START_HOUR, 0, 0, 0);

    while (!isBusinessDay(result)) {
      result.setDate(result.getDate() + 1);
    }

    return result;
  }

  const hour = result.getHours();

  if (
    hour < BUSINESS_START_HOUR ||
    (hour === BUSINESS_START_HOUR &&
      result.getMinutes() === 0 &&
      result.getSeconds() === 0 &&
      result.getMilliseconds() === 0)
  ) {
    return startOfBusinessDay(result);
  }

  if (hour >= BUSINESS_END_HOUR) {
    return moveToNextBusinessDay(result);
  }

  return result;
}

function addBusinessHours(
  start: Date,
  hoursToAdd: number,
): Date {
  let current = normalizeBusinessStart(start);
  let remainingHours = hoursToAdd;

  while (remainingHours > 0) {
    const endOfBusinessDay = new Date(current);

    endOfBusinessDay.setHours(BUSINESS_END_HOUR, 0, 0, 0);

    const availableMilliseconds =
      endOfBusinessDay.getTime() - current.getTime();

    const availableHours =
      availableMilliseconds / MILLISECONDS_PER_HOUR;

    if (remainingHours <= availableHours) {
      return new Date(
        current.getTime() +
          remainingHours * MILLISECONDS_PER_HOUR,
      );
    }

    remainingHours -= availableHours;
    current = moveToNextBusinessDay(current);
  }

  return current;
}

function addBusinessDays(
  start: Date,
  daysToAdd: number,
): Date {
  let current = normalizeBusinessStart(start);
  let remainingHours = daysToAdd * BUSINESS_HOURS_PER_DAY;

  while (remainingHours > 0) {
    const endOfBusinessDay = new Date(current);

    endOfBusinessDay.setHours(BUSINESS_END_HOUR, 0, 0, 0);

    const availableMilliseconds =
      endOfBusinessDay.getTime() - current.getTime();

    const availableHours =
      availableMilliseconds / MILLISECONDS_PER_HOUR;

    if (remainingHours <= availableHours) {
      return new Date(
        current.getTime() +
          remainingHours * MILLISECONDS_PER_HOUR,
      );
    }

    remainingHours -= availableHours;
    current = moveToNextBusinessDay(current);
  }

  return current;
}

export function calculateSlaDeadline(
  priority: TicketPriority,
  openedAt: Date,
): Date {
  if (Number.isNaN(openedAt.getTime())) {
    throw new Error("A data de abertura do chamado é inválida.");
  }

  const deadlineConfig = SLA_DEADLINES[priority];

  if (!deadlineConfig.businessHoursOnly) {
    return new Date(
      openedAt.getTime() +
        deadlineConfig.amount * MILLISECONDS_PER_HOUR,
    );
  }

  if (deadlineConfig.unit === "hour") {
    return addBusinessHours(openedAt, deadlineConfig.amount);
  }

  return addBusinessDays(openedAt, deadlineConfig.amount);
}
