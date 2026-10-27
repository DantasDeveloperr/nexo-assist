
import { z } from "zod";

export const createTicketSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "O título é obrigatório.")
    .max(120, "O título deve ter no máximo 120 caracteres."),

  description: z
    .string()
    .trim()
    .min(1, "A descrição é obrigatória.")
    .max(2000, "A descrição deve ter no máximo 2000 caracteres."),

  type: z.enum(["INC", "REQ"], {
    error: "O tipo deve ser INC ou REQ.",
  }),

  category: z.enum(
    [
      "ACCESS",
      "NETWORK_VPN",
      "HARDWARE",
      "SOFTWARE",
      "EMAIL",
      "OTHER",
    ],
    {
      error: "A categoria informada é inválida.",
    },
  ),

  priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"], {
    error: "A prioridade informada é inválida.",
  }),

  affectedEmployeeId: z
    .string()
    .trim()
    .min(1, "O identificador da pessoa afetada é obrigatório."),
});

export type CreateTicketInput = z.infer<typeof createTicketSchema>;

export const updateTicketSchema = createTicketSchema
  .omit({
    affectedEmployeeId: true,
  })
  .extend({
    status: z.enum(
      [
        "OPEN",
        "IN_PROGRESS",
        "WAITING_FOR_EMPLOYEE",
        "RESOLVED",
        "CLOSED",
      ],
      {
        error: "O status informado é inválido.",
      },
    ).optional(),
  })
  .partial()
  .strict()
  .refine(
    (data) => Object.keys(data).length > 0,
    {
      message: "Informe pelo menos um campo para atualizar.",
    },
  );

export type UpdateTicketInput = z.infer<typeof updateTicketSchema>;