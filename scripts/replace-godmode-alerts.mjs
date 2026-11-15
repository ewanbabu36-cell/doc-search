import fs from 'fs';

const filePath = 'apps/company-platform/src/components/executive/GodModeSuperAdminStudioView.tsx';
let content = fs.readFileSync(filePath, 'utf8');

content = content.replace(/\balert\s*\(/g, 'setStudioNotice(');

fs.writeFileSync(filePath, content, 'utf8');
console.log('Replaced all alert() calls in GodModeSuperAdminStudioView.tsx with setStudioNotice()');
