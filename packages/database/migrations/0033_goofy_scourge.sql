CREATE TABLE "clinical"."biomedical_asset_transfers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"partner_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"branch_id" uuid NOT NULL,
	"asset_id" uuid NOT NULL,
	"asset_code" varchar(64) NOT NULL,
	"asset_name" varchar(255) NOT NULL,
	"from_department" varchar(128) NOT NULL,
	"from_location" varchar(255) NOT NULL,
	"to_department" varchar(128) NOT NULL,
	"to_location" varchar(255) NOT NULL,
	"transfer_reason" text NOT NULL,
	"initiated_by" varchar(128) NOT NULL,
	"approved_by" varchar(128) NOT NULL,
	"transfer_date" varchar(32) NOT NULL,
	"status" varchar(32) DEFAULT 'COMPLETED' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clinical"."biomedical_assets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"partner_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"branch_id" uuid NOT NULL,
	"asset_code" varchar(64) NOT NULL,
	"asset_name" varchar(255) NOT NULL,
	"model_number" varchar(128) NOT NULL,
	"serial_number" varchar(128) NOT NULL,
	"manufacturer" varchar(128) NOT NULL,
	"category" varchar(64) NOT NULL,
	"risk_criticality" varchar(64) NOT NULL,
	"operational_status" varchar(64) DEFAULT 'IN_SERVICE' NOT NULL,
	"department_name" varchar(128) NOT NULL,
	"physical_location" varchar(255) NOT NULL,
	"installation_date" varchar(32) NOT NULL,
	"purchase_date" varchar(32) NOT NULL,
	"purchase_cost" numeric(12, 2) NOT NULL,
	"current_value" numeric(12, 2) NOT NULL,
	"warranty_expiry_date" varchar(32),
	"contract_type" varchar(64) DEFAULT 'WARRANTY_OEM' NOT NULL,
	"contract_vendor_name" varchar(255) NOT NULL,
	"contract_expiry_date" varchar(32),
	"ppm_frequency" varchar(64) DEFAULT 'QUARTERLY' NOT NULL,
	"last_ppm_date" varchar(32),
	"next_ppm_due_date" varchar(32) NOT NULL,
	"calibration_frequency_months" integer DEFAULT 12 NOT NULL,
	"last_calibration_date" varchar(32),
	"next_calibration_due_date" varchar(32) NOT NULL,
	"calibration_status" varchar(64) DEFAULT 'CALIBRATED_PASS' NOT NULL,
	"electrical_safety_certified" boolean DEFAULT true NOT NULL,
	"qr_code_identifier" varchar(128) NOT NULL,
	"responsible_biomedical_engineer" varchar(128) NOT NULL,
	"uptime_percentage" numeric(5, 2) DEFAULT '99.50' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clinical"."biomedical_audit_traces" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"partner_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"branch_id" uuid NOT NULL,
	"trace_number" varchar(64) NOT NULL,
	"action" varchar(64) NOT NULL,
	"entity_type" varchar(64) NOT NULL,
	"entity_id" uuid NOT NULL,
	"entity_code" varchar(64) NOT NULL,
	"actor_name" varchar(128) NOT NULL,
	"actor_role" varchar(64) NOT NULL,
	"justification" text NOT NULL,
	"integrity_hash" varchar(128) NOT NULL,
	"timestamp" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clinical"."biomedical_calibration_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"partner_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"branch_id" uuid NOT NULL,
	"certificate_number" varchar(64) NOT NULL,
	"asset_id" uuid NOT NULL,
	"asset_code" varchar(64) NOT NULL,
	"asset_name" varchar(255) NOT NULL,
	"calibration_date" varchar(32) NOT NULL,
	"valid_until_date" varchar(32) NOT NULL,
	"calibrated_by_agency" varchar(128) NOT NULL,
	"lead_metrologist_name" varchar(128) NOT NULL,
	"traceable_standards_used" text NOT NULL,
	"tolerances_observed" text NOT NULL,
	"status" varchar(64) DEFAULT 'CALIBRATED_PASS' NOT NULL,
	"safety_test_passed" boolean DEFAULT true NOT NULL,
	"certificate_url" varchar(512),
	"remarks" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clinical"."biomedical_condemnations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"partner_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"branch_id" uuid NOT NULL,
	"condemnation_code" varchar(64) NOT NULL,
	"asset_id" uuid NOT NULL,
	"asset_code" varchar(64) NOT NULL,
	"asset_name" varchar(255) NOT NULL,
	"department_name" varchar(128) NOT NULL,
	"purchase_year" varchar(16) NOT NULL,
	"cumulative_maintenance_cost" numeric(12, 2) NOT NULL,
	"reason_for_condemnation" text NOT NULL,
	"condemnation_board_chairman" varchar(128) NOT NULL,
	"estimated_scrap_value" numeric(10, 2) NOT NULL,
	"hazardous_disposal_protocol" text,
	"status" varchar(64) DEFAULT 'PROPOSED' NOT NULL,
	"approved_date" varchar(32),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clinical"."biomedical_incidents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"partner_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"branch_id" uuid NOT NULL,
	"incident_code" varchar(64) NOT NULL,
	"asset_id" uuid NOT NULL,
	"asset_code" varchar(64) NOT NULL,
	"asset_name" varchar(255) NOT NULL,
	"department_name" varchar(128) NOT NULL,
	"incident_date_time" timestamp with time zone NOT NULL,
	"severity" varchar(64) NOT NULL,
	"patient_involved" boolean DEFAULT false NOT NULL,
	"patient_mrn" varchar(64),
	"incident_summary" text NOT NULL,
	"initial_action_taken" text NOT NULL,
	"investigating_officer" varchar(128) NOT NULL,
	"root_cause" text,
	"capa_action_plan" text,
	"is_resolved" boolean DEFAULT false NOT NULL,
	"resolved_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clinical"."biomedical_ppm_schedules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"partner_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"branch_id" uuid NOT NULL,
	"schedule_code" varchar(64) NOT NULL,
	"asset_id" uuid NOT NULL,
	"asset_code" varchar(64) NOT NULL,
	"asset_name" varchar(255) NOT NULL,
	"department_name" varchar(128) NOT NULL,
	"frequency" varchar(64) NOT NULL,
	"scheduled_due_date" varchar(32) NOT NULL,
	"assigned_engineer" varchar(128) NOT NULL,
	"tasks_checklist" jsonb NOT NULL,
	"status" varchar(64) DEFAULT 'SCHEDULED' NOT NULL,
	"completed_date" varchar(32),
	"servicing_notes" text,
	"parts_replaced" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clinical"."biomedical_procurement_references" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"partner_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"branch_id" uuid NOT NULL,
	"requisition_ref_number" varchar(64) NOT NULL,
	"part_name" varchar(255) NOT NULL,
	"quantity_requested" integer NOT NULL,
	"urgency" varchar(32) DEFAULT 'ROUTINE' NOT NULL,
	"vendor_ref" varchar(255),
	"requested_by" varchar(128) NOT NULL,
	"status" varchar(32) DEFAULT 'SUBMITTED_TO_PURCHASING' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clinical"."biomedical_safety_test_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"partner_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"branch_id" uuid NOT NULL,
	"test_code" varchar(64) NOT NULL,
	"asset_id" uuid NOT NULL,
	"asset_code" varchar(64) NOT NULL,
	"asset_name" varchar(255) NOT NULL,
	"test_type" varchar(64) NOT NULL,
	"test_standard" varchar(64) NOT NULL,
	"earth_resistance_ohms" numeric(6, 3),
	"chassis_leakage_micro_amps" numeric(8, 2),
	"patient_leakage_micro_amps" numeric(8, 2),
	"insulation_resistance_m_ohm" numeric(8, 2),
	"tested_by_engineer" varchar(128) NOT NULL,
	"test_date" varchar(32) NOT NULL,
	"test_passed" boolean DEFAULT true NOT NULL,
	"remarks" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clinical"."biomedical_spare_part_usages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"partner_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"branch_id" uuid NOT NULL,
	"usage_code" varchar(64) NOT NULL,
	"work_order_id" uuid,
	"asset_id" uuid NOT NULL,
	"asset_code" varchar(64) NOT NULL,
	"part_id" uuid NOT NULL,
	"part_code" varchar(64) NOT NULL,
	"part_name" varchar(255) NOT NULL,
	"quantity_used" integer NOT NULL,
	"unit_cost" numeric(10, 2) NOT NULL,
	"total_cost" numeric(10, 2) NOT NULL,
	"used_by_engineer" varchar(128) NOT NULL,
	"usage_date" varchar(32) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clinical"."biomedical_spare_parts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"partner_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"branch_id" uuid NOT NULL,
	"part_code" varchar(64) NOT NULL,
	"part_name" varchar(255) NOT NULL,
	"compatible_models" jsonb NOT NULL,
	"manufacturer" varchar(128) NOT NULL,
	"quantity_on_hand" integer DEFAULT 0 NOT NULL,
	"minimum_threshold_quantity" integer DEFAULT 2 NOT NULL,
	"unit_cost" numeric(10, 2) NOT NULL,
	"storage_bin_location" varchar(64) NOT NULL,
	"is_critical_spare" boolean DEFAULT false NOT NULL,
	"lead_time_days" integer DEFAULT 7 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clinical"."biomedical_vendor_visits" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"partner_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"branch_id" uuid NOT NULL,
	"visit_code" varchar(64) NOT NULL,
	"asset_id" uuid NOT NULL,
	"asset_code" varchar(64) NOT NULL,
	"asset_name" varchar(255) NOT NULL,
	"vendor_name" varchar(255) NOT NULL,
	"service_engineer_name" varchar(128) NOT NULL,
	"contact_phone" varchar(32) NOT NULL,
	"visit_type" varchar(64) NOT NULL,
	"visit_date" varchar(32) NOT NULL,
	"service_report_number" varchar(64) NOT NULL,
	"service_summary" text NOT NULL,
	"service_cost" numeric(10, 2) DEFAULT '0' NOT NULL,
	"vendor_performance_rating" integer DEFAULT 5 NOT NULL,
	"hospital_supervisor_name" varchar(128) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clinical"."biomedical_work_orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"partner_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"branch_id" uuid NOT NULL,
	"work_order_number" varchar(64) NOT NULL,
	"asset_id" uuid NOT NULL,
	"asset_code" varchar(64) NOT NULL,
	"asset_name" varchar(255) NOT NULL,
	"department_name" varchar(128) NOT NULL,
	"room_bed_location" varchar(255) NOT NULL,
	"reported_by_clinician" varchar(128) NOT NULL,
	"reported_time" timestamp with time zone NOT NULL,
	"problem_description" text NOT NULL,
	"priority" varchar(64) DEFAULT 'ROUTINE' NOT NULL,
	"status" varchar(64) DEFAULT 'OPEN_REPORTED' NOT NULL,
	"assigned_engineer" varchar(128),
	"assigned_time" timestamp with time zone,
	"clinical_impact_level" varchar(64) NOT NULL,
	"root_cause_analysis" text,
	"corrective_action_taken" text,
	"spare_parts_cost" numeric(10, 2) DEFAULT '0' NOT NULL,
	"labor_hours" numeric(5, 2) DEFAULT '0' NOT NULL,
	"downtime_hours" numeric(6, 2) DEFAULT '0' NOT NULL,
	"completed_at" timestamp with time zone,
	"verified_by_clinician_name" varchar(128),
	"verified_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "idx_bat_tenant_asset" ON "clinical"."biomedical_asset_transfers" USING btree ("tenant_id","asset_id");--> statement-breakpoint
CREATE INDEX "idx_bma_tenant_branch" ON "clinical"."biomedical_assets" USING btree ("tenant_id","branch_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_bma_code" ON "clinical"."biomedical_assets" USING btree ("tenant_id","asset_code");--> statement-breakpoint
CREATE INDEX "idx_bmat_tenant_branch" ON "clinical"."biomedical_audit_traces" USING btree ("tenant_id","branch_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_bmat_num" ON "clinical"."biomedical_audit_traces" USING btree ("tenant_id","trace_number");--> statement-breakpoint
CREATE INDEX "idx_bcr_tenant_asset" ON "clinical"."biomedical_calibration_records" USING btree ("tenant_id","asset_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_bcr_cert" ON "clinical"."biomedical_calibration_records" USING btree ("tenant_id","certificate_number");--> statement-breakpoint
CREATE INDEX "idx_bmc_tenant_asset" ON "clinical"."biomedical_condemnations" USING btree ("tenant_id","asset_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_bmc_code" ON "clinical"."biomedical_condemnations" USING btree ("tenant_id","condemnation_code");--> statement-breakpoint
CREATE INDEX "idx_bmi_tenant_asset" ON "clinical"."biomedical_incidents" USING btree ("tenant_id","asset_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_bmi_code" ON "clinical"."biomedical_incidents" USING btree ("tenant_id","incident_code");--> statement-breakpoint
CREATE INDEX "idx_bps_tenant_asset" ON "clinical"."biomedical_ppm_schedules" USING btree ("tenant_id","asset_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_bps_code" ON "clinical"."biomedical_ppm_schedules" USING btree ("tenant_id","schedule_code");--> statement-breakpoint
CREATE INDEX "idx_bmpr_tenant_branch" ON "clinical"."biomedical_procurement_references" USING btree ("tenant_id","branch_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_bmpr_num" ON "clinical"."biomedical_procurement_references" USING btree ("tenant_id","requisition_ref_number");--> statement-breakpoint
CREATE INDEX "idx_bstr_tenant_asset" ON "clinical"."biomedical_safety_test_records" USING btree ("tenant_id","asset_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_bstr_code" ON "clinical"."biomedical_safety_test_records" USING btree ("tenant_id","test_code");--> statement-breakpoint
CREATE INDEX "idx_bspu_tenant_asset" ON "clinical"."biomedical_spare_part_usages" USING btree ("tenant_id","asset_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_bspu_code" ON "clinical"."biomedical_spare_part_usages" USING btree ("tenant_id","usage_code");--> statement-breakpoint
CREATE INDEX "idx_bsp_tenant_branch" ON "clinical"."biomedical_spare_parts" USING btree ("tenant_id","branch_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_bsp_code" ON "clinical"."biomedical_spare_parts" USING btree ("tenant_id","part_code");--> statement-breakpoint
CREATE INDEX "idx_bvv_tenant_asset" ON "clinical"."biomedical_vendor_visits" USING btree ("tenant_id","asset_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_bvv_code" ON "clinical"."biomedical_vendor_visits" USING btree ("tenant_id","visit_code");--> statement-breakpoint
CREATE INDEX "idx_bwo_tenant_asset" ON "clinical"."biomedical_work_orders" USING btree ("tenant_id","asset_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_bwo_num" ON "clinical"."biomedical_work_orders" USING btree ("tenant_id","work_order_number");