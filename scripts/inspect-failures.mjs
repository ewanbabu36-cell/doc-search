import fs from 'fs';

const data = JSON.parse(fs.readFileSync('D:/DOC SEARCH/audit-results/category-5-ui-baseline.json', 'utf8'));
const failed = data.results.filter(r => r.resultStatus === 'FAIL');
console.log('Failed scenarios count:', failed.length);
failed.forEach(f => {
  console.log('\n=== SCENARIO:', f.scenarioName, '===');
  console.log('Success:', f.success);
  console.log('DOM:', f.dom);
  console.log('Console Errors:', f.consoleErrors);
  console.log('Uncaught Exceptions:', f.uncaughtExceptions);
});
