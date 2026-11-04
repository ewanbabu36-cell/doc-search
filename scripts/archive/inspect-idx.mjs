import fs from 'node:fs';

const text = fs.readFileSync('D:/DOC SEARCH/data/backups/backup-2026-09-29T06-52-00-145Z.json', 'utf8');
const idx = text.toLowerCase().indexOf('metropolis');
console.log('Metropolis found at index:', idx);
if (idx !== -1) {
  console.log(text.slice(Math.max(0, idx - 200), Math.min(text.length, idx + 400)));
}
