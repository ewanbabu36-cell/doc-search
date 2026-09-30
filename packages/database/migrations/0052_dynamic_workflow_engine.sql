CREATE TABLE IF NOT EXISTS "workflow_definitions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text NOT NULL UNIQUE,
	"name" text NOT NULL,
	"description" text,
	"entity_type" text NOT NULL,
	"organization_type" text NOT NULL,
	"active_version" integer DEFAULT 1 NOT NULL,
	"status" text DEFAULT 'ACTIVE' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "workflow_versions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workflow_id" uuid NOT NULL REFERENCES "workflow_definitions"("id"),
	"version" integer NOT NULL,
	"status" text DEFAULT 'ACTIVE' NOT NULL,
	"effective_from" timestamp DEFAULT now() NOT NULL,
	"effective_to" timestamp,
	"change_summary" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"created_by" text DEFAULT 'SYSTEM' NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "workflow_stages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workflow_id" uuid NOT NULL REFERENCES "workflow_definitions"("id"),
	"version_id" uuid NOT NULL REFERENCES "workflow_versions"("id"),
	"code" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"sequence" integer NOT NULL,
	"stage_type" text NOT NULL,
	"is_initial" boolean DEFAULT false NOT NULL,
	"is_terminal" boolean DEFAULT false NOT NULL,
	"status" text DEFAULT 'ACTIVE' NOT NULL,
	"metadata" jsonb
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "workflow_transitions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workflow_id" uuid NOT NULL REFERENCES "workflow_definitions"("id"),
	"version_id" uuid NOT NULL REFERENCES "workflow_versions"("id"),
	"from_stage_id" uuid NOT NULL REFERENCES "workflow_stages"("id"),
	"to_stage_id" uuid NOT NULL REFERENCES "workflow_stages"("id"),
	"transition_code" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"conditions" jsonb,
	"required_permissions" jsonb,
	"approval_required" boolean DEFAULT false NOT NULL,
	"required_approval_roles" jsonb,
	"actions" jsonb,
	"status" text DEFAULT 'ACTIVE' NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "workflow_requirements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"stage_id" uuid NOT NULL REFERENCES "workflow_stages"("id"),
	"requirement_code" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"requirement_type" text NOT NULL,
	"configuration" jsonb NOT NULL,
	"is_required" boolean DEFAULT true NOT NULL,
	"validation_rule" jsonb,
	"order" integer DEFAULT 1 NOT NULL,
	"status" text DEFAULT 'ACTIVE' NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "workflow_instances" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workflow_id" uuid NOT NULL REFERENCES "workflow_definitions"("id"),
	"workflow_code" text NOT NULL,
	"workflow_version" integer NOT NULL,
	"organization_type" text NOT NULL,
	"entity_id" text NOT NULL,
	"entity_name" text NOT NULL,
	"current_stage_id" uuid NOT NULL REFERENCES "workflow_stages"("id"),
	"current_stage_code" text NOT NULL,
	"current_stage_name" text NOT NULL,
	"status" text DEFAULT 'IN_PROGRESS' NOT NULL,
	"context_data" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "workflow_requirement_instances" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"instance_id" uuid NOT NULL REFERENCES "workflow_instances"("id"),
	"requirement_id" text NOT NULL,
	"requirement_code" text NOT NULL,
	"name" text NOT NULL,
	"requirement_type" text NOT NULL,
	"is_fulfilled" boolean DEFAULT false NOT NULL,
	"fulfilled_at" timestamp,
	"fulfilled_by" text,
	"data" jsonb,
	"evaluation_result" jsonb
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "workflow_approvals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"instance_id" uuid NOT NULL REFERENCES "workflow_instances"("id"),
	"transition_id" uuid NOT NULL REFERENCES "workflow_transitions"("id"),
	"required_role" text NOT NULL,
	"status" text DEFAULT 'PENDING' NOT NULL,
	"approved_by" text,
	"approved_at" timestamp,
	"comments" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "workflow_transition_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"instance_id" uuid NOT NULL REFERENCES "workflow_instances"("id"),
	"workflow_id" uuid NOT NULL REFERENCES "workflow_definitions"("id"),
	"version" integer NOT NULL,
	"from_stage_code" text NOT NULL,
	"to_stage_code" text NOT NULL,
	"transition_code" text NOT NULL,
	"actor_email" text NOT NULL,
	"actor_role" text NOT NULL,
	"rules_evaluated" jsonb NOT NULL,
	"requirements_evaluated" jsonb NOT NULL,
	"actions_executed" jsonb NOT NULL,
	"reason" text,
	"timestamp" timestamp DEFAULT now() NOT NULL
);
