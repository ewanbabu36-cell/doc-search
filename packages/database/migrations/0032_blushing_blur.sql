CREATE TABLE "clinical"."dietary_assessments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"partner_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"branch_id" uuid NOT NULL,
	"assessment_number" varchar(64) NOT NULL,
	"patient_id" uuid NOT NULL,
	"patient_name" varchar(255) NOT NULL,
	"patient_mrn" varchar(64) NOT NULL,
	"admission_id" varchar(64),
	"ward_name" varchar(128) NOT NULL,
	"room_bed_number" varchar(64) NOT NULL,
	"attending_doctor" varchar(255) NOT NULL,
	"dietitian_name" varchar(255) NOT NULL,
	"assessment_date" varchar(32) NOT NULL,
	"weight_kg" numeric(6, 2) NOT NULL,
	"height_cm" numeric(6, 2) NOT NULL,
	"bmi" numeric(6, 2) NOT NULL,
	"nutritional_risk_score" varchar(64) NOT NULL,
	"clinical_condition" text NOT NULL,
	"food_allergies" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"food_intolerances" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"cultural_religious_preferences" varchar(255),
	"swallowing_difficulty" boolean DEFAULT false NOT NULL,
	"feeding_route" varchar(64) DEFAULT 'ORAL' NOT NULL,
	"fluid_restriction_ml" numeric(8, 2),
	"special_instructions" text,
	"status" varchar(64) DEFAULT 'COMPLETED' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clinical"."dietary_audit_traces" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"partner_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"branch_id" uuid NOT NULL,
	"trace_number" varchar(64) NOT NULL,
	"actor_id" varchar(64) NOT NULL,
	"actor_name" varchar(255) NOT NULL,
	"actor_role" varchar(64) NOT NULL,
	"action" varchar(64) NOT NULL,
	"entity_type" varchar(64) NOT NULL,
	"entity_id" varchar(64) NOT NULL,
	"entity_code" varchar(64) NOT NULL,
	"justification" text NOT NULL,
	"ip_address" varchar(64) DEFAULT '127.0.0.1' NOT NULL,
	"integrity_hash" varchar(255) NOT NULL,
	"previous_hash" varchar(255) NOT NULL,
	"new_state" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"timestamp" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clinical"."dietary_billing_references" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"partner_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"branch_id" uuid NOT NULL,
	"charge_code" varchar(64) NOT NULL,
	"patient_id" uuid NOT NULL,
	"patient_name" varchar(255) NOT NULL,
	"patient_mrn" varchar(64) NOT NULL,
	"diet_type_name" varchar(255) NOT NULL,
	"charge_category" varchar(64) NOT NULL,
	"amount" numeric(10, 2) DEFAULT '0.00' NOT NULL,
	"billing_status" varchar(64) DEFAULT 'PENDING' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clinical"."dietary_cost_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"partner_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"branch_id" uuid NOT NULL,
	"cost_code" varchar(64) NOT NULL,
	"record_date" varchar(32) NOT NULL,
	"ward_name" varchar(128) NOT NULL,
	"diet_category" varchar(64) NOT NULL,
	"total_meals_served" integer DEFAULT 0 NOT NULL,
	"ingredient_cost_total" numeric(10, 2) DEFAULT '0.00' NOT NULL,
	"labor_cost_estimate" numeric(10, 2) DEFAULT '0.00' NOT NULL,
	"waste_cost_total" numeric(10, 2) DEFAULT '0.00' NOT NULL,
	"cost_per_meal_average" numeric(10, 2) DEFAULT '0.00' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clinical"."dietary_departments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"partner_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"branch_id" uuid NOT NULL,
	"department_code" varchar(64) NOT NULL,
	"department_name" varchar(255) NOT NULL,
	"head_of_dietetics" varchar(255) NOT NULL,
	"contact_email" varchar(255),
	"contact_phone" varchar(64),
	"status" varchar(64) DEFAULT 'ACTIVE' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clinical"."dietary_diet_plans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"partner_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"branch_id" uuid NOT NULL,
	"plan_code" varchar(64) NOT NULL,
	"order_id" uuid NOT NULL,
	"patient_name" varchar(255) NOT NULL,
	"ward_bed" varchar(128) NOT NULL,
	"plan_date" varchar(32) NOT NULL,
	"diet_type_name" varchar(255) NOT NULL,
	"breakfast_items" text NOT NULL,
	"mid_morning_items" text,
	"lunch_items" text NOT NULL,
	"evening_snack_items" text,
	"dinner_items" text NOT NULL,
	"bedtime_snack_items" text,
	"total_estimated_calories" integer DEFAULT 2000 NOT NULL,
	"total_estimated_protein" numeric(8, 2) DEFAULT '75.00' NOT NULL,
	"special_prep_notes" text,
	"status" varchar(64) DEFAULT 'ACTIVE' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clinical"."dietary_diet_types" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"partner_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"branch_id" uuid NOT NULL,
	"diet_code" varchar(64) NOT NULL,
	"diet_name" varchar(255) NOT NULL,
	"category" varchar(64) NOT NULL,
	"clinical_purpose" text NOT NULL,
	"allowed_foods" text NOT NULL,
	"restricted_foods" text NOT NULL,
	"allergens_to_avoid" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"target_calories" integer DEFAULT 2000 NOT NULL,
	"target_protein_grams" numeric(8, 2) DEFAULT '70.00' NOT NULL,
	"target_carbs_grams" numeric(8, 2) DEFAULT '250.00' NOT NULL,
	"target_fat_grams" numeric(8, 2) DEFAULT '60.00' NOT NULL,
	"sodium_restricted_mg" numeric(8, 2),
	"fluid_restricted_ml" numeric(8, 2),
	"texture" varchar(64) DEFAULT 'REGULAR' NOT NULL,
	"meal_frequency_per_day" integer DEFAULT 4 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clinical"."dietary_food_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"partner_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"branch_id" uuid NOT NULL,
	"item_code" varchar(64) NOT NULL,
	"item_name" varchar(255) NOT NULL,
	"category" varchar(64) NOT NULL,
	"unit" varchar(32) DEFAULT 'SERVING' NOT NULL,
	"calories_per_unit" numeric(8, 2) DEFAULT '150.00' NOT NULL,
	"protein_per_unit" numeric(8, 2) DEFAULT '5.00' NOT NULL,
	"carbs_per_unit" numeric(8, 2) DEFAULT '20.00' NOT NULL,
	"fat_per_unit" numeric(8, 2) DEFAULT '3.00' NOT NULL,
	"allergens" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"storage_type" varchar(64) DEFAULT 'DRY' NOT NULL,
	"procurement_ref_id" varchar(64),
	"estimated_unit_cost" numeric(10, 2) DEFAULT '50.00' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clinical"."dietary_kitchens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"partner_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"branch_id" uuid NOT NULL,
	"kitchen_code" varchar(64) NOT NULL,
	"kitchen_name" varchar(255) NOT NULL,
	"kitchen_type" varchar(64) DEFAULT 'CENTRAL' NOT NULL,
	"location" varchar(255) NOT NULL,
	"daily_capacity" integer DEFAULT 500 NOT NULL,
	"operating_hours" varchar(128) DEFAULT '05:00 - 22:00' NOT NULL,
	"responsible_manager" varchar(255) NOT NULL,
	"contact_phone" varchar(64) NOT NULL,
	"food_safety_status" varchar(128) DEFAULT 'COMPLIANT_HACCP' NOT NULL,
	"status" varchar(64) DEFAULT 'ACTIVE' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clinical"."dietary_meal_dispatches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"partner_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"branch_id" uuid NOT NULL,
	"dispatch_code" varchar(64) NOT NULL,
	"tray_barcode" varchar(64) NOT NULL,
	"patient_name" varchar(255) NOT NULL,
	"patient_mrn" varchar(64) NOT NULL,
	"ward_name" varchar(128) NOT NULL,
	"room_bed_number" varchar(64) NOT NULL,
	"meal_slot" varchar(64) NOT NULL,
	"diet_type_name" varchar(255) NOT NULL,
	"delivery_person_name" varchar(255) NOT NULL,
	"dispatched_at" varchar(64) NOT NULL,
	"delivered_at" varchar(64),
	"received_by" varchar(255),
	"delivery_status" varchar(64) DEFAULT 'DISPATCHED' NOT NULL,
	"exception_reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clinical"."dietary_meal_schedules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"partner_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"branch_id" uuid NOT NULL,
	"schedule_code" varchar(64) NOT NULL,
	"order_id" uuid NOT NULL,
	"patient_name" varchar(255) NOT NULL,
	"ward_name" varchar(128) NOT NULL,
	"room_bed_number" varchar(64) NOT NULL,
	"meal_date" varchar(32) NOT NULL,
	"meal_slot" varchar(64) NOT NULL,
	"diet_type_name" varchar(255) NOT NULL,
	"items_to_serve" text NOT NULL,
	"scheduled_dispatch_time" varchar(32) NOT NULL,
	"status" varchar(64) DEFAULT 'SCHEDULED' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clinical"."dietary_menu_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"partner_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"branch_id" uuid NOT NULL,
	"template_code" varchar(64) NOT NULL,
	"template_name" varchar(255) NOT NULL,
	"diet_category" varchar(64) NOT NULL,
	"meal_slot" varchar(64) NOT NULL,
	"menu_items_description" text NOT NULL,
	"ingredient_list" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"portion_size" varchar(64) DEFAULT '1 Portion' NOT NULL,
	"estimated_calories" integer DEFAULT 500 NOT NULL,
	"estimated_cost" numeric(10, 2) DEFAULT '120.00' NOT NULL,
	"kitchen_id" uuid NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clinical"."dietary_orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"partner_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"branch_id" uuid NOT NULL,
	"order_number" varchar(64) NOT NULL,
	"patient_id" uuid NOT NULL,
	"patient_name" varchar(255) NOT NULL,
	"patient_mrn" varchar(64) NOT NULL,
	"admission_id" varchar(64),
	"ward_name" varchar(128) NOT NULL,
	"room_bed_number" varchar(64) NOT NULL,
	"diet_type_id" uuid NOT NULL,
	"diet_type_name" varchar(255) NOT NULL,
	"diet_category" varchar(64) NOT NULL,
	"meal_frequency" varchar(64) DEFAULT '4 Meals / Day' NOT NULL,
	"start_date" varchar(32) NOT NULL,
	"end_date" varchar(32),
	"fluid_restriction_ml" numeric(8, 2),
	"texture" varchar(64) DEFAULT 'REGULAR' NOT NULL,
	"feeding_route" varchar(64) DEFAULT 'ORAL' NOT NULL,
	"priority" varchar(64) DEFAULT 'ROUTINE' NOT NULL,
	"is_npo" boolean DEFAULT false NOT NULL,
	"special_instructions" text,
	"allergy_warnings" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"ordering_doctor" varchar(255) NOT NULL,
	"reviewed_by_dietitian" varchar(255),
	"status" varchar(64) DEFAULT 'ACTIVE' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clinical"."dietary_preparation_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"partner_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"branch_id" uuid NOT NULL,
	"batch_number" varchar(64) NOT NULL,
	"production_plan_id" uuid NOT NULL,
	"diet_category" varchar(64) NOT NULL,
	"food_item_name" varchar(255) NOT NULL,
	"quantity_prepared" numeric(8, 2) NOT NULL,
	"unit" varchar(32) DEFAULT 'SERVINGS' NOT NULL,
	"head_chef" varchar(255) NOT NULL,
	"cooking_temperature_c" numeric(5, 1),
	"holding_temperature_c" numeric(5, 1),
	"start_time" varchar(32) NOT NULL,
	"completion_time" varchar(32),
	"status" varchar(64) DEFAULT 'PREPARED' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clinical"."dietary_procurement_references" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"partner_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"branch_id" uuid NOT NULL,
	"requisition_ref_number" varchar(64) NOT NULL,
	"ingredient_name" varchar(255) NOT NULL,
	"quantity_requested" numeric(8, 2) NOT NULL,
	"unit" varchar(32) DEFAULT 'KG' NOT NULL,
	"urgency" varchar(64) DEFAULT 'ROUTINE' NOT NULL,
	"vendor_ref" varchar(255),
	"status" varchar(64) DEFAULT 'SUGGESTED' NOT NULL,
	"requested_by" varchar(255) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clinical"."dietary_production_plans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"partner_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"branch_id" uuid NOT NULL,
	"plan_number" varchar(64) NOT NULL,
	"kitchen_id" uuid NOT NULL,
	"kitchen_name" varchar(255) NOT NULL,
	"production_date" varchar(32) NOT NULL,
	"meal_slot" varchar(64) NOT NULL,
	"total_patients_count" integer DEFAULT 0 NOT NULL,
	"regular_meals_count" integer DEFAULT 0 NOT NULL,
	"therapeutic_meals_count" integer DEFAULT 0 NOT NULL,
	"npo_count" integer DEFAULT 0 NOT NULL,
	"special_allergy_count" integer DEFAULT 0 NOT NULL,
	"status" varchar(64) DEFAULT 'PLANNED' NOT NULL,
	"released_by" varchar(255),
	"released_at" varchar(64),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clinical"."dietary_quality_checks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"partner_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"branch_id" uuid NOT NULL,
	"check_code" varchar(64) NOT NULL,
	"batch_number" varchar(64) NOT NULL,
	"kitchen_name" varchar(255) NOT NULL,
	"hygiene_check_passed" boolean DEFAULT true NOT NULL,
	"temperature_check_passed" boolean DEFAULT true NOT NULL,
	"holding_temp_c" numeric(5, 1) DEFAULT '65.0' NOT NULL,
	"allergen_segregation_passed" boolean DEFAULT true NOT NULL,
	"packaging_integrity_passed" boolean DEFAULT true NOT NULL,
	"inspector_name" varchar(255) NOT NULL,
	"inspector_role" varchar(64) DEFAULT 'FOOD_SAFETY_OFFICER' NOT NULL,
	"quality_status" varchar(64) DEFAULT 'PASSED' NOT NULL,
	"notes" text,
	"inspected_at" varchar(64) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clinical"."dietary_safety_alerts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"partner_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"branch_id" uuid NOT NULL,
	"alert_code" varchar(64) NOT NULL,
	"patient_name" varchar(255) NOT NULL,
	"patient_mrn" varchar(64) NOT NULL,
	"ward_bed" varchar(128) NOT NULL,
	"alert_type" varchar(64) NOT NULL,
	"severity" varchar(64) DEFAULT 'HIGH' NOT NULL,
	"description" text NOT NULL,
	"is_resolved" boolean DEFAULT false NOT NULL,
	"resolved_by" varchar(255),
	"resolved_at" varchar(64),
	"resolution_notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clinical"."dietary_tray_assemblies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"partner_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"branch_id" uuid NOT NULL,
	"tray_barcode" varchar(64) NOT NULL,
	"order_id" uuid NOT NULL,
	"patient_name" varchar(255) NOT NULL,
	"patient_mrn" varchar(64) NOT NULL,
	"ward_name" varchar(128) NOT NULL,
	"room_bed_number" varchar(64) NOT NULL,
	"meal_slot" varchar(64) NOT NULL,
	"diet_type_name" varchar(255) NOT NULL,
	"items_included" text NOT NULL,
	"allergy_notice" text,
	"assembled_by_staff" varchar(255) NOT NULL,
	"is_verified" boolean DEFAULT true NOT NULL,
	"verified_by" varchar(255),
	"assembly_time" varchar(64) NOT NULL,
	"status" varchar(64) DEFAULT 'VERIFIED' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clinical"."dietary_waste_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"partner_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"branch_id" uuid NOT NULL,
	"waste_code" varchar(64) NOT NULL,
	"kitchen_name" varchar(255) NOT NULL,
	"meal_date" varchar(32) NOT NULL,
	"meal_slot" varchar(64) NOT NULL,
	"prepared_quantity" numeric(8, 2) NOT NULL,
	"served_quantity" numeric(8, 2) NOT NULL,
	"wasted_quantity" numeric(8, 2) NOT NULL,
	"unit" varchar(32) DEFAULT 'KG' NOT NULL,
	"reason" varchar(64) DEFAULT 'OVERPRODUCTION' NOT NULL,
	"estimated_cost_loss" numeric(10, 2) DEFAULT '0.00' NOT NULL,
	"reported_by" varchar(255) NOT NULL,
	"recorded_at" varchar(64) NOT NULL
);
--> statement-breakpoint
ALTER TABLE "clinical"."dietary_diet_plans" ADD CONSTRAINT "dietary_diet_plans_order_id_dietary_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "clinical"."dietary_orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."dietary_meal_schedules" ADD CONSTRAINT "dietary_meal_schedules_order_id_dietary_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "clinical"."dietary_orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."dietary_menu_templates" ADD CONSTRAINT "dietary_menu_templates_kitchen_id_dietary_kitchens_id_fk" FOREIGN KEY ("kitchen_id") REFERENCES "clinical"."dietary_kitchens"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."dietary_orders" ADD CONSTRAINT "dietary_orders_diet_type_id_dietary_diet_types_id_fk" FOREIGN KEY ("diet_type_id") REFERENCES "clinical"."dietary_diet_types"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."dietary_preparation_records" ADD CONSTRAINT "dietary_preparation_records_production_plan_id_dietary_production_plans_id_fk" FOREIGN KEY ("production_plan_id") REFERENCES "clinical"."dietary_production_plans"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."dietary_production_plans" ADD CONSTRAINT "dietary_production_plans_kitchen_id_dietary_kitchens_id_fk" FOREIGN KEY ("kitchen_id") REFERENCES "clinical"."dietary_kitchens"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."dietary_tray_assemblies" ADD CONSTRAINT "dietary_tray_assemblies_order_id_dietary_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "clinical"."dietary_orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_da_tenant_patient" ON "clinical"."dietary_assessments" USING btree ("tenant_id","patient_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_da_num" ON "clinical"."dietary_assessments" USING btree ("tenant_id","assessment_number");--> statement-breakpoint
CREATE INDEX "idx_dat_tenant_branch" ON "clinical"."dietary_audit_traces" USING btree ("tenant_id","branch_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_dat_num" ON "clinical"."dietary_audit_traces" USING btree ("tenant_id","trace_number");--> statement-breakpoint
CREATE INDEX "idx_dbr_tenant_patient" ON "clinical"."dietary_billing_references" USING btree ("tenant_id","patient_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_dbr_charge" ON "clinical"."dietary_billing_references" USING btree ("tenant_id","charge_code");--> statement-breakpoint
CREATE INDEX "idx_dcr_tenant_branch" ON "clinical"."dietary_cost_records" USING btree ("tenant_id","branch_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_dcr_code" ON "clinical"."dietary_cost_records" USING btree ("tenant_id","cost_code");--> statement-breakpoint
CREATE INDEX "idx_dd_tenant_branch" ON "clinical"."dietary_departments" USING btree ("tenant_id","branch_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_dd_code" ON "clinical"."dietary_departments" USING btree ("tenant_id","department_code");--> statement-breakpoint
CREATE INDEX "idx_ddp_tenant_order" ON "clinical"."dietary_diet_plans" USING btree ("tenant_id","order_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_ddp_code" ON "clinical"."dietary_diet_plans" USING btree ("tenant_id","plan_code");--> statement-breakpoint
CREATE INDEX "idx_ddt_tenant_branch" ON "clinical"."dietary_diet_types" USING btree ("tenant_id","branch_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_ddt_code" ON "clinical"."dietary_diet_types" USING btree ("tenant_id","diet_code");--> statement-breakpoint
CREATE INDEX "idx_dfi_tenant_branch" ON "clinical"."dietary_food_items" USING btree ("tenant_id","branch_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_dfi_code" ON "clinical"."dietary_food_items" USING btree ("tenant_id","item_code");--> statement-breakpoint
CREATE INDEX "idx_dk_tenant_branch" ON "clinical"."dietary_kitchens" USING btree ("tenant_id","branch_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_dk_code" ON "clinical"."dietary_kitchens" USING btree ("tenant_id","kitchen_code");--> statement-breakpoint
CREATE INDEX "idx_dmd_tenant_branch" ON "clinical"."dietary_meal_dispatches" USING btree ("tenant_id","branch_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_dmd_code" ON "clinical"."dietary_meal_dispatches" USING btree ("tenant_id","dispatch_code");--> statement-breakpoint
CREATE INDEX "idx_dms_tenant_order" ON "clinical"."dietary_meal_schedules" USING btree ("tenant_id","order_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_dms_code" ON "clinical"."dietary_meal_schedules" USING btree ("tenant_id","schedule_code");--> statement-breakpoint
CREATE INDEX "idx_dmt_tenant_kitchen" ON "clinical"."dietary_menu_templates" USING btree ("tenant_id","kitchen_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_dmt_code" ON "clinical"."dietary_menu_templates" USING btree ("tenant_id","template_code");--> statement-breakpoint
CREATE INDEX "idx_do_tenant_patient" ON "clinical"."dietary_orders" USING btree ("tenant_id","patient_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_do_num" ON "clinical"."dietary_orders" USING btree ("tenant_id","order_number");--> statement-breakpoint
CREATE INDEX "idx_dpr_tenant_prod" ON "clinical"."dietary_preparation_records" USING btree ("tenant_id","production_plan_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_dpr_batch" ON "clinical"."dietary_preparation_records" USING btree ("tenant_id","batch_number");--> statement-breakpoint
CREATE INDEX "idx_dpr_tenant_branch" ON "clinical"."dietary_procurement_references" USING btree ("tenant_id","branch_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_dpr_req" ON "clinical"."dietary_procurement_references" USING btree ("tenant_id","requisition_ref_number");--> statement-breakpoint
CREATE INDEX "idx_dpp_tenant_kitchen" ON "clinical"."dietary_production_plans" USING btree ("tenant_id","kitchen_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_dpp_num" ON "clinical"."dietary_production_plans" USING btree ("tenant_id","plan_number");--> statement-breakpoint
CREATE INDEX "idx_dqc_tenant_branch" ON "clinical"."dietary_quality_checks" USING btree ("tenant_id","branch_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_dqc_code" ON "clinical"."dietary_quality_checks" USING btree ("tenant_id","check_code");--> statement-breakpoint
CREATE INDEX "idx_dsa_tenant_branch" ON "clinical"."dietary_safety_alerts" USING btree ("tenant_id","branch_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_dsa_code" ON "clinical"."dietary_safety_alerts" USING btree ("tenant_id","alert_code");--> statement-breakpoint
CREATE INDEX "idx_dta_tenant_order" ON "clinical"."dietary_tray_assemblies" USING btree ("tenant_id","order_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_dta_barcode" ON "clinical"."dietary_tray_assemblies" USING btree ("tenant_id","tray_barcode");--> statement-breakpoint
CREATE INDEX "idx_dwr_tenant_branch" ON "clinical"."dietary_waste_records" USING btree ("tenant_id","branch_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_dwr_code" ON "clinical"."dietary_waste_records" USING btree ("tenant_id","waste_code");