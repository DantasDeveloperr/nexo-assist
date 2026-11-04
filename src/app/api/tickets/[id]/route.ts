
import { NextResponse } from "next/server";

import { getAuthenticatedEmployee } from "../../../../server/auth/current-employee";
import { getTicket } from "../../../../server/application/tickets/get-ticket";
import { updateTicketSchema } from "../../../../server/schemas/ticket-schema";
import { updateTicket } from "../../../../server/application/tickets/update-ticket";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(
  _request: Request,
  { params }: RouteContext,
) {
  try {
    const employee = await getAuthenticatedEmployee();

    if (!employee) {
      return NextResponse.json(
        { error: "Autenticação necessária." },
        { status: 401 },
      );
    }

    const { id } = await params;

    if (!id.trim()) {
      return NextResponse.json(
        { error: "O identificador do chamado não pode ser vazio." },
        { status: 400 },
      );
    }

    const ticket = await getTicket(id, employee.id);

    if (!ticket) {
      return NextResponse.json(
        { error: "Chamado não encontrado." },
        { status: 404 },
      );
    }

    return NextResponse.json({ data: ticket }, { status: 200 });
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
  try {
    const employee = await getAuthenticatedEmployee();

    if (!employee) {
      return NextResponse.json(
        { error: "Autenticação necessária." },
        { status: 401 },
      );
    }

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

    const result = await updateTicket(
      id,
      employee.id,
      validation.data,
    );

    switch (result.outcome) {
      case "NOT_FOUND":
        return NextResponse.json(
          { error: "Chamado não encontrado." },
          { status: 404 },
        );

      case "CLOSED":
        return NextResponse.json(
          { error: "Chamados encerrados não podem ser alterados." },
          { status: 409 },
        );

      case "REOPEN_NOT_ALLOWED":
        return NextResponse.json(
          {
            error:
              "Chamados resolvidos só podem ser reabertos dentro do prazo permitido.",
          },
          { status: 409 },
        );

      case "REOPEN_EXPIRED":
        return NextResponse.json(
          {
            error:
              "O prazo de sete dias para reabrir este chamado expirou.",
          },
          { status: 409 },
        );

      case "INVALID_TRANSITION":
        return NextResponse.json(
          { error: "Transição de status não permitida." },
          { status: 409 },
        );

            case "STATUS_NOT_EDITABLE":
        return NextResponse.json(
          { error: "O chamado não permite alterações neste estado." },
          { status: 409 },
        );

      case "UPDATED":
        return NextResponse.json(
          { data: result.ticket },
          { status: 200 },
        );
    }
  } catch (error) {
    console.error("Erro ao atualizar chamado:", error);

    return NextResponse.json(
      { error: "Não foi possível atualizar o chamado." },
      { status: 500 },
    );
  }
}
