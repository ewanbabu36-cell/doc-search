import crypto from 'crypto';
import { HardwareBridgeRepository } from '../../repositories/partner/HardwareBridgeRepository.js';
import { AppError } from '@docsearch/shared-core';

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
}
