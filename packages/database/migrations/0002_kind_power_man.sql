CREATE TABLE "company"."features" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" varchar(50) NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text NOT NULL,
	"category" varchar(50) DEFAULT 'MODULE_ACCESS' NOT NULL,
	"status" varchar(50) DEFAULT 'ACTIVE' NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "company"."partner_plan_assignments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"partner_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"plan_id" uuid NOT NULL,
	"assignment_status" varchar(50) DEFAULT 'ACTIVE' NOT NULL,
	"effective_date" timestamp with time zone DEFAULT now() NOT NULL,
	"expiration_date" timestamp with time zone,
	"assigned_by_id" uuid,
	"assigned_by_email" varchar(255) NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "company"."plan_entitlements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"plan_id" uuid NOT NULL,
	"feature_id" uuid NOT NULL,
	"entitlement_type" varchar(50) DEFAULT 'FEATURE_ACCESS' NOT NULL,
	"value" jsonb NOT NULL,
	"status" varchar(50) DEFAULT 'ACTIVE' NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "company"."plans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"code" varchar(50) NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text NOT NULL,
	"status" varchar(50) DEFAULT 'DRAFT' NOT NULL,
	"version" varchar(20) DEFAULT '1.0.0' NOT NULL,
	"effective_date" timestamp with time zone,
	"expiration_date" timestamp with time zone,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "company"."products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" varchar(50) NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text NOT NULL,
	"category" varchar(50) DEFAULT 'CORE_PLATFORM' NOT NULL,
	"status" varchar(50) DEFAULT 'DRAFT' NOT NULL,
	"version" varchar(20) DEFAULT '1.0.0' NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "company"."partner_plan_assignments" ADD CONSTRAINT "partner_plan_assignments_partner_id_partner_profiles_id_fk" FOREIGN KEY ("partner_id") REFERENCES "company"."partner_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company"."partner_plan_assignments" ADD CONSTRAINT "partner_plan_assignments_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "company"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company"."partner_plan_assignments" ADD CONSTRAINT "partner_plan_assignments_plan_id_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "company"."plans"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company"."partner_plan_assignments" ADD CONSTRAINT "partner_plan_assignments_assigned_by_id_users_id_fk" FOREIGN KEY ("assigned_by_id") REFERENCES "core"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company"."plan_entitlements" ADD CONSTRAINT "plan_entitlements_plan_id_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "company"."plans"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company"."plan_entitlements" ADD CONSTRAINT "plan_entitlements_feature_id_features_id_fk" FOREIGN KEY ("feature_id") REFERENCES "company"."features"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company"."plans" ADD CONSTRAINT "plans_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "company"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "uq_features_code" ON "company"."features" USING btree ("code");--> statement-breakpoint
CREATE INDEX "idx_features_category" ON "company"."features" USING btree ("category");--> statement-breakpoint
CREATE INDEX "idx_features_status" ON "company"."features" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_partner_plan_assignments_partner_product" ON "company"."partner_plan_assignments" USING btree ("partner_id","product_id");--> statement-breakpoint
CREATE INDEX "idx_partner_plan_partner_id" ON "company"."partner_plan_assignments" USING btree ("partner_id");--> statement-breakpoint
CREATE INDEX "idx_partner_plan_plan_id" ON "company"."partner_plan_assignments" USING btree ("plan_id");--> statement-breakpoint
CREATE INDEX "idx_partner_plan_status" ON "company"."partner_plan_assignments" USING btree ("assignment_status");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_plan_entitlements_plan_feature" ON "company"."plan_entitlements" USING btree ("plan_id","feature_id");--> statement-breakpoint
CREATE INDEX "idx_plan_entitlements_plan_id" ON "company"."plan_entitlements" USING btree ("plan_id");--> statement-breakpoint
CREATE INDEX "idx_plan_entitlements_feature_id" ON "company"."plan_entitlements" USING btree ("feature_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_plans_product_code_version" ON "company"."plans" USING btree ("product_id","code","version");--> statement-breakpoint
CREATE INDEX "idx_plans_product_id" ON "company"."plans" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "idx_plans_status" ON "company"."plans" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_products_code" ON "company"."products" USING btree ("code");--> statement-breakpoint
CREATE INDEX "idx_products_status" ON "company"."products" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_products_category" ON "company"."products" USING btree ("category");