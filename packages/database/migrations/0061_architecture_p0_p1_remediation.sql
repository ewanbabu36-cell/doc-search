-- Migration 0061: Master Architecture P0/P1 Controlled Remediation
-- 1. Drop legacy core.branches and core.users foreign-key constraints on core.audit_events
--    so operational_facilities (branchId) and operational_staff (actorId) UUIDs are persisted
--    atomically without ever nulling actorId or branchId (P0-04).
ALTER TABLE "core"."audit_events" DROP CONSTRAINT IF EXISTS "audit_events_branch_id_branches_id_fk";
--> statement-breakpoint
ALTER TABLE "core"."audit_events" DROP CONSTRAINT IF EXISTS "audit_events_actor_id_users_id_fk";
--> statement-breakpoint

-- 2. Add canonical operating_model column to partner_profiles, operational_partners, and operational_organizations (P1-04)
ALTER TABLE "company"."partner_profiles" ADD COLUMN IF NOT EXISTS "operating_model" varchar(64);
--> statement-breakpoint
ALTER TABLE "clinical"."operational_partners" ADD COLUMN IF NOT EXISTS "operating_model" varchar(64);
--> statement-breakpoint
ALTER TABLE "clinical"."operational_organizations" ADD COLUMN IF NOT EXISTS "operating_model" varchar(64);
--> statement-breakpoint

-- 3. Add tenant_id to workflow_instances and decouple definition/stage UUID FKs so runtime workflow
--    instances, approvals, requirement evaluations, and transition logs persist in PostgreSQL (P0-05)
ALTER TABLE "workflow_instances" ADD COLUMN IF NOT EXISTS "tenant_id" uuid;
--> statement-breakpoint
ALTER TABLE "workflow_instances" DROP CONSTRAINT IF EXISTS "workflow_instances_workflow_id_fkey";
--> statement-breakpoint
ALTER TABLE "workflow_instances" DROP CONSTRAINT IF EXISTS "workflow_instances_workflow_id_fk";
--> statement-breakpoint
ALTER TABLE "workflow_instances" DROP CONSTRAINT IF EXISTS "workflow_instances_workflow_id_workflow_definitions_id_fk";
--> statement-breakpoint
ALTER TABLE "workflow_instances" DROP CONSTRAINT IF EXISTS "workflow_instances_current_stage_id_fkey";
--> statement-breakpoint
ALTER TABLE "workflow_instances" DROP CONSTRAINT IF EXISTS "workflow_instances_current_stage_id_fk";
--> statement-breakpoint
ALTER TABLE "workflow_instances" DROP CONSTRAINT IF EXISTS "workflow_instances_current_stage_id_workflow_stages_id_fk";
--> statement-breakpoint
ALTER TABLE "workflow_requirement_instances" DROP CONSTRAINT IF EXISTS "workflow_requirement_instances_instance_id_fkey";
--> statement-breakpoint
ALTER TABLE "workflow_requirement_instances" DROP CONSTRAINT IF EXISTS "workflow_requirement_instances_instance_id_fk";
--> statement-breakpoint
ALTER TABLE "workflow_requirement_instances" DROP CONSTRAINT IF EXISTS "workflow_requirement_instances_instance_id_workflow_instances_id_fk";
--> statement-breakpoint
ALTER TABLE "workflow_approvals" DROP CONSTRAINT IF EXISTS "workflow_approvals_instance_id_fkey";
--> statement-breakpoint
ALTER TABLE "workflow_approvals" DROP CONSTRAINT IF EXISTS "workflow_approvals_instance_id_fk";
--> statement-breakpoint
ALTER TABLE "workflow_approvals" DROP CONSTRAINT IF EXISTS "workflow_approvals_instance_id_workflow_instances_id_fk";
--> statement-breakpoint
ALTER TABLE "workflow_approvals" DROP CONSTRAINT IF EXISTS "workflow_approvals_transition_id_fkey";
--> statement-breakpoint
ALTER TABLE "workflow_approvals" DROP CONSTRAINT IF EXISTS "workflow_approvals_transition_id_fk";
--> statement-breakpoint
ALTER TABLE "workflow_approvals" DROP CONSTRAINT IF EXISTS "workflow_approvals_transition_id_workflow_transitions_id_fk";
--> statement-breakpoint
ALTER TABLE "workflow_transition_logs" DROP CONSTRAINT IF EXISTS "workflow_transition_logs_instance_id_fkey";
--> statement-breakpoint
ALTER TABLE "workflow_transition_logs" DROP CONSTRAINT IF EXISTS "workflow_transition_logs_instance_id_fk";
--> statement-breakpoint
ALTER TABLE "workflow_transition_logs" DROP CONSTRAINT IF EXISTS "workflow_transition_logs_instance_id_workflow_instances_id_fk";
--> statement-breakpoint
ALTER TABLE "workflow_transition_logs" DROP CONSTRAINT IF EXISTS "workflow_transition_logs_workflow_id_fkey";
--> statement-breakpoint
ALTER TABLE "workflow_transition_logs" DROP CONSTRAINT IF EXISTS "workflow_transition_logs_workflow_id_fk";
--> statement-breakpoint
ALTER TABLE "workflow_transition_logs" DROP CONSTRAINT IF EXISTS "workflow_transition_logs_workflow_id_workflow_definitions_id_fk";

