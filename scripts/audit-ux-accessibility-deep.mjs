import fs from 'node:fs';
import path from 'node:path';

const APPS = [
  { name: 'partner-platform', dir: 'D:\\DOC SEARCH\\apps\\partner-platform\\src' },
  { name: 'company-platform', dir: 'D:\\DOC SEARCH\\apps\\company-platform\\src' },
  { name: 'landing-page', dir: 'D:\\DOC SEARCH\\apps\\landing-page\\src' }
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

const findings = [];

function checkFile(file, appName) {
  const content = fs.readFileSync(file, 'utf8');
  const relPath = path.relative('D:\\DOC SEARCH', file).replace(/\\/g, '/');
  const lines = content.split('\n');

  lines.forEach((line, index) => {
    const lineNum = index + 1;

    // 1. Positive tabIndex
    if (/tabIndex\s*=\s*[{"]?[1-9]\d*[}"]?/.test(line)) {
      findings.push({
        id: `A11Y-TABINDEX-${findings.length + 1}`,
        category: 'Keyboard Accessibility',
        severity: 'HIGH',
        file: relPath,
        line: lineNum,
        snippet: line.trim(),
        description: 'Positive tabIndex detected, which disrupts natural DOM focus order.',
        fixRecommendation: 'Use tabIndex={0} or natural DOM order.'
      });
    }

    // 2. Clickable div/span without keyboard handler or role
    if (/<(div|span)[^>]*onClick/i.test(line)) {
      const isRoleButton = /role\s*=\s*["']button["']/i.test(line);
      const hasKeyDown = /onKey(Down|Up|Press)/i.test(line);
      if (!isRoleButton || !hasKeyDown) {
        // Check surrounding 3 lines to see if props are on multiline
        const surrounding = lines.slice(Math.max(0, index - 2), Math.min(lines.length, index + 3)).join(' ');
        if (!/role\s*=\s*["']button["']/i.test(surrounding) || !/onKey(Down|Up|Press)/i.test(surrounding)) {
          findings.push({
            id: `A11Y-CLICKABLE-${findings.length + 1}`,
            category: 'Semantic HTML / Keyboard',
            severity: 'MEDIUM',
            file: relPath,
            line: lineNum,
            snippet: line.trim(),
            description: 'Non-interactive element (<div|span>) has onClick without role="button" or onKeyDown handler.',
            fixRecommendation: 'Convert to <button> or add role="button", tabIndex={0}, and onKeyDown handler.'
          });
        }
      }
    }

    // 3. Fake link (href="#")
    if (/<a[^>]*href=["']#["']/i.test(line)) {
      findings.push({
        id: `A11Y-FAKELINK-${findings.length + 1}`,
        category: 'Buttons and Links',
        severity: 'MEDIUM',
        file: relPath,
        line: lineNum,
        snippet: line.trim(),
        description: 'Anchor tag uses href="#" as an action trigger instead of a button.',
        fixRecommendation: 'Replace <a href="#"> with a semantic <button type="button">.'
      });
    }

    // 4. outline-none without focus ring
    if (/outline-none/i.test(line) && !/focus(-visible)?:(ring|border|outline)/i.test(line)) {
      // Check surrounding lines
      const surrounding = lines.slice(Math.max(0, index - 1), Math.min(lines.length, index + 2)).join(' ');
      if (!/focus(-visible)?:(ring|border|outline)/i.test(surrounding)) {
        findings.push({
          id: `A11Y-FOCUSRING-${findings.length + 1}`,
          category: 'Focus Management',
          severity: 'HIGH',
          file: relPath,
          line: lineNum,
          snippet: line.trim(),
          description: 'Focus outline suppressed (outline-none) without compensatory focus indicator (ring/border).',
          fixRecommendation: 'Add focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none.'
        });
      }
    }

    // 5. Image without alt attribute
    if (/<img\s+[^>]*>/i.test(line) && !/alt\s*=/i.test(line)) {
      const surrounding = lines.slice(Math.max(0, index - 2), Math.min(lines.length, index + 3)).join(' ');
      if (!/alt\s*=/i.test(surrounding)) {
        findings.push({
          id: `A11Y-IMGALT-${findings.length + 1}`,
          category: 'Images / Screen Reader',
          severity: 'HIGH',
          file: relPath,
          line: lineNum,
          snippet: line.trim(),
          description: 'Image <img> element missing required alt attribute.',
          fixRecommendation: 'Provide descriptive alt text or alt="" for decorative images.'
        });
      }
    }

    // 6. Icon-only button missing aria-label or accessible text
    if (/<button[^>]*>\s*<[A-Z][a-zA-Z]*(Icon)?\s*\/?>\s*<\/button>/i.test(line) && !/aria-label|title/i.test(line)) {
      findings.push({
        id: `A11Y-ICONBTN-${findings.length + 1}`,
        category: 'Buttons and Links',
        severity: 'HIGH',
        file: relPath,
        line: lineNum,
        snippet: line.trim(),
        description: 'Icon-only button has no accessible name (missing aria-label, title, or sr-only text).',
        fixRecommendation: 'Add aria-label="..." or <span className="sr-only">Description</span>.'
      });
    }

    // 7. Inputs without label or aria-label
    if (/<input\s+[^>]*>/i.test(line) && !/aria-label|aria-labelledby|placeholder|id\s*=/i.test(line) && !/type=["'](hidden|checkbox|radio)["']/i.test(line)) {
      const surrounding = lines.slice(Math.max(0, index - 2), Math.min(lines.length, index + 3)).join(' ');
      if (!/aria-label|aria-labelledby|id\s*=/i.test(surrounding)) {
        findings.push({
          id: `A11Y-INPUTLABEL-${findings.length + 1}`,
          category: 'Forms and Inputs',
          severity: 'MEDIUM',
          file: relPath,
          line: lineNum,
          snippet: line.trim(),
          description: 'Input control lacks explicit label association, id, or aria-label.',
          fixRecommendation: 'Associate with <label htmlFor={id}> or provide aria-label.'
        });
      }
    }
  });
}

for (const app of APPS) {
  const files = walk(app.dir);
  for (const file of files) {
    checkFile(file, app.name);
  }
}

console.log(`Scan completed across all apps. Total potential issues flagged: ${findings.length}`);

const byCategory = {};
const bySeverity = {};
for (const f of findings) {
  byCategory[f.category] = (byCategory[f.category] || 0) + 1;
  bySeverity[f.severity] = (bySeverity[f.severity] || 0) + 1;
}

console.log('\nBreakdown by Category:');
console.log(byCategory);
console.log('\nBreakdown by Severity:');
console.log(bySeverity);

fs.writeFileSync('D:\\DOC SEARCH\\audit-results\\ux-accessibility\\raw-findings.json', JSON.stringify({
  timestamp: new Date().toISOString(),
  total: findings.length,
  byCategory,
  bySeverity,
  findings
}, null, 2));

console.log('\nWrote detailed JSON to audit-results/ux-accessibility/raw-findings.json');
