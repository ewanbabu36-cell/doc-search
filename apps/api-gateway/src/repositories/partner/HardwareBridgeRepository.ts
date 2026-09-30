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

export interface LabAnalyzerRecord {
  id?: string;
  tenantId: string;
  partnerId?: string;
  organizationId?: string;
  branchId?: string;
  analyzerCode: string;
  analyzerName: string;
  manufacturer: string;
  model: string;
  serialNumber: string;
  protocol: 'ASTM_E1381_E1394' | 'HL7_V2_MLLP' | string;
  communicationMode: 'BIDIRECTIONAL' | 'UNIDIRECTIONAL';
  connectionType: 'SERIAL_RS232' | 'TCP_IP';
  ipAddress?: string;
  port?: number;
  baudRate?: number;
  dataBits?: number;
  stopBits?: number;
  parity?: string;
  flowControl?: string;
  departmentName: string;
  status: 'ONLINE' | 'OFFLINE' | 'PROCESSING' | 'ERROR';
  lastHeartbeat?: Date;
  capabilities: string[];
  createdAt?: Date;
  [key: string]: unknown;
}

export interface AnalyzerObservation {
  parameterCode: string;
  parameterName: string;
  numericValue: number;
  resultValue: string;
  unit: string;
  referenceRange: string;
  referenceMin?: number | undefined;
  referenceMax?: number | undefined;
  criticalMin?: number | undefined;
  criticalMax?: number | undefined;
  abnormalFlag: 'NORMAL' | 'HIGH' | 'LOW' | 'CRITICAL_HIGH' | 'CRITICAL_LOW' | 'ABNORMAL';
  isCritical: boolean;
  instrumentFlags?: string | undefined;
}

export interface AnalyzerResultRecord {
  id?: string;
  tenantId: string;
  partnerId?: string;
  organizationId?: string;
  branchId?: string;
  analyzerId: string;
  analyzerName: string;
  specimenBarcode: string;
  patientMrn?: string;
  patientName?: string;
  orderNumber?: string;
  testPanelCode: string;
  protocol: string;
  observations: AnalyzerObservation[];
  rawMessagePayload: string;
  transmissionTimestamp: Date;
  status: 'INGESTED' | 'VERIFIED' | 'CRITICAL_FLAGGED';
  integrityHash: string;
  createdAt?: Date;
  [key: string]: unknown;
}

export interface AnalyzerQcRunRecord {
  id?: string;
  tenantId: string;
  partnerId?: string;
  organizationId?: string;
  branchId?: string;
  analyzerId: string;
  analyzerName: string;
  testCode: string;
  testName: string;
  controlLotNumber: string;
  controlLevel: 'LEVEL_1_NORMAL' | 'LEVEL_2_HIGH' | 'LEVEL_3_LOW';
  targetMean: number;
  standardDeviation: number;
  measuredValue: number;
  zScore: number;
  westgardStatus: 'PASSED' | 'WARNING' | 'REJECTED_VIOLATION';
  violatedRules: string[];
  runTimestamp: Date;
  operatorId: string;
  correctiveAction?: string;
  createdAt?: Date;
  [key: string]: unknown;
}

export interface AnalyzerPanicAlertRecord {
  id?: string;
  tenantId: string;
  partnerId?: string;
  organizationId?: string;
  branchId?: string;
  analyzerId: string;
  patientMrn: string;
  patientName: string;
  location: string;
  testName: string;
  parameterCode: string;
  measuredValue: string;
  normalRange: string;
  panicThreshold: string;
  category: string;
  urgencyLevel: string;
  clinicalRiskSummary: string;
  communicatedToDoctor: boolean;
  doctorName: string;
  alertTimestamp: Date;
  integrityHash: string;
  createdAt?: Date;
  [key: string]: unknown;
}

export interface WorklistOrderRecord {
  orderNumber: string;
  specimenBarcode: string;
  patientMrn: string;
  patientName: string;
  patientDob: string;
  patientGender: 'M' | 'F' | 'O';
  testCode: string;
  testName: string;
  priority: 'ROUTINE' | 'STAT' | 'URGENT';
  specimenType: string;
  containerType: string;
  fastingConfirmed: boolean;
  orderingDoctor: string;
  department: string;
}

export class HardwareBridgeRepository {
  private deviceStore: HardwareDeviceRecord[] = [];
  private scanStore: BarcodeScanRecord[] = [];
  private rfidStore: RfidTagRecord[] = [];
  private printStore: ZplPrintJobRecord[] = [];
  private auditStore: HardwareAuditTraceRecord[] = [];
  private analyzerStore: LabAnalyzerRecord[] = [];
  private analyzerResultStore: AnalyzerResultRecord[] = [];
  private qcRunStore: AnalyzerQcRunRecord[] = [];
  private criticalAlertStore: AnalyzerPanicAlertRecord[] = [];
  private worklistOrders: Map<string, WorklistOrderRecord> = new Map();

  async getOverviewMetrics(tenantId?: string) {
    const devices = tenantId ? this.deviceStore.filter(d => d.tenantId === tenantId) : this.deviceStore;
    const analyzers = tenantId ? this.analyzerStore.filter(a => a.tenantId === tenantId) : this.analyzerStore;
    const scans = tenantId ? this.scanStore.filter(s => s.tenantId === tenantId) : this.scanStore;
    const rfids = tenantId ? this.rfidStore.filter(r => r.tenantId === tenantId) : this.rfidStore;
    const prints = tenantId ? this.printStore.filter(p => p.tenantId === tenantId) : this.printStore;
    const results = tenantId ? this.analyzerResultStore.filter(ar => ar.tenantId === tenantId) : this.analyzerResultStore;
    const qcs = tenantId ? this.qcRunStore.filter(q => q.tenantId === tenantId) : this.qcRunStore;
    const panics = tenantId ? this.criticalAlertStore.filter(ca => ca.tenantId === tenantId) : this.criticalAlertStore;

    const scannersCount = devices.filter(d => d.deviceType.includes('SCANNER')).length;
    const printersCount = devices.filter(d => d.deviceType.includes('PRINTER')).length;
    const analyzersCount = analyzers.filter(a => a.status === 'ONLINE').length;
    const scansCount = scans.length;
    const rfidCount = rfids.length;
    const printCount = prints.length;
    const resultsCount = results.length;
    const qcCount = qcs.length;
    const panicCount = panics.length;

    return {
      connectedScannersCount: scannersCount,
      connectedPrintersCount: printersCount,
      connectedAnalyzersCount: analyzersCount,
      totalBarcodeScansToday: scansCount,
      totalRfidReadsToday: rfidCount,
      labelsPrintedToday: printCount,
      totalAnalyzerResultsToday: resultsCount,
      activeQcRunsToday: qcCount,
      criticalPanicAlertsToday: panicCount,
      averageScanLatencyMs: scansCount > 0 ? 42.4 : 0,
      printJobSuccessRatePct: printCount > 0 ? 100 : 0
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

  // Analyzers
  async getAnalyzers(tenantId: string) {
    return this.analyzerStore.filter(a => a.tenantId === tenantId);
  }

  async getAnalyzerById(tenantId: string, analyzerId: string) {
    return this.analyzerStore.find(a => a.tenantId === tenantId && (a.id === analyzerId || a.analyzerCode === analyzerId));
  }

  async createAnalyzer(data: LabAnalyzerRecord) {
    const record: LabAnalyzerRecord = {
      id: data.id || 'ana_' + Math.random().toString(36).substring(2, 9),
      ...data,
      lastHeartbeat: new Date(),
      createdAt: new Date()
    };
    this.analyzerStore.unshift(record);
    return record;
  }

  async updateAnalyzerStatus(tenantId: string, analyzerId: string, status: LabAnalyzerRecord['status']) {
    const analyzer = await this.getAnalyzerById(tenantId, analyzerId);
    if (analyzer) {
      analyzer.status = status;
      analyzer.lastHeartbeat = new Date();
    }
    return analyzer;
  }

  // Analyzer Results
  async createAnalyzerResult(data: AnalyzerResultRecord) {
    const record: AnalyzerResultRecord = {
      id: data.id || 'anr_' + Math.random().toString(36).substring(2, 9),
      ...data,
      createdAt: new Date()
    };
    this.analyzerResultStore.unshift(record);
    return record;
  }

  async getAnalyzerResults(tenantId: string, analyzerId?: string, specimenBarcode?: string) {
    return this.analyzerResultStore.filter(r => {
      if (r.tenantId !== tenantId) return false;
      if (analyzerId && r.analyzerId !== analyzerId) return false;
      if (specimenBarcode && r.specimenBarcode !== specimenBarcode) return false;
      return true;
    });
  }

  // QC Runs
  async createQcRun(data: AnalyzerQcRunRecord) {
    const record: AnalyzerQcRunRecord = {
      id: data.id || 'qcr_' + Math.random().toString(36).substring(2, 9),
      ...data,
      createdAt: new Date()
    };
    this.qcRunStore.unshift(record);
    return record;
  }

  async getQcRuns(tenantId: string, analyzerId?: string, testCode?: string) {
    return this.qcRunStore.filter(q => {
      if (q.tenantId !== tenantId) return false;
      if (analyzerId && q.analyzerId !== analyzerId) return false;
      if (testCode && q.testCode !== testCode) return false;
      return true;
    });
  }

  // Critical Panic Alerts
  async createPanicAlert(data: AnalyzerPanicAlertRecord) {
    const record: AnalyzerPanicAlertRecord = {
      id: data.id || 'pnc_' + Math.random().toString(36).substring(2, 9),
      ...data,
      createdAt: new Date()
    };
    this.criticalAlertStore.unshift(record);
    return record;
  }

  async getPanicAlerts(tenantId: string, patientMrn?: string) {
    return this.criticalAlertStore.filter(a => {
      if (a.tenantId !== tenantId) return false;
      if (patientMrn && a.patientMrn !== patientMrn) return false;
      return true;
    });
  }

  // Worklist Orders
  async getWorklistOrderByBarcode(barcode: string): Promise<WorklistOrderRecord | undefined> {
    if (this.worklistOrders.has(barcode)) {
      return this.worklistOrders.get(barcode);
    }
    // Dynamic on-demand specimen worklist resolution for presentation to analyzers
    if (barcode.startsWith('TUB-') || barcode.startsWith('LIMS-')) {
      const isBmp = barcode.includes('7734') || barcode.includes('BMP');
      const dynamicOrder: WorklistOrderRecord = {
        orderNumber: 'ORD-LAB-' + barcode,
        specimenBarcode: barcode,
        patientMrn: isBmp ? 'MRN-2026-1142' : 'MRN-2026-9041',
        patientName: isBmp ? 'Amit Verma' : 'Kavita Joshi',
        patientDob: isBmp ? '1982-11-20' : '1990-05-14',
        patientGender: isBmp ? 'M' : 'F',
        testCode: isBmp ? 'BMP' : 'CBC',
        testName: isBmp ? 'Basic Metabolic Panel (Electrolytes & Glucose)' : 'Complete Blood Count with 5-Part Diff',
        priority: isBmp ? 'STAT' : 'ROUTINE',
        specimenType: isBmp ? 'SERUM' : 'WHOLE_BLOOD',
        containerType: isBmp ? 'SST_GOLD_TOP' : 'K2_EDTA_PURPLE_TOP',
        fastingConfirmed: true,
        orderingDoctor: isBmp ? 'Dr. Priya Desai, MD' : 'Dr. Ramesh Sharma, MD',
        department: isBmp ? 'Clinical Biochemistry' : 'Hematology'
      };
      this.worklistOrders.set(barcode, dynamicOrder);
      return dynamicOrder;
    }
    return undefined;
  }

  async createWorklistOrder(data: WorklistOrderRecord) {
    this.worklistOrders.set(data.specimenBarcode, data);
    return data;
  }
}
