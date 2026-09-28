import pg from 'pg';
const { Pool } = pg;
const p = new Pool({ connectionString: 'postgresql://postgres:password@127.0.0.1:5432/docsearch' });

async function main() {
  const r = await p.query("SELECT table_schema, table_name FROM information_schema.tables WHERE table_name LIKE '%prescrip%' OR table_name LIKE '%medicat%' OR table_name LIKE '%pharmacy%' OR table_name LIKE '%invoice%'");
  console.log(r.rows);
  await p.end();
}
main().catch(console.error);
