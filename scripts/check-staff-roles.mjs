import pg from 'pg';
const pool = new pg.Pool({ connectionString: 'postgresql://postgres:password@127.0.0.1:5432/docsearch' });

console.log('--- USERS ---');
const u = await pool.query('SELECT id, email, first_name, last_name, status, metadata FROM core.users;');
console.log(u.rows);

console.log('--- STAFF ROLE ASSIGNMENTS ---');
const sra = await pool.query('SELECT * FROM clinical.staff_role_assignments;');
console.log(sra.rows);

console.log('--- OPERATIONAL STAFF ---');
const opStaff = await pool.query('SELECT * FROM clinical.operational_staff;');
console.log(opStaff.rows);

console.log('--- SEED ROLES/PERMISSIONS IF ANY ---');
const r = await pool.query('SELECT * FROM core.roles;');
console.log('core.roles count:', r.rows.length);

await pool.end();
