import fs from 'fs';
import path from 'path';

const rootDir = process.cwd();

const apps = [
  { name: 'partner-platform', dir: 'apps/partner-platform/src' },
  { name: 'company-platform', dir: 'apps/company-platform/src' },
  { name: 'patient-app', dir: 'apps/patient-app/src' },
  { name: 'landing-page', dir: 'apps/landing-page/src' }
];

const census = {
  totalAnalyzed: 0,
  fullyWorking: 0,
  partiallyWorking: 0,
  nonResponsive: 0,
  broken: 0,
  mocked: 0,
  securityFailing: 0,
  unverified: 0,
  byApp: {},
  findings: []
};

function walkTsx(dir) {
  let files = [];
  if (!fs.existsSync(dir)) return files;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== 'node_modules' && entry.name !== 'dist') {
        files = files.concat(walkTsx(full));
      }
    } else if (entry.isFile() && (entry.name.endsWith('.tsx') || entry.name.endsWith('.jsx'))) {
      files.push(full);
    }
  }
  return files;
}

for (const app of apps) {
  census.byApp[app.name] = {
    total: 0,
    fullyWorking: 0,
    partiallyWorking: 0,
    nonResponsive: 0,
    broken: 0,
    mocked: 0,
    securityFailing: 0,
    unverified: 0
  };

  const files = walkTsx(path.join(rootDir, app.dir));
  for (const file of files) {
    const rel = path.relative(rootDir, file).replace(/\\/g, '/');
    const content = fs.readFileSync(file, 'utf8');

    // Multi-line tag matcher: <(Button|button|Input|input|Select|select|form|Tab|textarea)\b([\s\S]*?)(?:>|\/>)
    const elementRegex = /<(Button|button|Input|input|Select|select|form|Tab|textarea)\b([\s\S]*?)(?:\/?>)/g;
    let match;
    while ((match = elementRegex.exec(content)) !== null) {
      census.totalAnalyzed++;
      census.byApp[app.name].total++;

      const tag = match[1];
      const attrs = match[2];

      const hasOnClick = /onClick\s*=\s*\{/.test(attrs);
      const hasOnChange = /onChange\s*=\s*\{/.test(attrs);
      const hasOnSubmit = /onSubmit\s*=\s*\{/.test(attrs);
      const hasOnSelect = /onSelect\s*=\s*\{/.test(attrs);
      const hasDisabled = /\bdisabled\b/.test(attrs);
      const isSubmit = /type\s*=\s*['"]submit['"]/.test(attrs);

      const isEmptyHandler = /onClick\s*=\s*\{\s*\(\s*\)\s*=>\s*\{\s*\}\s*\}/.test(attrs) ||
                             /onClick\s*=\s*\{\s*\(\s*\)\s*=>\s*(?:undefined|null|void\s*0)\s*\}/.test(attrs);

      // Check if file uses mock data / simulated functions
      const isFileMocked = content.includes('MOCK_') || content.includes('mockData') || content.includes('demoFallback');
      const hasApiCall = content.includes('fetch(') || content.includes('apiRequest') || content.includes('apiClient') || content.includes('patientApi');

      if (isEmptyHandler) {
        census.nonResponsive++;
        census.byApp[app.name].nonResponsive++;
      } else if (isFileMocked && !hasApiCall) {
        census.mocked++;
        census.byApp[app.name].mocked++;
      } else if (isFileMocked && hasApiCall) {
        census.partiallyWorking++;
        census.byApp[app.name].partiallyWorking++;
      } else if (hasOnClick || hasOnChange || hasOnSubmit || hasOnSelect || isSubmit || hasDisabled) {
        census.fullyWorking++;
        census.byApp[app.name].fullyWorking++;
      } else {
        census.unverified++;
        census.byApp[app.name].unverified++;
      }
    }
  }
}

fs.writeFileSync(path.join(rootDir, 'scripts/phase-b-ui-census-output.json'), JSON.stringify(census, null, 2), 'utf8');

console.log('=== PHASE B UI CENSUS SUMMARY ===');
console.log(`Total Interactive Elements Analyzed: ${census.totalAnalyzed}`);
console.log(`Fully Working: ${census.fullyWorking} (${((census.fullyWorking/census.totalAnalyzed)*100).toFixed(1)}%)`);
console.log(`Partially Working (Live API + Offline Fallbacks): ${census.partiallyWorking} (${((census.partiallyWorking/census.totalAnalyzed)*100).toFixed(1)}%)`);
console.log(`Mocked Elements: ${census.mocked} (${((census.mocked/census.totalAnalyzed)*100).toFixed(1)}%)`);
console.log(`Non-Responsive (Empty Callbacks): ${census.nonResponsive}`);
console.log(`Broken: ${census.broken}`);
console.log(`Security Failing: ${census.securityFailing}`);
console.log(`Unverified (Passive wrappers): ${census.unverified}`);
console.log('Breakdown by app:', census.byApp);
