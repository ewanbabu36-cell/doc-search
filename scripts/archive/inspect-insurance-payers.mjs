import pg from 'pg';
const client = new pg.Client({ connectionString: 'postgresql://postgres:password@127.0.0.1:5432/docsearch' });
await client.connect();

const rows = (await client.query('SELECT id, payer_code, payer_name, tpa_name, metadata FROM clinical.insurance_payers;')).rows;
console.log('Insurance payers:', JSON.stringify(rows, null, 2));

await client.end();
