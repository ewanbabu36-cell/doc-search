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
    'inpatient_admission_requests'
  ];

  for (const t of tables) {
    const res = await client.query(`
      SELECT tc.constraint_name, kcu.column_name, 
             ccu.table_schema AS foreign_table_schema,
             ccu.table_name AS foreign_table_name,
             ccu.column_name AS foreign_column_name 
      FROM information_schema.table_constraints AS tc 
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
        AND ccu.table_schema = tc.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY' 
        AND tc.table_schema = 'clinical' 
        AND tc.table_name = '${t}';
    `);
    console.log(`\nTable clinical.${t} FKs (${res.rows.length}):`);
    for (const r of res.rows) {
      console.log(`  ${r.column_name} -> ${r.foreign_table_schema}.${r.foreign_table_name}(${r.foreign_column_name})`);
    }
  }

  await client.end();
}

main().catch(console.error);
