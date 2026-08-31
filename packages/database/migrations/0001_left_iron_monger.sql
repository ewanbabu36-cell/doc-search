CREATE TABLE "company"."partner_lifecycle_transitions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"partner_id" uuid NOT NULL,
	"from_status" varchar(50) NOT NULL,
	"to_status" varchar(50) NOT NULL,
	"actor_id" uuid,
	"actor_email" varchar(255) NOT NULL,
	"reason" text NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"timestamp" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "company"."partner_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"partner_type" varchar(50) DEFAULT 'HOSPITAL_NETWORK' NOT NULL,
	"lifecycle_status" varchar(50) DEFAULT 'LEAD' NOT NULL,
	"verification_status" varchar(50) DEFAULT 'PENDING' NOT NULL,
	"onboarding_step" varchar(50) DEFAULT 'ORGANIZATION_PROFILE' NOT NULL,
	"onboarding_progress_percent" integer DEFAULT 0 NOT NULL,
	"legal_name" varchar(255) NOT NULL,
	"trade_name" varchar(255) NOT NULL,
	"primary_contact_name" varchar(100) NOT NULL,
	"primary_contact_email" varchar(255) NOT NULL,
	"primary_contact_phone" varchar(50),
	"primary_contact_role" varchar(100),
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "company"."partner_lifecycle_transitions" ADD CONSTRAINT "partner_lifecycle_transitions_partner_id_partner_profiles_id_fk" FOREIGN KEY ("partner_id") REFERENCES "company"."partner_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company"."partner_lifecycle_transitions" ADD CONSTRAINT "partner_lifecycle_transitions_actor_id_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "core"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company"."partner_profiles" ADD CONSTRAINT "partner_profiles_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "core"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_partner_transitions_partner_id" ON "company"."partner_lifecycle_transitions" USING btree ("partner_id");--> statement-breakpoint
CREATE INDEX "idx_partner_transitions_time" ON "company"."partner_lifecycle_transitions" USING btree ("timestamp");--> statement-breakpoint
CREATE INDEX "idx_partner_profiles_tenant_id" ON "company"."partner_profiles" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_partner_profiles_status" ON "company"."partner_profiles" USING btree ("lifecycle_status");--> statement-breakpoint
CREATE INDEX "idx_partner_profiles_type" ON "company"."partner_profiles" USING btree ("partner_type");--> statement-breakpoint
CREATE INDEX "idx_partner_profiles_verification" ON "company"."partner_profiles" USING btree ("verification_status");