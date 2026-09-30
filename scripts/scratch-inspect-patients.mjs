import pg from 'pg';

const PG_CONN = process.env.DATABASE_URL || 'postgresql://postgres:password@127.0.0.1:5432/docsearch';
const pool = new pg.Pool({ connectionString: PG_CONN });

async function inspect() {
  const cols = await pool.query(`
    SELECT column_name, data_type, is_nullable
    FROM information_schema.columns
    WHERE table_schema = 'clinical' AND table_name = 'patients'
    ORDER BY ordinal_position;
  `);

  console.log('Columns in clinical.patients:');
  for (const c of cols.rows) {
    console.log(`  ${c.column_name} (${c.data_type}, nullable: ${c.is_nullable})`);
  }

  const sample = await pool.query(`
    SELECT *
    FROM clinical.patients
    LIMIT 3;
  `);

  console.log('\nSample Patient:');
  console.log(sample.rows[0]);

  const nullSummary = await pool.query(`
    SELECT 
      count(*) as total,
      count(*) FILTER (WHERE uhid IS NULL OR trim(uhid) = '') as missing_uhid,
      count(*) FILTER (WHERE first_name IS NULL OR trim(first_name) = '') as missing_first_name,
      count(*) FILTER (WHERE tenant_id IS NULL) as missing_tenant_id,
      count(*) FILTER (WHERE date_of_birth IS NULL) as missing_dob,
      count(*) FILTER (WHERE gender IS NULL) as missing_gender
    FROM clinical.patients;
  `);

  console.log('\nNull Summary:');
  console.log(nullSummary.rows[0]);

  await pool.end();
}

inspect().catch(err => {
  console.error(err);
  process.exit(1);
});
