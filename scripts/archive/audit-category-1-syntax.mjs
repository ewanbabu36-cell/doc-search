import fs from 'fs';
import path from 'path';
import ts from 'typescript';

const ROOT_DIR = process.cwd();
const EXCLUDE_DIRS = new Set([
  'node_modules',
  '.git',
  '.turbo',
  'dist',
  'build',
  '.next',
  '.data',
  '.storage',
  'coverage',
  'audit-results'
]);

const filesAudited = {
  json: 0,
  js: 0,
  mjs: 0,
  cjs: 0,
  ts: 0,
  tsx: 0,
  total: 0
};

const findings = [];

function walk(dir) {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch (err) {
    return;
  }

  for (const entry of entries) {
    if (EXCLUDE_DIRS.has(entry.name)) continue;
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      walk(fullPath);
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name).toLowerCase();
      const relPath = path.relative(ROOT_DIR, fullPath).replace(/\\/g, '/');

      if (ext === '.json') {
        filesAudited.json++;
        filesAudited.total++;
        checkJson(fullPath, relPath);
      } else if (['.js', '.mjs', '.cjs'].includes(ext)) {
        if (ext === '.js') filesAudited.js++;
        if (ext === '.mjs') filesAudited.mjs++;
        if (ext === '.cjs') filesAudited.cjs++;
        filesAudited.total++;
        checkJsTs(fullPath, relPath);
      } else if (['.ts', '.tsx'].includes(ext)) {
        if (ext === '.ts') filesAudited.ts++;
        if (ext === '.tsx') filesAudited.tsx++;
        filesAudited.total++;
        checkJsTs(fullPath, relPath);
      }
    }
  }
}

function checkJson(filePath, relPath) {
  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    const isConfig = relPath.includes('tsconfig') || relPath.includes('.vscode');
    if (isConfig) {
      const res = ts.readConfigFile(filePath, ts.sys.readFile);
      if (res.error) {
        findings.push({
          file: relPath,
          line: res.error.file ? res.error.file.getLineAndCharacterOfPosition(res.error.start).line + 1 : 1,
          column: res.error.file ? res.error.file.getLineAndCharacterOfPosition(res.error.start).character + 1 : 1,
          parser: 'ts.readConfigFile',
          diagnostic: typeof res.error.messageText === 'string' ? res.error.messageText : res.error.messageText.messageText,
          code: `TS${res.error.code}`,
          category: 'CONFIG_PARSE_ERROR'
        });
      }
    } else {
      JSON.parse(raw);
    }
  } catch (e) {
    findings.push({
      file: relPath,
      line: 1,
      column: 1,
      parser: 'JSON.parse',
      diagnostic: e.message,
      code: 'INVALID_JSON',
      category: 'INVALID_JSON'
    });
  }
}

function checkJsTs(filePath, relPath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const scriptKind = relPath.endsWith('.tsx') ? ts.ScriptKind.TSX :
                       relPath.endsWith('.jsx') ? ts.ScriptKind.JSX :
                       relPath.endsWith('.ts') ? ts.ScriptKind.TS :
                       ts.ScriptKind.JS;

    const sourceFile = ts.createSourceFile(
      relPath,
      content,
      ts.ScriptTarget.Latest,
      true,
      scriptKind
    );

    const diagnostics = sourceFile.parseDiagnostics;
    if (diagnostics && diagnostics.length > 0) {
      for (const diag of diagnostics) {
        const { line, character } = sourceFile.getLineAndCharacterOfPosition(diag.start);
        const msg = typeof diag.messageText === 'string' ? diag.messageText : diag.messageText.messageText;
        findings.push({
          file: relPath,
          line: line + 1,
          column: character + 1,
          parser: 'ts.createSourceFile',
          diagnostic: msg,
          code: `TS${diag.code}`,
          category: 'SYNTAX_ERROR'
        });
      }
    }
  } catch (e) {
    findings.push({
      file: relPath,
      line: 1,
      column: 1,
      parser: 'fs.readFileSync/lexer',
      diagnostic: e.message,
      code: 'PARSE_ERROR',
      category: 'PARSE_ERROR'
    });
  }
}

console.log('Running Category 1: Comprehensive Syntax Error Audit...');
const startTime = Date.now();
walk(ROOT_DIR);
const durationMs = Date.now() - startTime;
const durationSec = (durationMs / 1000).toFixed(2);

if (!fs.existsSync('audit-results')) {
  fs.mkdirSync('audit-results', { recursive: true });
}

const resultPayload = {
  timestamp: new Date().toISOString(),
  durationSec: parseFloat(durationSec),
  filesAudited,
  totalFindings: findings.length,
  findings
};

fs.writeFileSync('audit-results/category-1-syntax-baseline.json', JSON.stringify(resultPayload, null, 2), 'utf8');

const mdReport = `# Category 1 Syntax Audit Baseline Report

**Timestamp**: ${resultPayload.timestamp}  
**Execution Duration**: ${durationSec}s  
**Files Audited**: ${filesAudited.total}  
- JSON: ${filesAudited.json}  
- JS: ${filesAudited.js}  
- MJS: ${filesAudited.mjs}  
- CJS: ${filesAudited.cjs}  
- TS: ${filesAudited.ts}  
- TSX: ${filesAudited.tsx}  

## Syntax Diagnostic Findings: ${findings.length}

${findings.length === 0 ? '### Result: ZERO SYNTAX ERRORS DETECTED repository-wide.\n' : findings.map(f => `- **[${f.category}]** \`${f.file}:${f.line}:${f.column}\` (${f.code}) via \`${f.parser}\`: ${f.diagnostic}`).join('\n')}
`;

fs.writeFileSync('audit-results/category-1-syntax-baseline.md', mdReport, 'utf8');

console.log(`Audit complete in ${durationSec}s. Total files parsed: ${filesAudited.total}. Syntax errors: ${findings.length}`);
console.log('Results written to:');
console.log(' - audit-results/category-1-syntax-baseline.json');
console.log(' - audit-results/category-1-syntax-baseline.md');

if (findings.length > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
