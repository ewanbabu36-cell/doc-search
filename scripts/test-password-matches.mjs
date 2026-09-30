import { verifyPasswordAsync } from '../packages/auth/dist/password-service.js';
import { ensureDatabaseReady, getDatabasePool } from '../packages/database/dist/client.js';

process.env.DATABASE_URL = 'postgresql://postgres:password@127.0.0.1:5432/docsearch';
process.env.ALLOW_EMBEDDED_POSTGRES = 'false';

async function checkPasswords() {
  await ensureDatabaseReady();
  const pool = getDatabasePool();

  const creds = await pool.query(
    "SELECT password_hash FROM core.user_credentials WHERE user_id = (SELECT id FROM core.users WHERE email = 'labtech@metropolis.com')"
  );

  const hash = creds.rows[0]?.password_hash;
  console.log('Current hash in DB:', hash);

  const candidates = [
    'DocSearch@8888!',
    'DocSearch@9999!',
    'PartnerPass123!',
    'LabtechPass123!',
    'MetropolisPass123!',
    'Password123!',
    '123456',
    'DocSearch@123!',
    'DocSearch@2026!'
  ];

  for (const c of candidates) {
    const ok = await verifyPasswordAsync(c, hash);
    if (ok) {
      console.log('MATCH FOUND:', c);
    }
  }

  await pool.end();
}

checkPasswords().catch(console.error);
