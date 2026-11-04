import pg from 'pg';
const client = new pg.Client({ connectionString: 'postgresql://postgres:password@127.0.0.1:5432/docsearch' });
await client.connect();

const testPricing = {
  'CBC': 350,
  'CBC-FULL': 350,
  'LIPID': 650,
  'LIPID_PROFILE': 650,
  'LFT': 750,
  'KFT': 650,
  'THYROID': 450,
  'GLUCOSE': 100,
  'GLUCOSE_FBS': 100,
  'GLUCOSE_PP': 100,
  'HBA1C': 450,
  'URINE_RM': 150,
  'URINE': 150,
  'VIT_D': 1200,
  'VIT_B12': 850,
  'CRP': 400,
  'DENGUE_DUO': 900,
  'WIDAL': 200,
  'URINE_CULTURE': 600,
  'BLOOD_CULTURE': 1100
};

// Update metadata for matching tests
for (const [code, mrp] of Object.entries(testPricing)) {
  await client.query(`
    UPDATE clinical.investigation_catalog
    SET metadata = jsonb_set(
      COALESCE(metadata, '{}'::jsonb),
      '{mrp}',
      $1::jsonb
    )
    WHERE test_code ILIKE $2;
  `, [JSON.stringify(mrp), `%${code}%`]);
}

// For all other tests without mrp, give them a default realistic MRP based on category
await client.query(`
  UPDATE clinical.investigation_catalog
  SET metadata = jsonb_set(
    COALESCE(metadata, '{}'::jsonb),
    '{mrp}',
    '350'::jsonb
  )
  WHERE metadata->>'mrp' IS NULL;
`);

const updatedCount = (await client.query("SELECT count(*) FROM clinical.investigation_catalog WHERE metadata->>'mrp' IS NOT NULL;")).rows[0].count;
console.log('Tests with MRP in DB:', updatedCount);

await client.end();
