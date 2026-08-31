CREATE TABLE "clinical"."operational_audit_traces" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"trace_id" varchar(100) NOT NULL,
	"tenant_id" uuid NOT NULL,
	"partner_id" uuid NOT NULL,
	"organization_id" uuid,
	"branch_id" uuid,
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
	CONSTRAINT "operational_audit_traces_trace_id_unique" UNIQUE("trace_id")
);
--> statement-breakpoint
CREATE TABLE "clinical"."operational_facilities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"partner_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"facility_code" varchar(100) NOT NULL,
	"facility_name" varchar(255) NOT NULL,
	"facility_type" varchar(50) DEFAULT 'OUTPATIENT_CLINIC' NOT NULL,
	"address_street" text NOT NULL,
	"address_city" varchar(100) NOT NULL,
	"address_state" varchar(100) NOT NULL,
	"address_postal_code" varchar(20) NOT NULL,
	"address_country" varchar(100) DEFAULT 'US' NOT NULL,
	"contact_email" varchar(255) NOT NULL,
	"contact_phone" varchar(50) NOT NULL,
	"status" varchar(50) DEFAULT 'ACTIVE' NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "operational_facilities_facility_code_unique" UNIQUE("facility_code")
);
--> statement-breakpoint
CREATE TABLE "clinical"."operational_organizations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"partner_id" uuid NOT NULL,
	"organization_code" varchar(100) NOT NULL,
	"organization_name" varchar(255) NOT NULL,
	"organization_type" varchar(50) DEFAULT 'CLINIC' NOT NULL,
	"legal_entity_reference" varchar(255),
	"contact_email" varchar(255) NOT NULL,
	"contact_phone" varchar(50),
	"status" varchar(50) DEFAULT 'ACTIVE' NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "operational_organizations_organization_code_unique" UNIQUE("organization_code")
);
--> statement-breakpoint
CREATE TABLE "clinical"."operational_partners" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"partner_code" varchar(100) NOT NULL,
	"legal_business_name" varchar(255) NOT NULL,
	"partner_type" varchar(50) DEFAULT 'CLINIC_NETWORK' NOT NULL,
	"contact_email" varchar(255) NOT NULL,
	"contact_phone" varchar(50),
	"status" varchar(50) DEFAULT 'ONBOARDING' NOT NULL,
	"onboarding_metadata" jsonb DEFAULT '{}'::jsonb,
	"contract_reference" varchar(255),
	"subscription_reference" varchar(255),
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "operational_partners_partner_code_unique" UNIQUE("partner_code")
);
--> statement-breakpoint
CREATE TABLE "clinical"."operational_subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"partner_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"plan_reference" varchar(100) NOT NULL,
	"enabled_modules" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"entitlement_status" varchar(50) DEFAULT 'ACTIVE' NOT NULL,
	"effective_date" timestamp with time zone NOT NULL,
	"expiry_date" timestamp with time zone,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "clinical"."operational_audit_traces" ADD CONSTRAINT "operational_audit_traces_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "core"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."operational_audit_traces" ADD CONSTRAINT "operational_audit_traces_partner_id_operational_partners_id_fk" FOREIGN KEY ("partner_id") REFERENCES "clinical"."operational_partners"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."operational_audit_traces" ADD CONSTRAINT "operational_audit_traces_organization_id_operational_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "clinical"."operational_organizations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."operational_audit_traces" ADD CONSTRAINT "operational_audit_traces_branch_id_operational_facilities_id_fk" FOREIGN KEY ("branch_id") REFERENCES "clinical"."operational_facilities"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."operational_facilities" ADD CONSTRAINT "operational_facilities_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "core"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."operational_facilities" ADD CONSTRAINT "operational_facilities_partner_id_operational_partners_id_fk" FOREIGN KEY ("partner_id") REFERENCES "clinical"."operational_partners"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."operational_facilities" ADD CONSTRAINT "operational_facilities_organization_id_operational_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "clinical"."operational_organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."operational_organizations" ADD CONSTRAINT "operational_organizations_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "core"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."operational_organizations" ADD CONSTRAINT "operational_organizations_partner_id_operational_partners_id_fk" FOREIGN KEY ("partner_id") REFERENCES "clinical"."operational_partners"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."operational_partners" ADD CONSTRAINT "operational_partners_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "core"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."operational_subscriptions" ADD CONSTRAINT "operational_subscriptions_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "core"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."operational_subscriptions" ADD CONSTRAINT "operational_subscriptions_partner_id_operational_partners_id_fk" FOREIGN KEY ("partner_id") REFERENCES "clinical"."operational_partners"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical"."operational_subscriptions" ADD CONSTRAINT "operational_subscriptions_organization_id_operational_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "clinical"."operational_organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_op_audit_tenant" ON "clinical"."operational_audit_traces" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_op_audit_partner" ON "clinical"."operational_audit_traces" USING btree ("partner_id");--> statement-breakpoint
CREATE INDEX "idx_op_audit_org" ON "clinical"."operational_audit_traces" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_op_audit_branch" ON "clinical"."operational_audit_traces" USING btree ("branch_id");--> statement-breakpoint
CREATE INDEX "idx_op_audit_status" ON "clinical"."operational_audit_traces" USING btree ("operation_status");--> statement-breakpoint
CREATE INDEX "idx_op_audit_occurred" ON "clinical"."operational_audit_traces" USING btree ("occurred_at");--> statement-breakpoint
CREATE INDEX "idx_op_facilities_tenant" ON "clinical"."operational_facilities" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_op_facilities_partner" ON "clinical"."operational_facilities" USING btree ("partner_id");--> statement-breakpoint
CREATE INDEX "idx_op_facilities_org" ON "clinical"."operational_facilities" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_op_facilities_status" ON "clinical"."operational_facilities" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_op_facilities_type" ON "clinical"."operational_facilities" USING btree ("facility_type");--> statement-breakpoint
CREATE INDEX "idx_op_orgs_tenant" ON "clinical"."operational_organizations" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_op_orgs_partner" ON "clinical"."operational_organizations" USING btree ("partner_id");--> statement-breakpoint
CREATE INDEX "idx_op_orgs_type" ON "clinical"."operational_organizations" USING btree ("organization_type");--> statement-breakpoint
CREATE INDEX "idx_op_orgs_status" ON "clinical"."operational_organizations" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_op_partners_tenant" ON "clinical"."operational_partners" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_op_partners_status" ON "clinical"."operational_partners" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_op_partners_type" ON "clinical"."operational_partners" USING btree ("partner_type");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_op_sub_org" ON "clinical"."operational_subscriptions" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_op_sub_tenant" ON "clinical"."operational_subscriptions" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_op_sub_partner" ON "clinical"."operational_subscriptions" USING btree ("partner_id");--> statement-breakpoint
CREATE INDEX "idx_op_sub_status" ON "clinical"."operational_subscriptions" USING btree ("entitlement_status");