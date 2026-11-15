import pg from 'pg';
const client = new pg.Client({ connectionString: 'postgresql://postgres:password@127.0.0.1:5432/docsearch' });
await client.connect();
const res = await client.query('SELECT * FROM clinical.patients');
console.log(res.rows.map(r => ({ id: r.id, tenant: r.tenant_id, uhid: r.uhid, first_name: r.first_name, last_name: r.last_name })));
await client.end();
