CREATE TABLE "core"."sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"tenant_id" uuid NOT NULL,
	"branch_id" uuid,
	"token_family_id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"refresh_token_hash" varchar(128) NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"revoked_at" timestamp with time zone,
	"last_used_at" timestamp with time zone DEFAULT now() NOT NULL,
	"ip_address" varchar(45),
	"user_agent" varchar(500),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "core"."user_credentials" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"password_hash" varchar(255) NOT NULL,
	"failed_login_attempts" integer DEFAULT 0 NOT NULL,
	"locked_until" timestamp with time zone,
	"last_password_change_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "core"."audit_events" ADD COLUMN "previous_hash" varchar(128);--> statement-breakpoint
ALTER TABLE "core"."audit_events" ADD COLUMN "integrity_hash" varchar(128);--> statement-breakpoint
ALTER TABLE "core"."sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "core"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "core"."sessions" ADD CONSTRAINT "sessions_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "core"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "core"."sessions" ADD CONSTRAINT "sessions_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "core"."branches"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "core"."user_credentials" ADD CONSTRAINT "user_credentials_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "core"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "uq_sessions_token_hash" ON "core"."sessions" USING btree ("refresh_token_hash");--> statement-breakpoint
CREATE INDEX "idx_sessions_user_tenant" ON "core"."sessions" USING btree ("user_id","tenant_id");--> statement-breakpoint
CREATE INDEX "idx_sessions_family" ON "core"."sessions" USING btree ("token_family_id");--> statement-breakpoint
CREATE INDEX "idx_sessions_expires_at" ON "core"."sessions" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "idx_sessions_revoked_at" ON "core"."sessions" USING btree ("revoked_at");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_user_credentials_user" ON "core"."user_credentials" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_user_credentials_locked" ON "core"."user_credentials" USING btree ("locked_until");--> statement-breakpoint
CREATE INDEX "idx_audit_events_integrity" ON "core"."audit_events" USING btree ("integrity_hash");