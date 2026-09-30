import fs from 'node:fs';

const data = JSON.parse(fs.readFileSync('D:/DOC SEARCH/data/backups/backup-2026-09-29T06-52-00-145Z.json', 'utf8'));

for (const [tName, rows] of Object.entries(data.tables)) {
  if (JSON.stringify(rows).includes('0e549ed3-133a-3825-7f0f-09512727e3f3')) {
    console.log('TABLE NAME:', tName);
    const row = rows.find(r => JSON.stringify(r).includes('0e549ed3-133a-3825-7f0f-09512727e3f3'));
    console.log('ROW:', row);
  }
}
