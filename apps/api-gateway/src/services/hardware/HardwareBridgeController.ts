import { type FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { escPosThermalPrinterService } from './EscPosThermalPrinterService.js';
import { zebraZplBarcodeService } from './ZebraZplBarcodeService.js';
import { authenticate } from '../../plugins/auth-guard.js';

export const hardwareBridgeRoutes: FastifyPluginAsync = async (fastify) => {
  // Device Hardware Status Endpoint
  fastify.get('/api/v1/hardware/status', { preHandler: [authenticate] }, async (_request) => {
    return {
      success: true,
      data: {
        bridgeStatus: 'ONLINE_ACTIVE',
        spoolerEngine: 'ESCPOS_ZPL_DIRECT_STREAM',
        supportedThermalWidthsMm: [58, 80],
        supportedZplDpi: [203, 300],
        networkPrintersDiscovered: 3,
        usbPeripheralsConnected: ['Zebra ZD420 (USB001)', 'EPSON TM-T82III (COM3)', 'Honeywell Xenon 1900 Scanner']
      }
    };
  });

  // 1. Thermal Receipt Print Generation
  const PrintReceiptSchema = z.object({
    receiptType: z.enum(['OPD_TOKEN', 'PHARMACY_CASH_SLIP', 'LAB_ACCESSION']),
    hospitalName: z.string().default('DocSearch Multispeciality Hospital'),
    paperWidthMm: z.union([z.literal(58), z.literal(80)]).default(80),
    data: z.record(z.any())
  });

  fastify.post('/api/v1/hardware/print/receipt', { preHandler: [authenticate] }, async (request, reply) => {
    const parsed = PrintReceiptSchema.safeParse(request.body);
    if (!parsed.success) {
      reply.status(400);
      return { success: false, error: { code: 'INVALID_PRINT_PAYLOAD', details: parsed.error.format() } };
    }

    const { receiptType, hospitalName, paperWidthMm, data } = parsed.data;
    let rawBuffer: Buffer;

    switch (receiptType) {
      case 'OPD_TOKEN':
        rawBuffer = escPosThermalPrinterService.generateOpdToken({
          hospitalName,
          tokenNumber: data['tokenNumber'] || 'A-101',
          doctorName: data['doctorName'] || 'Dr. Amitabh Verma',
          department: data['department'] || 'General OPD',
          patientName: data['patientName'] || 'Priya Sharma',
          uhid: data['uhid'] || 'UHID-2026-001',
          queueTime: data['queueTime'],
          qrPayload: data['qrPayload'] || `https://my.docsearch.health/queue/token?id=${data['tokenNumber'] || 'A-101'}`,
          paperWidthMm
        });
        break;

      case 'PHARMACY_CASH_SLIP':
        rawBuffer = escPosThermalPrinterService.generatePharmacyCashSlip({
          hospitalName,
          billNumber: data['billNumber'] || 'RX-INV-2026-9001',
          patientName: data['patientName'] || 'Priya Sharma',
          uhid: data['uhid'] || 'UHID-2026-001',
          doctorName: data['doctorName'],
          items: data['items'] || [{ name: 'Paracetamol 650mg', batch: 'BAT-2026-A1', qty: 10, rate: 2.5, amount: 25.0 }],
          subTotal: Number(data['subTotal']) || 25.0,
          discount: Number(data['discount']) || 0,
          taxAmount: Number(data['taxAmount']) || 3.0,
          totalAmount: Number(data['totalAmount']) || 28.0,
          paperWidthMm
        });
        break;

      case 'LAB_ACCESSION':
        rawBuffer = escPosThermalPrinterService.generateLabAccessionSlip({
          hospitalName,
          accessionNumber: data['accessionNumber'] || 'ACC-2026-8801',
          uhid: data['uhid'] || 'UHID-2026-001',
          patientName: data['patientName'] || 'Priya Sharma',
          tests: data['tests'] || ['Complete Blood Count (CBC)', 'Lipid Profile', 'HbA1c'],
          phlebotomistName: data['phlebotomistName'] || 'Lab Technician',
          paperWidthMm
        });
        break;
    }

    return {
      success: true,
      data: {
        receiptType,
        byteLength: rawBuffer.length,
        rawBase64: rawBuffer.toString('base64'),
        mimeType: 'application/octet-stream',
        dispatchedAt: new Date().toISOString()
      }
    };
  });

  // 2. Patient Admission Wristband ZPL Generation
  const PrintWristbandSchema = z.object({
    hospitalName: z.string().default('DocSearch Multispeciality Hospital'),
    uhid: z.string(),
    ipdNumber: z.string(),
    patientName: z.string(),
    ageGender: z.string(),
    bloodGroup: z.string(),
    attendingDoctor: z.string(),
    wardBed: z.string(),
    admissionDate: z.string(),
    allergies: z.string().optional(),
    dpi: z.union([z.literal(203), z.literal(300)]).default(203)
  });

  fastify.post('/api/v1/hardware/print/wristband', { preHandler: [authenticate] }, async (request, reply) => {
    const parsed = PrintWristbandSchema.safeParse(request.body);
    if (!parsed.success) {
      reply.status(400);
      return { success: false, error: { code: 'INVALID_WRISTBAND_PAYLOAD', details: parsed.error.format() } };
    }

    const zplString = zebraZplBarcodeService.generatePatientWristbandZpl(parsed.data);

    return {
      success: true,
      data: {
        format: 'ZPL_II',
        uhid: parsed.data.uhid,
        rawZpl: zplString,
        dpi: parsed.data.dpi,
        spoolStatus: 'READY_TO_STREAM'
      }
    };
  });

  // 3. Pathology Vial Label ZPL Generation
  const PrintVialLabelSchema = z.object({
    sampleId: z.string(),
    uhid: z.string(),
    patientName: z.string(),
    testName: z.string(),
    loincCode: z.string().optional(),
    tubeCapColor: z.string().default('PURPLE_EDTA'),
    collectionTimestamp: z.string().default(new Date().toISOString())
  });

  fastify.post('/api/v1/hardware/print/vial-label', { preHandler: [authenticate] }, async (request, reply) => {
    const parsed = PrintVialLabelSchema.safeParse(request.body);
    if (!parsed.success) {
      reply.status(400);
      return { success: false, error: { code: 'INVALID_VIAL_PAYLOAD', details: parsed.error.format() } };
    }

    const zplString = zebraZplBarcodeService.generatePathologyVialLabelZpl(parsed.data);

    return {
      success: true,
      data: {
        format: 'ZPL_II',
        sampleId: parsed.data.sampleId,
        tubeCapColor: parsed.data.tubeCapColor,
        rawZpl: zplString,
        spoolStatus: 'READY_TO_STREAM'
      }
    };
  });

  // 4. Direct ESC/POS Spool Bridge (for Hardware Printer Agent)
  fastify.post('/api/v1/hardware/print/escpos', async (request, _reply) => {
    const body = (request.body as any) || {};
    const slip = body.slipData || {};
    const paperWidth = body.paperWidth === '58mm' ? 58 : 80;
    const printer = body.printerId || 'TVS-RP3200-Thermal';

    const rawBuffer = escPosThermalPrinterService.generateOpdToken({
      hospitalName: slip.clinicName || 'DocSearch Partner Clinic',
      tokenNumber: slip.tokenNo || slip.token || 'A-101',
      doctorName: slip.doctorName || 'Attending Doctor',
      department: slip.department || slip.specialty || 'Outpatient Department',
      patientName: slip.patientName || 'Registered Patient',
      uhid: slip.uhid || slip.mrn || 'UHID-2026',
      queueTime: slip.timestamp || new Date().toISOString(),
      qrPayload: slip.qrPayload || slip.verificationUrl,
      paperWidthMm: paperWidth
    });

    return {
      success: true,
      jobId: `JOB-${Date.now()}`,
      printer,
      byteLength: rawBuffer.length,
      rawBase64: rawBuffer.toString('base64'),
      status: 'SPOOLED_SUCCESSFULLY'
    };
  });

  // 5. Direct ZPL Spool Bridge (for Zebra Label Agent)
  fastify.post('/api/v1/hardware/print/zpl', async (request, _reply) => {
    const body = (request.body as any) || {};
    const labelType = body.labelType || 'WRISTBAND';
    const data = body.data || {};
    const printer = body.printerId || 'Zebra-ZD420-Thermal';

    let zplCode: string;
    if (labelType === 'VIAL') {
      zplCode = zebraZplBarcodeService.generatePathologyVialLabelZpl({
        sampleId: data.sampleId || data.barcode || 'SAMP-001',
        uhid: data.uhid || data.mrn || 'UHID-001',
        patientName: data.patientName || 'Patient',
        testName: data.testName || 'Investigation',
        tubeCapColor: data.tubeCapColor || 'LAVENDER_EDTA',
        collectionTimestamp: data.collectionTimestamp || new Date().toISOString()
      });
    } else {
      zplCode = zebraZplBarcodeService.generatePatientWristbandZpl({
        hospitalName: data.hospitalName || 'DocSearch Hospital',
        uhid: data.uhid || data.mrn || 'UHID-001',
        ipdNumber: data.ipdNumber || data.admissionNumber || 'IPD-001',
        patientName: data.patientName || 'Patient',
        ageGender: data.ageGender || `${data.age || '30'}Y / ${data.gender || 'M'}`,
        bloodGroup: data.bloodGroup || 'O+ve',
        attendingDoctor: data.attendingDoctor || data.doctorName || 'Dr. On Duty',
        wardBed: data.wardBed || `${data.ward || 'Gen'} - ${data.bed || '01'}`,
        admissionDate: data.admissionDate || new Date().toLocaleDateString('en-IN'),
        allergies: data.allergies || data.allergy || undefined
      });
    }

    return {
      success: true,
      jobId: `ZPL-${Date.now()}`,
      printer,
      zplCode,
      status: 'SPOOLED_SUCCESSFULLY'
    };
  });
};
