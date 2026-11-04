/**
 * ESC/POS Thermal Receipt Printer Command Engine (58mm & 80mm)
 * Engineered for high-throughput OPD Kiosks, Pharmacy POS Counters, and Lab Accession Desks.
 */

export interface ThermalReceiptItem {
  name: string;
  batch?: string;
  qty: number;
  rate: number;
  amount: number;
}

export interface OpdTokenReceiptParams {
  hospitalName: string;
  facilityAddress?: string;
  tokenNumber: string;
  doctorName: string;
  department: string;
  patientName: string;
  uhid: string;
  queueTime?: string;
  qrPayload?: string;
  paperWidthMm?: 58 | 80;
}

export interface PharmacyCashSlipParams {
  hospitalName: string;
  pharmacyName?: string;
  dlNumber?: string;
  gstNumber?: string;
  billNumber: string;
  date?: string;
  patientName: string;
  uhid: string;
  doctorName?: string;
  items: ThermalReceiptItem[];
  subTotal: number;
  discount?: number;
  taxAmount?: number;
  totalAmount: number;
  paymentMethod?: string;
  pharmacistName?: string;
  paperWidthMm?: 58 | 80;
}

export interface LabAccessionReceiptParams {
  hospitalName: string;
  accessionNumber: string;
  uhid: string;
  patientName: string;
  ageGender?: string;
  tests: string[];
  collectionTime?: string;
  phlebotomistName?: string;
  paperWidthMm?: 58 | 80;
}

export class EscPosThermalPrinterService {
  // ESC/POS Protocol Constants
  private static readonly ESC = 0x1b;
  private static readonly GS = 0x1d;

  // Formatting Primitives
  private static readonly CMD_INIT = Buffer.from([EscPosThermalPrinterService.ESC, 0x40]); // ESC @
  private static readonly CMD_ALIGN_LEFT = Buffer.from([EscPosThermalPrinterService.ESC, 0x61, 0x00]); // ESC a 0
  private static readonly CMD_ALIGN_CENTER = Buffer.from([EscPosThermalPrinterService.ESC, 0x61, 0x01]); // ESC a 1
  private static readonly CMD_ALIGN_RIGHT = Buffer.from([EscPosThermalPrinterService.ESC, 0x61, 0x02]); // ESC a 2
  private static readonly CMD_BOLD_ON = Buffer.from([EscPosThermalPrinterService.ESC, 0x45, 0x01]); // ESC E 1
  private static readonly CMD_BOLD_OFF = Buffer.from([EscPosThermalPrinterService.ESC, 0x45, 0x00]); // ESC E 0
  private static readonly CMD_DOUBLE_ON = Buffer.from([EscPosThermalPrinterService.ESC, 0x21, 0x30]); // ESC ! 0x30
  private static readonly CMD_DOUBLE_HEIGHT = Buffer.from([EscPosThermalPrinterService.ESC, 0x21, 0x10]); // ESC ! 0x10
  private static readonly CMD_NORMAL = Buffer.from([EscPosThermalPrinterService.ESC, 0x21, 0x00]); // ESC ! 0
  private static readonly CMD_FEED_AND_CUT = Buffer.from([EscPosThermalPrinterService.GS, 0x56, 0x41, 0x03]); // GS V A 3 lines feed then cut

  /**
   * Generates a high-resolution raw ESC/POS byte stream for OPD Consultation Queue Token
   */
  public generateOpdToken(params: OpdTokenReceiptParams): Buffer {
    const width = params.paperWidthMm || 80;
    const lineWidth = width === 58 ? 32 : 48;
    const divider = '-'.repeat(lineWidth) + '\n';
    const doubleDivider = '='.repeat(lineWidth) + '\n';
    const chunks: Buffer[] = [EscPosThermalPrinterService.CMD_INIT];

    // Header: Center aligned, bold hospital name
    chunks.push(EscPosThermalPrinterService.CMD_ALIGN_CENTER);
    chunks.push(EscPosThermalPrinterService.CMD_BOLD_ON);
    chunks.push(Buffer.from(params.hospitalName + '\n', 'utf8'));
    chunks.push(EscPosThermalPrinterService.CMD_BOLD_OFF);

    if (params.facilityAddress) {
      chunks.push(Buffer.from(params.facilityAddress + '\n', 'utf8'));
    }
    chunks.push(Buffer.from(doubleDivider, 'utf8'));

    // Department Header
    chunks.push(Buffer.from(`OPD CONSULTATION TOKEN\nDEPARTMENT: ${params.department.toUpperCase()}\n`, 'utf8'));
    chunks.push(Buffer.from(divider, 'utf8'));

    // Giant Token Callout
    chunks.push(Buffer.from('YOUR TOKEN NUMBER\n', 'utf8'));
    chunks.push(EscPosThermalPrinterService.CMD_DOUBLE_ON);
    chunks.push(EscPosThermalPrinterService.CMD_BOLD_ON);
    chunks.push(Buffer.from(`[ ${params.tokenNumber} ]\n`, 'utf8'));
    chunks.push(EscPosThermalPrinterService.CMD_NORMAL);
    chunks.push(EscPosThermalPrinterService.CMD_BOLD_OFF);
    chunks.push(Buffer.from(divider, 'utf8'));

    // Doctor & Patient details (Left Aligned)
    chunks.push(EscPosThermalPrinterService.CMD_ALIGN_LEFT);
    chunks.push(Buffer.from(`Doctor   : ${params.doctorName}\n`, 'utf8'));
    chunks.push(Buffer.from(`Patient  : ${params.patientName}\n`, 'utf8'));
    chunks.push(Buffer.from(`UHID     : ${params.uhid}\n`, 'utf8'));
    chunks.push(Buffer.from(`Issued At: ${params.queueTime || new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}\n`, 'utf8'));
    chunks.push(Buffer.from(divider, 'utf8'));

    // Instructions & QR Code
    chunks.push(EscPosThermalPrinterService.CMD_ALIGN_CENTER);
    chunks.push(Buffer.from('Scan QR on Live Patient App for Live Queue ETA\n', 'utf8'));
    if (params.qrPayload) {
      chunks.push(this.renderQrCodeEscPos(params.qrPayload));
    }

    chunks.push(Buffer.from('\nPlease proceed to waiting area when called.\nThank you for choosing DocSearch Health Network.\n\n', 'utf8'));
    chunks.push(EscPosThermalPrinterService.CMD_FEED_AND_CUT);

    return Buffer.concat(chunks);
  }

  /**
   * Generates an official Pharmacy Tax Invoice & Cash Dispense Slip
   */
  public generatePharmacyCashSlip(params: PharmacyCashSlipParams): Buffer {
    const width = params.paperWidthMm || 80;
    const lineWidth = width === 58 ? 32 : 48;
    const divider = '-'.repeat(lineWidth) + '\n';
    const doubleDivider = '='.repeat(lineWidth) + '\n';
    const chunks: Buffer[] = [EscPosThermalPrinterService.CMD_INIT];

    // Header
    chunks.push(EscPosThermalPrinterService.CMD_ALIGN_CENTER);
    chunks.push(EscPosThermalPrinterService.CMD_BOLD_ON);
    chunks.push(Buffer.from(params.hospitalName + '\n', 'utf8'));
    if (params.pharmacyName) {
      chunks.push(Buffer.from(params.pharmacyName + '\n', 'utf8'));
    }
    chunks.push(EscPosThermalPrinterService.CMD_BOLD_OFF);

    if (params.dlNumber || params.gstNumber) {
      chunks.push(Buffer.from(`DL: ${params.dlNumber || 'DL-2026/PHARM-01'} | GST: ${params.gstNumber || 'GSTIN29AAAAA0000A1Z5'}\n`, 'utf8'));
    }
    chunks.push(Buffer.from(doubleDivider, 'utf8'));
    chunks.push(Buffer.from('RETAIL PHARMACY TAX INVOICE\n', 'utf8'));
    chunks.push(Buffer.from(divider, 'utf8'));

    // Meta details
    chunks.push(EscPosThermalPrinterService.CMD_ALIGN_LEFT);
    chunks.push(Buffer.from(`Bill No : ${params.billNumber}\n`, 'utf8'));
    chunks.push(Buffer.from(`Date    : ${params.date || new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}\n`, 'utf8'));
    chunks.push(Buffer.from(`Patient : ${params.patientName} (${params.uhid})\n`, 'utf8'));
    if (params.doctorName) {
      chunks.push(Buffer.from(`Presc.By: ${params.doctorName}\n`, 'utf8'));
    }
    chunks.push(Buffer.from(divider, 'utf8'));

    // Table Header
    if (width === 80) {
      chunks.push(Buffer.from(this.padRight('Item Description', 22) + this.padRight('Batch', 10) + this.padRight('Qty', 6) + this.padLeft('Amount', 10) + '\n', 'utf8'));
    } else {
      chunks.push(Buffer.from(this.padRight('Item', 14) + this.padRight('Qty', 5) + this.padLeft('Amt(Rs)', 13) + '\n', 'utf8'));
    }
    chunks.push(Buffer.from(divider, 'utf8'));

    // Items
    for (const item of params.items) {
      if (width === 80) {
        const name = item.name.length > 21 ? item.name.slice(0, 20) + '.' : item.name;
        const batch = (item.batch || '-').slice(0, 9);
        chunks.push(Buffer.from(
          this.padRight(name, 22) +
          this.padRight(batch, 10) +
          this.padRight(String(item.qty), 6) +
          this.padLeft(item.amount.toFixed(2), 10) + '\n',
          'utf8'
        ));
      } else {
        const name = item.name.length > 13 ? item.name.slice(0, 12) + '.' : item.name;
        chunks.push(Buffer.from(
          this.padRight(name, 14) +
          this.padRight(String(item.qty), 5) +
          this.padLeft(item.amount.toFixed(2), 13) + '\n',
          'utf8'
        ));
      }
    }
    chunks.push(Buffer.from(divider, 'utf8'));

    // Totals
    chunks.push(EscPosThermalPrinterService.CMD_ALIGN_RIGHT);
    chunks.push(Buffer.from(`Sub Total: Rs. ${params.subTotal.toFixed(2)}\n`, 'utf8'));
    if (params.discount) {
      chunks.push(Buffer.from(`Discount: -Rs. ${params.discount.toFixed(2)}\n`, 'utf8'));
    }
    if (params.taxAmount) {
      chunks.push(Buffer.from(`GST (CGST+SGST): Rs. ${params.taxAmount.toFixed(2)}\n`, 'utf8'));
    }

    chunks.push(EscPosThermalPrinterService.CMD_BOLD_ON);
    chunks.push(EscPosThermalPrinterService.CMD_DOUBLE_HEIGHT);
    chunks.push(Buffer.from(`NET PAYABLE: Rs. ${params.totalAmount.toFixed(2)}\n`, 'utf8'));
    chunks.push(EscPosThermalPrinterService.CMD_NORMAL);
    chunks.push(EscPosThermalPrinterService.CMD_BOLD_OFF);
    chunks.push(Buffer.from(doubleDivider, 'utf8'));

    // Footer
    chunks.push(EscPosThermalPrinterService.CMD_ALIGN_CENTER);
    chunks.push(Buffer.from(`Payment Mode: ${params.paymentMethod || 'UPI / CASHLESS QR'}\n`, 'utf8'));
    if (params.pharmacistName) {
      chunks.push(Buffer.from(`Dispensed By: ${params.pharmacistName} (Regd. Pharmacist)\n`, 'utf8'));
    }
    chunks.push(Buffer.from('Goods once sold cannot be taken back or exchanged.\nSchedule H/H1 drugs dispensed strictly on valid prescription.\n\n', 'utf8'));
    chunks.push(EscPosThermalPrinterService.CMD_FEED_AND_CUT);

    return Buffer.concat(chunks);
  }

  /**
   * Generates a Laboratory Accession & Phlebotomy Specimen Handover Slip
   */
  public generateLabAccessionSlip(params: LabAccessionReceiptParams): Buffer {
    const width = params.paperWidthMm || 80;
    const lineWidth = width === 58 ? 32 : 48;
    const divider = '-'.repeat(lineWidth) + '\n';
    const chunks: Buffer[] = [EscPosThermalPrinterService.CMD_INIT];

    chunks.push(EscPosThermalPrinterService.CMD_ALIGN_CENTER);
    chunks.push(EscPosThermalPrinterService.CMD_BOLD_ON);
    chunks.push(Buffer.from(params.hospitalName + '\n', 'utf8'));
    chunks.push(Buffer.from('CENTRAL PATHOLOGY & LIMS ACCESSION SLIP\n', 'utf8'));
    chunks.push(EscPosThermalPrinterService.CMD_BOLD_OFF);
    chunks.push(Buffer.from(divider, 'utf8'));

    chunks.push(EscPosThermalPrinterService.CMD_ALIGN_LEFT);
    chunks.push(Buffer.from(`Accession #: ${params.accessionNumber}\n`, 'utf8'));
    chunks.push(Buffer.from(`Patient    : ${params.patientName} (${params.ageGender || 'Adult'})\n`, 'utf8'));
    chunks.push(Buffer.from(`UHID       : ${params.uhid}\n`, 'utf8'));
    chunks.push(Buffer.from(`Collected  : ${params.collectionTime || new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}\n`, 'utf8'));
    if (params.phlebotomistName) {
      chunks.push(Buffer.from(`Collector  : ${params.phlebotomistName}\n`, 'utf8'));
    }
    chunks.push(Buffer.from(divider, 'utf8'));

    chunks.push(EscPosThermalPrinterService.CMD_BOLD_ON);
    chunks.push(Buffer.from('Booked Diagnostic Tests:\n', 'utf8'));
    chunks.push(EscPosThermalPrinterService.CMD_BOLD_OFF);
    params.tests.forEach((t, i) => {
      chunks.push(Buffer.from(` ${i + 1}. ${t}\n`, 'utf8'));
    });
    chunks.push(Buffer.from(divider, 'utf8'));

    chunks.push(EscPosThermalPrinterService.CMD_ALIGN_CENTER);
    chunks.push(Buffer.from('Accession Barcode\n', 'utf8'));
    chunks.push(this.renderCode128BarcodeEscPos(params.accessionNumber));
    chunks.push(Buffer.from('\nReports available online on Patient App in Meri Parchi.\n\n', 'utf8'));
    chunks.push(EscPosThermalPrinterService.CMD_FEED_AND_CUT);

    return Buffer.concat(chunks);
  }

  // Raw ESC/POS QR Code Raster Generator (Model 2, Error Correction Level M)
  private renderQrCodeEscPos(data: string): Buffer {
    const dataBytes = Buffer.from(data, 'utf8');
    const pL = (dataBytes.length + 3) % 256;
    const pH = Math.floor((dataBytes.length + 3) / 256);

    const init = Buffer.from([
      0x1d, 0x28, 0x6b, 0x04, 0x00, 0x31, 0x41, 0x32, 0x00, // Select QR model 2
      0x1d, 0x28, 0x6b, 0x03, 0x00, 0x31, 0x43, 0x06,       // Module size 6
      0x1d, 0x28, 0x6b, 0x03, 0x00, 0x31, 0x45, 0x31        // Error correction Level M
    ]);

    const storeHeader = Buffer.from([0x1d, 0x28, 0x6b, pL, pH, 0x31, 0x50, 0x30]);
    const print = Buffer.from([0x1d, 0x28, 0x6b, 0x03, 0x00, 0x31, 0x51, 0x30]);

    return Buffer.concat([init, storeHeader, dataBytes, print]);
  }

  // Raw ESC/POS Code128 Barcode Generator
  private renderCode128BarcodeEscPos(data: string): Buffer {
    const dataBytes = Buffer.from(`{B${data}`, 'utf8');
    const header = Buffer.from([
      0x1d, 0x68, 0x48,       // Height = 72 dots
      0x1d, 0x77, 0x02,       // Width multiplier = 2
      0x1d, 0x48, 0x02,       // Print HRI below barcode
      0x1d, 0x6b, 0x49, dataBytes.length // GS k 73 (Code128)
    ]);
    return Buffer.concat([header, dataBytes]);
  }

  private padRight(str: string, length: number): string {
    return str.length >= length ? str.slice(0, length) : str + ' '.repeat(length - str.length);
  }

  private padLeft(str: string, length: number): string {
    return str.length >= length ? str.slice(0, length) : ' '.repeat(length - str.length) + str;
  }
}

export const escPosThermalPrinterService = new EscPosThermalPrinterService();
