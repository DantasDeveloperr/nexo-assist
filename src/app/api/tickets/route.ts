
import { NextResponse } from "next/server";
import { prisma } from "../../../server/db/prisma";
import { createTicketSchema } from "../../../server/schemas/ticket-schema";
import type { TicketStatus } from "../../../types/ticket";

const validStatuses: TicketStatus[] = [
  "OPEN",
  "IN_PROGRESS",
  "WAITING_FOR_EMPLOYEE",
  "RESOLVED",
  "CLOSED",
];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const employeeId = searchParams.get("affectedEmployeeId");
  const status = searchParams.get("status");

  if (employeeId !== null && employeeId.trim().length === 0) {
    return NextResponse.json(
      { error: "O identificador do funcionário não pode ser vazio." },
      { status: 400 },
    );
  }

  if (status !== null && !validStatuses.includes(status as TicketStatus)) {
    return NextResponse.json(
      {
        error: "O status informado é inválido.",
        validStatuses,
      },
      { status: 400 },
    );
  }

  try {
    const tickets = await prisma.ticket.findMany({
      where: {
        ...(employeeId !== null
          ? { affectedEmployeeId: employeeId.trim() }
          : {}),
        ...(status !== null ? { status } : {}),
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(
      {
        count: tickets.length,
        data: tickets,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Erro ao consultar chamados:", error);

    return NextResponse.json(
      { error: "Não foi possível consultar os chamados." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      {
        error: "O corpo da requisição deve conter um JSON válido.",
      },
      { status: 400 },
    );
  }

  const result = createTicketSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json(
      {
        error: "Os dados do chamado são inválidos.",
        details: result.error.issues.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message,
        })),
      },
      { status: 400 },
    );
  }

  try {
    const ticket = await prisma.ticket.create({
      data: {
        title: result.data.title,
        description: result.data.description,
        type: result.data.type,
        category: result.data.category,
        priority: result.data.priority,
        affectedEmployeeId: result.data.affectedEmployeeId,
      },
    });

    return NextResponse.json(
      {
        message: "Chamado criado com sucesso.",
        data: ticket,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Erro ao salvar chamado:", error);

    return NextResponse.json(
      {
        error: "Não foi possível criar o chamado.",
      },
      { status: 500 },
    );
  }
}
