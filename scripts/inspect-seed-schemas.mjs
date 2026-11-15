import pg from 'pg';

async function main() {
  const client = new pg.Client('postgresql://postgres:password@127.0.0.1:5432/docsearch');
  await client.connect();

  const tables = [
    'emergency_zones',
    'emergency_crash_carts',
    'emergency_mlc_cases',
    'emergency_ambulance_transfers',
    'blood_banks',
    'blood_crossmatches',
    'blood_temperature_logs',
    'blood_donor_screenings',
    'doctor_schedules',
    'inpatient_admission_requests',
    'inpatient_bed_allocations'
  ];

  for (const t of tables) {
    const res = await client.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_schema = 'clinical' AND table_name = '${t}'
      ORDER BY ordinal_position
    `);
    console.log(`\nTable: clinical.${t} (${res.rows.length} columns)`);
    console.log(res.rows.map(r => `${r.column_name} (${r.data_type}${r.is_nullable === 'NO' ? ' NOT NULL' : ''})`).join(', '));
  }

  await client.end();
}

main().catch(console.error);
