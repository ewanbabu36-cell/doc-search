import fs from 'fs';
import path from 'path';

function walk(dir) {
  let list = [];
  if (!fs.existsSync(dir)) return list;
  for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, item.name);
    if (item.isDirectory()) {
      if (!['node_modules', 'dist', '.git', 'coverage', '.turbo', '.next', 'build'].includes(item.name)) {
        list = list.concat(walk(full));
      }
    } else if (item.isFile() && (item.name.endsWith('.ts') || item.name.endsWith('.tsx'))) {
      list.push(full);
    }
  }
  return list;
}

const files = walk('apps');
const alertMatches = [];
const confirmMatches = [];

for (const f of files) {
  const content = fs.readFileSync(f, 'utf8');
  const lines = content.split('\n');
  lines.forEach((line, idx) => {
    // Avoid import or component names like <Alert, AlertDescription, or comments
    if (line.match(/(?:window\.)?alert\s*\(/) && !line.includes('//') && !line.includes('<Alert') && !line.includes('AlertDescription') && !line.includes('eslint')) {
      alertMatches.push({ file: f, line: idx + 1, text: line.trim() });
    }
    if (line.match(/(?:window\.)?confirm\s*\(/) && !line.includes('//') && !line.includes('eslint') && !line.includes('confirm:')) {
      confirmMatches.push({ file: f, line: idx + 1, text: line.trim() });
    }
  });
}

console.log(`\n=== ALERT MATCHES IN SOURCE CODE (${alertMatches.length}) ===`);
alertMatches.forEach(m => console.log(`  ${m.file}:${m.line} -> ${m.text}`));

console.log(`\n=== CONFIRM MATCHES IN SOURCE CODE (${confirmMatches.length}) ===`);
confirmMatches.forEach(m => console.log(`  ${m.file}:${m.line} -> ${m.text}`));
