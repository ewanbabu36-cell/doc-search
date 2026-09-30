import fs from 'node:fs';
import zlib from 'node:zlib';
import path from 'node:path';

function createPng(width, height, drawFn) {
  const rowSize = 1 + width * 4;
  const rawData = Buffer.alloc(height * rowSize);
  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowSize;
    rawData[rowOffset] = 0; // filter type 0 (None)
    for (let x = 0; x < width; x++) {
      const pxOffset = rowOffset + 1 + x * 4;
      const [r, g, b, a] = drawFn(x, y, width, height);
      rawData[pxOffset] = r;
      rawData[pxOffset + 1] = g;
      rawData[pxOffset + 2] = b;
      rawData[pxOffset + 3] = a;
    }
  }

  const compressed = zlib.deflateSync(rawData);

  // Precomputed crc table
  const crcTable = [];
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    }
    crcTable[n] = c >>> 0;
  }
  function crc32(buf) {
    let c = 0xffffffff;
    for (let i = 0; i < buf.length; i++) {
      c = (crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8)) >>> 0;
    }
    return (c ^ 0xffffffff) >>> 0;
  }

  function makeChunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);
    const typeBuf = Buffer.from(type, 'ascii');
    const crcBuf = Buffer.alloc(4);
    const crc = crc32(Buffer.concat([typeBuf, data]));
    crcBuf.writeUInt32BE(crc >>> 0, 0);
    return Buffer.concat([len, typeBuf, data, crcBuf]);
  }

  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // bit depth
  ihdrData[9] = 6; // RGBA
  ihdrData[10] = 0; // compression
  ihdrData[11] = 0; // filter
  ihdrData[12] = 0; // interlace

  const header = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = makeChunk('IHDR', ihdrData);
  const idat = makeChunk('IDAT', compressed);
  const iend = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([header, ihdr, idat, iend]);
}

function medicalIconDraw(x, y, w, h) {
  const cx = w / 2;
  const cy = h / 2;
  const dx = x - cx;
  const dy = y - cy;
  const dist = Math.sqrt(dx * dx + dy * dy);

  // Background rounded circle
  const maxR = w * 0.46;
  if (dist > maxR) {
    return [0, 0, 0, 0]; // transparent
  }

  // Outer ring
  const ringR = w * 0.38;
  const ringThickness = w * 0.035;
  if (Math.abs(dist - ringR) < ringThickness) {
    return [14, 165, 233, 230]; // cyan ring
  }

  // Medical cross
  const crossW = w * 0.14;
  const crossH = w * 0.54;
  const inVert = Math.abs(dx) <= crossW / 2 && Math.abs(dy) <= crossH / 2;
  const inHoriz = Math.abs(dy) <= crossW / 2 && Math.abs(dx) <= crossH / 2;

  if (inVert || inHoriz) {
    return [56, 189, 248, 255]; // bright glowing cyan
  }

  // Center core dot
  if (dist < crossW * 0.6) {
    return [2, 132, 199, 255];
  }

  // Dark slate background
  return [11, 15, 23, 255];
}

function maskableIconDraw(x, y, w, h) {
  const cx = w / 2;
  const cy = h / 2;
  const dx = x - cx;
  const dy = y - cy;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const crossW = w * 0.12;
  const crossH = w * 0.46;
  const inVert = Math.abs(dx) <= crossW / 2 && Math.abs(dy) <= crossH / 2;
  const inHoriz = Math.abs(dy) <= crossW / 2 && Math.abs(dx) <= crossH / 2;
  if (inVert || inHoriz) return [56, 189, 248, 255];
  if (dist < crossW * 0.5) return [2, 132, 199, 255];
  return [11, 15, 23, 255]; // Solid background for maskable
}

const targetDirs = [
  path.join(process.cwd(), 'apps', 'partner-platform', 'public', 'icons'),
  path.join(process.cwd(), 'apps', 'landing-page', 'public', 'icons')
];

for (const iconsDir of targetDirs) {
  if (!fs.existsSync(iconsDir)) fs.mkdirSync(iconsDir, { recursive: true });

  fs.writeFileSync(path.join(iconsDir, 'pwa-192x192.png'), createPng(192, 192, medicalIconDraw));
  fs.writeFileSync(path.join(iconsDir, 'pwa-512x512.png'), createPng(512, 512, medicalIconDraw));
  fs.writeFileSync(path.join(iconsDir, 'maskable-icon-512x512.png'), createPng(512, 512, maskableIconDraw));
  fs.writeFileSync(path.join(iconsDir, 'apple-touch-icon.png'), createPng(180, 180, medicalIconDraw));
  fs.writeFileSync(path.join(iconsDir, 'favicon-32x32.png'), createPng(32, 32, medicalIconDraw));
  console.log(`Successfully generated icons in: ${iconsDir}`);
}
