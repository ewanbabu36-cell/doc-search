import { newDb, type IMemoryDb } from 'pg-mem';
import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import * as schema from './schema/index.js';
import { setTestDatabase } from './client.js';

export const TEST_SEEDS = {
  TENANT_A: '11111111-1111-4111-8111-111111111111',
  TENANT_B: '22222222-2222-4222-8222-222222222222',
  BRANCH_A: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  DOCTOR_ID: '99999999-9999-4999-8999-999999999999',
  PARTNER_ID_A: '00000000-0000-4000-8000-000000000001',
  ORG_ID_A: '00000000-0000-4000-8000-000000000002',
  FACILITY_ID_A: '00000000-0000-4000-8000-000000000003',
  DEPT_ID_A: '00000000-0000-4000-8000-000000000004',
  STAFF_ID_A: '00000000-0000-4000-8000-000000000005',
  PARTNER_ID_B: '00000000-0000-4000-8000-000000000011',
  ORG_ID_B: '00000000-0000-4000-8000-000000000012',
  FACILITY_ID_B: '00000000-0000-4000-8000-000000000013',
  DEPT_ID_B: '00000000-0000-4000-8000-000000000014',
  STAFF_ID_B: '00000000-0000-4000-8000-000000000015',
  INVESTIGATION_ID: '00000000-0000-4000-8000-000000000050',
  INVESTIGATION_ID_ALT: '00000000-0000-4000-8000-000000000005',
  MEDICATION_ID: '00000000-0000-4000-8000-000000000060',
  BATCH_ID: '00000000-0000-4000-8000-000000000070',
  PRODUCT_ID: '77777777-7777-4777-8777-777777777777',
  PLAN_STARTER_ID: '88888888-8888-4888-8888-888888888801',
  PLAN_PRO_ID: '88888888-8888-4888-8888-888888888802',
  PLAN_ENTERPRISE_ID: '88888888-8888-4888-8888-888888888803',
  PLAN_PATHOLOGY_ID: '88888888-8888-4888-8888-888888888811',
  PLAN_PHARMACY_ID: '88888888-8888-4888-8888-888888888812',
  PLAN_SOLO_CLINIC_ID: '88888888-8888-4888-8888-888888888813',
  PLAN_HOSPITAL_ID: '88888888-8888-4888-8888-888888888814',
  FEAT_OPD_ID: '66666666-6666-4666-8666-666666666601',
  FEAT_PHARMACY_ID: '66666666-6666-4666-8666-666666666602',
  FEAT_LAB_ID: '66666666-6666-4666-8666-666666666603',
  FEAT_INPATIENT_ID: '66666666-6666-4666-8666-666666666604',
  FEAT_BILLING_ID: '66666666-6666-4666-8666-666666666605',
  FEAT_RADIOLOGY_ID: '66666666-6666-4666-8666-666666666606',
  SUBSCRIPTION_ID_A: '33333333-3333-4333-8333-333333333301',
  LICENSE_ID_A: '44444444-4444-4444-8444-444444444401',
  SUBSCRIPTION_ID_B: '33333333-3333-4333-8333-333333333302',
  LICENSE_ID_B: '44444444-4444-4444-8444-444444444402'
};

function toLiteral(val: any): string {
  if (val === null || val === undefined) return 'null';
  if (typeof val === 'number') return val.toString();
  if (typeof val === 'boolean') return val ? 'true' : 'false';
  if (typeof val === 'string') return "'" + val.replace(/'/g, "''") + "'";
  if (val instanceof Date) return "'" + val.toISOString() + "'";
  if (typeof val === 'object') return "'" + JSON.stringify(val).replace(/'/g, "''") + "'";
  return "'" + String(val).replace(/'/g, "''") + "'";
}

function replaceArgs(sql: string, values: any[]): string {
  return sql.replace(/\$(\d+)/g, (str, istr) => {
    const i = Number.parseInt(istr, 10);
    if (i > values.length) {
      throw new Error('Unmatched parameter in query ' + str);
    }
    return toLiteral(values[i - 1]);
  });
}

let currentActiveClient: any = null;

export function createPatchedPg(mem: IMemoryDb, activeAdvisoryLocks = new Set<string>()) {
  const { Pool, Client } = (mem.adapters as any).createPg();

  function patchTarget(targetClass: any) {
    targetClass.prototype.query = function (query: any, valuesOrCallback?: any, callback?: any) {
      currentActiveClient = this;
      let text = typeof query === 'string' ? query : query?.text;
      let values: any[] | null = null;
      let isArrayRowMode = false;
      let cb = callback;

      if (Array.isArray(valuesOrCallback)) {
        values = valuesOrCallback;
      } else if (typeof valuesOrCallback === 'function') {
        cb = valuesOrCallback;
      }

      if (typeof query === 'object' && query !== null) {
        if (query.values && !values) values = query.values;
        if (query.rowMode === 'array') isArrayRowMode = true;
      }

      let sql = text || '';
      if (/^\s*SET\s+(LOCAL\s+)?app\./i.test(sql)) {
        const res = { command: 'SET', rowCount: 0, fields: [], rows: [] };
        if (cb) {
          cb(null, res);
          return null;
        }
        return Promise.resolve(res);
      }

      if (/^\s*(BEGIN|START\s+TRANSACTION)/i.test(sql)) {
        if (!this._txStack) this._txStack = [];
        this._txStack.push(mem.backup());
        const res = { command: 'BEGIN', rowCount: 0, fields: [], rows: [] };
        if (cb) {
          cb(null, res);
          return null;
        }
        return Promise.resolve(res);
      }

      if (/^\s*ROLLBACK/i.test(sql)) {
        if (this._txStack && this._txStack.length > 0) {
          const snap = this._txStack.pop();
          snap.restore();
        }
        if (this._locks) {
          for (const k of this._locks) activeAdvisoryLocks.delete(k);
          this._locks.clear();
        }
        const res = { command: 'ROLLBACK', rowCount: 0, fields: [], rows: [] };
        if (cb) {
          cb(null, res);
          return null;
        }
        return Promise.resolve(res);
      }

      if (/^\s*COMMIT/i.test(sql)) {
        if (this._txStack && this._txStack.length > 0) {
          this._txStack.pop();
        }
        if (this._locks) {
          for (const k of this._locks) activeAdvisoryLocks.delete(k);
          this._locks.clear();
        }
        const res = { command: 'COMMIT', rowCount: 0, fields: [], rows: [] };
        if (cb) {
          cb(null, res);
          return null;
        }
        return Promise.resolve(res);
      }

      if (/^\s*SAVEPOINT/i.test(sql)) {
        if (!this._txStack) this._txStack = [];
        this._txStack.push(mem.backup());
        const res = { command: 'SAVEPOINT', rowCount: 0, fields: [], rows: [] };
        if (cb) {
          cb(null, res);
          return null;
        }
        return Promise.resolve(res);
      }

      if (/^\s*ROLLBACK\s+TO\s+SAVEPOINT/i.test(sql)) {
        if (this._txStack && this._txStack.length > 0) {
          const snap = this._txStack.pop();
          snap.restore();
        }
        const res = { command: 'ROLLBACK', rowCount: 0, fields: [], rows: [] };
        if (cb) {
          cb(null, res);
          return null;
        }
        return Promise.resolve(res);
      }

      if (/^\s*RELEASE\s+SAVEPOINT/i.test(sql)) {
        if (this._txStack && this._txStack.length > 0) {
          this._txStack.pop();
        }
        const res = { command: 'RELEASE', rowCount: 0, fields: [], rows: [] };
        if (cb) {
          cb(null, res);
          return null;
        }
        return Promise.resolve(res);
      }

      if (values && values.length) {
        sql = replaceArgs(sql, values);
      }

      const cleanSql = sql.replace(/\s+FOR\s+UPDATE(\s+SKIP\s+LOCKED)?/gi, '');

      const execute = () => {
        const rawRes = mem.public.query(cleanSql);
        const fields = (rawRes.fields || []).map((f: any) => ({
          name: f.name,
          dataTypeID: f.typeId || 0
        }));

        let rows: any[];
        if (isArrayRowMode) {
          rows = (rawRes.rows || []).map((row: any) => (rawRes.fields || []).map((f: any) => row[f.name]));
        } else {
          rows = (rawRes.rows || []).map((row: any) => ({ ...row }));
        }

        return {
          command: rawRes.command,
          rowCount: rawRes.rowCount,
          fields,
          rows
        };
      };

      if (cb) {
        try {
          const res = execute();
          cb(null, res);
        } catch (err) {
          cb(err);
        }
        return null;
      }

      return new Promise((resolve, reject) => {
        try {
          resolve(execute());
        } catch (err) {
          reject(err);
        }
      });
    };
  }

  patchTarget(Pool);
  patchTarget(Client);

  return { Pool, Client };
}

function getMigrationsDir(): string {
  const candidate1 = fileURLToPath(new URL('../migrations', import.meta.url));
  if (fs.existsSync(candidate1)) return candidate1;
  const candidate2 = fileURLToPath(new URL('../../migrations', import.meta.url));
  if (fs.existsSync(candidate2)) return candidate2;
  const candidate3 = path.resolve(process.cwd(), 'packages/database/migrations');
  if (fs.existsSync(candidate3)) return candidate3;
  throw new Error('Migrations directory not found');
}

export interface TestDatabaseInstance {
  mem: IMemoryDb;
  pool: any;
  db: NodePgDatabase<typeof schema>;
  schema: typeof schema;
  cleanup: () => Promise<void>;
}

export async function createTestDatabase(options: { seedBaseline?: boolean; seedDemoFixtures?: boolean } = {}): Promise<TestDatabaseInstance> {
  const mem = newDb();

  mem.public.registerFunction({
    name: 'gen_random_uuid',
    returns: mem.public.getType('uuid' as any),
    implementation: () => crypto.randomUUID()
  });

  mem.public.registerFunction({
    name: 'version',
    returns: mem.public.getType('text' as any),
    implementation: () => 'PostgreSQL 16.0 (pg-mem test)'
  });

  const activeAdvisoryLocks = new Set<string>();

  const registerAdvisory = (targetSchema: any) => {
    targetSchema.registerFunction({
      name: 'pg_try_advisory_xact_lock',
      args: [targetSchema.getType('integer' as any), targetSchema.getType('integer' as any)],
      returns: targetSchema.getType('bool' as any),
      implementation: (k1: number, k2: number) => {
        const key = `${k1}:${k2}`;
        if (activeAdvisoryLocks.has(key)) {
          return false;
        }
        activeAdvisoryLocks.add(key);
        if (currentActiveClient) {
          if (!currentActiveClient._locks) currentActiveClient._locks = new Set<string>();
          currentActiveClient._locks.add(key);
        }
        return true;
      }
    });
  };

  registerAdvisory(mem.public);
  const pgCat = typeof (mem as any).getSchema === 'function' ? (mem as any).getSchema('pg_catalog') : null;
  if (pgCat) {
    registerAdvisory(pgCat);
  }

  const { Pool } = createPatchedPg(mem, activeAdvisoryLocks);
  const pool = new Pool();

  // Run migrations
  const migrationsDir = getMigrationsDir();
  const journalPath = path.join(migrationsDir, 'meta/_journal.json');
  const journal = JSON.parse(fs.readFileSync(journalPath, 'utf8'));

  for (const entry of journal.entries) {
    const file = path.join(migrationsDir, `${entry.tag}.sql`);
    if (!fs.existsSync(file)) continue;
    const content = fs.readFileSync(file, 'utf8');
    const statements = content.split('--> statement-breakpoint').map((s) => s.trim()).filter(Boolean);

    for (const statement of statements) {
      try {
        await pool.query(statement);
      } catch (err) {
        // Ignore RLS statements not supported by pg-mem
      }
    }
  }

  if (options.seedBaseline !== false) {
    const {
      PRODUCT_ID,
      PLAN_STARTER_ID,
      PLAN_PRO_ID,
      PLAN_ENTERPRISE_ID,
      PLAN_PATHOLOGY_ID,
      PLAN_PHARMACY_ID,
      PLAN_SOLO_CLINIC_ID,
      PLAN_HOSPITAL_ID,
      FEAT_OPD_ID,
      FEAT_PHARMACY_ID,
      FEAT_LAB_ID,
      FEAT_INPATIENT_ID,
      FEAT_BILLING_ID,
      FEAT_RADIOLOGY_ID
    } = TEST_SEEDS;

    // Platform System Infrastructure Tenant
    await pool.query(`
      INSERT INTO "core"."tenants" ("id", "name", "slug")
      VALUES 
        ('00000000-0000-4000-a000-000000000001', 'Doc Search Healthcare Platform', 'docsearch-platform')
      ON CONFLICT DO NOTHING;
    `);

    // Commercial Platform System Masters (Products, Plans, Features, Entitlements)
    await pool.query(`
      INSERT INTO "company"."products" ("id", "code", "name", "description", "category", "status", "version")
      VALUES 
        ('${PRODUCT_ID}', 'PROD_HEALTHCARE_SUITE', 'DOC SEARCH Healthcare Platform', 'Complete Hospital, Clinic, Pharmacy and Diagnostic Suite', 'CORE_PLATFORM', 'ACTIVE', '1.0.0')
      ON CONFLICT DO NOTHING;
    `);

    await pool.query(`
      INSERT INTO "company"."plans" ("id", "product_id", "code", "name", "description", "status", "version", "base_price", "currency", "billing_interval", "metadata")
      VALUES 
        ('${PLAN_STARTER_ID}', '${PRODUCT_ID}', 'PLAN_CLINIC_STARTER', 'Clinic Starter Plan', 'Standard outpatient clinic management', 'ACTIVE', '1.0.0', 15000, 'INR', 'MONTHLY', '{"billingCadence":"MONTHLY","basePrice":15000,"currency":"INR","trialDays":14,"gracePeriodDays":7,"targetPartnerType":"CLINIC","maxConcurrentUsers":10,"maxDoctors":5,"maxBranches":1}'::jsonb),
        ('${PLAN_PRO_ID}', '${PRODUCT_ID}', 'PLAN_HOSPITAL_PRO', 'Hospital Professional Plan', 'Multi-department hospital management', 'ACTIVE', '1.0.0', 45000, 'INR', 'MONTHLY', '{"billingCadence":"MONTHLY","basePrice":45000,"currency":"INR","trialDays":14,"gracePeriodDays":14,"targetPartnerType":"HOSPITAL_NETWORK","maxConcurrentUsers":50,"maxDoctors":25,"maxBranches":3}'::jsonb),
        ('${PLAN_ENTERPRISE_ID}', '${PRODUCT_ID}', 'PLAN_ENTERPRISE_NETWORK', 'Enterprise Healthcare Network', 'Multi-facility hospital & diagnostic network', 'ACTIVE', '1.0.0', 120000, 'INR', 'ANNUAL', '{"billingCadence":"ANNUAL","basePrice":120000,"currency":"INR","trialDays":30,"gracePeriodDays":30,"targetPartnerType":"HOSPITAL_NETWORK","maxConcurrentUsers":250,"maxDoctors":100,"maxBranches":10}'::jsonb),
        ('${PLAN_PATHOLOGY_ID}', '${PRODUCT_ID}', 'PLAN_PATHOLOGY_ANNUAL', 'Pathology Lab Annual Plan', 'Diagnostic pathology laboratory operating system', 'ACTIVE', '1.0.0', 6000, 'INR', 'ANNUAL', '{"partnerType":"PATHOLOGY","billingCadence":"ANNUAL","basePrice":6000,"currency":"INR","sacCode":"998313"}'::jsonb),
        ('${PLAN_PHARMACY_ID}', '${PRODUCT_ID}', 'PLAN_PHARMACY_ANNUAL', 'Pharmacy Retail & POS Annual Plan', 'Allopathic pharmacy POS, inventory & GST invoice suite', 'ACTIVE', '1.0.0', 6000, 'INR', 'ANNUAL', '{"partnerType":"PHARMACY","billingCadence":"ANNUAL","basePrice":6000,"currency":"INR","sacCode":"998313"}'::jsonb),
        ('${PLAN_SOLO_CLINIC_ID}', '${PRODUCT_ID}', 'PLAN_SOLO_CLINIC_ANNUAL', 'Solo Doctor & OPD Clinic Annual Plan', 'Outpatient practice, electronic prescriptions & queue manager', 'ACTIVE', '1.0.0', 6000, 'INR', 'ANNUAL', '{"partnerType":"SOLO_CLINIC","billingCadence":"ANNUAL","basePrice":6000,"currency":"INR","sacCode":"998313"}'::jsonb),
        ('${PLAN_HOSPITAL_ID}', '${PRODUCT_ID}', 'PLAN_HOSPITAL_ANNUAL', 'Multi-Speciality Hospital Annual Plan', 'Full enterprise hospital operating system (HIS/HMS, IPD, OT, TPA)', 'ACTIVE', '1.0.0', 20000, 'INR', 'ANNUAL', '{"partnerType":"HOSPITAL_NETWORK","billingCadence":"ANNUAL","basePrice":20000,"currency":"INR","sacCode":"998313"}'::jsonb)
      ON CONFLICT DO NOTHING;
    `);

    await pool.query(`
      INSERT INTO "company"."price_versions" ("id", "plan_id", "version_number", "annual_base_price_inr", "gst_rate_percent", "sac_code", "is_active")
      VALUES
        ('99999999-9999-4999-9999-999999999911', '${PLAN_PATHOLOGY_ID}', 'v1.0', 6000, 18, '998313', true),
        ('99999999-9999-4999-9999-999999999912', '${PLAN_PHARMACY_ID}', 'v1.0', 6000, 18, '998313', true),
        ('99999999-9999-4999-9999-999999999913', '${PLAN_SOLO_CLINIC_ID}', 'v1.0', 6000, 18, '998313', true),
        ('99999999-9999-4999-9999-999999999914', '${PLAN_HOSPITAL_ID}', 'v1.0', 20000, 18, '998313', true)
      ON CONFLICT DO NOTHING;
    `);

    await pool.query(`
      INSERT INTO "company"."features" ("id", "code", "name", "description", "category", "status")
      VALUES 
        ('${FEAT_OPD_ID}', 'OPD_CLINICAL', 'Outpatient Clinical Core', 'Consultations, patient records, and prescriptions', 'MODULE_ACCESS', 'ACTIVE'),
        ('${FEAT_PHARMACY_ID}', 'PHARMACY_POS', 'Pharmacy Management & POS', 'Pharmacy inventory, batch tracking, and dispensing', 'MODULE_ACCESS', 'ACTIVE'),
        ('${FEAT_LAB_ID}', 'LAB_DIAGNOSTICS', 'Laboratory & Diagnostics', 'Specimen accession, testing, and lab reports', 'MODULE_ACCESS', 'ACTIVE'),
        ('${FEAT_INPATIENT_ID}', 'INPATIENT_ADT', 'Inpatient Care & ADT', 'Admissions, discharges, transfers, and bed management', 'MODULE_ACCESS', 'ACTIVE'),
        ('${FEAT_BILLING_ID}', 'BILLING_INSURANCE', 'Billing & TPA Insurance', 'Invoicing, receipts, refunds, and insurance claims', 'MODULE_ACCESS', 'ACTIVE'),
        ('${FEAT_RADIOLOGY_ID}', 'RADIOLOGY_PACS', 'Radiology, Imaging & PACS', 'Radiology imaging, modality worklist, PACS integration, and reports', 'MODULE_ACCESS', 'ACTIVE')
      ON CONFLICT DO NOTHING;
    `);

    await pool.query(`
      INSERT INTO "company"."plan_entitlements" ("id", "plan_id", "feature_id", "entitlement_type", "value", "status")
      VALUES 
        ('55555555-5555-4555-8555-555555555001', '${PLAN_STARTER_ID}', '${FEAT_OPD_ID}', 'FEATURE_ACCESS', '{"enabled":true}'::jsonb, 'ACTIVE'),
        ('55555555-5555-4555-8555-555555555002', '${PLAN_STARTER_ID}', '${FEAT_PHARMACY_ID}', 'FEATURE_ACCESS', '{"enabled":true}'::jsonb, 'ACTIVE'),
        ('55555555-5555-4555-8555-555555555003', '${PLAN_STARTER_ID}', '${FEAT_BILLING_ID}', 'FEATURE_ACCESS', '{"enabled":true}'::jsonb, 'ACTIVE'),
        ('55555555-5555-4555-8555-555555555004', '${PLAN_PRO_ID}', '${FEAT_OPD_ID}', 'FEATURE_ACCESS', '{"enabled":true}'::jsonb, 'ACTIVE'),
        ('55555555-5555-4555-8555-555555555005', '${PLAN_PRO_ID}', '${FEAT_PHARMACY_ID}', 'FEATURE_ACCESS', '{"enabled":true}'::jsonb, 'ACTIVE'),
        ('55555555-5555-4555-8555-555555555006', '${PLAN_PRO_ID}', '${FEAT_LAB_ID}', 'FEATURE_ACCESS', '{"enabled":true}'::jsonb, 'ACTIVE'),
        ('55555555-5555-4555-8555-555555555007', '${PLAN_PRO_ID}', '${FEAT_BILLING_ID}', 'FEATURE_ACCESS', '{"enabled":true}'::jsonb, 'ACTIVE'),
        ('55555555-5555-4555-8555-555555555013', '${PLAN_PRO_ID}', '${FEAT_INPATIENT_ID}', 'FEATURE_ACCESS', '{"enabled":true}'::jsonb, 'ACTIVE'),
        ('55555555-5555-4555-8555-555555555014', '${PLAN_PRO_ID}', '${FEAT_RADIOLOGY_ID}', 'FEATURE_ACCESS', '{"enabled":true}'::jsonb, 'ACTIVE'),
        ('55555555-5555-4555-8555-555555555008', '${PLAN_ENTERPRISE_ID}', '${FEAT_OPD_ID}', 'FEATURE_ACCESS', '{"enabled":true}'::jsonb, 'ACTIVE'),
        ('55555555-5555-4555-8555-555555555009', '${PLAN_ENTERPRISE_ID}', '${FEAT_PHARMACY_ID}', 'FEATURE_ACCESS', '{"enabled":true}'::jsonb, 'ACTIVE'),
        ('55555555-5555-4555-8555-555555555010', '${PLAN_ENTERPRISE_ID}', '${FEAT_LAB_ID}', 'FEATURE_ACCESS', '{"enabled":true}'::jsonb, 'ACTIVE'),
        ('55555555-5555-4555-8555-555555555011', '${PLAN_ENTERPRISE_ID}', '${FEAT_INPATIENT_ID}', 'FEATURE_ACCESS', '{"enabled":true}'::jsonb, 'ACTIVE'),
        ('55555555-5555-4555-8555-555555555012', '${PLAN_ENTERPRISE_ID}', '${FEAT_BILLING_ID}', 'FEATURE_ACCESS', '{"enabled":true}'::jsonb, 'ACTIVE'),
        ('55555555-5555-4555-8555-555555555015', '${PLAN_ENTERPRISE_ID}', '${FEAT_RADIOLOGY_ID}', 'FEATURE_ACCESS', '{"enabled":true}'::jsonb, 'ACTIVE'),
        ('55555555-5555-4555-8555-555555555016', '${PLAN_HOSPITAL_ID}', '${FEAT_RADIOLOGY_ID}', 'FEATURE_ACCESS', '{"enabled":true}'::jsonb, 'ACTIVE')
      ON CONFLICT DO NOTHING;

      INSERT INTO "core"."tenants" ("id", "name", "slug")
      VALUES 
        ('${TEST_SEEDS.TENANT_A}', 'Tenant A', 'tenant-a'),
        ('${TEST_SEEDS.TENANT_B}', 'Tenant B', 'tenant-b')
      ON CONFLICT DO NOTHING;

      INSERT INTO "core"."branches" ("id", "tenant_id", "name", "code")
      VALUES 
        ('${TEST_SEEDS.BRANCH_A}', '${TEST_SEEDS.TENANT_A}', 'Branch A', 'BRA-01'),
        ('${TEST_SEEDS.FACILITY_ID_A}', '${TEST_SEEDS.TENANT_A}', 'Facility Branch', 'FAC-01'),
        ('${TEST_SEEDS.FACILITY_ID_B}', '${TEST_SEEDS.TENANT_B}', 'Facility Branch B', 'FAC-02')
      ON CONFLICT DO NOTHING;

      INSERT INTO "clinical"."operational_partners" ("id", "tenant_id", "partner_code", "legal_business_name", "contact_email")
      VALUES 
        ('${TEST_SEEDS.PARTNER_ID_A}', '${TEST_SEEDS.TENANT_A}', 'PARTNER-01', 'Partner Corp A', 'partner_a@test.com'),
        ('${TEST_SEEDS.PARTNER_ID_B}', '${TEST_SEEDS.TENANT_B}', 'PARTNER-02', 'Partner Corp B', 'partner_b@test.com')
      ON CONFLICT DO NOTHING;

      INSERT INTO "clinical"."operational_organizations" ("id", "tenant_id", "partner_id", "organization_code", "organization_name", "contact_email")
      VALUES 
        ('${TEST_SEEDS.ORG_ID_A}', '${TEST_SEEDS.TENANT_A}', '${TEST_SEEDS.PARTNER_ID_A}', 'ORG-01', 'Org Entity A', 'org_a@test.com'),
        ('${TEST_SEEDS.ORG_ID_B}', '${TEST_SEEDS.TENANT_B}', '${TEST_SEEDS.PARTNER_ID_B}', 'ORG-02', 'Org Entity B', 'org_b@test.com')
      ON CONFLICT DO NOTHING;

      INSERT INTO "clinical"."operational_facilities" (
        "id", "tenant_id", "partner_id", "organization_id", "facility_code", "facility_name",
        "address_street", "address_city", "address_state", "address_postal_code", "contact_email", "contact_phone"
      )
      VALUES 
        ('${TEST_SEEDS.FACILITY_ID_A}', '${TEST_SEEDS.TENANT_A}', '${TEST_SEEDS.PARTNER_ID_A}', '${TEST_SEEDS.ORG_ID_A}', 'FAC-01', 'Main Facility', '123 St', 'City', 'State', '12345', 'fac@test.com', '1234567890'),
        ('${TEST_SEEDS.BRANCH_A}', '${TEST_SEEDS.TENANT_A}', '${TEST_SEEDS.PARTNER_ID_A}', '${TEST_SEEDS.ORG_ID_A}', 'FAC-02', 'Branch Facility', '456 St', 'City', 'State', '12345', 'fac2@test.com', '1234567890'),
        ('${TEST_SEEDS.FACILITY_ID_B}', '${TEST_SEEDS.TENANT_B}', '${TEST_SEEDS.PARTNER_ID_B}', '${TEST_SEEDS.ORG_ID_B}', 'FAC-03', 'Facility B', '789 St', 'City', 'State', '12345', 'facb@test.com', '1234567890')
      ON CONFLICT DO NOTHING;

      INSERT INTO "clinical"."operational_departments" (
        "id", "tenant_id", "partner_id", "organization_id", "branch_id", "department_code", "department_name"
      )
      VALUES 
        ('${TEST_SEEDS.DEPT_ID_A}', '${TEST_SEEDS.TENANT_A}', '${TEST_SEEDS.PARTNER_ID_A}', '${TEST_SEEDS.ORG_ID_A}', '${TEST_SEEDS.FACILITY_ID_A}', 'DEP-01', 'General Medicine'),
        ('${TEST_SEEDS.DEPT_ID_B}', '${TEST_SEEDS.TENANT_B}', '${TEST_SEEDS.PARTNER_ID_B}', '${TEST_SEEDS.ORG_ID_B}', '${TEST_SEEDS.FACILITY_ID_B}', 'DEP-02', 'General Medicine B')
      ON CONFLICT DO NOTHING;

      INSERT INTO "core"."users" ("id", "email", "first_name", "last_name", "status", "is_email_verified")
      VALUES 
        ('${TEST_SEEDS.DOCTOR_ID}', 'doctor@docsearch.health', 'Doctor', 'Test', 'ACTIVE', true),
        ('${TEST_SEEDS.STAFF_ID_A}', 'staff_a@docsearch.health', 'Staff', 'A', 'ACTIVE', true),
        ('${TEST_SEEDS.STAFF_ID_B}', 'staff_b@docsearch.health', 'Staff', 'B', 'ACTIVE', true),
        ('55555555-5555-4555-8555-555555555555', 'billing.head@docsearch.health', 'Billing', 'Head', 'ACTIVE', true),
        ('99999999-9999-4999-8999-999999999999', 'admin@docsearch.health', 'Super', 'Admin', 'ACTIVE', true)
      ON CONFLICT DO NOTHING;

      INSERT INTO "clinical"."operational_staff" (
        "id", "tenant_id", "partner_id", "organization_id", "branch_id", "department_id", "staff_code", "fullName", "work_email", "joining_date"
      )
      VALUES 
        ('${TEST_SEEDS.STAFF_ID_A}', '${TEST_SEEDS.TENANT_A}', '${TEST_SEEDS.PARTNER_ID_A}', '${TEST_SEEDS.ORG_ID_A}', '${TEST_SEEDS.FACILITY_ID_A}', '${TEST_SEEDS.DEPT_ID_A}', 'STF-01', 'Dr. Test Staff', 'doctor@docsearch.health', '2020-01-01T00:00:00Z'),
        ('${TEST_SEEDS.STAFF_ID_B}', '${TEST_SEEDS.TENANT_B}', '${TEST_SEEDS.PARTNER_ID_B}', '${TEST_SEEDS.ORG_ID_B}', '${TEST_SEEDS.FACILITY_ID_B}', '${TEST_SEEDS.DEPT_ID_B}', 'STF-02', 'Dr. Test Staff B', 'doctor_b@docsearch.health', '2020-01-01T00:00:00Z')
      ON CONFLICT DO NOTHING;

      INSERT INTO "clinical"."doctor_profiles" (
        "id", "tenant_id", "partner_id", "organization_id", "branch_id", "department_id", "staff_id", "doctor_code", "medical_license_number", "qualification", "primary_specialty"
      )
      VALUES 
        ('${TEST_SEEDS.DOCTOR_ID}', '${TEST_SEEDS.TENANT_A}', '${TEST_SEEDS.PARTNER_ID_A}', '${TEST_SEEDS.ORG_ID_A}', '${TEST_SEEDS.FACILITY_ID_A}', '${TEST_SEEDS.DEPT_ID_A}', '${TEST_SEEDS.STAFF_ID_A}', 'DOC-01', 'MED-12345', 'MBBS, MD', 'General Medicine'),
        ('88888888-8888-4888-8888-888888888802', '${TEST_SEEDS.TENANT_B}', '${TEST_SEEDS.PARTNER_ID_B}', '${TEST_SEEDS.ORG_ID_B}', '${TEST_SEEDS.FACILITY_ID_B}', '${TEST_SEEDS.DEPT_ID_B}', '${TEST_SEEDS.STAFF_ID_B}', 'DOC-02', 'MED-67890', 'MBBS, MD', 'General Medicine')
      ON CONFLICT DO NOTHING;

      INSERT INTO "company"."partner_profiles" (
        "id", "tenant_id", "legal_name", "trade_name", "primary_contact_name", "primary_contact_email", "verification_status", "lifecycle_status"
      )
      VALUES 
        ('${TEST_SEEDS.PARTNER_ID_A}', '${TEST_SEEDS.TENANT_A}', 'Apollo Hospital Network', 'Apollo Hospital', 'Dr. Test Admin', 'admin@apollo.test', 'VERIFIED', 'ACTIVE'),
        ('${TEST_SEEDS.PARTNER_ID_B}', '${TEST_SEEDS.TENANT_B}', 'Care Clinic Network', 'Care Clinic', 'Dr. Clinic Admin', 'admin@clinic.test', 'VERIFIED', 'ACTIVE')
      ON CONFLICT DO NOTHING;

      INSERT INTO "company"."subscriptions" (
        "id", "partner_id", "product_id", "plan_id", "plan_version", "status", "billing_cycle",
        "start_date", "renewal_date", "end_date"
      )
      VALUES 
        ('${TEST_SEEDS.SUBSCRIPTION_ID_A}', '${TEST_SEEDS.PARTNER_ID_A}', '${PRODUCT_ID}', '${PLAN_PRO_ID}', '1.0.0', 'ACTIVE', 'MONTHLY', now() - interval '30 days', now() + interval '335 days', now() + interval '335 days'),
        ('${TEST_SEEDS.SUBSCRIPTION_ID_B}', '${TEST_SEEDS.PARTNER_ID_B}', '${PRODUCT_ID}', '${PLAN_STARTER_ID}', '1.0.0', 'ACTIVE', 'MONTHLY', now() - interval '30 days', now() + interval '335 days', now() + interval '335 days')
      ON CONFLICT DO NOTHING;
    `);

      const licenseSecret =
        process.env['LICENSE_HMAC_SECRET'] ||
        process.env['JWT_SECRET'] ||
        'docsearch_master_jwt_secret_dev_32char_key_only';
      const sigA = crypto
        .createHmac('sha256', licenseSecret)
        .update(`LIC-APOLLO-PRO-001:${TEST_SEEDS.PARTNER_ID_A}:${TEST_SEEDS.TENANT_A}:${TEST_SEEDS.SUBSCRIPTION_ID_A}:${PLAN_PRO_ID}`)
        .digest('hex');
      const sigB = crypto
        .createHmac('sha256', licenseSecret)
        .update(`LIC-CARE-STARTER-001:${TEST_SEEDS.PARTNER_ID_B}:${TEST_SEEDS.TENANT_B}:${TEST_SEEDS.SUBSCRIPTION_ID_B}:${PLAN_STARTER_ID}`)
        .digest('hex');

      await pool.query(`
        INSERT INTO "company"."licenses" (
          "id", "license_key", "partner_id", "tenant_id", "subscription_id", "plan_id", "license_type",
          "status", "activation_status", "max_concurrent_users", "max_doctors", "max_branches",
          "issued_at", "start_date", "expiry_date", "grace_period_end", "signature"
        )
        VALUES 
          ('${TEST_SEEDS.LICENSE_ID_A}', 'LIC-APOLLO-PRO-001', '${TEST_SEEDS.PARTNER_ID_A}', '${TEST_SEEDS.TENANT_A}', '${TEST_SEEDS.SUBSCRIPTION_ID_A}', '${PLAN_PRO_ID}', 'COMMERCIAL', 'ACTIVE', 'ACTIVATED', 50, 25, 3, now() - interval '30 days', now() - interval '30 days', now() + interval '335 days', now() + interval '350 days', '${sigA}'),
          ('${TEST_SEEDS.LICENSE_ID_B}', 'LIC-CARE-STARTER-001', '${TEST_SEEDS.PARTNER_ID_B}', '${TEST_SEEDS.TENANT_B}', '${TEST_SEEDS.SUBSCRIPTION_ID_B}', '${PLAN_STARTER_ID}', 'COMMERCIAL', 'ACTIVE', 'ACTIVATED', 10, 5, 1, now() - interval '30 days', now() - interval '30 days', now() + interval '335 days', now() + interval '350 days', '${sigB}')
        ON CONFLICT DO NOTHING;
      `);
  }

  // Operational Fixtures (only when explicitly requested via seedDemoFixtures)
  if (options.seedDemoFixtures === true) {
    const {
      TENANT_A,
      TENANT_B,
      BRANCH_A,
      DOCTOR_ID,
      PARTNER_ID_A,
      ORG_ID_A,
      FACILITY_ID_A,
      DEPT_ID_A,
      STAFF_ID_A,
      PARTNER_ID_B,
      ORG_ID_B,
      FACILITY_ID_B,
      DEPT_ID_B,
      STAFF_ID_B,
      INVESTIGATION_ID,
      INVESTIGATION_ID_ALT,
      MEDICATION_ID,
      BATCH_ID,
      PRODUCT_ID,
      PLAN_STARTER_ID,
      PLAN_PRO_ID,
      SUBSCRIPTION_ID_A,
      SUBSCRIPTION_ID_B,
      LICENSE_ID_A,
      LICENSE_ID_B
    } = TEST_SEEDS;

    await pool.query(`
      INSERT INTO "core"."tenants" ("id", "name", "slug")
      VALUES 
        ('${TENANT_A}', 'Tenant A', 'tenant-a'),
        ('${TENANT_B}', 'Tenant B', 'tenant-b')
      ON CONFLICT DO NOTHING;
    `);

    await pool.query(`
      INSERT INTO "core"."branches" ("id", "tenant_id", "name", "code")
      VALUES 
        ('${BRANCH_A}', '${TENANT_A}', 'Branch A', 'BRA-01'),
        ('${FACILITY_ID_A}', '${TENANT_A}', 'Facility Branch', 'FAC-01'),
        ('${FACILITY_ID_B}', '${TENANT_B}', 'Facility Branch B', 'FAC-02')
      ON CONFLICT DO NOTHING;
    `);

    await pool.query(`
      INSERT INTO "core"."users" ("id", "email", "first_name", "last_name", "status", "is_email_verified")
      VALUES 
        ('${DOCTOR_ID}', 'doctor@docsearch.health', 'Doctor', 'Test', 'ACTIVE', true),
        ('${STAFF_ID_A}', 'staff_a@docsearch.health', 'Staff', 'A', 'ACTIVE', true),
        ('${STAFF_ID_B}', 'staff_b@docsearch.health', 'Staff', 'B', 'ACTIVE', true),
        ('55555555-5555-4555-8555-555555555555', 'billing.head@docsearch.health', 'Billing', 'Head', 'ACTIVE', true),
        ('99999999-9999-4999-8999-999999999999', 'admin@docsearch.health', 'Super', 'Admin', 'ACTIVE', true)
      ON CONFLICT DO NOTHING;
    `);

    await pool.query(`
      INSERT INTO "clinical"."operational_partners" ("id", "tenant_id", "partner_code", "legal_business_name", "contact_email")
      VALUES 
        ('${PARTNER_ID_A}', '${TENANT_A}', 'PARTNER-01', 'Partner Corp A', 'partner_a@test.com'),
        ('${PARTNER_ID_B}', '${TENANT_B}', 'PARTNER-02', 'Partner Corp B', 'partner_b@test.com')
      ON CONFLICT DO NOTHING;
    `);

    await pool.query(`
      INSERT INTO "clinical"."operational_organizations" ("id", "tenant_id", "partner_id", "organization_code", "organization_name", "contact_email")
      VALUES 
        ('${ORG_ID_A}', '${TENANT_A}', '${PARTNER_ID_A}', 'ORG-01', 'Org Entity A', 'org_a@test.com'),
        ('${ORG_ID_B}', '${TENANT_B}', '${PARTNER_ID_B}', 'ORG-02', 'Org Entity B', 'org_b@test.com')
      ON CONFLICT DO NOTHING;
    `);

    await pool.query(`
      INSERT INTO "clinical"."operational_facilities" (
        "id", "tenant_id", "partner_id", "organization_id", "facility_code", "facility_name",
        "address_street", "address_city", "address_state", "address_postal_code", "contact_email", "contact_phone"
      )
      VALUES 
        ('${FACILITY_ID_A}', '${TENANT_A}', '${PARTNER_ID_A}', '${ORG_ID_A}', 'FAC-01', 'Main Facility', '123 St', 'City', 'State', '12345', 'fac@test.com', '1234567890'),
        ('${BRANCH_A}', '${TENANT_A}', '${PARTNER_ID_A}', '${ORG_ID_A}', 'FAC-02', 'Branch Facility', '456 St', 'City', 'State', '12345', 'fac2@test.com', '1234567890'),
        ('${FACILITY_ID_B}', '${TENANT_B}', '${PARTNER_ID_B}', '${ORG_ID_B}', 'FAC-03', 'Facility B', '789 St', 'City', 'State', '12345', 'facb@test.com', '1234567890')
      ON CONFLICT DO NOTHING;
    `);

    await pool.query(`
      INSERT INTO "clinical"."operational_departments" (
        "id", "tenant_id", "partner_id", "organization_id", "branch_id", "department_code", "department_name"
      )
      VALUES 
        ('${DEPT_ID_A}', '${TENANT_A}', '${PARTNER_ID_A}', '${ORG_ID_A}', '${FACILITY_ID_A}', 'DEP-01', 'General Medicine'),
        ('${DEPT_ID_B}', '${TENANT_B}', '${PARTNER_ID_B}', '${ORG_ID_B}', '${FACILITY_ID_B}', 'DEP-02', 'General Medicine B')
      ON CONFLICT DO NOTHING;
    `);

    await pool.query(`
      INSERT INTO "clinical"."operational_staff" (
        "id", "tenant_id", "partner_id", "organization_id", "branch_id", "department_id", "staff_code", "fullName", "work_email", "joining_date"
      )
      VALUES 
        ('${STAFF_ID_A}', '${TENANT_A}', '${PARTNER_ID_A}', '${ORG_ID_A}', '${FACILITY_ID_A}', '${DEPT_ID_A}', 'STF-01', 'Dr. Test Staff', 'doctor@docsearch.health', '2020-01-01T00:00:00Z'),
        ('${STAFF_ID_B}', '${TENANT_B}', '${PARTNER_ID_B}', '${ORG_ID_B}', '${FACILITY_ID_B}', '${DEPT_ID_B}', 'STF-02', 'Dr. Test Staff B', 'doctor_b@docsearch.health', '2020-01-01T00:00:00Z')
      ON CONFLICT DO NOTHING;
    `);

    await pool.query(`
      INSERT INTO "clinical"."doctor_profiles" (
        "id", "tenant_id", "partner_id", "organization_id", "branch_id", "department_id", "staff_id", "doctor_code", "medical_license_number", "qualification", "primary_specialty"
      )
      VALUES 
        ('${DOCTOR_ID}', '${TENANT_A}', '${PARTNER_ID_A}', '${ORG_ID_A}', '${FACILITY_ID_A}', '${DEPT_ID_A}', '${STAFF_ID_A}', 'DOC-01', 'MED-12345', 'MBBS, MD', 'General Medicine')
      ON CONFLICT DO NOTHING;
    `);

    await pool.query(`
      INSERT INTO "clinical"."investigation_catalog" (
        "id", "tenant_id", "partner_id", "organization_id", "branch_id",
        "test_code", "test_name", "category", "department"
      )
      VALUES 
        ('${INVESTIGATION_ID_ALT}', '${TENANT_A}', '${PARTNER_ID_A}', '${ORG_ID_A}', '${FACILITY_ID_A}', 'CBC-FULL', 'Complete Blood Count', 'HEMATOLOGY', 'Pathology'),
        ('${INVESTIGATION_ID}', '${TENANT_A}', '${PARTNER_ID_A}', '${ORG_ID_A}', '${FACILITY_ID_A}', 'LFT-FULL', 'Liver Function Test', 'BIOCHEMISTRY', 'Biochemistry')
      ON CONFLICT DO NOTHING;
    `);

    await pool.query(`
      INSERT INTO "clinical"."medication_catalog" (
        "id", "tenant_id", "partner_id", "organization_id", "branch_id",
        "medication_code", "generic_name", "brand_name", "strength", "dosage_form", "manufacturer", "category"
      )
      VALUES 
        ('${MEDICATION_ID}', '${TENANT_A}', '${PARTNER_ID_A}', '${ORG_ID_A}', '${FACILITY_ID_A}', 'MED-AMOX-500', 'Amoxicillin', 'Amoxil', '500mg', 'TABLET', 'Standard Pharma', 'ANTIBIOTIC')
      ON CONFLICT DO NOTHING;
    `);

    await pool.query(`
      INSERT INTO "clinical"."pharmacy_batches" (
        "id", "tenant_id", "partner_id", "organization_id", "branch_id",
        "medication_id", "batch_number", "manufacturer", "manufacturing_date", "expiry_date",
        "received_quantity", "available_quantity", "unit_cost", "status"
      )
      VALUES 
        ('${BATCH_ID}', '${TENANT_A}', '${PARTNER_ID_A}', '${ORG_ID_A}', '${FACILITY_ID_A}', '${MEDICATION_ID}', 'BATCH-2026-01', 'Standard Pharma', '2026-01-01', '2027-12-31', 1000, 1000, '10.00', 'ACTIVE')
      ON CONFLICT DO NOTHING;
    `);

    await pool.query(`
      INSERT INTO "clinical"."pharmacy_inventory" (
        "id", "tenant_id", "partner_id", "organization_id", "branch_id",
        "medication_id", "available_quantity"
      )
      VALUES 
        ('00000000-0000-4000-8000-000000000080', '${TENANT_A}', '${PARTNER_ID_A}', '${ORG_ID_A}', '${FACILITY_ID_A}', '${MEDICATION_ID}', 1000)
      ON CONFLICT DO NOTHING;
    `);

    await pool.query(`
      INSERT INTO "company"."partner_profiles" (
        "id", "tenant_id", "legal_name", "trade_name", "primary_contact_name", "primary_contact_email", "verification_status", "lifecycle_status"
      )
      VALUES 
        ('${PARTNER_ID_A}', '${TENANT_A}', 'Apollo Hospital Network', 'Apollo Hospital', 'Dr. Test Admin', 'admin@apollo.test', 'VERIFIED', 'ACTIVE'),
        ('${PARTNER_ID_B}', '${TENANT_B}', 'Care Clinic Network', 'Care Clinic', 'Dr. Clinic Admin', 'admin@clinic.test', 'VERIFIED', 'ACTIVE')
      ON CONFLICT DO NOTHING;

      INSERT INTO "company"."subscriptions" (
        "id", "partner_id", "product_id", "plan_id", "plan_version", "status", "billing_cycle",
        "start_date", "renewal_date", "end_date"
      )
      VALUES 
        ('${SUBSCRIPTION_ID_A}', '${PARTNER_ID_A}', '${PRODUCT_ID}', '${PLAN_PRO_ID}', '1.0.0', 'ACTIVE', 'MONTHLY', now() - interval '30 days', now() + interval '335 days', now() + interval '335 days'),
        ('${SUBSCRIPTION_ID_B}', '${PARTNER_ID_B}', '${PRODUCT_ID}', '${PLAN_STARTER_ID}', '1.0.0', 'ACTIVE', 'MONTHLY', now() - interval '30 days', now() + interval '335 days', now() + interval '335 days')
      ON CONFLICT DO NOTHING;

      INSERT INTO "company"."licenses" (
        "id", "license_key", "partner_id", "tenant_id", "subscription_id", "plan_id", "license_type",
        "status", "activation_status", "max_concurrent_users", "max_doctors", "max_branches",
        "issued_at", "start_date", "expiry_date", "grace_period_end", "signature"
      )
      VALUES 
        ('${LICENSE_ID_A}', 'LIC-APOLLO-PRO-001', '${PARTNER_ID_A}', '${TENANT_A}', '${SUBSCRIPTION_ID_A}', '${PLAN_PRO_ID}', 'COMMERCIAL', 'ACTIVE', 'ACTIVATED', 50, 25, 3, now() - interval '30 days', now() - interval '30 days', now() + interval '335 days', now() + interval '350 days', '${crypto.createHmac('sha256', process.env['LICENSE_HMAC_SECRET'] || process.env['JWT_SECRET'] || 'docsearch_master_jwt_secret_dev_32char_key_only').update(`LIC-APOLLO-PRO-001:${PARTNER_ID_A}:${TENANT_A}:${SUBSCRIPTION_ID_A}:${PLAN_PRO_ID}`).digest('hex')}'),
        ('${LICENSE_ID_B}', 'LIC-CARE-STARTER-001', '${PARTNER_ID_B}', '${TENANT_B}', '${SUBSCRIPTION_ID_B}', '${PLAN_STARTER_ID}', 'COMMERCIAL', 'ACTIVE', 'ACTIVATED', 10, 5, 1, now() - interval '30 days', now() - interval '30 days', now() + interval '335 days', now() + interval '350 days', '${crypto.createHmac('sha256', process.env['LICENSE_HMAC_SECRET'] || process.env['JWT_SECRET'] || 'docsearch_master_jwt_secret_dev_32char_key_only').update(`LIC-CARE-STARTER-001:${PARTNER_ID_B}:${TENANT_B}:${SUBSCRIPTION_ID_B}:${PLAN_STARTER_ID}`).digest('hex')}')
      ON CONFLICT DO NOTHING;

      INSERT INTO "clinical"."gst_tax_rates" (
        "id", "tenant_id", "tax_category", "hsn_sac_code", "cgst_rate_percent", "sgst_rate_percent", "igst_rate_percent", "is_exempt", "description"
      )
      VALUES
        ('11111111-1111-4111-8111-000000000001', '${TENANT_A}', 'CONSULTATION', '999312', 0.00, 0.00, 0.00, true, 'Healthcare Consultation (Exempt)'),
        ('11111111-1111-4111-8111-000000000002', '${TENANT_A}', 'PHARMACY', '3004', 2.50, 2.50, 5.00, false, 'Medicines & Pharmaceuticals (5% GST)'),
        ('11111111-1111-4111-8111-000000000003', '${TENANT_A}', 'INVESTIGATION', '999316', 0.00, 0.00, 0.00, true, 'Diagnostic Pathology (Exempt)'),
        ('11111111-1111-4111-8111-000000000004', '${TENANT_A}', 'RADIOLOGY', '999315', 0.00, 0.00, 0.00, true, 'Radiology Imaging (Exempt)'),
        ('11111111-1111-4111-8111-000000000005', '${TENANT_A}', 'ROOM_BED', '999311', 2.50, 2.50, 5.00, false, 'Non-ICU Luxury Room Bed (5% GST)'),
        ('11111111-1111-4111-8111-000000000006', '${TENANT_A}', 'GENERAL', '999319', 9.00, 9.00, 18.00, false, 'Administrative & Non-Clinical Services (18% GST)')
      ON CONFLICT DO NOTHING;
    `);
  }

  const db = drizzle(pool, { schema });

  return {
    mem,
    pool,
    db,
    schema,
    cleanup: async () => {
      await pool.end();
    }
  };
}

export async function setupTestDatabase(options: { seedBaseline?: boolean; seedDemoFixtures?: boolean } = {}): Promise<TestDatabaseInstance> {
  const instance = await createTestDatabase(options);
  setTestDatabase(instance.db);
  return instance;
}
