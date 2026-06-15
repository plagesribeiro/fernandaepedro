import {
  pgTable,
  serial,
  varchar,
  text,
  integer,
  decimal,
  timestamp,
  boolean,
  jsonb,
} from "drizzle-orm/pg-core";

// Legacy: kept so `drizzle-kit push` doesn't drop preexisting rows.
// New flow writes to `rsvp_responses` and treats the Google Sheet as source of truth.
export const rsvpConfirmations = pgTable("rsvp_confirmations", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 20 }).notNull(),
  guestCount: integer("guest_count").default(1),
  message: text("message"),
  browserInfo: text("browser_info"),
  ipAddress: varchar("ip_address", { length: 45 }),
  confirmedAt: timestamp("confirmed_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const rsvpGuests = pgTable("rsvp_guests", {
  id: serial("id").primaryKey(),
  rsvpId: integer("rsvp_id")
    .references(() => rsvpConfirmations.id)
    .notNull(),
  guestName: varchar("guest_name", { length: 255 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const rsvpResponses = pgTable("rsvp_responses", {
  id: serial("id").primaryKey(),
  inviteGroupName: varchar("invite_group_name", { length: 255 }).notNull(),
  guestSlotIndex: integer("guest_slot_index").notNull(),
  guestOriginalName: varchar("guest_original_name", { length: 255 }),
  status: varchar("status", { length: 10 }).notNull(),
  nameFilled: varchar("name_filled", { length: 255 }),
  confirmedBy: varchar("confirmed_by", { length: 255 }).notNull(),
  ipAddress: varchar("ip_address", { length: 45 }),
  userAgent: text("user_agent"),
  sheetRowIndex: integer("sheet_row_index").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const gifts = pgTable("gifts", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  imageUrl: text("image_url").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  category: varchar("category", { length: 100 }),
  totalQuantity: integer("total_quantity").notNull().default(1),
  createdAt: timestamp("created_at").defaultNow(),
});

// Log de toda geração de IA — para auditoria, detectar abuso, e analytics.
// Não bloqueia o usuário se o log falhar (catch dentro do helper).
export const aiGenerations = pgTable("ai_generations", {
  id: serial("id").primaryKey(),
  // 'message' ou 'image'
  kind: varchar("kind", { length: 20 }).notNull(),
  reserverName: varchar("reserver_name", { length: 255 }),
  reserverEmail: varchar("reserver_email", { length: 255 }),
  reserverPhone: varchar("reserver_phone", { length: 30 }),
  ipAddress: varchar("ip_address", { length: 45 }),
  // Texto bruto do pedido do convidado (campo "prompt" no payload).
  prompt: text("prompt"),
  // Dica curta do convidado (só pra mensagem; null pra imagem).
  hint: text("hint"),
  // URL da imagem gerada salva no Blob (só pra image; null pra message).
  resultUrl: text("result_url"),
  // Trechinho do texto gerado (só pra message; null pra image). Truncado pra ~400 chars.
  resultText: text("result_text"),
  // Quantos anexos vieram no pedido (0–4).
  attachmentsCount: integer("attachments_count").default(0),
  // Quantos eram dataUrl (device/paste) vs galleryUrl.
  attachmentsDataUrl: integer("attachments_data_url").default(0),
  attachmentsGallery: integer("attachments_gallery").default(0),
  // URLs das imagens de input usadas no prompt. Array de { url, source }.
  // Uploads de dispositivo viram blob (gift-input-images/...); imagens da
  // galeria guardam o caminho público estático.
  attachmentUrls: jsonb("attachment_urls"),
  success: boolean("success").notNull(),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const pixPayments = pgTable("pix_payments", {
  id: serial("id").primaryKey(),
  mercadoPagoId: varchar("mercado_pago_id", { length: 255 }),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  description: text("description"),
  status: varchar("status", { length: 20 }).notNull().default("pending"),
  type: varchar("type", { length: 20 }).notNull(),
  reserverName: varchar("reserver_name", { length: 255 }).notNull(),
  reserverEmail: varchar("reserver_email", { length: 255 }).notNull(),
  giftId: integer("gift_id").references(() => gifts.id),
  preferenceId: varchar("preference_id", { length: 255 }),
  cartItems: jsonb("cart_items"),
  giftName: varchar("gift_name", { length: 255 }),
  reserverPhone: varchar("reserver_phone", { length: 30 }),
  paymentMethod: varchar("payment_method", { length: 30 }),
  auditWritten: boolean("audit_written").default(false).notNull(),
  inventoryDecremented: boolean("inventory_decremented")
    .default(false)
    .notNull(),
  message: text("message"),
  giftImageUrl: text("gift_image_url"),
  pixCopiaECola: text("pix_copia_e_cola"),
  expiresAt: timestamp("expires_at"),
  paidAt: timestamp("paid_at"),
  createdAt: timestamp("created_at").defaultNow(),
});
