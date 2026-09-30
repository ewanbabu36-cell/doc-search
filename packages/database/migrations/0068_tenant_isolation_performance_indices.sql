CREATE INDEX IF NOT EXISTS "idx_anaesthesia_rec_tenant" ON "clinical"."anaesthesia_records" ("tenant_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_facility_reg_tenant" ON "clinical"."facility_registry" ("tenant_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_inpatient_adm_app_tenant" ON "clinical"."inpatient_admission_approvals" ("tenant_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_inpatient_bed_alloc_tenant" ON "clinical"."inpatient_bed_allocations" ("tenant_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_inpatient_bed_stat_hist_tenant" ON "clinical"."inpatient_bed_status_history" ("tenant_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_inpatient_care_plans_tenant" ON "clinical"."inpatient_care_plans" ("tenant_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_inpatient_care_teams_tenant" ON "clinical"."inpatient_care_teams" ("tenant_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_inpatient_disch_plans_tenant" ON "clinical"."inpatient_discharge_plans" ("tenant_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_inpatient_doc_rounds_tenant" ON "clinical"."inpatient_doctor_rounds" ("tenant_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_inpatient_intake_out_tenant" ON "clinical"."inpatient_intake_output" ("tenant_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_inpatient_nursing_ass_tenant" ON "clinical"."inpatient_nursing_assessments" ("tenant_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_inpatient_nursing_notes_tenant" ON "clinical"."inpatient_nursing_notes" ("tenant_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_inpatient_pat_loc_tenant" ON "clinical"."inpatient_patient_locations" ("tenant_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_inpatient_trans_app_tenant" ON "clinical"."inpatient_transfer_approvals" ("tenant_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_inpatient_vital_obs_tenant" ON "clinical"."inpatient_vital_observations" ("tenant_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_intraoperative_rec_tenant" ON "clinical"."intraoperative_records" ("tenant_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_ot_nursing_notes_tenant" ON "clinical"."ot_nursing_notes" ("tenant_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_ot_res_alloc_tenant" ON "clinical"."ot_resource_allocations" ("tenant_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_ot_sched_staff_tenant" ON "clinical"."ot_schedule_staff" ("tenant_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_pacu_rec_records_tenant" ON "clinical"."pacu_recovery_records" ("tenant_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_postop_orders_tenant" ON "clinical"."postoperative_orders" ("tenant_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_pre_op_checklists_tenant" ON "clinical"."pre_op_checklists" ("tenant_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_preop_assessments_tenant" ON "clinical"."pre_operative_assessments" ("tenant_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_sc_consump_items_tenant" ON "clinical"."supply_chain_consumption_items" ("tenant_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_sc_stock_count_items_tenant" ON "clinical"."supply_chain_stock_count_items" ("tenant_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_sc_trans_items_tenant" ON "clinical"."supply_chain_transfer_items" ("tenant_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_surgery_req_items_tenant" ON "clinical"."surgery_request_items" ("tenant_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_surg_consumable_usage_tenant" ON "clinical"."surgical_consumable_usage" ("tenant_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_surg_proc_req_tenant" ON "clinical"."surgical_procedure_requirements" ("tenant_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_surg_safety_checklists_tenant" ON "clinical"."surgical_safety_checklists" ("tenant_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_partner_agreements_tenant" ON "company"."partner_agreements" ("tenant_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_saga_steps_tenant" ON "core"."saga_steps" ("tenant_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_sessions_tenant" ON "core"."sessions" ("tenant_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_user_roles_tenant" ON "core"."user_roles" ("tenant_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_workflow_instances_tenant" ON "public"."workflow_instances" ("tenant_id");
