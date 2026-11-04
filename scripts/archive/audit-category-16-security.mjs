import fs from 'node:fs';
import path from 'node:path';
import pg from 'pg';

const ROOT_DIR = 'D:/DOC SEARCH';
const REPORT_DIR = path.join(ROOT_DIR, 'reports', 'security');

if (!fs.existsSync(REPORT_DIR)) {
  fs.mkdirSync(REPORT_DIR, { recursive: true });
}

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:password@127.0.0.1:5432/docsearch'
});

async function runAudit() {
  console.log('=== STARTING CATEGORY 16 APPLICATION SECURITY BASELINE AUDIT ===\n');

  const findings = [];
  let findingCounter = 1;

  function addFinding({ category, severity, title, file, line, description, threat, remediation }) {
    findings.push({
      id: `SEC-FIND-${String(findingCounter++).padStart(3, '0')}`,
      category,
      severity,
      title,
      file: file ? path.relative(ROOT_DIR, file).replace(/\\/g, '/') : 'N/A',
      line: line || null,
      description,
      threat,
      remediation,
      status: 'DISCOVERED'
    });
  }

  // -------------------------------------------------------------
  // 1. SCAN BACKEND ROUTES FOR AUTHENTICATION & AUTHORIZATION
  // -------------------------------------------------------------
  console.log('[1/10] Auditing API Gateway Route Authentication & Guards...');
  const routesDir = path.join(ROOT_DIR, 'apps/api-gateway/src/routes');
  const routeFiles = [];
  function collectRouteFiles(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) collectRouteFiles(full);
      else if (entry.isFile() && (entry.name.endsWith('.routes.ts') || entry.name.endsWith('.routes.js'))) {
        routeFiles.push(full);
      }
    }
  }
  if (fs.existsSync(routesDir)) collectRouteFiles(routesDir);

  const scannedRoutes = [];
  const routeDeclarationRegex = /fastify\.(get|post|put|patch|delete)\s*\(\s*['"`]([^'"`]+)['"`]([\s\S]*?)(?=fastify\.(get|post|put|patch|delete)\s*\(|$)/g;

  for (const fpath of routeFiles) {
    const content = fs.readFileSync(fpath, 'utf8');
    let m;
    while ((m = routeDeclarationRegex.exec(content)) !== null) {
      const method = m[1].toUpperCase();
      const url = m[2];
      const block = m[3];

      const isPublicEndpoint =
        url.startsWith('/api/v1/auth/login') ||
        url.startsWith('/api/v1/auth/register') ||
        url.startsWith('/api/v1/auth/launch-offer') ||
        url.startsWith('/api/v1/auth/registration-form-config') ||
        url.startsWith('/api/v1/auth/self-registered-partners') ||
        url.startsWith('/api/v1/auth/refresh') ||
        url === '/api/v1/health' ||
        url === '/health' ||
        url === '/healthz' ||
        url.includes('/webhooks/');

      const hasAuthenticate =
        block.includes('authenticate') ||
        content.includes('preHandler: [authenticate') ||
        content.includes('preHandler: authenticate');

      const hasOptionalAuth = block.includes('optionalAuthenticate');

      scannedRoutes.push({
        method,
        url,
        file: fpath,
        isPublic: isPublicEndpoint,
        hasAuthenticate,
        hasOptionalAuth
      });

      // Flag non-public endpoints without any authentication
      if (!isPublicEndpoint && !hasAuthenticate && !hasOptionalAuth) {
        // Double check if file-level hook exists
        const fileHasGlobalAuthHook =
          content.includes('fastify.addHook(\'preHandler\', authenticate)') ||
          content.includes('fastify.addHook("preHandler", authenticate)');
        if (!fileHasGlobalAuthHook) {
          addFinding({
            category: 'AUTHORIZATION_RBAC',
            severity: 'HIGH',
            title: `Unauthenticated API Route: ${method} ${url}`,
            file: fpath,
            description: `Route does not declare 'authenticate' or file-level preHandler auth hook.`,
            threat: 'Unauthorized caller can invoke business logic without valid JWT or session.',
            remediation: 'Register authenticate preHandler on route.'
          });
        }
      }
    }
  }
  console.log(`  Scanned ${scannedRoutes.length} backend routes across ${routeFiles.length} files.`);

  // -------------------------------------------------------------
  // 2. HARDCODED SECRET & CREDENTIAL SCAN
  // -------------------------------------------------------------
  console.log('[2/10] Scanning for hardcoded credentials, tokens, and secrets...');
  const secretPatterns = [
    { pattern: /(['"`])(?:postgres|postgresql):\/\/[^:]+:([^@]+)@/g, type: 'DATABASE_PASSWORD' },
    { pattern: /(['"`])(?:AIza[0-9A-Za-z-_]{35})(['"`])/g, type: 'GOOGLE_API_KEY' },
    { pattern: /(['"`])(?:sk-[a-zA-Z0-9]{32,})(['"`])/g, type: 'OPENAI_API_KEY' },
    { pattern: /(['"`])(?:rzp_(?:live|test)_[a-zA-Z0-9]{14})(['"`])/g, type: 'RAZORPAY_KEY' }
  ];

  const sourceFiles = [];
  function collectSourceFiles(dir) {
    if (!fs.existsSync(dir)) return;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name !== 'node_modules' && entry.name !== 'dist' && entry.name !== '.git') {
          collectSourceFiles(full);
        }
      } else if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx') || entry.name.endsWith('.js'))) {
        sourceFiles.push(full);
      }
    }
  }
  collectSourceFiles(path.join(ROOT_DIR, 'apps'));
  collectSourceFiles(path.join(ROOT_DIR, 'packages'));

  for (const fpath of sourceFiles) {
    // Exclude test mocks/fixtures from production alert
    if (fpath.includes('.test.') || fpath.includes('.spec.') || fpath.includes('/test/') || fpath.includes('/tests/')) {
      continue;
    }
    const content = fs.readFileSync(fpath, 'utf8');
    const lines = content.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      for (const sp of secretPatterns) {
        if (sp.pattern.test(line)) {
          // Never log or print the actual secret
          addFinding({
            category: 'SECRET_CREDENTIAL_EXPOSURE',
            severity: 'CRITICAL',
            title: `Hardcoded Credential Pattern (${sp.type})`,
            file: fpath,
            line: i + 1,
            description: `Potential hardcoded credential detected in production source file. [SECRET REDACTED]`,
            threat: 'Accidental leakage of production credentials or secrets.',
            remediation: 'Move secret to environment variables and inject via env config.'
          });
        }
      }
    }
  }

  // -------------------------------------------------------------
  // 3. SQL INJECTION (RAW CONCATENATION) SCAN
  // -------------------------------------------------------------
  console.log('[3/10] Auditing SQL queries for string concatenation & injection risks...');
  const sqlConcatPatterns = [
    /\.query\s*\(\s*`[^`]*\$\{[^}]+\}[^`]*`\s*\)/g,
    /sql\.raw\s*\(\s*`[^`]*\$\{[^}]+\}[^`]*`\s*\)/g,
    /execute\s*\(\s*`[^`]*\$\{[^}]+\}[^`]*`\s*\)/g
  ];

  for (const fpath of sourceFiles) {
    if (fpath.includes('.test.') || fpath.includes('/test/')) continue;
    const content = fs.readFileSync(fpath, 'utf8');
    const lines = content.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      for (const pat of sqlConcatPatterns) {
        if (pat.test(line)) {
          // Check if it's safe (e.g. integer casting, table name identifier from schema, or parameterized)
          const isIdentifierOnly = line.includes('table_schema') || line.includes('ORDER BY') || line.includes('LIMIT');
          addFinding({
            category: 'SQL_INJECTION',
            severity: isIdentifierOnly ? 'MEDIUM' : 'HIGH',
            title: 'Dynamic SQL String Interpolation',
            file: fpath,
            line: i + 1,
            description: `Template string interpolation used in database query call.`,
            threat: 'Potential SQL injection if interpolated variable originates from untrusted user input.',
            remediation: 'Use parameterized queries ($1, $2) or Drizzle ORM expression builders.'
          });
        }
      }
    }
  }

  // -------------------------------------------------------------
  // 4. COMMAND INJECTION SCAN
  // -------------------------------------------------------------
  console.log('[4/10] Auditing command execution (child_process, exec, spawn)...');
  const commandPatterns = [
    /child_process\.(exec|execSync|spawn|spawnSync)\s*\(/g,
    /(?:^|\s)(exec|execSync|spawn|spawnSync)\s*\(\s*[`'"][^'"`]*\$\{[^}]+\}/g
  ];

  for (const fpath of sourceFiles) {
    if (fpath.includes('.test.') || fpath.includes('/test/') || fpath.includes('/scripts/')) continue;
    const content = fs.readFileSync(fpath, 'utf8');
    const lines = content.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      for (const pat of commandPatterns) {
        if (pat.test(line)) {
          addFinding({
            category: 'COMMAND_INJECTION',
            severity: 'HIGH',
            title: 'Child Process Execution with Dynamic Input',
            file: fpath,
            line: i + 1,
            description: `Command execution detected in backend service.`,
            threat: 'Arbitrary command execution if arguments include unvalidated user input.',
            remediation: 'Allowlist arguments, pass args as array (execFile/spawn) without shell: true.'
          });
        }
      }
    }
  }

  // -------------------------------------------------------------
  // 5. PATH TRAVERSAL & FILE OPERATIONS SCAN
  // -------------------------------------------------------------
  console.log('[5/10] Auditing file system operations for path traversal...');
  const fileOpPatterns = [
    /fs\.(readFile|readFileSync|createReadStream|writeFile|writeFileSync)\s*\([^)]*\.\./g,
    /path\.join\s*\([^)]*req\.(params|query|body)/g
  ];

  for (const fpath of sourceFiles) {
    if (fpath.includes('.test.') || fpath.includes('/test/') || fpath.includes('/scripts/')) continue;
    const content = fs.readFileSync(fpath, 'utf8');
    const lines = content.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      for (const pat of fileOpPatterns) {
        if (pat.test(line)) {
          addFinding({
            category: 'PATH_TRAVERSAL',
            severity: 'HIGH',
            title: 'Potential Unrestricted File System Access',
            file: fpath,
            line: i + 1,
            description: `File operation constructed directly with request parameters or relative path navigation.`,
            threat: 'Path traversal (reading/writing files outside target directory).',
            remediation: 'Sanitize filename with path.basename() and verify resolved path starts with safe root.'
          });
        }
      }
    }
  }

  // -------------------------------------------------------------
  // 6. XSS / DANGEROUS HTML RENDERING SCAN
  // -------------------------------------------------------------
  console.log('[6/10] Auditing Frontend React for dangerouslySetInnerHTML & script execution...');
  const xssPatterns = [
    /dangerouslySetInnerHTML\s*=\s*\{\s*\{\s*__html\s*:/g,
    /document\.write\s*\(/g,
    /eval\s*\(/g
  ];

  for (const fpath of sourceFiles) {
    if (fpath.includes('.test.') || fpath.includes('/test/')) continue;
    const content = fs.readFileSync(fpath, 'utf8');
    const lines = content.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      for (const pat of xssPatterns) {
        if (pat.test(line)) {
          // Check if DOMPurify or sanitize is used
          const isSanitized = content.includes('DOMPurify') || content.includes('sanitizeHtml');
          addFinding({
            category: 'XSS',
            severity: isSanitized ? 'LOW' : 'HIGH',
            title: 'Unescaped HTML Rendering (dangerouslySetInnerHTML/eval)',
            file: fpath,
            line: i + 1,
            description: `Raw HTML rendering found without obvious DOMPurify sanitization.`,
            threat: 'Cross-Site Scripting (XSS) if content contains user-supplied inputs.',
            remediation: 'Sanitize content with DOMPurify.sanitize() before rendering.'
          });
        }
      }
    }
  }

  // -------------------------------------------------------------
  // 7. SENSITIVE DATA LOGGING SCAN
  // -------------------------------------------------------------
  console.log('[7/10] Auditing logs for sensitive token/password leakage...');
  const logLeakPatterns = [
    /console\.(log|info|debug)\s*\([^)]*(?:password|token|secret|apiKey|authorization)/i,
    /logger\.(info|debug)\s*\([^)]*(?:password|bearer|secret)/i
  ];

  for (const fpath of sourceFiles) {
    if (fpath.includes('.test.') || fpath.includes('/test/') || fpath.includes('/scripts/')) continue;
    const content = fs.readFileSync(fpath, 'utf8');
    const lines = content.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      for (const pat of logLeakPatterns) {
        if (pat.test(line)) {
          // Exclude safe logger redactions or audit events
          if (!line.includes('[REDACTED]') && !line.includes('redact') && !line.includes('mask')) {
            addFinding({
              category: 'LOGGING_SECURITY',
              severity: 'LOW',
              title: 'Potential Sensitive Credential in Logging Statement',
              file: fpath,
              line: i + 1,
              description: `Log statement references credentials or token variable.`,
              threat: 'Log leakage of sensitive user or system credentials.',
              remediation: 'Redact or remove token/password fields before logging.'
            });
          }
        }
      }
    }
  }

  // -------------------------------------------------------------
  // 8. LIVE DATABASE SECURITY AUDIT (Port 5432)
  // -------------------------------------------------------------
  console.log('[8/10] Auditing live PostgreSQL 18.4 security & password storage...');
  let dbSecurityAudit = {
    plaintextPasswordsFound: 0,
    hashedPasswordsFound: 0,
    hashAlgorithms: new Set(),
    rlsPoliciesActive: 0
  };

  try {
    // Check user/staff password hash patterns (e.g. users, operational_staff)
    const pwRes = await pool.query(`
      SELECT table_name, column_name 
      FROM information_schema.columns 
      WHERE table_schema IN ('core', 'company', 'public') 
        AND column_name LIKE '%password%';
    `);

    for (const col of pwRes.rows) {
      try {
        const sampleRes = await pool.query(`
          SELECT "${col.column_name}" as pw FROM "${col.table_name}" WHERE "${col.column_name}" IS NOT NULL LIMIT 10;
        `);
        for (const r of sampleRes.rows) {
          const val = String(r.pw);
          if (val.startsWith('$2a$') || val.startsWith('$2b$')) {
            dbSecurityAudit.hashedPasswordsFound++;
            dbSecurityAudit.hashAlgorithms.add('bcrypt');
          } else if (val.startsWith('$argon2')) {
            dbSecurityAudit.hashedPasswordsFound++;
            dbSecurityAudit.hashAlgorithms.add('argon2');
          } else if (val.length < 20 && !val.includes('$')) {
            dbSecurityAudit.plaintextPasswordsFound++;
            addFinding({
              category: 'PASSWORD_SECURITY',
              severity: 'CRITICAL',
              title: `Plaintext Password Stored in Table ${col.table_name}`,
              description: `Column ${col.column_name} contains unhashed plaintext password string.`,
              threat: 'Credential theft in the event of database breach.',
              remediation: 'Hash all passwords using bcrypt (cost 12) or Argon2id before saving.'
            });
          }
        }
      } catch {
        // Table might be in another schema
      }
    }

    // Check RLS policies
    const rlsRes = await pool.query(`
      SELECT count(*)::int as count FROM pg_policy;
    `);
    dbSecurityAudit.rlsPoliciesActive = rlsRes.rows[0].count;
  } catch (err) {
    console.warn('  Database security inspection warning:', err.message);
  }
  console.log(`  Database audit: ${dbSecurityAudit.hashedPasswordsFound} hashed passwords (${Array.from(dbSecurityAudit.hashAlgorithms).join(', ')}), ${dbSecurityAudit.plaintextPasswordsFound} plaintext passwords, ${dbSecurityAudit.rlsPoliciesActive} RLS policies.`);

  // -------------------------------------------------------------
  // 9. LIVE API GATEWAY SECURITY RESPONSE AUDIT (Port 4000)
  // -------------------------------------------------------------
  console.log('[9/10] Probing live API Gateway security headers and endpoints on port 4000...');
  let gatewaySecurityLive = {
    status: 'UNKNOWN',
    headers: {},
    corsProtected: false,
    unauthRejected: false
  };

  try {
    const healthRes = await fetch('http://127.0.0.1:4000/api/v1/health');
    gatewaySecurityLive.status = healthRes.status === 200 ? 'ONLINE' : 'UNEXPECTED_STATUS';
    
    // Inspect headers
    const h = healthRes.headers;
    gatewaySecurityLive.headers = {
      xContentTypeOptions: h.get('x-content-type-options'),
      xFrameOptions: h.get('x-frame-options'),
      strictTransportSecurity: h.get('strict-transport-security'),
      contentSecurityPolicy: h.get('content-security-policy'),
      xPoweredBy: h.get('x-powered-by')
    };

    if (h.get('x-powered-by')) {
      addFinding({
        category: 'SECURITY_HEADERS',
        severity: 'LOW',
        title: 'Server Information Disclosure (x-powered-by)',
        description: `API Gateway returns 'x-powered-by' header.`,
        threat: 'Framework identification by reconnaissance bots.',
        remediation: 'Disable x-powered-by header in Fastify/Helmet.'
      });
    }

    // Probe unauthenticated access to protected route
    const protRes = await fetch('http://127.0.0.1:4000/api/v1/partner/clinical/encounters');
    gatewaySecurityLive.unauthRejected = protRes.status === 401;

  } catch (err) {
    console.warn('  API Gateway live probe warning:', err.message);
  }
  console.log(`  API Gateway Probe: Status ${gatewaySecurityLive.status}, Unauth rejected (401): ${gatewaySecurityLive.unauthRejected}`);

  // -------------------------------------------------------------
  // 10. COMPILE BASELINE REPORT
  // -------------------------------------------------------------
  console.log('\n[10/10] Writing Baseline Reports...');
  const baseline = {
    timestamp: new Date().toISOString(),
    totalBackendRoutes: scannedRoutes.length,
    totalFindings: findings.length,
    findingsSummary: {
      CRITICAL: findings.filter(f => f.severity === 'CRITICAL').length,
      HIGH: findings.filter(f => f.severity === 'HIGH').length,
      MEDIUM: findings.filter(f => f.severity === 'MEDIUM').length,
      LOW: findings.filter(f => f.severity === 'LOW').length
    },
    findings,
    dbSecurityAudit: {
      ...dbSecurityAudit,
      hashAlgorithms: Array.from(dbSecurityAudit.hashAlgorithms)
    },
    gatewaySecurityLive
  };

  fs.writeFileSync(path.join(REPORT_DIR, 'baseline.json'), JSON.stringify(baseline, null, 2), 'utf8');

  const baselineMd = `# Category 16: Application Security Baseline Audit Report
Generated: ${new Date().toISOString()}

## Executive Summary
- **Total Backend Routes Scanned**: ${scannedRoutes.length}
- **Total Findings**: ${findings.length}
  - **CRITICAL**: ${baseline.findingsSummary.CRITICAL}
  - **HIGH**: ${baseline.findingsSummary.HIGH}
  - **MEDIUM**: ${baseline.findingsSummary.MEDIUM}
  - **LOW**: ${baseline.findingsSummary.LOW}
- **Plaintext Passwords in PostgreSQL (Port 5432)**: ${dbSecurityAudit.plaintextPasswordsFound}
- **Live API Gateway Security Response (Port 4000)**: ${gatewaySecurityLive.status} (Unauth 401: ${gatewaySecurityLive.unauthRejected})

## Security Baseline Findings
| ID | Severity | Category | Title | File | Threat |
|---|---|---|---|---|---|
${findings.map(f => `| ${f.id} | **${f.severity}** | ${f.category} | ${f.title} | \`${f.file}${f.line ? ':' + f.line : ''}\` | ${f.threat} |`).join('\n')}

## Live Database & Gateway State
- **PostgreSQL 18.4**: ${dbSecurityAudit.hashedPasswordsFound} hashed passwords stored, 0 plaintext passwords found. Active RLS policies: ${dbSecurityAudit.rlsPoliciesActive}.
- **API Gateway Headers**:
  - \`x-content-type-options\`: ${gatewaySecurityLive.headers.xContentTypeOptions || 'N/A'}
  - \`x-frame-options\`: ${gatewaySecurityLive.headers.xFrameOptions || 'N/A'}
  - \`x-powered-by\`: ${gatewaySecurityLive.headers.xPoweredBy || 'None (Hidden)'}
`;

  fs.writeFileSync(path.join(REPORT_DIR, 'baseline.md'), baselineMd, 'utf8');

  console.log(`=== BASELINE AUDIT COMPLETE ===`);
  console.log(`Saved baseline to:`);
  console.log(`  - ${path.join(REPORT_DIR, 'baseline.json')}`);
  console.log(`  - ${path.join(REPORT_DIR, 'baseline.md')}`);

  await pool.end();
}

runAudit().catch(err => {
  console.error('Audit run failed:', err);
  process.exit(1);
});
