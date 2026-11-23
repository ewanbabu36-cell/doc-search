import { execSync } from 'node:child_process';
import path from 'node:path';

const zipFile = process.argv[2] || 'DOC_SEARCH_COMPLETE_PROJECT.zip';
const out = execSync(`tar.exe -tf "${zipFile}"`, { encoding: 'utf8' });
const lines = out.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
const envs = lines.filter(l => path.basename(l).startsWith('.env'));
const rawDbs = lines.filter(l => l.includes('db-native') || l.includes('pacs-storage') || l.includes('wal_archive'));
const apps = lines.filter(l => l.startsWith('apps/'));
const packages = lines.filter(l => l.startsWith('packages/'));
const tests = lines.filter(l => l.startsWith('tests/'));
const docs = lines.filter(l => l.startsWith('docs/'));
const evidence = lines.filter(l => l.startsWith('data/'));

console.log(`=== VERIFICATION REPORT: ${zipFile} ===`);
console.log('Total files in ZIP:     ', lines.length);
console.log('Environment files:      ', envs);
console.log('Raw DB / PACS / WAL:    ', rawDbs.length);
console.log('Apps files count:       ', apps.length);
console.log('Packages files count:   ', packages.length);
console.log('Tests files count:      ', tests.length);
console.log('Docs files count:       ', docs.length);
console.log('Data evidence files:    ', evidence.length);
