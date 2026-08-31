CREATE TABLE "clinical"."iot_connected_devices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"partner_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"branch_id" uuid NOT NULL,
	"device_serial" varchar(128) NOT NULL,
	"device_model" varchar(128) NOT NULL,
	"device_type" varchar(64) NOT NULL,
	"patient_mrn" varchar(64) NOT NULL,
	"patient_name" varchar(255) NOT NULL,
	"conn_protocol" varchar(64) DEFAULT 'BLUETOOTH_BLE' NOT NULL,
	"battery_pct" integer DEFAULT 100 NOT NULL,
	"last_sync_ts" timestamp with time zone DEFAULT now() NOT NULL,
	"sync_status" varchar(32) DEFAULT 'ONLINE_ACTIVE' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clinical"."rpm_vital_breach_alerts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"partner_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"branch_id" uuid NOT NULL,
	"patient_mrn" varchar(64) NOT NULL,
	"patient_name" varchar(255) NOT NULL,
	"care_program" varchar(64) NOT NULL,
	"vital_param" varchar(128) NOT NULL,
	"measured_value" varchar(64) NOT NULL,
	"threshold_rule" text NOT NULL,
	"severity" varchar(32) DEFAULT 'WARNING_AMBER' NOT NULL,
	"alert_ts" timestamp with time zone DEFAULT now() NOT NULL,
	"status" varchar(32) DEFAULT 'UNACKNOWLEDGED_URGENT' NOT NULL,
	"assigned_clinician" varchar(128) NOT NULL,
	"resolution_notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clinical"."teleconsultation_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"partner_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"branch_id" uuid NOT NULL,
	"appointment_number" varchar(64) NOT NULL,
	"patient_mrn" varchar(64) NOT NULL,
	"patient_name" varchar(255) NOT NULL,
	"doctor_name" varchar(128) NOT NULL,
	"specialty_name" varchar(128) NOT NULL,
	"sched_start_time" timestamp with time zone NOT NULL,
	"actual_start_time" timestamp with time zone,
	"actual_end_time" timestamp with time zone,
	"call_duration_sec" integer DEFAULT 0 NOT NULL,
	"webrtc_room_id" varchar(128) NOT NULL,
	"status" varchar(32) DEFAULT 'SCHEDULED' NOT NULL,
	"consultation_fee" numeric(10, 2) DEFAULT '800.00' NOT NULL,
	"payment_status" varchar(32) DEFAULT 'PAID' NOT NULL,
	"clinical_soap_summary" text,
	"e_rx_generated" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clinical"."telehealth_audit_traces" (
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
CREATE INDEX "idx_icd_tenant_patient" ON "clinical"."iot_connected_devices" USING btree ("tenant_id","patient_mrn");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_icd_serial" ON "clinical"."iot_connected_devices" USING btree ("tenant_id","device_serial");--> statement-breakpoint
CREATE INDEX "idx_rvba_tenant_patient" ON "clinical"."rpm_vital_breach_alerts" USING btree ("tenant_id","patient_mrn");--> statement-breakpoint
CREATE INDEX "idx_rvba_alert_ts" ON "clinical"."rpm_vital_breach_alerts" USING btree ("alert_ts");--> statement-breakpoint
CREATE INDEX "idx_tcs_tenant_patient" ON "clinical"."teleconsultation_sessions" USING btree ("tenant_id","patient_mrn");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_tcs_room" ON "clinical"."teleconsultation_sessions" USING btree ("tenant_id","webrtc_room_id");--> statement-breakpoint
CREATE INDEX "idx_thtr_tenant_branch" ON "clinical"."telehealth_audit_traces" USING btree ("tenant_id","branch_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_thtr_num" ON "clinical"."telehealth_audit_traces" USING btree ("tenant_id","trace_number");