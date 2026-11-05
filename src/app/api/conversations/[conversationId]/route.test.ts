import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../../../server/auth/current-employee", () => ({
  getAuthenticatedEmployee: vi.fn(),
}));

vi.mock("../../../../server/application/conversations/get-conversation", () => ({
  getConversation: vi.fn(),
}));

import { getAuthenticatedEmployee } from "../../../../server/auth/current-employee";
import { getConversation } from "../../../../server/application/conversations/get-conversation";
import { GET } from "./route";

const authenticatedEmployee = {
  id: "employee-123",
  name: "Funcionário de Teste",
  email: "funcionario@teste.com",
};

const savedConversation = {
  id: "conversation-001",
  title: "Problema com VPN",
  status: "ACTIVE",
  waitingForEmployee: false,
  assignedAnalystId: null,
  lastMessageAt: new Date("2026-11-04T12:30:00.000Z"),
  createdAt: new Date("2026-11-04T12:00:00.000Z"),
  updatedAt: new Date("2026-11-04T12:30:00.000Z"),
  closedAt: null,
  messages: [
    {
      id: "message-001",
      senderType: "EMPLOYEE",
      content: "Não consigo conectar à VPN.",
      processingStatus: "NOT_REQUIRED",
      createdAt: new Date("2026-11-04T12:00:00.000Z"),
      agentDecisions: [],
    },
    {
      id: "message-002",
      senderType: "AGENT",
      content: "Vou verificar o problema.",
      processingStatus: "COMPLETED",
      createdAt: new Date("2026-11-04T12:01:00.000Z"),
      agentDecisions: [
        {
          intent: "INCIDENT",
          understanding: "Funcionário relata falha na VPN.",
          action: "CONSULT_HELP_CENTER",
          confidence: 0.95,
          justification: "O relato indica dificuldade de conexão.",
          outcome: "SUCCESS",
          modelVersion: "gemini-test",
          promptVersion: "v1",
          createdAt: new Date("2026-11-04T12:01:00.000Z"),
        },
      ],
    },
  ],
};

function createGetRequest(): Request {
  return new Request(
    "http://localhost/api/conversations/conversation-001",
    {
      method: "GET",
    },
  );
}

function createRouteContext(conversationId = "conversation-001") {
  return {
    params: Promise.resolve({ conversationId }),
  };
}

describe("GET /api/conversations/[conversationId]", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(getAuthenticatedEmployee).mockResolvedValue(
      authenticatedEmployee,
    );
  });

  it("retorna 200 com a conversa, mensagens e decisões do agente", async () => {
    vi.mocked(getConversation).mockResolvedValue(
      savedConversation as never,
    );

    const response = await GET(
      createGetRequest(),
      createRouteContext(),
    );

    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.message).toBe("Conversa consultada com sucesso.");
    expect(body.data.id).toBe(savedConversation.id);
    expect(body.data.messages).toHaveLength(2);
    expect(body.data.messages[1].agentDecisions).toHaveLength(1);

    expect(getConversation).toHaveBeenCalledWith(
      "conversation-001",
      authenticatedEmployee.id,
    );
  });

  it("retorna 404 quando a conversa não existe ou não pertence ao funcionário", async () => {
    vi.mocked(getConversation).mockResolvedValue(null);

    const response = await GET(
      createGetRequest(),
      createRouteContext(),
    );

    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body.error).toBe("Conversa não encontrada.");

    expect(getConversation).toHaveBeenCalledWith(
      "conversation-001",
      authenticatedEmployee.id,
    );
  });

  it("retorna 401 quando não existe funcionário autenticado", async () => {
    vi.mocked(getAuthenticatedEmployee).mockResolvedValue(null);

    const response = await GET(
      createGetRequest(),
      createRouteContext(),
    );

    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.error).toBe("Autenticação necessária.");
    expect(getConversation).not.toHaveBeenCalled();
  });

  it("retorna 500 quando ocorre uma falha ao consultar a conversa", async () => {
    vi.mocked(getConversation).mockRejectedValue(
      new Error("Falha simulada no banco"),
    );

    const response = await GET(
      createGetRequest(),
      createRouteContext(),
    );

    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.error).toBe(
      "Não foi possível consultar a conversa.",
    );
  });
});