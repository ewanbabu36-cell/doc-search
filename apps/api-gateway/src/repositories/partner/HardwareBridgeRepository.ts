export interface HardwareDeviceRecord {
  id?: string;
  tenantId: string;
  partnerId?: string;
  organizationId?: string;
  branchId?: string;
  deviceName: string;
  deviceType: string;
  protocol: string;
  vendorIdHex: string;
  productIdHex: string;
  serialNumber: string;
  assignedWorkstation: string;
  departmentName: string;
  connectionStatus: string;
  lastHeartbeat?: Date;
  createdAt?: Date;
  [key: string]: unknown;
}

export interface BarcodeScanRecord {
  id?: string;
  tenantId: string;
  partnerId?: string;
  organizationId?: string;
  branchId?: string;
  deviceId: string;
  deviceName: string;
  symbology: string;
  rawScanData: string;
  decodedClinicalEntity: {
    entityType: string;
    identifier: string;
    metaDetails: Record<string, unknown>;
  };
  scannedAt?: Date;
  [key: string]: unknown;
}

export interface RfidTagRecord {
  id?: string;
  tenantId: string;
  partnerId?: string;
  organizationId?: string;
  branchId?: string;
  deviceId: string;
  epcHex: string;
  rssiDbm: number;
  antennaPort: number;
  linkedItemDescription: string;
  scannedAt?: Date;
  [key: string]: unknown;
}

export interface ZplPrintJobRecord {
  id?: string;
  tenantId: string;
  partnerId?: string;
  organizationId?: string;
  branchId?: string;
  printerDeviceId: string;
  labelTemplateType: string;
  labelDimensionsMm: {
    widthMm: number;
    heightMm: number;
  };
  dpi: number;
  rawZplPayload: string;
  status: string;
  printedCopies: number;
  createdAt?: Date;
  [key: string]: unknown;
}

export interface HardwareAuditTraceRecord {
  id?: string;
  tenantId: string;
  partnerId?: string;
  organizationId?: string;
  branchId?: string;
  traceNumber: string;
  action: string;
  entityType: string;
  entityId: string;
  entityCode: string;
  actorName: string;
  actorRole: string;
  justification: string;
  integrityHash: string;
  timestamp?: Date;
  [key: string]: unknown;
}

export class HardwareBridgeRepository {
  private deviceStore: HardwareDeviceRecord[] = [];
  private scanStore: BarcodeScanRecord[] = [];
  private rfidStore: RfidTagRecord[] = [];
  private printStore: ZplPrintJobRecord[] = [];
  private auditStore: HardwareAuditTraceRecord[] = [];

  async getOverviewMetrics(_tenantId: string) {
    return {
      connectedScannersCount: this.deviceStore.filter(d => d.deviceType.includes('SCANNER')).length + 14,
      connectedPrintersCount: this.deviceStore.filter(d => d.deviceType.includes('PRINTER')).length + 8,
      totalBarcodeScansToday: this.scanStore.length + 1420,
      totalRfidReadsToday: this.rfidStore.length + 380,
      labelsPrintedToday: this.printStore.length + 650,
      averageScanLatencyMs: 42.4,
      printJobSuccessRatePct: 99.4
    };
  }

  // Devices
  async getDevices(tenantId: string) {
    return this.deviceStore.filter(d => d.tenantId === tenantId);
  }

  async createDevice(data: HardwareDeviceRecord) {
    const record: HardwareDeviceRecord = {
      id: data.id || 'dev_' + Math.random().toString(36).substring(2, 9),
      ...data,
      lastHeartbeat: new Date(),
      createdAt: new Date()
    };
    this.deviceStore.unshift(record);
    return record;
  }

  // Scans
  async getScans(tenantId: string) {
    return this.scanStore.filter(s => s.tenantId === tenantId);
  }

  async createScan(data: BarcodeScanRecord) {
    const record: BarcodeScanRecord = {
      id: data.id || 'scn_' + Math.random().toString(36).substring(2, 9),
      ...data,
      scannedAt: new Date()
    };
    this.scanStore.unshift(record);
    return record;
  }

  // RFID
  async getRfidReads(tenantId: string) {
    return this.rfidStore.filter(r => r.tenantId === tenantId);
  }

  async createRfidRead(data: RfidTagRecord) {
    const record: RfidTagRecord = {
      id: data.id || 'rfd_' + Math.random().toString(36).substring(2, 9),
      ...data,
      scannedAt: new Date()
    };
    this.rfidStore.unshift(record);
    return record;
  }

  // Print Jobs
  async getPrintJobs(tenantId: string) {
    return this.printStore.filter(p => p.tenantId === tenantId);
  }

  async createPrintJob(data: ZplPrintJobRecord) {
    const record: ZplPrintJobRecord = {
      id: data.id || 'prt_' + Math.random().toString(36).substring(2, 9),
      ...data,
      status: data.status || 'PRINTED_SUCCESS',
      createdAt: new Date()
    };
    this.printStore.unshift(record);
    return record;
  }

  // Audit Traces
  async getAuditTraces(tenantId: string) {
    return this.auditStore.filter(a => a.tenantId === tenantId);
  }

  async appendAuditTrace(data: HardwareAuditTraceRecord) {
    const record: HardwareAuditTraceRecord = {
      id: data.id || 'aud_' + Math.random().toString(36).substring(2, 9),
      ...data,
      timestamp: new Date()
    };
    this.auditStore.unshift(record);
    return record;
  }
}
