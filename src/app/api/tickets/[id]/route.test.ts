
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../../../server/db/prisma", () => ({
  prisma: {
    ticket: {
      findUnique: vi.fn(),
    },
  },
}));

import { prisma } from "../../../../server/db/prisma";
import { GET } from "./route";

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

describe("GET /api/tickets/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("retorna 200 quando o chamado existe", async () => {
    vi.mocked(prisma.ticket.findUnique).mockResolvedValue(
      savedTicket,
    );

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
