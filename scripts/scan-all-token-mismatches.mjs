import fs from 'fs';
import path from 'path';

const rootDir = process.cwd();

// Directories to scan
const targetDirs = [
  'apps/partner-platform/src',
  'apps/company-platform/src',
  'apps/patient-app/src',
  'apps/landing-page/src',
  'apps/api-gateway/src',
  'packages/api-contracts/src',
  'packages/auth/src'
];

function getAllFiles(dir, extensions = ['.ts', '.tsx', '.js', '.jsx', '.mjs']) {
  let results = [];
  if (!fs.existsSync(dir)) return results;
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      if (file !== 'node_modules' && file !== 'dist' && file !== '.git') {
        results = results.concat(getAllFiles(fullPath, extensions));
      }
    } else {
      if (extensions.some(ext => file.endsWith(ext))) {
        results.push(fullPath);
      }
    }
  }
  return results;
}

const allFiles = targetDirs.flatMap(d => getAllFiles(path.join(rootDir, d)));
console.log(`Scanning ${allFiles.length} files across frontends and backends...\n`);

const findings = {
  rawFetchWithoutAuth: [],
  localStorageTokens: new Set(),
  authHeaderPatterns: [],
  adHocJwtVerification: []
};

// Regex patterns
const FETCH_REGEX = /fetch\s*\(\s*[`'"](\/api\/[^`'"]+)[`'"](?:\s*,\s*(\{[\s\S]*?\}))?/g;
const STORAGE_REGEX = /(?:localStorage|sessionStorage)\.(?:getItem|setItem|removeItem)\s*\(\s*['"]([^'"]+)['"]/g;
const AUTH_HEADER_REGEX = /['"]?(?:Authorization|authorization)['"]?\s*:\s*([^,\n}]+)/g;

for (const filePath of allFiles) {
  const relPath = path.relative(rootDir, filePath).replace(/\\/g, '/');
  const content = fs.readFileSync(filePath, 'utf8');

  // 1. Scan storage keys
  let m;
  while ((m = STORAGE_REGEX.exec(content)) !== null) {
    const key = m[1];
    if (key.includes('token') || key.includes('auth') || key.includes('session')) {
      findings.localStorageTokens.add(`${key} (found in ${relPath})`);
    }
  }

  // 2. Scan raw fetch calls in frontend apps
  if (relPath.startsWith('apps/partner-platform') || relPath.startsWith('apps/company-platform') || relPath.startsWith('apps/patient-app')) {
    let fetchMatch;
    while ((fetchMatch = FETCH_REGEX.exec(content)) !== null) {
      const endpoint = fetchMatch[1];
      const options = fetchMatch[2] || '';
      
      // Check if endpoint is protected and options lack Authorization
      const isPublic = endpoint.includes('/auth/login') ||
                       endpoint.includes('/auth/request-otp') ||
                       endpoint.includes('/auth/verify-otp') ||
                       endpoint.includes('/health') ||
                       endpoint.includes('/public/') ||
                       endpoint.includes('/auth/launch-offer') ||
                       endpoint.includes('/auth/registration-form-config');
      
      const hasAuth = options.includes('Authorization') ||
                      options.includes('getAuthToken') ||
                      options.includes('getAuthHeaders') ||
                      options.includes('token') ||
                      options.includes('headers');

      if (!isPublic && !hasAuth) {
        findings.rawFetchWithoutAuth.push({
          file: relPath,
          endpoint,
          optionsSnippet: options.slice(0, 80).replace(/\n/g, ' ')
        });
      }
    }

    // 3. Scan for string interpolation bugs like 'Bearer ' + ... where token might be null
    let authMatch;
    while ((authMatch = AUTH_HEADER_REGEX.exec(content)) !== null) {
      const val = authMatch[1].trim();
      if (val.includes('+') && !val.includes('getAuthToken') && !val.includes('getToken')) {
        findings.authHeaderPatterns.push({
          file: relPath,
          headerExpr: val
        });
      }
    }
  }

  // 4. Scan backend for ad-hoc verifyJwt calls
  if (relPath.startsWith('apps/api-gateway/src/routes')) {
    if (content.includes('verifyJwt')) {
      findings.adHocJwtVerification.push(relPath);
    }
  }
}

console.log('=== 1. STORAGE KEYS FOUND FOR TOKENS / SESSIONS ===');
Array.from(findings.localStorageTokens).sort().forEach(k => console.log('  *', k));

console.log('\n=== 2. RAW FETCH CALLS MISSING AUTH ON PROTECTED ENDPOINTS ===');
if (findings.rawFetchWithoutAuth.length === 0) {
  console.log('  None! All raw fetch calls on protected endpoints pass auth or headers.');
} else {
  findings.rawFetchWithoutAuth.forEach(f => {
    console.log(`  * ${f.file} -> ${f.endpoint}`);
  });
}

console.log('\n=== 3. MANUAL STRING CONCATENATION IN AUTH HEADERS ===');
if (findings.authHeaderPatterns.length === 0) {
  console.log('  None! All headers use standard getAuthToken/getToken helpers.');
} else {
  findings.authHeaderPatterns.forEach(h => {
    console.log(`  * ${h.file} -> ${h.headerExpr}`);
  });
}

console.log('\n=== 4. BACKEND ROUTES WITH AD-HOC verifyJwt CALLS ===');
findings.adHocJwtVerification.forEach(f => console.log('  *', f));
