
import { connection, NextResponse } from "next/server";
import { getAuthenticatedEmployee } from "@/server/auth/current-employee";

export async function GET() {
  await connection();

  try {
    const employee = await getAuthenticatedEmployee();

    if (!employee) {
      return NextResponse.json(
        { error: "Usuário não autenticado." },
        { status: 401 },
      );
    }

    return NextResponse.json({ employee });
  } catch (error) {
    console.error("Erro ao consultar sessão:", error);

    return NextResponse.json(
      { error: "Não foi possível verificar a sessão." },
      { status: 500 },
    );
  }
}
