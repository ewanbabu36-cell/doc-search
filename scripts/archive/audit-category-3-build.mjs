import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const ROOT_DIR = process.cwd();

// Topological build order respecting internal dependencies:
// 1. packages/api-contracts
// 2. packages/shared-core
// 3. packages/auth
// 4. packages/database
// 5. packages/ui-kit
// 6. apps/api-gateway
// 7. apps/company-platform
// 8. apps/landing-page
// 9. apps/partner-platform

const BUILD_TARGETS = [
  {
    name: '@docsearch/api-contracts',
    dir: 'packages/api-contracts',
    command: 'tsc',
    expectedArtifacts: ['dist/index.js', 'dist/index.d.ts'],
    isFrontend: false
  },
  {
    name: '@docsearch/shared-core',
    dir: 'packages/shared-core',
    command: 'tsc',
    expectedArtifacts: ['dist/index.js', 'dist/server.js', 'dist/index.d.ts', 'dist/server.d.ts'],
    isFrontend: false
  },
  {
    name: '@docsearch/auth',
    dir: 'packages/auth',
    command: 'tsc',
    expectedArtifacts: ['dist/index.js', 'dist/index.d.ts'],
    isFrontend: false
  },
  {
    name: '@docsearch/database',
    dir: 'packages/database',
    command: 'tsc',
    expectedArtifacts: ['dist/index.js', 'dist/index.d.ts'],
    isFrontend: false
  },
  {
    name: '@docsearch/ui-kit',
    dir: 'packages/ui-kit',
    command: 'tsc',
    expectedArtifacts: ['dist/index.js', 'dist/index.d.ts'],
    isFrontend: false
  },
  {
    name: '@docsearch/api-gateway',
    dir: 'apps/api-gateway',
    command: 'tsc',
    expectedArtifacts: ['dist/server.js'],
    isFrontend: false
  },
  {
    name: '@docsearch/company-platform',
    dir: 'apps/company-platform',
    command: 'tsc && vite build',
    expectedArtifacts: ['dist/bundle/index.html'],
    isFrontend: true
  },
  {
    name: '@docsearch/landing-page',
    dir: 'apps/landing-page',
    command: 'tsc && vite build',
    expectedArtifacts: ['dist/bundle/index.html'],
    isFrontend: true
  },
  {
    name: '@docsearch/partner-platform',
    dir: 'apps/partner-platform',
    command: 'tsc && vite build',
    expectedArtifacts: ['dist/bundle/index.html'],
    isFrontend: true
  }
];

function classifyBuildError(stderr, stdout) {
  const combined = (stderr + '\n' + stdout).toLowerCase();
  if (combined.includes('cannot find module') || combined.includes('failed to resolve')) return 'MODULE_RESOLUTION_ERROR';
  if (combined.includes('vite') && combined.includes('bundle')) return 'BUNDLE_ERROR';
  if (combined.includes('tsc') || combined.includes('ts2')) return 'COMPILE_ERROR';
  if (combined.includes('package.json') || combined.includes('export')) return 'PACKAGE_EXPORT_ERROR';
  if (combined.includes('dependency') || combined.includes('workspace')) return 'WORKSPACE_DEPENDENCY_ERROR';
  if (combined.includes('vite.config') || combined.includes('tsconfig')) return 'CONFIGURATION_ERROR';
  return 'BUILD_ERROR';
}

console.log('--- STARTING CATEGORY 3: REPOSITORY-WIDE BUILD AUDIT ---');
const auditStart = performance.now();

const results = [];
let totalFailures = 0;

for (const target of BUILD_TARGETS) {
  const targetDir = path.resolve(ROOT_DIR, target.dir);
  console.log(`\nBuilding target [${target.name}] in ${target.dir} ...`);
  const t0 = performance.now();

  let status = 'PASS';
  let exitCode = 0;
  let stdout = '';
  let stderr = '';
  let errorCategory = null;
  const missingArtifacts = [];

  try {
    const pnpmCmd = process.platform === 'win32' ? '.\\pnpm.cmd' : 'pnpm';
    // Run the package's build command through pnpm filter
    stdout = execSync(`${pnpmCmd} --filter ${target.name} run build`, {
      cwd: ROOT_DIR,
      encoding: 'utf8',
      stdio: 'pipe'
    });
  } catch (err) {
    status = 'FAIL';
    exitCode = err.status || 1;
    stdout = err.stdout ? err.stdout.toString() : '';
    stderr = err.stderr ? err.stderr.toString() : err.message;
    errorCategory = classifyBuildError(stderr, stdout);
    totalFailures++;
  }

  const durationSec = ((performance.now() - t0) / 1000).toFixed(2);

  // Validate expected artifacts
  if (status === 'PASS') {
    for (const art of target.expectedArtifacts) {
      const artPath = path.resolve(targetDir, art);
      if (!fs.existsSync(artPath)) {
        missingArtifacts.push(art);
      } else {
        const stat = fs.statSync(artPath);
        if (stat.size === 0) {
          missingArtifacts.push(`${art} (ZERO_BYTES)`);
        }
      }
    }
    if (missingArtifacts.length > 0) {
      status = 'FAIL_ARTIFACT';
      totalFailures++;
    }
  }

  console.log(`  -> Status: ${status} | Exit: ${exitCode} | Duration: ${durationSec}s`);
  if (missingArtifacts.length > 0) {
    console.log(`  -> Missing / Invalid Artifacts:`, missingArtifacts);
  }

  results.push({
    workspace: target.name,
    directory: target.dir,
    command: target.command,
    status,
    exitCode,
    durationSeconds: parseFloat(durationSec),
    errorCategory,
    missingArtifacts,
    stdoutPreview: stdout.slice(0, 500),
    stderrPreview: stderr.slice(0, 500)
  });
}

const auditDuration = ((performance.now() - auditStart) / 1000).toFixed(2);
console.log(`\nBuild audit finished in ${auditDuration}s.`);
console.log(`Total Targets: ${BUILD_TARGETS.length} | Total Failures: ${totalFailures}`);

if (!fs.existsSync('audit-results')) {
  fs.mkdirSync('audit-results', { recursive: true });
}

const baselineJson = {
  timestamp: new Date().toISOString(),
  durationSeconds: parseFloat(auditDuration),
  totalTargets: BUILD_TARGETS.length,
  totalFailures,
  results
};

fs.writeFileSync('audit-results/category-3-build-baseline.json', JSON.stringify(baselineJson, null, 2), 'utf8');

const mdReport = `# Category 3: Build & Compilation Baseline Audit Report

**Timestamp**: ${baselineJson.timestamp}  
**Execution Duration**: ${auditDuration}s  
**Buildable Workspaces Audited**: ${BUILD_TARGETS.length}  
**Total Build Failures**: ${totalFailures}  

## Build Target Matrix

| Workspace / Package | Directory | Command | Result | Exit Code | Duration | Missing Artifacts |
| :--- | :--- | :--- | :---: | :---: | :---: | :--- |
${results.map(r => `| \`${r.workspace}\` | \`${r.directory}\` | \`${r.command}\` | **${r.status}** | ${r.exitCode} | ${r.durationSeconds}s | ${r.missingArtifacts.length === 0 ? 'None' : r.missingArtifacts.join(', ')} |`).join('\n')}

## Conclusion
${totalFailures === 0 ? '### Result: ZERO BUILD FAILURES DETECTED across all workspaces. All expected production artifacts exist.\n' : '### Result: BUILD FAILURES ENCOUNTERED. Remediation required.\n'}
`;

fs.writeFileSync('audit-results/category-3-build-baseline.md', mdReport, 'utf8');

console.log('Results written to:');
console.log(' - audit-results/category-3-build-baseline.json');
console.log(' - audit-results/category-3-build-baseline.md');

if (totalFailures > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
