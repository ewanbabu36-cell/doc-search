import pg from 'pg';
const { Client } = pg;

async function checkCols() {
  const client = new Client({ connectionString: 'postgresql://postgres:password@127.0.0.1:5432/docsearch' });
  await client.connect();
  const resTen = await client.query(`
    SELECT column_name, data_type, is_nullable
    FROM information_schema.columns 
    WHERE table_schema = 'core' AND table_name = 'tenants'
    ORDER BY ordinal_position;
  `);
  console.log('core.tenants columns:', resTen.rows.map(r => `${r.column_name} (${r.data_type})`));

  const resPat = await client.query(`
    SELECT column_name, data_type, is_nullable
    FROM information_schema.columns 
    WHERE table_schema = 'clinical' AND table_name = 'patients'
    ORDER BY ordinal_position;
  `);
  console.log('clinical.patients columns:', resPat.rows.map(r => `${r.column_name} (${r.data_type})`));

  await client.end();
}
checkCols();
