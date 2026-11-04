import fs from 'node:fs';

const data = JSON.parse(fs.readFileSync('D:/DOC SEARCH/data/backups/backup-2026-09-29T06-52-00-145Z.json', 'utf8'));

for (const [tableName, rows] of Object.entries(data)) {
  if (Array.isArray(rows)) {
    const matching = rows.filter(r => JSON.stringify(r).toLowerCase().includes('metropolis'));
    if (matching.length > 0) {
      console.log(`Table ${tableName} has ${matching.length} matching rows:`);
      console.log(JSON.stringify(matching, null, 2));
    }
  }
}
