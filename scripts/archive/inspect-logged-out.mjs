import fs from 'fs';

const data = JSON.parse(fs.readFileSync('D:/DOC SEARCH/audit-results/category-5-ui-baseline.json', 'utf8'));
const f = data.results.find(r => r.scenarioName === 'partner_session_logged_out');
console.log('partner_session_logged_out:');
console.log('Console errors:', f.consoleErrors);
console.log('Exceptions:', f.uncaughtExceptions);
