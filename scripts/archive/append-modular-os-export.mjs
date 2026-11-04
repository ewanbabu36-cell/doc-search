import fs from 'fs';

const file = 'apps/partner-platform/src/index.ts';
let content = fs.readFileSync(file, 'utf8').trimEnd();
if (!content.includes('modular-os')) {
  content += "\n\n// Phase 6.0: Liquid Glass Modular OS & Android-Style Feature Vault\nexport * from './components/modular-os/index.js';\n";
  fs.writeFileSync(file, content, 'utf8');
  console.log('✅ Exported modular-os in apps/partner-platform/src/index.ts');
} else {
  console.log('Already exported.');
}
