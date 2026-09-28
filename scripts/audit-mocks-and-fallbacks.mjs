import fs from 'node:fs';
import path from 'node:path';

function scanDir(dir, filter = (f) => true) {
  let results = [];
  if (!fs.existsSync(dir)) return results;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== 'node_modules' && entry.name !== 'dist' && entry.name !== '.git' && entry.name !== 'test' && entry.name !== 'tests') {
        results = results.concat(scanDir(fullPath, filter));
      }
    } else if (filter(entry.name)) {
      results.push(fullPath);
    }
  }
  return results;
}

const sourceFiles = [
  ...scanDir('apps/api-gateway/src', (f) => f.endsWith('.ts')),
  ...scanDir('apps/partner-platform/src', (f) => f.endsWith('.ts') || f.endsWith('.tsx')),
  ...scanDir('apps/company-platform/src', (f) => f.endsWith('.ts') || f.endsWith('.tsx')),
  ...scanDir('apps/landing-page/src', (f) => f.endsWith('.ts') || f.endsWith('.tsx'))
];

const mockFindings = [];

// Keywords that indicate mock or fake data
const MOCK_PATTERNS = [
  { pattern: /MOCK_[A-Z0-9_]+/g, type: 'MOCK_CONSTANT' },
  { pattern: /mock[A-Z][a-zA-Z0-9]+/g, type: 'MOCK_VARIABLE' },
  { pattern: /dummy[A-Z][a-zA-Z0-9]+/g, type: 'DUMMY_VARIABLE' },
  { pattern: /fake[A-Z][a-zA-Z0-9]+/g, type: 'FAKE_VARIABLE' },
  { pattern: /fallbackToMock/g, type: 'FALLBACK_TO_MOCK' },
  { pattern: /synthetic[A-Z][a-zA-Z0-9]+/g, type: 'SYNTHETIC_DATA' },
  { pattern: /SAMPLE_[A-Z0-9_]+/g, type: 'SAMPLE_CONSTANT' }
];

for (const file of sourceFiles) {
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n');

  lines.forEach((line, idx) => {
    // Ignore comments
    const trimmed = line.trim();
    if (trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*')) return;
    if (file.includes('.test.') || file.includes('.spec.') || file.includes('test-fixtures')) return;

    for (const p of MOCK_PATTERNS) {
      p.pattern.lastIndex = 0;
      let match;
      while ((match = p.pattern.exec(line)) !== null) {
        // Skip common false positives (e.g., mockImplementation in tests, or mockService in mocks)
        const matchedStr = match[0];
        if (matchedStr === 'mockImplementation' || matchedStr === 'mockResolvedValue') continue;

        mockFindings.push({
          file: file.replace(/\\/g, '/'),
          line: idx + 1,
          type: p.type,
          token: matchedStr,
          snippet: trimmed.slice(0, 120)
        });
      }
    }
  });
}

// Group findings by app and type
const summaryByApp = {};
for (const f of mockFindings) {
  const app = f.file.split('/')[1] || 'root';
  summaryByApp[app] = (summaryByApp[app] || 0) + 1;
}

const report = {
  totalFindings: mockFindings.length,
  summaryByApp,
  findings: mockFindings
};

fs.writeFileSync('scripts/mock-scan-report.json', JSON.stringify(report, null, 2));

console.log('============================================================');
console.log('🕵️ MOCK & FALLBACK DATA AUDIT COMPLETE');
console.log('============================================================');
console.log(`Total Mock/Fallback Occurrences in Production Code: ${mockFindings.length}`);
console.log('Summary by App:', JSON.stringify(summaryByApp, null, 2));
console.log('Report saved to scripts/mock-scan-report.json\n');
