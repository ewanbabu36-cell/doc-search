CREATE TABLE "clinical"."consultation_fee_matrices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"partner_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"branch_id" uuid,
	"doctor_id" uuid,
	"specialty_code" varchar(100),
	"consultation_type" varchar(50) DEFAULT 'NEW_PATIENT' NOT NULL,
	"currency" varchar(10) DEFAULT 'USD' NOT NULL,
	"base_fee_amount" numeric(10, 2) NOT NULL,
	"follow_up_validity_days" integer DEFAULT 14 NOT NULL,
	"effective_date" timestamp with time zone NOT NULL,
	"expiry_date" timestamp with time zone,
	"status" varchar(50) DEFAULT 'ACTIVE' NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clinical"."doctor_leaves" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"partner_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"branch_id" uuid,
	"doctor_id" uuid NOT NULL,
	"leave_type" varchar(50) DEFAULT 'PLANNED_LEAVE' NOT NULL,
	"start_date" timestamp with time zone NOT NULL,
	"end_date" timestamp with time zone NOT NULL,
	"reason" text NOT NULL,
	"approval_status" varchar(50) DEFAULT 'APPROVED' NOT NULL,
	"approved_by" varchar(100),
	"affected_slots_count" integer DEFAULT 0 NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clinical"."doctor_opd_audit_traces" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"trace_id" varchar(100) NOT NULL,
	"tenant_id" uuid NOT NULL,
	"partner_id" uuid NOT NULL,
	"organization_id" uuid,
	"branch_id" uuid,
	"doctor_id" uuid,
	"actor_id" varchar(100) NOT NULL,
	"actor_role" varchar(50) NOT NULL,
	"action" varchar(100) NOT NULL,
	"target_entity" varchar(100) NOT NULL,
	"target_entity_id" varchar(100) NOT NULL,
	"justification" text NOT NULL,
	"operation_status" varchar(50) DEFAULT 'SUCCESS' NOT NULL,
	"correlation_id" varchar(100) NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "doctor_opd_audit_traces_trace_id_unique" UNIQUE("trace_id")
);
--> statement-breakpoint
CREATE TABLE "clinical"."doctor_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"partner_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"branch_id" uuid NOT NULL,
	"department_id" uuid NOT NULL,
	"staff_id" uuid NOT NULL,
	"doctor_code" varchar(100) NOT NULL,
	"medical_license_number" varchar(100) NOT NULL,
	"qualification" varchar(255) NOT NULL,
	"experience_years" integer DEFAULT 0 NOT NULL,
	"primary_specialty" varchar(100) NOT NULL,
	"sub_specialties" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"consultation_modes" jsonb DEFAULT '["IN_PERSON"]'::jsonb NOT NULL,
	"telehealth_eligible" varchar(10) DEFAULT 'TRUE' NOT NULL,
	"bio_summary" text,
	"availability_status" varchar(50) DEFAULT 'AVAILABLE' NOT NULL,
	"status" varchar(50) DEFAULT 'ACTIVE' NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "doctor_profiles_doctor_code_unique" UNIQUE("doctor_code")
);
--> statement-breakpoint
CREATE TABLE "clinical"."doctor_schedule_breaks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"partner_id" uuid NOT NULL,
	"schedule_id" uuid NOT NULL,
	"break_name" varchar(100) DEFAULT 'LUNCH_BREAK' NOT NULL,
	"start_time" varchar(10) NOT NULL,
	"end_time" varchar(10) NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clinical"."doctor_schedules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"partner_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"branch_id" uuid NOT NULL,
	"doctor_id" uuid NOT NULL,
	"day_of_week" varchar(20) NOT NULL,
	"shift_name" varchar(100) DEFAULT 'MORNING_OPD' NOT NULL,
	"start_time" varchar(10) NOT NULL,
	"end_time" varchar(10) NOT NULL,
	"slot_duration_minutes" integer DEFAULT 15 NOT NULL,
	"max_patients_per_slot" integer DEFAULT 1 NOT NULL,
	"buffer_time_minutes" integer DEFAULT 0 NOT NULL,
	"consultation_mode" varchar(50) DEFAULT 'IN_PERSON' NOT NULL,
	"room_number" varchar(50),
	"is_active" varchar(10) DEFAULT 'TRUE' NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clinical"."doctor_specializations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"partner_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"department_id" uuid NOT NULL,
	"specialty_code" varchar(100) NOT NULL,
	"specialty_name" varchar(255) NOT NULL,
	"is_surgical" varchar(10) DEFAULT 'FALSE' NOT NULL,
	"opd_config" jsonb DEFAULT '{"defaultSlotDuration":15,"maxDailyPatients":30}'::jsonb NOT NULL,
	"status" varchar(50) DEFAULT 'ACTIVE' NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "doctor_specializations_specialty_code_unique" UNIQUE("specialty_code")
);
--> statement-breakpoint
CREATE TABLE "clinical"."opd_slots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"partner_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"branch_id" uuid NOT NULL,
	"doctor_id" uuid NOT NULL,
	"schedule_id" uuid NOT NULL,
	"slot_date" varchar(20) NOT NULL,
	"start_time" varchar(10) NOT NULL,
	"end_time" varchar(10) NOT NULL,
	"consultation_mode" varchar(50) DEFAULT 'IN_PERSON' NOT NULL,
	"booking_status" varchar(50) DEFAULT 'AVAILABLE' NOT NULL,
	"block_reason" text,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "clinical"."consultation_fee_matrices" ADD CONSTRAINT "consultation_fee_matrices_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "core"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."consultation_fee_matrices" ADD CONSTRAINT "consultation_fee_matrices_partner_id_operational_partners_id_fk" FOREIGN KEY ("partner_id") REFERENCES "clinical"."operational_partners"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."consultation_fee_matrices" ADD CONSTRAINT "consultation_fee_matrices_organization_id_operational_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "clinical"."operational_organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."consultation_fee_matrices" ADD CONSTRAINT "consultation_fee_matrices_branch_id_operational_facilities_id_fk" FOREIGN KEY ("branch_id") REFERENCES "clinical"."operational_facilities"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."consultation_fee_matrices" ADD CONSTRAINT "consultation_fee_matrices_doctor_id_doctor_profiles_id_fk" FOREIGN KEY ("doctor_id") REFERENCES "clinical"."doctor_profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."doctor_leaves" ADD CONSTRAINT "doctor_leaves_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "core"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."doctor_leaves" ADD CONSTRAINT "doctor_leaves_partner_id_operational_partners_id_fk" FOREIGN KEY ("partner_id") REFERENCES "clinical"."operational_partners"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."doctor_leaves" ADD CONSTRAINT "doctor_leaves_organization_id_operational_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "clinical"."operational_organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."doctor_leaves" ADD CONSTRAINT "doctor_leaves_branch_id_operational_facilities_id_fk" FOREIGN KEY ("branch_id") REFERENCES "clinical"."operational_facilities"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."doctor_leaves" ADD CONSTRAINT "doctor_leaves_doctor_id_doctor_profiles_id_fk" FOREIGN KEY ("doctor_id") REFERENCES "clinical"."doctor_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."doctor_opd_audit_traces" ADD CONSTRAINT "doctor_opd_audit_traces_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "core"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."doctor_opd_audit_traces" ADD CONSTRAINT "doctor_opd_audit_traces_partner_id_operational_partners_id_fk" FOREIGN KEY ("partner_id") REFERENCES "clinical"."operational_partners"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."doctor_opd_audit_traces" ADD CONSTRAINT "doctor_opd_audit_traces_organization_id_operational_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "clinical"."operational_organizations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."doctor_opd_audit_traces" ADD CONSTRAINT "doctor_opd_audit_traces_branch_id_operational_facilities_id_fk" FOREIGN KEY ("branch_id") REFERENCES "clinical"."operational_facilities"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."doctor_opd_audit_traces" ADD CONSTRAINT "doctor_opd_audit_traces_doctor_id_doctor_profiles_id_fk" FOREIGN KEY ("doctor_id") REFERENCES "clinical"."doctor_profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."doctor_profiles" ADD CONSTRAINT "doctor_profiles_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "core"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."doctor_profiles" ADD CONSTRAINT "doctor_profiles_partner_id_operational_partners_id_fk" FOREIGN KEY ("partner_id") REFERENCES "clinical"."operational_partners"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."doctor_profiles" ADD CONSTRAINT "doctor_profiles_organization_id_operational_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "clinical"."operational_organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."doctor_profiles" ADD CONSTRAINT "doctor_profiles_branch_id_operational_facilities_id_fk" FOREIGN KEY ("branch_id") REFERENCES "clinical"."operational_facilities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."doctor_profiles" ADD CONSTRAINT "doctor_profiles_department_id_operational_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "clinical"."operational_departments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."doctor_profiles" ADD CONSTRAINT "doctor_profiles_staff_id_operational_staff_id_fk" FOREIGN KEY ("staff_id") REFERENCES "clinical"."operational_staff"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."doctor_schedule_breaks" ADD CONSTRAINT "doctor_schedule_breaks_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "core"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."doctor_schedule_breaks" ADD CONSTRAINT "doctor_schedule_breaks_partner_id_operational_partners_id_fk" FOREIGN KEY ("partner_id") REFERENCES "clinical"."operational_partners"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."doctor_schedule_breaks" ADD CONSTRAINT "doctor_schedule_breaks_schedule_id_doctor_schedules_id_fk" FOREIGN KEY ("schedule_id") REFERENCES "clinical"."doctor_schedules"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."doctor_schedules" ADD CONSTRAINT "doctor_schedules_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "core"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."doctor_schedules" ADD CONSTRAINT "doctor_schedules_partner_id_operational_partners_id_fk" FOREIGN KEY ("partner_id") REFERENCES "clinical"."operational_partners"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."doctor_schedules" ADD CONSTRAINT "doctor_schedules_organization_id_operational_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "clinical"."operational_organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."doctor_schedules" ADD CONSTRAINT "doctor_schedules_branch_id_operational_facilities_id_fk" FOREIGN KEY ("branch_id") REFERENCES "clinical"."operational_facilities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."doctor_schedules" ADD CONSTRAINT "doctor_schedules_doctor_id_doctor_profiles_id_fk" FOREIGN KEY ("doctor_id") REFERENCES "clinical"."doctor_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."doctor_specializations" ADD CONSTRAINT "doctor_specializations_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "core"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."doctor_specializations" ADD CONSTRAINT "doctor_specializations_partner_id_operational_partners_id_fk" FOREIGN KEY ("partner_id") REFERENCES "clinical"."operational_partners"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."doctor_specializations" ADD CONSTRAINT "doctor_specializations_organization_id_operational_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "clinical"."operational_organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."doctor_specializations" ADD CONSTRAINT "doctor_specializations_department_id_operational_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "clinical"."operational_departments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."opd_slots" ADD CONSTRAINT "opd_slots_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "core"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."opd_slots" ADD CONSTRAINT "opd_slots_partner_id_operational_partners_id_fk" FOREIGN KEY ("partner_id") REFERENCES "clinical"."operational_partners"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."opd_slots" ADD CONSTRAINT "opd_slots_organization_id_operational_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "clinical"."operational_organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."opd_slots" ADD CONSTRAINT "opd_slots_branch_id_operational_facilities_id_fk" FOREIGN KEY ("branch_id") REFERENCES "clinical"."operational_facilities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."opd_slots" ADD CONSTRAINT "opd_slots_doctor_id_doctor_profiles_id_fk" FOREIGN KEY ("doctor_id") REFERENCES "clinical"."doctor_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."opd_slots" ADD CONSTRAINT "opd_slots_schedule_id_doctor_schedules_id_fk" FOREIGN KEY ("schedule_id") REFERENCES "clinical"."doctor_schedules"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_fee_mat_tenant" ON "clinical"."consultation_fee_matrices" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_fee_mat_org" ON "clinical"."consultation_fee_matrices" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_fee_mat_doc" ON "clinical"."consultation_fee_matrices" USING btree ("doctor_id");--> statement-breakpoint
CREATE INDEX "idx_fee_mat_type" ON "clinical"."consultation_fee_matrices" USING btree ("consultation_type");--> statement-breakpoint
CREATE INDEX "idx_fee_mat_status" ON "clinical"."consultation_fee_matrices" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_doc_leave_tenant" ON "clinical"."doctor_leaves" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_doc_leave_doc" ON "clinical"."doctor_leaves" USING btree ("doctor_id");--> statement-breakpoint
CREATE INDEX "idx_doc_leave_status" ON "clinical"."doctor_leaves" USING btree ("approval_status");--> statement-breakpoint
CREATE INDEX "idx_doc_leave_dates" ON "clinical"."doctor_leaves" USING btree ("start_date","end_date");--> statement-breakpoint
CREATE INDEX "idx_doc_opd_audit_tenant" ON "clinical"."doctor_opd_audit_traces" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_doc_opd_audit_partner" ON "clinical"."doctor_opd_audit_traces" USING btree ("partner_id");--> statement-breakpoint
CREATE INDEX "idx_doc_opd_audit_org" ON "clinical"."doctor_opd_audit_traces" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_doc_opd_audit_doc" ON "clinical"."doctor_opd_audit_traces" USING btree ("doctor_id");--> statement-breakpoint
CREATE INDEX "idx_doc_opd_audit_status" ON "clinical"."doctor_opd_audit_traces" USING btree ("operation_status");--> statement-breakpoint
CREATE INDEX "idx_doc_opd_audit_occurred" ON "clinical"."doctor_opd_audit_traces" USING btree ("occurred_at");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_doc_prof_staff" ON "clinical"."doctor_profiles" USING btree ("staff_id");--> statement-breakpoint
CREATE INDEX "idx_doc_prof_tenant" ON "clinical"."doctor_profiles" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_doc_prof_org" ON "clinical"."doctor_profiles" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_doc_prof_branch" ON "clinical"."doctor_profiles" USING btree ("branch_id");--> statement-breakpoint
CREATE INDEX "idx_doc_prof_dept" ON "clinical"."doctor_profiles" USING btree ("department_id");--> statement-breakpoint
CREATE INDEX "idx_doc_prof_specialty" ON "clinical"."doctor_profiles" USING btree ("primary_specialty");--> statement-breakpoint
CREATE INDEX "idx_doc_prof_status" ON "clinical"."doctor_profiles" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_doc_sched_brk_tenant" ON "clinical"."doctor_schedule_breaks" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_doc_sched_brk_sched" ON "clinical"."doctor_schedule_breaks" USING btree ("schedule_id");--> statement-breakpoint
CREATE INDEX "idx_doc_sched_tenant" ON "clinical"."doctor_schedules" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_doc_sched_doc" ON "clinical"."doctor_schedules" USING btree ("doctor_id");--> statement-breakpoint
CREATE INDEX "idx_doc_sched_branch" ON "clinical"."doctor_schedules" USING btree ("branch_id");--> statement-breakpoint
CREATE INDEX "idx_doc_sched_day" ON "clinical"."doctor_schedules" USING btree ("day_of_week");--> statement-breakpoint
CREATE INDEX "idx_doc_spec_tenant" ON "clinical"."doctor_specializations" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_doc_spec_org" ON "clinical"."doctor_specializations" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_doc_spec_dept" ON "clinical"."doctor_specializations" USING btree ("department_id");--> statement-breakpoint
CREATE INDEX "idx_doc_spec_status" ON "clinical"."doctor_specializations" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_opd_slot_tenant" ON "clinical"."opd_slots" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_opd_slot_doc_date" ON "clinical"."opd_slots" USING btree ("doctor_id","slot_date");--> statement-breakpoint
CREATE INDEX "idx_opd_slot_branch" ON "clinical"."opd_slots" USING btree ("branch_id");--> statement-breakpoint
CREATE INDEX "idx_opd_slot_status" ON "clinical"."opd_slots" USING btree ("booking_status");