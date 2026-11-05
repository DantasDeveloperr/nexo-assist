import { NextResponse } from "next/server";

import { getAuthenticatedEmployee } from "../../../../server/auth/current-employee";
import { getConversation } from "../../../../server/application/conversations/get-conversation";

interface RouteContext {
  params: Promise<{
    conversationId: string;
  }>;
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

    const { conversationId } = await params;

    const conversation = await getConversation(
      conversationId,
      employee.id,
    );

    if (!conversation) {
      return NextResponse.json(
        { error: "Conversa não encontrada." },
        { status: 404 },
      );
    }

    return NextResponse.json(
      {
        message: "Conversa consultada com sucesso.",
        data: conversation,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Erro ao consultar conversa:", error);

    return NextResponse.json(
      { error: "Não foi possível consultar a conversa." },
      { status: 500 },
    );
  }
}