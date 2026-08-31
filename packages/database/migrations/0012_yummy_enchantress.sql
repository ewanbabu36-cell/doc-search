CREATE TABLE "company"."artifact_repositories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"repository_code" varchar(100) NOT NULL,
	"name" varchar(255) NOT NULL,
	"repository_type" varchar(50) DEFAULT 'DOCKER_OCI' NOT NULL,
	"provider" varchar(50) DEFAULT 'GHCR_IO' NOT NULL,
	"endpoint_reference" varchar(255) NOT NULL,
	"status" varchar(50) DEFAULT 'ACTIVE' NOT NULL,
	"retention_policy_reference" varchar(100) DEFAULT '90_DAYS_RETENTION' NOT NULL,
	"owner_id" uuid,
	"owner_email" varchar(255) NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "artifact_repositories_repository_code_unique" UNIQUE("repository_code")
);
--> statement-breakpoint
CREATE TABLE "company"."build_pipelines" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"pipeline_code" varchar(100) NOT NULL,
	"project_id" uuid NOT NULL,
	"pipeline_name" varchar(255) NOT NULL,
	"pipeline_type" varchar(50) DEFAULT 'BUILD' NOT NULL,
	"definition_reference" varchar(255) NOT NULL,
	"trigger_type" varchar(50) DEFAULT 'MANUAL' NOT NULL,
	"status" varchar(50) DEFAULT 'ACTIVE' NOT NULL,
	"default_environment" varchar(50) DEFAULT 'DEVELOPMENT' NOT NULL,
	"timeout_seconds" integer DEFAULT 600 NOT NULL,
	"owner_id" uuid,
	"owner_email" varchar(255) NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "build_pipelines_pipeline_code_unique" UNIQUE("pipeline_code")
);
--> statement-breakpoint
CREATE TABLE "company"."build_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"run_code" varchar(100) NOT NULL,
	"pipeline_id" uuid NOT NULL,
	"commit_reference" varchar(100) NOT NULL,
	"branch_reference" varchar(100) DEFAULT 'main' NOT NULL,
	"triggered_by_id" uuid,
	"triggered_by_email" varchar(255) NOT NULL,
	"status" varchar(50) DEFAULT 'QUEUED' NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone,
	"duration_ms" integer,
	"failed_task_count" integer DEFAULT 0 NOT NULL,
	"successful_task_count" integer DEFAULT 0 NOT NULL,
	"artifact_reference" varchar(255),
	"log_reference" varchar(255),
	"environment" varchar(50) DEFAULT 'DEVELOPMENT' NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	CONSTRAINT "build_runs_run_code_unique" UNIQUE("run_code")
);
--> statement-breakpoint
CREATE TABLE "company"."cicd_pipelines" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"pipeline_code" varchar(100) NOT NULL,
	"provider" varchar(50) DEFAULT 'GITHUB_ACTIONS' NOT NULL,
	"repository_reference" varchar(255) NOT NULL,
	"workflow_reference" varchar(255) NOT NULL,
	"trigger_policy" varchar(50) DEFAULT 'ON_PUSH_MAIN' NOT NULL,
	"status" varchar(50) DEFAULT 'ACTIVE' NOT NULL,
	"owner_id" uuid,
	"owner_email" varchar(255) NOT NULL,
	"last_run_at" timestamp with time zone,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "cicd_pipelines_pipeline_code_unique" UNIQUE("pipeline_code")
);
--> statement-breakpoint
CREATE TABLE "company"."cicd_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"run_code" varchar(100) NOT NULL,
	"pipeline_id" uuid NOT NULL,
	"commit_reference" varchar(100) NOT NULL,
	"branch_reference" varchar(100) DEFAULT 'main' NOT NULL,
	"status" varchar(50) DEFAULT 'QUEUED' NOT NULL,
	"stage" varchar(50) DEFAULT 'LINT_AND_TYPECHECK' NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone,
	"duration_ms" integer,
	"runner_reference" varchar(100) DEFAULT 'TURBO_RUNNER_CLOUD' NOT NULL,
	"failure_reason" text,
	"artifact_reference" varchar(255),
	"deployment_reference" varchar(255),
	"metadata" jsonb DEFAULT '{}'::jsonb,
	CONSTRAINT "cicd_runs_run_code_unique" UNIQUE("run_code")
);
--> statement-breakpoint
CREATE TABLE "company"."dependency_edges" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"source_node_id" uuid NOT NULL,
	"target_node_id" uuid NOT NULL,
	"dependency_type" varchar(50) DEFAULT 'RUNTIME' NOT NULL,
	"version_constraint" varchar(100) DEFAULT '^1.0.0' NOT NULL,
	"is_dev_dependency" boolean DEFAULT false NOT NULL,
	"status" varchar(50) DEFAULT 'SATISFIED' NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb
);
--> statement-breakpoint
CREATE TABLE "company"."dependency_nodes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"node_code" varchar(100) NOT NULL,
	"node_type" varchar(50) DEFAULT 'WORKSPACE_PACKAGE' NOT NULL,
	"name" varchar(255) NOT NULL,
	"version" varchar(50) NOT NULL,
	"repository_reference" varchar(255),
	"status" varchar(50) DEFAULT 'HEALTHY' NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	CONSTRAINT "dependency_nodes_node_code_unique" UNIQUE("node_code")
);
--> statement-breakpoint
CREATE TABLE "company"."developer_experience_metrics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"metric_type" varchar(100) NOT NULL,
	"metric_name" varchar(255) NOT NULL,
	"numeric_value" integer DEFAULT 0 NOT NULL,
	"unit" varchar(50) DEFAULT 'MS' NOT NULL,
	"evaluation_period" varchar(100) DEFAULT 'LAST_7_DAYS' NOT NULL,
	"source_status" varchar(50) DEFAULT 'PENDING_TELEMETRY_PIPELINE' NOT NULL,
	"recorded_at" timestamp with time zone DEFAULT now() NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb
);
--> statement-breakpoint
CREATE TABLE "company"."environment_configurations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"environment_id" uuid NOT NULL,
	"configuration_code" varchar(100) NOT NULL,
	"configuration_key" varchar(255) NOT NULL,
	"value_reference" text NOT NULL,
	"value_type" varchar(50) DEFAULT 'STRING' NOT NULL,
	"classification" varchar(50) DEFAULT 'INTERNAL' NOT NULL,
	"secret_reference" varchar(255),
	"status" varchar(50) DEFAULT 'ACTIVE' NOT NULL,
	"last_rotated_at" timestamp with time zone,
	"updated_by_id" uuid,
	"updated_by_email" varchar(255) NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	CONSTRAINT "environment_configurations_configuration_code_unique" UNIQUE("configuration_code")
);
--> statement-breakpoint
CREATE TABLE "company"."package_releases" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"release_code" varchar(100) NOT NULL,
	"package_name" varchar(255) NOT NULL,
	"version" varchar(50) NOT NULL,
	"release_type" varchar(50) DEFAULT 'MINOR' NOT NULL,
	"status" varchar(50) DEFAULT 'RELEASED' NOT NULL,
	"artifact_reference" varchar(255),
	"commit_reference" varchar(100) NOT NULL,
	"release_notes_reference" text NOT NULL,
	"released_by_id" uuid,
	"released_by_email" varchar(255) NOT NULL,
	"released_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deprecation_date" timestamp with time zone,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	CONSTRAINT "package_releases_release_code_unique" UNIQUE("release_code")
);
--> statement-breakpoint
CREATE TABLE "company"."platform_artifacts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"artifact_code" varchar(100) NOT NULL,
	"repository_id" uuid NOT NULL,
	"package_name" varchar(255) NOT NULL,
	"version" varchar(50) NOT NULL,
	"artifact_type" varchar(50) DEFAULT 'CONTAINER_IMAGE' NOT NULL,
	"digest" varchar(255) NOT NULL,
	"size_bytes" integer DEFAULT 0 NOT NULL,
	"build_run_id" uuid,
	"status" varchar(50) DEFAULT 'ACTIVE' NOT NULL,
	"published_at" timestamp with time zone DEFAULT now() NOT NULL,
	"retention_until" timestamp with time zone,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	CONSTRAINT "platform_artifacts_artifact_code_unique" UNIQUE("artifact_code")
);
--> statement-breakpoint
CREATE TABLE "company"."platform_audit_traces" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"trace_id" varchar(100) NOT NULL,
	"actor_id" uuid,
	"actor_email" varchar(255) NOT NULL,
	"action" varchar(100) NOT NULL,
	"resource_reference" varchar(255) NOT NULL,
	"environment" varchar(50) DEFAULT 'DEVELOPMENT' NOT NULL,
	"operation_status" varchar(50) DEFAULT 'SUCCESS' NOT NULL,
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL,
	"correlation_reference" varchar(255) NOT NULL,
	"evidence_reference" varchar(255) NOT NULL,
	"reason" text NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	CONSTRAINT "platform_audit_traces_trace_id_unique" UNIQUE("trace_id")
);
--> statement-breakpoint
CREATE TABLE "company"."platform_deployments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"deployment_code" varchar(100) NOT NULL,
	"environment_id" uuid NOT NULL,
	"artifact_reference" varchar(255) NOT NULL,
	"release_reference" varchar(100),
	"commit_reference" varchar(100) NOT NULL,
	"deployment_strategy" varchar(50) DEFAULT 'ROLLING' NOT NULL,
	"status" varchar(50) DEFAULT 'DEPLOYED' NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone,
	"deployed_by_id" uuid,
	"deployed_by_email" varchar(255) NOT NULL,
	"rollback_reference" varchar(100),
	"failure_reason" text,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	CONSTRAINT "platform_deployments_deployment_code_unique" UNIQUE("deployment_code")
);
--> statement-breakpoint
CREATE TABLE "company"."platform_environments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"environment_code" varchar(100) NOT NULL,
	"environment_name" varchar(255) NOT NULL,
	"environment_type" varchar(50) DEFAULT 'DEVELOPMENT' NOT NULL,
	"status" varchar(50) DEFAULT 'HEALTHY' NOT NULL,
	"region_reference" varchar(100) DEFAULT 'us-east-1' NOT NULL,
	"deployment_policy_reference" varchar(100) DEFAULT 'AUTOMATED_PR_PREVIEW' NOT NULL,
	"owner_id" uuid,
	"owner_email" varchar(255) NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "platform_environments_environment_code_unique" UNIQUE("environment_code")
);
--> statement-breakpoint
CREATE TABLE "company"."platform_incidents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"incident_code" varchar(100) NOT NULL,
	"category" varchar(100) NOT NULL,
	"severity" varchar(50) DEFAULT 'MEDIUM' NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text NOT NULL,
	"source" varchar(100) NOT NULL,
	"status" varchar(50) DEFAULT 'OPEN' NOT NULL,
	"assigned_to_id" uuid,
	"assigned_to_email" varchar(255),
	"detected_at" timestamp with time zone DEFAULT now() NOT NULL,
	"acknowledged_at" timestamp with time zone,
	"resolved_at" timestamp with time zone,
	"resolution_notes" text,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "platform_incidents_incident_code_unique" UNIQUE("incident_code")
);
--> statement-breakpoint
CREATE TABLE "company"."platform_projects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_code" varchar(100) NOT NULL,
	"project_name" varchar(255) NOT NULL,
	"description" text NOT NULL,
	"repository_reference" varchar(255) NOT NULL,
	"default_branch" varchar(100) DEFAULT 'main' NOT NULL,
	"project_type" varchar(50) DEFAULT 'MONOREPO' NOT NULL,
	"status" varchar(50) DEFAULT 'ACTIVE' NOT NULL,
	"owner_id" uuid,
	"owner_email" varchar(255) NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "platform_projects_project_code_unique" UNIQUE("project_code")
);
--> statement-breakpoint
ALTER TABLE "company"."artifact_repositories" ADD CONSTRAINT "artifact_repositories_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "core"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company"."build_pipelines" ADD CONSTRAINT "build_pipelines_project_id_platform_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "company"."platform_projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company"."build_pipelines" ADD CONSTRAINT "build_pipelines_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "core"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company"."build_runs" ADD CONSTRAINT "build_runs_pipeline_id_build_pipelines_id_fk" FOREIGN KEY ("pipeline_id") REFERENCES "company"."build_pipelines"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company"."build_runs" ADD CONSTRAINT "build_runs_triggered_by_id_users_id_fk" FOREIGN KEY ("triggered_by_id") REFERENCES "core"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company"."cicd_pipelines" ADD CONSTRAINT "cicd_pipelines_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "core"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company"."cicd_runs" ADD CONSTRAINT "cicd_runs_pipeline_id_cicd_pipelines_id_fk" FOREIGN KEY ("pipeline_id") REFERENCES "company"."cicd_pipelines"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company"."dependency_edges" ADD CONSTRAINT "dependency_edges_source_node_id_dependency_nodes_id_fk" FOREIGN KEY ("source_node_id") REFERENCES "company"."dependency_nodes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company"."dependency_edges" ADD CONSTRAINT "dependency_edges_target_node_id_dependency_nodes_id_fk" FOREIGN KEY ("target_node_id") REFERENCES "company"."dependency_nodes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company"."environment_configurations" ADD CONSTRAINT "environment_configurations_environment_id_platform_environments_id_fk" FOREIGN KEY ("environment_id") REFERENCES "company"."platform_environments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company"."environment_configurations" ADD CONSTRAINT "environment_configurations_updated_by_id_users_id_fk" FOREIGN KEY ("updated_by_id") REFERENCES "core"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company"."package_releases" ADD CONSTRAINT "package_releases_released_by_id_users_id_fk" FOREIGN KEY ("released_by_id") REFERENCES "core"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company"."platform_artifacts" ADD CONSTRAINT "platform_artifacts_repository_id_artifact_repositories_id_fk" FOREIGN KEY ("repository_id") REFERENCES "company"."artifact_repositories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company"."platform_artifacts" ADD CONSTRAINT "platform_artifacts_build_run_id_build_runs_id_fk" FOREIGN KEY ("build_run_id") REFERENCES "company"."build_runs"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company"."platform_audit_traces" ADD CONSTRAINT "platform_audit_traces_actor_id_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "core"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company"."platform_deployments" ADD CONSTRAINT "platform_deployments_environment_id_platform_environments_id_fk" FOREIGN KEY ("environment_id") REFERENCES "company"."platform_environments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company"."platform_deployments" ADD CONSTRAINT "platform_deployments_deployed_by_id_users_id_fk" FOREIGN KEY ("deployed_by_id") REFERENCES "core"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company"."platform_environments" ADD CONSTRAINT "platform_environments_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "core"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company"."platform_incidents" ADD CONSTRAINT "platform_incidents_assigned_to_id_users_id_fk" FOREIGN KEY ("assigned_to_id") REFERENCES "core"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company"."platform_projects" ADD CONSTRAINT "platform_projects_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "core"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_artifact_repo_type" ON "company"."artifact_repositories" USING btree ("repository_type");--> statement-breakpoint
CREATE INDEX "idx_artifact_repo_status" ON "company"."artifact_repositories" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_build_pipe_proj" ON "company"."build_pipelines" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "idx_build_pipe_type" ON "company"."build_pipelines" USING btree ("pipeline_type");--> statement-breakpoint
CREATE INDEX "idx_build_pipe_status" ON "company"."build_pipelines" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_build_runs_pipe" ON "company"."build_runs" USING btree ("pipeline_id");--> statement-breakpoint
CREATE INDEX "idx_build_runs_status" ON "company"."build_runs" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_build_runs_commit" ON "company"."build_runs" USING btree ("commit_reference");--> statement-breakpoint
CREATE INDEX "idx_build_runs_started" ON "company"."build_runs" USING btree ("started_at");--> statement-breakpoint
CREATE INDEX "idx_cicd_pipe_prov" ON "company"."cicd_pipelines" USING btree ("provider");--> statement-breakpoint
CREATE INDEX "idx_cicd_pipe_status" ON "company"."cicd_pipelines" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_cicd_runs_pipe" ON "company"."cicd_runs" USING btree ("pipeline_id");--> statement-breakpoint
CREATE INDEX "idx_cicd_runs_status" ON "company"."cicd_runs" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_cicd_runs_stage" ON "company"."cicd_runs" USING btree ("stage");--> statement-breakpoint
CREATE INDEX "idx_cicd_runs_started" ON "company"."cicd_runs" USING btree ("started_at");--> statement-breakpoint
CREATE INDEX "idx_dep_edges_src" ON "company"."dependency_edges" USING btree ("source_node_id");--> statement-breakpoint
CREATE INDEX "idx_dep_edges_target" ON "company"."dependency_edges" USING btree ("target_node_id");--> statement-breakpoint
CREATE INDEX "idx_dep_edges_type" ON "company"."dependency_edges" USING btree ("dependency_type");--> statement-breakpoint
CREATE INDEX "idx_dep_nodes_type" ON "company"."dependency_nodes" USING btree ("node_type");--> statement-breakpoint
CREATE INDEX "idx_dep_nodes_name" ON "company"."dependency_nodes" USING btree ("name");--> statement-breakpoint
CREATE INDEX "idx_dep_nodes_status" ON "company"."dependency_nodes" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_devex_type" ON "company"."developer_experience_metrics" USING btree ("metric_type");--> statement-breakpoint
CREATE INDEX "idx_devex_recorded" ON "company"."developer_experience_metrics" USING btree ("recorded_at");--> statement-breakpoint
CREATE INDEX "idx_env_config_env" ON "company"."environment_configurations" USING btree ("environment_id");--> statement-breakpoint
CREATE INDEX "idx_env_config_key" ON "company"."environment_configurations" USING btree ("configuration_key");--> statement-breakpoint
CREATE INDEX "idx_env_config_status" ON "company"."environment_configurations" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_pkg_rel_name" ON "company"."package_releases" USING btree ("package_name");--> statement-breakpoint
CREATE INDEX "idx_pkg_rel_status" ON "company"."package_releases" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_pkg_rel_released_at" ON "company"."package_releases" USING btree ("released_at");--> statement-breakpoint
CREATE INDEX "idx_artifacts_repo" ON "company"."platform_artifacts" USING btree ("repository_id");--> statement-breakpoint
CREATE INDEX "idx_artifacts_pkg" ON "company"."platform_artifacts" USING btree ("package_name");--> statement-breakpoint
CREATE INDEX "idx_artifacts_status" ON "company"."platform_artifacts" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_artifacts_published" ON "company"."platform_artifacts" USING btree ("published_at");--> statement-breakpoint
CREATE INDEX "idx_plat_trace_actor" ON "company"."platform_audit_traces" USING btree ("actor_email");--> statement-breakpoint
CREATE INDEX "idx_plat_trace_status" ON "company"."platform_audit_traces" USING btree ("operation_status");--> statement-breakpoint
CREATE INDEX "idx_plat_trace_occurred" ON "company"."platform_audit_traces" USING btree ("occurred_at");--> statement-breakpoint
CREATE INDEX "idx_plat_dep_env" ON "company"."platform_deployments" USING btree ("environment_id");--> statement-breakpoint
CREATE INDEX "idx_plat_dep_status" ON "company"."platform_deployments" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_plat_dep_started" ON "company"."platform_deployments" USING btree ("started_at");--> statement-breakpoint
CREATE INDEX "idx_plat_env_type" ON "company"."platform_environments" USING btree ("environment_type");--> statement-breakpoint
CREATE INDEX "idx_plat_env_status" ON "company"."platform_environments" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_plat_inc_sev" ON "company"."platform_incidents" USING btree ("severity");--> statement-breakpoint
CREATE INDEX "idx_plat_inc_status" ON "company"."platform_incidents" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_plat_inc_detected" ON "company"."platform_incidents" USING btree ("detected_at");--> statement-breakpoint
CREATE INDEX "idx_plat_proj_status" ON "company"."platform_projects" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_plat_proj_owner" ON "company"."platform_projects" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "idx_plat_proj_type" ON "company"."platform_projects" USING btree ("project_type");