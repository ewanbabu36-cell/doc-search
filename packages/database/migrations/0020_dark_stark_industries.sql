CREATE TABLE "clinical"."consultation_audit_traces" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"trace_id" varchar(100) NOT NULL,
	"tenant_id" uuid NOT NULL,
	"partner_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"branch_id" uuid,
	"patient_id" uuid,
	"encounter_id" uuid,
	"consultation_id" uuid,
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
	CONSTRAINT "consultation_audit_traces_trace_id_unique" UNIQUE("trace_id")
);
--> statement-breakpoint
CREATE TABLE "clinical"."consultation_diagnoses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"partner_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"consultation_id" uuid NOT NULL,
	"patient_id" uuid NOT NULL,
	"diagnosis_code" varchar(50) NOT NULL,
	"diagnosis_name" varchar(255) NOT NULL,
	"diagnosis_type" varchar(50) DEFAULT 'PRIMARY' NOT NULL,
	"clinical_status" varchar(50) DEFAULT 'ACTIVE' NOT NULL,
	"certainty" varchar(50) DEFAULT 'CONFIRMED' NOT NULL,
	"is_primary" boolean DEFAULT false NOT NULL,
	"notes" text,
	"recorded_by" varchar(100) NOT NULL,
	"recorded_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clinical"."consultation_examinations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"partner_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"consultation_id" uuid NOT NULL,
	"general_appearance" text,
	"cardiovascular" text,
	"respiratory" text,
	"abdomen" text,
	"neurological" text,
	"musculoskeletal" text,
	"skin" text,
	"ent" text,
	"eyes" text,
	"other_findings" text,
	"free_text_findings" text,
	"examined_by" varchar(100) NOT NULL,
	"examined_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clinical"."consultation_followups" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"partner_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"consultation_id" uuid NOT NULL,
	"patient_id" uuid NOT NULL,
	"follow_up_required" boolean DEFAULT true NOT NULL,
	"recommended_date" varchar(50),
	"recommended_window" varchar(100),
	"reason" text NOT NULL,
	"notes" text,
	"status" varchar(50) DEFAULT 'PENDING' NOT NULL,
	"recorded_by" varchar(100) NOT NULL,
	"recorded_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clinical"."consultation_instructions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"partner_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"consultation_id" uuid NOT NULL,
	"patient_instruction" text,
	"diet_instruction" text,
	"activity_instruction" text,
	"warning_sign_instruction" text,
	"home_care_instruction" text,
	"follow_up_instruction" text,
	"instruction_priority" varchar(50) DEFAULT 'ROUTINE' NOT NULL,
	"recorded_by" varchar(100) NOT NULL,
	"recorded_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clinical"."consultation_medications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"partner_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"consultation_id" uuid NOT NULL,
	"patient_id" uuid NOT NULL,
	"medication_name" varchar(255) NOT NULL,
	"generic_name" varchar(255),
	"strength" varchar(100) NOT NULL,
	"dosage" varchar(100) NOT NULL,
	"route" varchar(50) DEFAULT 'ORAL' NOT NULL,
	"frequency" varchar(100) NOT NULL,
	"duration" integer NOT NULL,
	"duration_unit" varchar(50) DEFAULT 'DAYS' NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"instructions" text,
	"before_after_food" varchar(50) DEFAULT 'AFTER_FOOD' NOT NULL,
	"as_needed" boolean DEFAULT false NOT NULL,
	"indication" varchar(255),
	"status" varchar(50) DEFAULT 'ACTIVE' NOT NULL,
	"prescribed_by" varchar(100) NOT NULL,
	"prescribed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clinical"."consultation_vitals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"partner_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"consultation_id" uuid NOT NULL,
	"patient_id" uuid NOT NULL,
	"temperature_celsius" varchar(20),
	"pulse_bpm" integer,
	"respiratory_rate_bpm" integer,
	"systolic_bp" integer,
	"diastolic_bp" integer,
	"oxygen_saturation_percent" integer,
	"weight_kg" varchar(20),
	"height_cm" varchar(20),
	"bmi" varchar(20),
	"pain_score" integer,
	"clinical_notes" text,
	"recorded_by" varchar(100) NOT NULL,
	"recorded_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clinical"."consultations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"partner_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"branch_id" uuid NOT NULL,
	"patient_id" uuid NOT NULL,
	"encounter_id" uuid NOT NULL,
	"doctor_id" uuid NOT NULL,
	"consultation_number" varchar(100) NOT NULL,
	"consultation_status" varchar(50) DEFAULT 'DRAFT' NOT NULL,
	"consultation_type" varchar(50) DEFAULT 'OPD_CONSULTATION' NOT NULL,
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"chief_complaint" text NOT NULL,
	"history_of_present_illness" text,
	"medical_history" text,
	"surgical_history" text,
	"family_history" text,
	"social_history" text,
	"allergy_summary" text,
	"medication_history" text,
	"examination_summary" text,
	"clinical_assessment" text,
	"treatment_plan" text,
	"patient_instructions" text,
	"follow_up_required" boolean DEFAULT false NOT NULL,
	"follow_up_notes" text,
	"version" integer DEFAULT 1 NOT NULL,
	"is_amended" boolean DEFAULT false NOT NULL,
	"amendment_reason" text,
	"created_by" varchar(100) NOT NULL,
	"updated_by" varchar(100) NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "clinical"."consultation_audit_traces" ADD CONSTRAINT "consultation_audit_traces_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "core"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."consultation_audit_traces" ADD CONSTRAINT "consultation_audit_traces_partner_id_operational_partners_id_fk" FOREIGN KEY ("partner_id") REFERENCES "clinical"."operational_partners"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."consultation_audit_traces" ADD CONSTRAINT "consultation_audit_traces_organization_id_operational_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "clinical"."operational_organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."consultation_audit_traces" ADD CONSTRAINT "consultation_audit_traces_branch_id_operational_facilities_id_fk" FOREIGN KEY ("branch_id") REFERENCES "clinical"."operational_facilities"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."consultation_diagnoses" ADD CONSTRAINT "consultation_diagnoses_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "core"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."consultation_diagnoses" ADD CONSTRAINT "consultation_diagnoses_partner_id_operational_partners_id_fk" FOREIGN KEY ("partner_id") REFERENCES "clinical"."operational_partners"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."consultation_diagnoses" ADD CONSTRAINT "consultation_diagnoses_organization_id_operational_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "clinical"."operational_organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."consultation_diagnoses" ADD CONSTRAINT "consultation_diagnoses_consultation_id_consultations_id_fk" FOREIGN KEY ("consultation_id") REFERENCES "clinical"."consultations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."consultation_diagnoses" ADD CONSTRAINT "consultation_diagnoses_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "clinical"."patients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."consultation_examinations" ADD CONSTRAINT "consultation_examinations_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "core"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."consultation_examinations" ADD CONSTRAINT "consultation_examinations_partner_id_operational_partners_id_fk" FOREIGN KEY ("partner_id") REFERENCES "clinical"."operational_partners"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."consultation_examinations" ADD CONSTRAINT "consultation_examinations_organization_id_operational_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "clinical"."operational_organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."consultation_examinations" ADD CONSTRAINT "consultation_examinations_consultation_id_consultations_id_fk" FOREIGN KEY ("consultation_id") REFERENCES "clinical"."consultations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."consultation_followups" ADD CONSTRAINT "consultation_followups_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "core"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."consultation_followups" ADD CONSTRAINT "consultation_followups_partner_id_operational_partners_id_fk" FOREIGN KEY ("partner_id") REFERENCES "clinical"."operational_partners"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."consultation_followups" ADD CONSTRAINT "consultation_followups_organization_id_operational_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "clinical"."operational_organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."consultation_followups" ADD CONSTRAINT "consultation_followups_consultation_id_consultations_id_fk" FOREIGN KEY ("consultation_id") REFERENCES "clinical"."consultations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."consultation_followups" ADD CONSTRAINT "consultation_followups_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "clinical"."patients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."consultation_instructions" ADD CONSTRAINT "consultation_instructions_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "core"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."consultation_instructions" ADD CONSTRAINT "consultation_instructions_partner_id_operational_partners_id_fk" FOREIGN KEY ("partner_id") REFERENCES "clinical"."operational_partners"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."consultation_instructions" ADD CONSTRAINT "consultation_instructions_organization_id_operational_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "clinical"."operational_organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."consultation_instructions" ADD CONSTRAINT "consultation_instructions_consultation_id_consultations_id_fk" FOREIGN KEY ("consultation_id") REFERENCES "clinical"."consultations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."consultation_medications" ADD CONSTRAINT "consultation_medications_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "core"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."consultation_medications" ADD CONSTRAINT "consultation_medications_partner_id_operational_partners_id_fk" FOREIGN KEY ("partner_id") REFERENCES "clinical"."operational_partners"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."consultation_medications" ADD CONSTRAINT "consultation_medications_organization_id_operational_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "clinical"."operational_organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."consultation_medications" ADD CONSTRAINT "consultation_medications_consultation_id_consultations_id_fk" FOREIGN KEY ("consultation_id") REFERENCES "clinical"."consultations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."consultation_medications" ADD CONSTRAINT "consultation_medications_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "clinical"."patients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."consultation_vitals" ADD CONSTRAINT "consultation_vitals_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "core"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."consultation_vitals" ADD CONSTRAINT "consultation_vitals_partner_id_operational_partners_id_fk" FOREIGN KEY ("partner_id") REFERENCES "clinical"."operational_partners"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."consultation_vitals" ADD CONSTRAINT "consultation_vitals_organization_id_operational_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "clinical"."operational_organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."consultation_vitals" ADD CONSTRAINT "consultation_vitals_consultation_id_consultations_id_fk" FOREIGN KEY ("consultation_id") REFERENCES "clinical"."consultations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."consultation_vitals" ADD CONSTRAINT "consultation_vitals_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "clinical"."patients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."consultations" ADD CONSTRAINT "consultations_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "core"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."consultations" ADD CONSTRAINT "consultations_partner_id_operational_partners_id_fk" FOREIGN KEY ("partner_id") REFERENCES "clinical"."operational_partners"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."consultations" ADD CONSTRAINT "consultations_organization_id_operational_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "clinical"."operational_organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."consultations" ADD CONSTRAINT "consultations_branch_id_operational_facilities_id_fk" FOREIGN KEY ("branch_id") REFERENCES "clinical"."operational_facilities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."consultations" ADD CONSTRAINT "consultations_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "clinical"."patients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."consultations" ADD CONSTRAINT "consultations_encounter_id_encounters_id_fk" FOREIGN KEY ("encounter_id") REFERENCES "clinical"."encounters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."consultations" ADD CONSTRAINT "consultations_doctor_id_doctor_profiles_id_fk" FOREIGN KEY ("doctor_id") REFERENCES "clinical"."doctor_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_cons_audit_tenant" ON "clinical"."consultation_audit_traces" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_cons_audit_partner" ON "clinical"."consultation_audit_traces" USING btree ("partner_id");--> statement-breakpoint
CREATE INDEX "idx_cons_audit_org" ON "clinical"."consultation_audit_traces" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_cons_audit_cons" ON "clinical"."consultation_audit_traces" USING btree ("consultation_id");--> statement-breakpoint
CREATE INDEX "idx_cons_audit_patient" ON "clinical"."consultation_audit_traces" USING btree ("patient_id");--> statement-breakpoint
CREATE INDEX "idx_cons_audit_status" ON "clinical"."consultation_audit_traces" USING btree ("operation_status");--> statement-breakpoint
CREATE INDEX "idx_cons_audit_occurred" ON "clinical"."consultation_audit_traces" USING btree ("occurred_at");--> statement-breakpoint
CREATE INDEX "idx_cons_diag_tenant" ON "clinical"."consultation_diagnoses" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_cons_diag_cons" ON "clinical"."consultation_diagnoses" USING btree ("consultation_id");--> statement-breakpoint
CREATE INDEX "idx_cons_diag_patient" ON "clinical"."consultation_diagnoses" USING btree ("patient_id");--> statement-breakpoint
CREATE INDEX "idx_cons_diag_type" ON "clinical"."consultation_diagnoses" USING btree ("diagnosis_type");--> statement-breakpoint
CREATE INDEX "idx_cons_exam_tenant" ON "clinical"."consultation_examinations" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_cons_exam_cons" ON "clinical"."consultation_examinations" USING btree ("consultation_id");--> statement-breakpoint
CREATE INDEX "idx_cons_fol_tenant" ON "clinical"."consultation_followups" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_cons_fol_cons" ON "clinical"."consultation_followups" USING btree ("consultation_id");--> statement-breakpoint
CREATE INDEX "idx_cons_fol_patient" ON "clinical"."consultation_followups" USING btree ("patient_id");--> statement-breakpoint
CREATE INDEX "idx_cons_fol_status" ON "clinical"."consultation_followups" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_cons_inst_tenant" ON "clinical"."consultation_instructions" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_cons_inst_cons" ON "clinical"."consultation_instructions" USING btree ("consultation_id");--> statement-breakpoint
CREATE INDEX "idx_cons_med_tenant" ON "clinical"."consultation_medications" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_cons_med_cons" ON "clinical"."consultation_medications" USING btree ("consultation_id");--> statement-breakpoint
CREATE INDEX "idx_cons_med_patient" ON "clinical"."consultation_medications" USING btree ("patient_id");--> statement-breakpoint
CREATE INDEX "idx_cons_med_status" ON "clinical"."consultation_medications" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_cons_vitals_tenant" ON "clinical"."consultation_vitals" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_cons_vitals_cons" ON "clinical"."consultation_vitals" USING btree ("consultation_id");--> statement-breakpoint
CREATE INDEX "idx_cons_vitals_patient" ON "clinical"."consultation_vitals" USING btree ("patient_id");--> statement-breakpoint
CREATE INDEX "idx_consultations_tenant" ON "clinical"."consultations" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_consultations_partner" ON "clinical"."consultations" USING btree ("partner_id");--> statement-breakpoint
CREATE INDEX "idx_consultations_org" ON "clinical"."consultations" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_consultations_branch" ON "clinical"."consultations" USING btree ("branch_id");--> statement-breakpoint
CREATE INDEX "idx_consultations_patient" ON "clinical"."consultations" USING btree ("patient_id");--> statement-breakpoint
CREATE INDEX "idx_consultations_encounter" ON "clinical"."consultations" USING btree ("encounter_id");--> statement-breakpoint
CREATE INDEX "idx_consultations_doctor" ON "clinical"."consultations" USING btree ("doctor_id");--> statement-breakpoint
CREATE INDEX "idx_consultations_status" ON "clinical"."consultations" USING btree ("consultation_status");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_consultations_tenant_number" ON "clinical"."consultations" USING btree ("tenant_id","consultation_number");