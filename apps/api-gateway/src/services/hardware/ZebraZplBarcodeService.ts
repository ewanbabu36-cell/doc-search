/**
 * Zebra Programming Language (ZPL II) Enterprise Healthcare Label Generator
 * Complies with GS1 Healthcare Barcode Standard & NABL/NABH Laboratory Specimen Labeling.
 */

export interface PatientWristbandParams {
  hospitalName: string;
  uhid: string;
  ipdNumber: string;
  patientName: string;
  ageGender: string;
  bloodGroup: string;
  attendingDoctor: string;
  wardBed: string;
  admissionDate: string;
  allergies?: string | undefined;
  dpi?: 203 | 300 | undefined;
}

export interface PathologyVialLabelParams {
  sampleId: string;
  uhid: string;
  patientName: string;
  ageGender?: string | undefined;
  testName: string;
  loincCode?: string | undefined;
  tubeCapColor: string;
  collectionTimestamp: string;
  phlebotomistId?: string | undefined;
  dpi?: 203 | 300 | undefined;
}

export interface UnitDoseMedicationLabelParams {
  drugName: string;
  genericName: string;
  strength: string;
  batchNumber: string;
  expiryDate: string;
  barcodeData: string;
  scheduleCategory?: string | undefined;
  dpi?: 203 | 300 | undefined;
}

export class ZebraZplBarcodeService {
  /**
   * Generates standard ZPL II payload for Hospital Inpatient Thermal Wristbands (Direct Thermal, Tear-off)
   * Dimensions: Standard 1" x 10" (approx 200 x 800 dots @ 203dpi)
   */
  public generatePatientWristbandZpl(params: PatientWristbandParams): string {
    const dpi = params.dpi || 203;
    const printWidth = dpi === 300 ? 1200 : 800;
    const allergyText = params.allergies ? `ALLERGY ALERT: ${params.allergies.toUpperCase()}` : 'NO KNOWN ALLERGIES';

    return [
      '^XA',
      `^PW${printWidth}`,
      '^LL240',
      '^LH0,0',
      // Hospital Header
      `^FO40,15^A0N,22,22^FD${params.hospitalName.toUpperCase()}^FS`,
      '^FO40,38^GB720,2,2^FS',
      // Patient Demographics
      `^FO40,48^A0N,28,28^FD${params.patientName.toUpperCase()}^FS`,
      `^FO40,80^A0N,20,20^FDUHID: ${params.uhid} | IPD: ${params.ipdNumber}^FS`,
      `^FO40,105^A0N,20,20^FDAge/Sex: ${params.ageGender} | Blood: ${params.bloodGroup}^FS`,
      `^FO40,130^A0N,20,20^FDWard/Bed: ${params.wardBed} | Adm: ${params.admissionDate}^FS`,
      `^FO40,155^A0N,20,20^FDDr. ${params.attendingDoctor}^FS`,
      // High-visibility allergy warning banner
      `^FO40,185^GB520,30,30^FS`,
      `^FO45,190^A0N,20,20^FR^FD${allergyText}^FS`,
      // Code 128 Barcode for bedside medication & vitals verification
      `^FO580,50^BY2,3,70^BCN,70,Y,N,N^FD${params.uhid}^FS`,
      // 2D QR Code for instant mobile nurse scanning
      `^FO480,50^BQN,2,4^FDMM,A${params.uhid}|${params.ipdNumber}|${params.bloodGroup}^FS`,
      '^XZ'
    ].join('\n');
  }

  /**
   * Generates ZPL II label for Pathology Specimen Vacutainer Tubes (50mm x 25mm label @ 203dpi)
   */
  public generatePathologyVialLabelZpl(params: PathologyVialLabelParams): string {
    return [
      '^XA',
      '^PW400',
      '^LL200',
      '^LH0,0',
      // Specimen and Patient Header
      `^FO15,12^A0N,22,22^FD${params.patientName.toUpperCase()}^FS`,
      `^FO15,36^A0N,18,18^FDUHID: ${params.uhid} (${params.ageGender || 'Adult'})^FS`,
      `^FO15,56^A0N,20,20^FD${params.testName}^FS`,
      `^FO15,78^A0N,16,16^FDLOINC: ${params.loincCode || 'NABL-STD'} | TUBE: ${params.tubeCapColor}^FS`,
      `^FO15,96^A0N,16,16^FDColl: ${params.collectionTimestamp}^FS`,
      // Code128 Barcode for automated clinical analyzer rack feeder
      `^FO15,120^BY2,2,45^BCN,45,Y,N,N^FD${params.sampleId}^FS`,
      // 2D DataMatrix barcode for micro-sample pipetting
      `^FO300,120^BXN,3,200^FD${params.sampleId}^FS`,
      '^XZ'
    ].join('\n');
  }

  /**
   * Generates ZPL II label for Unit-Dose Pharmacy Packaging with GS1 2D DataMatrix
   */
  public generateUnitDoseMedicationLabelZpl(params: UnitDoseMedicationLabelParams): string {
    const schedule = params.scheduleCategory ? `[${params.scheduleCategory}]` : '';

    return [
      '^XA',
      '^PW400',
      '^LL200',
      '^LH0,0',
      `^FO15,15^A0N,22,22^FD${params.drugName} ${schedule}^FS`,
      `^FO15,40^A0N,18,18^FDGeneric: ${params.genericName}^FS`,
      `^FO15,62^A0N,18,18^FDStrength: ${params.strength}^FS`,
      `^FO15,86^A0N,16,16^FDBatch: ${params.batchNumber} | Exp: ${params.expiryDate}^FS`,
      // GS1 DataMatrix containing AI (01) GTIN + (10) Batch + (17) Expiry
      `^FO20,115^BXN,4,200^FD${params.barcodeData}^FS`,
      `^FO120,130^A0N,18,18^FDScan before bed-dispense^FS`,
      '^XZ'
    ].join('\n');
  }
}

export const zebraZplBarcodeService = new ZebraZplBarcodeService();
