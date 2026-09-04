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

  it('RLS Migration 0044 must enforce tenant and branch policies on clinical AI tables and CDSS audit immutability', () => {
    const mig44 = fs.readFileSync(path.resolve('packages/database/migrations/0044_clinical_ai_rls.sql'), 'utf8');
    assert.ok(mig44.includes('p_ambient_ai_scribe_transcripts_isolation'), '0044 must isolate ambient scribe transcripts');
    assert.ok(mig44.includes('p_sepsis_news2_alerts_isolation'), '0044 must isolate sepsis news2 alerts');
    assert.ok(mig44.includes('p_ddi_drug_interaction_checks_isolation'), '0044 must isolate ddi checks');
    assert.ok(mig44.includes('p_critical_panic_value_alerts_isolation'), '0044 must isolate panic alerts');
    assert.ok(mig44.includes('p_cdss_audit_traces_isolation'), '0044 must isolate cdss audit traces');
    assert.ok(mig44.includes('trg_cdss_audit_traces_immutability'), '0044 must protect cdss audit traces immutability');
  });
});
