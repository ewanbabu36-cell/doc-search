import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

describe('Database Migration & RLS Integrity Gate', () => {
  it('Every SQL migration in migrations/ must be recorded in _journal.json', () => {
    const migrationsDir = path.resolve('packages/database/migrations');
    const journalPath = path.resolve(migrationsDir, 'meta/_journal.json');

    assert.ok(fs.existsSync(journalPath), '_journal.json must exist');
    const journal = JSON.parse(fs.readFileSync(journalPath, 'utf8'));

    const sqlFiles = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql'))
      .map(f => f.replace('.sql', ''));

    const journalTags = journal.entries.map(e => e.tag);

    for (const sqlFile of sqlFiles) {
      assert.ok(
        journalTags.includes(sqlFile),
        `Migration file ${sqlFile}.sql is missing from _journal.json`
      );
    }
  });

  it('RLS Migration 0041 and 0042 must enforce tenant and branch policies', () => {
    const mig41 = fs.readFileSync(path.resolve('packages/database/migrations/0041_security_wave_1_rls_and_audit.sql'), 'utf8');
    const mig42 = fs.readFileSync(path.resolve('packages/database/migrations/0042_complete_multi_tenant_rls.sql'), 'utf8');

    assert.ok(mig41.includes('ROW LEVEL SECURITY'), '0041 must enable RLS');
    assert.ok(mig41.includes('prevent_audit_modification'), '0041 must define audit immutability');
    assert.ok(mig42.includes('p_radiology_orders_isolation'), '0042 must isolate radiology orders');
    assert.ok(mig42.includes('p_dietary_orders_isolation'), '0042 must isolate dietary orders');
  });
});
