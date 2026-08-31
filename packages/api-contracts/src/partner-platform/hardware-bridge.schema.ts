import { z } from 'zod';

export const HardwareDeviceTypeEnum = z.enum([
  'BARCODE_SCANNER_HANDHELD',
  'RFID_UHF_SCANNER',
  'THERMAL_LABEL_PRINTER_ZPL',
  'WRISTBAND_PRINTER',
  'SMART_CARD_READER'
]);
export type HardwareDeviceType = z.infer<typeof HardwareDeviceTypeEnum>;

export const ConnectionProtocolEnum = z.enum([
  'WEB_USB',
  'WEB_SERIAL',
  'WEB_BLUETOOTH',
  'LOCAL_BRIDGE_WEBSOCKET',
  'TCP_IP_RAW'
]);
export type ConnectionProtocol = z.infer<typeof ConnectionProtocolEnum>;

export const BarcodeSymbologyEnum = z.enum([
  'CODE128',
  'GS1_DATAMATRIX',
  'QR_CODE',
  'EAN13',
  'ISBT128'
]);
export type BarcodeSymbology = z.infer<typeof BarcodeSymbologyEnum>;

export const LabelTemplateTypeEnum = z.enum([
  'LIMS_VACUTAINER_TUBE',
  'PHARMACY_UNIT_DOSE_SACHET',
  'PATIENT_ID_WRISTBAND',
  'BLOOD_BANK_BAG_QUAD',
  'BIOMEDICAL_ASSET_TAG'
]);
export type LabelTemplateType = z.infer<typeof LabelTemplateTypeEnum>;

export const HardwareDeviceDtoSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  deviceName: z.string(),
  deviceType: HardwareDeviceTypeEnum,
  protocol: ConnectionProtocolEnum,
  vendorIdHex: z.string(), // e.g. "0x05E0" (Zebra)
  productIdHex: z.string(), // e.g. "0x1200"
  serialNumber: z.string(),
  assignedWorkstation: z.string(), // e.g. "Phlebotomy Station 02"
  departmentName: z.string(),
  connectionStatus: z.enum(['CONNECTED_ONLINE', 'DISCONNECTED_OFFLINE', 'STANDBY_SLEEP', 'ERROR_FAULT']),
  lastHeartbeat: z.string()
});
export type HardwareDeviceDto = z.infer<typeof HardwareDeviceDtoSchema>;

export const BarcodeScanEventDtoSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  deviceId: z.string().uuid(),
  deviceName: z.string(),
  symbology: BarcodeSymbologyEnum,
  rawScanData: z.string(),
  decodedClinicalEntity: z.object({
    entityType: z.enum(['SAMPLE_SPECIMEN', 'MEDICATION_BATCH', 'PATIENT_MRN', 'BLOOD_UNIT', 'ASSET_EQUIPMENT']),
    identifier: z.string(),
    metaDetails: z.record(z.unknown())
  }),
  scannedAt: z.string()
});
export type BarcodeScanEventDto = z.infer<typeof BarcodeScanEventDtoSchema>;

export const RfidTagEventDtoSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  deviceId: z.string().uuid(),
  epcHex: z.string(), // 96-bit or 128-bit EPC
  rssiDbm: z.number(), // e.g. -54 dBm
  antennaPort: z.number(),
  linkedItemDescription: z.string(),
  scannedAt: z.string()
});
export type RfidTagEventDto = z.infer<typeof RfidTagEventDtoSchema>;

export const ZplPrintJobDtoSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  printerDeviceId: z.string().uuid(),
  labelTemplateType: LabelTemplateTypeEnum,
  labelDimensionsMm: z.object({
    widthMm: z.number(),
    heightMm: z.number()
  }),
  dpi: z.number().default(203),
  rawZplPayload: z.string(),
  status: z.enum(['QUEUED', 'STREAMING_TO_PRINTER', 'PRINTED_SUCCESS', 'PRINTER_ERROR']),
  printedCopies: z.number(),
  createdAt: z.string()
});
export type ZplPrintJobDto = z.infer<typeof ZplPrintJobDtoSchema>;

export const HardwareOverviewMetricsDtoSchema = z.object({
  connectedScannersCount: z.number(),
  connectedPrintersCount: z.number(),
  totalBarcodeScansToday: z.number(),
  totalRfidReadsToday: z.number(),
  labelsPrintedToday: z.number(),
  averageScanLatencyMs: z.number(),
  printJobSuccessRatePct: z.number()
});
export type HardwareOverviewMetricsDto = z.infer<typeof HardwareOverviewMetricsDtoSchema>;

export const HardwareAuditTraceDtoSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  traceNumber: z.string(),
  action: z.string(),
  entityType: z.string(),
  entityId: z.string(),
  entityCode: z.string(),
  actorName: z.string(),
  actorRole: z.string(),
  justification: z.string(),
  integrityHash: z.string(),
  timestamp: z.string()
});
export type HardwareAuditTraceDto = z.infer<typeof HardwareAuditTraceDtoSchema>;
