import pg from 'pg';

const { Pool } = pg;
const pool = new Pool({ connectionString: 'postgresql://postgres:password@127.0.0.1:5432/docsearch' });

async function main() {
  const tenantId = '34d6af53-198e-22f5-114a-cea533aeb300';
  console.log(`Checking facilities & setup for Ashiyana Clinic (${tenantId}):`);

  const fac = await pool.query('SELECT * FROM clinical.operational_facilities WHERE tenant_id = $1', [tenantId]);
  console.log('Facilities:', fac.rows);

  const dept = await pool.query('SELECT * FROM clinical.operational_departments WHERE tenant_id = $1', [tenantId]);
  console.log('Departments:', dept.rows);

  const doc = await pool.query('SELECT * FROM clinical.doctor_profiles WHERE tenant_id = $1', [tenantId]);
  console.log('Doctor profiles:', doc.rows);

  const encs = await pool.query('SELECT * FROM clinical.encounters WHERE tenant_id = $1', [tenantId]);
  console.log('Encounters for this tenant:', encs.rows);

  const q = await pool.query('SELECT * FROM clinical.encounter_queues WHERE tenant_id = $1', [tenantId]);
  console.log('Queue tokens for this tenant:', q.rows);

  const pat = await pool.query('SELECT * FROM clinical.patients WHERE tenant_id = $1', [tenantId]);
  console.log('Patients for this tenant:', pat.rows);

  const staff = await pool.query('SELECT * FROM clinical.operational_staff WHERE tenant_id = $1', [tenantId]);
  console.log('Operational staff for this tenant:', staff.rows);

  await pool.end();
}

main().catch(console.error);
