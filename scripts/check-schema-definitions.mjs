import fs from 'fs';

const content = fs.readFileSync('packages/database/src/schema/clinical/index.ts', 'utf8');
const tableMatches = [...content.matchAll(/pgTable\(\s*['"]([a-zA-Z0-9_]+)['"]/g)];
console.log('Tables defined in packages/database/src/schema/clinical/index.ts:', tableMatches.length);
console.log('Sample defined tables:');
tableMatches.slice(0, 30).forEach(m => console.log('  -', m[1]));

const companyContent = fs.readFileSync('packages/database/src/schema/company/index.ts', 'utf8');
const companyMatches = [...companyContent.matchAll(/pgTable\(\s*['"]([a-zA-Z0-9_]+)['"]/g)];
console.log('\nTables defined in packages/database/src/schema/company/index.ts:', companyMatches.length);
