import fs from 'node:fs';
import path from 'node:path';

const srcDir = 'D:\\DOC SEARCH';
const destDir = 'C:\\Users\\alamr\\OneDrive\\Desktop\\DOC SEARCH';

const files = [
  'apps/partner-platform/vite.config.ts',
  'apps/partner-platform/index.html',
  'apps/partner-platform/public/manifest.json',
  'apps/partner-platform/public/icons/pwa-192x192.png',
  'apps/partner-platform/public/icons/pwa-512x512.png',
  'apps/partner-platform/public/icons/maskable-icon-512x512.png',
  'apps/partner-platform/public/icons/apple-touch-icon.png',
  'apps/partner-platform/public/icons/favicon-32x32.png',
  'apps/partner-platform/src/services/pwa-companion.ts',
  'apps/partner-platform/src/services/universal-offline-outbox.ts',
  'apps/partner-platform/src/services/multi-tab-sync-coordinator.ts',
  'apps/partner-platform/src/services/granular-crdt-sync.ts',
  'apps/partner-platform/src/hooks/usePwa.ts',
  'apps/partner-platform/src/components/common/PwaInstallButton.tsx',
  'apps/partner-platform/src/components/common/PwaInstallBanner.tsx',
  'apps/partner-platform/src/components/common/OptimisticSyncBadge.tsx',
  'apps/partner-platform/src/components/PartnerPlatformShell.tsx',
  'apps/partner-platform/src/main.tsx',
  'apps/api-gateway/src/services/partner/GranularSyncService.ts',
  'apps/api-gateway/src/routes/partner/granular-sync.routes.ts',
  'apps/api-gateway/src/app.ts',
  'scripts/test-granular-conflict-resolution.mjs',
  'apps/landing-page/public/manifest.json',
  'apps/landing-page/index.html',
  'apps/landing-page/public/icons/pwa-192x192.png',
  'apps/landing-page/public/icons/pwa-512x512.png',
  'apps/landing-page/public/icons/maskable-icon-512x512.png',
  'apps/landing-page/public/icons/apple-touch-icon.png',
  'apps/landing-page/public/icons/favicon-32x32.png'
];

let copied = 0;
for (const rel of files) {
  const s = path.join(srcDir, rel);
  const d = path.join(destDir, rel);
  if (fs.existsSync(s)) {
    fs.mkdirSync(path.dirname(d), { recursive: true });
    fs.copyFileSync(s, d);
    copied++;
    console.log('[SYNC] Copied to C:', rel);
  } else {
    console.warn('[SYNC] Not found in D:', rel);
  }
}

console.log(`\nSuccessfully synchronized ${copied}/${files.length} PWA files from D: to C:!`);
