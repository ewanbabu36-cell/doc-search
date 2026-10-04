import { apiRequest } from './api-client.js';
import type { QuickCatalogDrug, QuickLabTestItem } from './clinical-diagnostic-icd10-catalog.js';

export interface CatalogMedication {
  id: string; // PostgreSQL UUID in clinical.medication_catalog
  tenantId: string;
  code: string;
  name: string;
  genericName?: string | null;
  brandName?: string | null;
  dosageForm: string;
  strength?: string | null;
  route?: string | null;
  standardDosage?: string | null;
  frequency?: string | null;
  durationDays?: number | null;
  instructions?: string | null;
  isRestricted?: boolean;
  requiresPrescription?: boolean;
  status: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CatalogInvestigation {
  id: string; // PostgreSQL UUID in clinical.investigation_catalog
  tenantId: string;
  testCode: string;
  testName: string;
  category?: string | null;
  sampleType?: string | null;
  turnaroundTimeHours?: number | null;
  fastingRequired?: boolean;
  basePrice?: number | null;
  isPanel?: boolean;
  isActive?: boolean;
  status: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface SearchCatalogParams {
  search?: string | undefined;
  category?: string | undefined;
  limit?: number | undefined;
}

export function mapCatalogMedicationToCockpitDrug(item: CatalogMedication): QuickCatalogDrug & { catalogId: string } {
  const formPrefix =
    item.dosageForm === 'TABLET' ? 'Tab ' :
    item.dosageForm === 'CAPSULE' ? 'Cap ' :
    item.dosageForm === 'SYRUP' ? 'Syp ' :
    item.dosageForm === 'INJECTION' ? 'Inj ' :
    item.dosageForm === 'OINTMENT' ? 'Oint ' :
    item.dosageForm === 'DROPS' ? 'Drops ' :
    item.dosageForm === 'INHALER' ? 'Inhaler ' : '';

  const rawName = item.brandName || item.name;
  const displayName = rawName.startsWith(formPrefix.trim()) ? rawName : `${formPrefix}${rawName}`;

  let dosage = item.standardDosage || '1 Tab';
  if (!item.standardDosage) {
    if (item.dosageForm === 'CAPSULE') dosage = '1 Cap';
    else if (item.dosageForm === 'SYRUP') dosage = '5 ml';
    else if (item.dosageForm === 'INJECTION') dosage = '1 Vial';
    else if (item.dosageForm === 'DROPS') dosage = '2 Drops';
    else if (item.dosageForm === 'OINTMENT') dosage = 'Apply Locally';
    else if (item.dosageForm === 'INHALER') dosage = '2 Puffs';
  }

  let frequency = item.frequency || '1 - 0 - 1';
  let beforeAfterFood: 'AFTER_FOOD' | 'BEFORE_FOOD' | 'BEDTIME' | 'EMPTY_STOMACH' = 'AFTER_FOOD';
  let duration = item.durationDays || 5;
  let instructions = item.instructions || 'Take after meals with water';

  const genLower = (item.genericName || '').toLowerCase();
  const brandLower = (item.brandName || item.name).toLowerCase();

  if (genLower.includes('prazole') || genLower.includes('tidine')) {
    frequency = '1 - 0 - 0';
    beforeAfterFood = 'EMPTY_STOMACH';
    duration = 7;
    instructions = 'Take morning 30 mins before breakfast on empty stomach';
  } else if (genLower.includes('azithromycin') || brandLower.includes('azithral') || brandLower.includes('azee')) {
    frequency = '0 - 0 - 1';
    duration = 3;
    instructions = 'Once daily at evening time after food';
  } else if (genLower.includes('amox') || genLower.includes('cefix') || brandLower.includes('augmentin')) {
    frequency = '1 - 0 - 1';
    duration = 5;
    instructions = 'Complete full 5-day antibiotic course without skipping';
  } else if (genLower.includes('paracetamol') || brandLower.includes('dolo') || brandLower.includes('calpol')) {
    frequency = '1 - 0 - 1';
    duration = 3;
    instructions = 'Take after meals for fever/pain';
  } else if (genLower.includes('statin')) {
    frequency = '0 - 0 - 1';
    beforeAfterFood = 'BEDTIME';
    duration = 30;
    instructions = 'Take daily at bedtime';
  } else if (genLower.includes('cetirizine') || genLower.includes('montelukast') || genLower.includes('levocet')) {
    frequency = '0 - 0 - 1';
    beforeAfterFood = 'BEDTIME';
    duration = 7;
    instructions = 'Take at night before sleeping';
  }

  const genericName = item.genericName || item.name;
  const strength = item.strength || 'Standard';
  const janSubName = `Jan Aushadhi ${genericName} ${strength}`;
  const brandPrice = 85;
  const janPrice = 18;

  return {
    id: item.id,
    catalogId: item.id,
    name: displayName,
    genericName,
    strength,
    dosage,
    frequency,
    duration,
    beforeAfterFood,
    instructions,
    genericSubstituteName: janSubName,
    brandPrice,
    janAushadhiPrice: janPrice,
    category: item.dosageForm || 'GENERAL'
  };
}

export function mapCatalogInvestigationToQuickTest(item: CatalogInvestigation): QuickLabTestItem & { catalogId: string } {
  const categoryRaw = (item.category || 'PATHOLOGY').toUpperCase();
  const validCategories: Array<'HEMATOLOGY' | 'BIOCHEMISTRY' | 'IMMUNOLOGY' | 'PATHOLOGY' | 'RADIOLOGY' | 'CARDIOLOGY' | 'ENDOCRINOLOGY'> = [
    'HEMATOLOGY', 'BIOCHEMISTRY', 'IMMUNOLOGY', 'PATHOLOGY', 'RADIOLOGY', 'CARDIOLOGY', 'ENDOCRINOLOGY'
  ];
  const matchedCategory = validCategories.find((c) => categoryRaw.includes(c)) || 'PATHOLOGY';

  let shortName = item.testCode;
  if (item.testName.length <= 15) {
    shortName = item.testName;
  } else if (item.testName.includes('(') && item.testName.includes(')')) {
    const match = item.testName.match(/\(([^)]+)\)/);
    if (match?.[1]) {
      shortName = match[1].split('/')[0]!.trim();
    }
  }

  return {
    id: item.id,
    catalogId: item.id,
    testCode: item.testCode,
    name: item.testName,
    shortName,
    category: matchedCategory,
    categoryLabel: item.category || 'Laboratory',
    specimen: item.sampleType || 'Whole Blood / Serum',
    fasting: Boolean(item.fastingRequired),
    tatHours: item.turnaroundTimeHours || 4
  };
}

class ClinicalCatalogService {
  /**
   * Query database-backed medication catalog with optional search, category, and limit.
   */
  public async searchMedications(params: SearchCatalogParams = {}, signal?: AbortSignal): Promise<CatalogMedication[]> {
    const searchParams = new URLSearchParams();
    if (params.search && params.search.trim()) {
      searchParams.set('search', params.search.trim());
    }
    if (params.category && params.category !== 'ALL') {
      searchParams.set('category', params.category);
    }
    if (params.limit) {
      searchParams.set('limit', String(params.limit));
    }

    const qs = searchParams.toString();
    const endpoint = `/api/v1/partner/clinical/medications${qs ? `?${qs}` : ''}`;

    const options: RequestInit = { method: 'GET' };
    if (signal) {
      options.signal = signal;
    }

    const res = await apiRequest<CatalogMedication[]>(endpoint, options);

    if (!res.success) {
      throw new Error(res.error?.message || 'Failed to search medication catalog');
    }

    return res.data || [];
  }

  /**
   * Query database-backed investigation catalog with optional search, category, and limit.
   */
  public async searchInvestigations(params: SearchCatalogParams = {}, signal?: AbortSignal): Promise<CatalogInvestigation[]> {
    const searchParams = new URLSearchParams();
    if (params.search && params.search.trim()) {
      searchParams.set('search', params.search.trim());
    }
    if (params.category && params.category !== 'ALL') {
      searchParams.set('category', params.category);
    }
    if (params.limit) {
      searchParams.set('limit', String(params.limit));
    }

    const qs = searchParams.toString();
    const endpoint = `/api/v1/partner/clinical/investigations${qs ? `?${qs}` : ''}`;

    const options: RequestInit = { method: 'GET' };
    if (signal) {
      options.signal = signal;
    }

    const res = await apiRequest<CatalogInvestigation[]>(endpoint, options);

    if (!res.success) {
      throw new Error(res.error?.message || 'Failed to search investigation catalog');
    }

    return res.data || [];
  }
}

export const clinicalCatalogService = new ClinicalCatalogService();
