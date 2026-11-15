import pg from 'pg';
const client = new pg.Client({ connectionString: 'postgresql://postgres:password@127.0.0.1:5432/docsearch' });
await client.connect();
const res = await client.query(`
  SELECT count(*) FROM clinical.inpatient_wards WHERE tenant_id = '11111111-1111-4111-8111-111111111111'
`);
console.log('Wards for canonical tenant:', res.rows[0].count);
await client.end();
