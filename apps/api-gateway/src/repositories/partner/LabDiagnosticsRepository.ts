import {
  getDatabase,
  investigationOrders,
  investigationSpecimens,
  doctorProfiles,
  eq,
  and,
  desc
} from '@docsearch/database';
import { AppError, ErrorCode, createLogger } from '@docsearch/shared-core';

const logger = createLogger('lab-diagnostics-repository');

function requireDb(dbClient = getDatabase()) {
  if (!dbClient) {
    logger.error('Database connection unavailable for lab diagnostics transaction');
    throw new AppError({
      message: 'Database service is unavailable. Lab diagnostics transactions are halted.',
      code: ErrorCode.SERVICE_UNAVAILABLE,
      statusCode: 503
    });
  }
  return dbClient;
}

function runInTx<T>(db: any, fn: (tx: any) => Promise<T>): Promise<T> {
  return typeof db.transaction === 'function' ? db.transaction(fn) : fn(db);
}

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
  testName?: string | undefined;
  tests?: string[] | undefined;
  category?: string | undefined;
  priority?: string | undefined;
  clinicalIndication?: string | undefined;
  clinicalNotes?: string | undefined;
  instructions?: string | undefined;
  billingPolicy?: string | undefined;
  metadata?: Record<string, unknown> | undefined;
}

export interface CollectSpecimenInput {
  tenantId: string;
  orderId: string;
  patientId?: string | undefined;
  specimenType: string;
  containerType?: string | undefined;
  collectedBy: string;
  collectionNotes?: string | undefined;
  deferredBilling?: boolean | undefined;
  isEmergency?: boolean | undefined;
}

export interface EnterResultItem {
  parameterCode?: string | undefined;
  parameterName?: string | undefined;
  testCode?: string | undefined;
  resultValue?: string | undefined;
  value?: string | number | undefined;
  numericValue?: number | undefined;
  unit?: string | undefined;
  referenceRange?: string | undefined;
  refRange?: string | undefined;
  abnormalFlag?: string | undefined;
  flag?: string | undefined;
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
  enteredBy?: string | undefined;
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
  async searchOrders(
    tenantId: string,
    status?: string | undefined,
    patientId?: string | undefined,
    dbClient = getDatabase()
  ): Promise<StoredLabOrder[]> {
    const db = requireDb(dbClient);
    try {
      const rows = await db
        .select()
        .from(investigationOrders)
        .where(eq(investigationOrders.tenantId, tenantId))
        .orderBy(desc(investigationOrders.createdAt));

      let list = (rows || []).map((row: any) => {
        const meta = (typeof row.metadata === 'object' && row.metadata !== null) ? row.metadata : {};
        return {
          ...row,
          testName: meta.testName || row.clinicalIndication || 'Investigation',
          testCode: meta.testCode || 'LAB-TEST',
          category: meta.category || 'HEMATOLOGY',
          priority: row.priority || 'ROUTINE',
          status: row.status || 'ORDERED',
          orderedAt: row.orderedAt || row.createdAt,
          results: meta.results || row.results || []
        } as StoredLabOrder;
      });
      if (status) list = list.filter(o => o.status === status);
      if (patientId) list = list.filter(o => o.patientId === patientId);
      return list;
    } catch (err) {
      logger.error('Failed to query lab orders from database', err);
      throw new AppError({
        message: 'Database query failed. Lab orders lookup unavailable.',
        code: ErrorCode.SERVICE_UNAVAILABLE,
        statusCode: 503
      });
    }
  }

  async getOrderById(
    tenantId: string,
    orderId: string,
    dbClient = getDatabase()
  ): Promise<StoredLabOrder | null> {
    const db = requireDb(dbClient);
    try {
      const [found] = await db
        .select()
        .from(investigationOrders)
        .where(and(eq(investigationOrders.tenantId, tenantId), eq(investigationOrders.id, orderId)));

      if (!found) return null;

      const [specimen] = await db
        .select()
        .from(investigationSpecimens)
        .where(and(eq(investigationSpecimens.tenantId, tenantId), eq(investigationSpecimens.orderId, orderId)));

      const meta = (typeof (found as any).metadata === 'object' && (found as any).metadata !== null) ? (found as any).metadata : {};
      const order = {
        ...found,
        testName: meta.testName || (found as any).clinicalIndication || 'Investigation',
        testCode: meta.testCode || 'LAB-TEST',
        category: meta.category || 'HEMATOLOGY',
        priority: (found as any).priority || 'ROUTINE',
        status: (found as any).status || 'ORDERED',
        orderedAt: (found as any).orderedAt || (found as any).createdAt,
        results: meta.results || (found as any).results || []
      } as unknown as StoredLabOrder;

      if (specimen && (specimen as any) !== found && (specimen as any).id !== order.id) {
        order.specimen = specimen;
      }
      return order;
    } catch (err) {
      logger.error('Failed to query lab order by ID from database', err);
      throw new AppError({
        message: 'Database query failed. Lab order lookup unavailable.',
        code: ErrorCode.SERVICE_UNAVAILABLE,
        statusCode: 503
      });
    }
  }

  async createOrder(
    input: CreateLabOrderInput,
    dbClient = getDatabase()
  ): Promise<StoredLabOrder> {
    const db = requireDb(dbClient);
    const id = crypto.randomUUID();
    const orderNumber = `ORD-INV-2026-${Math.floor(100000 + Math.random() * 900000)}`;
    const now = new Date();

    const testName = input.testName || (Array.isArray(input.tests) ? input.tests.join(', ') : 'STAT Urgent Biomarker Panel');

    const orderData: StoredLabOrder = {
      id,
      tenantId: input.tenantId,
      partnerId: input.partnerId || '00000000-0000-4000-8000-000000000001',
      organizationId: input.organizationId || '00000000-0000-4000-8000-000000000002',
      branchId: input.branchId || 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      patientId: input.patientId,
      encounterId: input.encounterId || '00000000-0000-4000-8000-000000000004',
      orderNumber,
      testCode: input.testCode || 'CBC-FULL',
      testName,
      category: input.category || 'HEMATOLOGY',
      priority: input.priority || 'ROUTINE',
      status: 'ORDERED',
      clinicalIndication: input.clinicalIndication || input.clinicalNotes || 'Routine diagnostic workup',
      instructions: input.instructions,
      orderingDoctorId: input.orderingDoctorId || '99999999-9999-4999-8999-999999999999',
      orderedAt: now,
      updatedAt: now,
      results: []
    };

    try {
      let validDoctorId: string = '99999999-9999-4999-8999-999999999999';
      if (orderData.orderingDoctorId) {
        try {
          const [doc] = await db
            .select({ id: doctorProfiles.id })
            .from(doctorProfiles)
            .where(eq(doctorProfiles.id, orderData.orderingDoctorId));
          if (doc) validDoctorId = doc.id;
        } catch {
          // fallback to seeded doctor
        }
      }

      await db.insert(investigationOrders).values({
        id: orderData.id,
        tenantId: orderData.tenantId,
        partnerId: orderData.partnerId,
        organizationId: orderData.organizationId,
        branchId: orderData.branchId,
        orderNumber: orderData.orderNumber,
        patientId: orderData.patientId,
        encounterId: orderData.encounterId,
        orderingDoctorId: validDoctorId,
        investigationId: '00000000-0000-4000-8000-000000000005',
        clinicalIndication: orderData.clinicalIndication,
        priority: orderData.priority,
        status: 'ORDERED',
        metadata: {
          testName: orderData.testName,
          testCode: orderData.testCode,
          category: orderData.category,
          instructions: orderData.instructions,
          billingPolicy: input.billingPolicy || 'STANDARD',
          ...(input.metadata || {})
        },
        createdAt: now,
        updatedAt: now
      } as any);

      return orderData;
    } catch (err: any) {
      logger.error('Failed to create lab order in database', err);
      throw new AppError({
        message: `Database persistence failed. Lab order creation aborted: ${err?.message || String(err)}`,
        code: ErrorCode.SERVICE_UNAVAILABLE,
        statusCode: 503
      });
    }
  }

  async collectSpecimen(
    input: CollectSpecimenInput,
    dbClient = getDatabase()
  ): Promise<StoredLabOrder | null> {
    const db = requireDb(dbClient);

    const order = await this.getOrderById(input.tenantId, input.orderId, db);
    if (!order) {
      throw new AppError({
        message: `Investigation order ${input.orderId} not found.`,
        code: ErrorCode.NOT_FOUND,
        statusCode: 404
      });
    }

    const orderMeta = (typeof (order as any).metadata === 'object' && (order as any).metadata !== null) ? (order as any).metadata : {};
    const billingPolicy = orderMeta.billingPolicy || orderMeta.billing_policy || 'STANDARD';
    const isPaymentRequiredBeforeSample =
      billingPolicy === 'PAYMENT_REQUIRED_BEFORE_SAMPLE' ||
      orderMeta.requirePaymentBeforeSample === true;

    if (isPaymentRequiredBeforeSample && !input.deferredBilling && !input.isEmergency) {
      const billingStatus = (orderMeta.billingStatus || orderMeta.billing_status || '').toUpperCase();
      if (billingStatus !== 'PAID' && billingStatus !== 'BILLED') {
        throw new AppError({
          message: `Specimen collection rejected: Payment is strictly required prior to sample collection under order billing policy (status: ${billingStatus || 'UNBILLED'}).`,
          code: ErrorCode.BAD_REQUEST,
          statusCode: 402
        });
      }
    }

    const accessionNumber = `ACC-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;
    const now = new Date();
    const specimenData = {
      id: crypto.randomUUID(),
      tenantId: input.tenantId,
      orderId: input.orderId,
      accessionNumber,
      specimenType: input.specimenType,
      containerType: input.containerType || 'EDTA_LAVENDER',
      collectedBy: input.collectedBy,
      collectedAt: now,
      status: 'RECEIVED'
    };

    try {
      return await runInTx(db, async (tx: any) => {
        await tx.insert(investigationSpecimens).values({
          id: specimenData.id,
          tenantId: specimenData.tenantId,
          partnerId: order.partnerId || '00000000-0000-4000-8000-000000000001',
          organizationId: order.organizationId || '00000000-0000-4000-8000-000000000002',
          orderId: specimenData.orderId,
          patientId: input.patientId || order.patientId,
          accessionNumber: specimenData.accessionNumber,
          specimenType: specimenData.specimenType,
          containerType: specimenData.containerType,
          collectionStatus: 'COLLECTED',
          collectedAt: now,
          createdAt: now,
          updatedAt: now
        } as any);

        await tx
          .update(investigationOrders)
          .set({ status: 'SAMPLE_COLLECTED', updatedAt: now } as any)
          .where(and(eq(investigationOrders.tenantId, input.tenantId), eq(investigationOrders.id, input.orderId)));

        return await this.getOrderById(input.tenantId, input.orderId, tx);
      });
    } catch (err: any) {
      if (err instanceof AppError) throw err;
      logger.error('Failed to create lab order in database', err);
      throw new AppError({
        message: `Database persistence failed. Lab order creation aborted: ${err?.message || String(err)}`,
        code: ErrorCode.SERVICE_UNAVAILABLE,
        statusCode: 503
      });
    }
  }

  async enterResult(
    input: EnterResultInput,
    dbClient = getDatabase()
  ): Promise<StoredLabOrder | null> {
    const db = requireDb(dbClient);
    const order = await this.getOrderById(input.tenantId, input.orderId, db);
    if (!order) return null;

    const now = new Date();
    const itemsToInsert: any[] = [];
    if (Array.isArray(input.results) && input.results.length > 0) {
      input.results.forEach((r) => {
        itemsToInsert.push({
          id: crypto.randomUUID(),
          parameterCode: r.parameterCode || r.testCode || 'PARAM',
          parameterName: r.parameterName || r.testCode || 'Test Parameter',
          resultValue: r.resultValue ?? String(r.value ?? ''),
          numericValue: r.numericValue ?? (typeof r.value === 'number' ? r.value : undefined),
          unit: r.unit || 'g/dL',
          referenceRange: r.referenceRange || r.refRange || '13.5 - 17.5',
          abnormalFlag: r.abnormalFlag || r.flag || 'NORMAL',
          enteredBy: input.enteredBy || 'LAB_SUPERVISOR',
          enteredAt: now
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
        enteredBy: input.enteredBy || 'LAB_SUPERVISOR',
        enteredAt: now
      });
    }

    try {
      const orderMeta = (typeof (order as any).metadata === 'object' && (order as any).metadata !== null) ? (order as any).metadata : {};
      const newResults = [...(orderMeta.results || []), ...itemsToInsert];
      await db
        .update(investigationOrders)
        .set({
          status: 'RESULT_ENTERED',
          metadata: { ...orderMeta, results: newResults },
          updatedAt: now
        } as any)
        .where(and(eq(investigationOrders.tenantId, input.tenantId), eq(investigationOrders.id, input.orderId)));

      const updated = await this.getOrderById(input.tenantId, input.orderId, db);
      return updated;
    } catch (err) {
      logger.error('Failed to enter lab results in database', err);
      throw new AppError({
        message: 'Database update failed. Result entry aborted.',
        code: ErrorCode.SERVICE_UNAVAILABLE,
        statusCode: 503
      });
    }
  }

  async verifyResult(
    tenantId: string,
    orderId: string,
    verifiedBy: string,
    dbClient = getDatabase()
  ): Promise<StoredLabOrder | null> {
    const db = requireDb(dbClient);
    const now = new Date();
    try {
      const order = await this.getOrderById(tenantId, orderId, db);
      const orderMeta = (order && typeof (order as any).metadata === 'object' && (order as any).metadata !== null) ? (order as any).metadata : {};
      const verifiedResults = ((order?.results && order.results.length > 0) ? order.results : (orderMeta.results || [])).map((r: any) => ({
        ...r,
        verifiedBy,
        verifiedAt: now
      }));

      await db
        .update(investigationOrders)
        .set({
          status: 'VERIFIED',
          metadata: {
            ...orderMeta,
            results: verifiedResults,
            verifiedBy,
            verifiedAt: now
          },
          updatedAt: now
        } as any)
        .where(and(eq(investigationOrders.tenantId, tenantId), eq(investigationOrders.id, orderId)));

      const updated = await this.getOrderById(tenantId, orderId, db);
      if (updated) {
        updated.status = 'VERIFIED';
        updated.verifiedBy = verifiedBy;
        updated.verifiedAt = now;
        updated.results = verifiedResults;
      }
      return updated;
    } catch (err) {
      logger.error('Failed to verify lab results in database', err);
      throw new AppError({
        message: 'Database update failed. Pathologist verification aborted.',
        code: ErrorCode.SERVICE_UNAVAILABLE,
        statusCode: 503
      });
    }
  }

  async reviewResult(
    tenantId: string,
    orderId: string,
    doctorNotesOrUserId: any,
    sessionOrDoctorNotes: any,
    dbClient = getDatabase()
  ): Promise<StoredLabOrder | null> {
    const db = requireDb(dbClient);
    const now = new Date();
    let doctorNotes = typeof doctorNotesOrUserId === 'string' ? doctorNotesOrUserId : (typeof sessionOrDoctorNotes === 'string' ? sessionOrDoctorNotes : undefined);
    let userId = (typeof sessionOrDoctorNotes === 'object' && sessionOrDoctorNotes?.userId) 
      ? sessionOrDoctorNotes.userId 
      : (typeof doctorNotesOrUserId === 'string' && doctorNotesOrUserId.length === 36 ? doctorNotesOrUserId : 'DOCTOR-ATTENDING');

    try {
      const order = await this.getOrderById(tenantId, orderId, db);
      const orderMeta = (order && typeof (order as any).metadata === 'object' && (order as any).metadata !== null) ? (order as any).metadata : {};

      await db
        .update(investigationOrders)
        .set({
          status: 'COMPLETED',
          metadata: {
            ...orderMeta,
            reviewedBy: userId,
            reviewedAt: now,
            doctorNotes
          },
          updatedAt: now
        } as any)
        .where(and(eq(investigationOrders.tenantId, tenantId), eq(investigationOrders.id, orderId)));

      const updated = await this.getOrderById(tenantId, orderId, db);
      if (updated) {
        updated.status = 'COMPLETED';
        updated.reviewedBy = userId;
        updated.reviewedAt = now;
        updated.doctorNotes = doctorNotes;
        (updated as any).review = {
          reviewedBy: userId,
          reviewedAt: now,
          doctorNotes
        };
      }
      return updated;
    } catch (err) {
      logger.error('Failed to review lab results in database', err);
      throw new AppError({
        message: 'Database update failed. Doctor review aborted.',
        code: ErrorCode.SERVICE_UNAVAILABLE,
        statusCode: 503
      });
    }
  }
}

export const labDiagnosticsRepository = new LabDiagnosticsRepository();
