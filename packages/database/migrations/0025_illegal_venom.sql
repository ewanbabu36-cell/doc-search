CREATE TABLE "clinical"."goods_receipt_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"goods_receipt_id" uuid NOT NULL,
	"purchase_order_item_id" uuid NOT NULL,
	"procurement_item_id" uuid NOT NULL,
	"item_code" varchar(50) NOT NULL,
	"item_name" varchar(255) NOT NULL,
	"received_quantity" integer NOT NULL,
	"accepted_quantity" integer DEFAULT 0 NOT NULL,
	"rejected_quantity" integer DEFAULT 0 NOT NULL,
	"short_quantity" integer DEFAULT 0,
	"excess_quantity" integer DEFAULT 0,
	"damaged_quantity" integer DEFAULT 0,
	"unit_price" numeric(12, 2) NOT NULL,
	"batch_number" varchar(100),
	"expiry_date" timestamp with time zone,
	"serial_number" varchar(100),
	"barcode" varchar(100),
	"mfg_date" timestamp with time zone,
	"status" varchar(50) DEFAULT 'PENDING_QC' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clinical"."goods_receipts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"partner_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"branch_id" uuid,
	"grn_number" varchar(100) NOT NULL,
	"purchase_order_id" uuid NOT NULL,
	"po_number" varchar(100) NOT NULL,
	"vendor_id" uuid NOT NULL,
	"vendor_name" varchar(255) NOT NULL,
	"delivery_document_number" varchar(100),
	"invoice_reference_number" varchar(100),
	"received_date" timestamp with time zone NOT NULL,
	"receiving_department" varchar(150) NOT NULL,
	"store_name" varchar(150) NOT NULL,
	"received_by" varchar(150) NOT NULL,
	"status" varchar(50) DEFAULT 'PENDING_INSPECTION' NOT NULL,
	"total_received_items" integer DEFAULT 0 NOT NULL,
	"total_accepted_items" integer DEFAULT 0 NOT NULL,
	"total_rejected_items" integer DEFAULT 0 NOT NULL,
	"remarks" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "goods_receipts_grn_number_unique" UNIQUE("grn_number")
);
--> statement-breakpoint
CREATE TABLE "clinical"."procurement_approvals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"entity_type" varchar(50) NOT NULL,
	"entity_id" varchar(100) NOT NULL,
	"tier" integer DEFAULT 1 NOT NULL,
	"approver_role" varchar(100) NOT NULL,
	"approver_id" varchar(150) NOT NULL,
	"status" varchar(50) DEFAULT 'PENDING' NOT NULL,
	"comments" text,
	"decided_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clinical"."procurement_audit_traces" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"trace_id" varchar(100) NOT NULL,
	"tenant_id" uuid NOT NULL,
	"partner_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"branch_id" uuid,
	"actor_id" varchar(255) NOT NULL,
	"actor_role" varchar(100) NOT NULL,
	"operation" varchar(100) NOT NULL,
	"entity_type" varchar(50) NOT NULL,
	"entity_id" varchar(100) NOT NULL,
	"purchase_order_id" uuid,
	"goods_receipt_id" uuid,
	"purchase_invoice_id" uuid,
	"vendor_id" uuid,
	"before_snapshot" jsonb,
	"after_snapshot" jsonb,
	"financial_impact" numeric(14, 2) DEFAULT '0.00',
	"reason" text NOT NULL,
	"ip_address" varchar(100),
	"timestamp" timestamp with time zone DEFAULT now() NOT NULL,
	"operation_status" varchar(50) DEFAULT 'SUCCESS' NOT NULL,
	"hash_pointer" varchar(128),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "procurement_audit_traces_trace_id_unique" UNIQUE("trace_id")
);
--> statement-breakpoint
CREATE TABLE "clinical"."procurement_exceptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"partner_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"branch_id" uuid,
	"exception_number" varchar(100) NOT NULL,
	"exception_type" varchar(50) NOT NULL,
	"severity" varchar(50) DEFAULT 'MEDIUM' NOT NULL,
	"status" varchar(50) DEFAULT 'OPEN' NOT NULL,
	"purchase_order_id" uuid,
	"goods_receipt_id" uuid,
	"purchase_invoice_id" uuid,
	"vendor_id" uuid,
	"description" text NOT NULL,
	"variance_amount" numeric(12, 2) DEFAULT '0.00',
	"assigned_to" varchar(150),
	"resolution" text,
	"resolved_by" varchar(150),
	"resolved_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "procurement_exceptions_exception_number_unique" UNIQUE("exception_number")
);
--> statement-breakpoint
CREATE TABLE "clinical"."procurement_inspection_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"inspection_id" uuid NOT NULL,
	"goods_receipt_item_id" uuid NOT NULL,
	"procurement_item_id" uuid NOT NULL,
	"item_code" varchar(50) NOT NULL,
	"item_name" varchar(255) NOT NULL,
	"inspected_quantity" integer NOT NULL,
	"passed_quantity" integer DEFAULT 0 NOT NULL,
	"failed_quantity" integer DEFAULT 0 NOT NULL,
	"quarantined_quantity" integer DEFAULT 0 NOT NULL,
	"defect_category" varchar(100),
	"rejection_reason" text,
	"checklist" jsonb DEFAULT '{}'::jsonb,
	"status" varchar(50) DEFAULT 'PASSED' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clinical"."procurement_inspections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"partner_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"branch_id" uuid,
	"inspection_number" varchar(100) NOT NULL,
	"goods_receipt_id" uuid NOT NULL,
	"grn_number" varchar(100) NOT NULL,
	"inspector_id" varchar(150) NOT NULL,
	"inspection_date" timestamp with time zone NOT NULL,
	"status" varchar(50) DEFAULT 'PASSED' NOT NULL,
	"total_inspected_quantity" integer NOT NULL,
	"total_passed_quantity" integer DEFAULT 0 NOT NULL,
	"total_failed_quantity" integer DEFAULT 0 NOT NULL,
	"total_quarantined_quantity" integer DEFAULT 0 NOT NULL,
	"quarantine_reason" text,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "procurement_inspections_inspection_number_unique" UNIQUE("inspection_number")
);
--> statement-breakpoint
CREATE TABLE "clinical"."procurement_item_vendor_mappings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"procurement_item_id" uuid NOT NULL,
	"vendor_id" uuid NOT NULL,
	"vendor_catalog_number" varchar(100),
	"standard_price" numeric(12, 2) NOT NULL,
	"discount_rate" numeric(5, 2) DEFAULT '0.00',
	"lead_time_days" integer DEFAULT 3,
	"is_preferred" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clinical"."procurement_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"partner_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"branch_id" uuid,
	"item_code" varchar(50) NOT NULL,
	"sku" varchar(50),
	"barcode" varchar(100),
	"item_name" varchar(255) NOT NULL,
	"generic_name" varchar(255),
	"category" varchar(50) DEFAULT 'MEDICINE' NOT NULL,
	"subcategory" varchar(100),
	"unit" varchar(50) DEFAULT 'UNIT' NOT NULL,
	"pack_size" integer DEFAULT 1 NOT NULL,
	"manufacturer" varchar(255),
	"reorder_level" integer DEFAULT 50 NOT NULL,
	"safety_stock" integer DEFAULT 20 NOT NULL,
	"min_stock" integer DEFAULT 10 NOT NULL,
	"max_stock" integer DEFAULT 500 NOT NULL,
	"lead_time_days" integer DEFAULT 3 NOT NULL,
	"standard_cost" numeric(12, 2) DEFAULT '0.00' NOT NULL,
	"is_controlled" boolean DEFAULT false NOT NULL,
	"is_expiry_applicable" boolean DEFAULT true NOT NULL,
	"is_batch_applicable" boolean DEFAULT true NOT NULL,
	"is_serial_applicable" boolean DEFAULT false NOT NULL,
	"medication_catalog_id" uuid,
	"status" varchar(50) DEFAULT 'ACTIVE' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "procurement_items_item_code_unique" UNIQUE("item_code")
);
--> statement-breakpoint
CREATE TABLE "clinical"."procurement_vendor_contacts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"vendor_id" uuid NOT NULL,
	"name" varchar(150) NOT NULL,
	"designation" varchar(100),
	"department" varchar(100),
	"phone" varchar(50),
	"email" varchar(255),
	"is_primary" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clinical"."procurement_vendor_contract_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"contract_id" uuid NOT NULL,
	"item_code" varchar(50) NOT NULL,
	"item_name" varchar(255) NOT NULL,
	"contracted_unit_price" numeric(12, 2) NOT NULL,
	"discount_percentage" numeric(5, 2) DEFAULT '0.00',
	"tax_rate" numeric(5, 2) DEFAULT '0.00',
	"minimum_order_quantity" integer DEFAULT 1,
	"delivery_lead_days" integer DEFAULT 3,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clinical"."procurement_vendor_contracts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"partner_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"branch_id" uuid,
	"vendor_id" uuid NOT NULL,
	"contract_number" varchar(100) NOT NULL,
	"title" varchar(255) NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"effective_date" timestamp with time zone NOT NULL,
	"expiry_date" timestamp with time zone NOT NULL,
	"renewal_date" timestamp with time zone,
	"status" varchar(50) DEFAULT 'ACTIVE' NOT NULL,
	"terms" text,
	"sla_days" integer DEFAULT 2 NOT NULL,
	"total_agreed_value" numeric(14, 2) DEFAULT '0.00',
	"approved_by" varchar(150),
	"approved_at" timestamp with time zone,
	"document_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "procurement_vendor_contracts_contract_number_unique" UNIQUE("contract_number")
);
--> statement-breakpoint
CREATE TABLE "clinical"."procurement_vendor_documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"vendor_id" uuid NOT NULL,
	"document_type" varchar(50) NOT NULL,
	"document_name" varchar(255) NOT NULL,
	"file_url" text NOT NULL,
	"expiry_date" timestamp with time zone,
	"verification_status" varchar(50) DEFAULT 'VERIFIED' NOT NULL,
	"uploaded_by" varchar(150) NOT NULL,
	"uploaded_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clinical"."procurement_vendors" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"partner_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"branch_id" uuid,
	"vendor_code" varchar(50) NOT NULL,
	"legal_name" varchar(255) NOT NULL,
	"trade_name" varchar(255),
	"vendor_category" varchar(50) DEFAULT 'PHARMACEUTICALS' NOT NULL,
	"vendor_type" varchar(50) DEFAULT 'DISTRIBUTOR' NOT NULL,
	"contact_person" varchar(150),
	"contact_email" varchar(255),
	"contact_phone" varchar(50),
	"address" text,
	"tax_id" varchar(100),
	"gst_number" varchar(100),
	"pan_number" varchar(100),
	"bank_details" jsonb DEFAULT '{}'::jsonb,
	"status" varchar(50) DEFAULT 'ACTIVE' NOT NULL,
	"risk_classification" varchar(50) DEFAULT 'LOW_RISK' NOT NULL,
	"rating" numeric(3, 2) DEFAULT '4.50',
	"payment_terms_days" integer DEFAULT 30 NOT NULL,
	"lead_time_days" integer DEFAULT 3 NOT NULL,
	"minimum_order_value" numeric(12, 2) DEFAULT '0.00',
	"delivery_sla_hours" integer DEFAULT 48 NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "procurement_vendors_vendor_code_unique" UNIQUE("vendor_code")
);
--> statement-breakpoint
CREATE TABLE "clinical"."purchase_invoice_matches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"purchase_invoice_id" uuid NOT NULL,
	"purchase_order_id" uuid,
	"goods_receipt_id" uuid,
	"matching_type" varchar(50) DEFAULT 'THREE_WAY' NOT NULL,
	"status" varchar(50) DEFAULT 'EXACT_MATCH' NOT NULL,
	"po_amount" numeric(14, 2) DEFAULT '0.00',
	"grn_amount" numeric(14, 2) DEFAULT '0.00',
	"invoice_amount" numeric(14, 2) NOT NULL,
	"quantity_variance" integer DEFAULT 0,
	"price_variance" numeric(12, 2) DEFAULT '0.00',
	"tax_variance" numeric(12, 2) DEFAULT '0.00',
	"total_variance" numeric(12, 2) DEFAULT '0.00',
	"discrepancy_details" text,
	"matched_by" varchar(150) NOT NULL,
	"matched_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clinical"."purchase_invoices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"partner_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"branch_id" uuid,
	"invoice_number" varchar(100) NOT NULL,
	"vendor_invoice_number" varchar(100) NOT NULL,
	"vendor_id" uuid NOT NULL,
	"vendor_name" varchar(255) NOT NULL,
	"purchase_order_id" uuid,
	"po_number" varchar(100),
	"goods_receipt_id" uuid,
	"grn_number" varchar(100),
	"invoice_date" timestamp with time zone NOT NULL,
	"due_date" timestamp with time zone NOT NULL,
	"subtotal" numeric(14, 2) DEFAULT '0.00' NOT NULL,
	"tax_amount" numeric(14, 2) DEFAULT '0.00' NOT NULL,
	"discount_amount" numeric(14, 2) DEFAULT '0.00' NOT NULL,
	"total_amount" numeric(14, 2) DEFAULT '0.00' NOT NULL,
	"paid_amount" numeric(14, 2) DEFAULT '0.00' NOT NULL,
	"outstanding_amount" numeric(14, 2) DEFAULT '0.00' NOT NULL,
	"matching_status" varchar(50) DEFAULT 'PENDING_MATCH' NOT NULL,
	"payment_status" varchar(50) DEFAULT 'UNPAID' NOT NULL,
	"payment_reference" varchar(100),
	"payment_due_date" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "purchase_invoices_invoice_number_unique" UNIQUE("invoice_number")
);
--> statement-breakpoint
CREATE TABLE "clinical"."purchase_order_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"purchase_order_id" uuid NOT NULL,
	"procurement_item_id" uuid NOT NULL,
	"item_code" varchar(50) NOT NULL,
	"item_name" varchar(255) NOT NULL,
	"ordered_quantity" integer NOT NULL,
	"received_quantity" integer DEFAULT 0 NOT NULL,
	"unit" varchar(50) NOT NULL,
	"unit_price" numeric(12, 2) NOT NULL,
	"gross_amount" numeric(12, 2) NOT NULL,
	"discount_amount" numeric(12, 2) DEFAULT '0.00',
	"tax_amount" numeric(12, 2) DEFAULT '0.00',
	"net_amount" numeric(12, 2) NOT NULL,
	"status" varchar(50) DEFAULT 'PENDING_RECEIPT' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clinical"."purchase_orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"partner_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"branch_id" uuid,
	"po_number" varchar(100) NOT NULL,
	"requisition_id" uuid,
	"requisition_number" varchar(100),
	"vendor_id" uuid NOT NULL,
	"vendor_name" varchar(255) NOT NULL,
	"contract_id" uuid,
	"contract_number" varchar(100),
	"status" varchar(50) DEFAULT 'DRAFT' NOT NULL,
	"total_gross_amount" numeric(14, 2) DEFAULT '0.00' NOT NULL,
	"total_discount_amount" numeric(14, 2) DEFAULT '0.00' NOT NULL,
	"total_tax_amount" numeric(14, 2) DEFAULT '0.00' NOT NULL,
	"total_net_amount" numeric(14, 2) DEFAULT '0.00' NOT NULL,
	"delivery_location" text NOT NULL,
	"expected_delivery_date" timestamp with time zone NOT NULL,
	"payment_terms" varchar(100) DEFAULT 'NET_30' NOT NULL,
	"shipping_terms" varchar(100) DEFAULT 'FOB_DESTINATION',
	"is_emergency" boolean DEFAULT false NOT NULL,
	"approved_by" varchar(150),
	"approved_at" timestamp with time zone,
	"sent_at" timestamp with time zone,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "purchase_orders_po_number_unique" UNIQUE("po_number")
);
--> statement-breakpoint
CREATE TABLE "clinical"."purchase_requisition_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"requisition_id" uuid NOT NULL,
	"procurement_item_id" uuid NOT NULL,
	"item_code" varchar(50) NOT NULL,
	"item_name" varchar(255) NOT NULL,
	"quantity" integer NOT NULL,
	"approved_quantity" integer DEFAULT 0,
	"unit" varchar(50) NOT NULL,
	"estimated_unit_price" numeric(12, 2) NOT NULL,
	"total_estimated_cost" numeric(12, 2) NOT NULL,
	"remarks" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clinical"."purchase_requisitions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"partner_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"branch_id" uuid,
	"requisition_number" varchar(100) NOT NULL,
	"department_id" uuid,
	"department_name" varchar(150) NOT NULL,
	"store_name" varchar(150) NOT NULL,
	"requested_by" varchar(150) NOT NULL,
	"required_by_date" timestamp with time zone NOT NULL,
	"priority" varchar(50) DEFAULT 'ROUTINE' NOT NULL,
	"is_emergency" boolean DEFAULT false NOT NULL,
	"status" varchar(50) DEFAULT 'DRAFT' NOT NULL,
	"total_estimated_amount" numeric(14, 2) DEFAULT '0.00' NOT NULL,
	"reason" text NOT NULL,
	"justification" text,
	"suggested_vendor_id" uuid,
	"suggested_vendor_name" varchar(255),
	"approved_by" varchar(150),
	"approved_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "purchase_requisitions_requisition_number_unique" UNIQUE("requisition_number")
);
--> statement-breakpoint
CREATE TABLE "clinical"."vendor_return_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"vendor_return_id" uuid NOT NULL,
	"procurement_item_id" uuid NOT NULL,
	"item_code" varchar(50) NOT NULL,
	"item_name" varchar(255) NOT NULL,
	"return_quantity" integer NOT NULL,
	"unit_cost" numeric(12, 2) NOT NULL,
	"total_amount" numeric(12, 2) NOT NULL,
	"batch_number" varchar(100),
	"serial_number" varchar(100),
	"reason" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clinical"."vendor_returns" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"partner_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"branch_id" uuid,
	"return_number" varchar(100) NOT NULL,
	"vendor_id" uuid NOT NULL,
	"vendor_name" varchar(255) NOT NULL,
	"goods_receipt_id" uuid,
	"grn_number" varchar(100),
	"purchase_order_id" uuid,
	"po_number" varchar(100),
	"status" varchar(50) DEFAULT 'DRAFT' NOT NULL,
	"total_return_amount" numeric(14, 2) DEFAULT '0.00' NOT NULL,
	"reason" text NOT NULL,
	"vendor_acknowledgement_ref" varchar(100),
	"credit_note_ref" varchar(100),
	"requested_by" varchar(150) NOT NULL,
	"approved_by" varchar(150),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "vendor_returns_return_number_unique" UNIQUE("return_number")
);
--> statement-breakpoint
ALTER TABLE "clinical"."goods_receipt_items" ADD CONSTRAINT "goods_receipt_items_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "core"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."goods_receipt_items" ADD CONSTRAINT "goods_receipt_items_goods_receipt_id_goods_receipts_id_fk" FOREIGN KEY ("goods_receipt_id") REFERENCES "clinical"."goods_receipts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."goods_receipt_items" ADD CONSTRAINT "goods_receipt_items_purchase_order_item_id_purchase_order_items_id_fk" FOREIGN KEY ("purchase_order_item_id") REFERENCES "clinical"."purchase_order_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."goods_receipt_items" ADD CONSTRAINT "goods_receipt_items_procurement_item_id_procurement_items_id_fk" FOREIGN KEY ("procurement_item_id") REFERENCES "clinical"."procurement_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."goods_receipts" ADD CONSTRAINT "goods_receipts_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "core"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."goods_receipts" ADD CONSTRAINT "goods_receipts_partner_id_operational_partners_id_fk" FOREIGN KEY ("partner_id") REFERENCES "clinical"."operational_partners"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."goods_receipts" ADD CONSTRAINT "goods_receipts_organization_id_operational_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "clinical"."operational_organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."goods_receipts" ADD CONSTRAINT "goods_receipts_branch_id_operational_facilities_id_fk" FOREIGN KEY ("branch_id") REFERENCES "clinical"."operational_facilities"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."goods_receipts" ADD CONSTRAINT "goods_receipts_purchase_order_id_purchase_orders_id_fk" FOREIGN KEY ("purchase_order_id") REFERENCES "clinical"."purchase_orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."goods_receipts" ADD CONSTRAINT "goods_receipts_vendor_id_procurement_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "clinical"."procurement_vendors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."procurement_approvals" ADD CONSTRAINT "procurement_approvals_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "core"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."procurement_audit_traces" ADD CONSTRAINT "procurement_audit_traces_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "core"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."procurement_audit_traces" ADD CONSTRAINT "procurement_audit_traces_partner_id_operational_partners_id_fk" FOREIGN KEY ("partner_id") REFERENCES "clinical"."operational_partners"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."procurement_audit_traces" ADD CONSTRAINT "procurement_audit_traces_organization_id_operational_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "clinical"."operational_organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."procurement_audit_traces" ADD CONSTRAINT "procurement_audit_traces_branch_id_operational_facilities_id_fk" FOREIGN KEY ("branch_id") REFERENCES "clinical"."operational_facilities"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."procurement_audit_traces" ADD CONSTRAINT "procurement_audit_traces_purchase_order_id_purchase_orders_id_fk" FOREIGN KEY ("purchase_order_id") REFERENCES "clinical"."purchase_orders"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."procurement_audit_traces" ADD CONSTRAINT "procurement_audit_traces_goods_receipt_id_goods_receipts_id_fk" FOREIGN KEY ("goods_receipt_id") REFERENCES "clinical"."goods_receipts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."procurement_audit_traces" ADD CONSTRAINT "procurement_audit_traces_purchase_invoice_id_purchase_invoices_id_fk" FOREIGN KEY ("purchase_invoice_id") REFERENCES "clinical"."purchase_invoices"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."procurement_audit_traces" ADD CONSTRAINT "procurement_audit_traces_vendor_id_procurement_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "clinical"."procurement_vendors"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."procurement_exceptions" ADD CONSTRAINT "procurement_exceptions_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "core"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."procurement_exceptions" ADD CONSTRAINT "procurement_exceptions_partner_id_operational_partners_id_fk" FOREIGN KEY ("partner_id") REFERENCES "clinical"."operational_partners"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."procurement_exceptions" ADD CONSTRAINT "procurement_exceptions_organization_id_operational_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "clinical"."operational_organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."procurement_exceptions" ADD CONSTRAINT "procurement_exceptions_branch_id_operational_facilities_id_fk" FOREIGN KEY ("branch_id") REFERENCES "clinical"."operational_facilities"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."procurement_exceptions" ADD CONSTRAINT "procurement_exceptions_purchase_order_id_purchase_orders_id_fk" FOREIGN KEY ("purchase_order_id") REFERENCES "clinical"."purchase_orders"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."procurement_exceptions" ADD CONSTRAINT "procurement_exceptions_goods_receipt_id_goods_receipts_id_fk" FOREIGN KEY ("goods_receipt_id") REFERENCES "clinical"."goods_receipts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."procurement_exceptions" ADD CONSTRAINT "procurement_exceptions_purchase_invoice_id_purchase_invoices_id_fk" FOREIGN KEY ("purchase_invoice_id") REFERENCES "clinical"."purchase_invoices"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."procurement_exceptions" ADD CONSTRAINT "procurement_exceptions_vendor_id_procurement_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "clinical"."procurement_vendors"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."procurement_inspection_items" ADD CONSTRAINT "procurement_inspection_items_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "core"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."procurement_inspection_items" ADD CONSTRAINT "procurement_inspection_items_inspection_id_procurement_inspections_id_fk" FOREIGN KEY ("inspection_id") REFERENCES "clinical"."procurement_inspections"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."procurement_inspection_items" ADD CONSTRAINT "procurement_inspection_items_goods_receipt_item_id_goods_receipt_items_id_fk" FOREIGN KEY ("goods_receipt_item_id") REFERENCES "clinical"."goods_receipt_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."procurement_inspection_items" ADD CONSTRAINT "procurement_inspection_items_procurement_item_id_procurement_items_id_fk" FOREIGN KEY ("procurement_item_id") REFERENCES "clinical"."procurement_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."procurement_inspections" ADD CONSTRAINT "procurement_inspections_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "core"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."procurement_inspections" ADD CONSTRAINT "procurement_inspections_partner_id_operational_partners_id_fk" FOREIGN KEY ("partner_id") REFERENCES "clinical"."operational_partners"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."procurement_inspections" ADD CONSTRAINT "procurement_inspections_organization_id_operational_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "clinical"."operational_organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."procurement_inspections" ADD CONSTRAINT "procurement_inspections_branch_id_operational_facilities_id_fk" FOREIGN KEY ("branch_id") REFERENCES "clinical"."operational_facilities"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."procurement_inspections" ADD CONSTRAINT "procurement_inspections_goods_receipt_id_goods_receipts_id_fk" FOREIGN KEY ("goods_receipt_id") REFERENCES "clinical"."goods_receipts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."procurement_item_vendor_mappings" ADD CONSTRAINT "procurement_item_vendor_mappings_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "core"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."procurement_item_vendor_mappings" ADD CONSTRAINT "procurement_item_vendor_mappings_procurement_item_id_procurement_items_id_fk" FOREIGN KEY ("procurement_item_id") REFERENCES "clinical"."procurement_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."procurement_item_vendor_mappings" ADD CONSTRAINT "procurement_item_vendor_mappings_vendor_id_procurement_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "clinical"."procurement_vendors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."procurement_items" ADD CONSTRAINT "procurement_items_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "core"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."procurement_items" ADD CONSTRAINT "procurement_items_partner_id_operational_partners_id_fk" FOREIGN KEY ("partner_id") REFERENCES "clinical"."operational_partners"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."procurement_items" ADD CONSTRAINT "procurement_items_organization_id_operational_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "clinical"."operational_organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."procurement_items" ADD CONSTRAINT "procurement_items_branch_id_operational_facilities_id_fk" FOREIGN KEY ("branch_id") REFERENCES "clinical"."operational_facilities"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."procurement_items" ADD CONSTRAINT "procurement_items_medication_catalog_id_medication_catalog_id_fk" FOREIGN KEY ("medication_catalog_id") REFERENCES "clinical"."medication_catalog"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."procurement_vendor_contacts" ADD CONSTRAINT "procurement_vendor_contacts_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "core"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."procurement_vendor_contacts" ADD CONSTRAINT "procurement_vendor_contacts_vendor_id_procurement_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "clinical"."procurement_vendors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."procurement_vendor_contract_items" ADD CONSTRAINT "procurement_vendor_contract_items_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "core"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."procurement_vendor_contract_items" ADD CONSTRAINT "procurement_vendor_contract_items_contract_id_procurement_vendor_contracts_id_fk" FOREIGN KEY ("contract_id") REFERENCES "clinical"."procurement_vendor_contracts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."procurement_vendor_contracts" ADD CONSTRAINT "procurement_vendor_contracts_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "core"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."procurement_vendor_contracts" ADD CONSTRAINT "procurement_vendor_contracts_partner_id_operational_partners_id_fk" FOREIGN KEY ("partner_id") REFERENCES "clinical"."operational_partners"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."procurement_vendor_contracts" ADD CONSTRAINT "procurement_vendor_contracts_organization_id_operational_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "clinical"."operational_organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."procurement_vendor_contracts" ADD CONSTRAINT "procurement_vendor_contracts_branch_id_operational_facilities_id_fk" FOREIGN KEY ("branch_id") REFERENCES "clinical"."operational_facilities"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."procurement_vendor_contracts" ADD CONSTRAINT "procurement_vendor_contracts_vendor_id_procurement_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "clinical"."procurement_vendors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."procurement_vendor_documents" ADD CONSTRAINT "procurement_vendor_documents_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "core"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."procurement_vendor_documents" ADD CONSTRAINT "procurement_vendor_documents_vendor_id_procurement_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "clinical"."procurement_vendors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."procurement_vendors" ADD CONSTRAINT "procurement_vendors_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "core"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."procurement_vendors" ADD CONSTRAINT "procurement_vendors_partner_id_operational_partners_id_fk" FOREIGN KEY ("partner_id") REFERENCES "clinical"."operational_partners"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."procurement_vendors" ADD CONSTRAINT "procurement_vendors_organization_id_operational_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "clinical"."operational_organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."procurement_vendors" ADD CONSTRAINT "procurement_vendors_branch_id_operational_facilities_id_fk" FOREIGN KEY ("branch_id") REFERENCES "clinical"."operational_facilities"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."purchase_invoice_matches" ADD CONSTRAINT "purchase_invoice_matches_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "core"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."purchase_invoice_matches" ADD CONSTRAINT "purchase_invoice_matches_purchase_invoice_id_purchase_invoices_id_fk" FOREIGN KEY ("purchase_invoice_id") REFERENCES "clinical"."purchase_invoices"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."purchase_invoice_matches" ADD CONSTRAINT "purchase_invoice_matches_purchase_order_id_purchase_orders_id_fk" FOREIGN KEY ("purchase_order_id") REFERENCES "clinical"."purchase_orders"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."purchase_invoice_matches" ADD CONSTRAINT "purchase_invoice_matches_goods_receipt_id_goods_receipts_id_fk" FOREIGN KEY ("goods_receipt_id") REFERENCES "clinical"."goods_receipts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."purchase_invoices" ADD CONSTRAINT "purchase_invoices_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "core"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."purchase_invoices" ADD CONSTRAINT "purchase_invoices_partner_id_operational_partners_id_fk" FOREIGN KEY ("partner_id") REFERENCES "clinical"."operational_partners"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."purchase_invoices" ADD CONSTRAINT "purchase_invoices_organization_id_operational_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "clinical"."operational_organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."purchase_invoices" ADD CONSTRAINT "purchase_invoices_branch_id_operational_facilities_id_fk" FOREIGN KEY ("branch_id") REFERENCES "clinical"."operational_facilities"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."purchase_invoices" ADD CONSTRAINT "purchase_invoices_vendor_id_procurement_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "clinical"."procurement_vendors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."purchase_invoices" ADD CONSTRAINT "purchase_invoices_purchase_order_id_purchase_orders_id_fk" FOREIGN KEY ("purchase_order_id") REFERENCES "clinical"."purchase_orders"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."purchase_invoices" ADD CONSTRAINT "purchase_invoices_goods_receipt_id_goods_receipts_id_fk" FOREIGN KEY ("goods_receipt_id") REFERENCES "clinical"."goods_receipts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."purchase_order_items" ADD CONSTRAINT "purchase_order_items_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "core"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."purchase_order_items" ADD CONSTRAINT "purchase_order_items_purchase_order_id_purchase_orders_id_fk" FOREIGN KEY ("purchase_order_id") REFERENCES "clinical"."purchase_orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."purchase_order_items" ADD CONSTRAINT "purchase_order_items_procurement_item_id_procurement_items_id_fk" FOREIGN KEY ("procurement_item_id") REFERENCES "clinical"."procurement_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."purchase_orders" ADD CONSTRAINT "purchase_orders_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "core"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."purchase_orders" ADD CONSTRAINT "purchase_orders_partner_id_operational_partners_id_fk" FOREIGN KEY ("partner_id") REFERENCES "clinical"."operational_partners"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."purchase_orders" ADD CONSTRAINT "purchase_orders_organization_id_operational_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "clinical"."operational_organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."purchase_orders" ADD CONSTRAINT "purchase_orders_branch_id_operational_facilities_id_fk" FOREIGN KEY ("branch_id") REFERENCES "clinical"."operational_facilities"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."purchase_orders" ADD CONSTRAINT "purchase_orders_requisition_id_purchase_requisitions_id_fk" FOREIGN KEY ("requisition_id") REFERENCES "clinical"."purchase_requisitions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."purchase_orders" ADD CONSTRAINT "purchase_orders_vendor_id_procurement_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "clinical"."procurement_vendors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."purchase_orders" ADD CONSTRAINT "purchase_orders_contract_id_procurement_vendor_contracts_id_fk" FOREIGN KEY ("contract_id") REFERENCES "clinical"."procurement_vendor_contracts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."purchase_requisition_items" ADD CONSTRAINT "purchase_requisition_items_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "core"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."purchase_requisition_items" ADD CONSTRAINT "purchase_requisition_items_requisition_id_purchase_requisitions_id_fk" FOREIGN KEY ("requisition_id") REFERENCES "clinical"."purchase_requisitions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."purchase_requisition_items" ADD CONSTRAINT "purchase_requisition_items_procurement_item_id_procurement_items_id_fk" FOREIGN KEY ("procurement_item_id") REFERENCES "clinical"."procurement_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."purchase_requisitions" ADD CONSTRAINT "purchase_requisitions_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "core"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."purchase_requisitions" ADD CONSTRAINT "purchase_requisitions_partner_id_operational_partners_id_fk" FOREIGN KEY ("partner_id") REFERENCES "clinical"."operational_partners"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."purchase_requisitions" ADD CONSTRAINT "purchase_requisitions_organization_id_operational_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "clinical"."operational_organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."purchase_requisitions" ADD CONSTRAINT "purchase_requisitions_branch_id_operational_facilities_id_fk" FOREIGN KEY ("branch_id") REFERENCES "clinical"."operational_facilities"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."purchase_requisitions" ADD CONSTRAINT "purchase_requisitions_department_id_operational_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "clinical"."operational_departments"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."purchase_requisitions" ADD CONSTRAINT "purchase_requisitions_suggested_vendor_id_procurement_vendors_id_fk" FOREIGN KEY ("suggested_vendor_id") REFERENCES "clinical"."procurement_vendors"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."vendor_return_items" ADD CONSTRAINT "vendor_return_items_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "core"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."vendor_return_items" ADD CONSTRAINT "vendor_return_items_vendor_return_id_vendor_returns_id_fk" FOREIGN KEY ("vendor_return_id") REFERENCES "clinical"."vendor_returns"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."vendor_return_items" ADD CONSTRAINT "vendor_return_items_procurement_item_id_procurement_items_id_fk" FOREIGN KEY ("procurement_item_id") REFERENCES "clinical"."procurement_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."vendor_returns" ADD CONSTRAINT "vendor_returns_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "core"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."vendor_returns" ADD CONSTRAINT "vendor_returns_partner_id_operational_partners_id_fk" FOREIGN KEY ("partner_id") REFERENCES "clinical"."operational_partners"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."vendor_returns" ADD CONSTRAINT "vendor_returns_organization_id_operational_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "clinical"."operational_organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."vendor_returns" ADD CONSTRAINT "vendor_returns_branch_id_operational_facilities_id_fk" FOREIGN KEY ("branch_id") REFERENCES "clinical"."operational_facilities"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."vendor_returns" ADD CONSTRAINT "vendor_returns_vendor_id_procurement_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "clinical"."procurement_vendors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."vendor_returns" ADD CONSTRAINT "vendor_returns_goods_receipt_id_goods_receipts_id_fk" FOREIGN KEY ("goods_receipt_id") REFERENCES "clinical"."goods_receipts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."vendor_returns" ADD CONSTRAINT "vendor_returns_purchase_order_id_purchase_orders_id_fk" FOREIGN KEY ("purchase_order_id") REFERENCES "clinical"."purchase_orders"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_proc_gritem_tenant" ON "clinical"."goods_receipt_items" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_proc_gritem_grn" ON "clinical"."goods_receipt_items" USING btree ("goods_receipt_id");--> statement-breakpoint
CREATE INDEX "idx_proc_grn_tenant" ON "clinical"."goods_receipts" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_proc_grn_org" ON "clinical"."goods_receipts" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_proc_grn_num" ON "clinical"."goods_receipts" USING btree ("grn_number");--> statement-breakpoint
CREATE INDEX "idx_proc_grn_po" ON "clinical"."goods_receipts" USING btree ("purchase_order_id");--> statement-breakpoint
CREATE INDEX "idx_proc_grn_status" ON "clinical"."goods_receipts" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_proc_appr_tenant" ON "clinical"."procurement_approvals" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_proc_appr_entity" ON "clinical"."procurement_approvals" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "idx_proc_appr_status" ON "clinical"."procurement_approvals" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_proc_audit_tenant" ON "clinical"."procurement_audit_traces" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_proc_audit_trace" ON "clinical"."procurement_audit_traces" USING btree ("trace_id");--> statement-breakpoint
CREATE INDEX "idx_proc_audit_entity" ON "clinical"."procurement_audit_traces" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "idx_proc_audit_po" ON "clinical"."procurement_audit_traces" USING btree ("purchase_order_id");--> statement-breakpoint
CREATE INDEX "idx_proc_audit_op" ON "clinical"."procurement_audit_traces" USING btree ("operation");--> statement-breakpoint
CREATE INDEX "idx_proc_exc_tenant" ON "clinical"."procurement_exceptions" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_proc_exc_org" ON "clinical"."procurement_exceptions" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_proc_exc_num" ON "clinical"."procurement_exceptions" USING btree ("exception_number");--> statement-breakpoint
CREATE INDEX "idx_proc_exc_type" ON "clinical"."procurement_exceptions" USING btree ("exception_type");--> statement-breakpoint
CREATE INDEX "idx_proc_exc_status" ON "clinical"."procurement_exceptions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_proc_qcitem_tenant" ON "clinical"."procurement_inspection_items" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_proc_qcitem_qc" ON "clinical"."procurement_inspection_items" USING btree ("inspection_id");--> statement-breakpoint
CREATE INDEX "idx_proc_qc_tenant" ON "clinical"."procurement_inspections" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_proc_qc_org" ON "clinical"."procurement_inspections" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_proc_qc_grn" ON "clinical"."procurement_inspections" USING btree ("goods_receipt_id");--> statement-breakpoint
CREATE INDEX "idx_proc_qc_status" ON "clinical"."procurement_inspections" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_proc_ivmap_tenant" ON "clinical"."procurement_item_vendor_mappings" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_proc_ivmap_item" ON "clinical"."procurement_item_vendor_mappings" USING btree ("procurement_item_id");--> statement-breakpoint
CREATE INDEX "idx_proc_ivmap_vendor" ON "clinical"."procurement_item_vendor_mappings" USING btree ("vendor_id");--> statement-breakpoint
CREATE INDEX "idx_proc_item_tenant" ON "clinical"."procurement_items" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_proc_item_org" ON "clinical"."procurement_items" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_proc_item_code" ON "clinical"."procurement_items" USING btree ("item_code");--> statement-breakpoint
CREATE INDEX "idx_proc_item_cat" ON "clinical"."procurement_items" USING btree ("category");--> statement-breakpoint
CREATE INDEX "idx_proc_item_status" ON "clinical"."procurement_items" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_proc_vcontact_tenant" ON "clinical"."procurement_vendor_contacts" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_proc_vcontact_vendor" ON "clinical"."procurement_vendor_contacts" USING btree ("vendor_id");--> statement-breakpoint
CREATE INDEX "idx_proc_vcitem_tenant" ON "clinical"."procurement_vendor_contract_items" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_proc_vcitem_contract" ON "clinical"."procurement_vendor_contract_items" USING btree ("contract_id");--> statement-breakpoint
CREATE INDEX "idx_proc_vcontract_tenant" ON "clinical"."procurement_vendor_contracts" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_proc_vcontract_org" ON "clinical"."procurement_vendor_contracts" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_proc_vcontract_vendor" ON "clinical"."procurement_vendor_contracts" USING btree ("vendor_id");--> statement-breakpoint
CREATE INDEX "idx_proc_vcontract_status" ON "clinical"."procurement_vendor_contracts" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_proc_vdoc_tenant" ON "clinical"."procurement_vendor_documents" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_proc_vdoc_vendor" ON "clinical"."procurement_vendor_documents" USING btree ("vendor_id");--> statement-breakpoint
CREATE INDEX "idx_proc_vendor_tenant" ON "clinical"."procurement_vendors" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_proc_vendor_org" ON "clinical"."procurement_vendors" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_proc_vendor_code" ON "clinical"."procurement_vendors" USING btree ("vendor_code");--> statement-breakpoint
CREATE INDEX "idx_proc_vendor_category" ON "clinical"."procurement_vendors" USING btree ("vendor_category");--> statement-breakpoint
CREATE INDEX "idx_proc_vendor_status" ON "clinical"."procurement_vendors" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_proc_match_tenant" ON "clinical"."purchase_invoice_matches" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_proc_match_pinv" ON "clinical"."purchase_invoice_matches" USING btree ("purchase_invoice_id");--> statement-breakpoint
CREATE INDEX "idx_proc_match_status" ON "clinical"."purchase_invoice_matches" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_proc_pinv_tenant" ON "clinical"."purchase_invoices" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_proc_pinv_org" ON "clinical"."purchase_invoices" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_proc_pinv_num" ON "clinical"."purchase_invoices" USING btree ("invoice_number");--> statement-breakpoint
CREATE INDEX "idx_proc_pinv_vendor" ON "clinical"."purchase_invoices" USING btree ("vendor_id");--> statement-breakpoint
CREATE INDEX "idx_proc_pinv_status" ON "clinical"."purchase_invoices" USING btree ("payment_status");--> statement-breakpoint
CREATE INDEX "idx_proc_pinv_match" ON "clinical"."purchase_invoices" USING btree ("matching_status");--> statement-breakpoint
CREATE INDEX "idx_proc_poitem_tenant" ON "clinical"."purchase_order_items" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_proc_poitem_po" ON "clinical"."purchase_order_items" USING btree ("purchase_order_id");--> statement-breakpoint
CREATE INDEX "idx_proc_po_tenant" ON "clinical"."purchase_orders" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_proc_po_org" ON "clinical"."purchase_orders" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_proc_po_num" ON "clinical"."purchase_orders" USING btree ("po_number");--> statement-breakpoint
CREATE INDEX "idx_proc_po_vendor" ON "clinical"."purchase_orders" USING btree ("vendor_id");--> statement-breakpoint
CREATE INDEX "idx_proc_po_status" ON "clinical"."purchase_orders" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_proc_reqitem_tenant" ON "clinical"."purchase_requisition_items" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_proc_reqitem_req" ON "clinical"."purchase_requisition_items" USING btree ("requisition_id");--> statement-breakpoint
CREATE INDEX "idx_proc_req_tenant" ON "clinical"."purchase_requisitions" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_proc_req_org" ON "clinical"."purchase_requisitions" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_proc_req_num" ON "clinical"."purchase_requisitions" USING btree ("requisition_number");--> statement-breakpoint
CREATE INDEX "idx_proc_req_status" ON "clinical"."purchase_requisitions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_proc_req_priority" ON "clinical"."purchase_requisitions" USING btree ("priority");--> statement-breakpoint
CREATE INDEX "idx_proc_rtvitem_tenant" ON "clinical"."vendor_return_items" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_proc_rtvitem_rtv" ON "clinical"."vendor_return_items" USING btree ("vendor_return_id");--> statement-breakpoint
CREATE INDEX "idx_proc_rtv_tenant" ON "clinical"."vendor_returns" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_proc_rtv_org" ON "clinical"."vendor_returns" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_proc_rtv_num" ON "clinical"."vendor_returns" USING btree ("return_number");--> statement-breakpoint
CREATE INDEX "idx_proc_rtv_vendor" ON "clinical"."vendor_returns" USING btree ("vendor_id");--> statement-breakpoint
CREATE INDEX "idx_proc_rtv_status" ON "clinical"."vendor_returns" USING btree ("status");