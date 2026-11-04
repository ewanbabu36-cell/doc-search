import fs from 'fs';

const content = fs.readFileSync('apps/api-gateway/src/repositories/partner/ClinicalWorkflowRepository.ts', 'utf8');
const lines = content.split('\n');
lines.forEach((l, i) => {
  if (l.includes('saveConsultation')) {
    console.log(`${i+1}: ${l}`);
  }
});
