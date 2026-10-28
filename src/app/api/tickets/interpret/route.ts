
import { connection, NextResponse } from "next/server";
import { z } from "zod";

import { getAuthenticatedEmployee } from "../../../../server/auth/current-employee";
import { interpretTicketMessage } from "../../../../server/services/ticket-ai-assistant";

const requestSchema = z.object({
  message: z.string().trim().min(1, "Informe o relato do chamado.").max(
    2000,
    "O relato deve ter no máximo 2000 caracteres.",
  ),
});

export async function POST(request: Request) {
  await connection();

  try {
    const employee = await getAuthenticatedEmployee();

    if (!employee) {
      return NextResponse.json(
        { message: "Não autenticado." },
        { status: 401 },
      );
    }

    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { message: "O corpo da requisição deve conter um JSON válido." },
        { status: 400 },
      );
    }

    const validation = requestSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          message: "Dados inválidos.",
          errors: validation.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const interpretation = await interpretTicketMessage(
      validation.data.message,
    );

    return NextResponse.json({
      message: "Relato interpretado com sucesso.",
      data: interpretation,
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Não autenticado.") {
        return NextResponse.json(
          { message: "Não autenticado." },
          { status: 401 },
        );
      }

      if (
        error.message === "A variável GEMINI_API_KEY não está configurada."
      ) {
        console.error("Configuração do Gemini ausente.");

        return NextResponse.json(
          { message: "O assistente de IA está temporariamente indisponível." },
          { status: 503 },
        );
      }
    }

    console.error("Falha ao interpretar relato de chamado com IA.");

    return NextResponse.json(
      { message: "Não foi possível interpretar o relato neste momento." },
      { status: 502 },
    );
  }
}