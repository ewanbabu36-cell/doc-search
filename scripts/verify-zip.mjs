import { execSync } from 'node:child_process';
import path from 'node:path';

const out = execSync('tar.exe -tf DOC_SEARCH_SANITIZED_SOURCE.zip', { encoding: 'utf8' });
const lines = out.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
const envs = lines.filter(l => path.basename(l).startsWith('.env'));
const rawDbs = lines.filter(l => l.includes('db-native') || l.includes('pacs-storage') || l.includes('wal_archive'));

console.log('Total files in ZIP:', lines.length);
console.log('Env files in ZIP:', envs);
console.log('Raw DB files in ZIP:', rawDbs.length);
