import fs from 'node:fs';
import path from 'node:path';

function searchInDir(dir, query) {
  if (!fs.existsSync(dir)) return;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== 'node_modules' && entry.name !== '.git' && entry.name !== 'dist') {
        searchInDir(full, query);
      }
    } else if (entry.isFile()) {
      try {
        const content = fs.readFileSync(full, 'utf8');
        if (content.includes(query)) {
          console.log(`FOUND "${query}" IN: ${full}`);
        }
      } catch (e) {}
    }
  }
}

console.log('Searching for "Live Auth Kernel Synchronization"...');
searchInDir('D:/DOC SEARCH/apps', 'Live Auth Kernel Synchronization');
searchInDir('D:/DOC SEARCH/packages', 'Live Auth Kernel Synchronization');

console.log('Searching for "Password Override"...');
searchInDir('D:/DOC SEARCH/apps', 'Password Override');

console.log('Searching for "Failed to update partner credentials"...');
searchInDir('D:/DOC SEARCH/apps', 'Failed to update partner credentials');
