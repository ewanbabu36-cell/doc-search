import fs from 'fs';
import path from 'path';

const vaultDir = 'backups/encrypted_vault';
const files = fs.readdirSync(vaultDir).filter(f => f.endsWith('.enc.json'));

files.forEach(f => {
  const filePath = path.join(vaultDir, f);
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  console.log(`\nFile: ${f}`);
  console.log('Keys:', Object.keys(data));
  const { payload, data: _d, ciphertext, ...rest } = data;
  console.log('Non-payload keys:', rest);
});
