/**
 * DOC SEARCH ESC/POS Thermal Printer Direct Byte Engine
 * Supports 58mm (32 chars) and 80mm (48 chars) thermal receipt printers,
 * bold styling, text alignment, two-column layouts, standard NPCI UPI QR byte streaming,
 * and standard GS V 66 0 paper auto-cutting.
 */

export type RollWidth = '58mm' | '80mm';

export interface EscPosOptions {
  rollWidth?: RollWidth;
  feedLines?: number;
}

export interface OpdTokenSlipData {
  facilityName: string;
  facilityAddress?: string;
  facilityPhone?: string;
  departmentName?: string;
  tokenNumber: string;
  queueDate?: string;
  printedAt?: string;
  uhid?: string;
  patientName: string;
  patientAgeGender?: string;
  doctorName?: string;
  roomNumber?: string;
  queuePosition?: number;
  estimatedWaitMinutes?: number;
  consultationFee?: number;
  paymentMode?: string;
  upiQrString?: string;
  qrPayload?: string;
  footerNote?: string;
}

export interface InvoiceSlipData {
  facilityName: string;
  facilityAddress?: string | undefined;
  facilityPhone?: string | undefined;
  facilityGstin?: string | undefined;
  invoiceNumber: string;
  invoiceDate?: string | undefined;
  date?: string | undefined;
  customerName?: string | undefined;
  patientName?: string | undefined;
  patientPhone?: string | undefined;
  items: Array<{ name?: string | undefined; description?: string | undefined; qty: number; rate?: number | undefined; amount: number }>;
  subtotal?: number | undefined;
  totalAmount?: number | undefined;
  grandTotal?: number | undefined;
  discount?: number | undefined;
  tax?: number | undefined;
  netPayable?: number | undefined;
  paidAmount?: number | undefined;
  balanceDue?: number | undefined;
  paymentMode?: string | undefined;
  upiQrString?: string | undefined;
  qrPayload?: string | undefined;
  cashierName?: string | undefined;
}

export class EscPosReceiptBuilder {
  private bytes: number[] = [];
  private readonly rollWidth: RollWidth;
  private readonly charsPerLine: number;

  constructor(rollWidth: RollWidth = '80mm') {
    this.rollWidth = rollWidth;
    this.charsPerLine = rollWidth === '58mm' ? 32 : 48;
    this.initialize();
  }

  public getRollWidth(): RollWidth {
    return this.rollWidth;
  }

  public initialize(): this {
    // ESC @ : Initialize printer
    this.bytes.push(0x1B, 0x40);
    return this;
  }

  public align(alignment: 'LEFT' | 'CENTER' | 'RIGHT'): this {
    // ESC a n
    const code = alignment === 'CENTER' ? 0x01 : alignment === 'RIGHT' ? 0x02 : 0x00;
    this.bytes.push(0x1B, 0x61, code);
    return this;
  }

  public bold(enable: boolean = true): this {
    // ESC E n
    this.bytes.push(0x1B, 0x45, enable ? 0x01 : 0x00);
    return this;
  }

  public doubleSize(enable: boolean = true): this {
    // ESC ! n (0x30 for double height & width, 0x00 for normal)
    this.bytes.push(0x1B, 0x21, enable ? 0x30 : 0x00);
    return this;
  }

  public doubleHeight(enable: boolean = true): this {
    // ESC ! n (0x10 for double height)
    this.bytes.push(0x1B, 0x21, enable ? 0x10 : 0x00);
    return this;
  }

  public text(str: string): this {
    const encoder = new TextEncoder();
    const encoded = encoder.encode(str);
    for (const b of encoded) {
      this.bytes.push(b);
    }
    return this;
  }

  public line(str: string = ''): this {
    this.text(str);
    this.bytes.push(0x0A); // LF
    return this;
  }

  public divider(char: string = '-'): this {
    const lineStr = char.repeat(this.charsPerLine).slice(0, this.charsPerLine);
    return this.line(lineStr);
  }

  public twoColumn(left: string = '', right: string = ''): this {
    const lStr = String(left ?? '');
    const rStr = String(right ?? '');
    const total = this.charsPerLine;
    const rightLen = rStr.length;
    const maxLeftLen = Math.max(0, total - rightLen - 1);
    const leftTrimmed = lStr.slice(0, maxLeftLen);
    const spacesNeeded = Math.max(1, total - leftTrimmed.length - rightLen);
    const lineText = leftTrimmed + ' '.repeat(spacesNeeded) + rStr;
    return this.line(lineText);
  }

  public feed(lines: number = 2): this {
    // ESC d n
    this.bytes.push(0x1B, 0x64, Math.max(1, Math.min(lines, 10)));
    return this;
  }

  public cut(feedFirst: boolean = true): this {
    if (feedFirst) {
      this.feed(3);
    }
    // GS V 66 0 : Feed and cut paper
    this.bytes.push(0x1D, 0x56, 0x42, 0x00);
    return this;
  }

  public qrCode(content: string, size: number = 6): this {
    if (!content) return this;

    const data = new TextEncoder().encode(content);
    const len = data.length + 3;
    const pL = len % 256;
    const pH = Math.floor(len / 256);

    // 1. Model: QR Code Model 2 (GS ( k 04 00 31 41 32 00)
    this.bytes.push(0x1D, 0x28, 0x6B, 0x04, 0x00, 0x31, 0x41, 0x32, 0x00);

    // 2. Module Size: (GS ( k 03 00 31 43 n)
    const clampedSize = Math.max(1, Math.min(size, 16));
    this.bytes.push(0x1D, 0x28, 0x6B, 0x03, 0x00, 0x31, 0x43, clampedSize);

    // 3. Error Correction Level: Level M (approx 15%)
    this.bytes.push(0x1D, 0x28, 0x6B, 0x03, 0x00, 0x31, 0x45, 0x31);

    // 4. Store Data: (GS ( k pL pH 31 50 30 d1...dk)
    this.bytes.push(0x1D, 0x28, 0x6B, pL, pH, 0x31, 0x50, 0x30);
    for (const b of data) {
      this.bytes.push(b);
    }

    // 5. Print Symbol: (GS ( k 03 00 31 51 30)
    this.bytes.push(0x1D, 0x28, 0x6B, 0x03, 0x00, 0x31, 0x51, 0x30);
    this.line();
    return this;
  }

  public toUint8Array(): Uint8Array {
    return new Uint8Array(this.bytes);
  }

  public toBase64(): string {
    const u8 = this.toUint8Array();
    let binary = '';
    for (let i = 0; i < u8.length; i++) {
      binary += String.fromCharCode(u8[i]!);
    }
    return btoa(binary);
  }

  public toHex(): string {
    return this.bytes.map((b) => b.toString(16).padStart(2, '0')).join('');
  }
}

/**
 * Standard Token Slip Raw ESC/POS Byte Generator
 */
export function generateOpdTokenSlipBytes(
  slip: OpdTokenSlipData,
  options?: EscPosOptions | RollWidth
): Uint8Array {
  const width: RollWidth = typeof options === 'string' ? options : options?.rollWidth || '80mm';
  const b = new EscPosReceiptBuilder(width);

  b.align('CENTER')
    .bold(true)
    .doubleHeight(true)
    .line(slip.facilityName)
    .doubleHeight(false)
    .bold(false);

  if (slip.facilityAddress) {
    b.line(slip.facilityAddress);
  }
  if (slip.facilityPhone) {
    b.line(`Tel: ${slip.facilityPhone}`);
  }

  b.divider('=');

  // Token Number in Double Size Callout
  b.align('CENTER')
    .line('OPD QUEUE TOKEN')
    .bold(true)
    .doubleSize(true)
    .line(slip.tokenNumber)
    .doubleSize(false)
    .bold(false);

  if (slip.departmentName) {
    b.line(slip.departmentName);
  }

  b.divider('-');

  // Patient & Consultation details
  const dateStr = slip.queueDate || slip.printedAt || new Date().toLocaleString();
  b.align('LEFT')
    .twoColumn('Date & Time:', dateStr)
    .twoColumn('Patient:', slip.patientName);

  if (slip.uhid) {
    b.twoColumn('UHID:', slip.uhid);
  }

  if (slip.patientAgeGender) {
    b.twoColumn('Age/Gender:', slip.patientAgeGender);
  }

  if (slip.doctorName) {
    b.twoColumn('Consultant:', slip.doctorName);
  }

  if (slip.roomNumber) {
    b.twoColumn('Chamber/Room:', slip.roomNumber);
  }

  if (slip.queuePosition !== undefined) {
    b.twoColumn('Queue Pos:', `#${slip.queuePosition}`);
  }

  if (slip.estimatedWaitMinutes !== undefined) {
    b.twoColumn('Est. Wait:', `${slip.estimatedWaitMinutes} mins`);
  }

  if (slip.consultationFee !== undefined) {
    b.twoColumn('Consultation Fee:', `Rs. ${slip.consultationFee.toFixed(2)}`);
  }

  if (slip.paymentMode) {
    b.twoColumn('Payment Mode:', slip.paymentMode);
  }

  b.divider('-');

  // Dynamic UPI QR code if provided
  const qrString = slip.upiQrString || slip.qrPayload;
  if (qrString) {
    b.align('CENTER')
      .line(qrString.startsWith('upi://') ? 'Scan to Pay via UPI:' : 'Scan to Track Token Queue:')
      .qrCode(qrString, width === '58mm' ? 4 : 6)
      .line();
  }

  const feedCount = typeof options === 'object' && options?.feedLines ? options.feedLines : 3;
  b.align('CENTER')
    .line(slip.footerNote || 'Please wait for your token on the display screen.')
    .line('Thank you!')
    .feed(feedCount)
    .cut(false);

  return b.toUint8Array();
}

/**
 * Standard Invoice Receipt Raw ESC/POS Byte Generator
 */
export function generateInvoiceReceiptBytes(
  invoice: InvoiceSlipData,
  options?: EscPosOptions | RollWidth
): Uint8Array {
  const width: RollWidth = typeof options === 'string' ? options : options?.rollWidth || '80mm';
  const b = new EscPosReceiptBuilder(width);

  b.align('CENTER')
    .bold(true)
    .doubleHeight(true)
    .line(invoice.facilityName)
    .doubleHeight(false)
    .bold(false);

  if (invoice.facilityAddress) {
    b.line(invoice.facilityAddress);
  }
  if (invoice.facilityGstin) {
    b.line(`GSTIN: ${invoice.facilityGstin}`);
  }

  b.line('TAX INVOICE / RECEIPT')
    .divider('=');

  const invDate = invoice.date || invoice.invoiceDate || new Date().toLocaleDateString();
  const custName = invoice.customerName || invoice.patientName || 'Walk-in Patient';

  b.align('LEFT')
    .twoColumn('Invoice No:', invoice.invoiceNumber)
    .twoColumn('Date:', invDate)
    .twoColumn('Customer/Patient:', custName);

  if (invoice.patientPhone) {
    b.twoColumn('Phone:', invoice.patientPhone);
  }

  b.divider('-');

  // Item List
  for (const it of invoice.items) {
    const itemName = it.name || it.description || 'Service';
    b.twoColumn(`${itemName} x${it.qty}`, `Rs. ${it.amount.toFixed(2)}`);
  }

  b.divider('-');

  const total = invoice.totalAmount ?? invoice.subtotal ?? invoice.grandTotal ?? 0;
  b.twoColumn('Total:', `Rs. ${total.toFixed(2)}`);

  if (invoice.discount && invoice.discount > 0) {
    b.twoColumn('Discount:', `-Rs. ${invoice.discount.toFixed(2)}`);
  }
  if (invoice.tax && invoice.tax > 0) {
    b.twoColumn('GST/Tax:', `Rs. ${invoice.tax.toFixed(2)}`);
  }

  const payable = invoice.netPayable ?? invoice.grandTotal ?? total;
  b.bold(true)
    .twoColumn('NET PAYABLE:', `Rs. ${payable.toFixed(2)}`)
    .bold(false);

  if (invoice.paidAmount !== undefined) {
    b.twoColumn('Amount Paid:', `Rs. ${invoice.paidAmount.toFixed(2)}`);
  }
  if (invoice.balanceDue !== undefined) {
    b.twoColumn('Balance Due:', `Rs. ${invoice.balanceDue.toFixed(2)}`);
  }

  if (invoice.paymentMode) {
    b.twoColumn('Payment Mode:', invoice.paymentMode);
  }
  if (invoice.cashierName) {
    b.twoColumn('Collected By:', invoice.cashierName);
  }

  b.divider('-');

  const qr = invoice.upiQrString || invoice.qrPayload;
  if (qr) {
    b.align('CENTER')
      .line('Instant Digital Payment QR:')
      .qrCode(qr, width === '58mm' ? 4 : 6);
  }

  const feedCount = typeof options === 'object' && options?.feedLines ? options.feedLines : 3;
  b.align('CENTER')
    .line('Computer Generated Invoice')
    .line('Get Well Soon!')
    .feed(feedCount)
    .cut(false);

  return b.toUint8Array();
}
