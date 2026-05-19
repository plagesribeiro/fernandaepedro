import { z } from "zod";

const fullNameRegex = /^\S+\s+\S+/;

export const rsvpSearchSchema = z.object({
  q: z.string().trim().min(2, "Digite pelo menos 2 letras").max(100),
});

export const rsvpSubmitSchema = z.object({
  inviteGroupName: z.string().min(1).max(255),
  confirmedBy: z
    .string()
    .trim()
    .min(2, "Informe quem está confirmando")
    .max(255),
  responses: z
    .array(
      z.object({
        guestSlotIndex: z.number().int().min(0).max(20),
        status: z.enum(["Sim", "Nao"]),
        nameFilled: z
          .string()
          .trim()
          .max(255)
          .optional()
          .or(z.literal("")),
      })
    )
    .min(1)
    .max(20),
});

export type RsvpSearchInput = z.infer<typeof rsvpSearchSchema>;
export type RsvpSubmitInput = z.infer<typeof rsvpSubmitSchema>;

export const checkoutItemSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("gift"),
    giftName: z.string().min(1).max(255),
    quantity: z.number().int().positive().max(20),
  }),
  z.object({
    kind: z.literal("donation"),
    amount: z.number().positive().max(50000),
  }),
]);

// Restringe a URL a hosts oficiais do Vercel Blob — impede que o cliente injete
// URLs arbitrárias no campo gift_image_url do banco / planilha.
export const blobImageUrlSchema = z
  .string()
  .url("URL de imagem inválida")
  .refine(
    (url) => {
      try {
        const host = new URL(url).hostname;
        return (
          host.endsWith(".public.blob.vercel-storage.com") ||
          host.endsWith(".blob.vercel-storage.com")
        );
      } catch {
        return false;
      }
    },
    { message: "URL de imagem precisa ser do Vercel Blob" }
  );

export const checkoutCreateSchema = z.object({
  items: z.array(checkoutItemSchema).min(1).max(50),
  reserverName: z
    .string()
    .trim()
    .min(2, "Informe seu nome")
    .max(255, "Nome muito longo"),
  reserverEmail: z.string().email("Email inválido"),
  reserverPhone: z
    .string()
    .trim()
    .min(10, "Telefone inválido")
    .max(25, "Telefone inválido"),
  message: z.string().max(500, "Mensagem muito longa").optional(),
  giftImageUrl: blobImageUrlSchema.optional(),
});

export type CheckoutItem = z.infer<typeof checkoutItemSchema>;
export type CheckoutCreateInput = z.infer<typeof checkoutCreateSchema>;

const buyerBaseSchema = {
  items: z.array(checkoutItemSchema).min(1).max(50),
  reserverName: z.string().trim().min(2, "Informe seu nome").max(255),
  reserverEmail: z.string().email("Email inválido"),
  reserverPhone: z.string().trim().min(10, "Telefone inválido").max(25),
  message: z.string().max(500, "Mensagem muito longa").optional(),
  giftImageUrl: blobImageUrlSchema.optional(),
};

const cardFormDataSchema = z
  .object({
    token: z.string().min(1),
    payment_method_id: z.string().min(1),
    installments: z.number().int().positive(),
    issuer_id: z.union([z.string(), z.number()]).optional(),
    payer: z.object({
      email: z.string().email().optional(),
      identification: z
        .object({
          type: z.string(),
          number: z.string(),
        })
        .optional(),
    }),
    transaction_amount: z.number().positive().optional(),
  })
  .passthrough();

export const checkoutProcessSchema = z.discriminatedUnion("paymentMethod", [
  z.object({
    paymentMethod: z.literal("card"),
    ...buyerBaseSchema,
    formData: cardFormDataSchema,
  }),
  z.object({
    paymentMethod: z.literal("pix"),
    ...buyerBaseSchema,
  }),
]);

export type CheckoutProcessInput = z.infer<typeof checkoutProcessSchema>;

// Legacy: kept while old route is still around. New flow uses rsvpSubmitSchema.
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
    additionalGuests: z.array(
      z
        .string()
        .min(2, "Nome deve ter pelo menos 2 caracteres")
        .max(255, "Nome muito longo")
        .regex(fullNameRegex, "Informe o nome completo (nome e sobrenome)")
    ),
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
  giftName: z.string().min(1, "Presente inválido").max(255),
  reserverName: z
    .string()
    .min(2, "Nome deve ter pelo menos 2 caracteres")
    .max(255, "Nome muito longo"),
  reserverEmail: z.string().email("Email inválido"),
});

const phoneSchema = z
  .string()
  .trim()
  .min(10, "Telefone inválido")
  .max(25, "Telefone inválido");

export const pixCreateSchema = z
  .object({
    type: z.enum(["gift", "donation"]),
    reserverName: z
      .string()
      .trim()
      .min(2, "Nome deve ter pelo menos 2 caracteres")
      .max(255, "Nome muito longo"),
    reserverEmail: z.string().email("Email inválido"),
    reserverPhone: phoneSchema,
    giftName: z.string().min(1).max(255).optional(),
    amount: z.number().positive("Valor deve ser positivo").optional(),
    message: z.string().max(500, "Mensagem muito longa").optional(),
  })
  .refine(
    (data) => {
      if (data.type === "gift") return !!data.giftName;
      if (data.type === "donation")
        return data.amount !== undefined && data.amount >= 1;
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
