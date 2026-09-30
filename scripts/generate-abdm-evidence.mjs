/**
 * Dynamic ABDM Certification Evidence Generator Script
 * Generates/refreshes docs/audit/abdm/evidence/*.json with live cryptographic hashes.
 */

import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

async function run() {
  console.log('Generating dynamic ABDM certification evidence records...');
  const { abdmCertificationEvidenceEngine } = await import('../apps/api-gateway/dist/services/compliance/AbdmEvidenceEngine.js');
  const targetDir = path.resolve(ROOT_DIR, 'docs/audit/abdm/evidence');
  const writtenFiles = await abdmCertificationEvidenceEngine.exportEvidenceFiles(targetDir);
  console.log(`Successfully generated ${writtenFiles.length} evidence files:`);
  for (const f of writtenFiles) {
    console.log(` - ${path.basename(f)}`);
  }
}

run().catch((err) => {
  console.error('Failed to generate ABDM evidence:', err);
  process.exit(1);
});
