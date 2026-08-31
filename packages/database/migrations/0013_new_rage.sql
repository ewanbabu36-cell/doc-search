CREATE TABLE "company"."backup_policies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"policy_code" varchar(100) NOT NULL,
	"policy_name" varchar(255) NOT NULL,
	"resource_type" varchar(100) DEFAULT 'POSTGRESQL_CLUSTER' NOT NULL,
	"schedule_reference" varchar(100) NOT NULL,
	"retention_days" integer DEFAULT 30 NOT NULL,
	"retention_policy" varchar(100) DEFAULT '30_DAYS_IMMUTABLE' NOT NULL,
	"encryption_reference" varchar(255) NOT NULL,
	"cross_region_enabled" boolean DEFAULT true NOT NULL,
	"immutable_backup_enabled" boolean DEFAULT true NOT NULL,
	"status" varchar(50) DEFAULT 'ACTIVE' NOT NULL,
	"owner_id" uuid,
	"owner_email" varchar(255) NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "backup_policies_policy_code_unique" UNIQUE("policy_code")
);
--> statement-breakpoint
CREATE TABLE "company"."backup_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"backup_code" varchar(100) NOT NULL,
	"policy_id" uuid NOT NULL,
	"resource_reference" varchar(255) NOT NULL,
	"environment" varchar(50) DEFAULT 'PRODUCTION' NOT NULL,
	"backup_type" varchar(50) DEFAULT 'FULL' NOT NULL,
	"status" varchar(50) DEFAULT 'SUCCEEDED' NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone,
	"size_reference" varchar(100) DEFAULT '42.8 GB' NOT NULL,
	"storage_reference" varchar(255) NOT NULL,
	"checksum_reference" varchar(255) NOT NULL,
	"retention_until" timestamp with time zone NOT NULL,
	"verification_status" varchar(50) DEFAULT 'VERIFIED' NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	CONSTRAINT "backup_records_backup_code_unique" UNIQUE("backup_code")
);
--> statement-breakpoint
CREATE TABLE "company"."database_connection_pools" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"pool_code" varchar(100) NOT NULL,
	"database_id" uuid NOT NULL,
	"environment" varchar(50) DEFAULT 'PRODUCTION' NOT NULL,
	"max_connections" integer DEFAULT 100 NOT NULL,
	"active_connections" integer DEFAULT 0 NOT NULL,
	"idle_connections" integer DEFAULT 0 NOT NULL,
	"waiting_connections" integer DEFAULT 0 NOT NULL,
	"connection_timeout_ms" integer DEFAULT 5000 NOT NULL,
	"status" varchar(50) DEFAULT 'HEALTHY' NOT NULL,
	"last_checked_at" timestamp with time zone DEFAULT now() NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	CONSTRAINT "database_connection_pools_pool_code_unique" UNIQUE("pool_code")
);
--> statement-breakpoint
CREATE TABLE "company"."disaster_recovery_drills" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"drill_code" varchar(100) NOT NULL,
	"plan_id" uuid NOT NULL,
	"drill_type" varchar(50) DEFAULT 'FAILOVER_SIMULATION' NOT NULL,
	"scheduled_at" timestamp with time zone NOT NULL,
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"status" varchar(50) DEFAULT 'COMPLETED' NOT NULL,
	"expected_rto_minutes" integer DEFAULT 15 NOT NULL,
	"actual_rto_minutes_reference" varchar(100),
	"expected_rpo_minutes" integer DEFAULT 5 NOT NULL,
	"actual_rpo_reference" varchar(100),
	"result" varchar(50) DEFAULT 'PASSED' NOT NULL,
	"findings_reference" text,
	"evidence_reference" varchar(255),
	"conducted_by_id" uuid,
	"conducted_by_email" varchar(255) NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	CONSTRAINT "disaster_recovery_drills_drill_code_unique" UNIQUE("drill_code")
);
--> statement-breakpoint
CREATE TABLE "company"."disaster_recovery_plans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"plan_code" varchar(100) NOT NULL,
	"plan_name" varchar(255) NOT NULL,
	"scope" varchar(255) NOT NULL,
	"primary_region_id" uuid NOT NULL,
	"dr_region_id" uuid NOT NULL,
	"rto_minutes" integer DEFAULT 15 NOT NULL,
	"rpo_minutes" integer DEFAULT 5 NOT NULL,
	"failover_strategy" varchar(50) DEFAULT 'SEMI_AUTOMATED' NOT NULL,
	"runbook_reference" varchar(255) NOT NULL,
	"last_reviewed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"next_review_due" timestamp with time zone NOT NULL,
	"status" varchar(50) DEFAULT 'ACTIVE' NOT NULL,
	"owner_id" uuid,
	"owner_email" varchar(255) NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	CONSTRAINT "disaster_recovery_plans_plan_code_unique" UNIQUE("plan_code")
);
--> statement-breakpoint
CREATE TABLE "company"."failover_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"failover_code" varchar(100) NOT NULL,
	"plan_id" uuid NOT NULL,
	"source_region_id" uuid NOT NULL,
	"target_region_id" uuid NOT NULL,
	"environment" varchar(50) DEFAULT 'PRODUCTION' NOT NULL,
	"trigger_type" varchar(50) DEFAULT 'DRILL' NOT NULL,
	"status" varchar(50) DEFAULT 'COMPLETED' NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone,
	"initiated_by_id" uuid,
	"initiated_by_email" varchar(255) NOT NULL,
	"rollback_reference" varchar(100),
	"reason" text NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	CONSTRAINT "failover_events_failover_code_unique" UNIQUE("failover_code")
);
--> statement-breakpoint
CREATE TABLE "company"."infrastructure_alerts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"alert_code" varchar(100) NOT NULL,
	"resource_type" varchar(100) NOT NULL,
	"resource_reference" varchar(255) NOT NULL,
	"severity" varchar(50) DEFAULT 'MEDIUM' NOT NULL,
	"alert_type" varchar(100) NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text NOT NULL,
	"status" varchar(50) DEFAULT 'OPEN' NOT NULL,
	"detected_at" timestamp with time zone DEFAULT now() NOT NULL,
	"acknowledged_at" timestamp with time zone,
	"resolved_at" timestamp with time zone,
	"assigned_to_id" uuid,
	"assigned_to_email" varchar(255),
	"resolution_notes" text,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	CONSTRAINT "infrastructure_alerts_alert_code_unique" UNIQUE("alert_code")
);
--> statement-breakpoint
CREATE TABLE "company"."infrastructure_audit_traces" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"trace_id" varchar(100) NOT NULL,
	"actor_id" uuid,
	"actor_email" varchar(255) NOT NULL,
	"action" varchar(100) NOT NULL,
	"resource_reference" varchar(255) NOT NULL,
	"environment" varchar(50) DEFAULT 'PRODUCTION' NOT NULL,
	"operation_status" varchar(50) DEFAULT 'SUCCESS' NOT NULL,
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL,
	"correlation_reference" varchar(255) NOT NULL,
	"evidence_reference" varchar(255) NOT NULL,
	"reason" text NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	CONSTRAINT "infrastructure_audit_traces_trace_id_unique" UNIQUE("trace_id")
);
--> statement-breakpoint
CREATE TABLE "company"."infrastructure_clusters" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cluster_code" varchar(100) NOT NULL,
	"cluster_name" varchar(255) NOT NULL,
	"provider" varchar(50) DEFAULT 'AWS_EKS' NOT NULL,
	"region_id" uuid NOT NULL,
	"environment" varchar(50) DEFAULT 'PRODUCTION' NOT NULL,
	"cluster_type" varchar(50) DEFAULT 'APPLICATION' NOT NULL,
	"orchestration_type" varchar(50) DEFAULT 'KUBERNETES' NOT NULL,
	"status" varchar(50) DEFAULT 'HEALTHY' NOT NULL,
	"node_count" integer DEFAULT 0 NOT NULL,
	"version_reference" varchar(100) NOT NULL,
	"owner_id" uuid,
	"owner_email" varchar(255) NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "infrastructure_clusters_cluster_code_unique" UNIQUE("cluster_code")
);
--> statement-breakpoint
CREATE TABLE "company"."infrastructure_databases" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"database_code" varchar(100) NOT NULL,
	"database_name" varchar(255) NOT NULL,
	"database_type" varchar(50) DEFAULT 'POSTGRESQL' NOT NULL,
	"cluster_id" uuid,
	"region_id" uuid NOT NULL,
	"environment" varchar(50) DEFAULT 'PRODUCTION' NOT NULL,
	"status" varchar(50) DEFAULT 'ONLINE' NOT NULL,
	"engine_version" varchar(100) NOT NULL,
	"replication_mode" varchar(50) DEFAULT 'PRIMARY_REPLICA' NOT NULL,
	"backup_policy_id" uuid,
	"owner_id" uuid,
	"owner_email" varchar(255) NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "infrastructure_databases_database_code_unique" UNIQUE("database_code")
);
--> statement-breakpoint
CREATE TABLE "company"."infrastructure_health_snapshots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"resource_type" varchar(100) NOT NULL,
	"resource_reference" varchar(255) NOT NULL,
	"environment" varchar(50) DEFAULT 'PRODUCTION' NOT NULL,
	"health_status" varchar(50) DEFAULT 'PENDING_TELEMETRY_PIPELINE' NOT NULL,
	"availability_status" varchar(100) DEFAULT 'TELEMETRY_PENDING' NOT NULL,
	"cpu_utilization_reference" varchar(100) DEFAULT 'N/A (Preview)' NOT NULL,
	"memory_utilization_reference" varchar(100) DEFAULT 'N/A (Preview)' NOT NULL,
	"latency_reference" varchar(100) DEFAULT 'N/A (Preview)' NOT NULL,
	"error_rate_reference" varchar(100) DEFAULT '0.00%' NOT NULL,
	"checked_at" timestamp with time zone DEFAULT now() NOT NULL,
	"check_source" varchar(100) DEFAULT 'INFRA_CONTROLLER' NOT NULL,
	"source_status" varchar(50) DEFAULT 'PENDING_TELEMETRY_PIPELINE' NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb
);
--> statement-breakpoint
CREATE TABLE "company"."infrastructure_incidents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"incident_code" varchar(100) NOT NULL,
	"category" varchar(100) NOT NULL,
	"severity" varchar(50) DEFAULT 'HIGH' NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text NOT NULL,
	"source" varchar(100) NOT NULL,
	"environment" varchar(50) DEFAULT 'PRODUCTION' NOT NULL,
	"resource_reference" varchar(255) NOT NULL,
	"status" varchar(50) DEFAULT 'OPEN' NOT NULL,
	"assigned_to_id" uuid,
	"assigned_to_email" varchar(255),
	"detected_at" timestamp with time zone DEFAULT now() NOT NULL,
	"acknowledged_at" timestamp with time zone,
	"contained_at" timestamp with time zone,
	"resolved_at" timestamp with time zone,
	"resolution_notes" text,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "infrastructure_incidents_incident_code_unique" UNIQUE("incident_code")
);
--> statement-breakpoint
CREATE TABLE "company"."infrastructure_nodes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"node_code" varchar(100) NOT NULL,
	"cluster_id" uuid NOT NULL,
	"node_name" varchar(255) NOT NULL,
	"node_type" varchar(50) DEFAULT 'COMPUTE' NOT NULL,
	"instance_reference" varchar(100) NOT NULL,
	"cpu_capacity" varchar(50) NOT NULL,
	"memory_capacity" varchar(50) NOT NULL,
	"status" varchar(50) DEFAULT 'READY' NOT NULL,
	"availability_zone_reference" varchar(100) NOT NULL,
	"environment" varchar(50) DEFAULT 'PRODUCTION' NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "infrastructure_nodes_node_code_unique" UNIQUE("node_code")
);
--> statement-breakpoint
CREATE TABLE "company"."infrastructure_projects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_code" varchar(100) NOT NULL,
	"project_name" varchar(255) NOT NULL,
	"description" text NOT NULL,
	"project_type" varchar(50) DEFAULT 'PLATFORM' NOT NULL,
	"repository_reference" varchar(255) NOT NULL,
	"owner_id" uuid,
	"owner_email" varchar(255) NOT NULL,
	"status" varchar(50) DEFAULT 'ACTIVE' NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "infrastructure_projects_project_code_unique" UNIQUE("project_code")
);
--> statement-breakpoint
CREATE TABLE "company"."infrastructure_regions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"region_code" varchar(100) NOT NULL,
	"region_name" varchar(255) NOT NULL,
	"provider" varchar(50) DEFAULT 'AWS' NOT NULL,
	"geographic_reference" varchar(255) NOT NULL,
	"status" varchar(50) DEFAULT 'ACTIVE' NOT NULL,
	"is_primary" boolean DEFAULT false NOT NULL,
	"is_dr_region" boolean DEFAULT false NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "infrastructure_regions_region_code_unique" UNIQUE("region_code")
);
--> statement-breakpoint
CREATE TABLE "company"."infrastructure_replication_links" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"replication_code" varchar(100) NOT NULL,
	"source_region_id" uuid NOT NULL,
	"target_region_id" uuid NOT NULL,
	"source_database_id" uuid NOT NULL,
	"target_database_id" uuid NOT NULL,
	"replication_mode" varchar(50) DEFAULT 'PRIMARY_REPLICA' NOT NULL,
	"status" varchar(50) DEFAULT 'HEALTHY' NOT NULL,
	"lag_reference" varchar(100) DEFAULT '0s (Synchronous Multi-AZ)' NOT NULL,
	"last_verified_at" timestamp with time zone DEFAULT now() NOT NULL,
	"failure_count" integer DEFAULT 0 NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	CONSTRAINT "infrastructure_replication_links_replication_code_unique" UNIQUE("replication_code")
);
--> statement-breakpoint
CREATE TABLE "company"."infrastructure_services" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"service_code" varchar(100) NOT NULL,
	"service_name" varchar(255) NOT NULL,
	"service_type" varchar(50) DEFAULT 'API' NOT NULL,
	"cluster_id" uuid NOT NULL,
	"environment" varchar(50) DEFAULT 'PRODUCTION' NOT NULL,
	"status" varchar(50) DEFAULT 'RUNNING' NOT NULL,
	"health_status" varchar(50) DEFAULT 'PENDING_TELEMETRY_PIPELINE' NOT NULL,
	"version_reference" varchar(100) NOT NULL,
	"owner_id" uuid,
	"owner_email" varchar(255) NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "infrastructure_services_service_code_unique" UNIQUE("service_code")
);
--> statement-breakpoint
CREATE TABLE "company"."restore_verifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"verification_code" varchar(100) NOT NULL,
	"backup_id" uuid NOT NULL,
	"target_environment" varchar(50) DEFAULT 'DISASTER_RECOVERY' NOT NULL,
	"verification_type" varchar(50) DEFAULT 'AUTOMATED' NOT NULL,
	"status" varchar(50) DEFAULT 'PASSED' NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone,
	"verified_by_id" uuid,
	"verified_by_email" varchar(255) NOT NULL,
	"evidence_reference" varchar(255) NOT NULL,
	"notes" text,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	CONSTRAINT "restore_verifications_verification_code_unique" UNIQUE("verification_code")
);
--> statement-breakpoint
ALTER TABLE "company"."backup_policies" ADD CONSTRAINT "backup_policies_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "core"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company"."backup_records" ADD CONSTRAINT "backup_records_policy_id_backup_policies_id_fk" FOREIGN KEY ("policy_id") REFERENCES "company"."backup_policies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company"."database_connection_pools" ADD CONSTRAINT "database_connection_pools_database_id_infrastructure_databases_id_fk" FOREIGN KEY ("database_id") REFERENCES "company"."infrastructure_databases"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company"."disaster_recovery_drills" ADD CONSTRAINT "disaster_recovery_drills_plan_id_disaster_recovery_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "company"."disaster_recovery_plans"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company"."disaster_recovery_drills" ADD CONSTRAINT "disaster_recovery_drills_conducted_by_id_users_id_fk" FOREIGN KEY ("conducted_by_id") REFERENCES "core"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company"."disaster_recovery_plans" ADD CONSTRAINT "disaster_recovery_plans_primary_region_id_infrastructure_regions_id_fk" FOREIGN KEY ("primary_region_id") REFERENCES "company"."infrastructure_regions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company"."disaster_recovery_plans" ADD CONSTRAINT "disaster_recovery_plans_dr_region_id_infrastructure_regions_id_fk" FOREIGN KEY ("dr_region_id") REFERENCES "company"."infrastructure_regions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company"."disaster_recovery_plans" ADD CONSTRAINT "disaster_recovery_plans_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "core"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company"."failover_events" ADD CONSTRAINT "failover_events_plan_id_disaster_recovery_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "company"."disaster_recovery_plans"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company"."failover_events" ADD CONSTRAINT "failover_events_source_region_id_infrastructure_regions_id_fk" FOREIGN KEY ("source_region_id") REFERENCES "company"."infrastructure_regions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company"."failover_events" ADD CONSTRAINT "failover_events_target_region_id_infrastructure_regions_id_fk" FOREIGN KEY ("target_region_id") REFERENCES "company"."infrastructure_regions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company"."failover_events" ADD CONSTRAINT "failover_events_initiated_by_id_users_id_fk" FOREIGN KEY ("initiated_by_id") REFERENCES "core"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company"."infrastructure_alerts" ADD CONSTRAINT "infrastructure_alerts_assigned_to_id_users_id_fk" FOREIGN KEY ("assigned_to_id") REFERENCES "core"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company"."infrastructure_audit_traces" ADD CONSTRAINT "infrastructure_audit_traces_actor_id_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "core"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company"."infrastructure_clusters" ADD CONSTRAINT "infrastructure_clusters_region_id_infrastructure_regions_id_fk" FOREIGN KEY ("region_id") REFERENCES "company"."infrastructure_regions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company"."infrastructure_clusters" ADD CONSTRAINT "infrastructure_clusters_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "core"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company"."infrastructure_databases" ADD CONSTRAINT "infrastructure_databases_cluster_id_infrastructure_clusters_id_fk" FOREIGN KEY ("cluster_id") REFERENCES "company"."infrastructure_clusters"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company"."infrastructure_databases" ADD CONSTRAINT "infrastructure_databases_region_id_infrastructure_regions_id_fk" FOREIGN KEY ("region_id") REFERENCES "company"."infrastructure_regions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company"."infrastructure_databases" ADD CONSTRAINT "infrastructure_databases_backup_policy_id_backup_policies_id_fk" FOREIGN KEY ("backup_policy_id") REFERENCES "company"."backup_policies"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company"."infrastructure_databases" ADD CONSTRAINT "infrastructure_databases_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "core"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company"."infrastructure_incidents" ADD CONSTRAINT "infrastructure_incidents_assigned_to_id_users_id_fk" FOREIGN KEY ("assigned_to_id") REFERENCES "core"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company"."infrastructure_nodes" ADD CONSTRAINT "infrastructure_nodes_cluster_id_infrastructure_clusters_id_fk" FOREIGN KEY ("cluster_id") REFERENCES "company"."infrastructure_clusters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company"."infrastructure_projects" ADD CONSTRAINT "infrastructure_projects_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "core"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company"."infrastructure_replication_links" ADD CONSTRAINT "infrastructure_replication_links_source_region_id_infrastructure_regions_id_fk" FOREIGN KEY ("source_region_id") REFERENCES "company"."infrastructure_regions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company"."infrastructure_replication_links" ADD CONSTRAINT "infrastructure_replication_links_target_region_id_infrastructure_regions_id_fk" FOREIGN KEY ("target_region_id") REFERENCES "company"."infrastructure_regions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company"."infrastructure_replication_links" ADD CONSTRAINT "infrastructure_replication_links_source_database_id_infrastructure_databases_id_fk" FOREIGN KEY ("source_database_id") REFERENCES "company"."infrastructure_databases"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company"."infrastructure_replication_links" ADD CONSTRAINT "infrastructure_replication_links_target_database_id_infrastructure_databases_id_fk" FOREIGN KEY ("target_database_id") REFERENCES "company"."infrastructure_databases"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company"."infrastructure_services" ADD CONSTRAINT "infrastructure_services_cluster_id_infrastructure_clusters_id_fk" FOREIGN KEY ("cluster_id") REFERENCES "company"."infrastructure_clusters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company"."infrastructure_services" ADD CONSTRAINT "infrastructure_services_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "core"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company"."restore_verifications" ADD CONSTRAINT "restore_verifications_backup_id_backup_records_id_fk" FOREIGN KEY ("backup_id") REFERENCES "company"."backup_records"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company"."restore_verifications" ADD CONSTRAINT "restore_verifications_verified_by_id_users_id_fk" FOREIGN KEY ("verified_by_id") REFERENCES "core"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_backup_pol_type" ON "company"."backup_policies" USING btree ("resource_type");--> statement-breakpoint
CREATE INDEX "idx_backup_pol_status" ON "company"."backup_policies" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_backup_rec_policy" ON "company"."backup_records" USING btree ("policy_id");--> statement-breakpoint
CREATE INDEX "idx_backup_rec_status" ON "company"."backup_records" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_backup_rec_started" ON "company"."backup_records" USING btree ("started_at");--> statement-breakpoint
CREATE INDEX "idx_db_pool_db" ON "company"."database_connection_pools" USING btree ("database_id");--> statement-breakpoint
CREATE INDEX "idx_db_pool_status" ON "company"."database_connection_pools" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_dr_drill_plan" ON "company"."disaster_recovery_drills" USING btree ("plan_id");--> statement-breakpoint
CREATE INDEX "idx_dr_drill_status" ON "company"."disaster_recovery_drills" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_dr_drill_result" ON "company"."disaster_recovery_drills" USING btree ("result");--> statement-breakpoint
CREATE INDEX "idx_dr_drill_scheduled" ON "company"."disaster_recovery_drills" USING btree ("scheduled_at");--> statement-breakpoint
CREATE INDEX "idx_dr_plan_status" ON "company"."disaster_recovery_plans" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_dr_plan_primary" ON "company"."disaster_recovery_plans" USING btree ("primary_region_id");--> statement-breakpoint
CREATE INDEX "idx_dr_plan_dr" ON "company"."disaster_recovery_plans" USING btree ("dr_region_id");--> statement-breakpoint
CREATE INDEX "idx_failover_plan" ON "company"."failover_events" USING btree ("plan_id");--> statement-breakpoint
CREATE INDEX "idx_failover_status" ON "company"."failover_events" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_failover_started" ON "company"."failover_events" USING btree ("started_at");--> statement-breakpoint
CREATE INDEX "idx_infra_alert_sev" ON "company"."infrastructure_alerts" USING btree ("severity");--> statement-breakpoint
CREATE INDEX "idx_infra_alert_status" ON "company"."infrastructure_alerts" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_infra_alert_detected" ON "company"."infrastructure_alerts" USING btree ("detected_at");--> statement-breakpoint
CREATE INDEX "idx_infra_trace_actor" ON "company"."infrastructure_audit_traces" USING btree ("actor_email");--> statement-breakpoint
CREATE INDEX "idx_infra_trace_status" ON "company"."infrastructure_audit_traces" USING btree ("operation_status");--> statement-breakpoint
CREATE INDEX "idx_infra_trace_occurred" ON "company"."infrastructure_audit_traces" USING btree ("occurred_at");--> statement-breakpoint
CREATE INDEX "idx_infra_cluster_reg" ON "company"."infrastructure_clusters" USING btree ("region_id");--> statement-breakpoint
CREATE INDEX "idx_infra_cluster_env" ON "company"."infrastructure_clusters" USING btree ("environment");--> statement-breakpoint
CREATE INDEX "idx_infra_cluster_type" ON "company"."infrastructure_clusters" USING btree ("cluster_type");--> statement-breakpoint
CREATE INDEX "idx_infra_cluster_status" ON "company"."infrastructure_clusters" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_infra_db_reg" ON "company"."infrastructure_databases" USING btree ("region_id");--> statement-breakpoint
CREATE INDEX "idx_infra_db_type" ON "company"."infrastructure_databases" USING btree ("database_type");--> statement-breakpoint
CREATE INDEX "idx_infra_db_status" ON "company"."infrastructure_databases" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_infra_health_res" ON "company"."infrastructure_health_snapshots" USING btree ("resource_reference");--> statement-breakpoint
CREATE INDEX "idx_infra_health_status" ON "company"."infrastructure_health_snapshots" USING btree ("health_status");--> statement-breakpoint
CREATE INDEX "idx_infra_health_checked" ON "company"."infrastructure_health_snapshots" USING btree ("checked_at");--> statement-breakpoint
CREATE INDEX "idx_infra_inc_sev" ON "company"."infrastructure_incidents" USING btree ("severity");--> statement-breakpoint
CREATE INDEX "idx_infra_inc_status" ON "company"."infrastructure_incidents" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_infra_inc_cat" ON "company"."infrastructure_incidents" USING btree ("category");--> statement-breakpoint
CREATE INDEX "idx_infra_inc_detected" ON "company"."infrastructure_incidents" USING btree ("detected_at");--> statement-breakpoint
CREATE INDEX "idx_infra_node_cluster" ON "company"."infrastructure_nodes" USING btree ("cluster_id");--> statement-breakpoint
CREATE INDEX "idx_infra_node_type" ON "company"."infrastructure_nodes" USING btree ("node_type");--> statement-breakpoint
CREATE INDEX "idx_infra_node_status" ON "company"."infrastructure_nodes" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_infra_proj_status" ON "company"."infrastructure_projects" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_infra_proj_owner" ON "company"."infrastructure_projects" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "idx_infra_proj_type" ON "company"."infrastructure_projects" USING btree ("project_type");--> statement-breakpoint
CREATE INDEX "idx_infra_reg_provider" ON "company"."infrastructure_regions" USING btree ("provider");--> statement-breakpoint
CREATE INDEX "idx_infra_reg_status" ON "company"."infrastructure_regions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_infra_repl_src" ON "company"."infrastructure_replication_links" USING btree ("source_database_id");--> statement-breakpoint
CREATE INDEX "idx_infra_repl_target" ON "company"."infrastructure_replication_links" USING btree ("target_database_id");--> statement-breakpoint
CREATE INDEX "idx_infra_repl_status" ON "company"."infrastructure_replication_links" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_infra_svc_cluster" ON "company"."infrastructure_services" USING btree ("cluster_id");--> statement-breakpoint
CREATE INDEX "idx_infra_svc_type" ON "company"."infrastructure_services" USING btree ("service_type");--> statement-breakpoint
CREATE INDEX "idx_infra_svc_status" ON "company"."infrastructure_services" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_infra_svc_health" ON "company"."infrastructure_services" USING btree ("health_status");--> statement-breakpoint
CREATE INDEX "idx_rest_verif_backup" ON "company"."restore_verifications" USING btree ("backup_id");--> statement-breakpoint
CREATE INDEX "idx_rest_verif_status" ON "company"."restore_verifications" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_rest_verif_started" ON "company"."restore_verifications" USING btree ("started_at");