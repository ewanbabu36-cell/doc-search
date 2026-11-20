import fs from 'fs';
import { execSync } from 'child_process';
import path from 'path';

async function run() {
  console.log('====================================================');
  console.log('🔍 PHASE 0: EVIDENCE PRESERVATION & BASELINE VERIFICATION');
  console.log('====================================================\n');

  const baseline = {};

  // 1. Verify Git HEAD
  const gitHead = execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim();
  const gitStatus = execSync('git status --porcelain', { encoding: 'utf8' }).trim();
  const targetCommit = 'a0d8e90';
  const headMatches = gitHead.startsWith(targetCommit);
  console.log(`[GIT-01] Target Commit: ${targetCommit}`);
  console.log(`[GIT-02] Actual Git HEAD: ${gitHead} -> ${headMatches ? 'MATCH' : 'MISMATCH'}`);
  console.log(`[GIT-03] Working tree status:\n${gitStatus ? gitStatus : 'CLEAN (No tracked modifications)'}\n`);

  baseline.git = { targetCommit, gitHead, headMatches, status: gitStatus };

  // 2. Retrieve Phase 8 Audit Reports
  const artifactDir = 'C:/Users/alamr/.gemini/antigravity/brain/75842c25-6ae5-4cad-8acc-c97e8df708b2';
  const phase8Reports = [
    'DOCSEARCH_PHASE_8_MASTER_FORENSIC_AUDIT.md',
    'DOCSEARCH_PHASE_8_UI_FUNCTIONALITY_CENSUS.md',
    'DOCSEARCH_PHASE_8_API_SECURITY_AUDIT.md',
    'DOCSEARCH_PHASE_8_DATABASE_INTEGRITY_AUDIT.md',
    'DOCSEARCH_PHASE_8_INFRASTRUCTURE_AUDIT.md',
    'DOCSEARCH_PHASE_8_E2E_VERIFICATION.md',
    'DOCSEARCH_PHASE_8_REMEDIATION_REGISTER.md',
    'DOCSEARCH_PHASE_8_FINAL_CERTIFICATION.md'
  ];

  console.log('--- Phase 8 Artifact Verification ---');
  baseline.phase8Reports = [];
  for (const report of phase8Reports) {
    const fullPath = path.join(artifactDir, report);
    const exists = fs.existsSync(fullPath);
    const size = exists ? fs.statSync(fullPath).size : 0;
    console.log(`- ${report}: ${exists ? 'FOUND (' + size + ' bytes)' : 'NOT FOUND'}`);
    baseline.phase8Reports.push({ report, exists, size });
  }

  // 3. Inspect Previous Audit Scripts & Output Data
  console.log('\n--- Previous Phase Audit Artifacts in Repo ---');
  const auditFiles = [
    'scripts/audit-phase-a-inventory.mjs',
    'scripts/phase-a-inventory-output.json',
    'scripts/audit-phase-b-ui-census.mjs',
    'scripts/phase-b-ui-census-output.json',
    'scripts/audit-phase-c-api.mjs',
    'scripts/phase-c-api-output.json',
    'scripts/audit-phase-d-security.mjs',
    'scripts/phase-d-security-output.json',
    'scripts/audit-phase-e-database-financial.mjs',
    'scripts/phase-e-database-financial-output.json',
    'scripts/audit-phase-f-infrastructure.mjs',
    'scripts/phase-f-infrastructure-output.json',
    'scripts/audit-phase-g-integration.mjs',
    'scripts/phase-g-integration-output.json'
  ];

  baseline.auditSuiteFiles = [];
  for (const f of auditFiles) {
    const exists = fs.existsSync(f);
    const size = exists ? fs.statSync(f).size : 0;
    console.log(`- ${f}: ${exists ? 'EXISTS (' + size + ' bytes)' : 'MISSING'}`);
    baseline.auditSuiteFiles.push({ file: f, exists, size });
  }

  // 4. Identify Tests That Use Mocks, Fixtures, Stubs or Simulated Responses
  console.log('\n--- Mock / Stub / Fixture Presence Analysis ---');
  const invJson = JSON.parse(fs.readFileSync('scripts/phase-a-inventory-output.json', 'utf8'));
  const mockOccurrences = invJson.mockInventory || [];
  console.log(`Total mock/placeholder/dummy references across repo: ${mockOccurrences.length}`);

  // Classify where mocks exist
  const mockByPkg = {};
  for (const m of mockOccurrences) {
    const parts = m.file.split(/[\\/]/);
    const pkg = parts[0] === 'apps' ? parts[1] : (parts[0] === 'packages' ? parts[1] : parts[0]);
    mockByPkg[pkg] = (mockByPkg[pkg] || 0) + 1;
  }
  console.log('Mock occurrences by package/area:', JSON.stringify(mockByPkg, null, 2));
  baseline.mockInventorySummary = { total: mockOccurrences.length, byPackage: mockByPkg };

  // Write Phase 0 Baseline output
  fs.writeFileSync('scripts/challenge-phase-0-output.json', JSON.stringify(baseline, null, 2), 'utf8');
  console.log('\n✅ PHASE 0 BASELINE PRESERVED IN scripts/challenge-phase-0-output.json\n');
}

run();
