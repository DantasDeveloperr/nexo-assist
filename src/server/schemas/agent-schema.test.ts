
import { describe, expect, it } from "vitest";
import {
  agentInterpretationSchema,
  agentModelInterpretationSchema,
} from "./agent-schema";

const validModelInterpretation = {
  intent: "CREATE_TICKET",
  understanding: "O funcionário deseja relatar um problema de acesso.",
  confidence: 0.95,
  justification: "A mensagem indica uma dificuldade de acesso.",
  clarificationQuestion: null,
  ticketDraft: {
    title: "Problema de acesso ao sistema",
    type: "INC",
    category: "ACCESS",
  },
};

describe("agentModelInterpretationSchema", () => {
  it("deve aceitar uma interpretação válida do Gemini sem ação", () => {
    const result = agentModelInterpretationSchema.safeParse(
      validModelInterpretation,
    );

    expect(result.success).toBe(true);
  });

  it("deve rejeitar uma intenção desconhecida", () => {
    const result = agentModelInterpretationSchema.safeParse({
      ...validModelInterpretation,
      intent: "DELETE_DATABASE",
    });

    expect(result.success).toBe(false);
  });

  it("deve rejeitar confiança fora do intervalo permitido", () => {
    const result = agentModelInterpretationSchema.safeParse({
      ...validModelInterpretation,
      confidence: 1.5,
    });

    expect(result.success).toBe(false);
  });

  it("deve rejeitar uma categoria inválida", () => {
    const result = agentModelInterpretationSchema.safeParse({
      ...validModelInterpretation,
      ticketDraft: {
        ...validModelInterpretation.ticketDraft,
        category: "FINANCE",
      },
    });

    expect(result.success).toBe(false);
  });

  it("deve rejeitar entendimento vazio", () => {
    const result = agentModelInterpretationSchema.safeParse({
      ...validModelInterpretation,
      understanding: "",
    });

    expect(result.success).toBe(false);
  });
});

describe("agentInterpretationSchema", () => {
  it("deve aceitar a interpretação completa com ação do backend", () => {
    const result = agentInterpretationSchema.safeParse({
      ...validModelInterpretation,
      action: "PREPARE_TICKET",
    });

    expect(result.success).toBe(true);
  });

  it("deve rejeitar interpretação completa sem ação", () => {
    const result = agentInterpretationSchema.safeParse(
      validModelInterpretation,
    );

    expect(result.success).toBe(false);
  });
});
