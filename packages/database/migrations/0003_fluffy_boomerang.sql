CREATE TABLE "company"."billing_accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"partner_id" uuid NOT NULL,
	"billing_contact_name" varchar(100) NOT NULL,
	"billing_email" varchar(255) NOT NULL,
	"tax_id_reference" varchar(100),
	"currency" varchar(10) DEFAULT 'USD' NOT NULL,
	"billing_cycle" varchar(50) DEFAULT 'MONTHLY' NOT NULL,
	"status" varchar(50) DEFAULT 'ACTIVE' NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "company"."invoices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"billing_account_id" uuid NOT NULL,
	"subscription_id" uuid,
	"invoice_number" varchar(100) NOT NULL,
	"issue_date" timestamp with time zone DEFAULT now() NOT NULL,
	"due_date" timestamp with time zone NOT NULL,
	"currency" varchar(10) DEFAULT 'USD' NOT NULL,
	"subtotal" varchar(50) DEFAULT '0.00' NOT NULL,
	"tax_amount" varchar(50) DEFAULT '0.00' NOT NULL,
	"total_amount" varchar(50) DEFAULT '0.00' NOT NULL,
	"status" varchar(50) DEFAULT 'DRAFT' NOT NULL,
	"notes" text,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "company"."payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"invoice_id" uuid NOT NULL,
	"amount" varchar(50) NOT NULL,
	"currency" varchar(10) DEFAULT 'USD' NOT NULL,
	"payment_status" varchar(50) DEFAULT 'PENDING' NOT NULL,
	"provider" varchar(100) DEFAULT 'MANUAL_WIRE' NOT NULL,
	"provider_reference" varchar(255),
	"payment_date" timestamp with time zone,
	"failure_reason_code" varchar(100),
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "company"."subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"partner_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"plan_id" uuid NOT NULL,
	"plan_version" varchar(20) DEFAULT '1.0.0' NOT NULL,
	"status" varchar(50) DEFAULT 'PENDING' NOT NULL,
	"billing_cycle" varchar(50) DEFAULT 'MONTHLY' NOT NULL,
	"start_date" timestamp with time zone DEFAULT now() NOT NULL,
	"renewal_date" timestamp with time zone,
	"end_date" timestamp with time zone,
	"cancellation_date" timestamp with time zone,
	"cancellation_reason" text,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "company"."billing_accounts" ADD CONSTRAINT "billing_accounts_partner_id_partner_profiles_id_fk" FOREIGN KEY ("partner_id") REFERENCES "company"."partner_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company"."invoices" ADD CONSTRAINT "invoices_billing_account_id_billing_accounts_id_fk" FOREIGN KEY ("billing_account_id") REFERENCES "company"."billing_accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company"."invoices" ADD CONSTRAINT "invoices_subscription_id_subscriptions_id_fk" FOREIGN KEY ("subscription_id") REFERENCES "company"."subscriptions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company"."payments" ADD CONSTRAINT "payments_invoice_id_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "company"."invoices"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company"."subscriptions" ADD CONSTRAINT "subscriptions_partner_id_partner_profiles_id_fk" FOREIGN KEY ("partner_id") REFERENCES "company"."partner_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company"."subscriptions" ADD CONSTRAINT "subscriptions_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "company"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company"."subscriptions" ADD CONSTRAINT "subscriptions_plan_id_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "company"."plans"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_billing_accounts_partner_id" ON "company"."billing_accounts" USING btree ("partner_id");--> statement-breakpoint
CREATE INDEX "idx_billing_accounts_status" ON "company"."billing_accounts" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_invoices_number" ON "company"."invoices" USING btree ("invoice_number");--> statement-breakpoint
CREATE INDEX "idx_invoices_billing_account" ON "company"."invoices" USING btree ("billing_account_id");--> statement-breakpoint
CREATE INDEX "idx_invoices_subscription" ON "company"."invoices" USING btree ("subscription_id");--> statement-breakpoint
CREATE INDEX "idx_invoices_status" ON "company"."invoices" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_payments_invoice_id" ON "company"."payments" USING btree ("invoice_id");--> statement-breakpoint
CREATE INDEX "idx_payments_status" ON "company"."payments" USING btree ("payment_status");--> statement-breakpoint
CREATE INDEX "idx_subscriptions_partner_id" ON "company"."subscriptions" USING btree ("partner_id");--> statement-breakpoint
CREATE INDEX "idx_subscriptions_product_id" ON "company"."subscriptions" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "idx_subscriptions_status" ON "company"."subscriptions" USING btree ("status");