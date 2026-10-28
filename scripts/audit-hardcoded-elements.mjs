import fs from 'fs';
import path from 'path';

const targetDirs = [
  'apps/partner-platform/src',
  'apps/patient-app/src',
  'apps/company-platform/src',
  'apps/sovra-pwa/src',
  'apps/landing-page/src',
  'apps/api-gateway/src'
];

function scanDir(dir) {
  let results = [];
  if (!fs.existsSync(dir)) return results;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results = results.concat(scanDir(full));
    } else if (entry.isFile() && /\.(tsx|jsx|ts|js)$/.test(entry.name)) {
      results.push(full);
    }
  }
  return results;
}

const patterns = [
  { name: 'mock_or_dummy_names', regex: /\b(mock[A-Z]\w*|mockData|MOCK_\w+|dummy[A-Z]\w*|sample[A-Z]\w*|DUMMY_\w+|SAMPLE_\w+)\b/g },
  { name: 'static_array_of_objects', regex: /const\s+[a-zA-Z0-9_]+\s*(?::\s*[^=]+)?=\s*\[\s*\{\s*["']?[a-zA-Z0-9_]+["']?\s*:/g },
  { name: 'placeholder_toast_alert', regex: /(?:alert\(|toast\.(?:info|warn|warning|error)\(['"`](?:Coming soon|Under development|Not implemented|Feature coming|Demo))/gi },
  { name: 'empty_click_handler', regex: /onClick\s*=\s*\{\s*\(\s*\)\s*=>\s*\{\s*\}\s*\}/g },
  { name: 'hardcoded_inr_or_dollar', regex: /(?:₹\s*[0-9,]+|INR\s*[0-9,]+|\$\s*[0-9,]+)/g },
  { name: 'lorem_ipsum', regex: /lorem\s+ipsum/gi }
];

let report = {};

for (const dir of targetDirs) {
  const files = scanDir(dir);
  report[dir] = {
    totalFiles: files.length,
    matchedFilesCount: 0,
    findingsByPattern: {},
    fileDetails: []
  };

  for (const pat of patterns) {
    report[dir].findingsByPattern[pat.name] = 0;
  }

  for (const file of files) {
    const content = fs.readFileSync(file, 'utf8');
    let fileFindings = [];

    for (const pat of patterns) {
      const matches = content.match(pat.regex);
      if (matches && matches.length > 0) {
        report[dir].findingsByPattern[pat.name] += matches.length;
        fileFindings.push({
          pattern: pat.name,
          count: matches.length,
          samples: matches.slice(0, 3)
        });
      }
    }

    if (fileFindings.length > 0) {
      report[dir].matchedFilesCount++;
      report[dir].fileDetails.push({
        file: file.replace(/\\/g, '/'),
        findings: fileFindings
      });
    }
  }
}

// Generate summary report
console.log('=== MONOREPO HARDCODED / MOCK / PLACEHOLDER AUDIT ===');
for (const [dir, data] of Object.entries(report)) {
  console.log(`\nDirectory: ${dir}`);
  console.log(`Total Files: ${data.totalFiles} | Files with Hardcoded/Mock hits: ${data.matchedFilesCount}`);
  console.log('Pattern breakdown:', JSON.stringify(data.findingsByPattern));
}

// Write detailed json to disk for in-depth analysis
fs.writeFileSync('scripts/audit-hardcoded-report.json', JSON.stringify(report, null, 2));
console.log('\nWrote full report to scripts/audit-hardcoded-report.json');
