import fs from 'node:fs';
import path from 'node:path';

const dir = 'D:/DOC SEARCH/apps/partner-platform/src/components/dialogs';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.tsx'));
let uiKitCount = 0;
let rawCount = 0;
const rawFiles = [];

for (const f of files) {
  const content = fs.readFileSync(path.join(dir, f), 'utf8');
  if (content.includes('<Dialog')) {
    uiKitCount++;
  } else {
    rawCount++;
    rawFiles.push(f);
  }
}
console.log('Dialogs using ui-kit <Dialog>:', uiKitCount);
console.log('Dialogs using raw div overlay:', rawCount);
console.log('Sample raw files:', rawFiles.slice(0, 15));
