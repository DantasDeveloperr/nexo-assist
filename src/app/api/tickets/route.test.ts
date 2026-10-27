
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../../server/db/prisma", () => ({
  prisma: {
    ticket: {
      create: vi.fn(),
    },
  },
}));

import { prisma } from "../../../server/db/prisma";
import { POST } from "./route";

const validTicket = {
  title: "VPN não funciona",
  description: "Recebo o erro 809 ao tentar conectar.",
  type: "INC",
  category: "NETWORK_VPN",
  priority: "HIGH",
  affectedEmployeeId: "EMP001",
};

function createRequest(body: string): Request {
  return new Request("http://localhost/api/tickets", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body,
  });
}

describe("POST /api/tickets", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("retorna 201 quando o chamado é criado", async () => {
    const savedTicket = {
      id: "ticket-test-001",
      ...validTicket,
      status: "OPEN",
      createdAt: new Date("2026-10-27T12:00:00.000Z"),
      updatedAt: new Date("2026-10-27T12:00:00.000Z"),
    };

    vi.mocked(prisma.ticket.create).mockResolvedValue(
      savedTicket as never,
    );

    const response = await POST(
      createRequest(JSON.stringify(validTicket)),
    );
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body.message).toBe("Chamado criado com sucesso.");
    expect(body.data.id).toBe("ticket-test-001");
    expect(prisma.ticket.create).toHaveBeenCalledWith({
      data: validTicket,
    });
  });

  it("retorna 400 quando o JSON é inválido", async () => {
    const response = await POST(createRequest("{json inválido"));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe(
      "O corpo da requisição deve conter um JSON válido.",
    );
    expect(prisma.ticket.create).not.toHaveBeenCalled();
  });

  it("retorna 400 quando o título está vazio", async () => {
    const response = await POST(
      createRequest(
        JSON.stringify({ ...validTicket, title: "   " }),
      ),
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe("Os dados do chamado são inválidos.");
    expect(body.details).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          field: "title",
          message: "O título é obrigatório.",
        }),
      ]),
    );
    expect(prisma.ticket.create).not.toHaveBeenCalled();
  });

  it("retorna 400 quando o tipo é inválido", async () => {
    const response = await POST(
      createRequest(
        JSON.stringify({ ...validTicket, type: "BUG" }),
      ),
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.details).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ field: "type" }),
      ]),
    );
    expect(prisma.ticket.create).not.toHaveBeenCalled();
  });

  it("retorna 400 quando faltam campos obrigatórios", async () => {
    const response = await POST(
      createRequest(JSON.stringify({ title: "VPN não funciona" })),
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe("Os dados do chamado são inválidos.");
    expect(body.details.length).toBeGreaterThan(0);
    expect(prisma.ticket.create).not.toHaveBeenCalled();
  });

  it("retorna 500 quando o banco falha ao salvar", async () => {
    vi.mocked(prisma.ticket.create).mockRejectedValue(
      new Error("Falha simulada no banco"),
    );

    const response = await POST(
      createRequest(JSON.stringify(validTicket)),
    );
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.error).toBe("Não foi possível criar o chamado.");
  });
});
