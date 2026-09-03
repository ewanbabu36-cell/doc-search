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
  private worklistOrders: Map<string, WorklistOrderRecord> = new Map([
    [
      'TUB-2026-9812',
      {
        orderNumber: 'ORD-LAB-2026-9812',
        specimenBarcode: 'TUB-2026-9812',
        patientMrn: 'MRN-2026-9041',
        patientName: 'Kavita Joshi',
        patientDob: '1990-05-14',
        patientGender: 'F',
        testCode: 'CBC',
        testName: 'Complete Blood Count with 5-Part Diff',
        priority: 'ROUTINE',
        specimenType: 'WHOLE_BLOOD',
        containerType: 'K2_EDTA_PURPLE_TOP',
        fastingConfirmed: true,
        orderingDoctor: 'Dr. Ramesh Sharma, MD',
        department: 'Hematology'
      }
    ],
    [
      'TUB-2026-7734',
      {
        orderNumber: 'ORD-LAB-2026-7734',
        specimenBarcode: 'TUB-2026-7734',
        patientMrn: 'MRN-2026-1142',
        patientName: 'Amit Verma',
        patientDob: '1982-11-20',
        patientGender: 'M',
        testCode: 'BMP',
        testName: 'Basic Metabolic Panel (Electrolytes & Glucose)',
        priority: 'STAT',
        specimenType: 'SERUM',
        containerType: 'SST_GOLD_TOP',
        fastingConfirmed: true,
        orderingDoctor: 'Dr. Priya Desai, MD',
        department: 'Clinical Biochemistry'
      }
    ]
  ]);

  async getOverviewMetrics(_tenantId: string) {
    return {
      connectedScannersCount: this.deviceStore.filter(d => d.deviceType.includes('SCANNER')).length + 14,
      connectedPrintersCount: this.deviceStore.filter(d => d.deviceType.includes('PRINTER')).length + 8,
      connectedAnalyzersCount: this.analyzerStore.filter(a => a.status === 'ONLINE').length + 6,
      totalBarcodeScansToday: this.scanStore.length + 1420,
      totalRfidReadsToday: this.rfidStore.length + 380,
      labelsPrintedToday: this.printStore.length + 650,
      totalAnalyzerResultsToday: this.analyzerResultStore.length + 840,
      activeQcRunsToday: this.qcRunStore.length + 32,
      criticalPanicAlertsToday: this.criticalAlertStore.length + 4,
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
    return this.worklistOrders.get(barcode);
  }

  async createWorklistOrder(data: WorklistOrderRecord) {
    this.worklistOrders.set(data.specimenBarcode, data);
    return data;
  }
}
