CREATE TABLE "company"."api_rate_limit_policies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"policy_code" varchar(100) NOT NULL,
	"name" varchar(255) NOT NULL,
	"scope_type" varchar(50) DEFAULT 'GLOBAL' NOT NULL,
	"scope_reference" varchar(100) DEFAULT 'GLOBAL' NOT NULL,
	"limit_value" integer DEFAULT 1000 NOT NULL,
	"period" varchar(50) DEFAULT 'MINUTE' NOT NULL,
	"burst_limit" integer DEFAULT 1500 NOT NULL,
	"action" varchar(50) DEFAULT 'BLOCK_429' NOT NULL,
	"status" varchar(50) DEFAULT 'ACTIVE' NOT NULL,
	"effective_date" timestamp with time zone,
	"expiration_date" timestamp with time zone,
	"owner_id" uuid,
	"owner_email" varchar(255) NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "api_rate_limit_policies_policy_code_unique" UNIQUE("policy_code")
);
--> statement-breakpoint
CREATE TABLE "company"."api_routes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"route_code" varchar(100) NOT NULL,
	"method" varchar(20) DEFAULT 'GET' NOT NULL,
	"path_pattern" varchar(255) NOT NULL,
	"service_name" varchar(100) NOT NULL,
	"domain" varchar(100) NOT NULL,
	"version" varchar(50) DEFAULT 'v1' NOT NULL,
	"environment" varchar(50) DEFAULT 'PRODUCTION' NOT NULL,
	"status" varchar(50) DEFAULT 'ACTIVE' NOT NULL,
	"authentication_required" boolean DEFAULT true NOT NULL,
	"required_permission" varchar(100),
	"rate_limit_policy_id" uuid,
	"description" text NOT NULL,
	"owner_id" uuid,
	"owner_email" varchar(255) NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "api_routes_route_code_unique" UNIQUE("route_code")
);
--> statement-breakpoint
CREATE TABLE "company"."api_usage_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"route_id" uuid NOT NULL,
	"connection_id" uuid,
	"tenant_scope" varchar(50) DEFAULT 'PLATFORM' NOT NULL,
	"environment" varchar(50) DEFAULT 'PRODUCTION' NOT NULL,
	"request_count" integer DEFAULT 0 NOT NULL,
	"success_count" integer DEFAULT 0 NOT NULL,
	"error_count" integer DEFAULT 0 NOT NULL,
	"rate_limited_count" integer DEFAULT 0 NOT NULL,
	"recorded_at" timestamp with time zone DEFAULT now() NOT NULL,
	"source_status" varchar(50) DEFAULT 'PENDING_TELEMETRY_PIPELINE' NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb
);
--> statement-breakpoint
CREATE TABLE "company"."api_versions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"api_name" varchar(100) NOT NULL,
	"version" varchar(50) NOT NULL,
	"status" varchar(50) DEFAULT 'ACTIVE' NOT NULL,
	"release_date" timestamp with time zone DEFAULT now() NOT NULL,
	"deprecation_date" timestamp with time zone,
	"sunset_date" timestamp with time zone,
	"breaking_change" boolean DEFAULT false NOT NULL,
	"migration_reference" varchar(255),
	"owner_id" uuid,
	"owner_email" varchar(255) NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "company"."fhir_capabilities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"connection_id" uuid NOT NULL,
	"fhir_version" varchar(50) DEFAULT 'FHIR_R4' NOT NULL,
	"capability_mode" varchar(50) DEFAULT 'BRIDGE' NOT NULL,
	"resource_types" jsonb DEFAULT '[]'::jsonb,
	"search_supported" boolean DEFAULT true NOT NULL,
	"create_supported" boolean DEFAULT false NOT NULL,
	"read_supported" boolean DEFAULT true NOT NULL,
	"update_supported" boolean DEFAULT false NOT NULL,
	"delete_supported" boolean DEFAULT false NOT NULL,
	"batch_supported" boolean DEFAULT true NOT NULL,
	"subscription_supported" boolean DEFAULT false NOT NULL,
	"status" varchar(50) DEFAULT 'ONLINE' NOT NULL,
	"capability_reference" varchar(255) NOT NULL,
	"last_verified_at" timestamp with time zone,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "company"."fhir_resource_configurations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"connection_id" uuid NOT NULL,
	"resource_type" varchar(100) NOT NULL,
	"status" varchar(50) DEFAULT 'ENABLED' NOT NULL,
	"read_enabled" boolean DEFAULT true NOT NULL,
	"write_enabled" boolean DEFAULT false NOT NULL,
	"search_enabled" boolean DEFAULT true NOT NULL,
	"export_enabled" boolean DEFAULT false NOT NULL,
	"validation_mode" varchar(50) DEFAULT 'STRICT_US_CORE' NOT NULL,
	"mapping_reference" varchar(255) NOT NULL,
	"governance_policy_reference" varchar(255) NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "company"."hl7_endpoints" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"endpoint_code" varchar(100) NOT NULL,
	"connection_id" uuid NOT NULL,
	"hl7_version" varchar(50) DEFAULT 'HL7_V2_5_1' NOT NULL,
	"message_types" jsonb DEFAULT '[]'::jsonb,
	"transport_protocol" varchar(50) DEFAULT 'MLLP_TLS' NOT NULL,
	"acknowledgement_mode" varchar(50) DEFAULT 'ORIGINAL_MODE' NOT NULL,
	"status" varchar(50) DEFAULT 'ONLINE' NOT NULL,
	"facility_reference" varchar(255) NOT NULL,
	"routing_rules" jsonb DEFAULT '[]'::jsonb,
	"last_message_at" timestamp with time zone,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "hl7_endpoints_endpoint_code_unique" UNIQUE("endpoint_code")
);
--> statement-breakpoint
CREATE TABLE "company"."integration_audit_traces" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"trace_id" varchar(100) NOT NULL,
	"connection_id" uuid,
	"route_id" uuid,
	"webhook_delivery_id" uuid,
	"actor_id" uuid,
	"actor_email" varchar(255) NOT NULL,
	"action" varchar(100) NOT NULL,
	"operation_status" varchar(50) DEFAULT 'SUCCESS' NOT NULL,
	"environment" varchar(50) DEFAULT 'PRODUCTION' NOT NULL,
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL,
	"correlation_reference" varchar(255) NOT NULL,
	"evidence_reference" varchar(255) NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	CONSTRAINT "integration_audit_traces_trace_id_unique" UNIQUE("trace_id")
);
--> statement-breakpoint
CREATE TABLE "company"."integration_connections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"connection_code" varchar(100) NOT NULL,
	"provider_id" uuid NOT NULL,
	"endpoint_id" uuid NOT NULL,
	"partner_id" uuid,
	"tenant_scope" varchar(50) DEFAULT 'PLATFORM' NOT NULL,
	"environment" varchar(50) DEFAULT 'PRODUCTION' NOT NULL,
	"status" varchar(50) DEFAULT 'CONNECTED' NOT NULL,
	"last_success_at" timestamp with time zone,
	"last_failure_at" timestamp with time zone,
	"last_health_check_at" timestamp with time zone,
	"failure_count" integer DEFAULT 0 NOT NULL,
	"success_count" integer DEFAULT 0 NOT NULL,
	"health_status" varchar(50) DEFAULT 'PENDING_TELEMETRY_PIPELINE' NOT NULL,
	"credential_reference_id" uuid,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "integration_connections_connection_code_unique" UNIQUE("connection_code")
);
--> statement-breakpoint
CREATE TABLE "company"."integration_credentials" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"credential_code" varchar(100) NOT NULL,
	"credential_type" varchar(100) NOT NULL,
	"owner_type" varchar(50) DEFAULT 'PROVIDER' NOT NULL,
	"owner_reference" varchar(255) NOT NULL,
	"status" varchar(50) DEFAULT 'ACTIVE' NOT NULL,
	"secret_reference" varchar(255) NOT NULL,
	"created_by_id" uuid,
	"created_by_email" varchar(255) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_rotated_at" timestamp with time zone,
	"next_rotation_due" timestamp with time zone,
	"revoked_at" timestamp with time zone,
	"expires_at" timestamp with time zone,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	CONSTRAINT "integration_credentials_credential_code_unique" UNIQUE("credential_code")
);
--> statement-breakpoint
CREATE TABLE "company"."integration_endpoints" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"endpoint_code" varchar(100) NOT NULL,
	"provider_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"base_url_reference" varchar(255) NOT NULL,
	"environment" varchar(50) DEFAULT 'PRODUCTION' NOT NULL,
	"status" varchar(50) DEFAULT 'ONLINE' NOT NULL,
	"authentication_method" varchar(50) DEFAULT 'BEARER_JWT' NOT NULL,
	"health_check_path_reference" varchar(255),
	"timeout_ms" integer DEFAULT 5000 NOT NULL,
	"retry_policy" varchar(100) DEFAULT 'EXPONENTIAL_BACKOFF_3X' NOT NULL,
	"owner_id" uuid,
	"owner_email" varchar(255) NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "integration_endpoints_endpoint_code_unique" UNIQUE("endpoint_code")
);
--> statement-breakpoint
CREATE TABLE "company"."integration_health" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"connection_id" uuid NOT NULL,
	"health_status" varchar(50) DEFAULT 'PENDING_TELEMETRY_PIPELINE' NOT NULL,
	"availability_status" varchar(50) DEFAULT 'TELEMETRY_PENDING' NOT NULL,
	"latency_ms" integer,
	"consecutive_failures" integer DEFAULT 0 NOT NULL,
	"last_success_at" timestamp with time zone,
	"last_failure_at" timestamp with time zone,
	"checked_at" timestamp with time zone DEFAULT now() NOT NULL,
	"check_source" varchar(100) DEFAULT 'GATEWAY_PROBE' NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb
);
--> statement-breakpoint
CREATE TABLE "company"."integration_incidents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"incident_code" varchar(100) NOT NULL,
	"connection_id" uuid,
	"provider_id" uuid,
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
	CONSTRAINT "integration_incidents_incident_code_unique" UNIQUE("incident_code")
);
--> statement-breakpoint
CREATE TABLE "company"."integration_providers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"provider_code" varchar(100) NOT NULL,
	"provider_name" varchar(255) NOT NULL,
	"description" text NOT NULL,
	"integration_type" varchar(50) DEFAULT 'CUSTOM_REST_API' NOT NULL,
	"protocol" varchar(50) DEFAULT 'REST_JSON' NOT NULL,
	"status" varchar(50) DEFAULT 'ACTIVE' NOT NULL,
	"owner_id" uuid,
	"owner_email" varchar(255) NOT NULL,
	"documentation_reference" varchar(255) NOT NULL,
	"support_reference" varchar(255),
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "integration_providers_provider_code_unique" UNIQUE("provider_code")
);
--> statement-breakpoint
CREATE TABLE "company"."webhook_deliveries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"delivery_id" varchar(100) NOT NULL,
	"webhook_endpoint_id" uuid NOT NULL,
	"event_type" varchar(100) NOT NULL,
	"delivery_status" varchar(50) DEFAULT 'DELIVERED' NOT NULL,
	"attempt_number" integer DEFAULT 1 NOT NULL,
	"response_status" integer,
	"latency_ms" integer,
	"failure_reason" varchar(100),
	"delivered_at" timestamp with time zone,
	"next_retry_at" timestamp with time zone,
	"trace_reference" varchar(255) NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "webhook_deliveries_delivery_id_unique" UNIQUE("delivery_id")
);
--> statement-breakpoint
CREATE TABLE "company"."webhook_endpoints" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"webhook_code" varchar(100) NOT NULL,
	"provider_id" uuid,
	"connection_id" uuid,
	"endpoint_reference" varchar(255) NOT NULL,
	"event_types" jsonb DEFAULT '[]'::jsonb,
	"status" varchar(50) DEFAULT 'ACTIVE' NOT NULL,
	"authentication_method" varchar(50) DEFAULT 'WEBHOOK_HMAC_SIGNATURE' NOT NULL,
	"retry_policy" varchar(100) DEFAULT 'EXPONENTIAL_BACKOFF_5X' NOT NULL,
	"max_retry_attempts" integer DEFAULT 5 NOT NULL,
	"timeout_ms" integer DEFAULT 5000 NOT NULL,
	"last_delivery_at" timestamp with time zone,
	"last_failure_at" timestamp with time zone,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "webhook_endpoints_webhook_code_unique" UNIQUE("webhook_code")
);
--> statement-breakpoint
ALTER TABLE "company"."api_rate_limit_policies" ADD CONSTRAINT "api_rate_limit_policies_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "core"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company"."api_routes" ADD CONSTRAINT "api_routes_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "core"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company"."api_usage_records" ADD CONSTRAINT "api_usage_records_route_id_api_routes_id_fk" FOREIGN KEY ("route_id") REFERENCES "company"."api_routes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company"."api_usage_records" ADD CONSTRAINT "api_usage_records_connection_id_integration_connections_id_fk" FOREIGN KEY ("connection_id") REFERENCES "company"."integration_connections"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company"."api_versions" ADD CONSTRAINT "api_versions_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "core"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company"."fhir_capabilities" ADD CONSTRAINT "fhir_capabilities_connection_id_integration_connections_id_fk" FOREIGN KEY ("connection_id") REFERENCES "company"."integration_connections"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company"."fhir_resource_configurations" ADD CONSTRAINT "fhir_resource_configurations_connection_id_integration_connections_id_fk" FOREIGN KEY ("connection_id") REFERENCES "company"."integration_connections"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company"."hl7_endpoints" ADD CONSTRAINT "hl7_endpoints_connection_id_integration_connections_id_fk" FOREIGN KEY ("connection_id") REFERENCES "company"."integration_connections"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company"."integration_audit_traces" ADD CONSTRAINT "integration_audit_traces_connection_id_integration_connections_id_fk" FOREIGN KEY ("connection_id") REFERENCES "company"."integration_connections"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company"."integration_audit_traces" ADD CONSTRAINT "integration_audit_traces_route_id_api_routes_id_fk" FOREIGN KEY ("route_id") REFERENCES "company"."api_routes"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company"."integration_audit_traces" ADD CONSTRAINT "integration_audit_traces_webhook_delivery_id_webhook_deliveries_id_fk" FOREIGN KEY ("webhook_delivery_id") REFERENCES "company"."webhook_deliveries"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company"."integration_audit_traces" ADD CONSTRAINT "integration_audit_traces_actor_id_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "core"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company"."integration_connections" ADD CONSTRAINT "integration_connections_provider_id_integration_providers_id_fk" FOREIGN KEY ("provider_id") REFERENCES "company"."integration_providers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company"."integration_connections" ADD CONSTRAINT "integration_connections_endpoint_id_integration_endpoints_id_fk" FOREIGN KEY ("endpoint_id") REFERENCES "company"."integration_endpoints"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company"."integration_connections" ADD CONSTRAINT "integration_connections_partner_id_partner_profiles_id_fk" FOREIGN KEY ("partner_id") REFERENCES "company"."partner_profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company"."integration_credentials" ADD CONSTRAINT "integration_credentials_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "core"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company"."integration_endpoints" ADD CONSTRAINT "integration_endpoints_provider_id_integration_providers_id_fk" FOREIGN KEY ("provider_id") REFERENCES "company"."integration_providers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company"."integration_endpoints" ADD CONSTRAINT "integration_endpoints_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "core"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company"."integration_health" ADD CONSTRAINT "integration_health_connection_id_integration_connections_id_fk" FOREIGN KEY ("connection_id") REFERENCES "company"."integration_connections"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company"."integration_incidents" ADD CONSTRAINT "integration_incidents_connection_id_integration_connections_id_fk" FOREIGN KEY ("connection_id") REFERENCES "company"."integration_connections"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company"."integration_incidents" ADD CONSTRAINT "integration_incidents_provider_id_integration_providers_id_fk" FOREIGN KEY ("provider_id") REFERENCES "company"."integration_providers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company"."integration_incidents" ADD CONSTRAINT "integration_incidents_assigned_to_id_users_id_fk" FOREIGN KEY ("assigned_to_id") REFERENCES "core"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company"."integration_providers" ADD CONSTRAINT "integration_providers_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "core"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company"."webhook_deliveries" ADD CONSTRAINT "webhook_deliveries_webhook_endpoint_id_webhook_endpoints_id_fk" FOREIGN KEY ("webhook_endpoint_id") REFERENCES "company"."webhook_endpoints"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company"."webhook_endpoints" ADD CONSTRAINT "webhook_endpoints_provider_id_integration_providers_id_fk" FOREIGN KEY ("provider_id") REFERENCES "company"."integration_providers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company"."webhook_endpoints" ADD CONSTRAINT "webhook_endpoints_connection_id_integration_connections_id_fk" FOREIGN KEY ("connection_id") REFERENCES "company"."integration_connections"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_rate_limit_scope_type" ON "company"."api_rate_limit_policies" USING btree ("scope_type");--> statement-breakpoint
CREATE INDEX "idx_rate_limit_scope_ref" ON "company"."api_rate_limit_policies" USING btree ("scope_reference");--> statement-breakpoint
CREATE INDEX "idx_rate_limit_status" ON "company"."api_rate_limit_policies" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_api_routes_service" ON "company"."api_routes" USING btree ("service_name");--> statement-breakpoint
CREATE INDEX "idx_api_routes_domain" ON "company"."api_routes" USING btree ("domain");--> statement-breakpoint
CREATE INDEX "idx_api_routes_version" ON "company"."api_routes" USING btree ("version");--> statement-breakpoint
CREATE INDEX "idx_api_routes_env" ON "company"."api_routes" USING btree ("environment");--> statement-breakpoint
CREATE INDEX "idx_api_routes_status" ON "company"."api_routes" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_api_usage_route" ON "company"."api_usage_records" USING btree ("route_id");--> statement-breakpoint
CREATE INDEX "idx_api_usage_conn" ON "company"."api_usage_records" USING btree ("connection_id");--> statement-breakpoint
CREATE INDEX "idx_api_usage_env" ON "company"."api_usage_records" USING btree ("environment");--> statement-breakpoint
CREATE INDEX "idx_api_usage_recorded" ON "company"."api_usage_records" USING btree ("recorded_at");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_api_versions_name_ver" ON "company"."api_versions" USING btree ("api_name","version");--> statement-breakpoint
CREATE INDEX "idx_api_versions_name" ON "company"."api_versions" USING btree ("api_name");--> statement-breakpoint
CREATE INDEX "idx_api_versions_status" ON "company"."api_versions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_api_versions_sunset" ON "company"."api_versions" USING btree ("sunset_date");--> statement-breakpoint
CREATE INDEX "idx_fhir_cap_conn" ON "company"."fhir_capabilities" USING btree ("connection_id");--> statement-breakpoint
CREATE INDEX "idx_fhir_cap_ver" ON "company"."fhir_capabilities" USING btree ("fhir_version");--> statement-breakpoint
CREATE INDEX "idx_fhir_cap_status" ON "company"."fhir_capabilities" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_fhir_res_conn_type" ON "company"."fhir_resource_configurations" USING btree ("connection_id","resource_type");--> statement-breakpoint
CREATE INDEX "idx_fhir_res_conn" ON "company"."fhir_resource_configurations" USING btree ("connection_id");--> statement-breakpoint
CREATE INDEX "idx_fhir_res_type" ON "company"."fhir_resource_configurations" USING btree ("resource_type");--> statement-breakpoint
CREATE INDEX "idx_fhir_res_status" ON "company"."fhir_resource_configurations" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_hl7_conn" ON "company"."hl7_endpoints" USING btree ("connection_id");--> statement-breakpoint
CREATE INDEX "idx_hl7_version" ON "company"."hl7_endpoints" USING btree ("hl7_version");--> statement-breakpoint
CREATE INDEX "idx_hl7_status" ON "company"."hl7_endpoints" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_int_trace_conn" ON "company"."integration_audit_traces" USING btree ("connection_id");--> statement-breakpoint
CREATE INDEX "idx_int_trace_route" ON "company"."integration_audit_traces" USING btree ("route_id");--> statement-breakpoint
CREATE INDEX "idx_int_trace_status" ON "company"."integration_audit_traces" USING btree ("operation_status");--> statement-breakpoint
CREATE INDEX "idx_int_trace_occurred" ON "company"."integration_audit_traces" USING btree ("occurred_at");--> statement-breakpoint
CREATE INDEX "idx_int_conn_prov" ON "company"."integration_connections" USING btree ("provider_id");--> statement-breakpoint
CREATE INDEX "idx_int_conn_partner" ON "company"."integration_connections" USING btree ("partner_id");--> statement-breakpoint
CREATE INDEX "idx_int_conn_status" ON "company"."integration_connections" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_int_conn_health" ON "company"."integration_connections" USING btree ("health_status");--> statement-breakpoint
CREATE INDEX "idx_int_conn_check_at" ON "company"."integration_connections" USING btree ("last_health_check_at");--> statement-breakpoint
CREATE INDEX "idx_int_cred_type" ON "company"."integration_credentials" USING btree ("credential_type");--> statement-breakpoint
CREATE INDEX "idx_int_cred_status" ON "company"."integration_credentials" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_int_cred_owner_ref" ON "company"."integration_credentials" USING btree ("owner_reference");--> statement-breakpoint
CREATE INDEX "idx_int_cred_next_rot" ON "company"."integration_credentials" USING btree ("next_rotation_due");--> statement-breakpoint
CREATE INDEX "idx_int_endpoints_prov" ON "company"."integration_endpoints" USING btree ("provider_id");--> statement-breakpoint
CREATE INDEX "idx_int_endpoints_env" ON "company"."integration_endpoints" USING btree ("environment");--> statement-breakpoint
CREATE INDEX "idx_int_endpoints_status" ON "company"."integration_endpoints" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_int_health_conn" ON "company"."integration_health" USING btree ("connection_id");--> statement-breakpoint
CREATE INDEX "idx_int_health_status" ON "company"."integration_health" USING btree ("health_status");--> statement-breakpoint
CREATE INDEX "idx_int_health_checked" ON "company"."integration_health" USING btree ("checked_at");--> statement-breakpoint
CREATE INDEX "idx_int_inc_conn" ON "company"."integration_incidents" USING btree ("connection_id");--> statement-breakpoint
CREATE INDEX "idx_int_inc_prov" ON "company"."integration_incidents" USING btree ("provider_id");--> statement-breakpoint
CREATE INDEX "idx_int_inc_sev" ON "company"."integration_incidents" USING btree ("severity");--> statement-breakpoint
CREATE INDEX "idx_int_inc_status" ON "company"."integration_incidents" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_int_inc_detected" ON "company"."integration_incidents" USING btree ("detected_at");--> statement-breakpoint
CREATE INDEX "idx_int_prov_type" ON "company"."integration_providers" USING btree ("integration_type");--> statement-breakpoint
CREATE INDEX "idx_int_prov_protocol" ON "company"."integration_providers" USING btree ("protocol");--> statement-breakpoint
CREATE INDEX "idx_int_prov_status" ON "company"."integration_providers" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_webhook_deliv_endpoint" ON "company"."webhook_deliveries" USING btree ("webhook_endpoint_id");--> statement-breakpoint
CREATE INDEX "idx_webhook_deliv_status" ON "company"."webhook_deliveries" USING btree ("delivery_status");--> statement-breakpoint
CREATE INDEX "idx_webhook_deliv_created" ON "company"."webhook_deliveries" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_webhook_deliv_retry" ON "company"."webhook_deliveries" USING btree ("next_retry_at");--> statement-breakpoint
CREATE INDEX "idx_webhook_endpoints_prov" ON "company"."webhook_endpoints" USING btree ("provider_id");--> statement-breakpoint
CREATE INDEX "idx_webhook_endpoints_conn" ON "company"."webhook_endpoints" USING btree ("connection_id");--> statement-breakpoint
CREATE INDEX "idx_webhook_endpoints_status" ON "company"."webhook_endpoints" USING btree ("status");