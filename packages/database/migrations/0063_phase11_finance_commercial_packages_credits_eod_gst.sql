CREATE TABLE IF NOT EXISTS "clinical"."billing_packages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"partner_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"branch_id" uuid,
	"package_code" varchar(64) NOT NULL,
	"package_name" varchar(255) NOT NULL,
	"description" text,
	"category" varchar(64) DEFAULT 'GENERAL' NOT NULL,
	"total_price" numeric(12, 2) DEFAULT '0.00' NOT NULL,
	"validity_days" integer DEFAULT 365 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "clinical"."billing_package_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"package_id" uuid NOT NULL,
	"service_catalog_id" uuid,
	"service_code" varchar(64) NOT NULL,
	"service_name" varchar(255) NOT NULL,
	"quantity_included" integer DEFAULT 1 NOT NULL,
	"unit_price" numeric(12, 2) DEFAULT '0.00' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "clinical"."patient_packages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"partner_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"branch_id" uuid,
	"patient_id" uuid NOT NULL,
	"package_id" uuid NOT NULL,
	"invoice_id" uuid,
	"package_number" varchar(64) NOT NULL,
	"purchased_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"status" varchar(64) DEFAULT 'ACTIVE' NOT NULL,
	"total_price" numeric(12, 2) DEFAULT '0.00' NOT NULL,
	"notes" text,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "clinical"."patient_package_consumptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"patient_package_id" uuid NOT NULL,
	"package_item_id" uuid,
	"encounter_id" uuid,
	"service_code" varchar(64) NOT NULL,
	"service_name" varchar(255) NOT NULL,
	"quantity_consumed" integer DEFAULT 1 NOT NULL,
	"consumed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"recorded_by" varchar(255) NOT NULL,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "clinical"."patient_credit_accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"partner_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"branch_id" uuid,
	"patient_id" uuid NOT NULL,
	"credit_limit" numeric(12, 2) DEFAULT '0.00' NOT NULL,
	"outstanding_balance" numeric(12, 2) DEFAULT '0.00' NOT NULL,
	"status" varchar(64) DEFAULT 'ACTIVE' NOT NULL,
	"authorized_by" varchar(255) NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "clinical"."purchase_invoice_payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"partner_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"branch_id" uuid,
	"purchase_invoice_id" uuid NOT NULL,
	"payment_number" varchar(64) NOT NULL,
	"amount" numeric(14, 2) NOT NULL,
	"payment_method" varchar(50) DEFAULT 'BANK_TRANSFER' NOT NULL,
	"reference_number" varchar(255),
	"paid_at" timestamp with time zone DEFAULT now() NOT NULL,
	"paid_by" varchar(255) NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "clinical"."billing_eod_closings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"partner_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"branch_id" uuid NOT NULL,
	"closing_date" varchar(10) NOT NULL,
	"gross_billing" numeric(14, 2) DEFAULT '0.00' NOT NULL,
	"discount_total" numeric(14, 2) DEFAULT '0.00' NOT NULL,
	"tax_total" numeric(14, 2) DEFAULT '0.00' NOT NULL,
	"net_billing" numeric(14, 2) DEFAULT '0.00' NOT NULL,
	"total_collected" numeric(14, 2) DEFAULT '0.00' NOT NULL,
	"cash_collected" numeric(14, 2) DEFAULT '0.00' NOT NULL,
	"digital_collected" numeric(14, 2) DEFAULT '0.00' NOT NULL,
	"total_refunded" numeric(14, 2) DEFAULT '0.00' NOT NULL,
	"credit_issued" numeric(14, 2) DEFAULT '0.00' NOT NULL,
	"ar_collected" numeric(14, 2) DEFAULT '0.00' NOT NULL,
	"ap_paid" numeric(14, 2) DEFAULT '0.00' NOT NULL,
	"department_breakdown" jsonb DEFAULT '{}'::jsonb,
	"variance_total" numeric(14, 2) DEFAULT '0.00' NOT NULL,
	"exceptions_count" integer DEFAULT 0 NOT NULL,
	"status" varchar(50) DEFAULT 'CLOSED' NOT NULL,
	"closed_by" varchar(255) NOT NULL,
	"closed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"reopened_by" varchar(255),
	"reopened_at" timestamp with time zone,
	"reopen_reason" text,
	"notes" text,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "clinical"."gst_tax_rates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"tax_category" varchar(64) NOT NULL,
	"hsn_sac_code" varchar(32) NOT NULL,
	"cgst_rate_percent" numeric(5, 2) DEFAULT '0.00' NOT NULL,
	"sgst_rate_percent" numeric(5, 2) DEFAULT '0.00' NOT NULL,
	"igst_rate_percent" numeric(5, 2) DEFAULT '0.00' NOT NULL,
	"is_exempt" boolean DEFAULT false NOT NULL,
	"description" text,
	"effective_from" timestamp with time zone DEFAULT now() NOT NULL,
	"effective_to" timestamp with time zone,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_bp_tenant" ON "clinical"."billing_packages" ("tenant_id");
CREATE UNIQUE INDEX IF NOT EXISTS "idx_bp_code" ON "clinical"."billing_packages" ("tenant_id", "package_code");
CREATE INDEX IF NOT EXISTS "idx_bpi_tenant_pkg" ON "clinical"."billing_package_items" ("tenant_id", "package_id");
CREATE INDEX IF NOT EXISTS "idx_pp_tenant_pat" ON "clinical"."patient_packages" ("tenant_id", "patient_id");
CREATE UNIQUE INDEX IF NOT EXISTS "idx_pp_code" ON "clinical"."patient_packages" ("tenant_id", "package_number");
CREATE INDEX IF NOT EXISTS "idx_ppc_tenant_pp" ON "clinical"."patient_package_consumptions" ("tenant_id", "patient_package_id");
CREATE UNIQUE INDEX IF NOT EXISTS "idx_pca_tenant_patient" ON "clinical"."patient_credit_accounts" ("tenant_id", "patient_id");
CREATE INDEX IF NOT EXISTS "idx_pip_tenant_pinv" ON "clinical"."purchase_invoice_payments" ("tenant_id", "purchase_invoice_id");
CREATE UNIQUE INDEX IF NOT EXISTS "idx_pip_number" ON "clinical"."purchase_invoice_payments" ("tenant_id", "payment_number");
CREATE UNIQUE INDEX IF NOT EXISTS "idx_eod_tenant_branch_date" ON "clinical"."billing_eod_closings" ("tenant_id", "branch_id", "closing_date");
CREATE UNIQUE INDEX IF NOT EXISTS "idx_gst_tenant_cat" ON "clinical"."gst_tax_rates" ("tenant_id", "tax_category");
