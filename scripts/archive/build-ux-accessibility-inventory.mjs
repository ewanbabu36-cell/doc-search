import fs from 'node:fs';
import path from 'node:path';

const APPS = [
  { name: 'partner-platform', path: 'D:\\DOC SEARCH\\apps\\partner-platform\\src' },
  { name: 'company-platform', path: 'D:\\DOC SEARCH\\apps\\company-platform\\src' },
  { name: 'landing-page', path: 'D:\\DOC SEARCH\\apps\\landing-page\\src' }
];

function walk(dir) {
  let results = [];
  if (!fs.existsSync(dir)) return results;
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      results = results.concat(walk(fullPath));
    } else if (file.endsWith('.tsx') || file.endsWith('.jsx')) {
      results.push(fullPath);
    }
  }
  return results;
}

const inventory = {
  routes: [],
  pages: [],
  layouts: [],
  forms: [],
  dialogsModals: [],
  tables: [],
  inputs: [],
  buttonsLinks: [],
  tabs: [],
  menusDropdowns: [],
  notificationsToasts: [],
  loadingStates: [],
  errorStates: [],
  emptyStates: []
};

for (const app of APPS) {
  const files = walk(app.path);
  for (const file of files) {
    const content = fs.readFileSync(file, 'utf8');
    const rel = path.relative('D:\\DOC SEARCH', file).replace(/\\/g, '/');
    const baseName = path.basename(file, path.extname(file));

    // Routes / views
    if (rel.includes('/views/') || rel.includes('/pages/') || rel.includes('DomainManager') || baseName.endsWith('View') || baseName.endsWith('Page')) {
      inventory.pages.push({ app: app.name, file: rel, name: baseName });
    }
    if (rel.includes('/layouts/') || baseName.includes('Layout') || baseName.includes('Shell')) {
      inventory.layouts.push({ app: app.name, file: rel, name: baseName });
    }

    // Forms
    if (/<form/i.test(content) || /useForm/i.test(content) || /Formik/i.test(content) || /handleSubmit/i.test(content)) {
      inventory.forms.push({ app: app.name, file: rel, name: baseName });
    }

    // Dialogs / Modals / Drawers
    if (/Dialog/i.test(content) || /Modal/i.test(content) || /Drawer/i.test(content) || /role=["']dialog["']/i.test(content)) {
      inventory.dialogsModals.push({ app: app.name, file: rel, name: baseName });
    }

    // Tables
    if (/<table/i.test(content) || /<Table/i.test(content) || /DataGrid/i.test(content) || /role=["']table["']/i.test(content)) {
      inventory.tables.push({ app: app.name, file: rel, name: baseName });
    }

    // Inputs
    if (/<input/i.test(content) || /<textarea/i.test(content) || /<select/i.test(content) || /DatePicker/i.test(content) || /Combobox/i.test(content)) {
      inventory.inputs.push({ app: app.name, file: rel, name: baseName });
    }

    // Tabs
    if (/Tabs/i.test(content) || /role=["']tab["']/i.test(content) || /tablist/i.test(content)) {
      inventory.tabs.push({ app: app.name, file: rel, name: baseName });
    }

    // Menus / Dropdowns
    if (/Dropdown/i.test(content) || /Menu/i.test(content) || /Popover/i.test(content) || /role=["']menu["']/i.test(content)) {
      inventory.menusDropdowns.push({ app: app.name, file: rel, name: baseName });
    }

    // Toast / Alerts / Notifications
    if (/toast\(/i.test(content) || /Notification/i.test(content) || /Alert/i.test(content) || /role=["']alert["']/i.test(content)) {
      inventory.notificationsToasts.push({ app: app.name, file: rel, name: baseName });
    }

    // Loading states
    if (/isLoading/i.test(content) || /loading/i.test(content) || /Spinner/i.test(content) || /Skeleton/i.test(content)) {
      inventory.loadingStates.push({ app: app.name, file: rel, name: baseName });
    }

    // Error states
    if (/isError/i.test(content) || /error/i.test(content) || /ErrorBoundary/i.test(content) || /errorMessage/i.test(content)) {
      inventory.errorStates.push({ app: app.name, file: rel, name: baseName });
    }

    // Empty states
    if (/EmptyState/i.test(content) || /No data/i.test(content) || /No records/i.test(content) || /Not found/i.test(content) || /empty/i.test(content)) {
      inventory.emptyStates.push({ app: app.name, file: rel, name: baseName });
    }
  }
}

// Generate Markdown output
let md = `# DOC SEARCH — UX & ACCESSIBILITY INVENTORY\n\n`;
md += `Generated on: ${new Date().toISOString()}\n\n`;
md += `## Summary Statistics\n`;
md += `- **Pages & Views**: ${inventory.pages.length}\n`;
md += `- **Shells & Layouts**: ${inventory.layouts.length}\n`;
md += `- **Forms & Input Containers**: ${inventory.forms.length}\n`;
md += `- **Dialogs, Modals & Drawers**: ${inventory.dialogsModals.length}\n`;
md += `- **Tables & Data Grids**: ${inventory.tables.length}\n`;
md += `- **Interactive Input Components**: ${inventory.inputs.length}\n`;
md += `- **Tabs & Segmented Controls**: ${inventory.tabs.length}\n`;
md += `- **Menus & Dropdowns**: ${inventory.menusDropdowns.length}\n`;
md += `- **Notifications & Alerts**: ${inventory.notificationsToasts.length}\n`;
md += `- **Loading Indicators**: ${inventory.loadingStates.length}\n`;
md += `- **Error Handling Components**: ${inventory.errorStates.length}\n`;
md += `- **Empty State Handlers**: ${inventory.emptyStates.length}\n\n`;

function formatList(title, items) {
  let out = `## ${title} (${items.length})\n\n`;
  out += `| App | Component / File | Purpose |\n`;
  out += `| :--- | :--- | :--- |\n`;
  for (const it of items) {
    out += `| \`${it.app}\` | [\`${it.name}\`](file:///${it.file}) | ${title} Component |\n`;
  }
  out += `\n`;
  return out;
}

md += formatList('Pages and Domain Views', inventory.pages);
md += formatList('Shells and Layouts', inventory.layouts);
md += formatList('Forms', inventory.forms);
md += formatList('Dialogs, Modals, and Drawers', inventory.dialogsModals);
md += formatList('Tables and Grids', inventory.tables);
md += formatList('Tabs', inventory.tabs);
md += formatList('Dropdowns and Menus', inventory.menusDropdowns);
md += formatList('Feedback and Alerts', inventory.notificationsToasts);
md += formatList('Empty States', inventory.emptyStates);

fs.writeFileSync('D:\\DOC SEARCH\\audit-results\\ux-accessibility\\inventory.md', md, 'utf8');
console.log('Successfully created inventory.md');
console.log(`Pages: ${inventory.pages.length}, Forms: ${inventory.forms.length}, Modals: ${inventory.dialogsModals.length}, Tables: ${inventory.tables.length}`);
