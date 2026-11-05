import fs from 'fs';

const inventoryPath = 'DOCSEARCH_COMPLETE_BUTTON_INVENTORY.csv';
const content = fs.readFileSync(inventoryPath, 'utf8');

// Parse CSV lines handling quotes
function parseCSV(text) {
  const lines = [];
  let row = [];
  let inQuotes = false;
  let currentField = '';
  
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];
    
    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentField += '"';
        i++; // skip escaped quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      row.push(currentField);
      currentField = '';
    } else if ((char === '\r' || char === '\n') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') i++;
      row.push(currentField);
      currentField = '';
      if (row.some(f => f.trim().length > 0)) {
        lines.push(row);
      }
      row = [];
    } else {
      currentField += char;
    }
  }
  if (currentField || row.length > 0) {
    row.push(currentField);
    lines.push(row);
  }
  return lines;
}

const parsed = parseCSV(content);
const header = parsed[0];
const rows = parsed.slice(1);

console.log('Header:', header);
console.log('Total records:', rows.length);

// Check unique IDs
const idSet = new Set();
const duplicateIds = [];
rows.forEach((r, idx) => {
  const id = r[0];
  if (idSet.has(id)) {
    duplicateIds.push({ id, row: idx + 2 });
  }
  idSet.add(id);
});

console.log('Unique IDs:', idSet.size);
console.log('Duplicate IDs count:', duplicateIds.length);

// Check status breakdown in inventory
const statusCounts = {};
rows.forEach(r => {
  const status = r[5] || 'UNKNOWN'; // status column
  statusCounts[status] = (statusCounts[status] || 0) + 1;
});

console.log('Status breakdown in inventory:', statusCounts);

const auditStatusCounts = {};
rows.forEach(r => {
  const auditStatus = r[13] || 'UNKNOWN';
  auditStatusCounts[auditStatus] = (auditStatusCounts[auditStatus] || 0) + 1;
});
console.log('Audit Status breakdown (Col 13):', auditStatusCounts);

const noHandlerRows = rows.filter(r => r[13] === 'NO_EVENT_HANDLER');
console.log('\n--- ALL 16 NO_EVENT_HANDLER BUTTONS ---');
noHandlerRows.forEach((r, i) => {
  console.log(`${i+1}. ID: ${r[0]} | Label: "${r[4]}" | File: ${r[6]}:${r[7]} | Expected: ${r[8]}`);
});

const partialRows = rows.filter(r => r[13] === 'PARTIALLY_FUNCTIONAL');
console.log('\n--- PARTIALLY_FUNCTIONAL COUNT:', partialRows.length, '---');
partialRows.slice(0, 10).forEach((r, i) => {
  console.log(`${i+1}. ID: ${r[0]} | Label: "${r[4]}" | File: ${r[6]}:${r[7]} | Handler: ${r[9]} | Expected: ${r[8]}`);
});
