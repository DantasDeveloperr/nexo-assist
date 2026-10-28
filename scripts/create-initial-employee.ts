import "dotenv/config";
import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";
import type { ReadStream } from "node:tty";
import { hash } from "bcryptjs";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../src/generated/prisma/client";

async function readHiddenPassword(): Promise<string> {
  const terminalInput = stdin as ReadStream;

  if (
    !terminalInput.isTTY ||
    typeof terminalInput.setRawMode !== "function"
  ) {
    throw new Error(
      "Execute este script diretamente em um terminal interativo.",
    );
  }

  return new Promise((resolve, reject) => {
    let password = "";

    stdout.write("Senha inicial (mínimo de 12 caracteres): ");

    terminalInput.setRawMode(true);
    terminalInput.resume();
    terminalInput.setEncoding("utf8");

    const cleanup = () => {
      terminalInput.removeListener("data", onData);
      terminalInput.setRawMode(false);
      terminalInput.pause();
      stdout.write("\n");
    };

    const onData = (chunk: string) => {
      for (const character of chunk) {
        if (character === "\u0003") {
          cleanup();
          reject(new Error("Operação cancelada."));
          return;
        }

        if (character === "\r" || character === "\n") {
          cleanup();
          resolve(password);
          return;
        }

        if (character === "\u007f" || character === "\b") {
          password = password.slice(0, -1);
          continue;
        }

        if (character >= " ") {
          password += character;
        }
      }
    };

    terminalInput.on("data", onData);
  });
}

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
    const existingEmployee = await prisma.employee.findFirst();

    if (existingEmployee) {
      throw new Error(
        "Já existe um funcionário cadastrado. A criação inicial foi bloqueada.",
      );
    }

    const name = (
      await terminal.question("Nome do funcionário: ")
    ).trim();

    const email = (
      await terminal.question("E-mail do funcionário: ")
    )
      .trim()
      .toLowerCase();

    terminal.close();

    if (!name) {
      throw new Error("O nome é obrigatório.");
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new Error("Informe um e-mail válido.");
    }

    const password = await readHiddenPassword();

    if (password.length < 12) {
      throw new Error("A senha deve ter pelo menos 12 caracteres.");
    }

    const passwordHash = await hash(password, 12);

    await prisma.employee.create({
      data: {
        name,
        email,
        passwordHash,
      },
    });

    console.log(`Funcionário inicial criado: ${email}`);
    console.log("A senha foi armazenada como hash.");
  } finally {
    terminal.close();
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error(
    "Não foi possível criar o funcionário inicial:",
    error instanceof Error ? error.message : "Erro inesperado.",
  );

  process.exitCode = 1;
});
