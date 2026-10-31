import pg from 'pg';

async function main() {
  const client = new pg.Client('postgresql://postgres:password@127.0.0.1:5432/docsearch');
  await client.connect();

  console.log('Creating clinical.prescription_templates table...');
  await client.query(`
    CREATE TABLE IF NOT EXISTS clinical.prescription_templates (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id UUID NOT NULL,
      doctor_id UUID,
      template_code VARCHAR(100) NOT NULL UNIQUE,
      name VARCHAR(255) NOT NULL,
      icon VARCHAR(50) DEFAULT '🩺',
      category VARCHAR(100) NOT NULL,
      chief_complaint TEXT,
      diagnosis VARCHAR(255) NOT NULL,
      icd10_code VARCHAR(50),
      treatment_plan TEXT,
      medications JSONB DEFAULT '[]'::jsonb,
      lab_tests JSONB DEFAULT '[]'::jsonb,
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  console.log('Creating clinical.vacutainer_tube_catalog table...');
  await client.query(`
    CREATE TABLE IF NOT EXISTS clinical.vacutainer_tube_catalog (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tube_key VARCHAR(50) NOT NULL UNIQUE,
      name VARCHAR(100) NOT NULL,
      additive VARCHAR(100) NOT NULL,
      color_name VARCHAR(100) NOT NULL,
      cap_hex VARCHAR(50) NOT NULL,
      glow_hex VARCHAR(50) NOT NULL,
      volume VARCHAR(50) NOT NULL,
      inversions VARCHAR(50) NOT NULL,
      common_tests JSONB DEFAULT '[]'::jsonb,
      keywords JSONB DEFAULT '[]'::jsonb,
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  console.log('Tables created successfully.');
  await client.end();
}

main().catch(console.error);
