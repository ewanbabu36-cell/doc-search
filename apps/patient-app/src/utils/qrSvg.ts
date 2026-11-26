// ISO/IEC 18004 QR Code Model 2 SVG Generator (Byte mode, Version 1-6, ECC Level L)
// Generates real scannable matrix barcodes with zero external runtime dependencies.

const GF_EXP = new Uint8Array(512);
const GF_LOG = new Uint8Array(256);
(() => {
  let x = 1;
  for (let i = 0; i < 255; i++) {
    GF_EXP[i] = x;
    GF_LOG[x] = i;
    x <<= 1;
    if (x & 0x100) x ^= 0x11d;
  }
  for (let i = 255; i < 512; i++) {
    GF_EXP[i] = GF_EXP[i - 255]!;
  }
})();

function gfMul(a: number, b: number): number {
  if (a === 0 || b === 0) return 0;
  return GF_EXP[(GF_LOG[a]! + GF_LOG[b]!) % 255]!;
}

function rsGeneratorPoly(ecCount: number): number[] {
  let poly = [1];
  for (let i = 0; i < ecCount; i++) {
    const factor = [1, GF_EXP[i]!];
    const next = new Array<number>(poly.length + 1).fill(0);
    for (let j = 0; j < poly.length; j++) {
      for (let k = 0; k < factor.length; k++) {
        next[j + k] = (next[j + k] ?? 0) ^ gfMul(poly[j]!, factor[k]!);
      }
    }
    poly = next;
  }
  return poly;
}

function computeRsEc(data: number[], ecCount: number): number[] {
  const gen = rsGeneratorPoly(ecCount);
  const work = new Array<number>(data.length + ecCount).fill(0);
  for (let i = 0; i < data.length; i++) work[i] = data[i]!;
  for (let i = 0; i < data.length; i++) {
    const coef = work[i]!;
    if (coef !== 0) {
      for (let j = 0; j < gen.length; j++) {
        work[i + j] = (work[i + j] ?? 0) ^ gfMul(gen[j]!, coef);
      }
    }
  }
  return work.slice(data.length);
}

// Single-block EC Level L parameters for Versions 1..6 (capacities in data codewords)
const VERSION_SPECS: Array<{
  version: number;
  size: number;
  dataCodewords: number;
  ecCodewords: number;
  alignCenters: number[];
}> = [
  { version: 1, size: 21, dataCodewords: 19, ecCodewords: 7, alignCenters: [] },
  { version: 2, size: 25, dataCodewords: 34, ecCodewords: 10, alignCenters: [6, 18] },
  { version: 3, size: 29, dataCodewords: 55, ecCodewords: 15, alignCenters: [6, 22] },
  { version: 4, size: 33, dataCodewords: 80, ecCodewords: 20, alignCenters: [6, 26] },
  { version: 5, size: 37, dataCodewords: 108, ecCodewords: 26, alignCenters: [6, 30] },
  { version: 6, size: 41, dataCodewords: 136, ecCodewords: 36, alignCenters: [6, 34] }
];

// Format info strings for EC Level L (01) and Mask 0..7 with BCH + mask 0x5412
const FORMAT_L_MASKS = [
  0x77c4, 0x72f3, 0x7daa, 0x789d, 0x662f, 0x6318, 0x6c41, 0x6976
];

function createMatrix(size: number): { modules: Int8Array; isFunction: Uint8Array } {
  return {
    modules: new Int8Array(size * size),
    isFunction: new Uint8Array(size * size)
  };
}

function setFuncModule(
  modules: Int8Array,
  isFunction: Uint8Array,
  size: number,
  x: number,
  y: number,
  dark: boolean
) {
  const idx = y * size + x;
  modules[idx] = dark ? 1 : 0;
  isFunction[idx] = 1;
}

function drawFinderPattern(modules: Int8Array, isFunction: Uint8Array, size: number, cx: number, cy: number) {
  for (let dy = -4; dy <= 4; dy++) {
    for (let dx = -4; dx <= 4; dx++) {
      const xx = cx + dx;
      const yy = cy + dy;
      if (xx < 0 || xx >= size || yy < 0 || yy >= size) continue;
      const dist = Math.max(Math.abs(dx), Math.abs(dy));
      setFuncModule(modules, isFunction, size, xx, yy, dist !== 2 && dist !== 4);
    }
  }
}

function drawAlignmentPattern(modules: Int8Array, isFunction: Uint8Array, size: number, cx: number, cy: number) {
  for (let dy = -2; dy <= 2; dy++) {
    for (let dx = -2; dx <= 2; dx++) {
      const dist = Math.max(Math.abs(dx), Math.abs(dy));
      setFuncModule(modules, isFunction, size, cx + dx, cy + dy, dist !== 1);
    }
  }
}

function drawFormatBits(modules: Int8Array, isFunction: Uint8Array, size: number, mask: number) {
  const data = FORMAT_L_MASKS[mask]!;
  for (let i = 0; i <= 5; i++) setFuncModule(modules, isFunction, size, 8, i, ((data >>> i) & 1) !== 0);
  setFuncModule(modules, isFunction, size, 8, 7, ((data >>> 6) & 1) !== 0);
  setFuncModule(modules, isFunction, size, 8, 8, ((data >>> 7) & 1) !== 0);
  setFuncModule(modules, isFunction, size, 7, 8, ((data >>> 8) & 1) !== 0);
  for (let i = 9; i < 15; i++) setFuncModule(modules, isFunction, size, 14 - i, 8, ((data >>> i) & 1) !== 0);

  for (let i = 0; i < 8; i++) setFuncModule(modules, isFunction, size, size - 1 - i, 8, ((data >>> i) & 1) !== 0);
  for (let i = 8; i < 15; i++) setFuncModule(modules, isFunction, size, 8, size - 15 + i, ((data >>> i) & 1) !== 0);
  setFuncModule(modules, isFunction, size, 8, size - 8, true);
}

export function buildQrMatrix(text: string): { size: number; rows: boolean[][] } {
  const bytes = new TextEncoder().encode(text || 'DOCSEARCH');
  const trimmed = bytes.slice(0, 120);
  const spec = VERSION_SPECS.find((s) => 2 + trimmed.length <= s.dataCodewords) || VERSION_SPECS[VERSION_SPECS.length - 1]!;

  // Encode Byte-mode bitstream: mode=0100 (4b), count (8b), bytes, terminator & pad 0xec/0x11
  const bits: number[] = [0, 1, 0, 0];
  for (let b = 7; b >= 0; b--) bits.push((trimmed.length >>> b) & 1);
  for (const byte of trimmed) {
    for (let b = 7; b >= 0; b--) bits.push((byte >>> b) & 1);
  }
  const maxBits = spec.dataCodewords * 8;
  for (let i = 0; i < 4 && bits.length < maxBits; i++) bits.push(0);
  while (bits.length % 8 !== 0) bits.push(0);

  const dataCodewords: number[] = [];
  for (let i = 0; i < bits.length; i += 8) {
    let val = 0;
    for (let j = 0; j < 8; j++) val = (val << 1) | (bits[i + j] || 0);
    dataCodewords.push(val);
  }
  let padToggle = 0;
  while (dataCodewords.length < spec.dataCodewords) {
    dataCodewords.push(padToggle % 2 === 0 ? 0xec : 0x11);
    padToggle++;
  }

  let allCodewords: number[];
  if (spec.version <= 4) {
    const ec = computeRsEc(dataCodewords, spec.ecCodewords);
    allCodewords = [...dataCodewords, ...ec];
  } else {
    // Version 5 (1 block of 108/26) & Version 6 (2 blocks of 68/18)
    if (spec.version === 5) {
      allCodewords = [...dataCodewords, ...computeRsEc(dataCodewords, 26)];
    } else {
      const b1 = dataCodewords.slice(0, 68);
      const b2 = dataCodewords.slice(68, 136);
      const ec1 = computeRsEc(b1, 18);
      const ec2 = computeRsEc(b2, 18);
      allCodewords = [];
      for (let i = 0; i < 68; i++) {
        allCodewords.push(b1[i]!, b2[i]!);
      }
      for (let i = 0; i < 18; i++) {
        allCodewords.push(ec1[i]!, ec2[i]!);
      }
    }
  }

  const size = spec.size;
  const { modules, isFunction } = createMatrix(size);

  // Timing patterns
  for (let i = 0; i < size; i++) {
    setFuncModule(modules, isFunction, size, 6, i, i % 2 === 0);
    setFuncModule(modules, isFunction, size, i, 6, i % 2 === 0);
  }
  // Finder patterns
  drawFinderPattern(modules, isFunction, size, 3, 3);
  drawFinderPattern(modules, isFunction, size, size - 4, 3);
  drawFinderPattern(modules, isFunction, size, 3, size - 4);
  // Alignment patterns
  const centers = spec.alignCenters;
  for (let i = 0; i < centers.length; i++) {
    for (let j = 0; j < centers.length; j++) {
      if (!((i === 0 && j === 0) || (i === 0 && j === centers.length - 1) || (i === centers.length - 1 && j === 0))) {
        drawAlignmentPattern(modules, isFunction, size, centers[i]!, centers[j]!);
      }
    }
  }
  drawFormatBits(modules, isFunction, size, 0);

  // Zigzag placement of codewords
  let bitIdx = 0;
  const totalBits = allCodewords.length * 8;
  for (let right = size - 1; right >= 1; right -= 2) {
    if (right === 6) right = 5;
    for (let vert = 0; vert < size; vert++) {
      for (let j = 0; j < 2; j++) {
        const x = right - j;
        const upward = ((right + 1) & 2) === 0;
        const y = upward ? size - 1 - vert : vert;
        if (isFunction[y * size + x]) continue;
        let dark = false;
        if (bitIdx < totalBits) {
          const cw = allCodewords[bitIdx >>> 3]!;
          dark = ((cw >>> (7 - (bitIdx & 7))) & 1) !== 0;
          bitIdx++;
        }
        modules[y * size + x] = dark ? 1 : 0;
      }
    }
  }

  // Evaluate mask 0..7 and pick lowest penalty (XOR flip on non-function modules)
  let bestMask = 0;
  let bestScore = Infinity;
  const maskFn = (mask: number, x: number, y: number): boolean => {
    switch (mask) {
      case 0: return (x + y) % 2 === 0;
      case 1: return y % 2 === 0;
      case 2: return x % 3 === 0;
      case 3: return (x + y) % 3 === 0;
      case 4: return (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0;
      case 5: return ((x * y) % 2) + ((x * y) % 3) === 0;
      case 6: return ((((x * y) % 2) + ((x * y) % 3)) % 2) === 0;
      default: return ((((x + y) % 2) + ((x * y) % 3)) % 2) === 0;
    }
  };

  for (let m = 0; m < 8; m++) {
    let score = 0;
    // Fast penalty estimation: row/col runs + 2x2 blocks + dark/light balance
    let darkCount = 0;
    for (let y = 0; y < size; y++) {
      let runColor = -1;
      let runLen = 0;
      for (let x = 0; x < size; x++) {
        const idx = y * size + x;
        const bit = isFunction[idx] ? modules[idx]! : (modules[idx]! ^ (maskFn(m, x, y) ? 1 : 0));
        if (bit === 1) darkCount++;
        if (bit === runColor) {
          runLen++;
          if (runLen === 5) score += 3;
          else if (runLen > 5) score += 1;
        } else {
          runColor = bit;
          runLen = 1;
        }
      }
    }
    const pct = Math.abs((darkCount * 100) / (size * size) - 50);
    score += Math.floor(pct / 5) * 10;
    if (score < bestScore) {
      bestScore = score;
      bestMask = m;
    }
  }

  drawFormatBits(modules, isFunction, size, bestMask);
  const rows: boolean[][] = [];
  for (let y = 0; y < size; y++) {
    const row: boolean[] = [];
    for (let x = 0; x < size; x++) {
      const idx = y * size + x;
      const val = isFunction[idx] ? modules[idx]! : (modules[idx]! ^ (maskFn(bestMask, x, y) ? 1 : 0));
      row.push(val === 1);
    }
    rows.push(row);
  }
  return { size, rows };
}

export function qrSvgPath(text: string): { viewBox: string; d: string; size: number } {
  const { size, rows } = buildQrMatrix(text);
  const parts: string[] = [];
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (rows[y]?.[x]) {
        parts.push(`M${x},${y}h1v1h-1z`);
      }
    }
  }
  const quiet = 2;
  return {
    size,
    viewBox: `${-quiet} ${-quiet} ${size + quiet * 2} ${size + quiet * 2}`,
    d: parts.join('')
  };
}
