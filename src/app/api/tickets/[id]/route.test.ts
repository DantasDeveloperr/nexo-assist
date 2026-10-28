import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../../../server/db/prisma", () => ({
  prisma: {
    ticket: {
      findFirst: vi.fn(),
      update: vi.fn(),
    },
  },
}));

vi.mock("../../../../server/auth/current-employee", () => ({
  getAuthenticatedEmployee: vi.fn(),
}));

import { prisma } from "../../../../server/db/prisma";
import { getAuthenticatedEmployee } from "../../../../server/auth/current-employee";
import { GET, PATCH } from "./route";

const authenticatedEmployee = {
  id: "employee-123",
  name: "Funcionário de Teste",
  email: "funcionario@teste.com",
};

const savedTicket = {
  id: "ticket-123",
  title: "VPN não conecta",
  description: "Erro ao conectar à VPN corporativa.",
  type: "INC",
  category: "NETWORK_VPN",
  priority: "HIGH",
  status: "OPEN",
  affectedEmployeeId: "EMP001",
  requestedByEmployeeId: authenticatedEmployee.id,
  createdAt: new Date("2026-10-27T12:00:00.000Z"),
  updatedAt: new Date("2026-10-27T12:00:00.000Z"),
  resolvedAt: null as Date | null,
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
    vi.mocked(getAuthenticatedEmployee).mockResolvedValue(
      authenticatedEmployee,
    );
  });

  it("retorna 401 quando não há funcionário autenticado", async () => {
    vi.mocked(getAuthenticatedEmployee).mockResolvedValue(null);

    const response = await createRequest("ticket-123");
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.error).toBe("Autenticação necessária.");
    expect(prisma.ticket.findFirst).not.toHaveBeenCalled();
  });

  it("retorna 200 quando o chamado pertence ao funcionário autenticado", async () => {
    vi.mocked(prisma.ticket.findFirst).mockResolvedValue(savedTicket);

    const response = await createRequest("ticket-123");
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data.id).toBe("ticket-123");
    expect(body.data.title).toBe("VPN não conecta");
    expect(prisma.ticket.findFirst).toHaveBeenCalledWith({
      where: {
        id: "ticket-123",
        requestedByEmployeeId: authenticatedEmployee.id,
      },
    });
  });

  it("retorna 404 quando o chamado não existe ou não pertence ao funcionário", async () => {
    vi.mocked(prisma.ticket.findFirst).mockResolvedValue(null);

    const response = await createRequest("inexistente");
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body.error).toBe("Chamado não encontrado.");
  });

  it("retorna 500 quando o banco falha", async () => {
    vi.mocked(prisma.ticket.findFirst).mockRejectedValue(
      new Error("Falha simulada no banco"),
    );

    const response = await createRequest("ticket-123");
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.error).toBe("Não foi possível consultar o chamado.");
  });
});

describe("PATCH /api/tickets/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getAuthenticatedEmployee).mockResolvedValue(
      authenticatedEmployee,
    );
    vi.mocked(prisma.ticket.findFirst).mockResolvedValue(savedTicket);
  });

  it("retorna 401 quando não há funcionário autenticado", async () => {
    vi.mocked(getAuthenticatedEmployee).mockResolvedValue(null);

    const response = await createPatchRequest("ticket-123", {
      status: "IN_PROGRESS",
    });
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.error).toBe("Autenticação necessária.");
    expect(prisma.ticket.findFirst).not.toHaveBeenCalled();
    expect(prisma.ticket.update).not.toHaveBeenCalled();
  });

  it("atualiza o status e retorna 200", async () => {
    vi.mocked(prisma.ticket.update).mockResolvedValue({
      ...savedTicket,
      status: "IN_PROGRESS",
    });

    const response = await createPatchRequest("ticket-123", {
      status: "IN_PROGRESS",
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data.status).toBe("IN_PROGRESS");
    expect(prisma.ticket.findFirst).toHaveBeenCalledWith({
      where: {
        id: "ticket-123",
        requestedByEmployeeId: authenticatedEmployee.id,
      },
    });
    expect(prisma.ticket.update).toHaveBeenCalledWith({
      where: { id: "ticket-123" },
      data: { status: "IN_PROGRESS" },
    });
  });

  it("retorna 404 quando o chamado não existe ou não pertence ao funcionário", async () => {
    vi.mocked(prisma.ticket.findFirst).mockResolvedValue(null);

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
      vi.mocked(prisma.ticket.findFirst).mockResolvedValue({
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

  it("registra a data quando o chamado é resolvido", async () => {
    vi.mocked(prisma.ticket.findFirst).mockResolvedValue({
      ...savedTicket,
      status: "IN_PROGRESS",
    });

    vi.mocked(prisma.ticket.update).mockImplementation((args) => {
      const data = args.data;

      return Promise.resolve({
        ...savedTicket,
        ...data,
        status: data.status ?? "IN_PROGRESS",
        resolvedAt:
          data.resolvedAt instanceof Date
            ? data.resolvedAt
            : null,
      }) as ReturnType<typeof prisma.ticket.update>;
    });

    const response = await createPatchRequest("ticket-123", {
      status: "RESOLVED",
    });

    expect(response.status).toBe(200);

    const updateCall = vi.mocked(prisma.ticket.update).mock.calls[0][0];

    expect(updateCall.data.status).toBe("RESOLVED");
    expect(updateCall.data.resolvedAt).toBeInstanceOf(Date);
  });

  it("permite reabrir dentro de sete dias e limpa resolvedAt", async () => {
    const resolvedAt = new Date(
      Date.now() - 3 * 24 * 60 * 60 * 1000,
    );

    vi.mocked(prisma.ticket.findFirst).mockResolvedValue({
      ...savedTicket,
      status: "RESOLVED",
      resolvedAt,
    });

    vi.mocked(prisma.ticket.update).mockResolvedValue({
      ...savedTicket,
      status: "IN_PROGRESS",
      resolvedAt: null,
    });

    const response = await createPatchRequest("ticket-123", {
      status: "IN_PROGRESS",
    });

    expect(response.status).toBe(200);
    expect(prisma.ticket.update).toHaveBeenCalledWith({
      where: { id: "ticket-123" },
      data: {
        status: "IN_PROGRESS",
        resolvedAt: null,
      },
    });
  });

  it("bloqueia a reabertura após sete dias", async () => {
    const resolvedAt = new Date(
      Date.now() - 8 * 24 * 60 * 60 * 1000,
    );

    vi.mocked(prisma.ticket.findFirst).mockResolvedValue({
      ...savedTicket,
      status: "RESOLVED",
      resolvedAt,
    });

    const response = await createPatchRequest("ticket-123", {
      status: "IN_PROGRESS",
    });
    const body = await response.json();

    expect(response.status).toBe(409);
    expect(body.error).toBe(
      "O prazo de sete dias para reabrir este chamado expirou.",
    );
    expect(prisma.ticket.update).not.toHaveBeenCalled();
  });

  it("bloqueia a reabertura quando não há data de resolução", async () => {
    vi.mocked(prisma.ticket.findFirst).mockResolvedValue({
      ...savedTicket,
      status: "RESOLVED",
      resolvedAt: null,
    });

    const response = await createPatchRequest("ticket-123", {
      status: "IN_PROGRESS",
    });
    const body = await response.json();

    expect(response.status).toBe(409);
    expect(body.error).toBe(
      "O prazo de sete dias para reabrir este chamado expirou.",
    );
    expect(prisma.ticket.update).not.toHaveBeenCalled();
  });

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