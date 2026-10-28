import pg from 'pg';

async function main() {
  const client = new pg.Client({ connectionString: 'postgresql://postgres:password@127.0.0.1:5432/docsearch' });
  await client.connect();

  const res = await client.query(`
    SELECT table_schema, count(*) as count
    FROM information_schema.tables 
    WHERE table_schema NOT IN ('pg_catalog', 'information_schema')
    GROUP BY table_schema;
  `);
  console.log('PostgreSQL Schemas & Table Counts:');
  console.table(res.rows);

  await client.end();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
