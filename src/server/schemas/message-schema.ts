
import { z } from "zod";

export const sendMessageSchema = z.object({
  conversationId: z
    .string()
    .trim()
    .min(1, "O identificador da conversa é obrigatório."),

  content: z
    .string()
    .trim()
    .min(1, "A mensagem não pode estar vazia.")
    .max(2000, "A mensagem deve ter no máximo 2000 caracteres."),
});

export type SendMessageInput = z.infer<typeof sendMessageSchema>;
