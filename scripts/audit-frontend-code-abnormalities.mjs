import fs from 'fs';
import path from 'path';

function findInDir(dir, pattern, ext) {
  const results = [];
  function search(current) {
    if (!fs.existsSync(current)) return;
    const list = fs.readdirSync(current);
    for (const item of list) {
      const full = path.join(current, item);
      const stat = fs.statSync(full);
      if (stat.isDirectory()) {
        if (!item.startsWith('.') && item !== 'node_modules' && item !== 'dist' && item !== 'build') {
          search(full);
        }
      } else if (ext.some(e => item.endsWith(e))) {
        const content = fs.readFileSync(full, 'utf8');
        const matches = content.match(pattern);
        if (matches) {
          results.push({ file: full.replace(/\\/g, '/'), count: matches.length });
        }
      }
    }
  }
  search(dir);
  return results;
}

console.log('--- Native alert() in apps/partner-platform ---');
const ppAlerts = findInDir('apps/partner-platform/src', /\balert\(/g, ['.ts', '.tsx']);
console.log(ppAlerts);

console.log('\n--- Native alert() in apps/patient-app ---');
const paAlerts = findInDir('apps/patient-app/src', /\balert\(/g, ['.ts', '.tsx']);
console.log(paAlerts);

console.log('\n--- Native confirm() in apps/partner-platform ---');
const ppConfirms = findInDir('apps/partner-platform/src', /\bconfirm\(/g, ['.ts', '.tsx']);
console.log(ppConfirms);

console.log('\n--- Native prompt() in apps/partner-platform ---');
const ppPrompts = findInDir('apps/partner-platform/src', /\bprompt\(/g, ['.ts', '.tsx']);
console.log(ppPrompts);

console.log('\n--- Simulated / Mock keywords in apps/api-gateway/src/routes ---');
const mockRoutes = findInDir('apps/api-gateway/src/routes', /(simulat|mock|dummy|fake|stub)/gi, ['.ts']);
console.log(`Routes with mock/simulate references: ${mockRoutes.length}`);
console.log(mockRoutes.slice(0, 15));

console.log('\n--- Third Party Integrations Check in API Gateway ---');
// ABDM
const abdmRefs = findInDir('apps/api-gateway/src', /abdm|ndhm/gi, ['.ts']);
console.log(`ABDM references: ${abdmRefs.length}`);
// Payment Gateway
const payRefs = findInDir('apps/api-gateway/src', /razorpay|cashfree|stripe/gi, ['.ts']);
console.log(`Payment Gateway references: ${payRefs.length}`);
// WhatsApp / SMS
const waRefs = findInDir('apps/api-gateway/src', /gupshup|twilio|whatsapp/gi, ['.ts']);
console.log(`WhatsApp/SMS references: ${waRefs.length}`);
