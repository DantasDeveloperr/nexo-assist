
import assert from "node:assert/strict";
import { prisma } from "../src/server/db/prisma";
import { sendMessage } from "../src/server/application/conversations/send-message";

async function main() {
  const email = `concurrency-test-${Date.now()}@nexo.local`;
  let employeeId: string | undefined;
  let conversationId: string | undefined;

  try {
    const employee = await prisma.employee.create({
      data: {
        name: "Funcionário de teste",
        email,
        passwordHash: "test-only",
      },
    });

    employeeId = employee.id;

    const conversation = await prisma.conversation.create({
      data: {
        employeeId,
        status: "ACTIVE",
      },
    });

    conversationId = conversation.id;

    await prisma.message.createMany({
      data: Array.from({ length: 30 }, (_, index) => ({
        conversationId: conversation.id,
        senderEmployeeId: employee.id,
        senderType: "EMPLOYEE",
        content: `Mensagem inicial ${index + 1}`,
      })),
    });

    console.log("Conversa preparada com 30 mensagens.");
    console.log("Disparando 10 envios simultâneos...");

    const results = await Promise.allSettled(
      Array.from({ length: 10 }, (_, index) =>
        sendMessage(employee.id, {
          conversationId: conversation.id,
          content: `Mensagem concorrente ${index + 1}`,
        }),
      ),
    );

    const fulfilled = results.filter(
      (result) => result.status === "fulfilled",
    );

    const rejected = results.filter(
      (result) => result.status === "rejected",
    );

    const sent = fulfilled.filter(
      (result) => result.value.outcome === "SENT",
    );

    const limitReached = fulfilled.filter(
      (result) => result.value.outcome === "MESSAGE_LIMIT_REACHED",
    );

    const finalCount = await prisma.message.count({
      where: { conversationId: conversation.id },
    });

    console.log("\nResultado:");
    console.log(`Envios concluídos: ${fulfilled.length}`);
    console.log(`Mensagens aceitas: ${sent.length}`);
    console.log(`Recusadas pelo limite: ${limitReached.length}`);
    console.log(`Falhas inesperadas: ${rejected.length}`);
    console.log(`Total de mensagens: ${finalCount}`);

    assert.equal(rejected.length, 0, "Ocorreram falhas inesperadas.");
    assert.equal(sent.length, 1, "Deveria haver exatamente um envio aceito.");
    assert.equal(limitReached.length, 9, "Os outros nove envios deveriam atingir o limite.");
    assert.equal(finalCount, 31, "A conversa deveria terminar com 31 mensagens.");

    console.log("\nSUCESSO: limite de 31 mensagens respeitado.");
  } finally {
    if (conversationId) {
      await prisma.message.deleteMany({ where: { conversationId } });
      await prisma.conversation.delete({ where: { id: conversationId } });
    }

    if (employeeId) {
      await prisma.employee.delete({ where: { id: employeeId } });
    }

    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error("\nFALHA NO TESTE DE CONCORRÊNCIA:");
  console.error(error);
  process.exitCode = 1;
});
