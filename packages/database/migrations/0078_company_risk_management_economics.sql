-- ==============================================================================
-- Migration: 0078_company_risk_management_economics.sql
-- Description: Real DB-backed Company Risk Management, P&L, Unit Economics &
--              Revenue Leakage Prevention tables with strict indexes & RLS.
-- ==============================================================================

CREATE TABLE IF NOT EXISTS "company"."company_cost_ledger" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "category" varchar(50) NOT NULL,
  "partner_id" uuid REFERENCES "company"."partner_profiles"("id") ON DELETE SET NULL,
  "tenant_id" uuid REFERENCES "core"."tenants"("id") ON DELETE SET NULL,
  "amount_inr" numeric(14, 2) NOT NULL,
  "billing_period" varchar(32) NOT NULL,
  "source" varchar(100) DEFAULT 'MANUAL_FINANCE_ENTRY' NOT NULL,
  "description" text,
  "created_by" varchar(255) NOT NULL,
  "incurred_at" timestamp with time zone DEFAULT now() NOT NULL,
  "metadata" jsonb DEFAULT '{}'::jsonb,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_company_cost_ledger_category" ON "company"."company_cost_ledger" USING btree ("category");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_company_cost_ledger_partner_id" ON "company"."company_cost_ledger" USING btree ("partner_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_company_cost_ledger_tenant_id" ON "company"."company_cost_ledger" USING btree ("tenant_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_company_cost_ledger_period" ON "company"."company_cost_ledger" USING btree ("billing_period");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_company_cost_ledger_incurred" ON "company"."company_cost_ledger" USING btree ("incurred_at");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "company"."risk_leakage_alerts" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "risk_type" varchar(64) NOT NULL,
  "severity" varchar(24) DEFAULT 'MEDIUM' NOT NULL,
  "partner_id" uuid REFERENCES "company"."partner_profiles"("id") ON DELETE SET NULL,
  "tenant_id" uuid REFERENCES "core"."tenants"("id") ON DELETE SET NULL,
  "title" varchar(255) NOT NULL,
  "summary" text NOT NULL,
  "estimated_loss_inr" numeric(14, 2) DEFAULT '0.00' NOT NULL,
  "monthly_burn_inr" numeric(14, 2) DEFAULT '0.00' NOT NULL,
  "evidence_json" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "prevention_rule_code" varchar(80),
  "fingerprint" varchar(180) NOT NULL,
  "status" varchar(32) DEFAULT 'OPEN' NOT NULL,
  "mitigation_action" varchar(80),
  "mitigated_by" varchar(255),
  "mitigated_at" timestamp with time zone,
  "mitigation_notes" text,
  "detected_at" timestamp with time zone DEFAULT now() NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "uq_risk_leakage_alerts_fingerprint" ON "company"."risk_leakage_alerts" USING btree ("fingerprint");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_risk_leakage_alerts_type" ON "company"."risk_leakage_alerts" USING btree ("risk_type");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_risk_leakage_alerts_status" ON "company"."risk_leakage_alerts" USING btree ("status");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_risk_leakage_alerts_severity" ON "company"."risk_leakage_alerts" USING btree ("severity");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_risk_leakage_alerts_partner_id" ON "company"."risk_leakage_alerts" USING btree ("partner_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_risk_leakage_alerts_tenant_id" ON "company"."risk_leakage_alerts" USING btree ("tenant_id");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "company"."risk_prevention_policies" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "policy_code" varchar(80) NOT NULL,
  "policy_name" varchar(200) NOT NULL,
  "min_gross_margin_percent" numeric(6, 2) DEFAULT '25.00' NOT NULL,
  "max_discount_percent_without_cfo" numeric(6, 2) DEFAULT '20.00' NOT NULL,
  "max_grace_days_before_throttle" integer DEFAULT 7 NOT NULL,
  "free_tier_monthly_cogs_cap_inr" numeric(12, 2) DEFAULT '2500.00' NOT NULL,
  "partner_refund_spike_threshold_percent" numeric(6, 2) DEFAULT '15.00' NOT NULL,
  "auto_throttle_unpaid_overdue" boolean DEFAULT true NOT NULL,
  "auto_block_below_margin_floor" boolean DEFAULT true NOT NULL,
  "is_active" boolean DEFAULT true NOT NULL,
  "updated_by" varchar(255) DEFAULT 'SYSTEM_RISK_BASELINE' NOT NULL,
  "metadata" jsonb DEFAULT '{}'::jsonb,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "uq_risk_prevention_policy_code" ON "company"."risk_prevention_policies" USING btree ("policy_code");
--> statement-breakpoint
INSERT INTO "company"."risk_prevention_policies" (
  "id",
  "policy_code",
  "policy_name",
  "min_gross_margin_percent",
  "max_discount_percent_without_cfo",
  "max_grace_days_before_throttle",
  "free_tier_monthly_cogs_cap_inr",
  "partner_refund_spike_threshold_percent",
  "auto_throttle_unpaid_overdue",
  "auto_block_below_margin_floor",
  "is_active",
  "updated_by"
)
VALUES (
  '78000000-0000-4000-8000-000000000001',
  'DEFAULT_GLOBAL_GUARDRAIL',
  'Baseline Platform Margin & Leakage Prevention Guardrails',
  25.00,
  20.00,
  7,
  2500.00,
  15.00,
  true,
  true,
  true,
  'SYSTEM_RISK_BASELINE'
)
ON CONFLICT ("policy_code") DO NOTHING;
--> statement-breakpoint
ALTER TABLE "company"."company_cost_ledger" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "company"."company_cost_ledger" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS "p_company_cost_ledger_isolation" ON "company"."company_cost_ledger";
--> statement-breakpoint
CREATE POLICY "p_company_cost_ledger_isolation" ON "company"."company_cost_ledger"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR ("tenant_id" IS NOT NULL AND "tenant_id" = core.get_current_tenant_id())
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR ("tenant_id" IS NOT NULL AND "tenant_id" = core.get_current_tenant_id())
  );
--> statement-breakpoint
ALTER TABLE "company"."risk_leakage_alerts" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "company"."risk_leakage_alerts" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS "p_company_risk_leakage_alerts_isolation" ON "company"."risk_leakage_alerts";
--> statement-breakpoint
CREATE POLICY "p_company_risk_leakage_alerts_isolation" ON "company"."risk_leakage_alerts"
  FOR ALL
  USING (
    core.is_super_admin() = true
    OR ("tenant_id" IS NOT NULL AND "tenant_id" = core.get_current_tenant_id())
  )
  WITH CHECK (
    core.is_super_admin() = true
    OR ("tenant_id" IS NOT NULL AND "tenant_id" = core.get_current_tenant_id())
  );
--> statement-breakpoint
ALTER TABLE "company"."risk_prevention_policies" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "company"."risk_prevention_policies" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS "p_company_risk_prevention_policies_admin" ON "company"."risk_prevention_policies";
--> statement-breakpoint
CREATE POLICY "p_company_risk_prevention_policies_admin" ON "company"."risk_prevention_policies"
  FOR ALL
  USING (core.is_super_admin() = true)
  WITH CHECK (core.is_super_admin() = true);
--> statement-breakpoint
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'docsearch_app') THEN
    GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE "company"."company_cost_ledger" TO "docsearch_app";
    GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE "company"."risk_leakage_alerts" TO "docsearch_app";
    GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE "company"."risk_prevention_policies" TO "docsearch_app";
  END IF;
END $$;
