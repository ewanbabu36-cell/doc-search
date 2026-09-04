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
  BATCH_ID: '00000000-0000-4000-8000-000000000070'
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

export function createPatchedPg(mem: IMemoryDb) {
  const { Pool, Client } = (mem.adapters as any).createPg();

  function patchTarget(targetClass: any) {
    targetClass.prototype.query = function (query: any, valuesOrCallback?: any, callback?: any) {
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

      const execute = () => {
        const rawRes = mem.public.query(sql);
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

export async function createTestDatabase(options: { seedBaseline?: boolean } = {}): Promise<TestDatabaseInstance> {
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

  const { Pool } = createPatchedPg(mem);
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
      BATCH_ID
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
        ('55555555-5555-4555-8555-555555555555', 'billing.head@docsearch.health', 'Billing', 'Head', 'ACTIVE', true)
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

export async function setupTestDatabase(options: { seedBaseline?: boolean } = {}): Promise<TestDatabaseInstance> {
  const instance = await createTestDatabase(options);
  setTestDatabase(instance.db);
  return instance;
}
