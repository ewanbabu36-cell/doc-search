CREATE TABLE "company"."marketing_activities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"campaign_id" uuid,
	"partner_id" uuid,
	"lead_id" uuid,
	"activity_type" varchar(50) NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text NOT NULL,
	"recorded_by_email" varchar(255) NOT NULL,
	"activity_date" timestamp with time zone DEFAULT now() NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "company"."marketing_campaigns" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"type" varchar(50) DEFAULT 'ENTERPRISE_HOSPITAL_OUTREACH' NOT NULL,
	"status" varchar(50) DEFAULT 'DRAFT' NOT NULL,
	"target_segment" varchar(255) NOT NULL,
	"start_date" timestamp with time zone,
	"end_date" timestamp with time zone,
	"owner_id" uuid,
	"owner_email" varchar(255) NOT NULL,
	"description" text NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "company"."sales_leads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_name" varchar(255) NOT NULL,
	"contact_name" varchar(100) NOT NULL,
	"contact_email" varchar(255) NOT NULL,
	"contact_phone" varchar(50),
	"contact_role_title" varchar(100),
	"source" varchar(50) DEFAULT 'INBOUND_WEB' NOT NULL,
	"status" varchar(50) DEFAULT 'NEW' NOT NULL,
	"assigned_owner_id" uuid,
	"assigned_owner_email" varchar(255) NOT NULL,
	"notes" text,
	"next_follow_up_date" timestamp with time zone,
	"last_activity_date" timestamp with time zone,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "company"."sales_opportunities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"partner_id" uuid,
	"lead_id" uuid,
	"product_id" uuid,
	"target_plan_id" uuid,
	"stage" varchar(50) DEFAULT 'QUALIFICATION' NOT NULL,
	"priority" varchar(50) DEFAULT 'MEDIUM' NOT NULL,
	"assigned_owner_id" uuid,
	"assigned_owner_email" varchar(255) NOT NULL,
	"expected_close_date" timestamp with time zone,
	"next_action" text,
	"lost_reason" text,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "company"."sales_tasks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(255) NOT NULL,
	"lead_id" uuid,
	"opportunity_id" uuid,
	"partner_id" uuid,
	"assigned_user_id" uuid,
	"assigned_user_email" varchar(255) NOT NULL,
	"priority" varchar(50) DEFAULT 'MEDIUM' NOT NULL,
	"due_date" timestamp with time zone NOT NULL,
	"status" varchar(50) DEFAULT 'OPEN' NOT NULL,
	"completion_date" timestamp with time zone,
	"notes" text,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "company"."marketing_activities" ADD CONSTRAINT "marketing_activities_campaign_id_marketing_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "company"."marketing_campaigns"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company"."marketing_activities" ADD CONSTRAINT "marketing_activities_partner_id_partner_profiles_id_fk" FOREIGN KEY ("partner_id") REFERENCES "company"."partner_profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company"."marketing_activities" ADD CONSTRAINT "marketing_activities_lead_id_sales_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "company"."sales_leads"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company"."marketing_campaigns" ADD CONSTRAINT "marketing_campaigns_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "core"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company"."sales_leads" ADD CONSTRAINT "sales_leads_assigned_owner_id_users_id_fk" FOREIGN KEY ("assigned_owner_id") REFERENCES "core"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company"."sales_opportunities" ADD CONSTRAINT "sales_opportunities_partner_id_partner_profiles_id_fk" FOREIGN KEY ("partner_id") REFERENCES "company"."partner_profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company"."sales_opportunities" ADD CONSTRAINT "sales_opportunities_lead_id_sales_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "company"."sales_leads"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company"."sales_opportunities" ADD CONSTRAINT "sales_opportunities_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "company"."products"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company"."sales_opportunities" ADD CONSTRAINT "sales_opportunities_target_plan_id_plans_id_fk" FOREIGN KEY ("target_plan_id") REFERENCES "company"."plans"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company"."sales_opportunities" ADD CONSTRAINT "sales_opportunities_assigned_owner_id_users_id_fk" FOREIGN KEY ("assigned_owner_id") REFERENCES "core"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company"."sales_tasks" ADD CONSTRAINT "sales_tasks_lead_id_sales_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "company"."sales_leads"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company"."sales_tasks" ADD CONSTRAINT "sales_tasks_opportunity_id_sales_opportunities_id_fk" FOREIGN KEY ("opportunity_id") REFERENCES "company"."sales_opportunities"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company"."sales_tasks" ADD CONSTRAINT "sales_tasks_partner_id_partner_profiles_id_fk" FOREIGN KEY ("partner_id") REFERENCES "company"."partner_profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company"."sales_tasks" ADD CONSTRAINT "sales_tasks_assigned_user_id_users_id_fk" FOREIGN KEY ("assigned_user_id") REFERENCES "core"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_marketing_act_campaign" ON "company"."marketing_activities" USING btree ("campaign_id");--> statement-breakpoint
CREATE INDEX "idx_marketing_act_partner" ON "company"."marketing_activities" USING btree ("partner_id");--> statement-breakpoint
CREATE INDEX "idx_marketing_act_lead" ON "company"."marketing_activities" USING btree ("lead_id");--> statement-breakpoint
CREATE INDEX "idx_marketing_act_date" ON "company"."marketing_activities" USING btree ("activity_date");--> statement-breakpoint
CREATE INDEX "idx_campaigns_status" ON "company"."marketing_campaigns" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_campaigns_type" ON "company"."marketing_campaigns" USING btree ("type");--> statement-breakpoint
CREATE INDEX "idx_sales_leads_status" ON "company"."sales_leads" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_sales_leads_owner" ON "company"."sales_leads" USING btree ("assigned_owner_email");--> statement-breakpoint
CREATE INDEX "idx_sales_leads_source" ON "company"."sales_leads" USING btree ("source");--> statement-breakpoint
CREATE INDEX "idx_sales_opp_partner_id" ON "company"."sales_opportunities" USING btree ("partner_id");--> statement-breakpoint
CREATE INDEX "idx_sales_opp_stage" ON "company"."sales_opportunities" USING btree ("stage");--> statement-breakpoint
CREATE INDEX "idx_sales_opp_owner" ON "company"."sales_opportunities" USING btree ("assigned_owner_email");--> statement-breakpoint
CREATE INDEX "idx_sales_tasks_assigned" ON "company"."sales_tasks" USING btree ("assigned_user_email");--> statement-breakpoint
CREATE INDEX "idx_sales_tasks_status" ON "company"."sales_tasks" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_sales_tasks_due" ON "company"."sales_tasks" USING btree ("due_date");