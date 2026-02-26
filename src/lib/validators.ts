import { z } from "zod";

const fullNameRegex = /^\S+\s+\S+/;

export const rsvpSchema = z
  .object({
    name: z
      .string()
      .min(2, "Nome deve ter pelo menos 2 caracteres")
      .max(255, "Nome muito longo")
      .regex(fullNameRegex, "Informe o nome completo (nome e sobrenome)"),
    email: z.string().email("Email inválido"),
    phone: z
      .string()
      .min(14, "Telefone inválido")
      .max(15, "Telefone inválido"),
    guestCount: z
      .number()
      .int()
      .min(1, "Mínimo 1 convidado")
      .max(5, "Máximo 5 convidados"),
    additionalGuests: z
      .array(
        z
          .string()
          .min(2, "Nome deve ter pelo menos 2 caracteres")
          .max(255, "Nome muito longo")
          .regex(fullNameRegex, "Informe o nome completo (nome e sobrenome)")
      )
      .default([]),
    message: z.string().max(500, "Mensagem muito longa").optional(),
  })
  .refine(
    (data) => data.additionalGuests.length === data.guestCount - 1,
    {
      message:
        "Informe o nome completo de todos os convidados adicionais",
      path: ["additionalGuests"],
    }
  );

export const giftReserveSchema = z.object({
  giftId: z.number().int().positive("Presente inválido"),
  reserverName: z
    .string()
    .min(2, "Nome deve ter pelo menos 2 caracteres")
    .max(255, "Nome muito longo"),
  reserverEmail: z.string().email("Email inválido"),
});

export const pixCreateSchema = z
  .object({
    type: z.enum(["gift", "donation"]),
    reserverName: z
      .string()
      .min(2, "Nome deve ter pelo menos 2 caracteres")
      .max(255, "Nome muito longo"),
    reserverEmail: z.string().email("Email inválido"),
    giftId: z.number().int().positive("Presente inválido").optional(),
    amount: z.number().positive("Valor deve ser positivo").optional(),
    message: z.string().max(500, "Mensagem muito longa").optional(),
  })
  .refine(
    (data) => {
      if (data.type === "gift") return data.giftId !== undefined;
      if (data.type === "donation") return data.amount !== undefined && data.amount >= 1;
      return false;
    },
    {
      message: "Dados incompletos para o tipo de pagamento",
      path: ["type"],
    }
  );

export const donationFormSchema = z.object({
  donorName: z
    .string()
    .min(2, "Nome deve ter pelo menos 2 caracteres")
    .max(255, "Nome muito longo"),
  donorEmail: z.string().email("Email inválido"),
  amount: z
    .number()
    .min(1, "Valor mínimo é R$ 1,00")
    .max(50000, "Valor máximo é R$ 50.000,00"),
  message: z.string().max(500, "Mensagem muito longa").optional(),
});

export type RsvpInput = z.infer<typeof rsvpSchema>;
export type GiftReserveInput = z.infer<typeof giftReserveSchema>;
export type PixCreateInput = z.infer<typeof pixCreateSchema>;
export type DonationFormInput = z.infer<typeof donationFormSchema>;
