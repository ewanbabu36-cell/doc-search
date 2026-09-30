import type { InpatientBedDto, InpatientWardDto, BedStatus, BedType, BedClass } from '@docsearch/api-contracts';
import { getVerifiedRoleProfile } from '../utils/roleProfileResolver.js';

export interface BedBreakdownMetrics {
  totalBeds: number;
  occupiedBeds: number;
  availableBeds: number;
  cleaningBeds: number;
  blockedBeds: number;
  occupancyRatePct: number;
  icuOccupied: number;
  icuTotal: number;
  wardOccupied: number;
  wardTotal: number;
  deluxeOccupied: number;
  deluxeTotal: number;
  emergencyOccupied: number;
  emergencyTotal: number;
}

const DEFAULT_TENANT_ID = '11111111-1111-4111-8111-111111111111';
const DEFAULT_PARTNER_ID = '22222222-2222-4222-8222-222222222222';
const DEFAULT_ORG_ID = '33333333-3333-4333-8333-333333333333';
const DEFAULT_BRANCH_ID = '44444444-4444-4444-8444-444444444444';

/**
 * Reconciles the Inpatient bed inventory with the partner's verified company profile (Pillar 5).
 * Guarantees that any beds configured in Company Settings (ICU, General Ward, Deluxe, Emergency)
 * appear on the Live Inpatient Bed Board, while preserving any active patient admissions.
 */
export function synchronizeBedInventoryWithProfile(
  storedBeds: InpatientBedDto[] = [],
  _storedWards: InpatientWardDto[] = []
): { beds: InpatientBedDto[]; wards: InpatientWardDto[] } {
  const profile = getVerifiedRoleProfile();
  const capacity = profile.clinicalBedCapacity;

  const icuCount = Math.max(1, capacity?.icuBeds ?? 4);
  const generalWardCount = Math.max(1, capacity?.generalWardBeds ?? 15);
  const deluxeCount = Math.max(1, capacity?.deluxeBeds ?? 4);
  const emergencyCount = Math.max(1, capacity?.emergencyTriageBeds ?? 2);

  const nowIso = new Date().toISOString();

  // 1. Authoritative Wards matching 4 clinical departments
  const authoritativeWards: InpatientWardDto[] = [
    {
      id: 'a0000000-0000-4000-8000-000000000001',
      tenantId: DEFAULT_TENANT_ID,
      partnerId: DEFAULT_PARTNER_ID,
      organizationId: DEFAULT_ORG_ID,
      branchId: DEFAULT_BRANCH_ID,
      unitId: 'b0000000-0000-4000-8000-000000000001',
      wardCode: 'WARD-ICU',
      wardName: 'Intensive Care Unit (ICU)',
      wardType: 'ICU',
      careLevel: 'LEVEL_3_ICU',
      genderPolicy: 'COED',
      building: 'Main Tower',
      floor: '3rd Floor (Critical Wing)',
      wing: 'North Wing',
      nursingStationName: 'ICU Central Nursing Desk',
      isolationCapable: true,
      ventilatorCapable: true,
      totalBeds: icuCount,
      activeBeds: icuCount,
      occupiedBeds: 0,
      blockedBeds: 0,
      cleaningBeds: 0,
      isActive: true,
      createdAt: nowIso,
      updatedAt: nowIso
    },
    {
      id: 'a0000000-0000-4000-8000-000000000002',
      tenantId: DEFAULT_TENANT_ID,
      partnerId: DEFAULT_PARTNER_ID,
      organizationId: DEFAULT_ORG_ID,
      branchId: DEFAULT_BRANCH_ID,
      unitId: 'b0000000-0000-4000-8000-000000000002',
      wardCode: 'WARD-GW',
      wardName: 'General Medical-Surgical Ward',
      wardType: 'GENERAL',
      careLevel: 'LEVEL_1_OBSERVATION',
      genderPolicy: 'SEGREGATED_BAYS',
      building: 'Main Tower',
      floor: '2nd Floor',
      wing: 'East Wing',
      nursingStationName: 'General Ward Station 1',
      isolationCapable: false,
      ventilatorCapable: false,
      totalBeds: generalWardCount,
      activeBeds: generalWardCount,
      occupiedBeds: 0,
      blockedBeds: 0,
      cleaningBeds: 0,
      isActive: true,
      createdAt: nowIso,
      updatedAt: nowIso
    },
    {
      id: 'a0000000-0000-4000-8000-000000000003',
      tenantId: DEFAULT_TENANT_ID,
      partnerId: DEFAULT_PARTNER_ID,
      organizationId: DEFAULT_ORG_ID,
      branchId: DEFAULT_BRANCH_ID,
      unitId: 'b0000000-0000-4000-8000-000000000003',
      wardCode: 'WARD-DLX',
      wardName: 'Deluxe Private Suite Ward',
      wardType: 'DELUXE',
      careLevel: 'LEVEL_2_STEPDOWN',
      genderPolicy: 'PRIVATE_ROOM',
      building: 'Executive Wing',
      floor: '4th Floor',
      wing: 'South Wing',
      nursingStationName: 'Executive Care Desk',
      isolationCapable: true,
      ventilatorCapable: false,
      totalBeds: deluxeCount,
      activeBeds: deluxeCount,
      occupiedBeds: 0,
      blockedBeds: 0,
      cleaningBeds: 0,
      isActive: true,
      createdAt: nowIso,
      updatedAt: nowIso
    },
    {
      id: 'a0000000-0000-4000-8000-000000000004',
      tenantId: DEFAULT_TENANT_ID,
      partnerId: DEFAULT_PARTNER_ID,
      organizationId: DEFAULT_ORG_ID,
      branchId: DEFAULT_BRANCH_ID,
      unitId: 'b0000000-0000-4000-8000-000000000004',
      wardCode: 'WARD-EMG',
      wardName: 'Emergency Triage & Trauma Bay',
      wardType: 'ICU',
      careLevel: 'LEVEL_3_ICU',
      genderPolicy: 'OPEN_TRIAGE',
      building: 'Trauma Center Ground Floor',
      floor: 'Ground Floor (Red Zone)',
      wing: 'Emergency Bay',
      nursingStationName: 'Emergency Triage Counter',
      isolationCapable: true,
      ventilatorCapable: true,
      totalBeds: emergencyCount,
      activeBeds: emergencyCount,
      occupiedBeds: 0,
      blockedBeds: 0,
      cleaningBeds: 0,
      isActive: true,
      createdAt: nowIso,
      updatedAt: nowIso
    }
  ];

  // Preserve existing wards map if any custom wards exist
  const existingBedsMap = new Map<string, InpatientBedDto>();
  for (const b of storedBeds) {
    if (b?.bedCode) existingBedsMap.set(b.bedCode, b);
  }

  const generatedBeds: InpatientBedDto[] = [];

  const createBedEntry = (
    index: number,
    prefix: string,
    ward: InpatientWardDto,
    bedType: BedType,
    bedClass: BedClass,
    dailyRate: number,
    hasOxygen: boolean,
    hasVentilator: boolean,
    hasMonitor: boolean
  ): InpatientBedDto => {
    const numStr = String(index).padStart(2, '0');
    const bedCode = `${prefix}-${numStr}`;
    const existing = existingBedsMap.get(bedCode);

    if (existing) {
      return {
        ...existing,
        wardId: ward.id,
        wardName: ward.wardName,
        bedType,
        bedClass,
        hasOxygenPort: hasOxygen,
        hasVentilator: hasVentilator,
        hasCardiacMonitor: hasMonitor,
        dailyChargeRate: existing.dailyChargeRate || dailyRate
      };
    }

    // Default realistic seed status for first-time onboarding
    let initialStatus: BedStatus = 'AVAILABLE';
    let currentPatientName: string | undefined = undefined;
    let currentPatientMrn: string | undefined = undefined;
    let currentAdmissionId: string | undefined = undefined;

    // Provide initial clinical context if fresh seed
    if (prefix === 'ICU' && index === 1) {
      initialStatus = 'OCCUPIED';
      currentPatientName = 'Ramesh Chandra (58M)';
      currentPatientMrn = 'MRN-2026-0814';
      currentAdmissionId = 'c0000000-0000-4000-8000-000000000001';
    } else if (prefix === 'GW' && index <= 2) {
      initialStatus = 'OCCUPIED';
      currentPatientName = index === 1 ? 'Sunita Devi (46F)' : 'Amitabh Sen (62M)';
      currentPatientMrn = index === 1 ? 'MRN-2026-0922' : 'MRN-2026-0941';
      currentAdmissionId = `c0000000-0000-4000-8000-00000000000${index + 1}`;
    } else if (prefix === 'GW' && index === 3) {
      initialStatus = 'CLEANING';
    }

    return {
      id: `bed-${prefix.toLowerCase()}-${numStr}-${Date.now().toString(36)}`,
      tenantId: DEFAULT_TENANT_ID,
      partnerId: DEFAULT_PARTNER_ID,
      organizationId: DEFAULT_ORG_ID,
      branchId: DEFAULT_BRANCH_ID,
      wardId: ward.id,
      wardName: ward.wardName,
      bedCode,
      bedNumber: `${prefix} Bed ${numStr}`,
      bedType,
      bedClass,
      status: initialStatus,
      genderEligibility: 'ANY',
      hasOxygenPort: hasOxygen,
      hasSuctionPort: true,
      hasVentilator,
      hasCardiacMonitor: hasMonitor,
      dailyChargeRate: dailyRate,
      currentPatientName,
      currentPatientMrn,
      currentAdmissionId,
      isActive: true,
      createdAt: nowIso,
      updatedAt: nowIso
    };
  };

  // 1. Generate ICU Beds
  for (let i = 1; i <= icuCount; i++) {
    generatedBeds.push(
      createBedEntry(i, 'ICU', authoritativeWards[0]!, 'ICU_CRITICAL', 'ICU', 6500, true, true, true)
    );
  }

  // 2. Generate General Ward Beds
  for (let i = 1; i <= generalWardCount; i++) {
    generatedBeds.push(
      createBedEntry(i, 'GW', authoritativeWards[1]!, 'STANDARD_ELECTRIC', 'GENERAL', 1800, true, false, false)
    );
  }

  // 3. Generate Deluxe Beds
  for (let i = 1; i <= deluxeCount; i++) {
    generatedBeds.push(
      createBedEntry(i, 'DLX', authoritativeWards[2]!, 'STANDARD_ELECTRIC', 'DELUXE', 4800, true, false, true)
    );
  }

  // 4. Generate Emergency Triage Beds
  for (let i = 1; i <= emergencyCount; i++) {
    generatedBeds.push(
      createBedEntry(i, 'EMG', authoritativeWards[3]!, 'ICU_CRITICAL', 'ICU', 3200, true, true, true)
    );
  }

  // Update occupancy counts per ward
  for (const ward of authoritativeWards) {
    const wardBeds = generatedBeds.filter((b) => b.wardId === ward.id);
    ward.totalBeds = wardBeds.length;
    ward.occupiedBeds = wardBeds.filter((b) => b.status === 'OCCUPIED').length;
    ward.cleaningBeds = wardBeds.filter((b) => b.status === 'CLEANING').length;
    ward.blockedBeds = wardBeds.filter((b) => b.status === 'BLOCKED' || b.status === 'MAINTENANCE').length;
  }

  return { beds: generatedBeds, wards: authoritativeWards };
}

/**
 * Calculates real-time bed metrics across the entire hospital facility.
 */
export function calculateBedBreakdownMetrics(beds: InpatientBedDto[]): BedBreakdownMetrics {
  const safeBeds = Array.isArray(beds) ? beds : [];
  const total = safeBeds.length;
  const occupied = safeBeds.filter((b) => b?.status === 'OCCUPIED').length;
  const available = safeBeds.filter((b) => b?.status === 'AVAILABLE').length;
  const cleaning = safeBeds.filter((b) => b?.status === 'CLEANING').length;
  const blocked = safeBeds.filter((b) => b?.status === 'BLOCKED' || b?.status === 'MAINTENANCE').length;

  const icuBeds = safeBeds.filter((b) => b?.bedCode?.startsWith('ICU'));
  const wardBeds = safeBeds.filter((b) => b?.bedCode?.startsWith('GW'));
  const dlxBeds = safeBeds.filter((b) => b?.bedCode?.startsWith('DLX'));
  const emgBeds = safeBeds.filter((b) => b?.bedCode?.startsWith('EMG'));

  return {
    totalBeds: total,
    occupiedBeds: occupied,
    availableBeds: available,
    cleaningBeds: cleaning,
    blockedBeds: blocked,
    occupancyRatePct: total > 0 ? Math.round((occupied / total) * 100) : 0,
    icuOccupied: icuBeds.filter((b) => b.status === 'OCCUPIED').length,
    icuTotal: icuBeds.length,
    wardOccupied: wardBeds.filter((b) => b.status === 'OCCUPIED').length,
    wardTotal: wardBeds.length,
    deluxeOccupied: dlxBeds.filter((b) => b.status === 'OCCUPIED').length,
    deluxeTotal: dlxBeds.length,
    emergencyOccupied: emgBeds.filter((b) => b.status === 'OCCUPIED').length,
    emergencyTotal: emgBeds.length
  };
}

/**
 * Broadcasts bed state updates across all connected components (Bed Board, Owner Pulse Cockpit, Nursing Station).
 */
export function broadcastBedState(beds: InpatientBedDto[]): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem('docsearch_inpatient_beds', JSON.stringify(beds));
    const metrics = calculateBedBreakdownMetrics(beds);
    localStorage.setItem('docsearch_inpatient_bed_metrics', JSON.stringify(metrics));

    window.dispatchEvent(
      new CustomEvent('docsearch_bed_state_changed', {
        detail: { beds, metrics }
      })
    );
  } catch {
    // Ignore storage quota limits in edge environments
  }
}
