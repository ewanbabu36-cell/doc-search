import fs from 'node:fs';

const files = [
  'apps/api-gateway/src/routes/partner/clinical-workflow.routes.ts',
  'apps/api-gateway/src/routes/partner/staff.routes.ts',
  'apps/api-gateway/src/routes/partner/asset-biomedical.routes.ts',
  'apps/api-gateway/src/routes/partner/procurement.routes.ts',
  'apps/api-gateway/src/routes/partner/ai-voice.routes.ts',
  'apps/api-gateway/src/routes/partner/ai-chat.routes.ts',
  'apps/api-gateway/src/routes/partner/patient-360-continuity.routes.ts'
];

files.forEach(f => {
  if (fs.existsSync(f)) {
    const text = fs.readFileSync(f, 'utf8');
    const matches = [...text.matchAll(/fastify\.(get|post|put|delete|patch)\(\s*['"`]([^'"`]+)['"`]/g)].map(m => m[1].toUpperCase() + ' ' + m[2]);
    console.log('\n--- ' + f + ' ---');
    matches.forEach(m => console.log('  ' + m));
  } else {
    console.log('\n--- MISSING FILE: ' + f + ' ---');
  }
});
