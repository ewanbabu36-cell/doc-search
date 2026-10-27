// scripts/generate-docsearch-brand-assets.mjs
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// 1. Master Sophisticated, Simple, Smart, Elegant SVG Icon Definition (512x512)
export const masterAppIconSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="512" height="512" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <!-- Background Canvas Deep Space Gradient -->
    <linearGradient id="dsCanvasGrad" x1="40" y1="30" x2="472" y2="482" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stopColor="#0B1528"/>
      <stop offset="50%" stopColor="#070D1A"/>
      <stop offset="100%" stopColor="#030710"/>
    </linearGradient>

    <!-- Luxury Precision Border Gradient -->
    <linearGradient id="dsRimGrad" x1="0" y1="0" x2="512" y2="512" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.6"/>
      <stop offset="50%" stopColor="#2DD4BF" stopOpacity="0.2"/>
      <stop offset="100%" stopColor="#0284C7" stopOpacity="0.5"/>
    </linearGradient>

    <!-- Medical Vertical Capsule Gradient (Electric Sky to Cyan) -->
    <linearGradient id="dsVertGrad" x1="256" y1="110" x2="256" y2="402" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stopColor="#38BDF8"/>
      <stop offset="50%" stopColor="#0284C7"/>
      <stop offset="100%" stopColor="#0369A1"/>
    </linearGradient>

    <!-- Medical Horizontal Capsule Gradient (Teal to Emerald) -->
    <linearGradient id="dsHorizGrad" x1="110" y1="256" x2="402" y2="256" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stopColor="#0284C7"/>
      <stop offset="50%" stopColor="#06B6D4"/>
      <stop offset="100%" stopColor="#10B981"/>
    </linearGradient>

    <!-- Diagnostic Aperture Ring Gradient -->
    <linearGradient id="dsApertureGrad" x1="180" y1="180" x2="332" y2="332" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stopColor="#38BDF8"/>
      <stop offset="40%" stopColor="#A855F7"/>
      <stop offset="100%" stopColor="#10B981"/>
    </linearGradient>

    <!-- Ambient Specular Highlight -->
    <radialGradient id="dsAmbientLight" cx="160" cy="140" r="280" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.22"/>
      <stop offset="60%" stopColor="#06B6D4" stopOpacity="0.05"/>
      <stop offset="100%" stopColor="#070D1A" stopOpacity="0"/>
    </radialGradient>

    <!-- ECG Glow Filter -->
    <filter id="dsEcgGlow" x="-20%" y="-40%" width="140%" height="180%">
      <feGaussianBlur stdDeviation="3.5" result="blur"/>
      <feMerge>
        <feMergeNode in="blur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>

    <!-- Core Bloom Filter -->
    <filter id="dsCoreBloom" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="8" result="bloom"/>
      <feMerge>
        <feMergeNode in="bloom"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>

  <!-- 1. Master Squircle App Icon Foundation (Apple/Android Continuous Curvature) -->
  <rect width="512" height="512" rx="128" fill="url(#dsCanvasGrad)"/>
  <rect width="512" height="512" rx="128" fill="url(#dsAmbientLight)"/>
  <rect x="2" y="2" width="508" height="508" rx="126" stroke="url(#dsRimGrad)" stroke-width="3" fill="none"/>

  <!-- 2. Subtle Precision Geometric Grid / Focus Crosshairs (Subtle 8% Opacity) -->
  <circle cx="256" cy="256" r="176" stroke="#38BDF8" stroke-width="1.5" stroke-opacity="0.12" stroke-dasharray="4 8"/>
  <circle cx="256" cy="256" r="116" stroke="#2DD4BF" stroke-width="1.5" stroke-opacity="0.15"/>

  <!-- 3. The Medical Cross Elements with Precision Corner Radii -->
  <!-- Vertical Pillar -->
  <rect x="218" y="116" width="76" height="280" rx="38" fill="url(#dsVertGrad)"/>

  <!-- Horizontal Pillar with Soft Layer Blend -->
  <rect x="116" y="218" width="280" height="76" rx="38" fill="url(#dsHorizGrad)"/>

  <!-- 4. Diagnostic Search Aperture (Seamlessly Embedded Focus Lens at Cross Junction) -->
  <circle cx="256" cy="256" r="54" fill="#070D1A" stroke="url(#dsApertureGrad)" stroke-width="6"/>

  <!-- Search Beam Ray (45-degree angle diagnostic lens handle accent) -->
  <path d="M 294 294 L 348 348" stroke="#38BDF8" stroke-width="14" stroke-linecap="round" opacity="0.9" filter="url(#dsCoreBloom)"/>
  <path d="M 294 294 L 348 348" stroke="#FFFFFF" stroke-width="6" stroke-linecap="round"/>

  <!-- Inner Quantum Core Dot -->
  <circle cx="256" cy="256" r="14" fill="#070D1A" stroke="#38BDF8" stroke-width="3"/>
  <circle cx="256" cy="256" r="6" fill="#38BDF8"/>

  <!-- 5. Living Vital Heartbeat / ECG Wave Beam traversing the core -->
  <path d="M 132 256 L 194 256 L 214 220 L 236 292 L 256 236 L 274 274 L 294 256 L 380 256"
        stroke="#FFFFFF"
        stroke-width="5"
        stroke-linecap="round"
        stroke-linejoin="round"
        filter="url(#dsEcgGlow)"/>

  <!-- 6. Specular Top Glass Rim Highlight -->
  <path d="M 64 36 Q 256 18 448 36" stroke="#FFFFFF" stroke-width="1.5" stroke-opacity="0.25" fill="none"/>
</svg>
`;

// 2. Ultra-Clean Transparent Favicon / Vector Mark (viewBox 0 0 100 100)
export const masterFaviconSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="100" height="100" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="favVertGrad" x1="50" y1="12" x2="50" y2="88" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stopColor="#38BDF8"/>
      <stop offset="100%" stopColor="#0284C7"/>
    </linearGradient>
    <linearGradient id="favHorizGrad" x1="12" y1="50" x2="88" y2="50" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stopColor="#0284C7"/>
      <stop offset="100%" stopColor="#10B981"/>
    </linearGradient>
    <linearGradient id="favLensGrad" x1="30" y1="30" x2="70" y2="70" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stopColor="#38BDF8"/>
      <stop offset="100%" stopColor="#10B981"/>
    </linearGradient>
  </defs>

  <!-- Medical Cross Pillars -->
  <rect x="42" y="14" width="16" height="72" rx="8" fill="url(#favVertGrad)"/>
  <rect x="14" y="42" width="72" height="16" rx="8" fill="url(#favHorizGrad)"/>

  <!-- Diagnostic Aperture -->
  <circle cx="50" cy="50" r="14" fill="#070D1A" stroke="url(#favLensGrad)" stroke-width="3"/>

  <!-- Search Handle Accent -->
  <path d="M 60 60 L 74 74" stroke="#38BDF8" stroke-width="4.5" stroke-linecap="round"/>
  <path d="M 60 60 L 74 74" stroke="#FFFFFF" stroke-width="1.5" stroke-linecap="round"/>

  <!-- ECG Heartbeat Beam -->
  <path d="M 20 50 L 38 50 L 44 42 L 50 58 L 56 46 L 62 50 L 80 50"
        stroke="#FFFFFF"
        stroke-width="2.5"
        stroke-linecap="round"
        stroke-linejoin="round"/>
</svg>
`;

// 3. Full Brand Lockup SVG (Horizontal Mark + Modern Wordmark)
export const masterBrandLockupSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="400" height="96" viewBox="0 0 400 96" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="logoMarkV" x1="48" y1="16" x2="48" y2="80" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stopColor="#38BDF8"/>
      <stop offset="100%" stopColor="#0284C7"/>
    </linearGradient>
    <linearGradient id="logoMarkH" x1="16" y1="48" x2="80" y2="48" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stopColor="#0284C7"/>
      <stop offset="100%" stopColor="#10B981"/>
    </linearGradient>
    <linearGradient id="logoSearchGrad" x1="170" y1="48" x2="270" y2="48" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stopColor="#38BDF8"/>
      <stop offset="60%" stopColor="#2DD4BF"/>
      <stop offset="100%" stopColor="#818CF8"/>
    </linearGradient>
  </defs>

  <!-- Left Emblem Container (Squircle) -->
  <rect x="12" y="12" width="72" height="72" rx="20" fill="#0A1224" stroke="rgba(56, 189, 248, 0.4)" stroke-width="1.5"/>

  <!-- Medical Cross Elements -->
  <rect x="41" y="24" width="14" height="48" rx="7" fill="url(#logoMarkV)"/>
  <rect x="24" y="41" width="48" height="14" rx="7" fill="url(#logoMarkH)"/>

  <!-- Aperture Center & Search Accent -->
  <circle cx="48" cy="48" r="11" fill="#070D1A" stroke="#38BDF8" stroke-width="2.5"/>
  <path d="M 56 56 L 66 66" stroke="#38BDF8" stroke-width="3" stroke-linecap="round"/>
  <path d="M 56 56 L 66 66" stroke="#FFFFFF" stroke-width="1.2" stroke-linecap="round"/>

  <!-- ECG Pulse Beam -->
  <path d="M 28 48 L 40 48 L 44 41 L 48 55 L 52 44 L 56 48 L 68 48"
        stroke="#FFFFFF"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"/>

  <!-- Wordmark Text -->
  <text x="102" y="55" fill="#F8FAFC" font-family="-apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', sans-serif" font-weight="900" font-size="34" letter-spacing="-0.03em">DOC</text>
  <text x="186" y="55" fill="url(#logoSearchGrad)" font-family="-apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', sans-serif" font-weight="700" font-size="34" letter-spacing="-0.03em">SEARCH</text>

  <!-- Tagline -->
  <text x="104" y="74" fill="#94A3B8" font-family="-apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', sans-serif" font-weight="700" font-size="10.5" letter-spacing="0.18em">INTELLIGENT HEALTHCARE OS</text>
</svg>
`;

/**
 * Pure Node.js PNG encoder without external native modules
 */
function createPngBuffer(width, height, rgbaBuffer) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  const crcTable = new Int32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    }
    crcTable[i] = c;
  }
  function crc32(buf) {
    let crc = -1;
    for (let i = 0; i < buf.length; i++) {
      crc = (crc >>> 8) ^ crcTable[(crc ^ buf[i]) & 0xFF];
    }
    return (crc ^ -1);
  }

  function createChunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);
    const typeBuf = Buffer.from(type, 'ascii');
    const crcVal = crc32(Buffer.concat([typeBuf, data]));
    const crcBuf = Buffer.alloc(4);
    crcBuf.writeInt32BE(crcVal, 0);
    return Buffer.concat([len, typeBuf, data, crcBuf]);
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace

  const rowSize = width * 4;
  const filtered = Buffer.alloc(height * (rowSize + 1));
  for (let y = 0; y < height; y++) {
    filtered[y * (rowSize + 1)] = 0;
    rgbaBuffer.copy(filtered, y * (rowSize + 1) + 1, y * rowSize, (y + 1) * rowSize);
  }

  const idatData = zlib.deflateSync(filtered, { level: 9 });
  return Buffer.concat([
    signature,
    createChunk('IHDR', ihdr),
    createChunk('IDAT', idatData),
    createChunk('IEND', Buffer.alloc(0))
  ]);
}

/**
 * Generate a high-contrast, crisp raster icon buffer for any resolution
 */
function renderRasterAppIcon(size) {
  const buf = Buffer.alloc(size * size * 4);
  const cx = size / 2;
  const cy = size / 2;
  const cornerR = size * 0.25;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 4;

      // Rounded squircle distance
      const dx = Math.max(Math.abs(x - cx) - (cx - cornerR), 0);
      const dy = Math.max(Math.abs(y - cy) - (cy - cornerR), 0);
      const distToCorner = Math.sqrt(dx * dx + dy * dy);

      if (distToCorner > cornerR) {
        // Transparent outside rounded corner
        buf[idx] = 0;
        buf[idx + 1] = 0;
        buf[idx + 2] = 0;
        buf[idx + 3] = 0;
        continue;
      }

      // Inside squircle canvas: Deep obsidian midnight gradient
      const gradRatio = (x + y) / (size * 2);
      const rBg = Math.round(11 * (1 - gradRatio) + 4 * gradRatio);
      const gBg = Math.round(21 * (1 - gradRatio) + 8 * gradRatio);
      const bBg = Math.round(40 * (1 - gradRatio) + 16 * gradRatio);

      // Check if on border (1.5% border)
      const borderThickness = Math.max(1, Math.round(size * 0.015));
      if (distToCorner > cornerR - borderThickness) {
        buf[idx] = 56;
        buf[idx + 1] = 189;
        buf[idx + 2] = 248;
        buf[idx + 3] = 180;
        continue;
      }

      // Default background pixel
      let pr = rBg, pg = gBg, pb = bBg, pa = 255;

      // Medical cross geometry
      const crossHalfW = size * 0.08;
      const crossHalfL = size * 0.28;

      const inVert = Math.abs(x - cx) <= crossHalfW && Math.abs(y - cy) <= crossHalfL;
      const inHoriz = Math.abs(y - cy) <= crossHalfW && Math.abs(x - cx) <= crossHalfL;

      if (inVert || inHoriz) {
        if (inVert) {
          // Vertical Cyan Gradient
          const vertRatio = (y - (cy - crossHalfL)) / (crossHalfL * 2);
          pr = Math.round(56 * (1 - vertRatio) + 2 * vertRatio);
          pg = Math.round(189 * (1 - vertRatio) + 132 * vertRatio);
          pb = Math.round(248 * (1 - vertRatio) + 199 * vertRatio);
        } else {
          // Horizontal Emerald Gradient
          const horizRatio = (x - (cx - crossHalfL)) / (crossHalfL * 2);
          pr = Math.round(2 * (1 - horizRatio) + 16 * horizRatio);
          pg = Math.round(132 * (1 - horizRatio) + 185 * horizRatio);
          pb = Math.round(199 * (1 - horizRatio) + 129 * horizRatio);
        }
      }

      // Diagnostic Center Aperture (Circle)
      const distToCenter = Math.sqrt((x - cx) * (x - cx) + (y - cy) * (y - cy));
      const ringOuter = size * 0.12;
      const ringInner = size * 0.07;

      if (distToCenter <= ringOuter && distToCenter >= ringInner) {
        pr = 56;
        pg = 189;
        pb = 248;
      } else if (distToCenter < ringInner) {
        pr = 7;
        pg = 13;
        pb = 26;
        // Quantum center dot
        if (distToCenter <= size * 0.02) {
          pr = 255;
          pg = 255;
          pb = 255;
        }
      }

      // Search handle at 45 degrees
      if (x > cx + size * 0.06 && y > cy + size * 0.06 && x < cx + size * 0.22 && y < cy + size * 0.22) {
        if (Math.abs((x - cx) - (y - cy)) <= Math.max(1, size * 0.025)) {
          pr = 56;
          pg = 189;
          pb = 248;
        }
      }

      // ECG Pulse horizontal segment in white
      if (Math.abs(y - cy) <= Math.max(1, size * 0.012) && Math.abs(x - cx) <= size * 0.26) {
        pr = 255;
        pg = 255;
        pb = 255;
      }

      buf[idx] = pr;
      buf[idx + 1] = pg;
      buf[idx + 2] = pb;
      buf[idx + 3] = pa;
    }
  }

  return createPngBuffer(size, size, buf);
}

// 4. Manifest Generator for Web Apps
function generateWebManifest(name, shortName, themeColor = '#070D1A') {
  return JSON.stringify({
    name,
    short_name: shortName,
    description: 'Next-Gen Intelligent Healthcare Operating System (HOS) & Clinical Telemetry',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'any',
    background_color: themeColor,
    theme_color: themeColor,
    categories: ['medical', 'health', 'business', 'productivity'],
    icons: [
      { src: '/icons/favicon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
      { src: '/icons/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { src: '/icons/pwa-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icons/pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icons/maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
      { src: '/icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }
    ]
  }, null, 2);
}

// Target directories across all apps
const targets = [
  { dir: path.join(rootDir, 'apps/partner-platform/public'), name: 'DOC SEARCH — Healthcare Operating System', short: 'DOC SEARCH' },
  { dir: path.join(rootDir, 'apps/patient-app/public'), name: 'DOC SEARCH — Patient Portal & Digital Health Pass', short: 'DOC SEARCH' },
  { dir: path.join(rootDir, 'apps/landing-page/public'), name: 'DOC SEARCH — Next-Gen Intelligent Hospital Platform', short: 'DOC SEARCH' },
  { dir: path.join(rootDir, 'apps/company-platform/public'), name: 'DOC SEARCH — Enterprise Command Center', short: 'DOC SEARCH' },
  { dir: path.join(rootDir, 'apps/sovra-pwa/public'), name: 'Sovra Healthcare PWA', short: 'Sovra' }
];

console.log('\n============================================================');
console.log('✨ GENERATING SOPHISTICATED, SIMPLE, SMART & ELEGANT BRAND ASSETS');
console.log('============================================================\n');

for (const target of targets) {
  const iconsDir = path.join(target.dir, 'icons');
  if (!fs.existsSync(iconsDir)) {
    fs.mkdirSync(iconsDir, { recursive: true });
  }

  // 1. Write Vector SVGs
  fs.writeFileSync(path.join(iconsDir, 'icon.svg'), masterAppIconSvg);
  fs.writeFileSync(path.join(iconsDir, 'favicon.svg'), masterFaviconSvg);
  fs.writeFileSync(path.join(iconsDir, 'brand-lockup.svg'), masterBrandLockupSvg);
  fs.writeFileSync(path.join(target.dir, 'favicon.svg'), masterFaviconSvg);

  // 2. Write Crisp Raster PNGs
  const png32 = renderRasterAppIcon(32);
  const png180 = renderRasterAppIcon(180);
  const png192 = renderRasterAppIcon(192);
  const png512 = renderRasterAppIcon(512);

  fs.writeFileSync(path.join(iconsDir, 'favicon-32x32.png'), png32);
  fs.writeFileSync(path.join(iconsDir, 'apple-touch-icon.png'), png180);
  fs.writeFileSync(path.join(iconsDir, 'pwa-192x192.png'), png192);
  fs.writeFileSync(path.join(iconsDir, 'pwa-512x512.png'), png512);
  fs.writeFileSync(path.join(iconsDir, 'maskable-icon-512x512.png'), png512);

  // 3. For apps with legacy root names (like sovra-pwa), write root aliases
  fs.writeFileSync(path.join(target.dir, 'icon.svg'), masterAppIconSvg);
  fs.writeFileSync(path.join(target.dir, 'icon-192.svg'), masterAppIconSvg);
  fs.writeFileSync(path.join(target.dir, 'icon-512.svg'), masterAppIconSvg);
  fs.writeFileSync(path.join(target.dir, 'icon-192.png'), png192);
  fs.writeFileSync(path.join(target.dir, 'icon-512.png'), png512);

  // 4. Update manifest.json
  const manifestContent = generateWebManifest(target.name, target.short);
  fs.writeFileSync(path.join(target.dir, 'manifest.json'), manifestContent);

  console.log(`[✔] Synchronized brand assets & manifest in: ${path.relative(rootDir, target.dir)}`);
}

console.log('\n============================================================');
console.log('🎉 ALL SOPHISTICATED BRAND ASSETS GENERATED & SYNCHRONIZED!');
console.log('============================================================\n');
