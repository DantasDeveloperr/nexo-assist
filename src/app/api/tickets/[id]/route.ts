
import { NextResponse } from "next/server";
import { prisma } from "../../../../server/db/prisma";
import { updateTicketSchema } from "../../../../server/schemas/ticket-schema";
import { canTransitionTicketStatus } from "../../../../server/services/ticket-status-transition";
import { canReopenResolvedTicket } from "../../../../server/services/ticket-reopening";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(
  _request: Request,
  { params }: RouteContext,
) {
  const { id } = await params;

  if (!id.trim()) {
    return NextResponse.json(
      { error: "O identificador do chamado não pode ser vazio." },
      { status: 400 },
    );
  }

  try {
    const ticket = await prisma.ticket.findUnique({
      where: { id },
    });

    if (!ticket) {
      return NextResponse.json(
        { error: "Chamado não encontrado." },
        { status: 404 },
      );
    }

    return NextResponse.json(
      { data: ticket },
      { status: 200 },
    );
  } catch (error) {
    console.error("Erro ao consultar chamado:", error);

    return NextResponse.json(
      { error: "Não foi possível consultar o chamado." },
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: RouteContext,
) {
  const { id } = await params;

  if (!id.trim()) {
    return NextResponse.json(
      { error: "O identificador do chamado não pode ser vazio." },
      { status: 400 },
    );
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "O corpo da requisição deve conter um JSON válido." },
      { status: 400 },
    );
  }

  const validation = updateTicketSchema.safeParse(body);

  if (!validation.success) {
    return NextResponse.json(
      {
        error: "Os dados enviados são inválidos.",
        details: validation.error.issues.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message,
        })),
      },
      { status: 400 },
    );
  }

  try {
    const existingTicket = await prisma.ticket.findUnique({
      where: { id },
    });

    if (!existingTicket) {
      return NextResponse.json(
        { error: "Chamado não encontrado." },
        { status: 404 },
      );
    }

    const { status: newStatus, ...otherFields } = validation.data;

    const isReopening =
      existingTicket.status === "RESOLVED" &&
      newStatus === "IN_PROGRESS";

    const now = new Date();

    if (
      newStatus !== undefined &&
      newStatus !== existingTicket.status
    ) {
      if (isReopening) {
        if (!canReopenResolvedTicket(existingTicket.resolvedAt, now)) {
          return NextResponse.json(
            {
              error:
                "O prazo de sete dias para reabrir este chamado expirou.",
            },
            { status: 409 },
          );
        }
      } else if (
        !canTransitionTicketStatus(existingTicket.status, newStatus)
      ) {
        return NextResponse.json(
          { error: "Transição de status não permitida." },
          { status: 409 },
        );
      }
    }

    const isResolving =
      existingTicket.status !== "RESOLVED" &&
      newStatus === "RESOLVED";

    const updatedTicket = await prisma.ticket.update({
      where: { id },
      data: {
        ...otherFields,
        ...(newStatus !== undefined ? { status: newStatus } : {}),
        ...(isResolving ? { resolvedAt: now } : {}),
        ...(isReopening ? { resolvedAt: null } : {}),
      },
    });

    return NextResponse.json(
      { data: updatedTicket },
      { status: 200 },
    );
  } catch (error) {
    console.error("Erro ao atualizar chamado:", error);

    return NextResponse.json(
      { error: "Não foi possível atualizar o chamado." },
      { status: 500 },
    );
  }
}
