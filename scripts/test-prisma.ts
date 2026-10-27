
import "dotenv/config";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../src/generated/prisma/client";

async function main() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("DATABASE_URL não foi configurada.");
  }

  const adapter = new PrismaBetterSqlite3({
    url: databaseUrl,
  });

  const prisma = new PrismaClient({ adapter });

  try {
    const ticket = await prisma.ticket.create({
      data: {
        title: "Teste de persistência",
        description: "Chamado criado para validar o SQLite.",
        type: "INC",
        category: "NETWORK_VPN",
        priority: "HIGH",
        affectedEmployeeId: "EMP-TEST",
      },
    });

    const savedTicket = await prisma.ticket.findUnique({
      where: { id: ticket.id },
    });

    console.log("Chamado criado:", ticket.id);
    console.log("Encontrado no banco:", savedTicket !== null);
    console.log("Título:", savedTicket?.title);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error("Falha no teste de persistência:", error);
  process.exitCode = 1;
});
