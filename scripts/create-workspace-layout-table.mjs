import pg from 'pg';

const client = new pg.Client({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:password@127.0.0.1:5432/docsearch'
});

await client.connect();

await client.query(`
  CREATE SCHEMA IF NOT EXISTS core;

  CREATE TABLE IF NOT EXISTS core.user_workspace_layouts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    user_id UUID NOT NULL,
    active_preset_id VARCHAR(64) NOT NULL DEFAULT 'CLINICAL_DEFAULT',
    dock_slots JSONB NOT NULL DEFAULT '[]'::jsonb,
    header_slots JSONB NOT NULL DEFAULT '[]'::jsonb,
    custom_folders JSONB NOT NULL DEFAULT '[]'::jsonb,
    drawer_pinned_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
    theme_variant VARCHAR(32) NOT NULL DEFAULT 'LIQUID_GLASS_DARK',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_core_user_workspace_layout UNIQUE (tenant_id, user_id)
  );

  CREATE TABLE IF NOT EXISTS public.user_workspace_layouts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    user_id UUID NOT NULL,
    active_preset_id VARCHAR(64) NOT NULL DEFAULT 'CLINICAL_DEFAULT',
    dock_slots JSONB NOT NULL DEFAULT '[]'::jsonb,
    header_slots JSONB NOT NULL DEFAULT '[]'::jsonb,
    custom_folders JSONB NOT NULL DEFAULT '[]'::jsonb,
    drawer_pinned_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
    theme_variant VARCHAR(32) NOT NULL DEFAULT 'LIQUID_GLASS_DARK',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_public_user_workspace_layout UNIQUE (tenant_id, user_id)
  );
`);

console.log('✅ Created user_workspace_layouts table in PostgreSQL core and public schemas.');
await client.end();
