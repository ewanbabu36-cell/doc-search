/**
 * Hardware Printer Service (DS-HW-901)
 *
 * Enterprise WebUSB / WebSerial raw ESC/POS command driver for thermal printers
 * (Epson, TVS Electronics, Citizen, Star Micronics, Xprinter, POS-58 / POS-80).
 *
 * Features:
 * - Silent 1-click thermal slip printing without OS print preview dialog popup
 * - ESC/POS command pipeline with silent paper cut (`GS V 0`)
 * - Multi-width paper support (58mm 32-col, 80mm 48-col)
 * - Automatic fallback to browser window.print() when hardware access is unavailable
 */

// WebUSB & WebSerial ambient definitions for non-DOM types
interface USBDevice {
  productName?: string | undefined;
  manufacturerName?: string | undefined;
  vendorId: number;
  productId: number;
  opened: boolean;
  open(): Promise<void>;
  close(): Promise<void>;
  selectConfiguration(configurationValue: number): Promise<void>;
  claimInterface(interfaceNumber: number): Promise<void>;
  releaseInterface(interfaceNumber: number): Promise<void>;
  configuration?: {
    interfaces: Array<{
      interfaceNumber: number;
      alternate: {
        endpoints: Array<{
          endpointNumber: number;
          direction: 'in' | 'out';
          type: 'bulk' | 'interrupt' | 'isochronous';
        }>;
      };
    }>;
  } | undefined;
  transferOut(endpointNumber: number, data: any): Promise<{ status: string; bytesWritten: number }>;
}

interface USBDeviceRequestOptions {
  filters: Array<{ vendorId?: number | undefined; productId?: number | undefined; classCode?: number | undefined }>;
}

interface USB {
  getDevices(): Promise<USBDevice[]>;
  requestDevice(options: USBDeviceRequestOptions): Promise<USBDevice>;
}

interface SerialPort {
  open(options: { baudRate: number }): Promise<void>;
  close(): Promise<void>;
  writable: WritableStream<Uint8Array> | null;
}

interface Serial {
  getPorts(): Promise<SerialPort[]>;
  requestPort(options?: { filters?: Array<{ usbVendorId?: number | undefined; usbProductId?: number | undefined }> } | undefined): Promise<SerialPort>;
}

export interface OpdTokenSlipData {
  tokenNumber: string;
  uhid: string;
  mrn: string;
  patientName: string;
  doctorName: string;
  department?: string | undefined;
  room: string;
  time: string;
  fee: number;
  paymentMode?: string | undefined;
  clinicName?: string | undefined;
  organizationName?: string | undefined;
  address?: string | undefined;
  contactNumber?: string | undefined;
}

export interface HardwarePrinterStatus {
  isWebUsbSupported: boolean;
  isWebSerialSupported: boolean;
  isConnected: boolean;
  activeConnectionType: 'usb' | 'serial' | 'none';
  deviceName?: string | undefined;
}

/**
 * Binary ESC/POS Command Pipeline Builder
 */
export class EscPosBuilder {
  private buffer: number[] = [];

  constructor() {
    this.init();
  }

  /** ESC @ - Initialize printer */
  init(): this {
    this.buffer.push(0x1B, 0x40);
    return this;
  }

  /** ESC a n - Alignment (0: Left, 1: Center, 2: Right) */
  align(alignment: 'left' | 'center' | 'right'): this {
    const val = alignment === 'center' ? 1 : alignment === 'right' ? 2 : 0;
    this.buffer.push(0x1B, 0x61, val);
    return this;
  }

  /** ESC E n - Emphasize (Bold) */
  bold(enable: boolean = true): this {
    this.buffer.push(0x1B, 0x45, enable ? 1 : 0);
    return this;
  }

  /** GS ! n - Character size selection */
  size(mode: 'normal' | 'double-height' | 'double-width' | 'double-both'): this {
    let byte = 0x00;
    if (mode === 'double-height') byte = 0x01;
    else if (mode === 'double-width') byte = 0x10;
    else if (mode === 'double-both') byte = 0x11;
    this.buffer.push(0x1D, 0x21, byte);
    return this;
  }

  /** Append raw text converted to standard 8-bit ASCII */
  text(str: string): this {
    // Replace rupee symbol and non-ascii with safe representation for standard ESC/POS character tables
    const safeStr = str.replace(/₹/g, 'Rs.');
    for (let i = 0; i < safeStr.length; i++) {
      const code = safeStr.charCodeAt(i);
      this.buffer.push(code < 256 ? code : 0x3F);
    }
    return this;
  }

  /** Text with trailing line feed */
  line(str: string = ''): this {
    this.text(str);
    this.buffer.push(0x0A);
    return this;
  }

  /** Feed lines */
  feed(lines: number = 3): this {
    this.buffer.push(0x1B, 0x64, Math.max(1, Math.min(lines, 10)));
    return this;
  }

  /** Divider rule */
  divider(width: number = 32, char: string = '-'): this {
    this.line(char.repeat(width));
    return this;
  }

  /** Two-column justify (e.g. Left Label .......... Right Value) */
  twoColumn(left: string, right: string, width: number = 32): this {
    const totalContent = left.length + right.length;
    if (totalContent >= width) {
      this.line(left);
      this.line(' '.repeat(Math.max(0, width - right.length)) + right);
    } else {
      const spaces = width - totalContent;
      this.line(left + ' '.repeat(spaces) + right);
    }
    return this;
  }

  /** Cash drawer pulse (Kick out drawer pin 2/5) */
  cashDrawer(): this {
    this.buffer.push(0x1B, 0x70, 0x00, 0x19, 0xFA);
    return this;
  }

  /** Silent 1-click token cut command (GS V 0 - full cut, GS V 1 - partial cut) */
  cut(partial: boolean = false): this {
    this.feed(3);
    this.buffer.push(0x1D, 0x56, partial ? 0x01 : 0x00);
    return this;
  }

  /** Export binary payload */
  build(): Uint8Array {
    return new Uint8Array(this.buffer);
  }
}

/**
 * Common POS Thermal Printer Vendor IDs for WebUSB discovery:
 * - 0x04b8: Epson
 * - 0x0fe6: TVS Electronics / Citizen
 * - 0x1504: TVS Electronics
 * - 0x1d90: Citizen
 * - 0x0547: Star Micronics
 * - 0x0416: Winbond / POS58 / POS80
 * - 0x0483: STMicroelectronics (Thermal Controller)
 * - 0x1fc9: NXP Semiconductors (USB POS)
 * - 0x0456: Analog Devices
 * - 0x1a86: QinHeng CH340 / USB-Serial POS
 */
const KNOWN_PRINTER_FILTERS: Array<{ vendorId: number }> = [
  { vendorId: 0x04b8 },
  { vendorId: 0x0fe6 },
  { vendorId: 0x1504 },
  { vendorId: 0x1d90 },
  { vendorId: 0x0547 },
  { vendorId: 0x0416 },
  { vendorId: 0x0483 },
  { vendorId: 0x1fc9 },
  { vendorId: 0x0456 },
  { vendorId: 0x1a86 }
];

export class HardwarePrinterService {
  private connectedUsbDevice: USBDevice | null = null;
  private connectedUsbEndpoint: number | null = null;
  private connectedSerialPort: SerialPort | null = null;
  private activeDeviceName: string | null = null;

  /**
   * Check if WebUSB API is supported by host browser
   */
  isWebUsbSupported(): boolean {
    return typeof navigator !== 'undefined' && 'usb' in navigator;
  }

  /**
   * Check if WebSerial API is supported by host browser
   */
  isWebSerialSupported(): boolean {
    return typeof navigator !== 'undefined' && 'serial' in navigator;
  }

  /**
   * Get live status of hardware printer driver
   */
  getStatus(): HardwarePrinterStatus {
    const isUsb = this.isWebUsbSupported();
    const isSerial = this.isWebSerialSupported();
    const isConnected = !!(this.connectedUsbDevice?.opened || this.connectedSerialPort);
    const activeConnectionType: 'usb' | 'serial' | 'none' = this.connectedUsbDevice?.opened
      ? 'usb'
      : this.connectedSerialPort
      ? 'serial'
      : 'none';

    return {
      isWebUsbSupported: isUsb,
      isWebSerialSupported: isSerial,
      isConnected,
      activeConnectionType,
      deviceName: this.activeDeviceName || undefined
    };
  }

  /**
   * Pair and open WebUSB thermal printer
   */
  async requestUsbPrinter(): Promise<boolean> {
    if (!this.isWebUsbSupported()) {
      throw new Error('WebUSB is not supported in this browser. Please use Chrome, Edge, or an updated Chromium browser.');
    }

    try {
      const usb = (navigator as unknown as { usb: USB }).usb;
      const device = await usb.requestDevice({
        filters: KNOWN_PRINTER_FILTERS
      });

      await device.open();
      if (device.configuration === null) {
        await device.selectConfiguration(1);
      }

      // Locate OUT endpoint on first active interface
      const interfaces = device.configuration?.interfaces || [];
      let foundEndpoint: number | null = null;
      let targetInterface = 0;

      for (const iface of interfaces) {
        for (const ep of iface.alternate.endpoints) {
          if (ep.direction === 'out' && ep.type === 'bulk') {
            foundEndpoint = ep.endpointNumber;
            targetInterface = iface.interfaceNumber;
            break;
          }
        }
        if (foundEndpoint !== null) break;
      }

      await device.claimInterface(targetInterface);

      this.connectedUsbDevice = device;
      this.connectedUsbEndpoint = foundEndpoint ?? 1;
      this.activeDeviceName = device.productName || device.manufacturerName || `Thermal Printer (VID: 0x${device.vendorId.toString(16)})`;

      return true;
    } catch (err) {
      console.warn('[HardwarePrinterService] WebUSB connection cancelled or failed:', err);
      return false;
    }
  }

  /**
   * Pair and open WebSerial thermal printer (RS-232 / USB-to-Serial virtual COM port)
   */
  async requestSerialPrinter(baudRate: number = 9600): Promise<boolean> {
    if (!this.isWebSerialSupported()) {
      throw new Error('WebSerial is not supported in this browser. Please use Chrome, Edge, or an updated Chromium browser.');
    }

    try {
      const serial = (navigator as unknown as { serial: Serial }).serial;
      const port = await serial.requestPort();
      await port.open({ baudRate });

      this.connectedSerialPort = port;
      this.activeDeviceName = `Serial Thermal Port (${baudRate} baud)`;
      return true;
    } catch (err) {
      console.warn('[HardwarePrinterService] WebSerial connection cancelled or failed:', err);
      return false;
    }
  }

  /**
   * Disconnect any paired hardware printer
   */
  async disconnect(): Promise<void> {
    if (this.connectedUsbDevice) {
      try {
        await this.connectedUsbDevice.close();
      } catch {
        // ignore
      }
      this.connectedUsbDevice = null;
      this.connectedUsbEndpoint = null;
    }

    if (this.connectedSerialPort) {
      try {
        await this.connectedSerialPort.close();
      } catch {
        // ignore
      }
      this.connectedSerialPort = null;
    }

    this.activeDeviceName = null;
  }

  /**
   * Send raw binary ESC/POS payload to connected printer
   */
  async printRaw(data: Uint8Array): Promise<{ success: boolean; method: 'webusb' | 'webserial'; bytesSent: number }> {
    // 1. Try WebUSB
    if (this.connectedUsbDevice && this.connectedUsbDevice.opened) {
      const ep = this.connectedUsbEndpoint ?? 1;
      const res = await this.connectedUsbDevice.transferOut(ep, data);
      return {
        success: res.status === 'ok',
        method: 'webusb',
        bytesSent: res.bytesWritten
      };
    }

    // 2. Try WebSerial
    if (this.connectedSerialPort && this.connectedSerialPort.writable) {
      const writer = this.connectedSerialPort.writable.getWriter();
      try {
        await writer.write(data);
        return {
          success: true,
          method: 'webserial',
          bytesSent: data.byteLength
        };
      } finally {
        writer.releaseLock();
      }
    }

    throw new Error('No active thermal printer connected. Pair a WebUSB or WebSerial device first.');
  }

  /**
   * Build ESC/POS formatted bytes for an OPD Registration Token Slip
   */
  buildOpdTokenEscPos(slip: OpdTokenSlipData, paperWidthCols: number = 32): Uint8Array {
    const builder = new EscPosBuilder();

    // 1. Header / Clinic Name
    builder
      .align('center')
      .bold(true)
      .line(slip.clinicName || slip.organizationName || 'DOCSEARCH HOSPITAL & CLINICS')
      .bold(false);

    if (slip.address) {
      builder.line(slip.address.slice(0, paperWidthCols));
    }
    if (slip.contactNumber) {
      builder.line(`Ph: ${slip.contactNumber}`);
    }

    builder.divider(paperWidthCols, '=');

    // 2. Queue Token Badge (Large Double Width + Height)
    builder
      .align('center')
      .bold(true)
      .line('OUTPATIENT TOKEN')
      .size('double-both')
      .line(slip.tokenNumber)
      .size('normal')
      .bold(false)
      .divider(paperWidthCols, '-');

    // 3. Patient & Clinical Details (Two-column layout)
    builder.align('left');
    builder.twoColumn('Date/Time:', slip.time || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), paperWidthCols);
    builder.twoColumn('UHID:', slip.uhid, paperWidthCols);
    builder.twoColumn('MRN:', slip.mrn, paperWidthCols);
    builder.twoColumn('Patient:', slip.patientName.slice(0, 18), paperWidthCols);
    builder.divider(paperWidthCols, '-');

    // 4. Doctor, Department & Room
    builder.twoColumn('Doctor:', slip.doctorName.slice(0, 18), paperWidthCols);
    if (slip.department) {
      builder.twoColumn('Dept:', slip.department.slice(0, 18), paperWidthCols);
    }
    builder.bold(true);
    builder.twoColumn('Room / OPD:', slip.room, paperWidthCols);
    builder.bold(false);
    builder.divider(paperWidthCols, '-');

    // 5. Fee & Payment Mode
    const feeText = slip.fee === 0 ? 'FREE / EXEMPT' : `Rs. ${slip.fee}`;
    builder.bold(true);
    builder.twoColumn('Fee Paid:', feeText, paperWidthCols);
    if (slip.paymentMode) {
      builder.twoColumn('Payment Mode:', slip.paymentMode, paperWidthCols);
    }
    builder.bold(false);

    builder.divider(paperWidthCols, '=');

    // 6. Footer Notes & Cut
    builder
      .align('center')
      .line('Please wait for token on OPD Display')
      .line('Bring this slip into Doctor Chamber')
      .line('Thank you & Get Well Soon!')
      .cut(false);

    return builder.build();
  }

  /**
   * Silent 1-click token print with automatic fallback
   * 1. First attempts zero-click background print via DocSearch Local Hardware Agent (http://127.0.0.1:18080)
   * 2. If agent is offline, checks WebUSB / WebSerial paired devices
   * 3. Finally falls back to browser window.print() dialog if all hardware links are absent
   */
  async printOpdTokenSlip(
    slip: OpdTokenSlipData,
    paperWidthCols: number = 32
  ): Promise<{ success: boolean; method: 'hardware_agent' | 'webusb' | 'webserial' | 'browser_fallback'; message: string }> {
    // 1. Try DocSearch Local Hardware Agent (LHA) silent spool
    try {
      const resp = await fetch('http://127.0.0.1:18080/api/v1/hardware/print/escpos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slipData: slip,
          paperWidth: paperWidthCols > 32 ? '80mm' : '58mm',
          printerId: 'tvs-rp3200'
        })
      });
      if (resp.ok) {
        const result = await resp.json();
        if (result.success) {
          return {
            success: true,
            method: 'hardware_agent',
            message: `Silent zero-click print completed via DocSearch Hardware Agent (Job: ${result.jobId}, Printer: ${result.printer}).`
          };
        }
      }
    } catch {
      // Local hardware agent daemon not running on client workstation; continue down the cascade
    }

    // 2. Try direct WebUSB / WebSerial
    const status = this.getStatus();
    if (status.isConnected) {
      try {
        const bytes = this.buildOpdTokenEscPos(slip, paperWidthCols);
        const result = await this.printRaw(bytes);
        return {
          success: true,
          method: result.method,
          message: `Direct thermal slip printed via ${result.method.toUpperCase()} (${result.bytesSent} bytes) with paper cut.`
        };
      } catch (err) {
        console.warn('[HardwarePrinterService] Direct thermal print failed, initiating browser fallback:', err);
      }
    }

    // 3. Graceful fallback to browser print dialog
    if (typeof window !== 'undefined') {
      window.print();
      return {
        success: true,
        method: 'browser_fallback',
        message: 'Dispatched to browser print dialog (no direct WebUSB/WebSerial thermal printer paired).'
      };
    }

    return {
      success: false,
      method: 'browser_fallback',
      message: 'Print environment unavailable.'
    };
  }

  /**
   * Silent 2-inch Zebra ZPL Patient Wristband Print (Inpatient Ward Admission / Emergency)
   */
  async printWristband(data: {
    hospitalName?: string;
    patientName: string;
    mrn: string;
    age?: number;
    gender?: string;
    wardName?: string;
    bedCode?: string;
    bloodGroup?: string;
    allergies?: string;
    admissionDate?: string;
  }): Promise<{ success: boolean; method: string; message: string; zplCode?: string }> {
    try {
      const resp = await fetch('http://127.0.0.1:18080/api/v1/hardware/print/zpl', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          labelType: 'WRISTBAND',
          data
        })
      });
      if (resp.ok) {
        const result = await resp.json();
        return {
          success: true,
          method: 'hardware_agent_zpl',
          message: `Silent Zebra wristband printed for ${data.patientName} (${data.mrn}) via ${result.printer}.`,
          zplCode: result.zplCode
        };
      }
    } catch {
      // Fallback
    }

    return {
      success: false,
      method: 'hardware_offline',
      message: 'DocSearch Local Hardware Agent offline on 127.0.0.1:18080. Please ensure Zebra printer is connected.'
    };
  }

  /**
   * Silent Cryo-Vial Barcode Label Print (Phlebotomy Blood Collection)
   */
  async printCryoVialLabel(data: {
    patientName: string;
    mrn: string;
    specimenBarcode: string;
    testName: string;
    tubeColor: string;
  }): Promise<{ success: boolean; method: string; message: string; zplCode?: string }> {
    try {
      const resp = await fetch('http://127.0.0.1:18080/api/v1/hardware/print/zpl', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          labelType: 'CRYO_VIAL',
          data
        })
      });
      if (resp.ok) {
        const result = await resp.json();
        return {
          success: true,
          method: 'hardware_agent_zpl',
          message: `Cryo-vial label printed: ${data.specimenBarcode} (${data.tubeColor}) for ${data.patientName}.`,
          zplCode: result.zplCode
        };
      }
    } catch {
      // Fallback
    }

    return {
      success: false,
      method: 'hardware_offline',
      message: 'DocSearch Local Hardware Agent offline on 127.0.0.1:18080.'
    };
  }
}

export const hardwarePrinterService = new HardwarePrinterService();
