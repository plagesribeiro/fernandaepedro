CREATE TABLE "gifts" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"image_url" text NOT NULL,
	"price" numeric(10, 2) NOT NULL,
	"category" varchar(100),
	"total_quantity" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "pix_payments" (
	"id" serial PRIMARY KEY NOT NULL,
	"mercado_pago_id" varchar(255),
	"amount" numeric(10, 2) NOT NULL,
	"description" text,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"type" varchar(20) NOT NULL,
	"reserver_name" varchar(255) NOT NULL,
	"reserver_email" varchar(255) NOT NULL,
	"gift_id" integer,
	"message" text,
	"pix_copia_e_cola" text,
	"expires_at" timestamp,
	"paid_at" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "rsvp_confirmations" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"phone" varchar(20) NOT NULL,
	"guest_count" integer DEFAULT 1,
	"message" text,
	"browser_info" text,
	"ip_address" varchar(45),
	"confirmed_at" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "rsvp_guests" (
	"id" serial PRIMARY KEY NOT NULL,
	"rsvp_id" integer NOT NULL,
	"guest_name" varchar(255) NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "pix_payments" ADD CONSTRAINT "pix_payments_gift_id_gifts_id_fk" FOREIGN KEY ("gift_id") REFERENCES "public"."gifts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rsvp_guests" ADD CONSTRAINT "rsvp_guests_rsvp_id_rsvp_confirmations_id_fk" FOREIGN KEY ("rsvp_id") REFERENCES "public"."rsvp_confirmations"("id") ON DELETE no action ON UPDATE no action;