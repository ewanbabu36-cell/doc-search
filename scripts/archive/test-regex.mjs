import fs from 'node:fs';

const p = 'apps/partner-platform/src/services/abdm-fhir-service.ts';
let code = fs.readFileSync(p, 'utf8');
const match = code.match(/import\s*\{[^}]*\}\s*from\s*['"]\.\/mock-[^'"]+['"];?/);
console.log('MATCHED IMPORT:');
console.log(match ? match[0] : 'NO MATCH');
