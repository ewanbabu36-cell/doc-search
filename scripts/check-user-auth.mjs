import pg from 'pg';
import { verifyPassword } from '../packages/auth/dist/password-service.js';

const { Pool } = pg;
const pool = new Pool({ connectionString: 'postgresql://postgres:password@127.0.0.1:5432/docsearch' });

async function main() {
  const users = await pool.query('SELECT u.id, u.email, c.password_hash FROM core.users u JOIN core.user_credentials c ON u.id = c.user_id WHERE u.email IN ($1, $2)', ['tohid@doc.in', 'ashraf@doc.in']);
  
  const testPasswords = ['123456', 'password', 'password123', 'Ashraf@123', 'Ashraf123', 'ashraf123', 'DoctorPass123!', 'Doctor@123', 'admin123', 'Doctor@2026!'];

  for (const u of users.rows) {
    console.log(`\nTesting passwords for ${u.email}:`);
    let matched = false;
    for (const p of testPasswords) {
      if (verifyPassword(p, u.password_hash)) {
        console.log(`  MATCH FOUND: "${p}"`);
        matched = true;
        break;
      }
    }
    if (!matched) {
      console.log('  No standard test password matched.');
    }
  }

  await pool.end();
}

main().catch(console.error);
