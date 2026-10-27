
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../../../server/db/prisma", () => ({
  prisma: {
    ticket: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}));

import { prisma } from "../../../../server/db/prisma";
import { GET, PATCH } from "./route";

const savedTicket = {
  id: "ticket-123",
  title: "VPN não conecta",
  description: "Erro ao conectar à VPN corporativa.",
  type: "INC",
  category: "NETWORK_VPN",
  priority: "HIGH",
  status: "OPEN",
  affectedEmployeeId: "EMP001",
  createdAt: new Date("2026-10-27T12:00:00.000Z"),
  updatedAt: new Date("2026-10-27T12:00:00.000Z"),
};

function createRequest(id: string) {
  return GET(
    new Request(`http://localhost:3000/api/tickets/${id}`),
    { params: Promise.resolve({ id }) },
  );
}

function createPatchRequest(id: string, body: unknown) {
  return PATCH(
    new Request(`http://localhost:3000/api/tickets/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
    { params: Promise.resolve({ id }) },
  );
}

describe("GET /api/tickets/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("retorna 200 quando o chamado existe", async () => {
    vi.mocked(prisma.ticket.findUnique).mockResolvedValue(savedTicket);

    const response = await createRequest("ticket-123");
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data.id).toBe("ticket-123");
    expect(body.data.title).toBe("VPN não conecta");
    expect(prisma.ticket.findUnique).toHaveBeenCalledWith({
      where: { id: "ticket-123" },
    });
  });

  it("retorna 404 quando o chamado não existe", async () => {
    vi.mocked(prisma.ticket.findUnique).mockResolvedValue(null);

    const response = await createRequest("inexistente");
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body.error).toBe("Chamado não encontrado.");
  });

  it("retorna 500 quando o banco falha", async () => {
    vi.mocked(prisma.ticket.findUnique).mockRejectedValue(
      new Error("Falha simulada no banco"),
    );

    const response = await createRequest("ticket-123");
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.error).toBe(
      "Não foi possível consultar o chamado.",
    );
  });
});

describe("PATCH /api/tickets/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(prisma.ticket.findUnique).mockResolvedValue(savedTicket);
  });

  it("atualiza o status e retorna 200", async () => {
    const updatedTicket = {
      ...savedTicket,
      status: "IN_PROGRESS",
    };

    vi.mocked(prisma.ticket.update).mockResolvedValue(updatedTicket);

    const response = await createPatchRequest("ticket-123", {
      status: "IN_PROGRESS",
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data.status).toBe("IN_PROGRESS");
    expect(prisma.ticket.update).toHaveBeenCalledWith({
      where: { id: "ticket-123" },
      data: { status: "IN_PROGRESS" },
    });
  });

  it("retorna 404 quando o chamado não existe", async () => {
    vi.mocked(prisma.ticket.findUnique).mockResolvedValue(null);

    const response = await createPatchRequest("inexistente", {
      status: "IN_PROGRESS",
    });
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body.error).toBe("Chamado não encontrado.");
    expect(prisma.ticket.update).not.toHaveBeenCalled();
  });

  it("retorna 400 quando os dados são inválidos", async () => {
    const response = await createPatchRequest("ticket-123", {
      status: "CANCELLED",
    });
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe("Os dados enviados são inválidos.");
    expect(prisma.ticket.update).not.toHaveBeenCalled();
  });

  it("retorna 400 quando o corpo está vazio", async () => {
    const response = await createPatchRequest("ticket-123", {});
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe("Os dados enviados são inválidos.");
    expect(prisma.ticket.update).not.toHaveBeenCalled();
  });

  it("retorna 400 quando o JSON é malformado", async () => {
    const request = new Request(
      "http://localhost:3000/api/tickets/ticket-123",
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: "{json-invalido",
      },
    );

    const response = await PATCH(request, {
      params: Promise.resolve({ id: "ticket-123" }),
    });

    expect(response.status).toBe(400);
  });

  
  it.each([
    ["OPEN", "CLOSED"],
    ["WAITING_FOR_EMPLOYEE", "CLOSED"],
    ["CLOSED", "IN_PROGRESS"],
  ])(
    "bloqueia a transição de %s para %s",
    async (currentStatus, newStatus) => {
      vi.mocked(prisma.ticket.findUnique).mockResolvedValue({
        ...savedTicket,
        status: currentStatus,
      });

      const response = await createPatchRequest("ticket-123", {
        status: newStatus,
      });
      const body = await response.json();

      expect(response.status).toBe(409);
      expect(body.error).toBe("Transição de status não permitida.");
      expect(prisma.ticket.update).not.toHaveBeenCalled();
    },
  );


  it("retorna 500 quando o banco falha ao atualizar", async () => {
    vi.mocked(prisma.ticket.update).mockRejectedValue(
      new Error("Falha simulada no banco"),
    );

    const response = await createPatchRequest("ticket-123", {
      status: "IN_PROGRESS",
    });
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.error).toBe("Não foi possível atualizar o chamado.");
  });
});
