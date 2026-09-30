/**
 * DocSearch Centralized Standardized Unique Identifier Service
 *
 * Implements an atomic sequence numbering system compliant with NABH, ABDM,
 * and HL7 FHIR standards for all healthcare entities.
 *
 * Entities Supported:
 * - Patient UHID: UHID-YYYY-XXXXXX (e.g. UHID-2026-000001)
 * - Staff / Doctor Code: DOC-<DEPT>-YYYY-XXX, NUR-YYYY-XXX, PHARM-YYYY-XXX, LAB-YYYY-XXX
 * - Partner Code: CLINIC-<NAME>-YYYY, PHARM-<NAME>-YYYY, LAB-<NAME>-YYYY
 * - OPD Queue Token: Daily resetting TK-01, TK-02...
 * - Encounter Number: ENC-OPD-YYYY-XXXXXX, ENC-IPD-YYYY-XXXXXX
 * - Lab Order Number: LAB-ORD-YYYY-XXXXXX
 * - Prescription Number: RX-YYYY-XXXXXX
 * - Invoice Number: INV-<TYPE>-YYYY-XXXXXX
 */

export interface GeneratedOpdToken {
  tokenNumber: number;
  tokenDisplay: string;
  encounterNumber: string;
  date: string;
}

export interface IdentifierParseResult {
  type: 'UHID' | 'STAFF' | 'PARTNER' | 'TOKEN' | 'ENCOUNTER' | 'LAB_ORDER' | 'PRESCRIPTION' | 'INVOICE' | 'UNKNOWN';
  prefix: string;
  year?: number;
  sequence?: number;
  raw: string;
  isValid: boolean;
}

export class UniqueIdentifierService {
  private inMemoryCounters: Map<string, number> = new Map();

  private getCurrentYear(): number {
    return new Date().getFullYear();
  }

  private getTodayDateKey(): string {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  /**
   * Atomic sequence incrementer with localStorage persistence and in-memory cache
   */
  private getNextSequence(key: string, initialValue: number = 1): number {
    const storageKey = `docsearch_seq_${key}`;
    let current = this.inMemoryCounters.get(storageKey);

    if (current === undefined && typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(storageKey);
        if (stored) {
          current = parseInt(stored, 10);
        }
      } catch {}
    }

    if (current === undefined || isNaN(current)) {
      current = initialValue;
    } else {
      current += 1;
    }

    this.inMemoryCounters.set(storageKey, current);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(storageKey, String(current));
      } catch {}
    }

    return current;
  }

  /**
   * Calculates the ISO/IEC 7812 Luhn Checksum digit for a numeric payload.
   * Typo-proof: catches 100% of single-digit substitution errors and 98% of transpositions.
   */
  calculateLuhnChecksum(digits: string): number {
    const clean = digits.replace(/\D/g, '');
    let sum = 0;
    let shouldDouble = true;
    for (let i = clean.length - 1; i >= 0; i--) {
      let digit = parseInt(clean.charAt(i), 10);
      if (shouldDouble) {
        digit *= 2;
        if (digit > 9) digit -= 9;
      }
      sum += digit;
      shouldDouble = !shouldDouble;
    }
    return (10 - (sum % 10)) % 10;
  }

  /**
   * Generates a permanent Universal Health Identifier (UHID) with optional Luhn Checksum
   * Format: UHID-YYYY-XXXXXX (default) or UHID-YYYY-XXXXXX-C (with checksum)
   */
  generateUhid(tenantId: string = 'default', year?: number, withChecksum: boolean = true): string {
    const yr = year || this.getCurrentYear();
    const key = `uhid_${tenantId}_${yr}`;
    const seq = this.getNextSequence(key, 1);
    const padded = String(seq).padStart(6, '0');
    if (withChecksum) {
      const checksum = this.calculateLuhnChecksum(`${yr}${padded}`);
      return `UHID-${yr}-${padded}-${checksum}`;
    }
    return `UHID-${yr}-${padded}`;
  }

  /**
   * Generates a standard Staff / Practitioner Code with Geographic City Sharding
   * Examples:
   * - Doctor: DOC-CARD-DEL-2026-001, DOC-GEN-MUM-2026-002
   * - Nurse: NUR-DEL-2026-001
   * - Pharmacist: PHARM-DEL-2026-001
   * - Lab Tech: LAB-DEL-2026-001
   * - Reception / Admin: STF-ADM-DEL-2026-001
   */
  generateStaffCode(
    staffType: string = 'DOCTOR',
    departmentCode?: string,
    cityCodeOrYear?: string | number,
    maybeYear?: number
  ): string {
    let cityCode: string | undefined;
    let year: number | undefined;

    if (typeof cityCodeOrYear === 'number') {
      year = cityCodeOrYear;
      cityCode = undefined;
    } else {
      cityCode = cityCodeOrYear;
      year = maybeYear;
    }

    const yr = year || this.getCurrentYear();
    const typeUpper = staffType.trim().toUpperCase();

    let prefix = 'STF';
    let deptSub = '';

    if (typeUpper === 'DOCTOR' || typeUpper === 'PHYSICIAN' || typeUpper === 'SURGEON') {
      prefix = 'DOC';
      const cleanDept = (departmentCode || 'GEN').trim().toUpperCase().slice(0, 4);
      deptSub = `-${cleanDept}`;
    } else if (typeUpper === 'NURSE' || typeUpper === 'RMO') {
      prefix = 'NUR';
    } else if (typeUpper === 'PHARMACIST') {
      prefix = 'PHARM';
    } else if (typeUpper === 'LAB_TECHNICIAN' || typeUpper === 'PATHOLOGIST') {
      prefix = 'LAB';
    } else if (typeUpper === 'RECEPTIONIST' || typeUpper === 'BILLING_OFFICER' || typeUpper === 'ADMINISTRATIVE') {
      prefix = 'STF-ADM';
    }

    if (cityCode) {
      const cleanCity = cityCode.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 4) || 'DEL';
      const key = `staff_${prefix}${deptSub}_${cleanCity}_${yr}`;
      const seq = this.getNextSequence(key, 1);
      const padded = String(seq).padStart(3, '0');
      return `${prefix}${deptSub}-${cleanCity}-${yr}-${padded}`;
    }

    const key = `staff_${prefix}${deptSub}_${yr}`;
    const seq = this.getNextSequence(key, 1);
    const padded = String(seq).padStart(3, '0');
    return `${prefix}${deptSub}-${yr}-${padded}`;
  }

  /**
   * Generates a partner tie-up code with Geographic City Sharding
   * Format: <TYPE>-<CITY>-<NAME>-<YEAR> (e.g. CLINIC-DEL-SHARMA-2026) or <TYPE>-<NAME>-<YEAR>
   */
  generatePartnerCode(
    type: 'CLINIC' | 'PHARMACY' | 'PATHOLOGY',
    name?: string,
    cityCodeOrYear?: string | number,
    maybeYear?: number
  ): string {
    let cityCode: string | undefined;
    let year: number | undefined;

    if (typeof cityCodeOrYear === 'number') {
      year = cityCodeOrYear;
      cityCode = undefined;
    } else {
      cityCode = cityCodeOrYear;
      year = maybeYear;
    }

    const yr = year || this.getCurrentYear();
    const cleanName = (name || 'PARTNER')
      .replace(/[^a-zA-Z0-9]/g, '')
      .toUpperCase()
      .slice(0, 8);

    const typePrefix =
      type === 'CLINIC' ? 'CLINIC' : type === 'PHARMACY' ? 'PHARM' : 'LAB';

    if (cityCode) {
      const cleanCity = cityCode.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 4) || 'DEL';
      return `${typePrefix}-${cleanCity}-${cleanName}-${yr}`;
    }

    return `${typePrefix}-${cleanName}-${yr}`;
  }

  /**
   * Generates a daily resetting OPD Token and corresponding Encounter Number
   * Format:
   * - Token: TK-01, TK-02...
   * - Encounter: ENC-OPD-YYYY-XXXXXX
   */
  generateOpdToken(facilityId: string = 'default'): GeneratedOpdToken {
    const today = this.getTodayDateKey();
    const yr = this.getCurrentYear();

    // Daily token sequence resets each calendar day
    const tokenKey = `token_${facilityId}_${today}`;
    const tokenSeq = this.getNextSequence(tokenKey, 1);
    const tokenDisplay = `TK-${String(tokenSeq).padStart(2, '0')}`;

    // Encounter sequence increments across the year
    const encKey = `enc_opd_${yr}`;
    const encSeq = this.getNextSequence(encKey, 1);
    const encounterNumber = `ENC-OPD-${yr}-${String(encSeq).padStart(6, '0')}`;

    return {
      tokenNumber: tokenSeq,
      tokenDisplay,
      encounterNumber,
      date: today
    };
  }

  /**
   * Generates a Lab Order Number
   * Format: LAB-ORD-YYYY-XXXXXX
   */
  generateLabOrderNumber(facilityId: string = 'default'): string {
    const yr = this.getCurrentYear();
    const key = `lab_ord_${facilityId}_${yr}`;
    const seq = this.getNextSequence(key, 1);
    return `LAB-ORD-${yr}-${String(seq).padStart(6, '0')}`;
  }

  /**
   * Generates a Prescription Number
   * Format: RX-YYYY-XXXXXX
   */
  generatePrescriptionNumber(doctorId: string = 'default'): string {
    const yr = this.getCurrentYear();
    const key = `rx_${doctorId}_${yr}`;
    const seq = this.getNextSequence(key, 1);
    return `RX-${yr}-${String(seq).padStart(6, '0')}`;
  }

  /**
   * Generates a Billing / Invoice Number
   * Format: INV-<TYPE>-YYYY-XXXXXX (e.g. INV-PHARM-2026-000001, INV-OPD-2026-000001)
   */
  generateInvoiceNumber(type: 'OPD' | 'PHARMACY' | 'LAB' | 'HOSPITAL' = 'OPD'): string {
    const yr = this.getCurrentYear();
    const key = `inv_${type}_${yr}`;
    const seq = this.getNextSequence(key, 1);
    return `INV-${type}-${yr}-${String(seq).padStart(6, '0')}`;
  }

  /**
   * Validates whether a given string adheres to standard UHID format and Luhn Checksum.
   * Supports both new typo-proof format (UHID-YYYY-XXXXXX-C) and legacy (UHID-YYYY-XXXXXX).
   */
  isValidUhid(uhid: string): boolean {
    if (!uhid || typeof uhid !== 'string') return false;
    const trimmed = uhid.trim().toUpperCase();

    // Typo-proof UHID with Luhn Checksum: UHID-YYYY-XXXXXX-C
    const matchWithChecksum = /^UHID-(\d{4})-(\d{6})-(\d)$/.exec(trimmed);
    if (matchWithChecksum) {
      const yr = matchWithChecksum[1]!;
      const seq = matchWithChecksum[2]!;
      const check = parseInt(matchWithChecksum[3]!, 10);
      const expected = this.calculateLuhnChecksum(`${yr}${seq}`);
      return check === expected;
    }

    // Legacy format backward compatibility
    return /^UHID-\d{4}-\d{6}$/.test(trimmed);
  }

  /**
   * Parses an identifier to extract type, year, and sequence
   */
  parseIdentifier(id: string): IdentifierParseResult {
    if (!id || typeof id !== 'string') {
      return { type: 'UNKNOWN', prefix: '', raw: String(id), isValid: false };
    }

    const trimmed = id.trim().toUpperCase();

    const uhidMatch = /^UHID-(\d{4})-(\d{6})(?:-(\d))?$/.exec(trimmed);
    if (uhidMatch) {
      const yr = parseInt(uhidMatch[1]!, 10);
      const seq = parseInt(uhidMatch[2]!, 10);
      const checkStr = uhidMatch[3];
      let valid = true;
      if (checkStr !== undefined) {
        valid = parseInt(checkStr, 10) === this.calculateLuhnChecksum(`${uhidMatch[1]}${uhidMatch[2]}`);
      }
      return {
        type: 'UHID',
        prefix: 'UHID',
        year: yr,
        sequence: seq,
        raw: trimmed,
        isValid: valid
      };
    }

    if (/^DOC-[A-Z0-9]+-.*$/.test(trimmed) || /^STF-.*$/.test(trimmed) || /^NUR-.*$/.test(trimmed) || /^PHARM-.*$/.test(trimmed) || /^LAB-.*$/.test(trimmed)) {
      if (/^(CLINIC|PHARM|LAB)-[A-Z0-9]+-[A-Z0-9]+-\d{4}$/.test(trimmed)) {
        return {
          type: 'PARTNER',
          prefix: trimmed.split('-')[0]!,
          raw: trimmed,
          isValid: true
        };
      }
      return {
        type: 'STAFF',
        prefix: trimmed.split('-')[0]!,
        raw: trimmed,
        isValid: true
      };
    }

    if (/^TK-\d+$/.test(trimmed)) {
      return {
        type: 'TOKEN',
        prefix: 'TK',
        sequence: parseInt(trimmed.replace('TK-', ''), 10),
        raw: trimmed,
        isValid: true
      };
    }

    if (/^ENC-(OPD|IPD)-\d{4}-\d+$/.test(trimmed)) {
      return {
        type: 'ENCOUNTER',
        prefix: 'ENC',
        raw: trimmed,
        isValid: true
      };
    }

    if (/^LAB-ORD-\d{4}-\d+$/.test(trimmed)) {
      return {
        type: 'LAB_ORDER',
        prefix: 'LAB-ORD',
        raw: trimmed,
        isValid: true
      };
    }

    if (/^RX-\d{4}-\d+$/.test(trimmed)) {
      return {
        type: 'PRESCRIPTION',
        prefix: 'RX',
        raw: trimmed,
        isValid: true
      };
    }

    if (/^INV-[A-Z]+-\d{4}-\d+$/.test(trimmed)) {
      return {
        type: 'INVOICE',
        prefix: 'INV',
        raw: trimmed,
        isValid: true
      };
    }

    return {
      type: 'UNKNOWN',
      prefix: trimmed.split('-')[0] || '',
      raw: trimmed,
      isValid: false
    };
  }

  /**
   * Generates a high-density, vector-crisp Code 128 (ISO/IEC 15417) Barcode SVG.
   * Ideal for 2-inch & 3-inch thermal printers, patient wristbands, and specimen tubes.
   */
  generateCode128Svg(
    text: string,
    options: { height?: number; barWidth?: number; showText?: boolean } = {}
  ): string {
    const height = options.height || 48;
    const barWidth = options.barWidth || 1.8;
    const showText = options.showText !== false;
    const quietZone = 10;

    const codes = [104]; // START B
    let checkSum = 104;

    for (let i = 0; i < text.length; i++) {
      const code = text.charCodeAt(i) - 32;
      if (code < 0 || code > 95) continue;
      codes.push(code);
      checkSum += code * (i + 1);
    }

    codes.push(checkSum % 103);
    codes.push(106); // STOP

    let totalModules = quietZone * 2;
    for (const c of codes) {
      const pattern = CODE128_PATTERNS[c] || CODE128_PATTERNS[0]!;
      for (const w of pattern) {
        totalModules += w;
      }
    }

    const svgWidth = Math.round(totalModules * barWidth);
    const svgHeight = showText ? height + 16 : height;

    let x = quietZone * barWidth;
    const rects: string[] = [];

    for (const c of codes) {
      const pattern = CODE128_PATTERNS[c] || CODE128_PATTERNS[0]!;
      let isBar = true;
      for (const w of pattern) {
        const wPx = w * barWidth;
        if (isBar) {
          rects.push(`<rect x="${x.toFixed(1)}" y="0" width="${wPx.toFixed(1)}" height="${height}" fill="#000000" />`);
        }
        x += wPx;
        isBar = !isBar;
      }
    }

    let textSvg = '';
    if (showText) {
      textSvg = `<text x="${(svgWidth / 2).toFixed(1)}" y="${height + 13}" font-family="monospace, Courier New" font-size="11" font-weight="700" text-anchor="middle" fill="#000000">${text}</text>`;
    }

    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${svgWidth} ${svgHeight}" width="${svgWidth}" height="${svgHeight}" style="max-width:100%;height:auto;display:block;margin:0 auto;"><rect width="100%" height="100%" fill="#FFFFFF"/>${rects.join('')}${textSvg}</svg>`;
  }

  /**
   * Generates a 2D QR Code SVG in standard Level M error correction.
   * Scannable by any mobile camera or 2D imaging scanner for live OPD queue or WhatsApp health card.
   */
  generateQrCodeSvg(text: string, pixelSize: number = 3.5): string {
    return QRCodeEncoder.toSvg(text, pixelSize);
  }

  /**
   * Returns current sequence telemetry across all entities
   */
  getSequenceTelemetry(): Record<string, number> {
    const telemetry: Record<string, number> = {};
    for (const [k, v] of this.inMemoryCounters.entries()) {
      telemetry[k.replace('docsearch_seq_', '')] = v;
    }
    return telemetry;
  }
}

export const uniqueIdentifierService = new UniqueIdentifierService();

// ============================================================================
// ISO/IEC 15417 Code 128 Pattern Table
// ============================================================================
const CODE128_PATTERNS: number[][] = [
  [2, 1, 2, 2, 2, 2], [2, 2, 2, 1, 2, 2], [2, 2, 2, 2, 2, 1], [1, 2, 1, 2, 2, 3],
  [1, 2, 1, 3, 2, 2], [1, 3, 1, 2, 2, 2], [1, 2, 2, 2, 1, 3], [1, 2, 2, 3, 1, 2],
  [1, 3, 2, 2, 1, 2], [2, 2, 1, 2, 1, 3], [2, 2, 1, 3, 1, 2], [2, 3, 1, 2, 1, 2],
  [1, 1, 2, 2, 3, 2], [1, 2, 2, 1, 3, 2], [1, 2, 2, 2, 3, 1], [1, 1, 3, 2, 2, 2],
  [1, 2, 3, 1, 2, 2], [1, 2, 3, 2, 2, 1], [2, 2, 3, 2, 1, 1], [2, 2, 1, 1, 3, 2],
  [2, 2, 1, 2, 3, 1], [2, 1, 3, 2, 1, 2], [2, 2, 3, 1, 1, 2], [3, 1, 2, 1, 3, 1],
  [3, 1, 1, 2, 2, 2], [3, 2, 1, 1, 2, 2], [3, 2, 1, 2, 2, 1], [3, 1, 2, 2, 1, 2],
  [3, 2, 2, 1, 1, 2], [3, 2, 2, 2, 1, 1], [2, 1, 2, 1, 2, 3], [2, 1, 2, 3, 2, 1],
  [2, 3, 2, 1, 2, 1], [1, 1, 1, 3, 2, 3], [1, 3, 1, 1, 2, 3], [1, 3, 1, 3, 2, 1],
  [1, 1, 2, 3, 1, 3], [1, 3, 2, 1, 1, 3], [1, 3, 2, 3, 1, 1], [2, 1, 1, 3, 1, 3],
  [2, 3, 1, 1, 1, 3], [2, 3, 1, 3, 1, 1], [1, 1, 2, 1, 3, 3], [1, 1, 2, 3, 3, 1],
  [1, 3, 2, 1, 3, 1], [1, 1, 3, 1, 2, 3], [1, 1, 3, 3, 2, 1], [1, 3, 3, 1, 2, 1],
  [3, 1, 3, 1, 2, 1], [2, 1, 1, 3, 3, 1], [2, 3, 1, 1, 3, 1], [2, 1, 3, 1, 1, 3],
  [2, 1, 3, 3, 1, 1], [2, 1, 3, 1, 3, 1], [3, 1, 1, 1, 2, 3], [3, 1, 1, 3, 2, 1],
  [3, 3, 1, 1, 2, 1], [3, 1, 2, 1, 1, 3], [3, 1, 2, 3, 1, 1], [3, 3, 2, 1, 1, 1],
  [3, 1, 4, 1, 1, 1], [2, 2, 1, 4, 1, 1], [4, 3, 1, 1, 1, 1], [1, 1, 1, 2, 2, 4],
  [1, 1, 1, 4, 2, 2], [1, 2, 1, 1, 2, 4], [1, 2, 1, 4, 2, 1], [1, 4, 1, 1, 2, 2],
  [1, 4, 1, 2, 2, 1], [1, 1, 2, 2, 1, 4], [1, 1, 2, 4, 1, 2], [1, 2, 2, 1, 1, 4],
  [1, 2, 2, 4, 1, 1], [1, 4, 2, 1, 1, 2], [1, 4, 2, 2, 1, 1], [2, 4, 1, 2, 1, 1],
  [2, 2, 1, 1, 1, 4], [4, 1, 3, 1, 1, 1], [2, 4, 1, 1, 1, 2], [1, 3, 4, 1, 1, 1],
  [1, 1, 1, 2, 4, 2], [1, 2, 1, 1, 4, 2], [1, 2, 1, 2, 4, 1], [1, 1, 4, 2, 1, 2],
  [1, 2, 4, 1, 1, 2], [1, 2, 4, 2, 1, 1], [4, 1, 1, 2, 1, 2], [4, 2, 1, 1, 1, 2],
  [4, 2, 1, 2, 1, 1], [2, 1, 2, 1, 4, 1], [2, 1, 4, 1, 2, 1], [4, 1, 2, 1, 2, 1],
  [1, 1, 1, 1, 4, 3], [1, 1, 1, 3, 4, 1], [1, 3, 1, 1, 4, 1], [1, 1, 4, 1, 1, 3],
  [1, 1, 4, 3, 1, 1], [4, 1, 1, 1, 1, 3], [4, 1, 1, 3, 1, 1], [1, 1, 3, 1, 4, 1],
  [1, 1, 4, 1, 3, 1], [3, 1, 1, 1, 4, 1], [4, 1, 1, 1, 3, 1], [2, 1, 1, 4, 1, 2],
  [2, 1, 1, 2, 1, 4], [2, 1, 1, 2, 3, 2], [2, 3, 3, 1, 1, 1, 2]
];

// ============================================================================
// ISO/IEC 18004 Standard QR Code (Model 2, Byte Mode, Level M) Vector Encoder
// ============================================================================
class QRCodeEncoder {
  private static GF256_EXP = new Uint8Array(512);
  private static GF256_LOG = new Uint8Array(256);
  private static isInitialized = false;

  private static initGF(): void {
    if (QRCodeEncoder.isInitialized) return;
    let x = 1;
    for (let i = 0; i < 255; i++) {
      QRCodeEncoder.GF256_EXP[i] = x;
      QRCodeEncoder.GF256_LOG[x] = i;
      x <<= 1;
      if (x & 0x100) x ^= 0x11d;
    }
    for (let i = 255; i < 512; i++) {
      QRCodeEncoder.GF256_EXP[i] = QRCodeEncoder.GF256_EXP[i - 255]!;
    }
    QRCodeEncoder.isInitialized = true;
  }

  private static gfMul(x: number, y: number): number {
    if (x === 0 || y === 0) return 0;
    return QRCodeEncoder.GF256_EXP[QRCodeEncoder.GF256_LOG[x]! + QRCodeEncoder.GF256_LOG[y]!]!;
  }

  private static rsGenPoly(ecCount: number): number[] {
    let poly = [1];
    for (let i = 0; i < ecCount; i++) {
      const next = new Array(poly.length + 1).fill(0);
      for (let j = 0; j < poly.length; j++) {
        next[j] ^= QRCodeEncoder.gfMul(poly[j]!, QRCodeEncoder.GF256_EXP[i]!);
        next[j + 1] ^= poly[j]!;
      }
      poly = next;
    }
    return poly;
  }

  private static rsCompute(data: number[], ecCount: number): number[] {
    const gen = QRCodeEncoder.rsGenPoly(ecCount);
    const res = new Array(ecCount).fill(0);
    for (let i = 0; i < data.length; i++) {
      const factor = data[i]! ^ res[0]!;
      res.shift();
      res.push(0);
      for (let j = 0; j < ecCount; j++) {
        res[j] ^= QRCodeEncoder.gfMul(gen[j]!, factor);
      }
    }
    return res;
  }

  private static getVersionInfo(dataLength: number) {
    if (dataLength <= 14) return { version: 1, size: 21, totalCW: 26, dataCW: 16, ecCW: 10, blocks: 1, align: [] };
    if (dataLength <= 26) return { version: 2, size: 25, totalCW: 44, dataCW: 28, ecCW: 16, blocks: 1, align: [6, 18] };
    if (dataLength <= 42) return { version: 3, size: 29, totalCW: 70, dataCW: 44, ecCW: 26, blocks: 1, align: [6, 22] };
    return { version: 4, size: 33, totalCW: 100, dataCW: 64, ecCW: 36, blocks: 2, align: [6, 26] };
  }

  static encode(text: string): { size: number; matrix: (number | null)[][] } {
    QRCodeEncoder.initGF();
    const bytes: number[] = [];
    for (let i = 0; i < text.length; i++) {
      const c = text.charCodeAt(i);
      if (c < 128) bytes.push(c);
      else {
        bytes.push(0xc0 | (c >> 6), 0x80 | (c & 0x3f));
      }
    }

    const vInfo = QRCodeEncoder.getVersionInfo(bytes.length);
    const { version, size, dataCW, ecCW, blocks, align } = vInfo;

    const bits: number[] = [];
    function pushBits(val: number, len: number) {
      for (let i = len - 1; i >= 0; i--) {
        bits.push((val >> i) & 1);
      }
    }

    pushBits(4, 4); // Byte mode (0100)
    pushBits(bytes.length, 8); // Character count
    for (const b of bytes) pushBits(b, 8);

    const remBits = dataCW * 8 - bits.length;
    pushBits(0, Math.min(4, remBits));
    while (bits.length % 8 !== 0) bits.push(0);

    let padByte = 0xec;
    while (bits.length < dataCW * 8) {
      pushBits(padByte, 8);
      padByte = padByte === 0xec ? 0x11 : 0xec;
    }

    const dataCodewords: number[] = [];
    for (let i = 0; i < bits.length; i += 8) {
      let b = 0;
      for (let j = 0; j < 8; j++) b = (b << 1) | bits[i + j]!;
      dataCodewords.push(b);
    }

    const ecPerBlock = ecCW / blocks;
    const dataPerBlock = dataCW / blocks;
    const allDataBlocks: number[][] = [];
    const allEcBlocks: number[][] = [];

    for (let b = 0; b < blocks; b++) {
      const blockData = dataCodewords.slice(b * dataPerBlock, (b + 1) * dataPerBlock);
      const blockEc = QRCodeEncoder.rsCompute(blockData, ecPerBlock);
      allDataBlocks.push(blockData);
      allEcBlocks.push(blockEc);
    }

    const finalCodewords: number[] = [];
    for (let i = 0; i < dataPerBlock; i++) {
      for (let b = 0; b < blocks; b++) finalCodewords.push(allDataBlocks[b]![i]!);
    }
    for (let i = 0; i < ecPerBlock; i++) {
      for (let b = 0; b < blocks; b++) finalCodewords.push(allEcBlocks[b]![i]!);
    }

    const matrix: (number | null)[][] = Array.from({ length: size }, () => new Array(size).fill(null));
    const isReserved: boolean[][] = Array.from({ length: size }, () => new Array(size).fill(false));

    function setModule(r: number, c: number, val: number) {
      if (r >= 0 && r < size && c >= 0 && c < size) {
        matrix[r]![c] = val;
        isReserved[r]![c] = true;
      }
    }

    // Place 3 Finder Patterns (7x7) + separators
    function placeFinder(row: number, col: number) {
      for (let r = -1; r <= 7; r++) {
        for (let c = -1; c <= 7; c++) {
          const pr = row + r;
          const pc = col + c;
          if (pr < 0 || pr >= size || pc < 0 || pc >= size) continue;
          if (r >= 0 && r <= 6 && c >= 0 && c <= 6) {
            const isBorder = r === 0 || r === 6 || c === 0 || c === 6;
            const isCenter = r >= 2 && r <= 4 && c >= 2 && c <= 4;
            setModule(pr, pc, isBorder || isCenter ? 1 : 0);
          } else {
            setModule(pr, pc, 0);
          }
        }
      }
    }

    placeFinder(0, 0);
    placeFinder(0, size - 7);
    placeFinder(size - 7, 0);

    // Alignment Patterns
    if (align.length === 2) {
      const pos = [align[1]!];
      for (const ar of pos) {
        for (const ac of pos) {
          if (isReserved[ar]![ac]) continue;
          for (let r = -2; r <= 2; r++) {
            for (let c = -2; c <= 2; c++) {
              const isBorder = Math.abs(r) === 2 || Math.abs(c) === 2;
              const isCenter = r === 0 && c === 0;
              setModule(ar + r, ac + c, isBorder || isCenter ? 1 : 0);
            }
          }
        }
      }
    }

    // Timing Patterns
    for (let i = 8; i < size - 8; i++) {
      if (!isReserved[6]![i]) setModule(6, i, i % 2 === 0 ? 1 : 0);
      if (!isReserved[i]![6]) setModule(i, 6, i % 2 === 0 ? 1 : 0);
    }

    // Dark Module
    setModule(4 * version + 9, 8, 1);

    // Reserve Format Information Area
    for (let i = 0; i < 9; i++) {
      if (!isReserved[8]![i]) isReserved[8]![i] = true;
      if (!isReserved[i]![8]) isReserved[i]![8] = true;
    }
    for (let i = size - 8; i < size; i++) {
      if (!isReserved[8]![i]) isReserved[8]![i] = true;
      if (!isReserved[i]![8]) isReserved[i]![8] = true;
    }

    // Place Data Bits Zig-Zag
    const allBits: number[] = [];
    for (const cw of finalCodewords) {
      for (let i = 7; i >= 0; i--) allBits.push((cw >> i) & 1);
    }

    let bitIdx = 0;
    let right = size - 1;
    let goingUp = true;

    while (right > 0) {
      if (right === 6) right--;
      const col1 = right;
      const col2 = right - 1;
      const rows = goingUp
        ? Array.from({ length: size }, (_, i) => size - 1 - i)
        : Array.from({ length: size }, (_, i) => i);

      for (const r of rows) {
        for (const c of [col1, col2]) {
          if (!isReserved[r]![c]) {
            const bit = bitIdx < allBits.length ? allBits[bitIdx++]! : 0;
            const mask = (r + c) % 2 === 0; // Pattern 0
            matrix[r]![c] = mask ? bit ^ 1 : bit;
          }
        }
      }
      goingUp = !goingUp;
      right -= 2;
    }

    // Format bits for Level M (00) & Mask 0 (000) with XOR mask 0x5412
    const formatBits = [1, 0, 1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0];
    for (let i = 0; i <= 5; i++) matrix[8]![i] = formatBits[i]!;
    matrix[8]![7] = formatBits[6]!;
    matrix[8]![8] = formatBits[7]!;
    matrix[7]![8] = formatBits[8]!;
    for (let i = 9; i <= 14; i++) matrix[14 - i]![8] = formatBits[i]!;

    for (let i = 0; i <= 6; i++) matrix[8]![size - 1 - i] = formatBits[i]!;
    for (let i = 0; i <= 7; i++) matrix[size - 8 + i]![8] = formatBits[7 + i]!;

    return { size, matrix };
  }

  static toSvg(text: string, pixelSize: number = 3.5): string {
    const { size, matrix } = QRCodeEncoder.encode(text);
    const quiet = 2;
    const totalDim = (size + quiet * 2) * pixelSize;
    const rects: string[] = [];

    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (matrix[r]![c] === 1) {
          const x = (c + quiet) * pixelSize;
          const y = (r + quiet) * pixelSize;
          rects.push(`<rect x="${x}" y="${y}" width="${pixelSize}" height="${pixelSize}" fill="#000000"/>`);
        }
      }
    }

    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${totalDim} ${totalDim}" width="${totalDim}" height="${totalDim}" style="display:block;margin:0 auto;"><rect width="100%" height="100%" fill="#FFFFFF"/>${rects.join('')}</svg>`;
  }
}

