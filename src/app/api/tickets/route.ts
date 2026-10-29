
import { NextResponse } from "next/server";

import { getAuthenticatedEmployee } from "../../../server/auth/current-employee";
import { prisma } from "../../../server/db/prisma";
import { createTicketSchema } from "../../../server/schemas/ticket-schema";
import { findDuplicateTicket } from "../../../server/services/ticket-duplicate";
import type { TicketStatus } from "../../../types/ticket";

const VALID_STATUSES: TicketStatus[] = [
  "OPEN",
  "IN_PROGRESS",
  "WAITING_FOR_EMPLOYEE",
  "RESOLVED",
  "CLOSED",
];

const ACTIVE_STATUSES = [
  "OPEN",
  "IN_PROGRESS",
  "WAITING_FOR_EMPLOYEE",
] as const;

export async function GET(request: Request) {
  try {
    const employee = await getAuthenticatedEmployee();

    if (!employee) {
      return NextResponse.json(
        { error: "Autenticação necessária." },
        { status: 401 },
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const affectedEmployeeId = searchParams.get("affectedEmployeeId");

    if (status && !VALID_STATUSES.includes(status as TicketStatus)) {
      return NextResponse.json(
        { error: "O status informado é inválido." },
        { status: 400 },
      );
    }

    if (
      affectedEmployeeId !== null &&
      affectedEmployeeId.trim().length === 0
    ) {
      return NextResponse.json(
        {
          error: "O identificador do funcionário não pode ser vazio.",
        },
        { status: 400 },
      );
    }

    const tickets = await prisma.ticket.findMany({
      where: {
        requestedByEmployeeId: employee.id,
        ...(affectedEmployeeId
          ? { affectedEmployeeId: affectedEmployeeId.trim() }
          : {}),
        ...(status ? { status: status as TicketStatus } : {}),
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
  try {
    const employee = await getAuthenticatedEmployee();

    if (!employee) {
      return NextResponse.json(
        { error: "Autenticação necessária." },
        { status: 401 },
      );
    }

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

    const validation = createTicketSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: "Os dados do chamado são inválidos.",
          details: validation.error.issues.map((issue) => ({
            field: issue.path.join("."),
            message: issue.message,
          })),
        },
        { status: 400 },
      );
    }

    // 1. Busca chamados ativos do solicitante autenticado
    // que tenham o mesmo funcionário afetado, tipo e categoria.
    const existingTickets = await prisma.ticket.findMany({
      where: {
        requestedByEmployeeId: employee.id,
        affectedEmployeeId: validation.data.affectedEmployeeId,
        type: validation.data.type,
        category: validation.data.category,
        status: {
          in: [...ACTIVE_STATUSES],
        },
      },
    });

    // 2. Compara os títulos para identificar uma duplicidade.
    const duplicateTicket = findDuplicateTicket(
      validation.data,
      existingTickets,
    );

    // 3. Se encontrar duplicidade, não cria outro chamado.
    if (duplicateTicket) {
      return NextResponse.json(
        {
          message: "Já existe um chamado ativo para este problema.",
          data: duplicateTicket,
        },
        { status: 409 },
      );
    }

    // 4. Se não encontrar duplicidade, cria normalmente.
    const ticket = await prisma.ticket.create({
      data: {
        ...validation.data,
        requestedByEmployeeId: employee.id,
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
    console.error("Erro ao criar chamado:", error);

    return NextResponse.json(
      { error: "Não foi possível criar o chamado." },
      { status: 500 },
    );
  }
}
