import {
  pgTable,
  serial,
  varchar,
  text,
  integer,
  decimal,
  timestamp,
} from "drizzle-orm/pg-core";

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

export const gifts = pgTable("gifts", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  imageUrl: text("image_url").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  category: varchar("category", { length: 100 }),
  totalQuantity: integer("total_quantity").notNull().default(1),
  reservedQuantity: integer("reserved_quantity").notNull().default(0),
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

export const giftReservations = pgTable("gift_reservations", {
  id: serial("id").primaryKey(),
  giftId: integer("gift_id").references(() => gifts.id),
  reserverName: varchar("reserver_name", { length: 255 }).notNull(),
  reserverEmail: varchar("reserver_email", { length: 255 }).notNull(),
  pixPaymentId: integer("pix_payment_id").references(() => pixPayments.id),
  reservedAt: timestamp("reserved_at").defaultNow(),
});

export const donations = pgTable("donations", {
  id: serial("id").primaryKey(),
  pixPaymentId: integer("pix_payment_id")
    .references(() => pixPayments.id)
    .notNull(),
  donorName: varchar("donor_name", { length: 255 }).notNull(),
  donorEmail: varchar("donor_email", { length: 255 }).notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  message: text("message"),
  paidAt: timestamp("paid_at"),
  createdAt: timestamp("created_at").defaultNow(),
});
