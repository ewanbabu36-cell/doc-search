import fs from 'fs';

const endpoints = JSON.parse(fs.readFileSync('scripts/audit-endpoints.json', 'utf8'));
const mocks = endpoints.filter(e => e.hasMock);
console.log('Mocks count:', mocks.length);
mocks.forEach(m => console.log(`${m.method} ${m.endpointPath} -> ${m.file}:${m.line}`));
