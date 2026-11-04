import pg from 'pg';

const client = new pg.Client({
  connectionString: 'postgresql://postgres:password@127.0.0.1:5432/docsearch'
});

await client.connect();
const res = await client.query(`
  SELECT table_schema, table_name 
  FROM information_schema.tables 
  WHERE table_schema NOT IN ('information_schema', 'pg_catalog')
  ORDER BY table_name;
`);

const searchTerms = ['cashier', 'triage', 'emergency', 'blood', 'honeytoken', 'cartel', 'poach', 'heal', 'daemon', 'steganography'];

for (const term of searchTerms) {
  const matches = res.rows.filter(r => r.table_name.includes(term));
  console.log(`\nMatches for "${term}":`);
  for (const m of matches) {
    console.log(`  - ${m.table_schema}.${m.table_name}`);
  }
}

await client.end();
