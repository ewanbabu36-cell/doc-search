import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { abdmCertificationEvidenceEngine } from '../dist/services/compliance/AbdmEvidenceEngine.js';

describe('ABDM Milestone Certification & Dynamic Evidence Engine Suite', () => {
  const EVIDENCE_DIR = path.resolve(process.cwd(), 'docs/audit/abdm/evidence');

  const EXPECTED_FILES = [
    '01-authentication.json',
    '02-m1-abha.json',
    '03-m2-care-context.json',
    '04-scan-share.json',
    '05-consent.json',
    '06-health-information-transfer.json',
    '07-fhir-validation.json',
    '08-callback-security.json',
    '09-database-integrity.json',
    '10-cryptographic-audit.json',
    '11-failure-retry-idempotency.json',
    '12-tenant-isolation.json',
    '13-observability.json'
  ];

  it('1. Generates all 13 milestone evidence payloads with dynamic timestamps', async () => {
    const all = await abdmCertificationEvidenceEngine.generateAllEvidence();
    assert.equal(Object.keys(all).length, 13, 'Must produce all 13 milestone evidence items');

    for (const [fileName, record] of Object.entries(all)) {
      assert.ok(record.testId, `${fileName} must have testId`);
      assert.ok(record.timestamp, `${fileName} must have timestamp`);
      assert.ok(record.evidenceHash, `${fileName} must have evidenceHash`);
      assert.equal(record.evidenceHash.length, 64, `${fileName} hash must be 64 hex characters`);

      // Verify timestamp is valid RFC3339 / ISO format within the last 5 minutes
      const ts = new Date(record.timestamp).getTime();
      const diffSec = (Date.now() - ts) / 1000;
      assert.ok(diffSec < 300, `${fileName} timestamp must be fresh (within 300s, was ${diffSec}s)`);
    }
  });

  it('2. Cryptographic SHA-256 evidence integrity verification', async () => {
    const record = await abdmCertificationEvidenceEngine.generateEvidenceForTest(1);
    const { evidenceHash, ...rest } = record;

    const expectedHash = crypto
      .createHash('sha256')
      .update(JSON.stringify(rest))
      .digest('hex');

    assert.equal(evidenceHash, expectedHash, 'Evidence hash must match SHA-256 of canonical payload');
  });

  it('3. All 13 evidence JSON files exist in docs/audit/abdm/evidence/ with live hashes', () => {
    assert.ok(fs.existsSync(EVIDENCE_DIR), 'docs/audit/abdm/evidence directory must exist');

    for (const file of EXPECTED_FILES) {
      const filePath = path.join(EVIDENCE_DIR, file);
      assert.ok(fs.existsSync(filePath), `Evidence file ${file} must exist on disk`);

      const content = fs.readFileSync(filePath, 'utf8');
      const json = JSON.parse(content);

      assert.ok(json.testId, `${file} must contain testId`);
      assert.ok(json.timestamp, `${file} must contain timestamp`);
      assert.ok(json.evidenceHash, `${file} must contain evidenceHash`);
      assert.equal(json.evidenceHash.length, 64, `${file} evidenceHash must be SHA-256`);
      assert.notEqual(
        json.evidenceHash,
        'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
        `${file} evidenceHash must NOT be empty string SHA-256`
      );
    }
  });

  it('4. ExportEvidenceFiles refreshes all 13 evidence files with updated hashes', async () => {
    const written = await abdmCertificationEvidenceEngine.exportEvidenceFiles(EVIDENCE_DIR);
    assert.equal(written.length, 13, 'Must export all 13 evidence files');

    for (const p of written) {
      assert.ok(fs.existsSync(p), `Exported file ${p} must exist on disk`);
    }
  });
});
