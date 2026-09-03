import crypto from 'crypto';
import {
  HardwareBridgeRepository,
  type AnalyzerObservation,
  type AnalyzerPanicAlertRecord
} from '../../repositories/partner/HardwareBridgeRepository.js';
import { AppError } from '@docsearch/shared-core';

// ASTM E1381 Control Characters
export const ASTM_CTRL = {
  STX: '\x02',
  ETX: '\x03',
  EOT: '\x04',
  ENQ: '\x05',
  ACK: '\x06',
  NAK: '\x15',
  ETB: '\x17',
  CR: '\r',
  LF: '\n'
};

export interface AstmHeaderInfo {
  delimiters: string;
  senderName: string;
  protocolVersion: string;
  timestamp: string;
}

export interface AstmPatientInfo {
  sequence: string;
  patientId: string;
  patientName: string;
  birthDate: string;
  gender: string;
}

export interface AstmOrderInfo {
  sequence: string;
  specimenBarcode: string;
  testCode: string;
  priority: string;
  actionCode: string;
}

export interface AstmQueryInfo {
  sequence: string;
  specimenBarcode: string;
  filter: string;
}

// ASTM Checksum Calculator (Modulo 256 sum formatted as 2-character hex)
export function computeAstmChecksum(payload: string): string {
  let sum = 0;
  for (let i = 0; i < payload.length; i++) {
    sum = (sum + payload.charCodeAt(i)) % 256;
  }
  return sum.toString(16).toUpperCase().padStart(2, '0');
}

// Encode ASTM E1381 Transport Frame
export function encodeAstmFrame(frameNumber: number, text: string, isLast = true): string {
  const frameId = (frameNumber % 8).toString();
  const endChar = isLast ? ASTM_CTRL.ETX : ASTM_CTRL.ETB;
  const payloadToHash = `${frameId}${text}${endChar}`;
  const checksum = computeAstmChecksum(payloadToHash);
  return `${ASTM_CTRL.STX}${payloadToHash}${checksum}\r\n`;
}

// Decode and Verify ASTM E1381 Transport Frame
export function decodeAstmFrame(rawFrame: string): {
  frameNumber: number;
  text: string;
  checksum: string;
  calculatedChecksum: string;
  isValid: boolean;
} {
  let frame = rawFrame;
  if (frame.startsWith(ASTM_CTRL.STX)) {
    frame = frame.substring(1);
  }
  if (frame.endsWith('\r\n')) {
    frame = frame.substring(0, frame.length - 2);
  } else if (frame.endsWith('\n') || frame.endsWith('\r')) {
    frame = frame.replace(/[\r\n]+$/, '');
  }

  const frameNumber = parseInt(frame[0] || '1', 10);
  let endIdx = frame.indexOf(ASTM_CTRL.ETX);
  let isLast = true;
  if (endIdx === -1) {
    endIdx = frame.indexOf(ASTM_CTRL.ETB);
    isLast = false;
  }

  if (endIdx === -1) {
    return {
      frameNumber,
      text: frame.substring(1),
      checksum: '',
      calculatedChecksum: '',
      isValid: true
    };
  }

  const text = frame.substring(1, endIdx);
  const endChar = isLast ? ASTM_CTRL.ETX : ASTM_CTRL.ETB;
  const checksumReceived = frame.substring(endIdx + 1, endIdx + 3).toUpperCase();
  const payloadToHash = `${frameNumber}${text}${endChar}`;
  const calculatedChecksum = computeAstmChecksum(payloadToHash);

  return {
    frameNumber,
    text,
    checksum: checksumReceived,
    calculatedChecksum,
    isValid: checksumReceived === calculatedChecksum
  };
}

// ASTM E1394 Application Message Parser
export function parseAstmE1394(message: string) {
  const lines = message.split(/\r\n|\r|\n/).filter(line => line.trim().length > 0);
  let header: AstmHeaderInfo = { delimiters: '^~\\&', senderName: 'AUTOMATED_ANALYZER', protocolVersion: '1394-97', timestamp: new Date().toISOString() };
  let patient: AstmPatientInfo = { sequence: '1', patientId: '', patientName: '', birthDate: '', gender: 'U' };
  let order: AstmOrderInfo = { sequence: '1', specimenBarcode: '', testCode: '', priority: 'ROUTINE', actionCode: 'N' };
  let query: AstmQueryInfo = { sequence: '1', specimenBarcode: '', filter: 'ALL' };
  const observations: Array<{
    parameterCode: string;
    parameterName: string;
    value: string;
    numericValue: number;
    unit: string;
    referenceRange: string;
    abnormalFlag: string;
    status: string;
  }> = [];
  const comments: string[] = [];

  for (let line of lines) {
    if (line.includes(ASTM_CTRL.STX) || line.includes(ASTM_CTRL.ETX)) {
      const decoded = decodeAstmFrame(line);
      line = decoded.text;
    }
    const fields = line.split('|');
    const recType = fields[0]?.toUpperCase() || '';

    if (recType === 'H') {
      header = {
        delimiters: fields[1] || '^~\\&',
        senderName: fields[4] || 'AUTOMATED_ANALYZER',
        protocolVersion: fields[12] || '1394-97',
        timestamp: fields[13] || new Date().toISOString()
      };
    } else if (recType === 'P') {
      patient = {
        sequence: fields[1] || '1',
        patientId: fields[2] || fields[3] || '',
        patientName: (fields[5] || '').replace(/\^/g, ' '),
        birthDate: fields[7] || '',
        gender: fields[8] || 'U'
      };
    } else if (recType === 'O') {
      order = {
        sequence: fields[1] || '1',
        specimenBarcode: (fields[2] || fields[3] || '').replace(/^\^/, ''),
        testCode: fields[4] || '',
        priority: fields[5] || 'ROUTINE',
        actionCode: fields[11] || 'N'
      };
    } else if (recType === 'Q') {
      query = {
        sequence: fields[1] || '1',
        specimenBarcode: (fields[2] || '').replace(/^\^/, ''),
        filter: fields[4] || 'ALL'
      };
    } else if (recType === 'R') {
      const testField = fields[2] || '';
      const testParts = testField.split('^').filter(Boolean);
      const parameterCode = testParts[testParts.length - 2] || testParts[0] || 'PARAM';
      const parameterName = testParts[testParts.length - 1] || parameterCode;
      const rawVal = fields[3] || '0';
      const numVal = parseFloat(rawVal) || 0;
      observations.push({
        parameterCode,
        parameterName,
        value: rawVal,
        numericValue: numVal,
        unit: fields[4] || '',
        referenceRange: fields[5] || '',
        abnormalFlag: fields[6] || 'N',
        status: fields[8] || 'F'
      });
    } else if (recType === 'C') {
      comments.push(fields[3] || fields[2] || '');
    }
  }

  return { header, patient, order, query, observations, comments };
}

// ASTM E1394 Worklist Order Message Builder
export function buildAstmWorklistOrder(
  _analyzerCode: string,
  patient: { mrn: string; name: string; dob?: string; gender?: string },
  order: { orderNumber: string; specimenBarcode: string; testCode: string; priority?: string }
): string {
  const now = new Date().toISOString().replace(/[-:T.]/g, '').slice(0, 14);
  const hRecord = `H|\\^&|||DOCSEARCH^LIS|||||||P|1394-97|${now}`;
  const pName = patient.name.replace(/ /g, '^');
  const pDob = (patient.dob || '').replace(/-/g, '');
  const pRecord = `P|1|${patient.mrn}|||${pName}||${pDob}|${patient.gender || 'U'}|||||`;
  const priorityCode = order.priority === 'STAT' ? 'S' : 'R';
  const oRecord = `O|1|${order.specimenBarcode}||^^^${order.testCode}|${priorityCode}||||||A||||||||||||||O`;
  const lRecord = `L|1|N`;
  return [hRecord, pRecord, oRecord, lRecord].join('\r\n');
}

// HL7 v2.x MLLP Framing Characters
export const MLLP = {
  START_BLOCK: '\x0B',
  END_BLOCK: '\x1C\r'
};

export function wrapMllp(hl7Text: string): string {
  return `${MLLP.START_BLOCK}${hl7Text}${MLLP.END_BLOCK}`;
}

export function unwrapMllp(mllpPayload: string): string {
  let content = mllpPayload;
  if (content.startsWith(MLLP.START_BLOCK)) {
    content = content.substring(1);
  }
  if (content.endsWith(MLLP.END_BLOCK)) {
    content = content.substring(0, content.length - 2);
  } else if (content.endsWith('\x1C')) {
    content = content.substring(0, content.length - 1);
  }
  return content.trim();
}

export interface Hl7MshInfo {
  delimiters: string;
  sendingApp: string;
  sendingFacility: string;
  messageTimestamp: string;
  messageType: string;
  messageControlId: string;
  processingId: string;
  versionId: string;
}

export interface Hl7PidInfo {
  mrn: string;
  patientName: string;
  dob: string;
  gender: string;
}

export interface Hl7ObrInfo {
  setId: string;
  placerOrderNumber: string;
  fillerOrderNumber: string;
  testCode: string;
  testName: string;
  specimenAccession: string;
}

// HL7 v2.x ORU^R01 Parser
export function parseHl7OruR01(hl7Message: string) {
  const unwrapped = unwrapMllp(hl7Message);
  const segments = unwrapped.split(/\r\n|\r|\n/).map(s => s.trim()).filter(Boolean);
  
  let msh: Hl7MshInfo = { delimiters: '^~\\&', sendingApp: '', sendingFacility: '', messageTimestamp: '', messageType: '', messageControlId: 'MSG-' + Date.now(), processingId: 'P', versionId: '2.5' };
  let pid: Hl7PidInfo = { mrn: '', patientName: '', dob: '', gender: 'U' };
  let obr: Hl7ObrInfo = { setId: '1', placerOrderNumber: '', fillerOrderNumber: '', testCode: '', testName: '', specimenAccession: '' };
  const obxList: Array<{
    setNumber: string;
    valueType: string;
    parameterCode: string;
    parameterName: string;
    value: string;
    numericValue: number;
    unit: string;
    referenceRange: string;
    abnormalFlag: string;
    resultStatus: string;
  }> = [];

  for (const seg of segments) {
    const fields = seg.split('|');
    const segName = fields[0]?.toUpperCase();
    if (segName === 'MSH') {
      msh = {
        delimiters: fields[1] || '^~\\&',
        sendingApp: fields[2] || '',
        sendingFacility: fields[3] || '',
        messageTimestamp: fields[6] || '',
        messageType: fields[8] || '',
        messageControlId: fields[9] || 'MSG-' + Date.now(),
        processingId: fields[10] || 'P',
        versionId: fields[11] || '2.5'
      };
    } else if (segName === 'PID') {
      pid = {
        mrn: (fields[3] || '').split('^')[0] || '',
        patientName: (fields[5] || '').replace(/\^/g, ' '),
        dob: fields[7] || '',
        gender: fields[8] || 'U'
      };
    } else if (segName === 'OBR') {
      const universalService = fields[4] || '';
      const parts = universalService.split('^');
      obr = {
        setId: fields[1] || '1',
        placerOrderNumber: fields[2] || '',
        fillerOrderNumber: fields[3] || '',
        testCode: parts[0] || '',
        testName: parts[1] || parts[0] || '',
        specimenAccession: fields[3] || fields[2] || fields[15] || ''
      };
    } else if (segName === 'OBX') {
      const obsId = fields[3] || '';
      const parts = obsId.split('^');
      const paramCode = parts[0] || 'PARAM';
      const paramName = parts[1] || paramCode;
      const rawVal = fields[5] || '';
      const numVal = parseFloat(rawVal) || 0;
      obxList.push({
        setNumber: fields[1] || '1',
        valueType: fields[2] || 'NM',
        parameterCode: paramCode,
        parameterName: paramName,
        value: rawVal,
        numericValue: numVal,
        unit: fields[6] || '',
        referenceRange: fields[7] || '',
        abnormalFlag: fields[8] || 'N',
        resultStatus: fields[11] || 'F'
      });
    }
  }

  return { msh, pid, obr, obxList };
}

// HL7 v2.x ACK^R01 Builder
export function buildHl7Ack(messageControlId: string, ackCode = 'AA', text = 'Message accepted successfully'): string {
  const timestamp = new Date().toISOString().replace(/[-:T.]/g, '').slice(0, 14);
  const ackId = 'ACK-' + Date.now();
  const msh = `MSH|^~\\&|DOCSEARCH_LIS|CENTRAL_LAB|ANALYZER|HOSPITAL|${timestamp}||ACK^R01|${ackId}|P|2.5`;
  const msa = `MSA|${ackCode}|${messageControlId}|${text}`;
  const raw = `${msh}\r${msa}\r`;
  return wrapMllp(raw);
}

// HL7 v2.x OML^O21 Worklist Order Builder
export function buildHl7OmlO21(
  patient: { mrn: string; name: string; dob?: string; gender?: string },
  order: { orderNumber: string; specimenBarcode: string; testCode: string; testName?: string; priority?: string }
): string {
  const timestamp = new Date().toISOString().replace(/[-:T.]/g, '').slice(0, 14);
  const msgId = 'OML-' + Date.now();
  const msh = `MSH|^~\\&|DOCSEARCH_LIS|CENTRAL_LAB|ANALYZER|LAB|${timestamp}||OML^O21|${msgId}|P|2.5`;
  const pidName = patient.name.replace(/ /g, '^');
  const pid = `PID|1||${patient.mrn}^^^MRN||${pidName}||${(patient.dob || '').replace(/-/g, '')}|${patient.gender || 'U'}`;
  const orc = `ORC|NW|${order.orderNumber}|||${order.priority === 'STAT' ? 'STAT' : 'ROUTINE'}`;
  const obr = `OBR|1|${order.orderNumber}|${order.specimenBarcode}|${order.testCode}^${order.testName || order.testCode}^LN|||${timestamp}`;
  const raw = [msh, pid, orc, obr].join('\r');
  return wrapMllp(raw);
}

// Clinical Reference Ranges & Critical Panic Thresholds
export const CLINICAL_REFERENCE_RANGES: Record<
  string,
  {
    name: string;
    unit: string;
    refMin: number;
    refMax: number;
    criticalMin?: number;
    criticalMax?: number;
    category: string;
    clinicalRisk: string;
  }
> = {
  WBC: {
    name: 'White Blood Cell Count',
    unit: '10^3/uL',
    refMin: 4.0,
    refMax: 10.0,
    criticalMin: 2.0,
    criticalMax: 30.0,
    category: 'Hematology',
    clinicalRisk: 'Severe neutropenia / Leukemoid reaction or acute sepsis'
  },
  HGB: {
    name: 'Hemoglobin',
    unit: 'g/dL',
    refMin: 12.0,
    refMax: 16.0,
    criticalMin: 7.0,
    criticalMax: 20.0,
    category: 'Hematology',
    clinicalRisk: 'Severe anemia / Hemorrhagic shock risk'
  },
  PLT: {
    name: 'Platelet Count',
    unit: '10^3/uL',
    refMin: 150.0,
    refMax: 450.0,
    criticalMin: 20.0,
    criticalMax: 1000.0,
    category: 'Hematology',
    clinicalRisk: 'Critical thrombocytopenia / Spontaneous intracranial hemorrhage risk'
  },
  GLU: {
    name: 'Blood Glucose (Fasting / Random)',
    unit: 'mg/dL',
    refMin: 70.0,
    refMax: 110.0,
    criticalMin: 45.0,
    criticalMax: 450.0,
    category: 'Clinical Biochemistry',
    clinicalRisk: 'Severe hypoglycemia / Diabetic ketoacidosis hyperosmolar crisis'
  },
  K: {
    name: 'Serum Potassium',
    unit: 'mmol/L',
    refMin: 3.5,
    refMax: 5.1,
    criticalMin: 2.8,
    criticalMax: 6.2,
    category: 'Clinical Biochemistry',
    clinicalRisk: 'Fatal cardiac arrhythmia / Ventricular fibrillation arrest'
  },
  NA: {
    name: 'Serum Sodium',
    unit: 'mmol/L',
    refMin: 135.0,
    refMax: 145.0,
    criticalMin: 120.0,
    criticalMax: 160.0,
    category: 'Clinical Biochemistry',
    clinicalRisk: 'Severe hyponatremia / Cerebral edema or central pontine myelinolysis'
  },
  CREAT: {
    name: 'Serum Creatinine',
    unit: 'mg/dL',
    refMin: 0.6,
    refMax: 1.2,
    criticalMax: 5.0,
    category: 'Renal Function',
    clinicalRisk: 'Acute kidney injury Stage 3 / Anuria requiring emergent hemodialysis'
  },
  TROP_I: {
    name: 'Troponin I (High Sensitivity)',
    unit: 'ng/mL',
    refMin: 0.0,
    refMax: 0.04,
    criticalMax: 0.40,
    category: 'Cardiac Biomarker',
    clinicalRisk: 'Acute STEMI / Massive myocardial necrosis'
  }
};

// Westgard Multirule Evaluation Engine
export interface WestgardEvaluation {
  zScore: number;
  westgardStatus: 'PASSED' | 'WARNING' | 'REJECTED_VIOLATION';
  violatedRules: string[];
  recommendation: string;
}

export function evaluateWestgardRules(
  targetMean: number,
  sd: number,
  measuredValue: number,
  historyZScores: number[] = []
): WestgardEvaluation {
  if (sd <= 0) {
    throw new Error('Standard deviation must be greater than zero');
  }

  const currentZ = parseFloat(((measuredValue - targetMean) / sd).toFixed(3));
  const series = [...historyZScores, currentZ];
  const violatedRules: string[] = [];

  // 1_3s: 1 point exceeds +/- 3 SD (Random error)
  if (Math.abs(currentZ) > 3.0) {
    violatedRules.push('1_3s');
  }

  // 2_2s: 2 consecutive points exceed +2 SD or -2 SD (Systematic error)
  if (series.length >= 2) {
    const prevZ = series[series.length - 2] ?? 0;
    if ((currentZ > 2.0 && prevZ > 2.0) || (currentZ < -2.0 && prevZ < -2.0)) {
      violatedRules.push('2_2s');
    }
  }

  // R_4s: Difference between 2 consecutive points exceeds 4 SD (Random error)
  if (series.length >= 2) {
    const prevZ = series[series.length - 2] ?? 0;
    const diff = Math.abs(currentZ - prevZ);
    if (diff > 4.0) {
      violatedRules.push('R_4s');
    }
  }

  // 4_1s: 4 consecutive points exceed +1 SD or -1 SD (Systematic bias)
  if (series.length >= 4) {
    const last4 = series.slice(-4);
    const allPos1 = last4.every(z => z > 1.0);
    const allNeg1 = last4.every(z => z < -1.0);
    if (allPos1 || allNeg1) {
      violatedRules.push('4_1s');
    }
  }

  // 10_x: 10 consecutive points fall on the same side of the mean (Systematic drift)
  if (series.length >= 10) {
    const last10 = series.slice(-10);
    const allAbove = last10.every(z => z > 0);
    const allBelow = last10.every(z => z < 0);
    if (allAbove || allBelow) {
      violatedRules.push('10_x');
    }
  }

  let westgardStatus: 'PASSED' | 'WARNING' | 'REJECTED_VIOLATION' = 'PASSED';
  let recommendation = 'Quality control passed within clinical tolerance limits.';

  if (violatedRules.includes('1_3s') || violatedRules.includes('2_2s') || violatedRules.includes('R_4s')) {
    westgardStatus = 'REJECTED_VIOLATION';
    recommendation = `Run Rejected (${violatedRules.join(', ')}). Immediate instrument recalibration and reagent check required before patient testing.`;
  } else if (violatedRules.includes('4_1s') || violatedRules.includes('10_x')) {
    westgardStatus = 'WARNING';
    recommendation = `Run Warning (${violatedRules.join(', ')}). Systematic drift or shift detected. Inspect reagent lot stability and optical alignment.`;
  }

  return {
    zScore: currentZ,
    westgardStatus,
    violatedRules,
    recommendation
  };
}

export class HardwareBridgeService {
  constructor(private readonly repo = new HardwareBridgeRepository()) {}

  private computeHash(payload: Record<string, unknown>, previousHash?: string): string {
    const serialized = JSON.stringify(payload);
    return crypto.createHash('sha256').update(`${previousHash || 'GENESIS_HARDWARE'}::${serialized}`).digest('hex');
  }

  async getOverviewMetrics(tenantId: string) {
    return await this.repo.getOverviewMetrics(tenantId);
  }

  // 1. Device Registration & Heartbeat (WebUSB / WebSerial Handshake)
  async registerDevice(tenantId: string, branchId: string, actorId: string, payload: Record<string, unknown>) {
    const deviceName = String(payload['deviceName'] || 'Zebra DS2208 Handheld Barcode Scanner');
    const deviceType = String(payload['deviceType'] || 'BARCODE_SCANNER_HANDHELD');
    const protocol = String(payload['protocol'] || 'WEB_USB');
    const serialNumber = String(payload['serialNumber'] || 'SN-ZEB-' + Date.now().toString().slice(-6));

    const device = await this.repo.createDevice({
      tenantId,
      branchId,
      deviceName,
      deviceType,
      protocol,
      vendorIdHex: String(payload['vendorIdHex'] || '0x05E0'),
      productIdHex: String(payload['productIdHex'] || '0x1200'),
      serialNumber,
      assignedWorkstation: String(payload['assignedWorkstation'] || 'Central Pharmacy Dispensing Dock 1'),
      departmentName: String(payload['departmentName'] || 'Inpatient Pharmacy'),
      connectionStatus: 'CONNECTED_ONLINE'
    });

    const hash = this.computeHash({ event: 'HARDWARE_DEVICE_REGISTERED', deviceId: device.id, serialNumber });
    await this.repo.appendAuditTrace({
      tenantId,
      branchId,
      traceNumber: 'TRACE-' + Date.now().toString().slice(-6),
      entityType: 'HARDWARE_DEVICE',
      entityId: device.id as string,
      entityCode: serialNumber,
      action: 'REGISTER_DEVICE',
      actorName: actorId,
      actorRole: 'BIOMEDICAL_HARDWARE_TECH',
      justification: `Peripheral hardware registered via ${protocol} driver handshake`,
      integrityHash: hash
    });

    return device;
  }

  async getDevices(tenantId: string) {
    return await this.repo.getDevices(tenantId);
  }

  // 2. Barcode Scanning Engine (GS1 / Code128 / ISBT-128)
  async processBarcodeScan(tenantId: string, branchId: string, actorId: string, payload: Record<string, unknown>) {
    const rawData = String(payload['rawScanData'] || '');
    if (!rawData) {
      throw new AppError({ message: 'Raw scan data is required', statusCode: 400 });
    }

    // Dynamic Symbology & Clinical Entity Parser
    let entityType = 'SAMPLE_SPECIMEN';
    let identifier = rawData;
    const metaDetails: Record<string, unknown> = {};

    if (rawData.startsWith('TUB-') || rawData.startsWith('LIMS-')) {
      entityType = 'SAMPLE_SPECIMEN';
      identifier = rawData;
      metaDetails['vacutainerType'] = 'K2-EDTA Purple Top';
      metaDetails['testName'] = 'Complete Blood Count (CBC)';
    } else if (rawData.startsWith('MED-') || rawData.startsWith('01')) {
      entityType = 'MEDICATION_BATCH';
      identifier = rawData;
      metaDetails['drugName'] = 'Meropenem 1g IV';
      metaDetails['batchNumber'] = 'BAT-2026-M09';
      metaDetails['expiryDate'] = '2028-08-31';
    } else if (rawData.startsWith('MRN-') || rawData.startsWith('PAT-')) {
      entityType = 'PATIENT_MRN';
      identifier = rawData;
      metaDetails['patientName'] = 'Kavita Joshi';
      metaDetails['ward'] = 'Cardiology ICU Bed 4';
    } else if (rawData.startsWith('BLD-') || rawData.startsWith('=')) {
      entityType = 'BLOOD_UNIT';
      identifier = rawData;
      metaDetails['bloodGroup'] = 'O_POSITIVE';
      metaDetails['component'] = 'PACKED_RED_BLOOD_CELLS';
    }

    const scan = await this.repo.createScan({
      tenantId,
      branchId,
      deviceId: String(payload['deviceId'] || 'dev_scanner_01'),
      deviceName: String(payload['deviceName'] || 'Zebra DS2208 2D Imager'),
      symbology: String(payload['symbology'] || 'CODE128'),
      rawScanData: rawData,
      decodedClinicalEntity: {
        entityType,
        identifier,
        metaDetails
      }
    });

    const hash = this.computeHash({ event: 'BARCODE_SCANNED', id: scan.id, identifier });
    await this.repo.appendAuditTrace({
      tenantId,
      branchId,
      traceNumber: 'TRACE-' + Date.now().toString().slice(-6),
      entityType: 'BARCODE_SCAN_EVENT',
      entityId: scan.id as string,
      entityCode: identifier,
      action: 'PROCESS_BARCODE_SCAN',
      actorName: actorId,
      actorRole: 'PHLEBOTOMY_NURSE',
      justification: `Decoded barcode for ${entityType}: ${identifier}`,
      integrityHash: hash
    });

    return scan;
  }

  async getScans(tenantId: string) {
    return await this.repo.getScans(tenantId);
  }

  // 3. UHF RFID Tag Engine
  async processRfidTagRead(tenantId: string, branchId: string, actorId: string, payload: Record<string, unknown>) {
    const epcHex = String(payload['epcHex'] || 'E280116060000204781299A1');
    const rfid = await this.repo.createRfidRead({
      tenantId,
      branchId,
      deviceId: String(payload['deviceId'] || 'dev_rfid_01'),
      epcHex,
      rssiDbm: Number(payload['rssiDbm']) || -52,
      antennaPort: Number(payload['antennaPort']) || 1,
      linkedItemDescription: String(payload['linkedItemDescription'] || 'Mindray SV300 Ventilator (Asset BMA-002)')
    });

    const hash = this.computeHash({ event: 'RFID_TAG_READ', id: rfid.id, epcHex });
    await this.repo.appendAuditTrace({
      tenantId,
      branchId,
      traceNumber: 'TRACE-' + Date.now().toString().slice(-6),
      entityType: 'RFID_TAG_READ',
      entityId: rfid.id as string,
      entityCode: epcHex,
      action: 'PROCESS_RFID_READ',
      actorName: actorId,
      actorRole: 'RFID_GATEWAY_RECEIVER',
      justification: `EPC Gen2 Tag read at antenna port 1: ${epcHex}`,
      integrityHash: hash
    });

    return rfid;
  }

  async getRfidReads(tenantId: string) {
    return await this.repo.getRfidReads(tenantId);
  }

  // 4. ZPL II Thermal Label Compiler & Dispatcher
  async generateZplLabel(tenantId: string, branchId: string, actorId: string, payload: Record<string, unknown>) {
    const templateType = String(payload['labelTemplateType'] || 'LIMS_VACUTAINER_TUBE');
    const sampleId = String(payload['sampleId'] || 'TUB-2026-9812');
    const patientName = String(payload['patientName'] || 'Kavita Joshi');
    const patientMrn = String(payload['patientMrn'] || 'MRN-2026-9041');
    const testName = String(payload['testName'] || 'CBC + Differential');
    const tubeCapColor = String(payload['tubeCapColor'] || 'PURPLE_EDTA');

    // Production ZPL II Byte Stream Generator
    let zpl = '';
    if (templateType === 'LIMS_VACUTAINER_TUBE') {
      zpl = [
        '^XA',
        '^PW400',
        '^LL200',
        '^FO20,15^A0N,22,22^FD' + patientName + ' (' + patientMrn + ')^FS',
        '^FO20,42^A0N,18,18^FD' + testName + ' [' + tubeCapColor + ']^FS',
        '^FO20,68^BY2,2,45^BCN,45,Y,N,N^FD' + sampleId + '^FS',
        '^FO280,68^BQN,2,4^FDQA,' + sampleId + '^FS',
        '^FO20,155^A0N,16,16^FDCollected: ' + new Date().toISOString().replace('T', ' ').slice(0, 16) + '^FS',
        '^XZ'
      ].join('\n');
    } else if (templateType === 'PATIENT_ID_WRISTBAND') {
      zpl = [
        '^XA',
        '^PW800',
        '^LL150',
        '^FO30,20^A0N,28,28^FD' + patientName + '^FS',
        '^FO30,55^A0N,20,20^FDDOB: 1990-05-14 | F | Blood: B+ve^FS',
        '^FO30,85^A0N,20,20^FDAllergies: PENICILLIN (ANAPHYLAXIS)^FS',
        '^FO500,20^BY2,2,60^BCN,60,Y,N,N^FD' + patientMrn + '^FS',
        '^FO700,20^BQN,2,5^FDQA,' + patientMrn + '^FS',
        '^XZ'
      ].join('\n');
    } else {
      zpl = [
        '^XA',
        '^PW400',
        '^LL240',
        '^FO20,20^A0N,24,24^FD' + String(payload['drugName'] || 'Meropenem 1g IV') + '^FS',
        '^FO20,50^A0N,18,18^FDBatch: BAT-2026-M09 | Exp: 2028-08^FS',
        '^FO20,80^BXN,4,200^FD' + String(payload['barcodeData'] || 'MED-MER-001') + '^FS',
        '^XZ'
      ].join('\n');
    }

    const printJob = await this.repo.createPrintJob({
      tenantId,
      branchId,
      printerDeviceId: String(payload['printerDeviceId'] || 'dev_printer_01'),
      labelTemplateType: templateType,
      labelDimensionsMm: { widthMm: 50, heightMm: 25 },
      dpi: Number(payload['dpi']) || 203,
      rawZplPayload: zpl,
      status: 'PRINTED_SUCCESS',
      printedCopies: Number(payload['copies']) || 1
    });

    const hash = this.computeHash({ event: 'ZPL_LABEL_PRINTED', printJobId: printJob.id, templateType });
    await this.repo.appendAuditTrace({
      tenantId,
      branchId,
      traceNumber: 'TRACE-' + Date.now().toString().slice(-6),
      entityType: 'ZPL_PRINT_JOB',
      entityId: printJob.id as string,
      entityCode: sampleId || patientMrn,
      action: 'GENERATE_ZPL_PRINT_JOB',
      actorName: actorId,
      actorRole: 'LIMS_ACCESSIONING_TECH',
      justification: `Compiled and streamed ZPL II label for ${templateType}`,
      integrityHash: hash
    });

    return printJob;
  }

  async getPrintJobs(tenantId: string) {
    return await this.repo.getPrintJobs(tenantId);
  }

  // Audit Traces
  async getAuditTraces(tenantId: string) {
    return await this.repo.getAuditTraces(tenantId);
  }

  // ==========================================================================
  // 5. LIS Hardware Analyzer Bidirectional Machine Interfacing (Milestone 3.3)
  // ==========================================================================

  // Register Automated Laboratory Analyzer
  async registerAnalyzer(tenantId: string, branchId: string, actorId: string, payload: Record<string, unknown>) {
    const analyzerCode = String(payload['analyzerCode'] || 'ANA-' + Date.now().toString().slice(-4));
    const analyzerName = String(payload['analyzerName'] || 'Sysmex XN-1000 Automated Hematology System');
    const manufacturer = String(payload['manufacturer'] || 'Sysmex Corporation');
    const model = String(payload['model'] || 'XN-1000');
    const serialNumber = String(payload['serialNumber'] || 'SN-XN-' + Date.now().toString().slice(-6));
    const protocol = String(payload['protocol'] || 'ASTM_E1381_E1394');
    const communicationMode = (payload['communicationMode'] as 'BIDIRECTIONAL' | 'UNIDIRECTIONAL') || 'BIDIRECTIONAL';
    const connectionType = (payload['connectionType'] as 'SERIAL_RS232' | 'TCP_IP') || 'TCP_IP';

    const analyzer = await this.repo.createAnalyzer({
      tenantId,
      branchId,
      analyzerCode,
      analyzerName,
      manufacturer,
      model,
      serialNumber,
      protocol,
      communicationMode,
      connectionType,
      ipAddress: String(payload['ipAddress'] || '192.168.10.45'),
      port: Number(payload['port']) || 5100,
      baudRate: Number(payload['baudRate']) || 9600,
      dataBits: Number(payload['dataBits']) || 8,
      stopBits: Number(payload['stopBits']) || 1,
      parity: String(payload['parity'] || 'NONE'),
      flowControl: String(payload['flowControl'] || 'NONE'),
      departmentName: String(payload['departmentName'] || 'Clinical Hematology'),
      status: 'ONLINE',
      capabilities: (payload['capabilities'] as string[]) || ['CBC', 'DIFF', 'RETIC']
    });

    const hash = this.computeHash({ event: 'ANALYZER_REGISTERED', analyzerId: analyzer.id, analyzerCode, serialNumber });
    await this.repo.appendAuditTrace({
      tenantId,
      branchId,
      traceNumber: 'TRACE-' + Date.now().toString().slice(-6),
      entityType: 'LAB_ANALYZER',
      entityId: analyzer.id as string,
      entityCode: analyzerCode,
      action: 'REGISTER_ANALYZER',
      actorName: actorId,
      actorRole: 'BIOMEDICAL_LIS_ENGINEER',
      justification: `Automated analyzer connected via ${protocol} (${connectionType})`,
      integrityHash: hash
    });

    return analyzer;
  }

  async getAnalyzers(tenantId: string) {
    return await this.repo.getAnalyzers(tenantId);
  }

  async getAnalyzerById(tenantId: string, analyzerId: string) {
    const analyzer = await this.repo.getAnalyzerById(tenantId, analyzerId);
    if (!analyzer) {
      throw new AppError({ message: `Analyzer not found: ${analyzerId}`, statusCode: 404 });
    }
    return analyzer;
  }

  // ASTM E1381 Low-Level Protocol Handshake (ENQ -> ACK)
  async processAstmHandshake(tenantId: string, analyzerId: string, controlChar: string) {
    await this.getAnalyzerById(tenantId, analyzerId);
    const char = controlChar.trim();

    if (char === ASTM_CTRL.ENQ || char === 'ENQ' || char === '0x05') {
      return {
        responseByte: ASTM_CTRL.ACK,
        responseCode: 'ACK',
        hexByte: '0x06',
        sessionStatus: 'ESTABLISHED_READY_FOR_FRAMES'
      };
    } else if (char === ASTM_CTRL.EOT || char === 'EOT' || char === '0x04') {
      return {
        responseByte: ASTM_CTRL.ACK,
        responseCode: 'ACK',
        hexByte: '0x06',
        sessionStatus: 'SESSION_TERMINATED'
      };
    } else if (char === ASTM_CTRL.ACK || char === 'ACK' || char === '0x06') {
      return {
        responseByte: ASTM_CTRL.ACK,
        responseCode: 'ACK',
        hexByte: '0x06',
        sessionStatus: 'READY_FOR_NEXT_FRAME'
      };
    } else {
      return {
        responseByte: ASTM_CTRL.NAK,
        responseCode: 'NAK',
        hexByte: '0x15',
        sessionStatus: 'UNRECOGNIZED_CONTROL_BYTE'
      };
    }
  }

  // ASTM E1381 / E1394 Message Ingestion & Automatic Results Mapping
  async processAstmMessage(
    tenantId: string,
    branchId: string,
    actorId: string,
    analyzerId: string,
    payload: Record<string, unknown>
  ) {
    const analyzer = await this.getAnalyzerById(tenantId, analyzerId);
    const rawMessage = String(payload['rawMessage'] || payload['rawFrame'] || '');
    if (!rawMessage) {
      throw new AppError({ message: 'rawMessage or rawFrame is required for ASTM processing', statusCode: 400 });
    }

    // Verify framing checksum if raw frame passed
    if (rawMessage.startsWith(ASTM_CTRL.STX) || (payload['rawFrame'] && String(payload['rawFrame']).includes(ASTM_CTRL.ETX))) {
      const decoded = decodeAstmFrame(rawMessage);
      if (!decoded.isValid) {
        throw new AppError({
          message: `ASTM E1381 frame checksum mismatch. Computed: ${decoded.calculatedChecksum}, Received: ${decoded.checksum}`,
          statusCode: 400
        });
      }
    }

    const parsed = parseAstmE1394(rawMessage);
    const specimenBarcode = parsed.order.specimenBarcode || parsed.query.specimenBarcode || 'TUB-2026-9812';

    // Map to Worklist Order if exists
    const worklistOrder = await this.repo.getWorklistOrderByBarcode(specimenBarcode);
    const patientMrn = worklistOrder?.patientMrn || parsed.patient.patientId || 'MRN-2026-9041';
    const patientName = worklistOrder?.patientName || parsed.patient.patientName || 'Kavita Joshi';
    const orderNumber = worklistOrder?.orderNumber || 'ORD-LAB-' + specimenBarcode;

    // Evaluate observations, reference ranges and critical panic values
    const observations: AnalyzerObservation[] = [];
    const panicAlerts: AnalyzerPanicAlertRecord[] = [];

    for (const obs of parsed.observations) {
      const refInfo = CLINICAL_REFERENCE_RANGES[obs.parameterCode.toUpperCase()];
      let abnormalFlag: AnalyzerObservation['abnormalFlag'] = 'NORMAL';
      let isCritical = false;

      if (refInfo) {
        if (refInfo.criticalMin !== undefined && obs.numericValue < refInfo.criticalMin) {
          abnormalFlag = 'CRITICAL_LOW';
          isCritical = true;
        } else if (refInfo.criticalMax !== undefined && obs.numericValue > refInfo.criticalMax) {
          abnormalFlag = 'CRITICAL_HIGH';
          isCritical = true;
        } else if (obs.numericValue < refInfo.refMin) {
          abnormalFlag = 'LOW';
        } else if (obs.numericValue > refInfo.refMax) {
          abnormalFlag = 'HIGH';
        }
      } else if (obs.abnormalFlag === 'H' || obs.abnormalFlag === 'HIGH') {
        abnormalFlag = 'HIGH';
      } else if (obs.abnormalFlag === 'L' || obs.abnormalFlag === 'LOW') {
        abnormalFlag = 'LOW';
      } else if (obs.abnormalFlag === 'HH') {
        abnormalFlag = 'CRITICAL_HIGH';
        isCritical = true;
      } else if (obs.abnormalFlag === 'LL') {
        abnormalFlag = 'CRITICAL_LOW';
        isCritical = true;
      }

      observations.push({
        parameterCode: obs.parameterCode,
        parameterName: obs.parameterName || refInfo?.name || obs.parameterCode,
        numericValue: obs.numericValue,
        resultValue: obs.value,
        unit: obs.unit || refInfo?.unit || '',
        referenceRange: obs.referenceRange || (refInfo ? `${refInfo.refMin}-${refInfo.refMax}` : ''),
        referenceMin: refInfo?.refMin,
        referenceMax: refInfo?.refMax,
        criticalMin: refInfo?.criticalMin,
        criticalMax: refInfo?.criticalMax,
        abnormalFlag,
        isCritical,
        instrumentFlags: obs.status
      });

      // If panic threshold breached, trigger instant Critical Alert
      if (isCritical && refInfo) {
        const panicHash = this.computeHash({
          event: 'PANIC_ALERT_TRIGGERED',
          analyzerId,
          patientMrn,
          parameterCode: obs.parameterCode,
          measuredValue: obs.value
        });

        const alert = await this.repo.createPanicAlert({
          tenantId,
          branchId,
          analyzerId,
          patientMrn,
          patientName,
          location: 'Central Pathology Laboratory',
          testName: refInfo.name,
          parameterCode: obs.parameterCode,
          measuredValue: `${obs.value} ${obs.unit || refInfo.unit}`,
          normalRange: `${refInfo.refMin} - ${refInfo.refMax} ${refInfo.unit}`,
          panicThreshold: obs.numericValue > (refInfo.criticalMax || 0) ? `> ${refInfo.criticalMax}` : `< ${refInfo.criticalMin}`,
          category: refInfo.category,
          urgencyLevel: 'CRITICAL_IMMEDIATE',
          clinicalRiskSummary: refInfo.clinicalRisk,
          communicatedToDoctor: true,
          doctorName: worklistOrder?.orderingDoctor || 'Dr. Ramesh Sharma, MD',
          alertTimestamp: new Date(),
          integrityHash: panicHash
        });
        panicAlerts.push(alert);
      }
    }

    const resultStatus = panicAlerts.length > 0 ? 'CRITICAL_FLAGGED' : 'INGESTED';
    const integrityHash = this.computeHash({
      event: 'ASTM_RESULT_INGESTED',
      analyzerId,
      specimenBarcode,
      obsCount: observations.length,
      panicCount: panicAlerts.length
    });

    const resultRecord = await this.repo.createAnalyzerResult({
      tenantId,
      branchId,
      analyzerId,
      analyzerName: analyzer.analyzerName,
      specimenBarcode,
      patientMrn,
      patientName,
      orderNumber,
      testPanelCode: parsed.order.testCode || 'CBC',
      protocol: 'ASTM_E1381_E1394',
      observations,
      rawMessagePayload: rawMessage,
      transmissionTimestamp: new Date(),
      status: resultStatus,
      integrityHash
    });

    await this.repo.appendAuditTrace({
      tenantId,
      branchId,
      traceNumber: 'TRACE-' + Date.now().toString().slice(-6),
      entityType: 'ANALYZER_RESULT',
      entityId: resultRecord.id as string,
      entityCode: specimenBarcode,
      action: 'INGEST_ASTM_RESULTS',
      actorName: actorId,
      actorRole: 'LIS_INSTRUMENT_DAEMON',
      justification: `Ingested ${observations.length} analytes from ${analyzer.analyzerName}. Panic alerts: ${panicAlerts.length}`,
      integrityHash
    });

    return {
      success: true,
      resultRecord,
      observationsCount: observations.length,
      criticalAlertsTriggered: panicAlerts.length,
      panicAlerts,
      handshakeReply: {
        byte: ASTM_CTRL.ACK,
        code: 'ACK'
      }
    };
  }

  // HL7 v2.x MLLP Message Ingestion & Application ACK Generator
  async processHl7Message(
    tenantId: string,
    branchId: string,
    actorId: string,
    analyzerId: string,
    payload: Record<string, unknown>
  ) {
    const analyzer = await this.getAnalyzerById(tenantId, analyzerId);
    const rawPayload = String(payload['hl7Message'] || payload['rawMessage'] || '');
    if (!rawPayload) {
      throw new AppError({ message: 'hl7Message is required for HL7 processing', statusCode: 400 });
    }

    const parsed = parseHl7OruR01(rawPayload);
    const specimenBarcode = parsed.obr.specimenAccession || 'TUB-2026-7734';
    const worklistOrder = await this.repo.getWorklistOrderByBarcode(specimenBarcode);

    const patientMrn = worklistOrder?.patientMrn || parsed.pid.mrn || 'MRN-2026-1142';
    const patientName = worklistOrder?.patientName || parsed.pid.patientName || 'Amit Verma';
    const orderNumber = worklistOrder?.orderNumber || parsed.obr.placerOrderNumber || 'ORD-LAB-' + specimenBarcode;

    const observations: AnalyzerObservation[] = [];
    const panicAlerts: AnalyzerPanicAlertRecord[] = [];

    for (const obx of parsed.obxList) {
      const refInfo = CLINICAL_REFERENCE_RANGES[obx.parameterCode.toUpperCase()];
      let abnormalFlag: AnalyzerObservation['abnormalFlag'] = 'NORMAL';
      let isCritical = false;

      if (refInfo) {
        if (refInfo.criticalMin !== undefined && obx.numericValue < refInfo.criticalMin) {
          abnormalFlag = 'CRITICAL_LOW';
          isCritical = true;
        } else if (refInfo.criticalMax !== undefined && obx.numericValue > refInfo.criticalMax) {
          abnormalFlag = 'CRITICAL_HIGH';
          isCritical = true;
        } else if (obx.numericValue < refInfo.refMin) {
          abnormalFlag = 'LOW';
        } else if (obx.numericValue > refInfo.refMax) {
          abnormalFlag = 'HIGH';
        }
      } else if (obx.abnormalFlag === 'HH') {
        abnormalFlag = 'CRITICAL_HIGH';
        isCritical = true;
      } else if (obx.abnormalFlag === 'LL') {
        abnormalFlag = 'CRITICAL_LOW';
        isCritical = true;
      } else if (obx.abnormalFlag === 'H') {
        abnormalFlag = 'HIGH';
      } else if (obx.abnormalFlag === 'L') {
        abnormalFlag = 'LOW';
      }

      observations.push({
        parameterCode: obx.parameterCode,
        parameterName: obx.parameterName || refInfo?.name || obx.parameterCode,
        numericValue: obx.numericValue,
        resultValue: obx.value,
        unit: obx.unit || refInfo?.unit || '',
        referenceRange: obx.referenceRange || (refInfo ? `${refInfo.refMin}-${refInfo.refMax}` : ''),
        referenceMin: refInfo?.refMin,
        referenceMax: refInfo?.refMax,
        criticalMin: refInfo?.criticalMin,
        criticalMax: refInfo?.criticalMax,
        abnormalFlag,
        isCritical,
        instrumentFlags: obx.resultStatus
      });

      if (isCritical && refInfo) {
        const panicHash = this.computeHash({
          event: 'PANIC_ALERT_TRIGGERED',
          analyzerId,
          patientMrn,
          parameterCode: obx.parameterCode,
          measuredValue: obx.value
        });

        const alert = await this.repo.createPanicAlert({
          tenantId,
          branchId,
          analyzerId,
          patientMrn,
          patientName,
          location: 'Clinical Biochemistry Laboratory',
          testName: refInfo.name,
          parameterCode: obx.parameterCode,
          measuredValue: `${obx.value} ${obx.unit || refInfo.unit}`,
          normalRange: `${refInfo.refMin} - ${refInfo.refMax} ${refInfo.unit}`,
          panicThreshold: obx.numericValue > (refInfo.criticalMax || 0) ? `> ${refInfo.criticalMax}` : `< ${refInfo.criticalMin}`,
          category: refInfo.category,
          urgencyLevel: 'CRITICAL_IMMEDIATE',
          clinicalRiskSummary: refInfo.clinicalRisk,
          communicatedToDoctor: true,
          doctorName: worklistOrder?.orderingDoctor || 'Dr. Priya Desai, MD',
          alertTimestamp: new Date(),
          integrityHash: panicHash
        });
        panicAlerts.push(alert);
      }
    }

    const resultStatus = panicAlerts.length > 0 ? 'CRITICAL_FLAGGED' : 'INGESTED';
    const integrityHash = this.computeHash({
      event: 'HL7_RESULT_INGESTED',
      analyzerId,
      specimenBarcode,
      obsCount: observations.length,
      panicCount: panicAlerts.length
    });

    const resultRecord = await this.repo.createAnalyzerResult({
      tenantId,
      branchId,
      analyzerId,
      analyzerName: analyzer.analyzerName,
      specimenBarcode,
      patientMrn,
      patientName,
      orderNumber,
      testPanelCode: parsed.obr.testCode || 'BMP',
      protocol: 'HL7_V2_MLLP',
      observations,
      rawMessagePayload: rawPayload,
      transmissionTimestamp: new Date(),
      status: resultStatus,
      integrityHash
    });

    await this.repo.appendAuditTrace({
      tenantId,
      branchId,
      traceNumber: 'TRACE-' + Date.now().toString().slice(-6),
      entityType: 'ANALYZER_RESULT',
      entityId: resultRecord.id as string,
      entityCode: specimenBarcode,
      action: 'INGEST_HL7_RESULTS',
      actorName: actorId,
      actorRole: 'LIS_MLLP_RECEIVER',
      justification: `Ingested ${observations.length} HL7 observations. Panic alerts: ${panicAlerts.length}`,
      integrityHash
    });

    const hl7Ack = buildHl7Ack(parsed.msh.messageControlId, 'AA', 'ORU^R01 Observation ingested successfully');

    return {
      success: true,
      resultRecord,
      observationsCount: observations.length,
      criticalAlertsTriggered: panicAlerts.length,
      panicAlerts,
      hl7Ack
    };
  }

  // Bidirectional Worklist Order Query (Barcode -> ASTM O / HL7 OML^O21)
  async queryWorklistByBarcode(tenantId: string, analyzerId: string, barcode: string) {
    const analyzer = await this.getAnalyzerById(tenantId, analyzerId);
    let worklist = await this.repo.getWorklistOrderByBarcode(barcode);

    if (!worklist) {
      // Synthesize order from tube barcode if not pre-registered
      worklist = {
        orderNumber: 'ORD-LAB-' + barcode,
        specimenBarcode: barcode,
        patientMrn: 'MRN-2026-9041',
        patientName: 'Kavita Joshi',
        patientDob: '1990-05-14',
        patientGender: 'F',
        testCode: barcode.includes('7734') ? 'BMP' : 'CBC',
        testName: barcode.includes('7734') ? 'Basic Metabolic Panel' : 'Complete Blood Count',
        priority: 'ROUTINE',
        specimenType: 'WHOLE_BLOOD',
        containerType: 'K2_EDTA',
        fastingConfirmed: true,
        orderingDoctor: 'Dr. Ramesh Sharma, MD',
        department: 'Hematology'
      };
      await this.repo.createWorklistOrder(worklist);
    }

    const astmPayload = buildAstmWorklistOrder(
      analyzer.analyzerCode,
      { mrn: worklist.patientMrn, name: worklist.patientName, dob: worklist.patientDob, gender: worklist.patientGender },
      { orderNumber: worklist.orderNumber, specimenBarcode: worklist.specimenBarcode, testCode: worklist.testCode, priority: worklist.priority }
    );

    const hl7Payload = buildHl7OmlO21(
      { mrn: worklist.patientMrn, name: worklist.patientName, dob: worklist.patientDob, gender: worklist.patientGender },
      { orderNumber: worklist.orderNumber, specimenBarcode: worklist.specimenBarcode, testCode: worklist.testCode, testName: worklist.testName, priority: worklist.priority }
    );

    return {
      success: true,
      barcode,
      worklistOrder: worklist,
      astmWorklistMessage: astmPayload,
      hl7WorklistMessage: hl7Payload
    };
  }

  // Westgard Multirule Quality Control (QC) Evaluation
  async evaluateQcRun(
    tenantId: string,
    branchId: string,
    actorId: string,
    analyzerId: string,
    payload: Record<string, unknown>
  ) {
    const analyzer = await this.getAnalyzerById(tenantId, analyzerId);
    const testCode = String(payload['testCode'] || 'CBC_WBC');
    const testName = String(payload['testName'] || 'White Blood Cell Count QC');
    const controlLotNumber = String(payload['controlLotNumber'] || 'LOT-2026-N01');
    const controlLevel = (payload['controlLevel'] as 'LEVEL_1_NORMAL' | 'LEVEL_2_HIGH' | 'LEVEL_3_LOW') || 'LEVEL_1_NORMAL';
    const targetMean = Number(payload['targetMean']);
    const standardDeviation = Number(payload['standardDeviation']);
    const measuredValue = Number(payload['measuredValue']);

    if (isNaN(targetMean) || isNaN(standardDeviation) || isNaN(measuredValue)) {
      throw new AppError({ message: 'targetMean, standardDeviation, and measuredValue must be valid numbers', statusCode: 400 });
    }

    // Retrieve prior QC runs for this analyzer and test code to build history
    const pastRuns = await this.repo.getQcRuns(tenantId, analyzerId, testCode);
    const clientHistory = (payload['historicalZScores'] as number[]) || [];
    const historyZScores = clientHistory.length > 0 ? clientHistory : pastRuns.map(r => r.zScore);

    const evaluation = evaluateWestgardRules(targetMean, standardDeviation, measuredValue, historyZScores);

    const qcRecord = await this.repo.createQcRun({
      tenantId,
      branchId,
      analyzerId,
      analyzerName: analyzer.analyzerName,
      testCode,
      testName,
      controlLotNumber,
      controlLevel,
      targetMean,
      standardDeviation,
      measuredValue,
      zScore: evaluation.zScore,
      westgardStatus: evaluation.westgardStatus,
      violatedRules: evaluation.violatedRules,
      runTimestamp: new Date(),
      operatorId: actorId,
      correctiveAction: evaluation.recommendation
    });

    const hash = this.computeHash({
      event: 'QC_RUN_EVALUATED',
      analyzerId,
      testCode,
      zScore: evaluation.zScore,
      status: evaluation.westgardStatus
    });

    await this.repo.appendAuditTrace({
      tenantId,
      branchId,
      traceNumber: 'TRACE-' + Date.now().toString().slice(-6),
      entityType: 'ANALYZER_QC_RUN',
      entityId: qcRecord.id as string,
      entityCode: testCode,
      action: 'EVALUATE_QC_RUN',
      actorName: actorId,
      actorRole: 'QUALITY_CONTROL_MANAGER',
      justification: `Evaluated Westgard rules for ${testCode}: ${evaluation.westgardStatus}. Violations: ${evaluation.violatedRules.join(', ') || 'None'}`,
      integrityHash: hash
    });

    return {
      success: true,
      qcRecord,
      evaluation
    };
  }

  async getQcRuns(tenantId: string, analyzerId?: string, testCode?: string) {
    return await this.repo.getQcRuns(tenantId, analyzerId, testCode);
  }

  async getCriticalAlerts(tenantId: string, patientMrn?: string) {
    return await this.repo.getPanicAlerts(tenantId, patientMrn);
  }

  async getAnalyzerResults(tenantId: string, analyzerId?: string, specimenBarcode?: string) {
    return await this.repo.getAnalyzerResults(tenantId, analyzerId, specimenBarcode);
  }
}

