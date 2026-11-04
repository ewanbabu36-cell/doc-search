import fs from 'fs';

const files = JSON.parse(fs.readFileSync('scripts/recent-files-3days.json', 'utf8'));
const frontends = files.filter(f => f.path.includes('partner-platform') || f.path.includes('company-platform') || f.path.includes('landing-page'));
console.log(JSON.stringify(frontends, null, 2));
