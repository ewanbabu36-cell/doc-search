import fs from 'fs';
import path from 'path';
import ts from 'typescript';

const ROOT_DIR = process.cwd();

const PROJECTS = [
  { name: 'packages/api-contracts', dir: 'packages/api-contracts', tsconfig: 'packages/api-contracts/tsconfig.json' },
  { name: 'packages/shared-core', dir: 'packages/shared-core', tsconfig: 'packages/shared-core/tsconfig.json' },
  { name: 'packages/auth', dir: 'packages/auth', tsconfig: 'packages/auth/tsconfig.json' },
  { name: 'packages/database', dir: 'packages/database', tsconfig: 'packages/database/tsconfig.json' },
  { name: 'packages/ui-kit', dir: 'packages/ui-kit', tsconfig: 'packages/ui-kit/tsconfig.json' },
  { name: 'apps/api-gateway', dir: 'apps/api-gateway', tsconfig: 'apps/api-gateway/tsconfig.json' },
  { name: 'apps/partner-platform', dir: 'apps/partner-platform', tsconfig: 'apps/partner-platform/tsconfig.json' },
  { name: 'apps/company-platform', dir: 'apps/company-platform', tsconfig: 'apps/company-platform/tsconfig.json' },
  { name: 'apps/landing-page', dir: 'apps/landing-page', tsconfig: 'apps/landing-page/tsconfig.json' }
];

function classifyDiagnostic(diag, msg) {
  const code = diag.code;
  const lowerMsg = msg.toLowerCase();

  if (code === 2322 || lowerMsg.includes('not assignable to type')) {
    if (lowerMsg.includes('null') || lowerMsg.includes('undefined')) return 'NULLABILITY_ERROR';
    return 'ASSIGNABILITY_ERROR';
  }
  if (code === 2339 || code === 2551 || lowerMsg.includes('does not exist on type') || lowerMsg.includes('property')) {
    return 'PROPERTY_MISSING';
  }
  if (code === 2345 || lowerMsg.includes('argument of type') || lowerMsg.includes('expected') && lowerMsg.includes('arguments')) {
    return 'ARGUMENT_TYPE_ERROR';
  }
  if (code === 2355 || code === 2366 || lowerMsg.includes('return type') || lowerMsg.includes('must return a value')) {
    return 'RETURN_TYPE_ERROR';
  }
  if (code === 2307 || code === 2305 || code === 2306 || lowerMsg.includes('cannot find module') || lowerMsg.includes('no exported member')) {
    return 'IMPORT/EXPORT_TYPE_ERROR';
  }
  if (code === 2605 || code === 2769 || lowerMsg.includes('jsx') || lowerMsg.includes('react') || lowerMsg.includes('no overload matches this call')) {
    return 'REACT/JSX_TYPE_ERROR';
  }
  if (lowerMsg.includes('generic') || code === 2314 || code === 2315) {
    return 'GENERIC_ERROR';
  }
  if (lowerMsg.includes('union') || lowerMsg.includes('intersection')) {
    return 'UNION/NARROWING_ERROR';
  }
  if (lowerMsg.includes('interface') || lowerMsg.includes('contract')) {
    return 'INTERFACE_CONTRACT_ERROR';
  }
  if (lowerMsg.includes('drizzle') || lowerMsg.includes('pg') || lowerMsg.includes('schema') || lowerMsg.includes('column')) {
    return 'ORM_TYPE_ERROR';
  }
  return 'TYPE_MISMATCH';
}

console.log('--- STARTING CATEGORY 2: TYPE SYSTEM BASELINE AUDIT ---');
const t0 = performance.now();

const projectAudits = [];
const allDiagnostics = [];
let totalSourceFiles = 0;

for (const proj of PROJECTS) {
  const fullTsconfigPath = path.resolve(ROOT_DIR, proj.tsconfig);
  const projDir = path.resolve(ROOT_DIR, proj.dir);

  console.log(`Auditing TypeScript project: [${proj.name}] ...`);

  const configFile = ts.readConfigFile(fullTsconfigPath, ts.sys.readFile);
  if (configFile.error) {
    const errorText = ts.flattenDiagnosticMessageText(configFile.error.messageText, '\n');
    allDiagnostics.push({
      project: proj.name,
      file: proj.tsconfig,
      line: 1,
      column: 1,
      code: `TS${configFile.error.code}`,
      category: 'CONFIG_TYPE_ERROR',
      diagnostic: errorText,
      compilerConfig: proj.tsconfig
    });
    continue;
  }

  const parsedConfig = ts.parseJsonConfigFileContent(
    configFile.config,
    ts.sys,
    path.dirname(fullTsconfigPath)
  );

  const fileCount = parsedConfig.fileNames.length;
  totalSourceFiles += fileCount;

  // Create program with project settings
  const program = ts.createProgram({
    rootNames: parsedConfig.fileNames,
    options: parsedConfig.options
  });

  const diagnostics = ts.getPreEmitDiagnostics(program);
  const projDiagList = [];

  for (const diag of diagnostics) {
    if (!diag.file) continue;
    const relFile = path.relative(ROOT_DIR, diag.file.fileName).replace(/\\/g, '/');

    // Only collect diagnostics belonging to project or monorepo source files (exclude external node_modules)
    if (relFile.includes('node_modules')) continue;

    const { line, character } = diag.file.getLineAndCharacterOfPosition(diag.start);
    const msg = ts.flattenDiagnosticMessageText(diag.messageText, '\n');
    const category = classifyDiagnostic(diag, msg);

    const record = {
      project: proj.name,
      package: proj.name,
      file: relFile,
      line: line + 1,
      column: character + 1,
      code: `TS${diag.code}`,
      category,
      diagnostic: msg,
      compilerConfig: proj.tsconfig
    };

    projDiagList.push(record);
    allDiagnostics.push(record);
  }

  projectAudits.push({
    project: proj.name,
    filesCount: fileCount,
    diagnosticsCount: projDiagList.length,
    diagnostics: projDiagList,
    strictOptions: {
      strict: parsedConfig.options.strict,
      noImplicitAny: parsedConfig.options.noImplicitAny,
      strictNullChecks: parsedConfig.options.strictNullChecks,
      strictFunctionTypes: parsedConfig.options.strictFunctionTypes,
      noImplicitReturns: parsedConfig.options.noImplicitReturns
    }
  });

  console.log(`  -> Files: ${fileCount} | Type Diagnostics: ${projDiagList.length}`);
}

const t1 = performance.now();
const durationSec = ((t1 - t0) / 1000).toFixed(2);

console.log(`\nAudit completed in ${durationSec}s.`);
console.log(`Total Projects Audited: ${PROJECTS.length}`);
console.log(`Total Source Files Included in Program Graphs: ${totalSourceFiles}`);
console.log(`Total Type Diagnostics: ${allDiagnostics.length}`);

// Output baseline results
if (!fs.existsSync('audit-results')) {
  fs.mkdirSync('audit-results', { recursive: true });
}

const baselineJson = {
  timestamp: new Date().toISOString(),
  durationSeconds: parseFloat(durationSec),
  totalProjects: PROJECTS.length,
  totalSourceFiles,
  totalDiagnostics: allDiagnostics.length,
  projectSummary: projectAudits.map(p => ({
    project: p.project,
    filesCount: p.filesCount,
    diagnosticsCount: p.diagnosticsCount,
    strictOptions: p.strictOptions
  })),
  diagnostics: allDiagnostics
};

fs.writeFileSync('audit-results/category-2-types-baseline.json', JSON.stringify(baselineJson, null, 2), 'utf8');

const mdReport = `# Category 2: Type System Baseline Audit Report

**Timestamp**: ${baselineJson.timestamp}  
**Execution Duration**: ${durationSec}s  
**TypeScript Projects Audited**: ${PROJECTS.length}  
**Total Source Files Analyzed**: ${totalSourceFiles}  
**Total Genuine Type Diagnostics**: ${allDiagnostics.length}  

## Project Summary

| Project / Workspace | Files In Graph | Type Errors | Strictness Mode |
| :--- | :---: | :---: | :---: |
${projectAudits.map(p => `| \`${p.project}\` | ${p.filesCount} | **${p.diagnosticsCount}** | \`strict: ${p.strictOptions.strict ?? 'inherited'}\` |`).join('\n')}

## Diagnostic Findings: ${allDiagnostics.length}

${allDiagnostics.length === 0 ? '### Result: ZERO TYPE ERRORS DETECTED across all projects.\n' : allDiagnostics.map(d => `- **[${d.category}]** \`${d.file}:${d.line}:${d.column}\` (${d.code}): ${d.diagnostic}`).join('\n')}
`;

fs.writeFileSync('audit-results/category-2-types-baseline.md', mdReport, 'utf8');

console.log('Baseline report generated at:');
console.log(' - audit-results/category-2-types-baseline.json');
console.log(' - audit-results/category-2-types-baseline.md');

if (allDiagnostics.length > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
