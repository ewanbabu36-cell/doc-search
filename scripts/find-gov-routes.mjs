import fs from 'fs';

const content = fs.readFileSync('apps/api-gateway/src/routes/company/partner.routes.ts', 'utf8');
const lines = content.split('\n');
lines.forEach((l, i) => {
  if (l.includes('toggleModule') || l.includes('triggerKillSwitch') || l.includes('updateQuotas') || l.includes('partnerGovernanceService')) {
    console.log(`${i+1}: ${l}`);
  }
});
