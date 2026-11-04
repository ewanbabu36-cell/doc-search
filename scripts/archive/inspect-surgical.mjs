import pg from 'pg';
const client = new pg.Client({ connectionString: 'postgresql://postgres:password@127.0.0.1:5432/docsearch' });
await client.connect();
const res = await client.query('SELECT id, procedure_code, procedure_name, base_procedure_charge FROM clinical.surgical_procedures LIMIT 5;');
console.log(JSON.stringify(res.rows, null, 2));

const ins = await client.query('SELECT id, payer_code, payer_name, tpa_name FROM clinical.insurance_payers LIMIT 5;');
console.log('Insurers:', JSON.stringify(ins.rows, null, 2));

const corp = await client.query('SELECT id, client_code, client_name, credit_limit FROM clinical.corporate_tpa_clients LIMIT 5;');
console.log('Corporates:', JSON.stringify(corp.rows, null, 2));

await client.end();
