import fs from 'fs';
import path from 'path';

function walk(dir, fileList = []) {
  if (!fs.existsSync(dir)) return fileList;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    if (file === 'node_modules' || file === '.git' || file === 'dist' || file === 'build') continue;
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      walk(filePath, fileList);
    } else {
      fileList.push(filePath);
    }
  }
  return fileList;
}

const allFiles = [
  ...walk('apps/api-gateway/src'),
  ...walk('apps/partner-platform/src'),
  ...walk('apps/company-platform/src'),
  ...walk('apps/landing-page/src'),
  ...walk('packages/database/src'),
  ...walk('packages/auth/src'),
  ...walk('packages/shared-core/src')
];

const findings = {
  inMemoryMaps: [],
  mockFallbacksInServices: [],
  localStorageUsage: [],
  sessionStorageUsage: [],
  hardcodedDoctorsPatients: [],
  hardcodedDashboardMetrics: [],
  hardcodedCurrenciesPrices: [],
  zeroStateFallbacks: []
};

for (const file of allFiles) {
  const normFile = file.replace(/\\/g, '/');
  // Skip test files for production scan
  if (normFile.includes('/test/') || normFile.includes('.test.') || normFile.includes('.spec.')) continue;

  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n');

  lines.forEach((line, idx) => {
    const lineNum = idx + 1;

    // Check for in-memory Map/Set in services/repos
    if ((normFile.includes('/services/') || normFile.includes('/repositories/')) && /new Map\(|new Set\(|const \w+Cache = new Map/i.test(line)) {
      findings.inMemoryMaps.push({ file: normFile, line: lineNum, text: line.trim() });
    }

    // Check for localStorage / sessionStorage
    if (/localStorage\.(getItem|setItem|removeItem|clear)/.test(line)) {
      findings.localStorageUsage.push({ file: normFile, line: lineNum, text: line.trim() });
    }
    if (/sessionStorage\.(getItem|setItem|removeItem|clear)/.test(line)) {
      findings.sessionStorageUsage.push({ file: normFile, line: lineNum, text: line.trim() });
    }

    // Check for hardcoded doctor/patient names or arrays
    if (/const (?:doctors|patients|mockDoctors|mockPatients|sampleDoctors|samplePatients)\s*=\s*\[/i.test(line) ||
        /"Dr\.\s+[A-Z][a-z]+/i.test(line) && !normFile.includes('seeds') && !normFile.includes('mock')) {
      findings.hardcodedDoctorsPatients.push({ file: normFile, line: lineNum, text: line.trim() });
    }

    // Check for mock fallback in catch / default
    if (/return\s+(?:mock|fallback|sample|default|demo)/i.test(line) ||
        /\|\|\s*(?:mock|sample|fallback|demo)/i.test(line) ||
        /\?\?\s*(?:mock|sample|fallback|demo)/i.test(line)) {
      findings.mockFallbacksInServices.push({ file: normFile, line: lineNum, text: line.trim() });
    }

    // Check for hardcoded metrics
    if (/(?:activePatients|totalRevenue|occupancyRate|completedAppointments)\s*[:=]\s*\d{2,}/i.test(line)) {
      findings.hardcodedDashboardMetrics.push({ file: normFile, line: lineNum, text: line.trim() });
    }
  });
}

console.log('--- AUDIT DEEP SCAN SUMMARY ---');
console.log('In-Memory Maps in Services/Repos:', findings.inMemoryMaps.length);
console.log('Mock/Fallback in Catch/Return:', findings.mockFallbacksInServices.length);
console.log('localStorage occurrences:', findings.localStorageUsage.length);
console.log('sessionStorage occurrences:', findings.sessionStorageUsage.length);
console.log('Hardcoded Doctors/Patients:', findings.hardcodedDoctorsPatients.length);
console.log('Hardcoded Dashboard Metrics:', findings.hardcodedDashboardMetrics.length);

fs.writeFileSync('scripts/audit-scan-results.json', JSON.stringify(findings, null, 2));
console.log('Detailed scan written to scripts/audit-scan-results.json');
