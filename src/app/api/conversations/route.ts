import { NextResponse } from "next/server";

import { getAuthenticatedEmployee } from "../../../server/auth/current-employee";
import { createConversation } from "../../../server/application/conversations/create-conversation";
import { listConversations } from "../../../server/application/conversations/list-conversations";

export async function POST() {
  try {
    const employee = await getAuthenticatedEmployee();

    if (!employee) {
      return NextResponse.json(
        { error: "Autenticação necessária." },
        { status: 401 },
      );
    }

    const conversation = await createConversation(employee.id);

    return NextResponse.json(
      {
        message: "Conversa criada com sucesso.",
        data: conversation,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Erro ao criar conversa:", error);

    return NextResponse.json(
      { error: "Não foi possível criar a conversa." },
      { status: 500 },
    );
  }
}

export async function GET() {
  try {
    const employee = await getAuthenticatedEmployee();

    if (!employee) {
      return NextResponse.json(
        { error: "Autenticação necessária." },
        { status: 401 },
      );
    }

    const conversations = await listConversations(employee.id);

    return NextResponse.json(
      {
        message: "Conversas consultadas com sucesso.",
        data: conversations,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Erro ao listar conversas:", error);

    return NextResponse.json(
      { error: "Não foi possível consultar as conversas." },
      { status: 500 },
    );
  }
}