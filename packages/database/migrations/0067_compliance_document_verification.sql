CREATE TABLE IF NOT EXISTS "document_types" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" varchar(64) NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"document_category" varchar(64) NOT NULL,
	"applicable_entity_type" varchar(64) NOT NULL,
	"applicable_role" varchar(64),
	"facility_type" varchar(64),
	"is_required" boolean DEFAULT true NOT NULL,
	"is_conditional" boolean DEFAULT false NOT NULL,
	"condition_expression" text,
	"allowed_file_types" jsonb DEFAULT '["application/pdf","image/png","image/jpeg"]'::jsonb,
	"max_file_size_bytes" bigint DEFAULT 10485760 NOT NULL,
	"requires_expiry" boolean DEFAULT false NOT NULL,
	"requires_registration_number" boolean DEFAULT false NOT NULL,
	"requires_issuing_authority" boolean DEFAULT false NOT NULL,
	"requires_issue_date" boolean DEFAULT false NOT NULL,
	"requires_verification" boolean DEFAULT true NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"display_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "document_types_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_document_types_code" ON "document_types" ("code");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_document_types_role" ON "document_types" ("applicable_role");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_document_types_facility" ON "document_types" ("facility_type");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_document_types_category" ON "document_types" ("document_category");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "document_requirements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"document_type_id" uuid NOT NULL,
	"entity_type" varchar(64) NOT NULL,
	"role" varchar(64),
	"facility_type" varchar(64),
	"professional_type" varchar(64),
	"is_mandatory" boolean DEFAULT true NOT NULL,
	"condition_rule" text,
	"instructions" text,
	"display_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "fk_doc_req_type" FOREIGN KEY ("document_type_id") REFERENCES "document_types"("id") ON DELETE cascade ON UPDATE no action
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_doc_requirements_type" ON "document_requirements" ("document_type_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_doc_requirements_role" ON "document_requirements" ("role");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_doc_requirements_facility" ON "document_requirements" ("facility_type");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "entity_documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"document_type_id" uuid NOT NULL,
	"tenant_id" uuid NOT NULL,
	"owner_entity_id" uuid NOT NULL,
	"owner_entity_type" varchar(64) NOT NULL,
	"role" varchar(64),
	"facility_type" varchar(64),
	"document_number" varchar(128),
	"issuing_authority" varchar(255),
	"issue_date" date,
	"expiry_date" date,
	"file_name" varchar(255) NOT NULL,
	"storage_key" varchar(512) NOT NULL,
	"file_url" text NOT NULL,
	"mime_type" varchar(128) NOT NULL,
	"file_size_bytes" bigint NOT NULL,
	"sha256_hash" varchar(64) NOT NULL,
	"ai_match_score" numeric(5, 2),
	"ai_extracted_text" text,
	"uploaded_by" uuid NOT NULL,
	"uploaded_at" timestamp with time zone DEFAULT now() NOT NULL,
	"verification_status" varchar(64) DEFAULT 'PENDING_VERIFICATION' NOT NULL,
	"verified_by" uuid,
	"verified_at" timestamp with time zone,
	"rejection_reason" text,
	"version" integer DEFAULT 1 NOT NULL,
	"is_current" boolean DEFAULT true NOT NULL,
	"superseded_by" uuid,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "fk_entity_doc_type" FOREIGN KEY ("document_type_id") REFERENCES "document_types"("id") ON DELETE no action ON UPDATE no action,
	CONSTRAINT "fk_entity_doc_tenant" FOREIGN KEY ("tenant_id") REFERENCES "core"."tenants"("id") ON DELETE cascade ON UPDATE no action
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_entity_documents_tenant" ON "entity_documents" ("tenant_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_entity_documents_owner" ON "entity_documents" ("owner_entity_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_entity_documents_type" ON "entity_documents" ("document_type_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_entity_documents_status" ON "entity_documents" ("verification_status");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_entity_documents_current" ON "entity_documents" ("is_current");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "document_verifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"document_id" uuid NOT NULL,
	"verifier_id" uuid NOT NULL,
	"verifier_email" varchar(255) NOT NULL,
	"action" varchar(64) NOT NULL,
	"previous_status" varchar(64) NOT NULL,
	"new_status" varchar(64) NOT NULL,
	"reason" text,
	"ai_audit_score" numeric(5, 2),
	"timestamp" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "fk_doc_verif_doc" FOREIGN KEY ("document_id") REFERENCES "entity_documents"("id") ON DELETE cascade ON UPDATE no action
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_doc_verifications_doc" ON "document_verifications" ("document_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_doc_verifications_time" ON "document_verifications" ("timestamp");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "document_audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"document_id" uuid NOT NULL,
	"actor_id" uuid,
	"actor_email" varchar(255) NOT NULL,
	"action" varchar(64) NOT NULL,
	"old_status" varchar(64),
	"new_status" varchar(64),
	"reason" text,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"ip_address" varchar(64),
	"user_agent" text,
	"timestamp" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_doc_audit_doc" ON "document_audit_logs" ("document_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_doc_audit_time" ON "document_audit_logs" ("timestamp");
