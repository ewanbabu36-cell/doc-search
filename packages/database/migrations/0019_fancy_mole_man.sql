CREATE TABLE "clinical"."encounter_audit_traces" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"trace_id" varchar(100) NOT NULL,
	"tenant_id" uuid NOT NULL,
	"partner_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"branch_id" uuid,
	"encounter_id" uuid,
	"patient_id" uuid,
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
	CONSTRAINT "encounter_audit_traces_trace_id_unique" UNIQUE("trace_id")
);
--> statement-breakpoint
CREATE TABLE "clinical"."encounter_queues" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"partner_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"branch_id" uuid NOT NULL,
	"department_id" uuid NOT NULL,
	"doctor_id" uuid,
	"encounter_id" uuid NOT NULL,
	"token_number" varchar(50) NOT NULL,
	"queue_date" varchar(50) NOT NULL,
	"queue_status" varchar(50) DEFAULT 'WAITING' NOT NULL,
	"estimated_wait_minutes" integer DEFAULT 15 NOT NULL,
	"called_at" timestamp with time zone,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clinical"."encounter_referrals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"partner_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"encounter_id" uuid NOT NULL,
	"patient_id" uuid NOT NULL,
	"referral_type" varchar(50) DEFAULT 'INTERNAL_SPECIALIST' NOT NULL,
	"referring_doctor_id" uuid,
	"destination_department_id" uuid,
	"destination_doctor_id" uuid,
	"destination_facility_name" varchar(255),
	"clinical_summary" text NOT NULL,
	"urgency" varchar(50) DEFAULT 'ROUTINE' NOT NULL,
	"referral_status" varchar(50) DEFAULT 'PENDING' NOT NULL,
	"referred_at" timestamp with time zone DEFAULT now() NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clinical"."encounters" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"partner_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"branch_id" uuid NOT NULL,
	"department_id" uuid NOT NULL,
	"patient_id" uuid NOT NULL,
	"doctor_id" uuid,
	"opd_slot_id" uuid,
	"encounter_number" varchar(100) NOT NULL,
	"encounter_type" varchar(50) DEFAULT 'OPD' NOT NULL,
	"status" varchar(50) DEFAULT 'REGISTERED' NOT NULL,
	"priority" varchar(50) DEFAULT 'ROUTINE' NOT NULL,
	"consultation_mode" varchar(50) DEFAULT 'PHYSICAL' NOT NULL,
	"chief_complaint" text NOT NULL,
	"visit_reason" text,
	"triage_notes" text,
	"referral_source" varchar(255),
	"registered_at" timestamp with time zone DEFAULT now() NOT NULL,
	"checked_in_at" timestamp with time zone,
	"consultation_started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"cancelled_at" timestamp with time zone,
	"cancellation_reason" text,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "clinical"."encounter_audit_traces" ADD CONSTRAINT "encounter_audit_traces_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "core"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."encounter_audit_traces" ADD CONSTRAINT "encounter_audit_traces_partner_id_operational_partners_id_fk" FOREIGN KEY ("partner_id") REFERENCES "clinical"."operational_partners"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."encounter_audit_traces" ADD CONSTRAINT "encounter_audit_traces_organization_id_operational_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "clinical"."operational_organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."encounter_audit_traces" ADD CONSTRAINT "encounter_audit_traces_branch_id_operational_facilities_id_fk" FOREIGN KEY ("branch_id") REFERENCES "clinical"."operational_facilities"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."encounter_queues" ADD CONSTRAINT "encounter_queues_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "core"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."encounter_queues" ADD CONSTRAINT "encounter_queues_partner_id_operational_partners_id_fk" FOREIGN KEY ("partner_id") REFERENCES "clinical"."operational_partners"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."encounter_queues" ADD CONSTRAINT "encounter_queues_organization_id_operational_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "clinical"."operational_organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."encounter_queues" ADD CONSTRAINT "encounter_queues_branch_id_operational_facilities_id_fk" FOREIGN KEY ("branch_id") REFERENCES "clinical"."operational_facilities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."encounter_queues" ADD CONSTRAINT "encounter_queues_department_id_operational_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "clinical"."operational_departments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."encounter_queues" ADD CONSTRAINT "encounter_queues_doctor_id_doctor_profiles_id_fk" FOREIGN KEY ("doctor_id") REFERENCES "clinical"."doctor_profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."encounter_queues" ADD CONSTRAINT "encounter_queues_encounter_id_encounters_id_fk" FOREIGN KEY ("encounter_id") REFERENCES "clinical"."encounters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."encounter_referrals" ADD CONSTRAINT "encounter_referrals_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "core"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."encounter_referrals" ADD CONSTRAINT "encounter_referrals_partner_id_operational_partners_id_fk" FOREIGN KEY ("partner_id") REFERENCES "clinical"."operational_partners"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."encounter_referrals" ADD CONSTRAINT "encounter_referrals_organization_id_operational_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "clinical"."operational_organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."encounter_referrals" ADD CONSTRAINT "encounter_referrals_encounter_id_encounters_id_fk" FOREIGN KEY ("encounter_id") REFERENCES "clinical"."encounters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."encounter_referrals" ADD CONSTRAINT "encounter_referrals_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "clinical"."patients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."encounter_referrals" ADD CONSTRAINT "encounter_referrals_referring_doctor_id_doctor_profiles_id_fk" FOREIGN KEY ("referring_doctor_id") REFERENCES "clinical"."doctor_profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."encounter_referrals" ADD CONSTRAINT "encounter_referrals_destination_department_id_operational_departments_id_fk" FOREIGN KEY ("destination_department_id") REFERENCES "clinical"."operational_departments"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."encounter_referrals" ADD CONSTRAINT "encounter_referrals_destination_doctor_id_doctor_profiles_id_fk" FOREIGN KEY ("destination_doctor_id") REFERENCES "clinical"."doctor_profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."encounters" ADD CONSTRAINT "encounters_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "core"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."encounters" ADD CONSTRAINT "encounters_partner_id_operational_partners_id_fk" FOREIGN KEY ("partner_id") REFERENCES "clinical"."operational_partners"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."encounters" ADD CONSTRAINT "encounters_organization_id_operational_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "clinical"."operational_organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."encounters" ADD CONSTRAINT "encounters_branch_id_operational_facilities_id_fk" FOREIGN KEY ("branch_id") REFERENCES "clinical"."operational_facilities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."encounters" ADD CONSTRAINT "encounters_department_id_operational_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "clinical"."operational_departments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."encounters" ADD CONSTRAINT "encounters_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "clinical"."patients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."encounters" ADD CONSTRAINT "encounters_doctor_id_doctor_profiles_id_fk" FOREIGN KEY ("doctor_id") REFERENCES "clinical"."doctor_profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."encounters" ADD CONSTRAINT "encounters_opd_slot_id_opd_slots_id_fk" FOREIGN KEY ("opd_slot_id") REFERENCES "clinical"."opd_slots"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_enc_audit_tenant" ON "clinical"."encounter_audit_traces" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_enc_audit_partner" ON "clinical"."encounter_audit_traces" USING btree ("partner_id");--> statement-breakpoint
CREATE INDEX "idx_enc_audit_org" ON "clinical"."encounter_audit_traces" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_enc_audit_enc" ON "clinical"."encounter_audit_traces" USING btree ("encounter_id");--> statement-breakpoint
CREATE INDEX "idx_enc_audit_patient" ON "clinical"."encounter_audit_traces" USING btree ("patient_id");--> statement-breakpoint
CREATE INDEX "idx_enc_audit_status" ON "clinical"."encounter_audit_traces" USING btree ("operation_status");--> statement-breakpoint
CREATE INDEX "idx_enc_audit_occurred" ON "clinical"."encounter_audit_traces" USING btree ("occurred_at");--> statement-breakpoint
CREATE INDEX "idx_enc_queue_tenant" ON "clinical"."encounter_queues" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_enc_queue_org" ON "clinical"."encounter_queues" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_enc_queue_branch" ON "clinical"."encounter_queues" USING btree ("branch_id");--> statement-breakpoint
CREATE INDEX "idx_enc_queue_dept" ON "clinical"."encounter_queues" USING btree ("department_id");--> statement-breakpoint
CREATE INDEX "idx_enc_queue_doc" ON "clinical"."encounter_queues" USING btree ("doctor_id");--> statement-breakpoint
CREATE INDEX "idx_enc_queue_status" ON "clinical"."encounter_queues" USING btree ("queue_status");--> statement-breakpoint
CREATE INDEX "idx_enc_queue_date" ON "clinical"."encounter_queues" USING btree ("queue_date");--> statement-breakpoint
CREATE INDEX "idx_enc_ref_tenant" ON "clinical"."encounter_referrals" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_enc_ref_enc" ON "clinical"."encounter_referrals" USING btree ("encounter_id");--> statement-breakpoint
CREATE INDEX "idx_enc_ref_patient" ON "clinical"."encounter_referrals" USING btree ("patient_id");--> statement-breakpoint
CREATE INDEX "idx_enc_ref_status" ON "clinical"."encounter_referrals" USING btree ("referral_status");--> statement-breakpoint
CREATE INDEX "idx_encounters_tenant" ON "clinical"."encounters" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_encounters_partner" ON "clinical"."encounters" USING btree ("partner_id");--> statement-breakpoint
CREATE INDEX "idx_encounters_org" ON "clinical"."encounters" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_encounters_branch" ON "clinical"."encounters" USING btree ("branch_id");--> statement-breakpoint
CREATE INDEX "idx_encounters_dept" ON "clinical"."encounters" USING btree ("department_id");--> statement-breakpoint
CREATE INDEX "idx_encounters_patient" ON "clinical"."encounters" USING btree ("patient_id");--> statement-breakpoint
CREATE INDEX "idx_encounters_doctor" ON "clinical"."encounters" USING btree ("doctor_id");--> statement-breakpoint
CREATE INDEX "idx_encounters_number" ON "clinical"."encounters" USING btree ("encounter_number");--> statement-breakpoint
CREATE INDEX "idx_encounters_status" ON "clinical"."encounters" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_encounters_registered" ON "clinical"."encounters" USING btree ("registered_at");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_encounters_tenant_number" ON "clinical"."encounters" USING btree ("tenant_id","encounter_number");