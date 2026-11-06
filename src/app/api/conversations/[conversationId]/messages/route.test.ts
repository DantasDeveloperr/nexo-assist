
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getAuthenticatedEmployee: vi.fn(),
  sendMessage: vi.fn(),
  processAgentMessage: vi.fn(),
}));

vi.mock("../../../../../server/auth/current-employee", () => ({
  getAuthenticatedEmployee: mocks.getAuthenticatedEmployee,
}));

vi.mock("../../../../../server/application/conversations/send-message", () => ({
  sendMessage: mocks.sendMessage,
}));

vi.mock("../../../../../server/application/agent/process-agent-message", () => ({
  processAgentMessage: mocks.processAgentMessage,
}));

import { POST } from "./route";

describe("POST /api/conversations/[conversationId]/messages", () => {
  const employee = {
    id: "employee-123",
    name: "Funcionário Teste",
    email: "funcionario@empresa.com",
  };

  const conversationId = "conversation-001";
  const content = "Preciso de ajuda com meu acesso.";

  const sentMessage = {
    id: "message-001",
    conversationId,
    senderEmployeeId: employee.id,
    senderType: "EMPLOYEE",
    content,
    processingStatus: "PENDING",
  };

  function createRequest(body: unknown) {
    return new Request(
      `http://localhost:3000/api/conversations/${conversationId}/messages`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      },
    );
  }

  function createContext() {
    return {
      params: Promise.resolve({ conversationId }),
    };
  }

  beforeEach(() => {
    vi.clearAllMocks();

    mocks.getAuthenticatedEmployee.mockResolvedValue(employee);

    mocks.sendMessage.mockResolvedValue({
      outcome: "SENT",
      message: sentMessage,
    });

    mocks.processAgentMessage.mockResolvedValue({
      status: "PROCESSED",
      action: "ASK_CLARIFICATION",
    });
  });

  it("envia uma mensagem, processa com o agente e retorna 201", async () => {
    const response = await POST(
      createRequest({ content }),
      createContext(),
    );

    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body.message).toBe("Mensagem enviada com sucesso.");
    expect(body.data).toEqual(sentMessage);
    expect(body.agentProcessing).toEqual({
      status: "PROCESSED",
      action: "ASK_CLARIFICATION",
    });

    expect(mocks.sendMessage).toHaveBeenCalledWith(employee.id, {
      conversationId,
      content,
    });

    expect(mocks.processAgentMessage).toHaveBeenCalledWith({
      conversationId,
      messageId: sentMessage.id,
    });
  });

  it("retorna 401 quando o funcionário não está autenticado", async () => {
    mocks.getAuthenticatedEmployee.mockResolvedValue(null);

    const response = await POST(
      createRequest({ content }),
      createContext(),
    );

    expect(response.status).toBe(401);
    expect(mocks.sendMessage).not.toHaveBeenCalled();
    expect(mocks.processAgentMessage).not.toHaveBeenCalled();
  });

  it("retorna 400 quando o conteúdo está vazio", async () => {
    const response = await POST(
      createRequest({ content: " " }),
      createContext(),
    );

    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe("Dados da mensagem inválidos.");
    expect(mocks.sendMessage).not.toHaveBeenCalled();
    expect(mocks.processAgentMessage).not.toHaveBeenCalled();
  });

  it("retorna 400 quando o conteúdo ultrapassa 2000 caracteres", async () => {
    const response = await POST(
      createRequest({ content: "a".repeat(2001) }),
      createContext(),
    );

    expect(response.status).toBe(400);
    expect(mocks.sendMessage).not.toHaveBeenCalled();
    expect(mocks.processAgentMessage).not.toHaveBeenCalled();
  });

  it("retorna 404 quando a conversa não é encontrada", async () => {
    mocks.sendMessage.mockResolvedValue({
      outcome: "NOT_FOUND",
    });

    const response = await POST(
      createRequest({ content }),
      createContext(),
    );

    expect(response.status).toBe(404);
    expect(mocks.processAgentMessage).not.toHaveBeenCalled();
  });

  it("retorna 409 quando a conversa está encerrada", async () => {
    mocks.sendMessage.mockResolvedValue({
      outcome: "CLOSED",
    });

    const response = await POST(
      createRequest({ content }),
      createContext(),
    );

    expect(response.status).toBe(409);
    expect(mocks.processAgentMessage).not.toHaveBeenCalled();
  });

  it("retorna 409 quando o limite de mensagens foi atingido", async () => {
    mocks.sendMessage.mockResolvedValue({
      outcome: "MESSAGE_LIMIT_REACHED",
    });

    const response = await POST(
      createRequest({ content }),
      createContext(),
    );

    expect(response.status).toBe(409);
    expect(mocks.processAgentMessage).not.toHaveBeenCalled();
  });

  it("retorna 500 quando ocorre uma falha inesperada ao salvar a mensagem", async () => {
    mocks.sendMessage.mockRejectedValue(
      new Error("Falha simulada no banco"),
    );

    const response = await POST(
      createRequest({ content }),
      createContext(),
    );

    expect(response.status).toBe(500);
    expect(mocks.processAgentMessage).not.toHaveBeenCalled();
  });

  it("mantém 201 quando o processamento do agente é ignorado", async () => {
    mocks.processAgentMessage.mockResolvedValue({
      status: "SKIPPED",
      reason: "CONVERSATION_NOT_ACTIVE",
    });

    const response = await POST(
      createRequest({ content }),
      createContext(),
    );

    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body.agentProcessing).toEqual({
      status: "SKIPPED",
      reason: "CONVERSATION_NOT_ACTIVE",
    });
  });

  it("mantém 201 quando ocorre uma falha no processamento do agente", async () => {
    mocks.processAgentMessage.mockRejectedValue(
      new Error("Falha simulada no Gemini"),
    );

    const response = await POST(
      createRequest({ content }),
      createContext(),
    );

    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body.message).toBe("Mensagem enviada com sucesso.");
    expect(body.data).toEqual(sentMessage);
    expect(body.agentProcessing).toEqual({
      status: "FAILED",
    });
  });
});
