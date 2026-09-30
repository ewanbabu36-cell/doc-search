CREATE TABLE IF NOT EXISTS "clinical"."supply_chain_warehouses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"partner_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"branch_id" uuid,
	"code" varchar(50) NOT NULL,
	"name" varchar(255) NOT NULL,
	"type" varchar(50) DEFAULT 'DEPARTMENTAL' NOT NULL,
	"department_id" uuid,
	"department_name" varchar(150) NOT NULL,
	"location" text,
	"is_cold_chain" boolean DEFAULT false NOT NULL,
	"status" varchar(50) DEFAULT 'ACTIVE' NOT NULL,
	"manager_name" varchar(150),
	"contact_number" varchar(50),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "clinical"."supply_chain_locations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"warehouse_id" uuid NOT NULL,
	"code" varchar(50) NOT NULL,
	"zone" varchar(50),
	"aisle" varchar(50),
	"rack" varchar(50),
	"shelf" varchar(50),
	"bin" varchar(50),
	"is_temperature_controlled" boolean DEFAULT false NOT NULL,
	"min_temp_celsius" numeric(5, 2),
	"max_temp_celsius" numeric(5, 2),
	"status" varchar(50) DEFAULT 'ACTIVE' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "clinical"."supply_chain_inventory" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"partner_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"branch_id" uuid,
	"warehouse_id" uuid NOT NULL,
	"procurement_item_id" uuid NOT NULL,
	"item_code" varchar(50) NOT NULL,
	"item_name" varchar(255) NOT NULL,
	"current_stock" integer DEFAULT 0 NOT NULL,
	"reserved_stock" integer DEFAULT 0 NOT NULL,
	"available_stock" integer DEFAULT 0 NOT NULL,
	"reorder_level" integer DEFAULT 10 NOT NULL,
	"safety_stock" integer DEFAULT 5 NOT NULL,
	"min_stock" integer DEFAULT 5 NOT NULL,
	"max_stock" integer DEFAULT 500 NOT NULL,
	"unit_of_measure" varchar(50) DEFAULT 'UNIT' NOT NULL,
	"last_restocked_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "clinical"."supply_chain_batches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"partner_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"branch_id" uuid,
	"warehouse_id" uuid NOT NULL,
	"location_id" uuid,
	"procurement_item_id" uuid NOT NULL,
	"item_code" varchar(50) NOT NULL,
	"item_name" varchar(255) NOT NULL,
	"batch_number" varchar(100) NOT NULL,
	"expiry_date" timestamp with time zone NOT NULL,
	"mfg_date" timestamp with time zone,
	"initial_quantity" integer DEFAULT 0 NOT NULL,
	"current_quantity" integer DEFAULT 0 NOT NULL,
	"reserved_quantity" integer DEFAULT 0 NOT NULL,
	"available_quantity" integer DEFAULT 0 NOT NULL,
	"unit_cost" numeric(12, 2) DEFAULT '0.00' NOT NULL,
	"mrp" numeric(12, 2),
	"status" varchar(50) DEFAULT 'ACTIVE' NOT NULL,
	"quarantine_reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "clinical"."supply_chain_stock_ledger" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"partner_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"branch_id" uuid,
	"warehouse_id" uuid NOT NULL,
	"procurement_item_id" uuid NOT NULL,
	"batch_id" uuid,
	"item_code" varchar(50) NOT NULL,
	"batch_number" varchar(100),
	"movement_type" varchar(50) NOT NULL,
	"quantity" integer NOT NULL,
	"balance_before" integer NOT NULL,
	"balance_after" integer NOT NULL,
	"reference_type" varchar(50) NOT NULL,
	"reference_id" varchar(100) NOT NULL,
	"department_name" varchar(150),
	"performed_by" varchar(150) NOT NULL,
	"performed_role" varchar(100),
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "clinical"."supply_chain_transfers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"partner_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"branch_id" uuid,
	"transfer_number" varchar(100) NOT NULL,
	"source_warehouse_id" uuid NOT NULL,
	"source_warehouse_name" varchar(255) NOT NULL,
	"destination_warehouse_id" uuid NOT NULL,
	"destination_warehouse_name" varchar(255) NOT NULL,
	"requesting_department" varchar(150) NOT NULL,
	"status" varchar(50) DEFAULT 'REQUESTED' NOT NULL,
	"requested_by" varchar(150) NOT NULL,
	"requested_at" timestamp with time zone DEFAULT now() NOT NULL,
	"approved_by" varchar(150),
	"approved_at" timestamp with time zone,
	"dispatched_by" varchar(150),
	"dispatched_at" timestamp with time zone,
	"received_by" varchar(150),
	"received_at" timestamp with time zone,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "supply_chain_transfers_transfer_number_unique" UNIQUE("transfer_number")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "clinical"."supply_chain_transfer_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"transfer_id" uuid NOT NULL,
	"procurement_item_id" uuid NOT NULL,
	"batch_id" uuid,
	"item_code" varchar(50) NOT NULL,
	"item_name" varchar(255) NOT NULL,
	"batch_number" varchar(100),
	"requested_quantity" integer NOT NULL,
	"dispatched_quantity" integer DEFAULT 0 NOT NULL,
	"received_quantity" integer DEFAULT 0 NOT NULL,
	"unit" varchar(50) DEFAULT 'UNIT' NOT NULL,
	"status" varchar(50) DEFAULT 'PENDING' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "clinical"."supply_chain_consumptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"partner_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"branch_id" uuid,
	"consumption_number" varchar(100) NOT NULL,
	"warehouse_id" uuid NOT NULL,
	"department_name" varchar(150) NOT NULL,
	"patient_id" uuid,
	"encounter_id" uuid,
	"procedure_name" varchar(255),
	"consumed_by" varchar(150) NOT NULL,
	"consumed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"total_cost" numeric(14, 2) DEFAULT '0.00' NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "supply_chain_consumptions_consumption_number_unique" UNIQUE("consumption_number")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "clinical"."supply_chain_consumption_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"consumption_id" uuid NOT NULL,
	"procurement_item_id" uuid NOT NULL,
	"batch_id" uuid NOT NULL,
	"item_code" varchar(50) NOT NULL,
	"item_name" varchar(255) NOT NULL,
	"batch_number" varchar(100) NOT NULL,
	"quantity" integer NOT NULL,
	"unit_cost" numeric(12, 2) DEFAULT '0.00' NOT NULL,
	"total_cost" numeric(14, 2) DEFAULT '0.00' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "clinical"."supply_chain_stock_counts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"partner_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"branch_id" uuid,
	"count_number" varchar(100) NOT NULL,
	"warehouse_id" uuid NOT NULL,
	"count_type" varchar(50) DEFAULT 'CYCLE' NOT NULL,
	"status" varchar(50) DEFAULT 'PLANNED' NOT NULL,
	"initiated_by" varchar(150) NOT NULL,
	"conducted_by" varchar(150),
	"reconciled_by" varchar(150),
	"initiated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone,
	"reconciled_at" timestamp with time zone,
	"total_expected_quantity" integer DEFAULT 0 NOT NULL,
	"total_counted_quantity" integer DEFAULT 0 NOT NULL,
	"total_variance_quantity" integer DEFAULT 0 NOT NULL,
	"total_variance_value" numeric(14, 2) DEFAULT '0.00' NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "supply_chain_stock_counts_count_number_unique" UNIQUE("count_number")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "clinical"."supply_chain_stock_count_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"stock_count_id" uuid NOT NULL,
	"procurement_item_id" uuid NOT NULL,
	"batch_id" uuid,
	"item_code" varchar(50) NOT NULL,
	"item_name" varchar(255) NOT NULL,
	"batch_number" varchar(100),
	"expected_quantity" integer NOT NULL,
	"counted_quantity" integer,
	"variance_quantity" integer DEFAULT 0 NOT NULL,
	"variance_value" numeric(12, 2) DEFAULT '0.00' NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "clinical"."supply_chain_recalls" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"partner_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"branch_id" uuid,
	"recall_number" varchar(100) NOT NULL,
	"procurement_item_id" uuid NOT NULL,
	"item_code" varchar(50) NOT NULL,
	"item_name" varchar(255) NOT NULL,
	"batch_number" varchar(100) NOT NULL,
	"vendor_id" uuid,
	"recall_class" varchar(50) DEFAULT 'CLASS_II' NOT NULL,
	"reason" text NOT NULL,
	"status" varchar(50) DEFAULT 'ACTIVE' NOT NULL,
	"initiated_by" varchar(150) NOT NULL,
	"total_quarantined_quantity" integer DEFAULT 0 NOT NULL,
	"disposition_action" varchar(50) DEFAULT 'PENDING' NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "supply_chain_recalls_recall_number_unique" UNIQUE("recall_number")
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_sc_wh_tenant" ON "clinical"."supply_chain_warehouses" ("tenant_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_sc_wh_code" ON "clinical"."supply_chain_warehouses" ("code");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_sc_wh_dept" ON "clinical"."supply_chain_warehouses" ("department_name");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "idx_sc_wh_tenant_code" ON "clinical"."supply_chain_warehouses" ("tenant_id", "code");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_sc_loc_tenant" ON "clinical"."supply_chain_locations" ("tenant_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_sc_loc_wh" ON "clinical"."supply_chain_locations" ("warehouse_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_sc_inv_tenant" ON "clinical"."supply_chain_inventory" ("tenant_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_sc_inv_wh" ON "clinical"."supply_chain_inventory" ("warehouse_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_sc_inv_item" ON "clinical"."supply_chain_inventory" ("procurement_item_id");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "idx_sc_inv_wh_item" ON "clinical"."supply_chain_inventory" ("warehouse_id", "procurement_item_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_sc_batch_tenant" ON "clinical"."supply_chain_batches" ("tenant_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_sc_batch_wh" ON "clinical"."supply_chain_batches" ("warehouse_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_sc_batch_item" ON "clinical"."supply_chain_batches" ("procurement_item_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_sc_batch_num" ON "clinical"."supply_chain_batches" ("batch_number");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_sc_batch_exp" ON "clinical"."supply_chain_batches" ("expiry_date");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_sc_batch_status" ON "clinical"."supply_chain_batches" ("status");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "idx_sc_batch_wh_item_num" ON "clinical"."supply_chain_batches" ("warehouse_id", "procurement_item_id", "batch_number");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_sc_ledg_tenant" ON "clinical"."supply_chain_stock_ledger" ("tenant_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_sc_ledg_wh" ON "clinical"."supply_chain_stock_ledger" ("warehouse_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_sc_ledg_item" ON "clinical"."supply_chain_stock_ledger" ("procurement_item_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_sc_ledg_type" ON "clinical"."supply_chain_stock_ledger" ("movement_type");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_sc_trf_tenant" ON "clinical"."supply_chain_transfers" ("tenant_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_sc_trf_num" ON "clinical"."supply_chain_transfers" ("transfer_number");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_sc_csm_tenant" ON "clinical"."supply_chain_consumptions" ("tenant_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_sc_csm_wh" ON "clinical"."supply_chain_consumptions" ("warehouse_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_sc_cnt_tenant" ON "clinical"."supply_chain_stock_counts" ("tenant_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_sc_cnt_wh" ON "clinical"."supply_chain_stock_counts" ("warehouse_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_sc_rcl_tenant" ON "clinical"."supply_chain_recalls" ("tenant_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_sc_rcl_item" ON "clinical"."supply_chain_recalls" ("procurement_item_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_sc_rcl_batch" ON "clinical"."supply_chain_recalls" ("batch_number");
