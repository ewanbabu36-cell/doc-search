import {
  getDatabase,
  partnerClassifications,
  eq,
  asc,
  type PartnerClassification,
  type NewPartnerClassification
} from '@docsearch/database';

export const INITIAL_PARTNER_CLASSIFICATIONS: PartnerClassification[] = [
  {
    id: 'c1000000-0000-4000-8000-000000000001',
    code: 'HOSPITAL_NETWORK',
    label: 'Hospital Network',
    description: 'Multi-specialty tertiary or secondary care hospital network',
    category: 'HEALTHCARE_PROVIDER',
    icon: '🏥',
    defaultPlanCode: 'PLAN_HOSPITAL_PRO',
    status: 'ACTIVE',
    sortOrder: 1,
    metadata: {},
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z')
  },
  {
    id: 'c1000000-0000-4000-8000-000000000002',
    code: 'CLINIC_GROUP',
    label: 'Clinic Group / Polyclinic',
    description: 'Outpatient primary and multi-specialty care clinics',
    category: 'HEALTHCARE_PROVIDER',
    icon: '🩺',
    defaultPlanCode: 'PLAN_CLINIC_STARTER',
    sortOrder: 2,
    status: 'ACTIVE',
    metadata: {},
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z')
  },
  {
    id: 'c1000000-0000-4000-8000-000000000003',
    code: 'PHARMACY',
    label: 'Independent Pharmacy Store (Chemist & Druggist)',
    description: 'Retail allopathic medication dispensing and inventory store',
    category: 'RETAIL_HEALTHCARE',
    icon: '💊',
    defaultPlanCode: 'PLAN_CLINIC_STARTER',
    sortOrder: 3,
    status: 'ACTIVE',
    metadata: {},
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z')
  },
  {
    id: 'c1000000-0000-4000-8000-000000000004',
    code: 'DIAGNOSTIC_LAB',
    label: 'Diagnostic Pathology Lab',
    description: 'NABL accredited pathology and clinical diagnostics',
    category: 'DIAGNOSTICS',
    icon: '🧪',
    defaultPlanCode: 'PLAN_CLINIC_STARTER',
    sortOrder: 4,
    status: 'ACTIVE',
    metadata: {},
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z')
  },
  {
    id: 'c1000000-0000-4000-8000-000000000005',
    code: 'SURGICAL_CENTER',
    label: 'Surgical Center',
    description: 'Ambulatory day care and day-surgery pavilion',
    category: 'HEALTHCARE_PROVIDER',
    icon: '🏥',
    defaultPlanCode: 'PLAN_CLINIC_STARTER',
    sortOrder: 5,
    status: 'ACTIVE',
    metadata: {},
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z')
  },
  {
    id: 'c1000000-0000-4000-8000-000000000006',
    code: 'INDIVIDUAL_PRACTICE',
    label: 'Individual Specialist Practice',
    description: 'Solo physician outpatient consulting room',
    category: 'HEALTHCARE_PROVIDER',
    icon: '👨‍⚕️',
    defaultPlanCode: 'PLAN_CLINIC_STARTER',
    sortOrder: 6,
    status: 'ACTIVE',
    metadata: {},
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z')
  }
];

export class PartnerClassificationRepository {
  private memoryClassifications: PartnerClassification[] = [...INITIAL_PARTNER_CLASSIFICATIONS];

  async findAll(status = 'ACTIVE', dbClient = getDatabase()): Promise<PartnerClassification[]> {
    if (dbClient) {
      try {
        const rows = await dbClient
          .select()
          .from(partnerClassifications)
          .where(eq(partnerClassifications.status, status))
          .orderBy(asc(partnerClassifications.sortOrder));
        if (rows && rows.length > 0) {
          return rows;
        }
      } catch {
        // Fallback to in-memory store
      }
    }
    return this.memoryClassifications
      .filter((c) => status === 'ALL' || c.status === status)
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }

  async findByCode(code: string, dbClient = getDatabase()): Promise<PartnerClassification | null> {
    if (dbClient) {
      try {
        const [row] = await dbClient
          .select()
          .from(partnerClassifications)
          .where(eq(partnerClassifications.code, code))
          .limit(1);
        if (row) return row;
      } catch {
        // Fallback
      }
    }
    return this.memoryClassifications.find((c) => c.code.toLowerCase() === code.toLowerCase()) || null;
  }

  async create(data: NewPartnerClassification, dbClient = getDatabase()): Promise<PartnerClassification> {
    if (dbClient) {
      try {
        const [created] = await dbClient.insert(partnerClassifications).values(data).returning();
        if (created) {
          this.memoryClassifications.push(created);
          return created;
        }
      } catch {
        // Fallback
      }
    }

    const created: PartnerClassification = {
      id: crypto.randomUUID(),
      code: data.code.toUpperCase(),
      label: data.label,
      description: data.description ?? null,
      category: data.category ?? 'HEALTHCARE_PROVIDER',
      icon: data.icon ?? '🏢',
      defaultPlanCode: data.defaultPlanCode ?? 'PLAN_CLINIC_STARTER',
      status: data.status ?? 'ACTIVE',
      sortOrder: data.sortOrder ?? (this.memoryClassifications.length + 1),
      metadata: (data as any).metadata ?? {},
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.memoryClassifications.push(created);
    return created;
  }
}

export const partnerClassificationRepository = new PartnerClassificationRepository();
