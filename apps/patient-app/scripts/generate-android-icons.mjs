#!/usr/bin/env node
/**
 * Pure Node PNG Mipmap Launcher Icon Generator for DocSearch Mobile Apps
 * Generates crisp RGBA PNG launcher & notification icons across all Android DPI densities.
 */
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

const crcTable = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  crcTable[n] = c;
}

function crc32(buf) {
  let c = -1;
  for (let i = 0; i < buf.length; i++) {
    c = (c >>> 8) ^ crcTable[(c ^ buf[i]) & 0xff];
  }
  return (c ^ -1) >>> 0;
}

function pngChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const t = Buffer.from(type, 'ascii');
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([t, data])), 0);
  return Buffer.concat([len, t, data, crcBuf]);
}

function makeMedicalCrossPng(size, bgRgb = [11, 15, 25], fgRgb = [56, 189, 248]) {
  const raw = Buffer.alloc(size * (size * 4 + 1));
  const mid = size / 2;
  const armW = size * 0.14;
  const armL = size * 0.34;
  for (let y = 0; y < size; y++) {
    const rowStart = y * (size * 4 + 1);
    raw[rowStart] = 0;
    for (let x = 0; x < size; x++) {
      const idx = rowStart + 1 + x * 4;
      const dx = Math.abs(x - mid);
      const dy = Math.abs(y - mid);
      const inCross = (dx <= armW && dy <= armL) || (dy <= armW && dx <= armL);
      const rgb = inCross ? fgRgb : bgRgb;
      raw[idx] = rgb[0];
      raw[idx + 1] = rgb[1];
      raw[idx + 2] = rgb[2];
      raw[idx + 3] = 255;
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', zlib.deflateSync(raw)),
    pngChunk('IEND', Buffer.alloc(0))
  ]);
}

export function generateAndroidIcons(resDir) {
  const densities = [
    ['mipmap-mdpi', 48],
    ['mipmap-hdpi', 72],
    ['mipmap-xhdpi', 96],
    ['mipmap-xxhdpi', 144],
    ['mipmap-xxxhdpi', 192]
  ];
  for (const [dir, px] of densities) {
    const outDir = path.join(resDir, dir);
    fs.mkdirSync(outDir, { recursive: true });
    const png = makeMedicalCrossPng(px);
    fs.writeFileSync(path.join(outDir, 'ic_launcher.png'), png);
    fs.writeFileSync(path.join(outDir, 'ic_launcher_round.png'), png);
  }
  console.log(`[✔] Generated valid PNG launcher icons across 5 DPI densities in ${resDir}`);
}

if (process.argv[1] && process.argv[1].endsWith('generate-android-icons.mjs')) {
  const resTarget = process.argv[2] || path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1')), '../android/app/src/main/res');
  generateAndroidIcons(resTarget);
}
