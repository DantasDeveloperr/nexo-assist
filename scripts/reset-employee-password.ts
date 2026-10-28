import "dotenv/config";
import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";
import { hash } from "bcryptjs";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../src/generated/prisma/client";

async function main() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("A variável DATABASE_URL não foi configurada.");
  }

  const adapter = new PrismaBetterSqlite3({ url: databaseUrl });
  const prisma = new PrismaClient({ adapter });
  const terminal = createInterface({
    input: stdin,
    output: stdout,
  });

  try {
    const email = (
      await terminal.question("E-mail do funcionário: ")
    )
      .trim()
      .toLowerCase();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new Error("Informe um e-mail válido.");
    }

    const employee = await prisma.employee.findUnique({
      where: { email },
      select: { id: true, email: true },
    });

    if (!employee) {
      throw new Error(
        "Funcionário não encontrado. Nenhum dado foi alterado.",
      );
    }

    console.log(
      "Atenção: a senha aparecerá no terminal enquanto você digita.",
    );

    const password = await terminal.question(
      "Nova senha (mínimo de 12 caracteres): ",
    );

    if (password.length < 12 || password.length > 128) {
      throw new Error(
        "A senha deve ter entre 12 e 128 caracteres.",
      );
    }

    const confirmation = await terminal.question(
      "Confirme a nova senha: ",
    );

    if (password !== confirmation) {
      throw new Error(
        "As senhas não correspondem. Nenhum dado foi alterado.",
      );
    }

    const passwordHash = await hash(password, 12);

    await prisma.employee.update({
      where: { id: employee.id },
      data: { passwordHash },
    });

    console.log(
      `Senha redefinida com sucesso para: ${employee.email}`,
    );
    console.log("O cadastro e o ID do funcionário foram preservados.");
  } finally {
    terminal.close();
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error(
    "Não foi possível redefinir a senha:",
    error instanceof Error ? error.message : "Erro inesperado.",
  );

  process.exitCode = 1;
});