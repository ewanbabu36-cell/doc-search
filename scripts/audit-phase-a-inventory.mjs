import fs from 'fs';
import path from 'path';

const rootDir = process.cwd();

// Phase A Inventory Container
const inventory = {
  gitCommit: '04b659d86cf6704f0a2636542570877bbef97a28',
  timestamp: new Date().toISOString(),
  packages: [],
  fileCounts: {},
  totalFiles: 0,
  totalLines: 0,
  apiRoutes: [],
  uiComponents: {
    totalInteractiveElements: 0,
    byCategory: {
      buttons: 0,
      inputs: 0,
      modals: 0,
      selects: 0,
      tabs: 0,
      forms: 0
    },
    byApp: {}
  },
  mockInventory: [],
  dependencyGraph: {}
};

// 1. Monorepo packages inventory
const packageDirs = ['apps', 'packages'];
for (const dir of packageDirs) {
  const subDirs = fs.readdirSync(path.join(rootDir, dir));
  for (const sub of subDirs) {
    const pkgJsonPath = path.join(rootDir, dir, sub, 'package.json');
    if (fs.existsSync(pkgJsonPath)) {
      try {
        const pkg = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf8'));
        inventory.packages.push({
          name: pkg.name,
          dir: `${dir}/${sub}`,
          version: pkg.version,
          private: pkg.private,
          dependencies: Object.keys(pkg.dependencies || {}),
          devDependencies: Object.keys(pkg.devDependencies || {})
        });
        inventory.dependencyGraph[pkg.name] = {
          dependencies: pkg.dependencies || {},
          devDependencies: pkg.devDependencies || {}
        };
      } catch (e) {
        console.error(`Error reading ${pkgJsonPath}:`, e.message);
      }
    }
  }
}

// 2. Comprehensive File Census
function walkDir(dir, filter = () => true) {
  let files = [];
  if (!fs.existsSync(dir)) return files;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== 'node_modules' && entry.name !== 'dist' && entry.name !== '.git' && entry.name !== '.gemini') {
        files = files.concat(walkDir(full, filter));
      }
    } else if (entry.isFile()) {
      if (filter(full)) {
        files.push(full);
      }
    }
  }
  return files;
}

const allSourceFiles = walkDir(rootDir, (f) => {
  const ext = path.extname(f);
  return ['.ts', '.tsx', '.js', '.jsx', '.json', '.sql', '.yaml', '.yml', '.md'].includes(ext);
});

inventory.totalFiles = allSourceFiles.length;
for (const file of allSourceFiles) {
  const ext = path.extname(file) || 'no-ext';
  inventory.fileCounts[ext] = (inventory.fileCounts[ext] || 0) + 1;
  try {
    const lines = fs.readFileSync(file, 'utf8').split('\n').length;
    inventory.totalLines += lines;
  } catch {}
}

// 3. API Routes Inventory (apps/api-gateway/src/routes)
const routesDir = path.join(rootDir, 'apps/api-gateway/src/routes');
const routeFiles = walkDir(routesDir, (f) => f.endsWith('.ts') && !f.endsWith('.d.ts'));

for (const rf of routeFiles) {
  const content = fs.readFileSync(rf, 'utf8');
  const relPath = path.relative(rootDir, rf).replace(/\\/g, '/');

  // Regex to extract fastify routes: fastify.get/post/put/delete/patch('/path', ...)
  const routeRegex = /fastify\.(get|post|put|delete|patch)\s*(?:<[^>]+>)?\s*\(\s*['"`]([^'"`]+)['"`]([\s\S]*?)(?:async|\(request)/g;
  let match;
  while ((match = routeRegex.exec(content)) !== null) {
    const method = match[1].toUpperCase();
    const routePath = match[2];
    const configBlock = match[3] || '';

    const hasAuth = configBlock.includes('authenticate') || configBlock.includes('requireRoles');
    const hasValidation = configBlock.includes('schema') || configBlock.includes('Schema');

    inventory.apiRoutes.push({
      file: relPath,
      method,
      path: routePath,
      hasAuth,
      hasValidation
    });
  }
}

// 4. UI Interactive Elements Census
const frontendApps = ['apps/partner-platform/src', 'apps/company-platform/src', 'apps/patient-app/src', 'apps/landing-page/src'];
for (const appDir of frontendApps) {
  const appKey = appDir.split('/')[1];
  inventory.uiComponents.byApp[appKey] = {
    buttons: 0,
    inputs: 0,
    modals: 0,
    selects: 0,
    tabs: 0,
    forms: 0,
    filesCount: 0
  };

  const appFiles = walkDir(path.join(rootDir, appDir), (f) => f.endsWith('.tsx') || f.endsWith('.jsx'));
  inventory.uiComponents.byApp[appKey].filesCount = appFiles.length;

  for (const f of appFiles) {
    const text = fs.readFileSync(f, 'utf8');

    // Count Button components and <button>
    const buttons = (text.match(/<Button\b|<button\b|onClick\s*=/g) || []).length;
    // Count Inputs
    const inputs = (text.match(/<Input\b|<input\b|onChange\s*=/g) || []).length;
    // Count Selects
    const selects = (text.match(/<Select\b|<select\b/g) || []).length;
    // Count Modals / Dialogs
    const modals = (text.match(/<[A-Za-z0-9]*Modal\b|<[A-Za-z0-9]*Dialog\b|isOpen\s*=/g) || []).length;
    // Count Tabs
    const tabs = (text.match(/<Tab\b|activeTab\b/g) || []).length;
    // Count Forms
    const forms = (text.match(/<form\b|onSubmit\s*=/g) || []).length;

    inventory.uiComponents.byApp[appKey].buttons += buttons;
    inventory.uiComponents.byApp[appKey].inputs += inputs;
    inventory.uiComponents.byApp[appKey].selects += selects;
    inventory.uiComponents.byApp[appKey].modals += modals;
    inventory.uiComponents.byApp[appKey].tabs += tabs;
    inventory.uiComponents.byApp[appKey].forms += forms;

    inventory.uiComponents.byCategory.buttons += buttons;
    inventory.uiComponents.byCategory.inputs += inputs;
    inventory.uiComponents.byCategory.selects += selects;
    inventory.uiComponents.byCategory.modals += modals;
    inventory.uiComponents.byCategory.tabs += tabs;
    inventory.uiComponents.byCategory.forms += forms;
    inventory.uiComponents.totalInteractiveElements += (buttons + inputs + selects + modals + tabs + forms);
  }
}

// 5. Mock / Placeholder / Hardcoded / Fallback Inventory
const mockKeywords = [
  'MOCK_',
  'mockData',
  'demoFallback',
  'TODO',
  'FIXME',
  'PLACEHOLDER',
  'isMockFallbackAllowed'
];

for (const f of allSourceFiles) {
  if (f.includes('test') || f.includes('.spec.') || f.endsWith('.md')) continue;
  const relPath = path.relative(rootDir, f).replace(/\\/g, '/');
  try {
    const lines = fs.readFileSync(f, 'utf8').split('\n');
    lines.forEach((line, idx) => {
      for (const kw of mockKeywords) {
        if (line.includes(kw) && !line.includes('eslint') && !line.includes('// no-mock')) {
          inventory.mockInventory.push({
            file: relPath,
            line: idx + 1,
            keyword: kw,
            snippet: line.trim().slice(0, 100)
          });
          break;
        }
      }
    });
  } catch {}
}

fs.writeFileSync(path.join(rootDir, 'scripts/phase-a-inventory-output.json'), JSON.stringify(inventory, null, 2), 'utf8');

console.log('=== PHASE A INVENTORY SUMMARY ===');
console.log(`Git Commit: ${inventory.gitCommit}`);
console.log(`Packages Count: ${inventory.packages.length}`);
console.log(`Total Source Files: ${inventory.totalFiles}`);
console.log(`Total Source Lines: ${inventory.totalLines}`);
console.log(`API Routes Identified: ${inventory.apiRoutes.length}`);
console.log(`Total Interactive UI Elements Detected: ${inventory.uiComponents.totalInteractiveElements}`);
console.log(`Mock / Placeholder Flagged Occurrences: ${inventory.mockInventory.length}`);
console.log(`File breakdown:`, inventory.fileCounts);
console.log(`UI Elements by category:`, inventory.uiComponents.byCategory);
console.log(`UI Elements by app:`, inventory.uiComponents.byApp);
