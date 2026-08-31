CREATE TABLE "clinical"."investigation_audit_traces" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"trace_id" varchar(100) NOT NULL,
	"tenant_id" uuid NOT NULL,
	"partner_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"branch_id" uuid,
	"order_id" uuid,
	"patient_id" uuid,
	"actor_id" varchar(100) NOT NULL,
	"actor_role" varchar(50) NOT NULL,
	"action" varchar(100) NOT NULL,
	"target_entity" varchar(100) NOT NULL,
	"target_entity_id" varchar(100) NOT NULL,
	"previous_snapshot" jsonb,
	"new_snapshot" jsonb,
	"justification" text NOT NULL,
	"operation_status" varchar(50) DEFAULT 'SUCCESS' NOT NULL,
	"correlation_id" varchar(100) NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "investigation_audit_traces_trace_id_unique" UNIQUE("trace_id")
);
--> statement-breakpoint
CREATE TABLE "clinical"."investigation_catalog" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"partner_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"branch_id" uuid,
	"test_code" varchar(100) NOT NULL,
	"test_name" varchar(255) NOT NULL,
	"short_name" varchar(100),
	"category" varchar(50) NOT NULL,
	"specimen_type" varchar(50) DEFAULT 'WHOLE_BLOOD' NOT NULL,
	"department" varchar(100) NOT NULL,
	"clinical_description" text,
	"preparation_requirements" text,
	"fasting_required" boolean DEFAULT false NOT NULL,
	"turnaround_target_hours" integer DEFAULT 24 NOT NULL,
	"sample_volume" varchar(100),
	"status" varchar(50) DEFAULT 'ACTIVE' NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clinical"."investigation_orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"partner_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"branch_id" uuid,
	"order_number" varchar(100) NOT NULL,
	"patient_id" uuid NOT NULL,
	"encounter_id" uuid NOT NULL,
	"consultation_id" uuid,
	"ordering_doctor_id" uuid NOT NULL,
	"investigation_id" uuid NOT NULL,
	"panel_id" uuid,
	"priority" varchar(50) DEFAULT 'ROUTINE' NOT NULL,
	"clinical_indication" text NOT NULL,
	"diagnosis_context" text,
	"specimen_type" varchar(50) DEFAULT 'WHOLE_BLOOD' NOT NULL,
	"fasting_confirmed" boolean DEFAULT false NOT NULL,
	"status" varchar(50) DEFAULT 'ORDERED' NOT NULL,
	"is_abnormal" boolean DEFAULT false NOT NULL,
	"is_critical" boolean DEFAULT false NOT NULL,
	"ordered_at" timestamp with time zone DEFAULT now() NOT NULL,
	"acknowledged_at" timestamp with time zone,
	"sample_collected_at" timestamp with time zone,
	"processing_started_at" timestamp with time zone,
	"result_entered_at" timestamp with time zone,
	"verified_at" timestamp with time zone,
	"reviewed_at" timestamp with time zone,
	"cancelled_at" timestamp with time zone,
	"cancellation_reason" text,
	"cancelled_by" varchar(100),
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "investigation_orders_order_number_unique" UNIQUE("order_number")
);
--> statement-breakpoint
CREATE TABLE "clinical"."investigation_panel_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"partner_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"panel_id" uuid NOT NULL,
	"investigation_id" uuid NOT NULL,
	"display_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clinical"."investigation_panels" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"partner_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"panel_code" varchar(100) NOT NULL,
	"panel_name" varchar(255) NOT NULL,
	"category" varchar(50) NOT NULL,
	"description" text,
	"status" varchar(50) DEFAULT 'ACTIVE' NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clinical"."investigation_reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"partner_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"order_id" uuid NOT NULL,
	"patient_id" uuid NOT NULL,
	"report_number" varchar(100) NOT NULL,
	"report_title" varchar(255) NOT NULL,
	"clinical_findings" text,
	"impression" text,
	"recommendations" text,
	"reporting_clinician" varchar(100) NOT NULL,
	"verifying_pathologist" varchar(100),
	"report_status" varchar(50) DEFAULT 'DRAFT' NOT NULL,
	"report_version" integer DEFAULT 1 NOT NULL,
	"finalized_at" timestamp with time zone,
	"reviewed_by_doctor_at" timestamp with time zone,
	"reviewing_doctor" varchar(100),
	"doctor_review_notes" text,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "investigation_reports_report_number_unique" UNIQUE("report_number")
);
--> statement-breakpoint
CREATE TABLE "clinical"."investigation_result_amendments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"partner_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"order_id" uuid NOT NULL,
	"result_id" uuid NOT NULL,
	"report_id" uuid,
	"amendment_number" integer DEFAULT 1 NOT NULL,
	"previous_value" text NOT NULL,
	"new_value" text NOT NULL,
	"previous_abnormal_flag" varchar(50),
	"new_abnormal_flag" varchar(50),
	"reason" text NOT NULL,
	"amended_by" varchar(100) NOT NULL,
	"amended_role" varchar(50) NOT NULL,
	"amended_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clinical"."investigation_results" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"partner_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"order_id" uuid NOT NULL,
	"specimen_id" uuid,
	"parameter_code" varchar(100) NOT NULL,
	"parameter_name" varchar(255) NOT NULL,
	"result_value" text NOT NULL,
	"numeric_value" numeric(12, 4),
	"unit" varchar(50),
	"reference_range" varchar(100),
	"reference_min" numeric(12, 4),
	"reference_max" numeric(12, 4),
	"critical_min" numeric(12, 4),
	"critical_max" numeric(12, 4),
	"abnormal_flag" varchar(50) DEFAULT 'NORMAL' NOT NULL,
	"is_critical" boolean DEFAULT false NOT NULL,
	"qualitative_interpretation" text,
	"result_status" varchar(50) DEFAULT 'DRAFT' NOT NULL,
	"entered_by" varchar(100) NOT NULL,
	"entered_at" timestamp with time zone DEFAULT now() NOT NULL,
	"verified_by" varchar(100),
	"verified_at" timestamp with time zone,
	"version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clinical"."investigation_specimens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"partner_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"order_id" uuid NOT NULL,
	"patient_id" uuid NOT NULL,
	"accession_number" varchar(100) NOT NULL,
	"specimen_type" varchar(50) NOT NULL,
	"container_type" varchar(100),
	"collection_site" varchar(100),
	"collection_status" varchar(50) DEFAULT 'PENDING' NOT NULL,
	"collected_at" timestamp with time zone,
	"collected_by" varchar(100),
	"received_in_lab_at" timestamp with time zone,
	"received_by" varchar(100),
	"rejection_status" boolean DEFAULT false NOT NULL,
	"rejection_reason" text,
	"rejected_at" timestamp with time zone,
	"rejected_by" varchar(100),
	"collection_notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "investigation_specimens_accession_number_unique" UNIQUE("accession_number")
);
--> statement-breakpoint
ALTER TABLE "clinical"."investigation_audit_traces" ADD CONSTRAINT "investigation_audit_traces_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "core"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."investigation_audit_traces" ADD CONSTRAINT "investigation_audit_traces_partner_id_operational_partners_id_fk" FOREIGN KEY ("partner_id") REFERENCES "clinical"."operational_partners"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."investigation_audit_traces" ADD CONSTRAINT "investigation_audit_traces_organization_id_operational_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "clinical"."operational_organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."investigation_audit_traces" ADD CONSTRAINT "investigation_audit_traces_branch_id_operational_facilities_id_fk" FOREIGN KEY ("branch_id") REFERENCES "clinical"."operational_facilities"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."investigation_catalog" ADD CONSTRAINT "investigation_catalog_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "core"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."investigation_catalog" ADD CONSTRAINT "investigation_catalog_partner_id_operational_partners_id_fk" FOREIGN KEY ("partner_id") REFERENCES "clinical"."operational_partners"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."investigation_catalog" ADD CONSTRAINT "investigation_catalog_organization_id_operational_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "clinical"."operational_organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."investigation_catalog" ADD CONSTRAINT "investigation_catalog_branch_id_operational_facilities_id_fk" FOREIGN KEY ("branch_id") REFERENCES "clinical"."operational_facilities"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."investigation_orders" ADD CONSTRAINT "investigation_orders_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "core"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."investigation_orders" ADD CONSTRAINT "investigation_orders_partner_id_operational_partners_id_fk" FOREIGN KEY ("partner_id") REFERENCES "clinical"."operational_partners"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."investigation_orders" ADD CONSTRAINT "investigation_orders_organization_id_operational_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "clinical"."operational_organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."investigation_orders" ADD CONSTRAINT "investigation_orders_branch_id_operational_facilities_id_fk" FOREIGN KEY ("branch_id") REFERENCES "clinical"."operational_facilities"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."investigation_orders" ADD CONSTRAINT "investigation_orders_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "clinical"."patients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."investigation_orders" ADD CONSTRAINT "investigation_orders_encounter_id_encounters_id_fk" FOREIGN KEY ("encounter_id") REFERENCES "clinical"."encounters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."investigation_orders" ADD CONSTRAINT "investigation_orders_consultation_id_consultations_id_fk" FOREIGN KEY ("consultation_id") REFERENCES "clinical"."consultations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."investigation_orders" ADD CONSTRAINT "investigation_orders_ordering_doctor_id_doctor_profiles_id_fk" FOREIGN KEY ("ordering_doctor_id") REFERENCES "clinical"."doctor_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."investigation_orders" ADD CONSTRAINT "investigation_orders_investigation_id_investigation_catalog_id_fk" FOREIGN KEY ("investigation_id") REFERENCES "clinical"."investigation_catalog"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."investigation_orders" ADD CONSTRAINT "investigation_orders_panel_id_investigation_panels_id_fk" FOREIGN KEY ("panel_id") REFERENCES "clinical"."investigation_panels"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."investigation_panel_items" ADD CONSTRAINT "investigation_panel_items_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "core"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."investigation_panel_items" ADD CONSTRAINT "investigation_panel_items_partner_id_operational_partners_id_fk" FOREIGN KEY ("partner_id") REFERENCES "clinical"."operational_partners"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."investigation_panel_items" ADD CONSTRAINT "investigation_panel_items_organization_id_operational_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "clinical"."operational_organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."investigation_panel_items" ADD CONSTRAINT "investigation_panel_items_panel_id_investigation_panels_id_fk" FOREIGN KEY ("panel_id") REFERENCES "clinical"."investigation_panels"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."investigation_panel_items" ADD CONSTRAINT "investigation_panel_items_investigation_id_investigation_catalog_id_fk" FOREIGN KEY ("investigation_id") REFERENCES "clinical"."investigation_catalog"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."investigation_panels" ADD CONSTRAINT "investigation_panels_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "core"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."investigation_panels" ADD CONSTRAINT "investigation_panels_partner_id_operational_partners_id_fk" FOREIGN KEY ("partner_id") REFERENCES "clinical"."operational_partners"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."investigation_panels" ADD CONSTRAINT "investigation_panels_organization_id_operational_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "clinical"."operational_organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."investigation_reports" ADD CONSTRAINT "investigation_reports_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "core"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."investigation_reports" ADD CONSTRAINT "investigation_reports_partner_id_operational_partners_id_fk" FOREIGN KEY ("partner_id") REFERENCES "clinical"."operational_partners"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."investigation_reports" ADD CONSTRAINT "investigation_reports_organization_id_operational_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "clinical"."operational_organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."investigation_reports" ADD CONSTRAINT "investigation_reports_order_id_investigation_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "clinical"."investigation_orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."investigation_reports" ADD CONSTRAINT "investigation_reports_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "clinical"."patients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."investigation_result_amendments" ADD CONSTRAINT "investigation_result_amendments_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "core"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."investigation_result_amendments" ADD CONSTRAINT "investigation_result_amendments_partner_id_operational_partners_id_fk" FOREIGN KEY ("partner_id") REFERENCES "clinical"."operational_partners"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."investigation_result_amendments" ADD CONSTRAINT "investigation_result_amendments_organization_id_operational_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "clinical"."operational_organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."investigation_result_amendments" ADD CONSTRAINT "investigation_result_amendments_order_id_investigation_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "clinical"."investigation_orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."investigation_result_amendments" ADD CONSTRAINT "investigation_result_amendments_result_id_investigation_results_id_fk" FOREIGN KEY ("result_id") REFERENCES "clinical"."investigation_results"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."investigation_result_amendments" ADD CONSTRAINT "investigation_result_amendments_report_id_investigation_reports_id_fk" FOREIGN KEY ("report_id") REFERENCES "clinical"."investigation_reports"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."investigation_results" ADD CONSTRAINT "investigation_results_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "core"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."investigation_results" ADD CONSTRAINT "investigation_results_partner_id_operational_partners_id_fk" FOREIGN KEY ("partner_id") REFERENCES "clinical"."operational_partners"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."investigation_results" ADD CONSTRAINT "investigation_results_organization_id_operational_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "clinical"."operational_organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."investigation_results" ADD CONSTRAINT "investigation_results_order_id_investigation_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "clinical"."investigation_orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."investigation_results" ADD CONSTRAINT "investigation_results_specimen_id_investigation_specimens_id_fk" FOREIGN KEY ("specimen_id") REFERENCES "clinical"."investigation_specimens"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."investigation_specimens" ADD CONSTRAINT "investigation_specimens_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "core"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."investigation_specimens" ADD CONSTRAINT "investigation_specimens_partner_id_operational_partners_id_fk" FOREIGN KEY ("partner_id") REFERENCES "clinical"."operational_partners"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."investigation_specimens" ADD CONSTRAINT "investigation_specimens_organization_id_operational_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "clinical"."operational_organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."investigation_specimens" ADD CONSTRAINT "investigation_specimens_order_id_investigation_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "clinical"."investigation_orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."investigation_specimens" ADD CONSTRAINT "investigation_specimens_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "clinical"."patients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_inv_audit_tenant" ON "clinical"."investigation_audit_traces" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_inv_audit_partner" ON "clinical"."investigation_audit_traces" USING btree ("partner_id");--> statement-breakpoint
CREATE INDEX "idx_inv_audit_org" ON "clinical"."investigation_audit_traces" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_inv_audit_order" ON "clinical"."investigation_audit_traces" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "idx_inv_audit_patient" ON "clinical"."investigation_audit_traces" USING btree ("patient_id");--> statement-breakpoint
CREATE INDEX "idx_inv_audit_action" ON "clinical"."investigation_audit_traces" USING btree ("action");--> statement-breakpoint
CREATE INDEX "idx_inv_audit_status" ON "clinical"."investigation_audit_traces" USING btree ("operation_status");--> statement-breakpoint
CREATE INDEX "idx_inv_audit_occurred" ON "clinical"."investigation_audit_traces" USING btree ("occurred_at");--> statement-breakpoint
CREATE INDEX "idx_inv_cat_tenant" ON "clinical"."investigation_catalog" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_inv_cat_org" ON "clinical"."investigation_catalog" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_inv_cat_code" ON "clinical"."investigation_catalog" USING btree ("test_code");--> statement-breakpoint
CREATE INDEX "idx_inv_cat_category" ON "clinical"."investigation_catalog" USING btree ("category");--> statement-breakpoint
CREATE INDEX "idx_inv_cat_status" ON "clinical"."investigation_catalog" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_inv_ord_tenant" ON "clinical"."investigation_orders" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_inv_ord_org" ON "clinical"."investigation_orders" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_inv_ord_patient" ON "clinical"."investigation_orders" USING btree ("patient_id");--> statement-breakpoint
CREATE INDEX "idx_inv_ord_encounter" ON "clinical"."investigation_orders" USING btree ("encounter_id");--> statement-breakpoint
CREATE INDEX "idx_inv_ord_cons" ON "clinical"."investigation_orders" USING btree ("consultation_id");--> statement-breakpoint
CREATE INDEX "idx_inv_ord_doctor" ON "clinical"."investigation_orders" USING btree ("ordering_doctor_id");--> statement-breakpoint
CREATE INDEX "idx_inv_ord_status" ON "clinical"."investigation_orders" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_inv_ord_priority" ON "clinical"."investigation_orders" USING btree ("priority");--> statement-breakpoint
CREATE INDEX "idx_inv_ord_critical" ON "clinical"."investigation_orders" USING btree ("is_critical");--> statement-breakpoint
CREATE INDEX "idx_inv_pan_items_tenant" ON "clinical"."investigation_panel_items" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_inv_pan_items_panel" ON "clinical"."investigation_panel_items" USING btree ("panel_id");--> statement-breakpoint
CREATE INDEX "idx_inv_pan_items_inv" ON "clinical"."investigation_panel_items" USING btree ("investigation_id");--> statement-breakpoint
CREATE INDEX "idx_inv_pan_tenant" ON "clinical"."investigation_panels" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_inv_pan_org" ON "clinical"."investigation_panels" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_inv_pan_code" ON "clinical"."investigation_panels" USING btree ("panel_code");--> statement-breakpoint
CREATE INDEX "idx_inv_pan_category" ON "clinical"."investigation_panels" USING btree ("category");--> statement-breakpoint
CREATE INDEX "idx_inv_rep_tenant" ON "clinical"."investigation_reports" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_inv_rep_order" ON "clinical"."investigation_reports" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "idx_inv_rep_patient" ON "clinical"."investigation_reports" USING btree ("patient_id");--> statement-breakpoint
CREATE INDEX "idx_inv_rep_number" ON "clinical"."investigation_reports" USING btree ("report_number");--> statement-breakpoint
CREATE INDEX "idx_inv_rep_status" ON "clinical"."investigation_reports" USING btree ("report_status");--> statement-breakpoint
CREATE INDEX "idx_inv_amend_tenant" ON "clinical"."investigation_result_amendments" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_inv_amend_order" ON "clinical"."investigation_result_amendments" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "idx_inv_amend_result" ON "clinical"."investigation_result_amendments" USING btree ("result_id");--> statement-breakpoint
CREATE INDEX "idx_inv_res_tenant" ON "clinical"."investigation_results" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_inv_res_order" ON "clinical"."investigation_results" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "idx_inv_res_code" ON "clinical"."investigation_results" USING btree ("parameter_code");--> statement-breakpoint
CREATE INDEX "idx_inv_res_flag" ON "clinical"."investigation_results" USING btree ("abnormal_flag");--> statement-breakpoint
CREATE INDEX "idx_inv_res_status" ON "clinical"."investigation_results" USING btree ("result_status");--> statement-breakpoint
CREATE INDEX "idx_inv_spec_tenant" ON "clinical"."investigation_specimens" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_inv_spec_order" ON "clinical"."investigation_specimens" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "idx_inv_spec_patient" ON "clinical"."investigation_specimens" USING btree ("patient_id");--> statement-breakpoint
CREATE INDEX "idx_inv_spec_status" ON "clinical"."investigation_specimens" USING btree ("collection_status");--> statement-breakpoint
CREATE INDEX "idx_inv_spec_accession" ON "clinical"."investigation_specimens" USING btree ("accession_number");