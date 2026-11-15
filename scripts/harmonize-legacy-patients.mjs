import pg from 'pg';
const client = new pg.Client({ connectionString: 'postgresql://postgres:password@127.0.0.1:5432/docsearch' });
await client.connect();

await client.query(`
  UPDATE clinical.patients 
  SET uhid = 'UHID-2026-0051', tenant_id = '11111111-1111-4111-8111-111111111111' 
  WHERE id = '29bc38f8-32ef-427a-b16b-91f13792d427'
`);

await client.query(`
  UPDATE clinical.patients 
  SET uhid = 'UHID-2026-0052', tenant_id = '11111111-1111-4111-8111-111111111111' 
  WHERE id = 'b621ccca-d7e0-4a71-bd6f-5bc05ce9cf1c'
`);

console.log('✓ Successfully harmonized legacy patients to canonical tenant');
await client.end();
