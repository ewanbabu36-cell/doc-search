import { createLogger, AppError, ErrorCode } from '@docsearch/shared-core';

const logger = createLogger('multi-facility-bed-telemetry');

export type BedTypeCategory =
  | 'ICU_VENTILATOR'
  | 'ICU_NON_VENTILATOR'
  | 'HIGH_DEPENDENCY_HDU'
  | 'ISOLATION_NEGATIVE_PRESSURE'
  | 'STEP_DOWN'
  | 'GENERAL_WARD';

export interface FacilityBedCensusItem {
  partnerId: string;
  facilityName: string;
  city: string;
  state: string;
  facilityTier: 'TERTIARY_CARE' | 'SECONDARY_CARE' | 'COMMUNITY_HOSPITAL' | 'SPECIALTY_CLINIC';
  totalBeds: number;
  occupiedBeds: number;
  availableBeds: number;
  occupancyPercent: number;
  alertLevel: 'NORMAL' | 'WARNING_HIGH' | 'CRITICAL_SURGE';
  breakdown: Record<BedTypeCategory, { total: number; occupied: number; available: number }>;
  lastHeartbeat: string;
}

export type TransferAcuityLevel = 'CRITICAL_L1_VENTILATOR' | 'URGENT_L2_OXYGEN' | 'STABLE_L3_STEPDOWN';
export type TransferStatus = 'PENDING_APPROVAL' | 'COORDINATING_DISPATCH' | 'BED_RESERVED_LOCKED' | 'AMBULANCE_EN_ROUTE' | 'COMPLETED_HANDOVER' | 'CANCELLED';

export interface InterFacilityTransferRecord {
  id: string;
  transferNumber: string;
  patientUhid: string;
  patientName: string;
  age: number;
  gender: string;
  acuityLevel: TransferAcuityLevel;
  clinicalDiagnosis: string;
  originPartnerId: string;
  originFacilityName: string;
  destinationPartnerId: string;
  destinationFacilityName: string;
  requestedBedType: BedTypeCategory;
  assignedBedId?: string | undefined;
  transportType: 'ACLS_CARDIAC_AMBULANCE' | 'BLS_OXYGEN_AMBULANCE' | 'NEONATAL_TRANSPORT';
  ambulanceTrackingNumber?: string | undefined;
  status: TransferStatus;
  requestedAt: string;
  dispatchedAt?: string | undefined;
  completedAt?: string | undefined;
  clinicalHandoverSummary?: string | undefined;
}

const DEFAULT_NETWORK_CENSUS: FacilityBedCensusItem[] = [
  {
    partnerId: 'PARTNER-001',
    facilityName: 'Metropolitan Multispecialty Hospital',
    city: 'Mumbai',
    state: 'Maharashtra',
    facilityTier: 'TERTIARY_CARE',
    totalBeds: 250,
    occupiedBeds: 232,
    availableBeds: 18,
    occupancyPercent: 92.8,
    alertLevel: 'CRITICAL_SURGE',
    breakdown: {
      ICU_VENTILATOR: { total: 30, occupied: 29, available: 1 },
      ICU_NON_VENTILATOR: { total: 20, occupied: 19, available: 1 },
      HIGH_DEPENDENCY_HDU: { total: 40, occupied: 38, available: 2 },
      ISOLATION_NEGATIVE_PRESSURE: { total: 20, occupied: 18, available: 2 },
      STEP_DOWN: { total: 40, occupied: 38, available: 2 },
      GENERAL_WARD: { total: 100, occupied: 90, available: 10 }
    },
    lastHeartbeat: new Date().toISOString()
  },
  {
    partnerId: 'PARTNER-004',
    facilityName: 'City Heart Diagnostics & Cardiac Center',
    city: 'Pune',
    state: 'Maharashtra',
    facilityTier: 'SECONDARY_CARE',
    totalBeds: 80,
    occupiedBeds: 62,
    availableBeds: 18,
    occupancyPercent: 77.5,
    alertLevel: 'NORMAL',
    breakdown: {
      ICU_VENTILATOR: { total: 12, occupied: 8, available: 4 },
      ICU_NON_VENTILATOR: { total: 10, occupied: 7, available: 3 },
      HIGH_DEPENDENCY_HDU: { total: 18, occupied: 14, available: 4 },
      ISOLATION_NEGATIVE_PRESSURE: { total: 5, occupied: 3, available: 2 },
      STEP_DOWN: { total: 15, occupied: 12, available: 3 },
      GENERAL_WARD: { total: 20, occupied: 18, available: 2 }
    },
    lastHeartbeat: new Date().toISOString()
  },
  {
    partnerId: 'PARTNER-005',
    facilityName: 'Delhi Central Medical Institute',
    city: 'New Delhi',
    state: 'Delhi NCR',
    facilityTier: 'TERTIARY_CARE',
    totalBeds: 320,
    occupiedBeds: 284,
    availableBeds: 36,
    occupancyPercent: 88.8,
    alertLevel: 'WARNING_HIGH',
    breakdown: {
      ICU_VENTILATOR: { total: 40, occupied: 36, available: 4 },
      ICU_NON_VENTILATOR: { total: 30, occupied: 28, available: 2 },
      HIGH_DEPENDENCY_HDU: { total: 50, occupied: 45, available: 5 },
      ISOLATION_NEGATIVE_PRESSURE: { total: 20, occupied: 17, available: 3 },
      STEP_DOWN: { total: 60, occupied: 52, available: 8 },
      GENERAL_WARD: { total: 120, occupied: 106, available: 14 }
    },
    lastHeartbeat: new Date().toISOString()
  }
];

const DEFAULT_TRANSFERS: InterFacilityTransferRecord[] = [
  {
    id: 'TRF-2026-001',
    transferNumber: 'TRF-MUM-8819',
    patientUhid: 'UHID-2026-102',
    patientName: 'Kishore Kumar',
    age: 58,
    gender: 'Male',
    acuityLevel: 'CRITICAL_L1_VENTILATOR',
    clinicalDiagnosis: 'Acute Respiratory Distress Syndrome (ARDS) secondary to Severe Pneumonia; requiring ECMO/Tertiary ICU',
    originPartnerId: 'PARTNER-004',
    originFacilityName: 'City Heart Diagnostics & Cardiac Center',
    destinationPartnerId: 'PARTNER-001',
    destinationFacilityName: 'Metropolitan Multispecialty Hospital',
    requestedBedType: 'ICU_VENTILATOR',
    assignedBedId: 'ICU-VENT-04',
    transportType: 'ACLS_CARDIAC_AMBULANCE',
    ambulanceTrackingNumber: 'AMB-MH-01-CT-9912',
    status: 'AMBULANCE_EN_ROUTE',
    requestedAt: '2026-11-04T02:30:00.000Z',
    dispatchedAt: '2026-11-04T03:15:00.000Z',
    clinicalHandoverSummary: 'Arterial line in-situ, Infusion Noradrenaline 0.1mcg/kg/min, Target SpO2 >92% on FiO2 60%'
  },
  {
    id: 'TRF-2026-002',
    transferNumber: 'TRF-DL-4401',
    patientUhid: 'UHID-2026-319',
    patientName: 'Sunita Deshmukh',
    age: 64,
    gender: 'Female',
    acuityLevel: 'URGENT_L2_OXYGEN',
    clinicalDiagnosis: 'NSTEMI with evolving cardiogenic instability; requires Emergency Cath Lab Coronary Angiogram',
    originPartnerId: 'PARTNER-002',
    originFacilityName: 'Dr. Amitabh Verma Cardiology Clinic',
    destinationPartnerId: 'PARTNER-005',
    destinationFacilityName: 'Delhi Central Medical Institute',
    requestedBedType: 'HIGH_DEPENDENCY_HDU',
    transportType: 'ACLS_CARDIAC_AMBULANCE',
    status: 'PENDING_APPROVAL',
    requestedAt: '2026-11-04T05:00:00.000Z'
  }
];

export class MultiFacilityBedTelemetryService {
  private census: FacilityBedCensusItem[] = [...DEFAULT_NETWORK_CENSUS];
  private transfers: InterFacilityTransferRecord[] = [...DEFAULT_TRANSFERS];

  public getNetworkCensus() {
    const totalNetworkBeds = this.census.reduce((acc, f) => acc + f.totalBeds, 0);
    const totalOccupied = this.census.reduce((acc, f) => acc + f.occupiedBeds, 0);
    const totalAvailable = this.census.reduce((acc, f) => acc + f.availableBeds, 0);
    const networkOccupancyPercent = totalNetworkBeds > 0 ? Math.round((totalOccupied / totalNetworkBeds) * 1000) / 10 : 0;

    const criticalSurgeCount = this.census.filter((f) => f.alertLevel === 'CRITICAL_SURGE').length;
    const warningCount = this.census.filter((f) => f.alertLevel === 'WARNING_HIGH').length;

    return {
      summary: {
        totalNetworkBeds,
        totalOccupied,
        totalAvailable,
        networkOccupancyPercent,
        criticalSurgeCount,
        warningCount,
        reportingFacilitiesCount: this.census.length
      },
      facilities: this.census
    };
  }

  public listTransfers(status?: string): InterFacilityTransferRecord[] {
    if (status && status !== 'ALL') {
      return this.transfers.filter((t) => t.status === status);
    }
    return this.transfers;
  }

  public dispatchTransfer(params: {
    transferId: string;
    destinationBedId: string;
    ambulanceNumber?: string | undefined;
    clinicalHandoverSummary?: string | undefined;
  }): InterFacilityTransferRecord {
    const target = this.transfers.find((t) => t.id === params.transferId);
    if (!target) {
      throw new AppError({
        message: `Transfer ${params.transferId} not found.`,
        code: ErrorCode.NOT_FOUND,
        statusCode: 404
      });
    }

    target.status = 'AMBULANCE_EN_ROUTE';
    target.assignedBedId = params.destinationBedId;
    if (params.ambulanceNumber) {
      target.ambulanceTrackingNumber = params.ambulanceNumber;
    }
    if (params.clinicalHandoverSummary) {
      target.clinicalHandoverSummary = params.clinicalHandoverSummary;
    }
    target.dispatchedAt = new Date().toISOString();

    logger.info(`Inter-facility transfer ${target.transferNumber} dispatched: ${target.patientName} -> ${target.destinationFacilityName} (Bed ${params.destinationBedId})`);
    return target;
  }

  public completeTransfer(transferId: string): InterFacilityTransferRecord {
    const target = this.transfers.find((t) => t.id === transferId);
    if (!target) {
      throw new AppError({
        message: `Transfer ${transferId} not found.`,
        code: ErrorCode.NOT_FOUND,
        statusCode: 404
      });
    }

    target.status = 'COMPLETED_HANDOVER';
    target.completedAt = new Date().toISOString();
    logger.info(`Transfer ${target.transferNumber} completed. Clinical handover verified at ${target.destinationFacilityName}.`);
    return target;
  }
}

export const multiFacilityBedTelemetryService = new MultiFacilityBedTelemetryService();
