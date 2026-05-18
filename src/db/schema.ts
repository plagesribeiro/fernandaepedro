import {
  pgTable,
  serial,
  varchar,
  text,
  integer,
  decimal,
  timestamp,
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
  message: text("message"),
  pixCopiaECola: text("pix_copia_e_cola"),
  expiresAt: timestamp("expires_at"),
  paidAt: timestamp("paid_at"),
  createdAt: timestamp("created_at").defaultNow(),
});
