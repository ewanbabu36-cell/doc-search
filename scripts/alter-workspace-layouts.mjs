import pg from 'pg';

const client = new pg.Client({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:password@127.0.0.1:5432/docsearch'
});

await client.connect();

await client.query(`
  ALTER TABLE core.user_workspace_layouts 
    ADD COLUMN IF NOT EXISTS wallpaper_id VARCHAR(64) DEFAULT 'OLED_COSMIC_BLUE',
    ADD COLUMN IF NOT EXISTS custom_wallpaper_url VARCHAR(1024),
    ADD COLUMN IF NOT EXISTS wallpaper_blur_px INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS desktop_icons JSONB DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS desktop_widgets JSONB DEFAULT '[]'::jsonb;

  ALTER TABLE public.user_workspace_layouts 
    ADD COLUMN IF NOT EXISTS wallpaper_id VARCHAR(64) DEFAULT 'OLED_COSMIC_BLUE',
    ADD COLUMN IF NOT EXISTS custom_wallpaper_url VARCHAR(1024),
    ADD COLUMN IF NOT EXISTS wallpaper_blur_px INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS desktop_icons JSONB DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS desktop_widgets JSONB DEFAULT '[]'::jsonb;
`);

console.log('✅ Altered user_workspace_layouts with wallpaper, desktop_icons, and desktop_widgets columns in PostgreSQL.');
await client.end();
