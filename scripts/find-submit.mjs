import fs from 'fs';

const content = fs.readFileSync('apps/api-gateway/src/services/security/IdentitySecurityFoundationService.ts', 'utf8');
const lines = content.split('\n');
lines.forEach((l, i) => {
  if (l.includes('submitMakerCheckerRequest') || l.includes('decideMakerCheckerRequest')) {
    console.log(`${i+1}: ${l}`);
  }
});
