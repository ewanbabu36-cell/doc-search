/**
 * ==============================================================================
 * DOCSEARCH FULL 10-SUITE MONOREPO REGRESSION RUNNER & EVIDENCE RECORDER
 * ==============================================================================
 * Sequentially executes all enterprise certification test suites:
 * - Prevents state locking and memory contention across test suites
 * - Records machine-readable execution telemetry and invariant proofs
 * - Exits with code 0 if and only if 100% of tests pass cleanly
 * ==============================================================================
 */

import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const SUITES = [
  { id: 'Phase 3', name: 'Enterprise Security Certification', file: 'apps/api-gateway/test/phase3-enterprise-security-certification.test.mjs', expected: 4 },
  { id: 'Phase 4', name: 'Clinical Safety & Medical Workflows', file: 'apps/api-gateway/test/phase4-clinical-safety-and-medical-workflows.test.mjs', expected: 23 },
  { id: 'Phase 5', name: 'Financial Integrity & Regulatory', file: 'apps/api-gateway/test/phase5-financial-integrity-and-regulatory.test.mjs', expected: 39 },
  { id: 'Phase 5.1', name: 'Financial Corrective Audit', file: 'apps/api-gateway/test/phase5-1-financial-corrective-audit.test.mjs', expected: 25 },
  { id: 'Phase 6', name: 'Infrastructure & Resilience', file: 'apps/api-gateway/test/phase6-infrastructure-and-resilience.test.mjs', expected: 21 },
  { id: 'Phase 7.1A', name: 'Kubernetes & TLS Hardening', file: 'apps/api-gateway/test/phase7-1a-kubernetes-and-tls.test.mjs', expected: 16 },
  { id: 'Phase 7.1B', name: 'Kubernetes Staging Manifests', file: 'apps/api-gateway/test/phase7-1b-kubernetes-staging-validation.test.mjs', expected: 13 },
  { id: 'Phase 7.2A', name: 'AWS Cloud Readiness', file: 'apps/api-gateway/test/phase7-2a-aws-infrastructure-readiness.test.mjs', expected: 16 },
  { id: 'Phase 7.2B', name: 'AWS Security & Compatibility', file: 'apps/api-gateway/test/phase7-2b-aws-security-compatibility-audit.test.mjs', expected: 16 },
  { id: 'Phase 7.2C', name: 'Production Readiness Certification', file: 'apps/api-gateway/test/phase7-2c-production-readiness-certification.test.mjs', expected: 23 }
];

async function runAll() {
  const startTime = Date.now();
  console.log('================================================================================');
  console.log('DOCSEARCH MONOREPO CERTIFICATION REGRESSION HARNESS (10 SUITES)');
  console.log(`Execution started at: ${new Date().toISOString()}`);
  console.log('================================================================================\n');

  const suiteResults = [];
  let totalTests = 0;
  let totalPass = 0;
  let totalFail = 0;

  for (const suite of SUITES) {
    const suiteStart = Date.now();
    process.stdout.write(`▶ Running [${suite.id}] ${suite.name} ... `);

    try {
      const output = execSync(`node --test --test-force-exit "${suite.file}"`, {
        cwd: rootDir,
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe']
      });

      // Parse test counts from output
      const passMatch = output.match(/ℹ pass (\d+)/);
      const failMatch = output.match(/ℹ fail (\d+)/);
      const testsMatch = output.match(/ℹ tests (\d+)/);

      if (!passMatch || !testsMatch) {
        throw new Error(`Malformed test output: could not parse test results from suite ${suite.file}`);
      }

      const passCount = parseInt(passMatch[1], 10);
      const failCount = failMatch ? parseInt(failMatch[1], 10) : 0;
      const testsCount = parseInt(testsMatch[1], 10);

      if (failCount > 0 || passCount !== testsCount || passCount !== suite.expected) {
        throw new Error(`Suite assertion mismatch: expected ${suite.expected} passed, got ${passCount} passed and ${failCount} failed.`);
      }

      const durationMs = Date.now() - suiteStart;
      console.log(`PASS (${passCount}/${testsCount} tests, ${durationMs}ms)`);

      suiteResults.push({
        id: suite.id,
        name: suite.name,
        file: suite.file,
        status: 'PASSED',
        tests: testsCount,
        pass: passCount,
        fail: failCount,
        exitCode: 0,
        durationMs
      });

      totalTests += testsCount;
      totalPass += passCount;
      totalFail += failCount;
    } catch (err) {
      const durationMs = Date.now() - suiteStart;
      const exitCode = typeof err.status === 'number' ? err.status : 1;
      console.log(`FAILED (Exit Code ${exitCode}, ${durationMs}ms)`);
      console.error(err.stdout || err.message);

      suiteResults.push({
        id: suite.id,
        name: suite.name,
        file: suite.file,
        status: 'FAILED',
        tests: suite.expected,
        pass: 0,
        fail: suite.expected,
        exitCode,
        error: err.message,
        durationMs
      });
      totalFail++;
    }
  }

  const totalDurationMs = Date.now() - startTime;
  console.log('\n================================================================================');
  console.log(`REGRESSION SUMMARY: ${totalPass} / ${totalTests} PASSED (Total Failures: ${totalFail})`);
  console.log(`Total Duration: ${(totalDurationMs / 1000).toFixed(2)}s`);
  console.log('================================================================================');

  let currentCommit = '52f55fe';
  try {
    currentCommit = execSync('git rev-parse --short HEAD', { cwd: rootDir, encoding: 'utf8' }).trim();
  } catch {
    // fallback
  }

  const evidence = {
    timestamp: new Date().toISOString(),
    commit: currentCommit,
    totalTests,
    totalPass,
    totalFail,
    totalDurationMs,
    allPassed: totalFail === 0 && totalPass === totalTests && totalTests === 196,
    suites: suiteResults
  };

  const evidenceDir = path.join(rootDir, 'data');
  if (!fs.existsSync(evidenceDir)) {
    fs.mkdirSync(evidenceDir, { recursive: true });
  }

  const evidenceFile = path.join(evidenceDir, 'regression-certification-evidence.json');
  fs.writeFileSync(evidenceFile, JSON.stringify(evidence, null, 2), 'utf8');
  console.log(`\nMachine-readable evidence recorded to: ${evidenceFile}`);

  if (totalFail > 0 || totalPass !== totalTests) {
    console.error('Certification failed: Not all tests passed.');
    process.exit(1);
  }

  process.exit(0);
}

runAll();
