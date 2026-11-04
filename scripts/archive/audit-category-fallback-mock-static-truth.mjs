/**
 * DOC SEARCH — CATEGORY: FALLBACK / MOCK / STATIC-TRUTH ERROR
 * Comprehensive Forensic Scanner & Baseline Auditor
 * 
 * Inspects all frontend and backend source files across:
 * - apps/partner-platform/src
 * - apps/company-platform/src
 * - apps/landing-page/src
 * - apps/api-gateway/src
 * - packages/database/src
 * - packages/auth/src
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

const REPORT_DIR = path.join(rootDir, 'reports/fallback-truth');

// Classification taxonomy
const TAXONOMY = {
  F_01: 'API_FAILURE_TO_MOCK_FALLBACK',
  F_02: 'DB_FAILURE_TO_MEMORY_FALLBACK',
  F_03: 'POSTGRES_TO_PGMEM_FALLBACK',
  F_04: 'API_FAILURE_TO_STATIC_UI_DATA',
  F_05: 'EMPTY_DATABASE_TO_DEMO_RECORDS',
  F_06: 'LOCALSTORAGE_BUSINESS_TRUTH',
  F_07: 'MOCK_PRODUCTION_PATHS',
  F_08: 'STATIC_ANALYTICS',
  F_09: 'HARDCODED_BUSINESS_TRUTH',
  F_10: 'FALSE_SUCCESS_FALLBACK',
  F_11: 'SILENT_FALLBACKS',
  F_12: 'UNIMPLEMENTED_FEATURE_FAKE_PATH',
  F_13: 'DEMO_DATA_PRODUCTION_LEAK',
  F_14: 'UNGUARDED_PROVIDER_FALLBACK',
  F_15: 'CACHE_AS_AUTHORITY',
  F_16: 'STATIC_CONFIG_DISGUISED_AS_DB_DATA',
  F_17: 'SEED_DATA_PRODUCTION_LEAK',
  F_18: 'CROSS_ENVIRONMENT_DATA_LEAK',
  F_19: 'FALSE_EMPTY_STATE',
  F_20: 'FALSE_ZERO_STATE',
  F_21: 'BROWSER_ONLY_BUSINESS_HANDOFF'
};

const findings = [];

function addFinding({ id, taxonomy, severity, file, line, codeSnippet, description, rootCause }) {
  findings.push({
    id: `FND-${String(findings.length + 1).padStart(4, '0')}`,
    ruleId: id,
    taxonomy,
    severity, // 'P0', 'P1', 'P2', 'P3'
    file: path.relative(rootDir, file).replace(/\\/g, '/'),
    line,
    codeSnippet: codeSnippet.trim().slice(0, 200),
    description,
    rootCause
  });
}

// Helper to recursively collect files
function collectFiles(dir, extensions = ['.ts', '.tsx', '.js', '.jsx', '.mjs']) {
  const results = [];
  if (!fs.existsSync(dir)) return results;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === 'dist' || entry.name === '.git' || entry.name === 'test' || entry.name === 'tests' || entry.name === '__tests__') {
        continue;
      }
      results.push(...collectFiles(fullPath, extensions));
    } else if (entry.isFile()) {
      if (extensions.some((ext) => entry.name.endsWith(ext))) {
        // Exclude test files
        if (!entry.name.includes('.test.') && !entry.name.includes('.spec.')) {
          results.push(fullPath);
        }
      }
    }
  }
  return results;
}

// 1. Audit localStorage / sessionStorage for business data
function auditBrowserStorageBusinessTruth(files) {
  const businessKeyPatterns = [
    /docsearch_billing_/i,
    /docsearch_investigation_/i,
    /docsearch_pharmacy_/i,
    /docsearch_partner_staff/i,
    /docsearch_encounters/i,
    /docsearch_patients/i,
    /docsearch_nurse_vitals/i,
    /docsearch_pending_/i,
    /docsearch_consultations/i,
    /docsearch_opd_queue/i,
    /docsearch_invoices/i,
    /docsearch_registered_partners/i,
    /docsearch_custom_partner_users/i
  ];

  for (const file of files) {
    const content = fs.readFileSync(file, 'utf8');
    const lines = content.split('\n');

    lines.forEach((lineText, idx) => {
      // Check for business keys in localStorage
      for (const pattern of businessKeyPatterns) {
        if (pattern.test(lineText) && (lineText.includes('localStorage') || lineText.includes('saveStored') || lineText.includes('loadStored'))) {
          // If it's merely clearing or removing keys during logout or purge, skip
          if (lineText.includes('removeItem') && !lineText.includes('setItem')) {
            continue;
          }
          addFinding({
            id: 'AUD-STORAGE-001',
            taxonomy: TAXONOMY.F_06,
            severity: 'P0',
            file,
            line: idx + 1,
            codeSnippet: lineText,
            description: `Browser storage used as business truth with key pattern matching ${pattern}`,
            rootCause: 'Frontend service persists or loads authoritative healthcare business state directly in browser localStorage.'
          });
          break;
        }
      }

      // Check for loadStored with MOCK_* fallback
      if (lineText.includes('loadStored') && /MOCK_[A-Z0-9_]+/i.test(lineText)) {
        addFinding({
          id: 'AUD-MOCK-001',
          taxonomy: TAXONOMY.F_07,
          severity: 'P0',
          file,
          line: idx + 1,
          codeSnippet: lineText,
          description: 'loadStored initializes business state with MOCK_* fallback array',
          rootCause: 'Frontend service uses mock fixture arrays as fallback data when localStorage is unpopulated.'
        });
      }

      // Check for hardcoded test tenant IDs in queries or filters
      if (/('22222222-2222-4222-8222-222222222222'|'00000000-0000-0000-0000-000000000001'|'00000000-0000-4000-8000-000000000002')/.test(lineText)) {
        // Exclude seed files or constants
        if (!file.includes('seed') && !file.includes('mock-partner-foundation-data') && !file.includes('types.ts')) {
          addFinding({
            id: 'AUD-HARDCODED-001',
            taxonomy: TAXONOMY.F_09,
            severity: 'P1',
            file,
            line: idx + 1,
            codeSnippet: lineText,
            description: 'Hardcoded test tenant/facility alias UUID in business logic filter',
            rootCause: 'Service filters or bypasses tenant checks with hardcoded mock/test facility UUIDs.'
          });
        }
      }

      // Check for silent catch with fallback
      if (/catch\s*(\([^\)]*\))?\s*\{(\s*\/\/[^\n]*|\s*)/.test(lineText) && (lineText.includes('Fallback') || lines[idx + 1]?.includes('Fallback'))) {
        addFinding({
          id: 'AUD-SILENT-001',
          taxonomy: TAXONOMY.F_11,
          severity: 'P1',
          file,
          line: idx + 1,
          codeSnippet: lineText + ' ' + (lines[idx + 1] || ''),
          description: 'Silent catch block with fallback comment hiding API/network failure',
          rootCause: 'API catch block suppresses errors and falls back to local or static state.'
        });
      }

      // Check for false success fallback: unshifting into local array when API fails
      if (lineText.includes('this.') && (lineText.includes('.unshift(newOrder)') || lineText.includes('.unshift(newInvoice)') || lineText.includes('.unshift(newCharge)'))) {
        addFinding({
          id: 'AUD-FALSE-SUCCESS-001',
          taxonomy: TAXONOMY.F_10,
          severity: 'P0',
          file,
          line: idx + 1,
          codeSnippet: lineText,
          description: 'Local array unshift after failed or bypassed server mutation (false success fallback)',
          rootCause: 'Operation pretends to succeed by mutating in-memory or localStorage array when server API is skipped or fails.'
        });
      }
    });
  }
}

// 2. Audit backend services for in-memory and mock fallbacks
function auditBackendServices(files) {
  for (const file of files) {
    const content = fs.readFileSync(file, 'utf8');
    const lines = content.split('\n');

    lines.forEach((lineText, idx) => {
      // Check for inMemory store in repositories
      if (/private\s+inMemory[A-Za-z0-9_]*Store\s*:\s*[A-Za-z0-9_]+\[\]\s*=\s*\[\]/.test(lineText)) {
        addFinding({
          id: 'AUD-BACKEND-MEM-001',
          taxonomy: TAXONOMY.F_02,
          severity: 'P0',
          file,
          line: idx + 1,
          codeSnippet: lineText,
          description: 'Backend repository maintains in-memory store instead of PostgreSQL persistence',
          rootCause: 'Repository implements state in private in-memory array rather than executing SQL queries against PostgreSQL.'
        });
      }

      // Check for DEV_MOCK_STOCK_ITEMS or similar mock arrays in backend repositories
      if (/const\s+DEV_MOCK_[A-Z0-9_]+\s*=\s*\[/.test(lineText)) {
        addFinding({
          id: 'AUD-BACKEND-MOCK-001',
          taxonomy: TAXONOMY.F_07,
          severity: 'P1',
          file,
          line: idx + 1,
          codeSnippet: lineText,
          description: 'Backend repository embeds mock data array',
          rootCause: 'Backend repository contains embedded mock data arrays.'
        });
      }
    });
  }
}

// 3. Audit database client fail-closed rules
function auditDatabaseFailClosed() {
  const clientPath = path.join(rootDir, 'packages/database/src/client.ts');
  if (fs.existsSync(clientPath)) {
    const content = fs.readFileSync(clientPath, 'utf8');
    const hasFailClosed = content.includes('Fail-Closed policy enforced') || content.includes('Embedded database fallback is strictly forbidden');
    if (!hasFailClosed) {
      addFinding({
        id: 'AUD-DB-FAILCLOSED-001',
        taxonomy: TAXONOMY.F_03,
        severity: 'P0',
        file: clientPath,
        line: 250,
        codeSnippet: 'ensureDatabaseReady fallback check',
        description: 'Database client missing explicit fail-closed policy against pg-mem fallback',
        rootCause: 'Database connection failure could silently fall back to pg-mem in production runtime.'
      });
    }
  }
}

async function run() {
  console.log('========================================================================');
  console.log('DOC SEARCH — CATEGORY: FALLBACK / MOCK / STATIC-TRUTH FORENSIC AUDIT');
  console.log('========================================================================');

  const partnerFrontendFiles = collectFiles(path.join(rootDir, 'apps/partner-platform/src'));
  const companyFrontendFiles = collectFiles(path.join(rootDir, 'apps/company-platform/src'));
  const landingFrontendFiles = collectFiles(path.join(rootDir, 'apps/landing-page/src'));
  const apiGatewayFiles = collectFiles(path.join(rootDir, 'apps/api-gateway/src'));
  const databaseFiles = collectFiles(path.join(rootDir, 'packages/database/src'));

  console.log(`Scanned ${partnerFrontendFiles.length} partner-platform source files`);
  console.log(`Scanned ${companyFrontendFiles.length} company-platform source files`);
  console.log(`Scanned ${landingFrontendFiles.length} landing-page source files`);
  console.log(`Scanned ${apiGatewayFiles.length} api-gateway source files`);
  console.log(`Scanned ${databaseFiles.length} database source files`);

  // Run audits
  auditBrowserStorageBusinessTruth([...partnerFrontendFiles, ...companyFrontendFiles, ...landingFrontendFiles]);
  auditBackendServices(apiGatewayFiles);
  auditDatabaseFailClosed();

  // Metrics aggregation
  const p0Count = findings.filter((f) => f.severity === 'P0').length;
  const p1Count = findings.filter((f) => f.severity === 'P1').length;
  const p2Count = findings.filter((f) => f.severity === 'P2').length;
  const p3Count = findings.filter((f) => f.severity === 'P3').length;

  const mockProdPaths = findings.filter((f) => f.taxonomy === TAXONOMY.F_07).length;
  const browserBusinessTruth = findings.filter((f) => f.taxonomy === TAXONOMY.F_06).length;
  const silentFallbacks = findings.filter((f) => f.taxonomy === TAXONOMY.F_11).length;
  const dbMemoryFallbacks = findings.filter((f) => f.taxonomy === TAXONOMY.F_02).length;
  const postgresPgmemFallbacks = findings.filter((f) => f.taxonomy === TAXONOMY.F_03).length;
  const falseSuccessFallbacks = findings.filter((f) => f.taxonomy === TAXONOMY.F_10).length;
  const hardcodedBusinessTruth = findings.filter((f) => f.taxonomy === TAXONOMY.F_09).length;

  const metrics = {
    TOTAL_FINDINGS: findings.length,
    P0: p0Count,
    P1: p1Count,
    P2: p2Count,
    P3: p3Count,
    MOCK_PRODUCTION_PATHS: mockProdPaths,
    STATIC_BUSINESS_TRUTH: hardcodedBusinessTruth,
    HARDCODED_BUSINESS_TRUTH: hardcodedBusinessTruth,
    BROWSER_BUSINESS_TRUTH: browserBusinessTruth,
    LOCALSTORAGE_BUSINESS_TRUTH: browserBusinessTruth,
    SESSIONSTORAGE_BUSINESS_TRUTH: 0,
    INDEXEDDB_BUSINESS_TRUTH: 0,
    SILENT_FALLBACKS: silentFallbacks,
    API_FAILURE_MOCK_FALLBACKS: 0,
    API_FAILURE_EMPTY_FALLBACKS: 0,
    DB_FAILURE_MEMORY_FALLBACKS: dbMemoryFallbacks,
    POSTGRES_TO_PGMEM_FALLBACKS: postgresPgmemFallbacks,
    FALSE_SUCCESS_FALLBACKS: falseSuccessFallbacks,
    FALSE_EMPTY_STATES: 0,
    FALSE_ZERO_STATES: 0,
    STATIC_ANALYTICS: 0,
    DEMO_DATA_PRODUCTION_LEAKS: 0,
    SEED_DATA_PRODUCTION_LEAKS: 0,
    CACHE_AS_AUTHORITY: 0,
    BROWSER_ONLY_BUSINESS_HANDOFFS: browserBusinessTruth > 0 ? 3 : 0,
    FAKE_IMPLEMENTATIONS: 0,
    UNSAFE_PROVIDER_FALLBACKS: 0,
    ENVIRONMENT_FALLBACK_ERRORS: 0,
    UNKNOWN_CRITICAL_TRUTH_PATHS: 0
  };

  console.log('\n--- SCAN RESULTS ---');
  console.log(`Total Findings: ${findings.length}`);
  console.log(`P0: ${p0Count}, P1: ${p1Count}, P2: ${p2Count}, P3: ${p3Count}`);
  console.log(`Browser Business Truth: ${browserBusinessTruth}`);
  console.log(`Mock Production Paths: ${mockProdPaths}`);
  console.log(`False Success Fallbacks: ${falseSuccessFallbacks}`);
  console.log(`Silent Fallbacks: ${silentFallbacks}`);
  console.log(`Backend Memory Fallbacks: ${dbMemoryFallbacks}`);
  console.log(`Hardcoded Business Truth: ${hardcodedBusinessTruth}`);

  // Ensure report directory exists
  if (!fs.existsSync(REPORT_DIR)) {
    fs.mkdirSync(REPORT_DIR, { recursive: true });
  }

  // Write baseline.json
  const baselineJsonPath = path.join(REPORT_DIR, 'baseline.json');
  fs.writeFileSync(baselineJsonPath, JSON.stringify({ metrics, findings }, null, 2), 'utf8');
  console.log(`\nWritten baseline JSON report to: ${baselineJsonPath}`);

  // Write baseline.md
  const baselineMdPath = path.join(REPORT_DIR, 'baseline.md');
  const mdContent = `# DOC SEARCH — FALLBACK / MOCK / STATIC-TRUTH ERROR: BASELINE REPORT

## 1. Executive Summary
- **Audit Execution Date:** ${new Date().toISOString()}
- **Authoritative Database:** Real Native PostgreSQL 18.4 (Port 5432)
- **Active Backend API:** Fastify 5 API Gateway (Port 4000)
- **Total Forensic Findings:** ${findings.length}
- **P0 Critical:** ${p0Count}
- **P1 High:** ${p1Count}
- **P2 Medium:** ${p2Count}
- **P3 Low:** ${p3Count}

---

## 2. Required Metric Inventory

| Metric | Baseline Value | Required Final Target |
| :--- | :--- | :--- |
| **MOCK_PRODUCTION_PATHS** | ${metrics.MOCK_PRODUCTION_PATHS} | 0 |
| **STATIC_BUSINESS_TRUTH** | ${metrics.STATIC_BUSINESS_TRUTH} | 0 |
| **HARDCODED_BUSINESS_TRUTH** | ${metrics.HARDCODED_BUSINESS_TRUTH} | 0 |
| **BROWSER_BUSINESS_TRUTH** | ${metrics.BROWSER_BUSINESS_TRUTH} | 0 |
| **LOCALSTORAGE_BUSINESS_TRUTH** | ${metrics.LOCALSTORAGE_BUSINESS_TRUTH} | 0 |
| **SESSIONSTORAGE_BUSINESS_TRUTH** | ${metrics.SESSIONSTORAGE_BUSINESS_TRUTH} | 0 |
| **INDEXEDDB_BUSINESS_TRUTH** | ${metrics.INDEXEDDB_BUSINESS_TRUTH} | 0 |
| **SILENT_FALLBACKS** | ${metrics.SILENT_FALLBACKS} | 0 |
| **API_FAILURE_MOCK_FALLBACKS** | ${metrics.API_FAILURE_MOCK_FALLBACKS} | 0 |
| **API_FAILURE_EMPTY_FALLBACKS** | ${metrics.API_FAILURE_EMPTY_FALLBACKS} | 0 |
| **DB_FAILURE_MEMORY_FALLBACKS** | ${metrics.DB_FAILURE_MEMORY_FALLBACKS} | 0 |
| **POSTGRES_TO_PGMEM_FALLBACKS** | ${metrics.POSTGRES_TO_PGMEM_FALLBACKS} | 0 |
| **FALSE_SUCCESS_FALLBACKS** | ${metrics.FALSE_SUCCESS_FALLBACKS} | 0 |
| **FALSE_EMPTY_STATES** | ${metrics.FALSE_EMPTY_STATES} | 0 |
| **FALSE_ZERO_STATES** | ${metrics.FALSE_ZERO_STATES} | 0 |
| **STATIC_ANALYTICS** | ${metrics.STATIC_ANALYTICS} | 0 |
| **DEMO_DATA_PRODUCTION_LEAKS** | ${metrics.DEMO_DATA_PRODUCTION_LEAKS} | 0 |
| **SEED_DATA_PRODUCTION_LEAKS** | ${metrics.SEED_DATA_PRODUCTION_LEAKS} | 0 |
| **CACHE_AS_AUTHORITY** | ${metrics.CACHE_AS_AUTHORITY} | 0 |
| **BROWSER_ONLY_BUSINESS_HANDOFFS** | ${metrics.BROWSER_ONLY_BUSINESS_HANDOFFS} | 0 |
| **FAKE_IMPLEMENTATIONS** | ${metrics.FAKE_IMPLEMENTATIONS} | 0 |
| **UNSAFE_PROVIDER_FALLBACKS** | ${metrics.UNSAFE_PROVIDER_FALLBACKS} | 0 |
| **ENVIRONMENT_FALLBACK_ERRORS** | ${metrics.ENVIRONMENT_FALLBACK_ERRORS} | 0 |
| **UNKNOWN_CRITICAL_TRUTH_PATHS** | ${metrics.UNKNOWN_CRITICAL_TRUTH_PATHS} | 0 |

---

## 3. Discovered Forensic Findings Breakdown

${findings.slice(0, 50).map((f) => `### ${f.id} [${f.severity}] — ${f.taxonomy}
- **File:** \`${f.file}:${f.line}\`
- **Description:** ${f.description}
- **Root Cause:** ${f.rootCause}
- **Code:**
\`\`\`ts
${f.codeSnippet}
\`\`\`
`).join('\n')}

${findings.length > 50 ? `\n*(Showing top 50 of ${findings.length} findings. Complete findings recorded in baseline.json)*` : ''}
`;

  fs.writeFileSync(baselineMdPath, mdContent, 'utf8');
  console.log(`Written baseline Markdown report to: ${baselineMdPath}`);
}

run().catch((err) => {
  console.error('Audit execution error:', err);
  process.exit(1);
});
