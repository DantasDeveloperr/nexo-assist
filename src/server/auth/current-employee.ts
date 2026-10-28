import { cookies } from "next/headers";

import { verifySessionToken } from "./session";
import { prisma } from "../db/prisma";

const SESSION_COOKIE_NAME = "nexo_session";

export async function getAuthenticatedEmployee() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  const session = await verifySessionToken(token);

  if (!session) {
    return null;
  }

  const employee = await prisma.employee.findUnique({
    where: { id: session.employeeId },
    select: {
      id: true,
      name: true,
      email: true,
    },
  });

  return employee;
}