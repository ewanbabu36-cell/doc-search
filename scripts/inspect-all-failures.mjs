import fs from 'fs';

const data = JSON.parse(fs.readFileSync('D:/DOC SEARCH/audit-results/category-5-ui-baseline.json', 'utf8'));
const failed = data.results.filter(r => r.resultStatus === 'FAIL');

for (const f of failed) {
  console.log('==================================================');
  console.log('SCENARIO:', f.scenarioName);
  console.log('App:', f.app);
  console.log('Route:', f.route);
  console.log('DOM hasWhiteScreen:', f.dom?.hasWhiteScreen);
  console.log('DOM hasCrashBoundary:', f.dom?.hasCrashBoundary);
  console.log('DOM bodyLength:', f.dom?.bodyLength);
  console.log('Console errors:', f.consoleErrors);
  console.log('Exceptions:', f.uncaughtExceptions);
}
