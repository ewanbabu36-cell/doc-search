CREATE TABLE "clinical"."billing_advances" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"partner_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"branch_id" uuid NOT NULL,
	"patient_id" uuid NOT NULL,
	"encounter_id" uuid,
	"advance_number" varchar(100) NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"available_amount" numeric(12, 2) NOT NULL,
	"payment_id" uuid,
	"status" varchar(50) DEFAULT 'ACTIVE' NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "billing_advances_advance_number_unique" UNIQUE("advance_number")
);
--> statement-breakpoint
CREATE TABLE "clinical"."billing_audit_traces" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"partner_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"branch_id" uuid,
	"trace_id" varchar(100) NOT NULL,
	"correlation_id" varchar(100) NOT NULL,
	"actor_id" varchar(255) NOT NULL,
	"actor_role" varchar(100) NOT NULL,
	"operation" varchar(100) NOT NULL,
	"entity_type" varchar(100) NOT NULL,
	"entity_id" varchar(100) NOT NULL,
	"patient_id" uuid,
	"invoice_id" uuid,
	"before_snapshot" jsonb,
	"after_snapshot" jsonb,
	"financial_impact" numeric(12, 2) DEFAULT '0.00',
	"reason" text NOT NULL,
	"operation_status" varchar(50) DEFAULT 'SUCCESS' NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"timestamp" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "billing_audit_traces_trace_id_unique" UNIQUE("trace_id")
);
--> statement-breakpoint
CREATE TABLE "clinical"."billing_cashier_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"partner_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"branch_id" uuid NOT NULL,
	"cashier_id" varchar(255) NOT NULL,
	"cashier_name" varchar(255) NOT NULL,
	"session_number" varchar(100) NOT NULL,
	"opening_balance" numeric(12, 2) DEFAULT '0.00' NOT NULL,
	"cash_received" numeric(12, 2) DEFAULT '0.00' NOT NULL,
	"cash_refunded" numeric(12, 2) DEFAULT '0.00' NOT NULL,
	"expected_closing_balance" numeric(12, 2) DEFAULT '0.00' NOT NULL,
	"closing_balance" numeric(12, 2),
	"status" varchar(50) DEFAULT 'OPEN' NOT NULL,
	"opened_at" timestamp with time zone DEFAULT now() NOT NULL,
	"closed_at" timestamp with time zone,
	"notes" text,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "billing_cashier_sessions_session_number_unique" UNIQUE("session_number")
);
--> statement-breakpoint
CREATE TABLE "clinical"."billing_charge_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"charge_id" uuid NOT NULL,
	"service_catalog_id" uuid,
	"description" varchar(255) NOT NULL,
	"quantity" numeric(10, 2) DEFAULT '1.00' NOT NULL,
	"unit_price" numeric(12, 2) NOT NULL,
	"gross_amount" numeric(12, 2) NOT NULL,
	"discount_amount" numeric(12, 2) DEFAULT '0.00' NOT NULL,
	"tax_amount" numeric(12, 2) DEFAULT '0.00' NOT NULL,
	"net_amount" numeric(12, 2) NOT NULL,
	"source_reference" varchar(255),
	"ordering_doctor_id" varchar(255),
	"department_id" varchar(255),
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clinical"."billing_charges" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"partner_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"branch_id" uuid NOT NULL,
	"patient_id" uuid NOT NULL,
	"encounter_id" uuid,
	"consultation_id" uuid,
	"source_domain" varchar(100) NOT NULL,
	"source_entity_id" varchar(100),
	"charge_number" varchar(100) NOT NULL,
	"status" varchar(50) DEFAULT 'CAPTURED' NOT NULL,
	"subtotal" numeric(12, 2) DEFAULT '0.00' NOT NULL,
	"discount_total" numeric(12, 2) DEFAULT '0.00' NOT NULL,
	"tax_total" numeric(12, 2) DEFAULT '0.00' NOT NULL,
	"grand_total" numeric(12, 2) DEFAULT '0.00' NOT NULL,
	"captured_by" varchar(255) NOT NULL,
	"captured_at" timestamp with time zone DEFAULT now() NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "billing_charges_charge_number_unique" UNIQUE("charge_number")
);
--> statement-breakpoint
CREATE TABLE "clinical"."billing_credit_notes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"partner_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"branch_id" uuid NOT NULL,
	"invoice_id" uuid NOT NULL,
	"patient_id" uuid NOT NULL,
	"credit_note_number" varchar(100) NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"reason" text NOT NULL,
	"status" varchar(50) DEFAULT 'ISSUED' NOT NULL,
	"approved_by" varchar(255) NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "billing_credit_notes_credit_note_number_unique" UNIQUE("credit_note_number")
);
--> statement-breakpoint
CREATE TABLE "clinical"."billing_debit_adjustments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"partner_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"branch_id" uuid NOT NULL,
	"invoice_id" uuid NOT NULL,
	"patient_id" uuid NOT NULL,
	"adjustment_number" varchar(100) NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"reason" text NOT NULL,
	"status" varchar(50) DEFAULT 'APPLIED' NOT NULL,
	"approved_by" varchar(255) NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "billing_debit_adjustments_adjustment_number_unique" UNIQUE("adjustment_number")
);
--> statement-breakpoint
CREATE TABLE "clinical"."billing_discounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"partner_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"branch_id" uuid,
	"invoice_id" uuid NOT NULL,
	"invoice_item_id" uuid,
	"discount_type" varchar(50) NOT NULL,
	"discount_value" numeric(10, 2) NOT NULL,
	"discount_amount" numeric(12, 2) NOT NULL,
	"reason" varchar(255) NOT NULL,
	"approved_by" varchar(255) NOT NULL,
	"created_by" varchar(255) NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clinical"."billing_financial_transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"partner_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"branch_id" uuid NOT NULL,
	"transaction_number" varchar(100) NOT NULL,
	"transaction_type" varchar(50) NOT NULL,
	"reference_type" varchar(50) NOT NULL,
	"reference_id" varchar(100) NOT NULL,
	"patient_id" uuid,
	"debit" numeric(12, 2) DEFAULT '0.00' NOT NULL,
	"credit" numeric(12, 2) DEFAULT '0.00' NOT NULL,
	"balance_impact" numeric(12, 2) DEFAULT '0.00' NOT NULL,
	"currency" varchar(10) DEFAULT 'USD' NOT NULL,
	"actor_id" varchar(255) NOT NULL,
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL,
	"notes" text,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "billing_financial_transactions_transaction_number_unique" UNIQUE("transaction_number")
);
--> statement-breakpoint
CREATE TABLE "clinical"."billing_invoice_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"invoice_id" uuid NOT NULL,
	"charge_id" uuid,
	"charge_item_id" uuid,
	"service_catalog_id" uuid,
	"service_code" varchar(100) NOT NULL,
	"description" varchar(255) NOT NULL,
	"quantity" numeric(10, 2) DEFAULT '1.00' NOT NULL,
	"unit_price" numeric(12, 2) NOT NULL,
	"gross_amount" numeric(12, 2) NOT NULL,
	"discount_amount" numeric(12, 2) DEFAULT '0.00' NOT NULL,
	"tax_amount" numeric(12, 2) DEFAULT '0.00' NOT NULL,
	"net_amount" numeric(12, 2) NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clinical"."billing_invoices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"partner_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"branch_id" uuid NOT NULL,
	"patient_id" uuid NOT NULL,
	"encounter_id" uuid,
	"invoice_number" varchar(100) NOT NULL,
	"invoice_type" varchar(50) DEFAULT 'OPD' NOT NULL,
	"status" varchar(50) DEFAULT 'DRAFT' NOT NULL,
	"subtotal" numeric(12, 2) DEFAULT '0.00' NOT NULL,
	"discount_total" numeric(12, 2) DEFAULT '0.00' NOT NULL,
	"tax_total" numeric(12, 2) DEFAULT '0.00' NOT NULL,
	"rounding_adjustment" numeric(8, 2) DEFAULT '0.00' NOT NULL,
	"total_amount" numeric(12, 2) DEFAULT '0.00' NOT NULL,
	"paid_amount" numeric(12, 2) DEFAULT '0.00' NOT NULL,
	"due_amount" numeric(12, 2) DEFAULT '0.00' NOT NULL,
	"currency" varchar(10) DEFAULT 'USD' NOT NULL,
	"issued_at" timestamp with time zone,
	"due_at" timestamp with time zone,
	"finalized_at" timestamp with time zone,
	"finalized_by" varchar(255),
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "billing_invoices_invoice_number_unique" UNIQUE("invoice_number")
);
--> statement-breakpoint
CREATE TABLE "clinical"."billing_payment_allocations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"payment_id" uuid NOT NULL,
	"invoice_id" uuid NOT NULL,
	"allocated_amount" numeric(12, 2) NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clinical"."billing_payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"partner_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"branch_id" uuid NOT NULL,
	"patient_id" uuid NOT NULL,
	"invoice_id" uuid,
	"payment_number" varchar(100) NOT NULL,
	"payment_method" varchar(50) NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"currency" varchar(10) DEFAULT 'USD' NOT NULL,
	"reference_number" varchar(255),
	"status" varchar(50) DEFAULT 'SUCCESS' NOT NULL,
	"received_by" varchar(255) NOT NULL,
	"received_at" timestamp with time zone DEFAULT now() NOT NULL,
	"notes" text,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "billing_payments_payment_number_unique" UNIQUE("payment_number")
);
--> statement-breakpoint
CREATE TABLE "clinical"."billing_price_list_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"price_list_id" uuid NOT NULL,
	"service_catalog_id" uuid NOT NULL,
	"unit_price" numeric(12, 2) NOT NULL,
	"discount_allowed" boolean DEFAULT true NOT NULL,
	"effective_from" timestamp with time zone DEFAULT now() NOT NULL,
	"effective_to" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clinical"."billing_price_lists" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"partner_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"branch_id" uuid,
	"price_list_code" varchar(100) NOT NULL,
	"name" varchar(255) NOT NULL,
	"currency" varchar(10) DEFAULT 'USD' NOT NULL,
	"status" varchar(50) DEFAULT 'ACTIVE' NOT NULL,
	"effective_from" timestamp with time zone DEFAULT now() NOT NULL,
	"effective_to" timestamp with time zone,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clinical"."billing_receipts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"partner_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"branch_id" uuid NOT NULL,
	"payment_id" uuid NOT NULL,
	"invoice_id" uuid,
	"patient_id" uuid NOT NULL,
	"receipt_number" varchar(100) NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"payment_method" varchar(50) NOT NULL,
	"issued_by" varchar(255) NOT NULL,
	"issued_at" timestamp with time zone DEFAULT now() NOT NULL,
	"status" varchar(50) DEFAULT 'ISSUED' NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "billing_receipts_receipt_number_unique" UNIQUE("receipt_number")
);
--> statement-breakpoint
CREATE TABLE "clinical"."billing_reconciliations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"partner_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"branch_id" uuid NOT NULL,
	"cashier_session_id" uuid NOT NULL,
	"expected_amount" numeric(12, 2) NOT NULL,
	"actual_amount" numeric(12, 2) NOT NULL,
	"variance" numeric(12, 2) DEFAULT '0.00' NOT NULL,
	"status" varchar(50) DEFAULT 'MATCHED' NOT NULL,
	"reconciled_by" varchar(255) NOT NULL,
	"reconciled_at" timestamp with time zone DEFAULT now() NOT NULL,
	"remarks" text,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clinical"."billing_refunds" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"partner_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"branch_id" uuid NOT NULL,
	"payment_id" uuid NOT NULL,
	"invoice_id" uuid,
	"patient_id" uuid NOT NULL,
	"refund_number" varchar(100) NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"reason" text NOT NULL,
	"status" varchar(50) DEFAULT 'REQUESTED' NOT NULL,
	"approved_by" varchar(255),
	"processed_by" varchar(255),
	"processed_at" timestamp with time zone,
	"notes" text,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "billing_refunds_refund_number_unique" UNIQUE("refund_number")
);
--> statement-breakpoint
CREATE TABLE "clinical"."billing_service_catalog" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"partner_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"branch_id" uuid,
	"service_code" varchar(100) NOT NULL,
	"service_name" varchar(255) NOT NULL,
	"description" text,
	"category" varchar(100) DEFAULT 'GENERAL' NOT NULL,
	"department" varchar(100),
	"service_type" varchar(100) DEFAULT 'STANDARD' NOT NULL,
	"unit" varchar(50) DEFAULT 'SERVICE' NOT NULL,
	"base_price" numeric(12, 2) DEFAULT '0.00' NOT NULL,
	"taxable" boolean DEFAULT false NOT NULL,
	"tax_code" varchar(50),
	"active" boolean DEFAULT true NOT NULL,
	"effective_from" timestamp with time zone DEFAULT now() NOT NULL,
	"effective_to" timestamp with time zone,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "clinical"."billing_advances" ADD CONSTRAINT "billing_advances_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "core"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."billing_advances" ADD CONSTRAINT "billing_advances_partner_id_operational_partners_id_fk" FOREIGN KEY ("partner_id") REFERENCES "clinical"."operational_partners"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."billing_advances" ADD CONSTRAINT "billing_advances_organization_id_operational_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "clinical"."operational_organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."billing_advances" ADD CONSTRAINT "billing_advances_branch_id_operational_facilities_id_fk" FOREIGN KEY ("branch_id") REFERENCES "clinical"."operational_facilities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."billing_advances" ADD CONSTRAINT "billing_advances_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "clinical"."patients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."billing_advances" ADD CONSTRAINT "billing_advances_encounter_id_encounters_id_fk" FOREIGN KEY ("encounter_id") REFERENCES "clinical"."encounters"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."billing_advances" ADD CONSTRAINT "billing_advances_payment_id_billing_payments_id_fk" FOREIGN KEY ("payment_id") REFERENCES "clinical"."billing_payments"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."billing_audit_traces" ADD CONSTRAINT "billing_audit_traces_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "core"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."billing_audit_traces" ADD CONSTRAINT "billing_audit_traces_partner_id_operational_partners_id_fk" FOREIGN KEY ("partner_id") REFERENCES "clinical"."operational_partners"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."billing_audit_traces" ADD CONSTRAINT "billing_audit_traces_organization_id_operational_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "clinical"."operational_organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."billing_audit_traces" ADD CONSTRAINT "billing_audit_traces_branch_id_operational_facilities_id_fk" FOREIGN KEY ("branch_id") REFERENCES "clinical"."operational_facilities"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."billing_audit_traces" ADD CONSTRAINT "billing_audit_traces_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "clinical"."patients"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."billing_audit_traces" ADD CONSTRAINT "billing_audit_traces_invoice_id_billing_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "clinical"."billing_invoices"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."billing_cashier_sessions" ADD CONSTRAINT "billing_cashier_sessions_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "core"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."billing_cashier_sessions" ADD CONSTRAINT "billing_cashier_sessions_partner_id_operational_partners_id_fk" FOREIGN KEY ("partner_id") REFERENCES "clinical"."operational_partners"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."billing_cashier_sessions" ADD CONSTRAINT "billing_cashier_sessions_organization_id_operational_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "clinical"."operational_organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."billing_cashier_sessions" ADD CONSTRAINT "billing_cashier_sessions_branch_id_operational_facilities_id_fk" FOREIGN KEY ("branch_id") REFERENCES "clinical"."operational_facilities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."billing_charge_items" ADD CONSTRAINT "billing_charge_items_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "core"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."billing_charge_items" ADD CONSTRAINT "billing_charge_items_charge_id_billing_charges_id_fk" FOREIGN KEY ("charge_id") REFERENCES "clinical"."billing_charges"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."billing_charge_items" ADD CONSTRAINT "billing_charge_items_service_catalog_id_billing_service_catalog_id_fk" FOREIGN KEY ("service_catalog_id") REFERENCES "clinical"."billing_service_catalog"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."billing_charges" ADD CONSTRAINT "billing_charges_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "core"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."billing_charges" ADD CONSTRAINT "billing_charges_partner_id_operational_partners_id_fk" FOREIGN KEY ("partner_id") REFERENCES "clinical"."operational_partners"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."billing_charges" ADD CONSTRAINT "billing_charges_organization_id_operational_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "clinical"."operational_organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."billing_charges" ADD CONSTRAINT "billing_charges_branch_id_operational_facilities_id_fk" FOREIGN KEY ("branch_id") REFERENCES "clinical"."operational_facilities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."billing_charges" ADD CONSTRAINT "billing_charges_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "clinical"."patients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."billing_charges" ADD CONSTRAINT "billing_charges_encounter_id_encounters_id_fk" FOREIGN KEY ("encounter_id") REFERENCES "clinical"."encounters"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."billing_charges" ADD CONSTRAINT "billing_charges_consultation_id_consultations_id_fk" FOREIGN KEY ("consultation_id") REFERENCES "clinical"."consultations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."billing_credit_notes" ADD CONSTRAINT "billing_credit_notes_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "core"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."billing_credit_notes" ADD CONSTRAINT "billing_credit_notes_partner_id_operational_partners_id_fk" FOREIGN KEY ("partner_id") REFERENCES "clinical"."operational_partners"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."billing_credit_notes" ADD CONSTRAINT "billing_credit_notes_organization_id_operational_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "clinical"."operational_organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."billing_credit_notes" ADD CONSTRAINT "billing_credit_notes_branch_id_operational_facilities_id_fk" FOREIGN KEY ("branch_id") REFERENCES "clinical"."operational_facilities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."billing_credit_notes" ADD CONSTRAINT "billing_credit_notes_invoice_id_billing_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "clinical"."billing_invoices"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."billing_credit_notes" ADD CONSTRAINT "billing_credit_notes_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "clinical"."patients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."billing_debit_adjustments" ADD CONSTRAINT "billing_debit_adjustments_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "core"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."billing_debit_adjustments" ADD CONSTRAINT "billing_debit_adjustments_partner_id_operational_partners_id_fk" FOREIGN KEY ("partner_id") REFERENCES "clinical"."operational_partners"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."billing_debit_adjustments" ADD CONSTRAINT "billing_debit_adjustments_organization_id_operational_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "clinical"."operational_organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."billing_debit_adjustments" ADD CONSTRAINT "billing_debit_adjustments_branch_id_operational_facilities_id_fk" FOREIGN KEY ("branch_id") REFERENCES "clinical"."operational_facilities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."billing_debit_adjustments" ADD CONSTRAINT "billing_debit_adjustments_invoice_id_billing_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "clinical"."billing_invoices"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."billing_debit_adjustments" ADD CONSTRAINT "billing_debit_adjustments_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "clinical"."patients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."billing_discounts" ADD CONSTRAINT "billing_discounts_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "core"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."billing_discounts" ADD CONSTRAINT "billing_discounts_partner_id_operational_partners_id_fk" FOREIGN KEY ("partner_id") REFERENCES "clinical"."operational_partners"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."billing_discounts" ADD CONSTRAINT "billing_discounts_organization_id_operational_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "clinical"."operational_organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."billing_discounts" ADD CONSTRAINT "billing_discounts_branch_id_operational_facilities_id_fk" FOREIGN KEY ("branch_id") REFERENCES "clinical"."operational_facilities"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."billing_discounts" ADD CONSTRAINT "billing_discounts_invoice_id_billing_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "clinical"."billing_invoices"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."billing_discounts" ADD CONSTRAINT "billing_discounts_invoice_item_id_billing_invoice_items_id_fk" FOREIGN KEY ("invoice_item_id") REFERENCES "clinical"."billing_invoice_items"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."billing_financial_transactions" ADD CONSTRAINT "billing_financial_transactions_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "core"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."billing_financial_transactions" ADD CONSTRAINT "billing_financial_transactions_partner_id_operational_partners_id_fk" FOREIGN KEY ("partner_id") REFERENCES "clinical"."operational_partners"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."billing_financial_transactions" ADD CONSTRAINT "billing_financial_transactions_organization_id_operational_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "clinical"."operational_organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."billing_financial_transactions" ADD CONSTRAINT "billing_financial_transactions_branch_id_operational_facilities_id_fk" FOREIGN KEY ("branch_id") REFERENCES "clinical"."operational_facilities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."billing_financial_transactions" ADD CONSTRAINT "billing_financial_transactions_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "clinical"."patients"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."billing_invoice_items" ADD CONSTRAINT "billing_invoice_items_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "core"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."billing_invoice_items" ADD CONSTRAINT "billing_invoice_items_invoice_id_billing_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "clinical"."billing_invoices"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."billing_invoice_items" ADD CONSTRAINT "billing_invoice_items_charge_id_billing_charges_id_fk" FOREIGN KEY ("charge_id") REFERENCES "clinical"."billing_charges"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."billing_invoice_items" ADD CONSTRAINT "billing_invoice_items_charge_item_id_billing_charge_items_id_fk" FOREIGN KEY ("charge_item_id") REFERENCES "clinical"."billing_charge_items"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."billing_invoice_items" ADD CONSTRAINT "billing_invoice_items_service_catalog_id_billing_service_catalog_id_fk" FOREIGN KEY ("service_catalog_id") REFERENCES "clinical"."billing_service_catalog"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."billing_invoices" ADD CONSTRAINT "billing_invoices_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "core"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."billing_invoices" ADD CONSTRAINT "billing_invoices_partner_id_operational_partners_id_fk" FOREIGN KEY ("partner_id") REFERENCES "clinical"."operational_partners"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."billing_invoices" ADD CONSTRAINT "billing_invoices_organization_id_operational_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "clinical"."operational_organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."billing_invoices" ADD CONSTRAINT "billing_invoices_branch_id_operational_facilities_id_fk" FOREIGN KEY ("branch_id") REFERENCES "clinical"."operational_facilities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."billing_invoices" ADD CONSTRAINT "billing_invoices_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "clinical"."patients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."billing_invoices" ADD CONSTRAINT "billing_invoices_encounter_id_encounters_id_fk" FOREIGN KEY ("encounter_id") REFERENCES "clinical"."encounters"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."billing_payment_allocations" ADD CONSTRAINT "billing_payment_allocations_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "core"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."billing_payment_allocations" ADD CONSTRAINT "billing_payment_allocations_payment_id_billing_payments_id_fk" FOREIGN KEY ("payment_id") REFERENCES "clinical"."billing_payments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."billing_payment_allocations" ADD CONSTRAINT "billing_payment_allocations_invoice_id_billing_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "clinical"."billing_invoices"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."billing_payments" ADD CONSTRAINT "billing_payments_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "core"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."billing_payments" ADD CONSTRAINT "billing_payments_partner_id_operational_partners_id_fk" FOREIGN KEY ("partner_id") REFERENCES "clinical"."operational_partners"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."billing_payments" ADD CONSTRAINT "billing_payments_organization_id_operational_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "clinical"."operational_organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."billing_payments" ADD CONSTRAINT "billing_payments_branch_id_operational_facilities_id_fk" FOREIGN KEY ("branch_id") REFERENCES "clinical"."operational_facilities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."billing_payments" ADD CONSTRAINT "billing_payments_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "clinical"."patients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."billing_payments" ADD CONSTRAINT "billing_payments_invoice_id_billing_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "clinical"."billing_invoices"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."billing_price_list_items" ADD CONSTRAINT "billing_price_list_items_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "core"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."billing_price_list_items" ADD CONSTRAINT "billing_price_list_items_price_list_id_billing_price_lists_id_fk" FOREIGN KEY ("price_list_id") REFERENCES "clinical"."billing_price_lists"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."billing_price_list_items" ADD CONSTRAINT "billing_price_list_items_service_catalog_id_billing_service_catalog_id_fk" FOREIGN KEY ("service_catalog_id") REFERENCES "clinical"."billing_service_catalog"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."billing_price_lists" ADD CONSTRAINT "billing_price_lists_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "core"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."billing_price_lists" ADD CONSTRAINT "billing_price_lists_partner_id_operational_partners_id_fk" FOREIGN KEY ("partner_id") REFERENCES "clinical"."operational_partners"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."billing_price_lists" ADD CONSTRAINT "billing_price_lists_organization_id_operational_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "clinical"."operational_organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."billing_price_lists" ADD CONSTRAINT "billing_price_lists_branch_id_operational_facilities_id_fk" FOREIGN KEY ("branch_id") REFERENCES "clinical"."operational_facilities"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."billing_receipts" ADD CONSTRAINT "billing_receipts_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "core"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."billing_receipts" ADD CONSTRAINT "billing_receipts_partner_id_operational_partners_id_fk" FOREIGN KEY ("partner_id") REFERENCES "clinical"."operational_partners"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."billing_receipts" ADD CONSTRAINT "billing_receipts_organization_id_operational_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "clinical"."operational_organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."billing_receipts" ADD CONSTRAINT "billing_receipts_branch_id_operational_facilities_id_fk" FOREIGN KEY ("branch_id") REFERENCES "clinical"."operational_facilities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."billing_receipts" ADD CONSTRAINT "billing_receipts_payment_id_billing_payments_id_fk" FOREIGN KEY ("payment_id") REFERENCES "clinical"."billing_payments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."billing_receipts" ADD CONSTRAINT "billing_receipts_invoice_id_billing_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "clinical"."billing_invoices"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."billing_receipts" ADD CONSTRAINT "billing_receipts_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "clinical"."patients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."billing_reconciliations" ADD CONSTRAINT "billing_reconciliations_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "core"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."billing_reconciliations" ADD CONSTRAINT "billing_reconciliations_partner_id_operational_partners_id_fk" FOREIGN KEY ("partner_id") REFERENCES "clinical"."operational_partners"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."billing_reconciliations" ADD CONSTRAINT "billing_reconciliations_organization_id_operational_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "clinical"."operational_organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."billing_reconciliations" ADD CONSTRAINT "billing_reconciliations_branch_id_operational_facilities_id_fk" FOREIGN KEY ("branch_id") REFERENCES "clinical"."operational_facilities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."billing_reconciliations" ADD CONSTRAINT "billing_reconciliations_cashier_session_id_billing_cashier_sessions_id_fk" FOREIGN KEY ("cashier_session_id") REFERENCES "clinical"."billing_cashier_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."billing_refunds" ADD CONSTRAINT "billing_refunds_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "core"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."billing_refunds" ADD CONSTRAINT "billing_refunds_partner_id_operational_partners_id_fk" FOREIGN KEY ("partner_id") REFERENCES "clinical"."operational_partners"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."billing_refunds" ADD CONSTRAINT "billing_refunds_organization_id_operational_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "clinical"."operational_organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."billing_refunds" ADD CONSTRAINT "billing_refunds_branch_id_operational_facilities_id_fk" FOREIGN KEY ("branch_id") REFERENCES "clinical"."operational_facilities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."billing_refunds" ADD CONSTRAINT "billing_refunds_payment_id_billing_payments_id_fk" FOREIGN KEY ("payment_id") REFERENCES "clinical"."billing_payments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."billing_refunds" ADD CONSTRAINT "billing_refunds_invoice_id_billing_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "clinical"."billing_invoices"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."billing_refunds" ADD CONSTRAINT "billing_refunds_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "clinical"."patients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."billing_service_catalog" ADD CONSTRAINT "billing_service_catalog_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "core"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."billing_service_catalog" ADD CONSTRAINT "billing_service_catalog_partner_id_operational_partners_id_fk" FOREIGN KEY ("partner_id") REFERENCES "clinical"."operational_partners"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."billing_service_catalog" ADD CONSTRAINT "billing_service_catalog_organization_id_operational_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "clinical"."operational_organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."billing_service_catalog" ADD CONSTRAINT "billing_service_catalog_branch_id_operational_facilities_id_fk" FOREIGN KEY ("branch_id") REFERENCES "clinical"."operational_facilities"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_bill_adv_tenant" ON "clinical"."billing_advances" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_bill_adv_branch" ON "clinical"."billing_advances" USING btree ("branch_id");--> statement-breakpoint
CREATE INDEX "idx_bill_adv_patient" ON "clinical"."billing_advances" USING btree ("patient_id");--> statement-breakpoint
CREATE INDEX "idx_bill_adv_encounter" ON "clinical"."billing_advances" USING btree ("encounter_id");--> statement-breakpoint
CREATE INDEX "idx_bill_adv_status" ON "clinical"."billing_advances" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_bill_audit_tenant" ON "clinical"."billing_audit_traces" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_bill_audit_branch" ON "clinical"."billing_audit_traces" USING btree ("branch_id");--> statement-breakpoint
CREATE INDEX "idx_bill_audit_patient" ON "clinical"."billing_audit_traces" USING btree ("patient_id");--> statement-breakpoint
CREATE INDEX "idx_bill_audit_invoice" ON "clinical"."billing_audit_traces" USING btree ("invoice_id");--> statement-breakpoint
CREATE INDEX "idx_bill_audit_operation" ON "clinical"."billing_audit_traces" USING btree ("operation");--> statement-breakpoint
CREATE INDEX "idx_bill_audit_entity" ON "clinical"."billing_audit_traces" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "idx_bill_audit_time" ON "clinical"."billing_audit_traces" USING btree ("timestamp");--> statement-breakpoint
CREATE INDEX "idx_cash_sess_tenant" ON "clinical"."billing_cashier_sessions" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_cash_sess_branch" ON "clinical"."billing_cashier_sessions" USING btree ("branch_id");--> statement-breakpoint
CREATE INDEX "idx_cash_sess_cashier" ON "clinical"."billing_cashier_sessions" USING btree ("cashier_id");--> statement-breakpoint
CREATE INDEX "idx_cash_sess_status" ON "clinical"."billing_cashier_sessions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_cash_sess_opened" ON "clinical"."billing_cashier_sessions" USING btree ("opened_at");--> statement-breakpoint
CREATE INDEX "idx_charge_items_tenant" ON "clinical"."billing_charge_items" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_charge_items_charge" ON "clinical"."billing_charge_items" USING btree ("charge_id");--> statement-breakpoint
CREATE INDEX "idx_charge_items_service" ON "clinical"."billing_charge_items" USING btree ("service_catalog_id");--> statement-breakpoint
CREATE INDEX "idx_bill_charges_tenant" ON "clinical"."billing_charges" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_bill_charges_branch" ON "clinical"."billing_charges" USING btree ("branch_id");--> statement-breakpoint
CREATE INDEX "idx_bill_charges_patient" ON "clinical"."billing_charges" USING btree ("patient_id");--> statement-breakpoint
CREATE INDEX "idx_bill_charges_encounter" ON "clinical"."billing_charges" USING btree ("encounter_id");--> statement-breakpoint
CREATE INDEX "idx_bill_charges_source" ON "clinical"."billing_charges" USING btree ("source_domain","source_entity_id");--> statement-breakpoint
CREATE INDEX "idx_bill_charges_status" ON "clinical"."billing_charges" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_bill_charges_number" ON "clinical"."billing_charges" USING btree ("charge_number");--> statement-breakpoint
CREATE INDEX "idx_bill_cr_tenant" ON "clinical"."billing_credit_notes" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_bill_cr_branch" ON "clinical"."billing_credit_notes" USING btree ("branch_id");--> statement-breakpoint
CREATE INDEX "idx_bill_cr_invoice" ON "clinical"."billing_credit_notes" USING btree ("invoice_id");--> statement-breakpoint
CREATE INDEX "idx_bill_cr_number" ON "clinical"."billing_credit_notes" USING btree ("credit_note_number");--> statement-breakpoint
CREATE INDEX "idx_bill_dr_tenant" ON "clinical"."billing_debit_adjustments" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_bill_dr_branch" ON "clinical"."billing_debit_adjustments" USING btree ("branch_id");--> statement-breakpoint
CREATE INDEX "idx_bill_dr_invoice" ON "clinical"."billing_debit_adjustments" USING btree ("invoice_id");--> statement-breakpoint
CREATE INDEX "idx_bill_dr_number" ON "clinical"."billing_debit_adjustments" USING btree ("adjustment_number");--> statement-breakpoint
CREATE INDEX "idx_bill_disc_tenant" ON "clinical"."billing_discounts" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_bill_disc_invoice" ON "clinical"."billing_discounts" USING btree ("invoice_id");--> statement-breakpoint
CREATE INDEX "idx_bill_disc_item" ON "clinical"."billing_discounts" USING btree ("invoice_item_id");--> statement-breakpoint
CREATE INDEX "idx_fin_tx_tenant" ON "clinical"."billing_financial_transactions" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_fin_tx_branch" ON "clinical"."billing_financial_transactions" USING btree ("branch_id");--> statement-breakpoint
CREATE INDEX "idx_fin_tx_type" ON "clinical"."billing_financial_transactions" USING btree ("transaction_type");--> statement-breakpoint
CREATE INDEX "idx_fin_tx_ref" ON "clinical"."billing_financial_transactions" USING btree ("reference_type","reference_id");--> statement-breakpoint
CREATE INDEX "idx_fin_tx_patient" ON "clinical"."billing_financial_transactions" USING btree ("patient_id");--> statement-breakpoint
CREATE INDEX "idx_fin_tx_occurred" ON "clinical"."billing_financial_transactions" USING btree ("occurred_at");--> statement-breakpoint
CREATE INDEX "idx_inv_items_tenant" ON "clinical"."billing_invoice_items" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_inv_items_invoice" ON "clinical"."billing_invoice_items" USING btree ("invoice_id");--> statement-breakpoint
CREATE INDEX "idx_inv_items_charge" ON "clinical"."billing_invoice_items" USING btree ("charge_id");--> statement-breakpoint
CREATE INDEX "idx_bill_inv_tenant" ON "clinical"."billing_invoices" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_bill_inv_branch" ON "clinical"."billing_invoices" USING btree ("branch_id");--> statement-breakpoint
CREATE INDEX "idx_bill_inv_patient" ON "clinical"."billing_invoices" USING btree ("patient_id");--> statement-breakpoint
CREATE INDEX "idx_bill_inv_encounter" ON "clinical"."billing_invoices" USING btree ("encounter_id");--> statement-breakpoint
CREATE INDEX "idx_bill_inv_number" ON "clinical"."billing_invoices" USING btree ("invoice_number");--> statement-breakpoint
CREATE INDEX "idx_bill_inv_status" ON "clinical"."billing_invoices" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_bill_inv_issued" ON "clinical"."billing_invoices" USING btree ("issued_at");--> statement-breakpoint
CREATE INDEX "idx_bill_inv_due" ON "clinical"."billing_invoices" USING btree ("due_at");--> statement-breakpoint
CREATE INDEX "idx_pmt_alloc_tenant" ON "clinical"."billing_payment_allocations" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_pmt_alloc_pmt" ON "clinical"."billing_payment_allocations" USING btree ("payment_id");--> statement-breakpoint
CREATE INDEX "idx_pmt_alloc_inv" ON "clinical"."billing_payment_allocations" USING btree ("invoice_id");--> statement-breakpoint
CREATE INDEX "idx_bill_pmt_tenant" ON "clinical"."billing_payments" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_bill_pmt_branch" ON "clinical"."billing_payments" USING btree ("branch_id");--> statement-breakpoint
CREATE INDEX "idx_bill_pmt_patient" ON "clinical"."billing_payments" USING btree ("patient_id");--> statement-breakpoint
CREATE INDEX "idx_bill_pmt_invoice" ON "clinical"."billing_payments" USING btree ("invoice_id");--> statement-breakpoint
CREATE INDEX "idx_bill_pmt_number" ON "clinical"."billing_payments" USING btree ("payment_number");--> statement-breakpoint
CREATE INDEX "idx_bill_pmt_status" ON "clinical"."billing_payments" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_bill_pmt_received" ON "clinical"."billing_payments" USING btree ("received_at");--> statement-breakpoint
CREATE INDEX "idx_price_items_tenant" ON "clinical"."billing_price_list_items" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_price_items_list" ON "clinical"."billing_price_list_items" USING btree ("price_list_id");--> statement-breakpoint
CREATE INDEX "idx_price_items_service" ON "clinical"."billing_price_list_items" USING btree ("service_catalog_id");--> statement-breakpoint
CREATE INDEX "idx_price_lists_tenant" ON "clinical"."billing_price_lists" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_price_lists_branch" ON "clinical"."billing_price_lists" USING btree ("branch_id");--> statement-breakpoint
CREATE INDEX "idx_price_lists_code" ON "clinical"."billing_price_lists" USING btree ("price_list_code");--> statement-breakpoint
CREATE INDEX "idx_price_lists_status" ON "clinical"."billing_price_lists" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_bill_rcpt_tenant" ON "clinical"."billing_receipts" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_bill_rcpt_branch" ON "clinical"."billing_receipts" USING btree ("branch_id");--> statement-breakpoint
CREATE INDEX "idx_bill_rcpt_payment" ON "clinical"."billing_receipts" USING btree ("payment_id");--> statement-breakpoint
CREATE INDEX "idx_bill_rcpt_invoice" ON "clinical"."billing_receipts" USING btree ("invoice_id");--> statement-breakpoint
CREATE INDEX "idx_bill_rcpt_number" ON "clinical"."billing_receipts" USING btree ("receipt_number");--> statement-breakpoint
CREATE INDEX "idx_reconcil_tenant" ON "clinical"."billing_reconciliations" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_reconcil_branch" ON "clinical"."billing_reconciliations" USING btree ("branch_id");--> statement-breakpoint
CREATE INDEX "idx_reconcil_session" ON "clinical"."billing_reconciliations" USING btree ("cashier_session_id");--> statement-breakpoint
CREATE INDEX "idx_reconcil_status" ON "clinical"."billing_reconciliations" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_bill_rfnd_tenant" ON "clinical"."billing_refunds" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_bill_rfnd_branch" ON "clinical"."billing_refunds" USING btree ("branch_id");--> statement-breakpoint
CREATE INDEX "idx_bill_rfnd_payment" ON "clinical"."billing_refunds" USING btree ("payment_id");--> statement-breakpoint
CREATE INDEX "idx_bill_rfnd_invoice" ON "clinical"."billing_refunds" USING btree ("invoice_id");--> statement-breakpoint
CREATE INDEX "idx_bill_rfnd_number" ON "clinical"."billing_refunds" USING btree ("refund_number");--> statement-breakpoint
CREATE INDEX "idx_bill_rfnd_status" ON "clinical"."billing_refunds" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_bill_catalog_tenant" ON "clinical"."billing_service_catalog" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_bill_catalog_org" ON "clinical"."billing_service_catalog" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_bill_catalog_branch" ON "clinical"."billing_service_catalog" USING btree ("branch_id");--> statement-breakpoint
CREATE INDEX "idx_bill_catalog_code" ON "clinical"."billing_service_catalog" USING btree ("service_code");--> statement-breakpoint
CREATE INDEX "idx_bill_catalog_category" ON "clinical"."billing_service_catalog" USING btree ("category");--> statement-breakpoint
CREATE INDEX "idx_bill_catalog_active" ON "clinical"."billing_service_catalog" USING btree ("active");