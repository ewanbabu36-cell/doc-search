import pg from 'pg';

const pool = new pg.Pool({ connectionString: 'postgresql://postgres:password@127.0.0.1:5432/docsearch' });

async function run() {
  const res = await pool.query(`
    SELECT table_schema, table_name, column_name 
    FROM information_schema.columns 
    WHERE column_name ILIKE '%password%' OR column_name ILIKE '%hash%'
    ORDER BY table_schema, table_name;
  `);
  console.log('Password/Hash columns found:', res.rows.length);
  for (const r of res.rows) {
    console.log(` - ${r.table_schema}.${r.table_name}.${r.column_name}`);
    try {
      const sample = await pool.query(`SELECT "${r.column_name}" FROM "${r.table_schema}"."${r.table_name}" WHERE "${r.column_name}" IS NOT NULL LIMIT 3;`);
      if (sample.rows.length > 0) {
        sample.rows.forEach((s, idx) => {
          const val = String(s[r.column_name]);
          const isBcrypt = val.startsWith('$2a$') || val.startsWith('$2b$');
          const isArgon = val.startsWith('$argon2');
          console.log(`     Sample ${idx + 1}: length=${val.length}, isBcrypt=${isBcrypt}, isArgon=${isArgon}, prefix=${val.slice(0, 7)}...`);
        });
      } else {
        console.log(`     (No rows populated)`);
      }
    } catch (e) {
      console.log(`     Query error:`, e.message);
    }
  }
  await pool.end();
}

run().catch(console.error);
