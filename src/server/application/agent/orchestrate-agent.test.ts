
import { describe, expect, it } from "vitest";
import { orchestrateAgent } from "./orchestrate-agent";
import type { AgentModelInterpretation } from "../../../types/agent";

function createInterpretation(
  overrides: Partial<AgentModelInterpretation> = {},
): AgentModelInterpretation {
  return {
    intent: "KNOWLEDGE_QUERY",
    understanding: "O funcionário precisa de ajuda com acesso à VPN.",
    confidence: 0.9,
    justification: "A mensagem apresenta uma dúvida técnica.",
    clarificationQuestion: null,
    ticketDraft: null,
    ...overrides,
  };
}

describe("orchestrateAgent", () => {
  it("deve responder consultas à central de conhecimento", () => {
    const result = orchestrateAgent(createInterpretation());

    expect(result.action).toBe("ANSWER_FROM_KNOWLEDGE");
  });

  it("deve listar chamados do funcionário", () => {
    const result = orchestrateAgent(
      createInterpretation({ intent: "LIST_TICKETS" }),
    );

    expect(result.action).toBe("LIST_TICKETS");
  });

  it("deve preparar a criação quando o rascunho estiver completo", () => {
    const result = orchestrateAgent(
      createInterpretation({
        intent: "CREATE_TICKET",
        ticketDraft: {
          title: "Falha de acesso à VPN",
          type: "INC",
          category: "NETWORK_VPN",
        },
      }),
    );

    expect(result.action).toBe("PREPARE_TICKET");
  });

  it("deve preparar a atualização quando o rascunho estiver completo", () => {
    const result = orchestrateAgent(
      createInterpretation({
        intent: "UPDATE_TICKET",
        ticketDraft: {
          title: "Atualização do chamado de VPN",
          type: "INC",
          category: "NETWORK_VPN",
        },
      }),
    );

    expect(result.action).toBe("PREPARE_TICKET_UPDATE");
  });

  it("deve transferir quando o funcionário solicitar atendimento humano", () => {
    const result = orchestrateAgent(
      createInterpretation({
        intent: "HUMAN_HANDOFF",
        confidence: 0.2,
      }),
    );

    expect(result.action).toBe("TRANSFER_TO_ANALYST");
  });

  it("deve redirecionar solicitações fora do escopo", () => {
    const result = orchestrateAgent(
      createInterpretation({ intent: "OUT_OF_SCOPE" }),
    );

    expect(result.action).toBe("REDIRECT_OUT_OF_SCOPE");
  });

  it("deve pedir esclarecimento para intenção desconhecida", () => {
    const result = orchestrateAgent(
      createInterpretation({ intent: "UNKNOWN" }),
    );

    expect(result.action).toBe("ASK_CLARIFICATION");
  });

  it("deve pedir esclarecimento quando a confiança estiver abaixo de 0.70", () => {
    const result = orchestrateAgent(
      createInterpretation({ confidence: 0.69 }),
    );

    expect(result.action).toBe("ASK_CLARIFICATION");
  });

  it("deve aceitar confiança exatamente igual a 0.70", () => {
    const result = orchestrateAgent(
      createInterpretation({ confidence: 0.7 }),
    );

    expect(result.action).toBe("ANSWER_FROM_KNOWLEDGE");
  });

  it("deve pedir esclarecimento quando o rascunho estiver incompleto", () => {
    const result = orchestrateAgent(
      createInterpretation({
        intent: "CREATE_TICKET",
        ticketDraft: {
          title: "Falha de acesso",
          type: "INC",
          category: null,
        },
      }),
    );

    expect(result.action).toBe("ASK_CLARIFICATION");
  });

  it("deve preservar a pergunta de esclarecimento produzida pelo Gemini", () => {
    const result = orchestrateAgent(
      createInterpretation({
        confidence: 0.4,
        clarificationQuestion: "Qual sistema você está tentando acessar?",
      }),
    );

    expect(result.clarificationQuestion).toBe(
      "Qual sistema você está tentando acessar?",
    );
  });

  it("deve fornecer uma pergunta padrão quando não houver pergunta de esclarecimento", () => {
    const result = orchestrateAgent(
      createInterpretation({
        intent: "UNKNOWN",
        clarificationQuestion: null,
      }),
    );

    expect(result.clarificationQuestion).toBe(
      "Não consegui compreender completamente sua solicitação. Poderia explicar um pouco melhor?",
    );
  });
});
