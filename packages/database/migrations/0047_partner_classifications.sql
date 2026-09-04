CREATE TABLE IF NOT EXISTS "company"."partner_classifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" varchar(50) NOT NULL UNIQUE,
	"label" varchar(100) NOT NULL,
	"description" text,
	"category" varchar(50) DEFAULT 'HEALTHCARE_PROVIDER' NOT NULL,
	"icon" varchar(20),
	"default_plan_code" varchar(50),
	"status" varchar(20) DEFAULT 'ACTIVE' NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_partner_class_status" ON "company"."partner_classifications" USING btree ("status");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_partner_class_sort" ON "company"."partner_classifications" USING btree ("sort_order");
--> statement-breakpoint
INSERT INTO "company"."partner_classifications" ("code", "label", "description", "category", "icon", "default_plan_code", "sort_order")
VALUES
  ('HOSPITAL_NETWORK', 'Hospital Network', 'Multi-specialty tertiary or secondary care hospital network', 'HEALTHCARE_PROVIDER', '🏥', 'PLAN_HOSPITAL_PRO', 1),
  ('CLINIC_GROUP', 'Clinic Group / Polyclinic', 'Outpatient primary and multi-specialty care clinics', 'HEALTHCARE_PROVIDER', '🩺', 'PLAN_CLINIC_STARTER', 2),
  ('PHARMACY', 'Independent Pharmacy Store (Chemist & Druggist)', 'Retail allopathic medication dispensing and inventory store', 'RETAIL_HEALTHCARE', '💊', 'PLAN_CLINIC_STARTER', 3),
  ('DIAGNOSTIC_LAB', 'Diagnostic Pathology Lab', 'NABL accredited pathology and clinical diagnostics', 'DIAGNOSTICS', '🧪', 'PLAN_CLINIC_STARTER', 4),
  ('SURGICAL_CENTER', 'Surgical Center', 'Ambulatory day care and day-surgery pavilion', 'HEALTHCARE_PROVIDER', '🏥', 'PLAN_CLINIC_STARTER', 5),
  ('INDIVIDUAL_PRACTICE', 'Individual Specialist Practice', 'Solo physician outpatient consulting room', 'HEALTHCARE_PROVIDER', '👨‍⚕️', 'PLAN_CLINIC_STARTER', 6)
ON CONFLICT ("code") DO NOTHING;
