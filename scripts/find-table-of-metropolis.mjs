import fs from 'node:fs';

const data = JSON.parse(fs.readFileSync('D:/DOC SEARCH/data/backups/backup-2026-09-29T06-52-00-145Z.json', 'utf8'));

if (Array.isArray(data)) {
  for (const item of data) {
    if (JSON.stringify(item).includes('0e549ed3-133a-3825-7f0f-09512727e3f3')) {
      console.log('Item found. Table or structure:', item.tableName || Object.keys(item));
    }
  }
} else if (typeof data === 'object') {
  for (const [key, val] of Object.entries(data)) {
    if (JSON.stringify(val).includes('0e549ed3-133a-3825-7f0f-09512727e3f3')) {
      console.log('Found in key:', key);
      if (Array.isArray(val)) {
        const item = val.find(v => JSON.stringify(v).includes('0e549ed3-133a-3825-7f0f-09512727e3f3'));
        console.log('Item:', item);
      }
    }
  }
}
