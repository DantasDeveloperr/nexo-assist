
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../../server/auth/current-employee", () => ({
  getAuthenticatedEmployee: vi.fn(),
}));

vi.mock("../../../server/application/conversations/create-conversation", () => ({
  createConversation: vi.fn(),
}));

vi.mock("../../../server/application/conversations/list-conversations", () => ({
  listConversations: vi.fn(),
}));

import { getAuthenticatedEmployee } from "../../../server/auth/current-employee";
import { createConversation } from "../../../server/application/conversations/create-conversation";
import { listConversations } from "../../../server/application/conversations/list-conversations";
import { GET, POST } from "./route";

const authenticatedEmployee = {
  id: "employee-123",
  name: "Funcionário de Teste",
  email: "funcionario@teste.com",
};

const savedConversation = {
  id: "conversation-001",
  employeeId: authenticatedEmployee.id,
  title: "Novo atendimento",
  status: "ACTIVE",
  waitingForEmployee: false,
  lastMessageAt: null,
  createdAt: new Date("2026-11-04T12:00:00.000Z"),
  updatedAt: new Date("2026-11-04T12:00:00.000Z"),
  closedAt: null,
  deletedAt: null,
};

describe("GET /api/conversations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getAuthenticatedEmployee).mockResolvedValue(authenticatedEmployee);
  });

  it("retorna 200 e as conversas do funcionário autenticado", async () => {
    vi.mocked(listConversations).mockResolvedValue([savedConversation] as never);

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.message).toBe("Conversas consultadas com sucesso.");
    expect(body.data).toHaveLength(1);
    expect(body.data[0].id).toBe(savedConversation.id);
    expect(listConversations).toHaveBeenCalledWith(authenticatedEmployee.id);
  });

  it("retorna uma lista vazia quando o funcionário não possui conversas", async () => {
    vi.mocked(listConversations).mockResolvedValue([]);

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data).toEqual([]);
  });

  it("retorna 401 quando não existe funcionário autenticado", async () => {
    vi.mocked(getAuthenticatedEmployee).mockResolvedValue(null);

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.error).toBe("Autenticação necessária.");
    expect(listConversations).not.toHaveBeenCalled();
  });

  it("retorna 500 quando ocorre uma falha ao listar conversas", async () => {
    vi.mocked(listConversations).mockRejectedValue(
      new Error("Falha simulada no banco"),
    );

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.error).toBe("Não foi possível consultar as conversas.");
  });
});

describe("POST /api/conversations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getAuthenticatedEmployee).mockResolvedValue(authenticatedEmployee);
  });

  it("retorna 201 quando uma conversa é criada", async () => {
    vi.mocked(createConversation).mockResolvedValue(savedConversation as never);

    const response = await POST();
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body.message).toBe("Conversa criada com sucesso.");
    expect(body.data.id).toBe(savedConversation.id);
    expect(createConversation).toHaveBeenCalledWith(authenticatedEmployee.id);
  });

  it("retorna 401 quando não existe funcionário autenticado", async () => {
    vi.mocked(getAuthenticatedEmployee).mockResolvedValue(null);

    const response = await POST();
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.error).toBe("Autenticação necessária.");
    expect(createConversation).not.toHaveBeenCalled();
  });

  it("retorna 500 quando ocorre uma falha ao criar conversa", async () => {
    vi.mocked(createConversation).mockRejectedValue(
      new Error("Falha simulada no banco"),
    );

    const response = await POST();
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.error).toBe("Não foi possível criar a conversa.");
  });
});
