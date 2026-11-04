import pg from 'pg';
const client = new pg.Client({ connectionString: 'postgresql://postgres:password@127.0.0.1:5432/docsearch' });
await client.connect();

const rows = (await client.query('SELECT id, test_code, test_name, department, specimen_type, metadata FROM clinical.investigation_catalog LIMIT 5;')).rows;
console.log('Investigations:', JSON.stringify(rows, null, 2));

await client.end();
