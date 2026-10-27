
import { NextResponse } from "next/server";
import { prisma } from "../../../../server/db/prisma";

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
