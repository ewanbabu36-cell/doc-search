import fs from 'fs';
const content = fs.readFileSync('apps/company-platform/src/components/crm/PartnerListView.tsx', 'utf8');
const lines = content.split('\n');
lines.forEach((l, idx) => {
  if (l.includes('handleDeletePartner') || l.includes('deletePartner')) {
    console.log(`${idx + 1}: ${l.trim()}`);
  }
});
