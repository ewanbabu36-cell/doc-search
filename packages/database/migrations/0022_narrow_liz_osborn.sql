CREATE TABLE "clinical"."medication_catalog" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"partner_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"branch_id" uuid,
	"medication_code" varchar(50) NOT NULL,
	"generic_name" varchar(255) NOT NULL,
	"brand_name" varchar(255) NOT NULL,
	"strength" varchar(100) NOT NULL,
	"dosage_form" varchar(100) NOT NULL,
	"route" varchar(100) DEFAULT 'ORAL' NOT NULL,
	"pack_size" integer DEFAULT 1 NOT NULL,
	"unit_of_measure" varchar(50) DEFAULT 'TABLET' NOT NULL,
	"manufacturer" varchar(255) NOT NULL,
	"category" varchar(100) DEFAULT 'GENERAL' NOT NULL,
	"controlled_medication" boolean DEFAULT false NOT NULL,
	"prescription_required" boolean DEFAULT true NOT NULL,
	"status" varchar(50) DEFAULT 'ACTIVE' NOT NULL,
	"therapeutic_class" varchar(255),
	"storage_conditions" varchar(255),
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clinical"."medication_catalog_variants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"medication_id" uuid NOT NULL,
	"variant_code" varchar(50) NOT NULL,
	"variant_name" varchar(255) NOT NULL,
	"strength" varchar(100) NOT NULL,
	"dosage_form" varchar(100) NOT NULL,
	"pack_configuration" varchar(100) NOT NULL,
	"barcode" varchar(100),
	"alternate_identifier" varchar(100),
	"status" varchar(50) DEFAULT 'ACTIVE' NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clinical"."pharmacy_audit_traces" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"partner_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"branch_id" uuid,
	"trace_id" varchar(100) NOT NULL,
	"correlation_id" varchar(100) NOT NULL,
	"actor_id" varchar(255) NOT NULL,
	"actor_role" varchar(100) NOT NULL,
	"action" varchar(100) NOT NULL,
	"target_entity" varchar(100) NOT NULL,
	"target_entity_id" varchar(100) NOT NULL,
	"prescription_id" uuid,
	"patient_id" uuid,
	"previous_snapshot" jsonb,
	"new_snapshot" jsonb,
	"justification" text NOT NULL,
	"operation_status" varchar(50) DEFAULT 'SUCCESS' NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "pharmacy_audit_traces_trace_id_unique" UNIQUE("trace_id")
);
--> statement-breakpoint
CREATE TABLE "clinical"."pharmacy_batches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"partner_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"branch_id" uuid NOT NULL,
	"medication_id" uuid NOT NULL,
	"batch_number" varchar(100) NOT NULL,
	"manufacturer" varchar(255) NOT NULL,
	"manufacturing_date" timestamp with time zone NOT NULL,
	"expiry_date" timestamp with time zone NOT NULL,
	"received_quantity" integer NOT NULL,
	"available_quantity" integer NOT NULL,
	"reserved_quantity" integer DEFAULT 0 NOT NULL,
	"unit_cost" numeric(10, 2) DEFAULT '0.00' NOT NULL,
	"purchase_reference" varchar(100),
	"supplier_reference" varchar(100),
	"status" varchar(50) DEFAULT 'ACTIVE' NOT NULL,
	"block_reason" text,
	"blocked_by" varchar(255),
	"blocked_at" timestamp with time zone,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clinical"."pharmacy_dispensing" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"partner_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"branch_id" uuid NOT NULL,
	"dispensing_number" varchar(50) NOT NULL,
	"prescription_id" uuid NOT NULL,
	"patient_id" uuid NOT NULL,
	"pharmacist_id" varchar(255) NOT NULL,
	"pharmacist_name" varchar(255) NOT NULL,
	"dispensing_status" varchar(50) DEFAULT 'DISPENSED' NOT NULL,
	"dispensing_mode" varchar(50) DEFAULT 'OUTPATIENT_COUNTER' NOT NULL,
	"counseling_provided" boolean DEFAULT true NOT NULL,
	"counseling_notes" text,
	"dispensed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"reversal_reason" text,
	"reversed_by" varchar(255),
	"reversed_at" timestamp with time zone,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clinical"."pharmacy_dispensing_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"dispensing_id" uuid NOT NULL,
	"prescription_item_id" uuid NOT NULL,
	"medication_id" uuid NOT NULL,
	"batch_id" uuid NOT NULL,
	"quantity" integer NOT NULL,
	"unit" varchar(50) NOT NULL,
	"dosage_instructions" text NOT NULL,
	"is_substituted" boolean DEFAULT false NOT NULL,
	"substituted_medication_id" uuid,
	"pharmacist_notes" text,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clinical"."pharmacy_inventory" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"partner_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"branch_id" uuid NOT NULL,
	"medication_id" uuid NOT NULL,
	"available_quantity" integer DEFAULT 0 NOT NULL,
	"reserved_quantity" integer DEFAULT 0 NOT NULL,
	"damaged_quantity" integer DEFAULT 0 NOT NULL,
	"expired_quantity" integer DEFAULT 0 NOT NULL,
	"reorder_level" integer DEFAULT 50 NOT NULL,
	"reorder_quantity" integer DEFAULT 200 NOT NULL,
	"last_stock_movement_at" timestamp with time zone,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clinical"."pharmacy_prescription_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"prescription_id" uuid NOT NULL,
	"medication_id" uuid NOT NULL,
	"prescribed_quantity" integer NOT NULL,
	"unit" varchar(50) DEFAULT 'TABLET' NOT NULL,
	"dosage" varchar(100) NOT NULL,
	"frequency" varchar(100) NOT NULL,
	"route" varchar(100) DEFAULT 'ORAL' NOT NULL,
	"duration" integer NOT NULL,
	"duration_unit" varchar(20) DEFAULT 'DAYS' NOT NULL,
	"prn" boolean DEFAULT false NOT NULL,
	"prn_indication" varchar(255),
	"substitution_allowed" boolean DEFAULT true NOT NULL,
	"substitution_reason" varchar(255),
	"fulfillment_status" varchar(50) DEFAULT 'PENDING' NOT NULL,
	"dispensed_quantity" integer DEFAULT 0 NOT NULL,
	"remaining_quantity" integer NOT NULL,
	"instructions" text,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clinical"."pharmacy_prescriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"partner_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"branch_id" uuid NOT NULL,
	"prescription_number" varchar(50) NOT NULL,
	"source_prescription_id" varchar(100),
	"patient_id" uuid NOT NULL,
	"encounter_id" uuid NOT NULL,
	"consultation_id" uuid,
	"prescribing_doctor_id" uuid NOT NULL,
	"priority" varchar(50) DEFAULT 'ROUTINE' NOT NULL,
	"status" varchar(50) DEFAULT 'CREATED' NOT NULL,
	"prescription_type" varchar(50) DEFAULT 'OUTPATIENT' NOT NULL,
	"verified_by_pharmacist_id" varchar(255),
	"verified_at" timestamp with time zone,
	"verification_notes" text,
	"prescribed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expiry_at" timestamp with time zone,
	"notes" text,
	"cancellation_reason" text,
	"cancelled_by" varchar(255),
	"cancelled_at" timestamp with time zone,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clinical"."pharmacy_returns" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"partner_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"branch_id" uuid NOT NULL,
	"return_number" varchar(50) NOT NULL,
	"dispensing_id" uuid NOT NULL,
	"patient_id" uuid NOT NULL,
	"medication_id" uuid NOT NULL,
	"batch_id" uuid NOT NULL,
	"quantity" integer NOT NULL,
	"return_reason" varchar(100) NOT NULL,
	"condition" varchar(50) DEFAULT 'INTACT_SEALED' NOT NULL,
	"disposition" varchar(50) DEFAULT 'RESTOCK' NOT NULL,
	"actor_id" varchar(255) NOT NULL,
	"actor_role" varchar(100) NOT NULL,
	"notes" text,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clinical"."pharmacy_stock_adjustments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"partner_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"branch_id" uuid NOT NULL,
	"adjustment_number" varchar(50) NOT NULL,
	"medication_id" uuid NOT NULL,
	"batch_id" uuid NOT NULL,
	"reason" varchar(50) NOT NULL,
	"justification" text NOT NULL,
	"before_quantity" integer NOT NULL,
	"adjustment_quantity" integer NOT NULL,
	"after_quantity" integer NOT NULL,
	"actor_id" varchar(255) NOT NULL,
	"actor_role" varchar(100) NOT NULL,
	"approved_by" varchar(255),
	"approved_at" timestamp with time zone,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clinical"."pharmacy_stock_movements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"partner_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"branch_id" uuid NOT NULL,
	"medication_id" uuid NOT NULL,
	"batch_id" uuid NOT NULL,
	"movement_type" varchar(50) NOT NULL,
	"quantity" integer NOT NULL,
	"before_quantity" integer NOT NULL,
	"after_quantity" integer NOT NULL,
	"actor_id" varchar(255) NOT NULL,
	"actor_role" varchar(100) NOT NULL,
	"reason" varchar(255) NOT NULL,
	"correlation_id" varchar(100) NOT NULL,
	"reference_type" varchar(100),
	"reference_id" varchar(100),
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clinical"."pharmacy_stock_reservations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"partner_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"branch_id" uuid NOT NULL,
	"prescription_id" uuid NOT NULL,
	"prescription_item_id" uuid NOT NULL,
	"medication_id" uuid NOT NULL,
	"batch_id" uuid NOT NULL,
	"reserved_quantity" integer NOT NULL,
	"status" varchar(50) DEFAULT 'ACTIVE' NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clinical"."pharmacy_substitution_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"partner_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"branch_id" uuid NOT NULL,
	"prescription_id" uuid NOT NULL,
	"prescription_item_id" uuid NOT NULL,
	"original_medication_id" uuid NOT NULL,
	"requested_medication_id" uuid NOT NULL,
	"reason" varchar(255) NOT NULL,
	"justification" text NOT NULL,
	"pharmacist_id" varchar(255) NOT NULL,
	"pharmacist_name" varchar(255) NOT NULL,
	"doctor_approval_required" boolean DEFAULT true NOT NULL,
	"status" varchar(50) DEFAULT 'PENDING_APPROVAL' NOT NULL,
	"approved_by_doctor_id" varchar(255),
	"approved_by_doctor_name" varchar(255),
	"approval_notes" text,
	"actioned_at" timestamp with time zone,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "clinical"."medication_catalog" ADD CONSTRAINT "medication_catalog_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "core"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."medication_catalog" ADD CONSTRAINT "medication_catalog_partner_id_operational_partners_id_fk" FOREIGN KEY ("partner_id") REFERENCES "clinical"."operational_partners"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."medication_catalog" ADD CONSTRAINT "medication_catalog_organization_id_operational_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "clinical"."operational_organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."medication_catalog" ADD CONSTRAINT "medication_catalog_branch_id_operational_facilities_id_fk" FOREIGN KEY ("branch_id") REFERENCES "clinical"."operational_facilities"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."medication_catalog_variants" ADD CONSTRAINT "medication_catalog_variants_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "core"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."medication_catalog_variants" ADD CONSTRAINT "medication_catalog_variants_medication_id_medication_catalog_id_fk" FOREIGN KEY ("medication_id") REFERENCES "clinical"."medication_catalog"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."pharmacy_audit_traces" ADD CONSTRAINT "pharmacy_audit_traces_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "core"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."pharmacy_audit_traces" ADD CONSTRAINT "pharmacy_audit_traces_partner_id_operational_partners_id_fk" FOREIGN KEY ("partner_id") REFERENCES "clinical"."operational_partners"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."pharmacy_audit_traces" ADD CONSTRAINT "pharmacy_audit_traces_organization_id_operational_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "clinical"."operational_organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."pharmacy_audit_traces" ADD CONSTRAINT "pharmacy_audit_traces_branch_id_operational_facilities_id_fk" FOREIGN KEY ("branch_id") REFERENCES "clinical"."operational_facilities"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."pharmacy_audit_traces" ADD CONSTRAINT "pharmacy_audit_traces_prescription_id_pharmacy_prescriptions_id_fk" FOREIGN KEY ("prescription_id") REFERENCES "clinical"."pharmacy_prescriptions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."pharmacy_audit_traces" ADD CONSTRAINT "pharmacy_audit_traces_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "clinical"."patients"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."pharmacy_batches" ADD CONSTRAINT "pharmacy_batches_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "core"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."pharmacy_batches" ADD CONSTRAINT "pharmacy_batches_partner_id_operational_partners_id_fk" FOREIGN KEY ("partner_id") REFERENCES "clinical"."operational_partners"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."pharmacy_batches" ADD CONSTRAINT "pharmacy_batches_organization_id_operational_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "clinical"."operational_organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."pharmacy_batches" ADD CONSTRAINT "pharmacy_batches_branch_id_operational_facilities_id_fk" FOREIGN KEY ("branch_id") REFERENCES "clinical"."operational_facilities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."pharmacy_batches" ADD CONSTRAINT "pharmacy_batches_medication_id_medication_catalog_id_fk" FOREIGN KEY ("medication_id") REFERENCES "clinical"."medication_catalog"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."pharmacy_dispensing" ADD CONSTRAINT "pharmacy_dispensing_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "core"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."pharmacy_dispensing" ADD CONSTRAINT "pharmacy_dispensing_partner_id_operational_partners_id_fk" FOREIGN KEY ("partner_id") REFERENCES "clinical"."operational_partners"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."pharmacy_dispensing" ADD CONSTRAINT "pharmacy_dispensing_organization_id_operational_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "clinical"."operational_organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."pharmacy_dispensing" ADD CONSTRAINT "pharmacy_dispensing_branch_id_operational_facilities_id_fk" FOREIGN KEY ("branch_id") REFERENCES "clinical"."operational_facilities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."pharmacy_dispensing" ADD CONSTRAINT "pharmacy_dispensing_prescription_id_pharmacy_prescriptions_id_fk" FOREIGN KEY ("prescription_id") REFERENCES "clinical"."pharmacy_prescriptions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."pharmacy_dispensing" ADD CONSTRAINT "pharmacy_dispensing_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "clinical"."patients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."pharmacy_dispensing_items" ADD CONSTRAINT "pharmacy_dispensing_items_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "core"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."pharmacy_dispensing_items" ADD CONSTRAINT "pharmacy_dispensing_items_dispensing_id_pharmacy_dispensing_id_fk" FOREIGN KEY ("dispensing_id") REFERENCES "clinical"."pharmacy_dispensing"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."pharmacy_dispensing_items" ADD CONSTRAINT "pharmacy_dispensing_items_prescription_item_id_pharmacy_prescription_items_id_fk" FOREIGN KEY ("prescription_item_id") REFERENCES "clinical"."pharmacy_prescription_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."pharmacy_dispensing_items" ADD CONSTRAINT "pharmacy_dispensing_items_medication_id_medication_catalog_id_fk" FOREIGN KEY ("medication_id") REFERENCES "clinical"."medication_catalog"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."pharmacy_dispensing_items" ADD CONSTRAINT "pharmacy_dispensing_items_batch_id_pharmacy_batches_id_fk" FOREIGN KEY ("batch_id") REFERENCES "clinical"."pharmacy_batches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."pharmacy_dispensing_items" ADD CONSTRAINT "pharmacy_dispensing_items_substituted_medication_id_medication_catalog_id_fk" FOREIGN KEY ("substituted_medication_id") REFERENCES "clinical"."medication_catalog"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."pharmacy_inventory" ADD CONSTRAINT "pharmacy_inventory_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "core"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."pharmacy_inventory" ADD CONSTRAINT "pharmacy_inventory_partner_id_operational_partners_id_fk" FOREIGN KEY ("partner_id") REFERENCES "clinical"."operational_partners"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."pharmacy_inventory" ADD CONSTRAINT "pharmacy_inventory_organization_id_operational_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "clinical"."operational_organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."pharmacy_inventory" ADD CONSTRAINT "pharmacy_inventory_branch_id_operational_facilities_id_fk" FOREIGN KEY ("branch_id") REFERENCES "clinical"."operational_facilities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."pharmacy_inventory" ADD CONSTRAINT "pharmacy_inventory_medication_id_medication_catalog_id_fk" FOREIGN KEY ("medication_id") REFERENCES "clinical"."medication_catalog"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."pharmacy_prescription_items" ADD CONSTRAINT "pharmacy_prescription_items_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "core"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."pharmacy_prescription_items" ADD CONSTRAINT "pharmacy_prescription_items_prescription_id_pharmacy_prescriptions_id_fk" FOREIGN KEY ("prescription_id") REFERENCES "clinical"."pharmacy_prescriptions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."pharmacy_prescription_items" ADD CONSTRAINT "pharmacy_prescription_items_medication_id_medication_catalog_id_fk" FOREIGN KEY ("medication_id") REFERENCES "clinical"."medication_catalog"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."pharmacy_prescriptions" ADD CONSTRAINT "pharmacy_prescriptions_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "core"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."pharmacy_prescriptions" ADD CONSTRAINT "pharmacy_prescriptions_partner_id_operational_partners_id_fk" FOREIGN KEY ("partner_id") REFERENCES "clinical"."operational_partners"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."pharmacy_prescriptions" ADD CONSTRAINT "pharmacy_prescriptions_organization_id_operational_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "clinical"."operational_organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."pharmacy_prescriptions" ADD CONSTRAINT "pharmacy_prescriptions_branch_id_operational_facilities_id_fk" FOREIGN KEY ("branch_id") REFERENCES "clinical"."operational_facilities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."pharmacy_prescriptions" ADD CONSTRAINT "pharmacy_prescriptions_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "clinical"."patients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."pharmacy_prescriptions" ADD CONSTRAINT "pharmacy_prescriptions_encounter_id_encounters_id_fk" FOREIGN KEY ("encounter_id") REFERENCES "clinical"."encounters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."pharmacy_prescriptions" ADD CONSTRAINT "pharmacy_prescriptions_consultation_id_consultations_id_fk" FOREIGN KEY ("consultation_id") REFERENCES "clinical"."consultations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."pharmacy_prescriptions" ADD CONSTRAINT "pharmacy_prescriptions_prescribing_doctor_id_doctor_profiles_id_fk" FOREIGN KEY ("prescribing_doctor_id") REFERENCES "clinical"."doctor_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."pharmacy_returns" ADD CONSTRAINT "pharmacy_returns_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "core"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."pharmacy_returns" ADD CONSTRAINT "pharmacy_returns_partner_id_operational_partners_id_fk" FOREIGN KEY ("partner_id") REFERENCES "clinical"."operational_partners"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."pharmacy_returns" ADD CONSTRAINT "pharmacy_returns_organization_id_operational_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "clinical"."operational_organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."pharmacy_returns" ADD CONSTRAINT "pharmacy_returns_branch_id_operational_facilities_id_fk" FOREIGN KEY ("branch_id") REFERENCES "clinical"."operational_facilities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."pharmacy_returns" ADD CONSTRAINT "pharmacy_returns_dispensing_id_pharmacy_dispensing_id_fk" FOREIGN KEY ("dispensing_id") REFERENCES "clinical"."pharmacy_dispensing"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."pharmacy_returns" ADD CONSTRAINT "pharmacy_returns_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "clinical"."patients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."pharmacy_returns" ADD CONSTRAINT "pharmacy_returns_medication_id_medication_catalog_id_fk" FOREIGN KEY ("medication_id") REFERENCES "clinical"."medication_catalog"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."pharmacy_returns" ADD CONSTRAINT "pharmacy_returns_batch_id_pharmacy_batches_id_fk" FOREIGN KEY ("batch_id") REFERENCES "clinical"."pharmacy_batches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."pharmacy_stock_adjustments" ADD CONSTRAINT "pharmacy_stock_adjustments_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "core"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."pharmacy_stock_adjustments" ADD CONSTRAINT "pharmacy_stock_adjustments_partner_id_operational_partners_id_fk" FOREIGN KEY ("partner_id") REFERENCES "clinical"."operational_partners"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."pharmacy_stock_adjustments" ADD CONSTRAINT "pharmacy_stock_adjustments_organization_id_operational_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "clinical"."operational_organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."pharmacy_stock_adjustments" ADD CONSTRAINT "pharmacy_stock_adjustments_branch_id_operational_facilities_id_fk" FOREIGN KEY ("branch_id") REFERENCES "clinical"."operational_facilities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."pharmacy_stock_adjustments" ADD CONSTRAINT "pharmacy_stock_adjustments_medication_id_medication_catalog_id_fk" FOREIGN KEY ("medication_id") REFERENCES "clinical"."medication_catalog"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."pharmacy_stock_adjustments" ADD CONSTRAINT "pharmacy_stock_adjustments_batch_id_pharmacy_batches_id_fk" FOREIGN KEY ("batch_id") REFERENCES "clinical"."pharmacy_batches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."pharmacy_stock_movements" ADD CONSTRAINT "pharmacy_stock_movements_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "core"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."pharmacy_stock_movements" ADD CONSTRAINT "pharmacy_stock_movements_partner_id_operational_partners_id_fk" FOREIGN KEY ("partner_id") REFERENCES "clinical"."operational_partners"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."pharmacy_stock_movements" ADD CONSTRAINT "pharmacy_stock_movements_organization_id_operational_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "clinical"."operational_organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."pharmacy_stock_movements" ADD CONSTRAINT "pharmacy_stock_movements_branch_id_operational_facilities_id_fk" FOREIGN KEY ("branch_id") REFERENCES "clinical"."operational_facilities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."pharmacy_stock_movements" ADD CONSTRAINT "pharmacy_stock_movements_medication_id_medication_catalog_id_fk" FOREIGN KEY ("medication_id") REFERENCES "clinical"."medication_catalog"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."pharmacy_stock_movements" ADD CONSTRAINT "pharmacy_stock_movements_batch_id_pharmacy_batches_id_fk" FOREIGN KEY ("batch_id") REFERENCES "clinical"."pharmacy_batches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."pharmacy_stock_reservations" ADD CONSTRAINT "pharmacy_stock_reservations_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "core"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."pharmacy_stock_reservations" ADD CONSTRAINT "pharmacy_stock_reservations_partner_id_operational_partners_id_fk" FOREIGN KEY ("partner_id") REFERENCES "clinical"."operational_partners"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."pharmacy_stock_reservations" ADD CONSTRAINT "pharmacy_stock_reservations_organization_id_operational_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "clinical"."operational_organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."pharmacy_stock_reservations" ADD CONSTRAINT "pharmacy_stock_reservations_branch_id_operational_facilities_id_fk" FOREIGN KEY ("branch_id") REFERENCES "clinical"."operational_facilities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."pharmacy_stock_reservations" ADD CONSTRAINT "pharmacy_stock_reservations_prescription_id_pharmacy_prescriptions_id_fk" FOREIGN KEY ("prescription_id") REFERENCES "clinical"."pharmacy_prescriptions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."pharmacy_stock_reservations" ADD CONSTRAINT "pharmacy_stock_reservations_prescription_item_id_pharmacy_prescription_items_id_fk" FOREIGN KEY ("prescription_item_id") REFERENCES "clinical"."pharmacy_prescription_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."pharmacy_stock_reservations" ADD CONSTRAINT "pharmacy_stock_reservations_medication_id_medication_catalog_id_fk" FOREIGN KEY ("medication_id") REFERENCES "clinical"."medication_catalog"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."pharmacy_stock_reservations" ADD CONSTRAINT "pharmacy_stock_reservations_batch_id_pharmacy_batches_id_fk" FOREIGN KEY ("batch_id") REFERENCES "clinical"."pharmacy_batches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."pharmacy_substitution_requests" ADD CONSTRAINT "pharmacy_substitution_requests_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "core"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."pharmacy_substitution_requests" ADD CONSTRAINT "pharmacy_substitution_requests_partner_id_operational_partners_id_fk" FOREIGN KEY ("partner_id") REFERENCES "clinical"."operational_partners"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."pharmacy_substitution_requests" ADD CONSTRAINT "pharmacy_substitution_requests_organization_id_operational_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "clinical"."operational_organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."pharmacy_substitution_requests" ADD CONSTRAINT "pharmacy_substitution_requests_branch_id_operational_facilities_id_fk" FOREIGN KEY ("branch_id") REFERENCES "clinical"."operational_facilities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."pharmacy_substitution_requests" ADD CONSTRAINT "pharmacy_substitution_requests_prescription_id_pharmacy_prescriptions_id_fk" FOREIGN KEY ("prescription_id") REFERENCES "clinical"."pharmacy_prescriptions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."pharmacy_substitution_requests" ADD CONSTRAINT "pharmacy_substitution_requests_prescription_item_id_pharmacy_prescription_items_id_fk" FOREIGN KEY ("prescription_item_id") REFERENCES "clinical"."pharmacy_prescription_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."pharmacy_substitution_requests" ADD CONSTRAINT "pharmacy_substitution_requests_original_medication_id_medication_catalog_id_fk" FOREIGN KEY ("original_medication_id") REFERENCES "clinical"."medication_catalog"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."pharmacy_substitution_requests" ADD CONSTRAINT "pharmacy_substitution_requests_requested_medication_id_medication_catalog_id_fk" FOREIGN KEY ("requested_medication_id") REFERENCES "clinical"."medication_catalog"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_med_cat_tenant" ON "clinical"."medication_catalog" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_med_cat_partner" ON "clinical"."medication_catalog" USING btree ("partner_id");--> statement-breakpoint
CREATE INDEX "idx_med_cat_org" ON "clinical"."medication_catalog" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_med_cat_code" ON "clinical"."medication_catalog" USING btree ("medication_code");--> statement-breakpoint
CREATE INDEX "idx_med_cat_generic" ON "clinical"."medication_catalog" USING btree ("generic_name");--> statement-breakpoint
CREATE INDEX "idx_med_cat_brand" ON "clinical"."medication_catalog" USING btree ("brand_name");--> statement-breakpoint
CREATE INDEX "idx_med_cat_category" ON "clinical"."medication_catalog" USING btree ("category");--> statement-breakpoint
CREATE INDEX "idx_med_cat_controlled" ON "clinical"."medication_catalog" USING btree ("controlled_medication");--> statement-breakpoint
CREATE INDEX "idx_med_cat_status" ON "clinical"."medication_catalog" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_med_cat_tenant_code" ON "clinical"."medication_catalog" USING btree ("tenant_id","medication_code");--> statement-breakpoint
CREATE INDEX "idx_med_var_tenant" ON "clinical"."medication_catalog_variants" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_med_var_medication" ON "clinical"."medication_catalog_variants" USING btree ("medication_id");--> statement-breakpoint
CREATE INDEX "idx_med_var_barcode" ON "clinical"."medication_catalog_variants" USING btree ("barcode");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_med_var_tenant_code" ON "clinical"."medication_catalog_variants" USING btree ("tenant_id","variant_code");--> statement-breakpoint
CREATE INDEX "idx_pharm_audit_tenant" ON "clinical"."pharmacy_audit_traces" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_pharm_audit_partner" ON "clinical"."pharmacy_audit_traces" USING btree ("partner_id");--> statement-breakpoint
CREATE INDEX "idx_pharm_audit_org" ON "clinical"."pharmacy_audit_traces" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_pharm_audit_branch" ON "clinical"."pharmacy_audit_traces" USING btree ("branch_id");--> statement-breakpoint
CREATE INDEX "idx_pharm_audit_prescription" ON "clinical"."pharmacy_audit_traces" USING btree ("prescription_id");--> statement-breakpoint
CREATE INDEX "idx_pharm_audit_patient" ON "clinical"."pharmacy_audit_traces" USING btree ("patient_id");--> statement-breakpoint
CREATE INDEX "idx_pharm_audit_action" ON "clinical"."pharmacy_audit_traces" USING btree ("action");--> statement-breakpoint
CREATE INDEX "idx_pharm_audit_occurred" ON "clinical"."pharmacy_audit_traces" USING btree ("occurred_at");--> statement-breakpoint
CREATE INDEX "idx_pharm_batch_tenant" ON "clinical"."pharmacy_batches" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_pharm_batch_branch" ON "clinical"."pharmacy_batches" USING btree ("branch_id");--> statement-breakpoint
CREATE INDEX "idx_pharm_batch_medication" ON "clinical"."pharmacy_batches" USING btree ("medication_id");--> statement-breakpoint
CREATE INDEX "idx_pharm_batch_number" ON "clinical"."pharmacy_batches" USING btree ("batch_number");--> statement-breakpoint
CREATE INDEX "idx_pharm_batch_expiry" ON "clinical"."pharmacy_batches" USING btree ("expiry_date");--> statement-breakpoint
CREATE INDEX "idx_pharm_batch_status" ON "clinical"."pharmacy_batches" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_pharm_batch_branch_med_num" ON "clinical"."pharmacy_batches" USING btree ("branch_id","medication_id","batch_number");--> statement-breakpoint
CREATE INDEX "idx_disp_tenant" ON "clinical"."pharmacy_dispensing" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_disp_partner" ON "clinical"."pharmacy_dispensing" USING btree ("partner_id");--> statement-breakpoint
CREATE INDEX "idx_disp_org" ON "clinical"."pharmacy_dispensing" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_disp_branch" ON "clinical"."pharmacy_dispensing" USING btree ("branch_id");--> statement-breakpoint
CREATE INDEX "idx_disp_prescription" ON "clinical"."pharmacy_dispensing" USING btree ("prescription_id");--> statement-breakpoint
CREATE INDEX "idx_disp_patient" ON "clinical"."pharmacy_dispensing" USING btree ("patient_id");--> statement-breakpoint
CREATE INDEX "idx_disp_status" ON "clinical"."pharmacy_dispensing" USING btree ("dispensing_status");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_disp_tenant_number" ON "clinical"."pharmacy_dispensing" USING btree ("tenant_id","dispensing_number");--> statement-breakpoint
CREATE INDEX "idx_disp_item_tenant" ON "clinical"."pharmacy_dispensing_items" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_disp_item_dispensing" ON "clinical"."pharmacy_dispensing_items" USING btree ("dispensing_id");--> statement-breakpoint
CREATE INDEX "idx_disp_item_prescription_item" ON "clinical"."pharmacy_dispensing_items" USING btree ("prescription_item_id");--> statement-breakpoint
CREATE INDEX "idx_disp_item_batch" ON "clinical"."pharmacy_dispensing_items" USING btree ("batch_id");--> statement-breakpoint
CREATE INDEX "idx_pharm_inv_tenant" ON "clinical"."pharmacy_inventory" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_pharm_inv_org" ON "clinical"."pharmacy_inventory" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_pharm_inv_branch" ON "clinical"."pharmacy_inventory" USING btree ("branch_id");--> statement-breakpoint
CREATE INDEX "idx_pharm_inv_medication" ON "clinical"."pharmacy_inventory" USING btree ("medication_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_pharm_inv_branch_med" ON "clinical"."pharmacy_inventory" USING btree ("branch_id","medication_id");--> statement-breakpoint
CREATE INDEX "idx_rx_item_tenant" ON "clinical"."pharmacy_prescription_items" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_rx_item_prescription" ON "clinical"."pharmacy_prescription_items" USING btree ("prescription_id");--> statement-breakpoint
CREATE INDEX "idx_rx_item_medication" ON "clinical"."pharmacy_prescription_items" USING btree ("medication_id");--> statement-breakpoint
CREATE INDEX "idx_rx_item_status" ON "clinical"."pharmacy_prescription_items" USING btree ("fulfillment_status");--> statement-breakpoint
CREATE INDEX "idx_rx_tenant" ON "clinical"."pharmacy_prescriptions" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_rx_partner" ON "clinical"."pharmacy_prescriptions" USING btree ("partner_id");--> statement-breakpoint
CREATE INDEX "idx_rx_org" ON "clinical"."pharmacy_prescriptions" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_rx_branch" ON "clinical"."pharmacy_prescriptions" USING btree ("branch_id");--> statement-breakpoint
CREATE INDEX "idx_rx_patient" ON "clinical"."pharmacy_prescriptions" USING btree ("patient_id");--> statement-breakpoint
CREATE INDEX "idx_rx_encounter" ON "clinical"."pharmacy_prescriptions" USING btree ("encounter_id");--> statement-breakpoint
CREATE INDEX "idx_rx_doctor" ON "clinical"."pharmacy_prescriptions" USING btree ("prescribing_doctor_id");--> statement-breakpoint
CREATE INDEX "idx_rx_status" ON "clinical"."pharmacy_prescriptions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_rx_priority" ON "clinical"."pharmacy_prescriptions" USING btree ("priority");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_rx_tenant_number" ON "clinical"."pharmacy_prescriptions" USING btree ("tenant_id","prescription_number");--> statement-breakpoint
CREATE INDEX "idx_return_tenant" ON "clinical"."pharmacy_returns" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_return_branch" ON "clinical"."pharmacy_returns" USING btree ("branch_id");--> statement-breakpoint
CREATE INDEX "idx_return_dispensing" ON "clinical"."pharmacy_returns" USING btree ("dispensing_id");--> statement-breakpoint
CREATE INDEX "idx_return_patient" ON "clinical"."pharmacy_returns" USING btree ("patient_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_return_tenant_number" ON "clinical"."pharmacy_returns" USING btree ("tenant_id","return_number");--> statement-breakpoint
CREATE INDEX "idx_adj_tenant" ON "clinical"."pharmacy_stock_adjustments" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_adj_branch" ON "clinical"."pharmacy_stock_adjustments" USING btree ("branch_id");--> statement-breakpoint
CREATE INDEX "idx_adj_medication" ON "clinical"."pharmacy_stock_adjustments" USING btree ("medication_id");--> statement-breakpoint
CREATE INDEX "idx_adj_batch" ON "clinical"."pharmacy_stock_adjustments" USING btree ("batch_id");--> statement-breakpoint
CREATE INDEX "idx_adj_reason" ON "clinical"."pharmacy_stock_adjustments" USING btree ("reason");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_adj_tenant_number" ON "clinical"."pharmacy_stock_adjustments" USING btree ("tenant_id","adjustment_number");--> statement-breakpoint
CREATE INDEX "idx_stock_mov_tenant" ON "clinical"."pharmacy_stock_movements" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_stock_mov_branch" ON "clinical"."pharmacy_stock_movements" USING btree ("branch_id");--> statement-breakpoint
CREATE INDEX "idx_stock_mov_medication" ON "clinical"."pharmacy_stock_movements" USING btree ("medication_id");--> statement-breakpoint
CREATE INDEX "idx_stock_mov_batch" ON "clinical"."pharmacy_stock_movements" USING btree ("batch_id");--> statement-breakpoint
CREATE INDEX "idx_stock_mov_type" ON "clinical"."pharmacy_stock_movements" USING btree ("movement_type");--> statement-breakpoint
CREATE INDEX "idx_stock_mov_occurred" ON "clinical"."pharmacy_stock_movements" USING btree ("occurred_at");--> statement-breakpoint
CREATE INDEX "idx_stock_res_tenant" ON "clinical"."pharmacy_stock_reservations" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_stock_res_branch" ON "clinical"."pharmacy_stock_reservations" USING btree ("branch_id");--> statement-breakpoint
CREATE INDEX "idx_stock_res_prescription" ON "clinical"."pharmacy_stock_reservations" USING btree ("prescription_id");--> statement-breakpoint
CREATE INDEX "idx_stock_res_batch" ON "clinical"."pharmacy_stock_reservations" USING btree ("batch_id");--> statement-breakpoint
CREATE INDEX "idx_stock_res_status" ON "clinical"."pharmacy_stock_reservations" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_sub_req_tenant" ON "clinical"."pharmacy_substitution_requests" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_sub_req_branch" ON "clinical"."pharmacy_substitution_requests" USING btree ("branch_id");--> statement-breakpoint
CREATE INDEX "idx_sub_req_prescription" ON "clinical"."pharmacy_substitution_requests" USING btree ("prescription_id");--> statement-breakpoint
CREATE INDEX "idx_sub_req_status" ON "clinical"."pharmacy_substitution_requests" USING btree ("status");