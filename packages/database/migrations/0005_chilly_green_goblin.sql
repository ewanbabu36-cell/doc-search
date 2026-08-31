CREATE TABLE "company"."partner_health_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"partner_id" uuid NOT NULL,
	"health_status" varchar(50) DEFAULT 'HEALTHY' NOT NULL,
	"health_score" integer DEFAULT 100 NOT NULL,
	"active_tickets_count" integer DEFAULT 0 NOT NULL,
	"sla_breach_count" integer DEFAULT 0 NOT NULL,
	"last_qbr_date" timestamp with time zone,
	"next_scheduled_review" timestamp with time zone,
	"risk_factors" jsonb DEFAULT '[]'::jsonb,
	"assigned_success_lead_id" uuid,
	"assigned_success_lead_email" varchar(255) NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "company"."success_checkins" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"partner_id" uuid NOT NULL,
	"checkin_type" varchar(50) DEFAULT 'QUARTERLY_BUSINESS_REVIEW' NOT NULL,
	"status" varchar(50) DEFAULT 'SCHEDULED' NOT NULL,
	"scheduled_date" timestamp with time zone NOT NULL,
	"conducted_date" timestamp with time zone,
	"host_lead_id" uuid,
	"host_lead_email" varchar(255) NOT NULL,
	"attendee_names" jsonb DEFAULT '[]'::jsonb,
	"summary_notes" text,
	"action_items" jsonb DEFAULT '[]'::jsonb,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "company"."support_ticket_comments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ticket_id" uuid NOT NULL,
	"author_id" uuid,
	"author_email" varchar(255) NOT NULL,
	"author_name" varchar(100) NOT NULL,
	"is_internal_only" boolean DEFAULT false NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "company"."support_tickets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ticket_number" varchar(50) NOT NULL,
	"partner_id" uuid NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text NOT NULL,
	"category" varchar(50) DEFAULT 'TECHNICAL_INCIDENT' NOT NULL,
	"priority" varchar(50) DEFAULT 'MEDIUM' NOT NULL,
	"status" varchar(50) DEFAULT 'OPEN' NOT NULL,
	"sla_status" varchar(50) DEFAULT 'WITHIN_SLA' NOT NULL,
	"assigned_agent_id" uuid,
	"assigned_agent_email" varchar(255) NOT NULL,
	"submitted_by_email" varchar(255) NOT NULL,
	"submitted_by_name" varchar(100) NOT NULL,
	"sla_response_due" timestamp with time zone,
	"sla_resolution_due" timestamp with time zone,
	"resolved_date" timestamp with time zone,
	"resolution_notes" text,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "company"."partner_health_profiles" ADD CONSTRAINT "partner_health_profiles_partner_id_partner_profiles_id_fk" FOREIGN KEY ("partner_id") REFERENCES "company"."partner_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company"."partner_health_profiles" ADD CONSTRAINT "partner_health_profiles_assigned_success_lead_id_users_id_fk" FOREIGN KEY ("assigned_success_lead_id") REFERENCES "core"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company"."success_checkins" ADD CONSTRAINT "success_checkins_partner_id_partner_profiles_id_fk" FOREIGN KEY ("partner_id") REFERENCES "company"."partner_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company"."success_checkins" ADD CONSTRAINT "success_checkins_host_lead_id_users_id_fk" FOREIGN KEY ("host_lead_id") REFERENCES "core"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company"."support_ticket_comments" ADD CONSTRAINT "support_ticket_comments_ticket_id_support_tickets_id_fk" FOREIGN KEY ("ticket_id") REFERENCES "company"."support_tickets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company"."support_ticket_comments" ADD CONSTRAINT "support_ticket_comments_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "core"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company"."support_tickets" ADD CONSTRAINT "support_tickets_partner_id_partner_profiles_id_fk" FOREIGN KEY ("partner_id") REFERENCES "company"."partner_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company"."support_tickets" ADD CONSTRAINT "support_tickets_assigned_agent_id_users_id_fk" FOREIGN KEY ("assigned_agent_id") REFERENCES "core"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "uq_partner_health_partner_id" ON "company"."partner_health_profiles" USING btree ("partner_id");--> statement-breakpoint
CREATE INDEX "idx_partner_health_status" ON "company"."partner_health_profiles" USING btree ("health_status");--> statement-breakpoint
CREATE INDEX "idx_success_checkins_partner" ON "company"."success_checkins" USING btree ("partner_id");--> statement-breakpoint
CREATE INDEX "idx_success_checkins_status" ON "company"."success_checkins" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_success_checkins_date" ON "company"."success_checkins" USING btree ("scheduled_date");--> statement-breakpoint
CREATE INDEX "idx_ticket_comments_ticket_id" ON "company"."support_ticket_comments" USING btree ("ticket_id");--> statement-breakpoint
CREATE INDEX "idx_ticket_comments_created_at" ON "company"."support_ticket_comments" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_support_ticket_number" ON "company"."support_tickets" USING btree ("ticket_number");--> statement-breakpoint
CREATE INDEX "idx_support_tickets_partner" ON "company"."support_tickets" USING btree ("partner_id");--> statement-breakpoint
CREATE INDEX "idx_support_tickets_status" ON "company"."support_tickets" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_support_tickets_priority" ON "company"."support_tickets" USING btree ("priority");--> statement-breakpoint
CREATE INDEX "idx_support_tickets_sla_status" ON "company"."support_tickets" USING btree ("sla_status");--> statement-breakpoint
CREATE INDEX "idx_support_tickets_agent" ON "company"."support_tickets" USING btree ("assigned_agent_email");