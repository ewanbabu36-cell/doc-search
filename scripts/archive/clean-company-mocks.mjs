import fs from 'node:fs';

const p = 'apps/company-platform/src/components/billing/SubscriptionCustomizerModal.tsx';
let txt = fs.readFileSync(p, 'utf8');
txt = txt.replace(/import\s*\{\s*mockPartnerProfiles\s*\}\s*from\s*['"][^'"]+['"];?\r?\n?/, '');
txt = txt.replaceAll('[...mockPartnerProfiles]', '[]');
txt = txt.replaceAll('mockPartnerProfiles', '[]');
fs.writeFileSync(p, txt, 'utf8');
console.log('SubscriptionCustomizerModal.tsx successfully cleaned of mockPartnerProfiles!');
