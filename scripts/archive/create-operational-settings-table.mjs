import pg from 'pg';

const client = new pg.Client({
  connectionString: 'postgresql://postgres:password@127.0.0.1:5432/docsearch'
});

async function main() {
  await client.connect();
  console.log('Connected to PostgreSQL database docsearch.');

  await client.query(`
    CREATE TABLE IF NOT EXISTS company.partner_operational_settings (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id UUID NOT NULL REFERENCES core.tenants(id) ON DELETE CASCADE,
      partner_id VARCHAR(100),
      logo_url TEXT,
      stamp_seal_url TEXT,
      signature_url TEXT,
      letterhead_mode VARCHAR(50) NOT NULL DEFAULT 'FULL_DIGITAL',
      header_margins JSONB DEFAULT '{"top":20,"bottom":20,"left":15,"right":15}'::jsonb,
      footer_notes TEXT,
      report_footer_disclaimer TEXT,
      medico_legal_notice TEXT,
      official_helpline VARCHAR(100),
      google_review_url TEXT,
      auto_google_review_enabled BOOLEAN DEFAULT true,
      audio_call_lang VARCHAR(10) NOT NULL DEFAULT 'HI',
      referral_commission_policy JSONB DEFAULT '{}'::jsonb,
      doctor_header JSONB DEFAULT '{}'::jsonb,
      technologist_header JSONB DEFAULT '{}'::jsonb,
      pathologist_header JSONB DEFAULT '{}'::jsonb,
      statutory JSONB DEFAULT '{}'::jsonb,
      bank JSONB DEFAULT '{}'::jsonb,
      clinical_capacity JSONB DEFAULT '{}'::jsonb,
      hardware_config JSONB DEFAULT '{}'::jsonb,
      metadata JSONB DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE UNIQUE INDEX IF NOT EXISTS uq_partner_op_settings_tenant 
      ON company.partner_operational_settings(tenant_id);

    CREATE INDEX IF NOT EXISTS idx_partner_op_settings_partner 
      ON company.partner_operational_settings(partner_id);

    CREATE TABLE IF NOT EXISTS company.facility_branding_vault (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id UUID NOT NULL REFERENCES core.tenants(id) ON DELETE CASCADE,
      branding_type VARCHAR(50) NOT NULL DEFAULT 'PRESCRIPTION',
      brand_payload JSONB NOT NULL,
      approved_by VARCHAR(255),
      approval_status VARCHAR(50) NOT NULL DEFAULT 'APPROVED',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_branding_vault_tenant 
      ON company.facility_branding_vault(tenant_id);

    CREATE INDEX IF NOT EXISTS idx_branding_vault_type 
      ON company.facility_branding_vault(branding_type);
  `);

  console.log('Successfully created company.partner_operational_settings and company.facility_branding_vault tables.');
  await client.end();
}

main().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
