export interface CreateLabOrderInput {
  tenantId: string;
  partnerId?: string | undefined;
  organizationId?: string | undefined;
  branchId?: string | undefined;
  patientId: string;
  encounterId?: string | undefined;
  consultationId?: string | undefined;
  orderingDoctorId?: string | undefined;
  testCode?: string | undefined;
  testName: string;
  category?: string | undefined;
  priority?: string | undefined;
  clinicalIndication?: string | undefined;
  clinicalNotes?: string | undefined;
  instructions?: string | undefined;
}

export interface CollectSpecimenInput {
  tenantId: string;
  orderId: string;
  patientId?: string | undefined;
  specimenType: string;
  containerType?: string | undefined;
  collectedBy: string;
  collectionNotes?: string | undefined;
}

export interface EnterResultItem {
  parameterCode?: string | undefined;
  parameterName: string;
  resultValue: string;
  numericValue?: number | undefined;
  unit?: string | undefined;
  referenceRange?: string | undefined;
  abnormalFlag?: string | undefined;
  notes?: string | undefined;
}

export interface EnterResultInput {
  tenantId: string;
  orderId: string;
  parameterCode?: string | undefined;
  parameterName?: string | undefined;
  resultValue?: string | undefined;
  numericValue?: number | undefined;
  unit?: string | undefined;
  referenceRange?: string | undefined;
  abnormalFlag?: string | undefined;
  notes?: string | undefined;
  enteredBy: string;
  results?: EnterResultItem[] | undefined;
}

export interface StoredLabOrder {
  id: string;
  tenantId: string;
  partnerId: string;
  organizationId: string;
  branchId?: string | undefined;
  patientId: string;
  encounterId?: string | undefined;
  orderNumber: string;
  testCode: string;
  testName: string;
  category: string;
  priority: string;
  status: string;
  clinicalIndication?: string | undefined;
  instructions?: string | undefined;
  orderingDoctorId: string;
  orderedAt: Date;
  updatedAt: Date;
  specimen?: any;
  results: any[];
  verifiedBy?: string | undefined;
  verifiedAt?: Date | undefined;
  reviewedBy?: string | undefined;
  reviewedAt?: Date | undefined;
  doctorNotes?: string | undefined;
}

export class LabDiagnosticsRepository {
  private memOrders: Map<string, StoredLabOrder[]> = new Map();

  async searchOrders(
    tenantId: string,
    status?: string | undefined,
    patientId?: string | undefined,
    _dbClient?: any
  ): Promise<StoredLabOrder[]> {
    const current = this.memOrders.get(tenantId) || [];
    return current.filter((o) => {
      if (status && o.status !== status) return false;
      if (patientId && o.patientId !== patientId) return false;
      return true;
    });
  }

  async getOrderById(
    tenantId: string,
    orderId: string,
    _dbClient?: any
  ): Promise<StoredLabOrder | null> {
    const current = this.memOrders.get(tenantId) || [];
    return current.find((o) => o.id === orderId) || null;
  }

  async createOrder(
    input: CreateLabOrderInput,
    _dbClient?: any
  ): Promise<StoredLabOrder> {
    const id = crypto.randomUUID();
    const orderNumber = `LAB-${Math.floor(100000 + Math.random() * 900000)}`;
    const now = new Date();

    const orderData: StoredLabOrder = {
      id,
      tenantId: input.tenantId,
      partnerId: input.partnerId || '11111111-1111-4111-8111-111111111111',
      organizationId: input.organizationId || '33333333-3333-4333-8333-333333333301',
      branchId: input.branchId || '44444444-4444-4444-8444-444444444401',
      patientId: input.patientId,
      encounterId: input.encounterId,
      orderNumber,
      testCode: input.testCode || 'CBC-FULL',
      testName: input.testName,
      category: input.category || 'HEMATOLOGY',
      priority: input.priority || 'ROUTINE',
      status: 'ORDERED',
      clinicalIndication: input.clinicalIndication || input.clinicalNotes,
      instructions: input.instructions,
      orderingDoctorId: input.orderingDoctorId || 'aaaa1111-8492-4aaa-8aaa-849208492001',
      orderedAt: now,
      updatedAt: now,
      results: []
    };

    const current = this.memOrders.get(input.tenantId) || [];
    current.unshift(orderData);
    this.memOrders.set(input.tenantId, current);

    return orderData;
  }

  async collectSpecimen(
    input: CollectSpecimenInput,
    _dbClient?: any
  ): Promise<StoredLabOrder | null> {
    const accessionNumber = `ACC-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;
    const specimenData = {
      id: crypto.randomUUID(),
      tenantId: input.tenantId,
      orderId: input.orderId,
      accessionNumber,
      specimenType: input.specimenType,
      containerType: input.containerType || 'EDTA_LAVENDER',
      collectedBy: input.collectedBy,
      collectedAt: new Date(),
      status: 'RECEIVED'
    };

    const current = this.memOrders.get(input.tenantId) || [];
    const item = current.find(o => o.id === input.orderId);
    if (item) {
      item.status = 'SAMPLE_COLLECTED';
      item.specimen = specimenData;
      item.updatedAt = new Date();
      return item;
    }
    return null;
  }

  async enterResult(
    input: EnterResultInput,
    _dbClient?: any
  ): Promise<StoredLabOrder | null> {
    const current = this.memOrders.get(input.tenantId) || [];
    const item = current.find(o => o.id === input.orderId);

    const itemsToInsert: any[] = [];
    if (Array.isArray(input.results) && input.results.length > 0) {
      input.results.forEach((r) => {
        itemsToInsert.push({
          id: crypto.randomUUID(),
          parameterCode: r.parameterCode || 'PARAM',
          parameterName: r.parameterName,
          resultValue: r.resultValue,
          numericValue: r.numericValue,
          unit: r.unit || 'g/dL',
          referenceRange: r.referenceRange || '13.5 - 17.5',
          abnormalFlag: r.abnormalFlag || 'NORMAL',
          enteredBy: input.enteredBy,
          enteredAt: new Date()
        });
      });
    } else if (input.parameterName && input.resultValue) {
      itemsToInsert.push({
        id: crypto.randomUUID(),
        parameterCode: input.parameterCode || 'PARAM',
        parameterName: input.parameterName,
        resultValue: input.resultValue,
        numericValue: input.numericValue,
        unit: input.unit || 'g/dL',
        referenceRange: input.referenceRange || '13.5 - 17.5',
        abnormalFlag: input.abnormalFlag || 'NORMAL',
        enteredBy: input.enteredBy,
        enteredAt: new Date()
      });
    }

    if (item) {
      item.results = [...item.results, ...itemsToInsert];
      item.status = 'PROCESSING';
      item.updatedAt = new Date();
      return item;
    }

    return null;
  }

  async verifyResult(
    tenantId: string,
    orderId: string,
    verifiedBy: string,
    _dbClient?: any
  ): Promise<StoredLabOrder | null> {
    const current = this.memOrders.get(tenantId) || [];
    const item = current.find(o => o.id === orderId);
    if (item) {
      item.status = 'VERIFIED';
      item.verifiedBy = verifiedBy;
      item.verifiedAt = new Date();
      item.updatedAt = new Date();
      return item;
    }
    return null;
  }

  async reviewResult(
    tenantId: string,
    orderId: string,
    doctorNotes: string | undefined,
    session: any,
    _dbClient?: any
  ): Promise<StoredLabOrder | null> {
    const current = this.memOrders.get(tenantId) || [];
    const item = current.find(o => o.id === orderId);
    if (item) {
      item.status = 'REVIEWED';
      item.reviewedBy = session.userId;
      item.reviewedAt = new Date();
      item.doctorNotes = doctorNotes;
      item.updatedAt = new Date();
      return item;
    }
    return null;
  }
}

export const labDiagnosticsRepository = new LabDiagnosticsRepository();
