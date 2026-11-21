import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import pg from 'pg';
import fs from 'node:fs';
import path from 'node:path';

const ADMIN_URL = process.env.MIGRATION_DATABASE_URL || 'postgresql://postgres:password@127.0.0.1:5432/docsearch';
const APP_URL = process.env.DATABASE_URL || 'postgresql://docsearch_app:docsearch_app_secure_pass@127.0.0.1:5432/docsearch';

describe('Phase 3 Master Database Remediation & Data Recovery Regression Suite', () => {
  let adminClient;
  let appClient;

  before(async () => {
    adminClient = new pg.Client({ connectionString: ADMIN_URL });
    appClient = new pg.Client({ connectionString: APP_URL });
    await adminClient.connect();
    await appClient.connect();
  });

  after(async () => {
    if (adminClient) await adminClient.end();
    if (appClient) await appClient.end();
  });

  describe('1. Database Identity & Least Privilege Verification', () => {
    it('app client connects as docsearch_app with no superuser or bypassrls', async () => {
      const res = await appClient.query(`
        SELECT current_user, rolsuper, rolbypassrls 
        FROM pg_roles 
        WHERE rolname = current_user;
      `);
      assert.equal(res.rows[0].current_user, 'docsearch_app');
      assert.equal(res.rows[0].rolsuper, false);
      assert.equal(res.rows[0].rolbypassrls, false);
    });

    it('migration client connects as postgres administrator', async () => {
      const res = await adminClient.query(`
        SELECT current_user, rolsuper 
        FROM pg_roles 
        WHERE rolname = current_user;
      `);
      assert.equal(res.rows[0].current_user, 'postgres');
      assert.equal(res.rows[0].rolsuper, true);
    });
  });

  describe('2. Stage 1: Pharmacy Controlled Substances Remediation (P1-DB-03)', () => {
    it('clinical.pharmacy_controlled_substances exists with RLS enabled and forced', async () => {
      const res = await adminClient.query(`
        SELECT c.relname, c.relrowsecurity, c.relforcerowsecurity
        FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = 'clinical' AND c.relname = 'pharmacy_controlled_substances';
      `);
      assert.equal(res.rows.length, 1);
      assert.equal(res.rows[0].relrowsecurity, true);
      assert.equal(res.rows[0].relforcerowsecurity, true);
    });

    it('preserves historical controlled substance records without data loss', async () => {
      const res = await adminClient.query(`
        SELECT count(*) as count FROM clinical.pharmacy_controlled_substances;
      `);
      assert.ok(parseInt(res.rows[0].count, 10) >= 6, 'Historical records must be preserved');
    });

    it('enforces tenant isolation and fail-closed behavior under docsearch_app', async () => {
      // Unset context -> 0 rows (fail-closed)
      const unsetRes = await appClient.query('SELECT count(*) as count FROM clinical.pharmacy_controlled_substances;');
      assert.equal(parseInt(unsetRes.rows[0].count, 10), 0);

      // Other Tenant context -> 0 rows (cross-tenant isolation)
      await appClient.query('BEGIN');
      await appClient.query("SELECT set_config('app.current_tenant_id', '11111111-1111-4111-8111-111111111111', true);");
      const otherTenantRes = await appClient.query('SELECT count(*) as count FROM clinical.pharmacy_controlled_substances;');
      assert.equal(parseInt(otherTenantRes.rows[0].count, 10), 0);
      await appClient.query('COMMIT');

      // Record owner Tenant (33333333-3333-4333-8333-333333333333) -> reads own rows
      await appClient.query('BEGIN');
      await appClient.query("SELECT set_config('app.current_tenant_id', '33333333-3333-4333-8333-333333333333', true);");
      const ownerTenantRes = await appClient.query('SELECT count(*) as count FROM clinical.pharmacy_controlled_substances;');
      assert.equal(parseInt(ownerTenantRes.rows[0].count, 10), 6);
      await appClient.query('COMMIT');
    });
  });

  describe('3. Stage 2: Tenant RLS Repair on Cartel Radar (P1-DB-01)', () => {
    it('public.company_doctor_cartel_radar has RLS enabled and forced', async () => {
      const res = await adminClient.query(`
        SELECT c.relname, c.relrowsecurity, c.relforcerowsecurity
        FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = 'public' AND c.relname = 'company_doctor_cartel_radar';
      `);
      assert.equal(res.rows.length, 1);
      assert.equal(res.rows[0].relrowsecurity, true);
      assert.equal(res.rows[0].relforcerowsecurity, true);
    });

    it('enforces fail-closed access on cartel radar for unauthenticated requests', async () => {
      const res = await appClient.query('SELECT count(*) as count FROM public.company_doctor_cartel_radar;');
      assert.equal(parseInt(res.rows[0].count, 10), 0);
    });

    it('blocks cross-tenant update tampering under docsearch_app', async () => {
      await appClient.query('BEGIN');
      await appClient.query("SELECT set_config('app.current_tenant_id', '22222222-2222-4222-8222-222222222222', true);");
      const updateRes = await appClient.query(`
        UPDATE public.company_doctor_cartel_radar 
        SET status = 'ATTACKED' 
        WHERE doctor_name = 'Dr. Priya Raghavan';
      `);
      assert.equal(updateRes.rowCount, 0);
      await appClient.query('COMMIT');
    });
  });

  describe('4. Stage 3: Migration Recovery & Ledger Synchronization (P1-MIG-01..03, P2-MIG-04)', () => {
    it('migration 0071 exists on disk bridging the sequence gap', () => {
      assert.ok(fs.existsSync('packages/database/migrations/0071_system_catalog_and_tenant_baseline.sql'));
    });

    it('migration 0072 contains zero destructive DELETE statements', () => {
      const content = fs.readFileSync('packages/database/migrations/0072_fix_missing_patient_fks.sql', 'utf-8');
      assert.equal(content.includes('DELETE FROM'), false, 'Migration 0072 must not contain DELETE FROM statements');
    });

    it('migration 0073 contains pure DDL without hardcoded DML mutations', () => {
      const content = fs.readFileSync('packages/database/migrations/0073_performance_indexes_and_encounter_fix.sql', 'utf-8');
      assert.equal(content.includes("UPDATE clinical.encounters"), false, 'Migration 0073 must not contain hardcoded UPDATE statements');
    });

    it('migration 0074 encapsulates Phase 3 master remediation DDL', () => {
      assert.ok(fs.existsSync('packages/database/migrations/0074_phase3_database_remediation.sql'));
    });

    it('journal metadata matches database migration ledger with 75 synchronized migrations', async () => {
      const journalPath = path.resolve('packages/database/migrations/meta/_journal.json');
      const journal = JSON.parse(fs.readFileSync(journalPath, 'utf-8'));
      assert.equal(journal.entries.length, 75);

      const dbRes = await adminClient.query('SELECT count(*) as count, max(id) as max_id FROM drizzle.__drizzle_migrations;');
      assert.equal(parseInt(dbRes.rows[0].count, 10), 75);
      assert.equal(parseInt(dbRes.rows[0].max_id, 10), 75);
    });
  });

  describe('5. Stage 4: Fallback UUID Elimination (P0-ID-01, P0-ID-02)', () => {
    it('BillingManagementRepository does not contain hardcoded fallback partner/org UUIDs', () => {
      const content = fs.readFileSync('apps/api-gateway/src/repositories/partner/BillingManagementRepository.ts', 'utf-8');
      assert.equal(content.includes("'00000000-0000-4000-8000-000000000001'"), false);
      assert.equal(content.includes("'00000000-0000-4000-8000-000000000002'"), false);
    });

    it('BillingManagementService does not contain hardcoded fallback UUIDs in webhooks', () => {
      const content = fs.readFileSync('apps/api-gateway/src/services/partner/BillingManagementService.ts', 'utf-8');
      assert.equal(content.includes("'00000000-0000-4000-8000-000000000001'"), false);
      assert.equal(content.includes("'00000000-0000-4000-8000-000000000002'"), false);
    });

    it('historical billing records legitimately belong to tenant 11111111-1111-4111-8111-111111111111', async () => {
      const res = await adminClient.query(`
        SELECT count(*) as count 
        FROM clinical.billing_invoices 
        WHERE partner_id = '00000000-0000-4000-8000-000000000001'
          AND tenant_id = '11111111-1111-4111-8111-111111111111';
      `);
      assert.equal(parseInt(res.rows[0].count, 10), 25);
    });
  });

  describe('6. Stage 5: Referential Integrity Enforcement (P1-DATA-01)', () => {
    it('all 66 clean foreign key constraints exist in pg_constraint', async () => {
      const cleanFks = JSON.parse(fs.readFileSync('scratch/stage5_fk_apply_results.json', 'utf-8'));
      assert.equal(cleanFks.length, 66);

      const res = await adminClient.query(`
        SELECT count(*) as count
        FROM pg_constraint c
        JOIN pg_namespace n ON n.oid = c.connamespace
        WHERE c.conname LIKE 'fk_%'
          AND c.contype = 'f';
      `);
      assert.ok(parseInt(res.rows[0].count, 10) >= 66);
    });
  });

  describe('7. Stage 6: High-Performance Foreign Key Indexing (P1-PERF-01)', () => {
    it('unindexed foreign keys in PostgreSQL catalog is exactly 0', async () => {
      const res = await adminClient.query(`
        SELECT count(*) as count
        FROM pg_constraint c
        JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = c.conkey[1]
        JOIN pg_namespace n ON n.oid = c.connamespace
        WHERE c.contype = 'f'
          AND n.nspname NOT IN ('pg_catalog', 'information_schema')
          AND NOT EXISTS (
            SELECT 1
            FROM pg_index i
            WHERE i.indrelid = c.conrelid
              AND i.indkey[0] = c.conkey[1]
          );
      `);
      assert.equal(parseInt(res.rows[0].count, 10), 0, 'Every foreign key must have a supporting index');
    });
  });
});
