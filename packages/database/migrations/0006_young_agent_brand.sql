CREATE TABLE "company"."content_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(255) NOT NULL,
	"slug" varchar(255) NOT NULL,
	"type" varchar(50) DEFAULT 'PLATFORM_ANNOUNCEMENT' NOT NULL,
	"status" varchar(50) DEFAULT 'DRAFT' NOT NULL,
	"target_audience" varchar(50) DEFAULT 'ALL_PARTNERS' NOT NULL,
	"target_partner_ids" jsonb DEFAULT '[]'::jsonb,
	"summary" text NOT NULL,
	"body_markdown" text NOT NULL,
	"version_tag" varchar(50),
	"pinned" boolean DEFAULT false NOT NULL,
	"published_at" timestamp with time zone,
	"scheduled_for" timestamp with time zone,
	"author_id" uuid,
	"author_email" varchar(255) NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "company"."notification_dispatch_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"content_item_id" uuid NOT NULL,
	"partner_id" uuid,
	"recipient_email" varchar(255) NOT NULL,
	"channel" varchar(50) DEFAULT 'IN_APP_BANNER' NOT NULL,
	"delivery_status" varchar(50) DEFAULT 'PENDING' NOT NULL,
	"dispatched_at" timestamp with time zone,
	"delivered_at" timestamp with time zone,
	"failure_reason" text,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "company"."notification_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" varchar(100) NOT NULL,
	"name" varchar(255) NOT NULL,
	"channel" varchar(50) DEFAULT 'EMAIL_NOTIFICATION' NOT NULL,
	"subject_template" varchar(255) NOT NULL,
	"body_template" text NOT NULL,
	"variables" jsonb DEFAULT '[]'::jsonb,
	"status" varchar(50) DEFAULT 'ACTIVE' NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "company"."content_items" ADD CONSTRAINT "content_items_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "core"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company"."notification_dispatch_records" ADD CONSTRAINT "notification_dispatch_records_content_item_id_content_items_id_fk" FOREIGN KEY ("content_item_id") REFERENCES "company"."content_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company"."notification_dispatch_records" ADD CONSTRAINT "notification_dispatch_records_partner_id_partner_profiles_id_fk" FOREIGN KEY ("partner_id") REFERENCES "company"."partner_profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "uq_content_items_slug" ON "company"."content_items" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "idx_content_items_status" ON "company"."content_items" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_content_items_type" ON "company"."content_items" USING btree ("type");--> statement-breakpoint
CREATE INDEX "idx_content_items_audience" ON "company"."content_items" USING btree ("target_audience");--> statement-breakpoint
CREATE INDEX "idx_content_items_published" ON "company"."content_items" USING btree ("published_at");--> statement-breakpoint
CREATE INDEX "idx_dispatch_records_item" ON "company"."notification_dispatch_records" USING btree ("content_item_id");--> statement-breakpoint
CREATE INDEX "idx_dispatch_records_status" ON "company"."notification_dispatch_records" USING btree ("delivery_status");--> statement-breakpoint
CREATE INDEX "idx_dispatch_records_partner" ON "company"."notification_dispatch_records" USING btree ("partner_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_notification_templates_code" ON "company"."notification_templates" USING btree ("code");--> statement-breakpoint
CREATE INDEX "idx_notification_templates_channel" ON "company"."notification_templates" USING btree ("channel");--> statement-breakpoint
CREATE INDEX "idx_notification_templates_status" ON "company"."notification_templates" USING btree ("status");