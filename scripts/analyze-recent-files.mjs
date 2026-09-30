import fs from 'fs';

const files = JSON.parse(fs.readFileSync('scripts/recent-files-3days.json', 'utf8'));

const groups = {};
for (const f of files) {
  let category = 'other';
  if (f.path.includes('/routes/')) category = 'backend-routes';
  else if (f.path.includes('/services/')) category = 'backend-services';
  else if (f.path.includes('/repositories/')) category = 'backend-repositories';
  else if (f.path.includes('/schema/')) category = 'db-schema';
  else if (f.path.includes('/plugins/')) category = 'backend-plugins';
  else if (f.path.includes('/test/') || f.path.includes('.test.')) category = 'tests';
  else if (f.path.includes('partner-platform')) category = 'frontend-partner';
  else if (f.path.includes('company-platform')) category = 'frontend-company';
  else if (f.path.includes('landing-page')) category = 'frontend-landing';
  else if (f.path.includes('shared-core')) category = 'shared-core';
  else if (f.path.includes('ui-kit')) category = 'ui-kit';
  
  if (!groups[category]) groups[category] = [];
  groups[category].push(f);
}

for (const [k, v] of Object.entries(groups)) {
  console.log(`${k}: ${v.length} files`);
}
