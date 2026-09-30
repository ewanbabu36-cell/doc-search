import pg from 'pg';

const client = new pg.Client({ connectionString: 'postgresql://postgres:password@127.0.0.1:5432/docsearch' });

async function run() {
  await client.connect();
  const res = await client.query("SELECT table_schema, table_name FROM information_schema.tables WHERE table_schema IN ('core', 'company', 'clinical', 'public') ORDER BY table_schema, table_name;");
  console.log('Total Tables in PostgreSQL:', res.rows.length);
  const aiTables = res.rows.filter(r => r.table_name.includes('ai') || r.table_name.includes('chat') || r.table_name.includes('ewan') || r.table_name.includes('task') || r.table_name.includes('knowledge') || r.table_name.includes('train'));
  console.log('AI/Chat/Ewan/Task/Knowledge Tables in PostgreSQL:');
  console.table(aiTables);
  await client.end();
}

run().catch(console.error);
