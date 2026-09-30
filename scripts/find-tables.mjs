import pg from 'pg';
const pool = new pg.Pool({ connectionString: 'postgresql://postgres:password@127.0.0.1:5432/docsearch' });
const res = await pool.query(`
  SELECT table_schema, table_name 
  FROM information_schema.tables 
  WHERE table_schema IN ('core', 'company', 'clinical', 'billing', 'workflow') 
  ORDER BY table_schema, table_name;
`);
for (const r of res.rows) {
  try {
    const c = await pool.query(`SELECT count(*) FROM "${r.table_schema}"."${r.table_name}";`);
    const count = parseInt(c.rows[0].count, 10);
    if (count > 0) {
      console.log(`${r.table_schema}.${r.table_name}: ${count}`);
    }
  } catch (e) {
    // console.log(`Error reading ${r.table_schema}.${r.table_name}: ${e.message}`);
  }
}
await pool.end();
