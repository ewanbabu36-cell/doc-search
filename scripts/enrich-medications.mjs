import pg from 'pg';
const client = new pg.Client({ connectionString: 'postgresql://postgres:password@127.0.0.1:5432/docsearch' });
await client.connect();

const rows = (await client.query('SELECT id, medication_code, brand_name, generic_name, strength, dosage_form, metadata FROM clinical.medication_catalog LIMIT 5;')).rows;
console.log('Medications sample:', JSON.stringify(rows, null, 2));

// Ensure every medication has mrp and janAushadhiPrice in metadata
await client.query(`
  UPDATE clinical.medication_catalog
  SET metadata = jsonb_build_object(
    'mrp', COALESCE((metadata->>'mrp')::numeric, 45.00),
    'janAushadhiPrice', COALESCE((metadata->>'janAushadhiPrice')::numeric, 12.00),
    'schedule', COALESCE(metadata->>'schedule', 'H'),
    'hindiInstructions', COALESCE(metadata->>'hindiInstructions', 'दिन में दो बार भोजन के बाद')
  )
  WHERE metadata IS NULL OR metadata->>'mrp' IS NULL;
`);

const medCount = (await client.query("SELECT count(*) FROM clinical.medication_catalog WHERE metadata->>'mrp' IS NOT NULL;")).rows[0].count;
console.log('Medications with MRP in DB:', medCount);

await client.end();
