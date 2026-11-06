
import { NextResponse } from "next/server";

import { getAuthenticatedEmployee } from "../../../../../server/auth/current-employee";
import { sendMessage } from "../../../../../server/application/conversations/send-message";
import { sendMessageSchema } from "../../../../../server/schemas/message-schema";

interface RouteContext {
  params: Promise<{
    conversationId: string;
  }>;
}

export async function POST(
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

    const { conversationId } = await params;

    const body = await request.json();
    const validation = sendMessageSchema.safeParse({
      ...body,
      conversationId,
    });

    if (!validation.success) {
      return NextResponse.json(
        {
          error: "Dados da mensagem inválidos.",
          details: validation.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const result = await sendMessage(
      employee.id,
      validation.data,
    );

    if (result.outcome === "NOT_FOUND") {
      return NextResponse.json(
        { error: "Conversa não encontrada." },
        { status: 404 },
      );
    }

    if (result.outcome === "CLOSED") {
      return NextResponse.json(
        { error: "Não é possível enviar mensagens para uma conversa encerrada." },
        { status: 409 },
      );
    }

    if (result.outcome === "MESSAGE_LIMIT_REACHED") {
      return NextResponse.json(
        { error: "O limite de 31 mensagens desta conversa foi atingido." },
        { status: 409 },
      );
    }

    return NextResponse.json(
      {
        message: "Mensagem enviada com sucesso.",
        data: result.message,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Erro ao enviar mensagem:", error);

    return NextResponse.json(
      { error: "Não foi possível enviar a mensagem." },
      { status: 500 },
    );
  }
}
