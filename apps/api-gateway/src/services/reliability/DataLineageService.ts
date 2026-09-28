import {
  getDatabase,
  patients,
  encounters,
  investigationOrders,
  investigationSpecimens,
  radiologyOrders,
  pharmacyPrescriptions,
  pharmacyDispensing,
  billingInvoices,
  supplyChainBatches,
  supplyChainStockLedger,
  eq,
  and,
  desc
} from '@docsearch/database';
import { type SessionContext, ScopeGuard } from '@docsearch/auth';
import { AppError, ErrorCode } from '@docsearch/shared-core';
import { auditRepository } from '../../repositories/core/AuditRepository.js';

export interface LineageNode {
  id: string;
  type: string;
  label: string;
  code?: string | undefined;
  timestamp: string;
  status: string;
  actor?: string | undefined;
  metadata?: Record<string, unknown> | undefined;
}

export interface LineageEdge {
  source: string;
  target: string;
  relationship: string; // e.g. 'INITIATED', 'ORDERED', 'SPECIMEN_COLLECTED', 'REPORTED', 'DISPENSED', 'BILLED', 'RECONCILED'
  description?: string | undefined;
}

export interface LineageGraph {
  rootEntity: {
    id: string;
    type: string;
    code?: string | undefined;
  };
  nodes: LineageNode[];
  edges: LineageEdge[];
  summary: {
    totalNodes: number;
    totalEdges: number;
    domainsCovered: string[];
    completenessScore: number;
  };
}

export class DataLineageService {
  /**
   * Generates a multi-domain source-to-destination data lineage graph.
   * Traceable across Clinical, LIMS, Radiology, Pharmacy, IPD, Billing, and Commercial domains.
   */
  async getEntityLineage(
    entityType: string,
    entityId: string,
    session: SessionContext,
    db = getDatabase()
  ): Promise<LineageGraph> {
    const scope = ScopeGuard.resolveEffectiveQueryScope(session);
    const tenantId = scope.tenantId;

    const normalizedType = entityType.toUpperCase().trim();
    const nodes: LineageNode[] = [];
    const edges: LineageEdge[] = [];
    const nodeMap = new Set<string>();

    const addNode = (node: LineageNode) => {
      if (!nodeMap.has(node.id)) {
        nodeMap.add(node.id);
        nodes.push(node);
      }
    };

    const addEdge = (edge: LineageEdge) => {
      edges.push(edge);
    };

    let rootPatientId: string | null = null;

    if (normalizedType === 'PATIENT') {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(entityId);
      const [patient] = await db
        .select()
        .from(patients)
        .where(
          and(
            eq(patients.tenantId, tenantId),
            isUuid ? eq(patients.id, entityId) : eq(patients.uhid, entityId)
          )
        )
        .limit(1);

      if (!patient) {
        throw new AppError({
          code: ErrorCode.NOT_FOUND,
          message: `Patient '${entityId}' not found in tenant scope.`,
          statusCode: 404
        });
      }

      rootPatientId = patient.id;
      addNode({
        id: patient.id,
        type: 'PATIENT',
        label: `${patient.firstName} ${patient.lastName}`,
        code: patient.uhid || undefined,
        timestamp: patient.createdAt.toISOString(),
        status: patient.status || 'ACTIVE',
        metadata: { gender: patient.gender, dateOfBirth: patient.dateOfBirth }
      });
    } else if (normalizedType === 'ENCOUNTER') {
      const [enc] = await db
        .select()
        .from(encounters)
        .where(and(eq(encounters.tenantId, tenantId), eq(encounters.id, entityId)))
        .limit(1);

      if (!enc) {
        throw new AppError({
          code: ErrorCode.NOT_FOUND,
          message: `Encounter '${entityId}' not found in tenant scope.`,
          statusCode: 404
        });
      }

      rootPatientId = enc.patientId;

      addNode({
        id: enc.id,
        type: 'ENCOUNTER',
        label: `Encounter ${enc.encounterNumber || enc.id.slice(0, 8)}`,
        code: enc.encounterNumber || undefined,
        timestamp: enc.createdAt.toISOString(),
        status: enc.status,
        metadata: { type: enc.encounterType }
      });
    } else if (normalizedType === 'LAB_ORDER' || normalizedType === 'INVESTIGATION_ORDER') {
      const [order] = await db
        .select()
        .from(investigationOrders)
        .where(and(eq(investigationOrders.tenantId, tenantId), eq(investigationOrders.id, entityId)))
        .limit(1);

      if (!order) {
        throw new AppError({
          code: ErrorCode.NOT_FOUND,
          message: `Investigation order '${entityId}' not found in tenant scope.`,
          statusCode: 404
        });
      }

      rootPatientId = order.patientId;

      addNode({
        id: order.id,
        type: 'LAB_ORDER',
        label: `Lab Order ${order.orderNumber || order.id.slice(0, 8)}`,
        code: order.orderNumber,
        timestamp: order.orderedAt.toISOString(),
        status: order.status,
        metadata: { priority: order.priority }
      });
    } else if (normalizedType === 'RADIOLOGY_ORDER') {
      const [order] = await db
        .select()
        .from(radiologyOrders)
        .where(and(eq(radiologyOrders.tenantId, tenantId), eq(radiologyOrders.id, entityId)))
        .limit(1);

      if (!order) {
        throw new AppError({
          code: ErrorCode.NOT_FOUND,
          message: `Radiology order '${entityId}' not found in tenant scope.`,
          statusCode: 404
        });
      }

      rootPatientId = order.patientId;

      addNode({
        id: order.id,
        type: 'RADIOLOGY_ORDER',
        label: `Radiology Order ${order.orderNumber || order.id.slice(0, 8)}`,
        code: order.orderNumber,
        timestamp: order.orderedAt.toISOString(),
        status: order.status,
        metadata: { modality: order.modalityType }
      });
    } else if (normalizedType === 'INVOICE' || normalizedType === 'BILLING_INVOICE') {
      const [inv] = await db
        .select()
        .from(billingInvoices)
        .where(and(eq(billingInvoices.tenantId, tenantId), eq(billingInvoices.id, entityId)))
        .limit(1);

      if (!inv) {
        throw new AppError({
          code: ErrorCode.NOT_FOUND,
          message: `Billing invoice '${entityId}' not found in tenant scope.`,
          statusCode: 404
        });
      }

      rootPatientId = inv.patientId;

      addNode({
        id: inv.id,
        type: 'BILLING_INVOICE',
        label: `Invoice ${inv.invoiceNumber}`,
        code: inv.invoiceNumber,
        timestamp: inv.createdAt.toISOString(),
        status: inv.status,
        metadata: { totalAmount: inv.totalAmount }
      });
    } else if (normalizedType === 'SUPPLY_CHAIN_BATCH') {
      const [batch] = await db
        .select()
        .from(supplyChainBatches)
        .where(and(eq(supplyChainBatches.tenantId, tenantId), eq(supplyChainBatches.id, entityId)))
        .limit(1);

      if (!batch) {
        throw new AppError({
          code: ErrorCode.NOT_FOUND,
          message: `Supply chain batch '${entityId}' not found in tenant scope.`,
          statusCode: 404
        });
      }

      addNode({
        id: batch.id,
        type: 'SUPPLY_CHAIN_BATCH',
        label: `Batch ${batch.batchNumber}`,
        code: batch.batchNumber,
        timestamp: batch.createdAt.toISOString(),
        status: batch.status,
        metadata: { currentQuantity: batch.currentQuantity, expiryDate: batch.expiryDate }
      });

      // Fetch stock ledger movements for this batch
      const ledgerEntries = await db
        .select()
        .from(supplyChainStockLedger)
        .where(and(eq(supplyChainStockLedger.tenantId, tenantId), eq(supplyChainStockLedger.batchId, batch.id)))
        .orderBy(desc(supplyChainStockLedger.createdAt))
        .limit(10);

      for (const entry of ledgerEntries) {
        addNode({
          id: entry.id,
          type: 'STOCK_MOVEMENT',
          label: `${entry.movementType} (${entry.quantity})`,
          timestamp: entry.createdAt.toISOString(),
          status: 'COMMITTED',
          metadata: { quantity: entry.quantity, referenceType: entry.referenceType }
        });
        addEdge({
          source: batch.id,
          target: entry.id,
          relationship: 'STOCK_LEDGER_ENTRY',
          description: `Movement of ${entry.quantity} units (${entry.movementType})`
        });
      }

      return {
        rootEntity: { id: batch.id, type: 'SUPPLY_CHAIN_BATCH', code: batch.batchNumber },
        nodes,
        edges,
        summary: {
          totalNodes: nodes.length,
          totalEdges: edges.length,
          domainsCovered: ['SUPPLY_CHAIN', 'INVENTORY'],
          completenessScore: 100
        }
      };
    } else {
      throw new AppError({
        code: ErrorCode.BAD_REQUEST,
        message: `Unsupported entity type '${entityType}' for lineage tracing. Supported: PATIENT, ENCOUNTER, LAB_ORDER, RADIOLOGY_ORDER, INVOICE, SUPPLY_CHAIN_BATCH.`,
        statusCode: 400
      });
    }

    // If we have a patient context, pull the connected graph
    if (rootPatientId) {
      if (!nodeMap.has(rootPatientId)) {
        const [pat] = await db
          .select()
          .from(patients)
          .where(and(eq(patients.tenantId, tenantId), eq(patients.id, rootPatientId)))
          .limit(1);

        if (pat) {
          addNode({
            id: pat.id,
            type: 'PATIENT',
            label: `${pat.firstName} ${pat.lastName}`,
            code: pat.uhid || undefined,
            timestamp: pat.createdAt.toISOString(),
            status: pat.status || 'ACTIVE'
          });
        }
      }

      // Encounters for patient
      const patientEncounters = await db
        .select()
        .from(encounters)
        .where(and(eq(encounters.tenantId, tenantId), eq(encounters.patientId, rootPatientId)))
        .orderBy(desc(encounters.createdAt))
        .limit(5);

      for (const enc of patientEncounters) {
        addNode({
          id: enc.id,
          type: 'ENCOUNTER',
          label: `Encounter ${enc.encounterNumber || enc.id.slice(0, 8)}`,
          code: enc.encounterNumber || undefined,
          timestamp: enc.createdAt.toISOString(),
          status: enc.status
        });
        addEdge({
          source: rootPatientId,
          target: enc.id,
          relationship: 'PATIENT_ENCOUNTER',
          description: 'Patient initiated clinical encounter'
        });
      }

      // Investigation / Lab Orders
      const labOrders = await db
        .select()
        .from(investigationOrders)
        .where(and(eq(investigationOrders.tenantId, tenantId), eq(investigationOrders.patientId, rootPatientId)))
        .orderBy(desc(investigationOrders.orderedAt))
        .limit(5);

      for (const ord of labOrders) {
        addNode({
          id: ord.id,
          type: 'LAB_ORDER',
          label: `Lab Order ${ord.orderNumber || ord.id.slice(0, 8)}`,
          code: ord.orderNumber,
          timestamp: ord.orderedAt.toISOString(),
          status: ord.status
        });
        const parentId = ord.encounterId || rootPatientId;
        addEdge({
          source: parentId,
          target: ord.id,
          relationship: 'ORDERED_INVESTIGATION',
          description: 'Physician ordered laboratory panel'
        });

        // Pull child specimens
        const specimens = await db
          .select()
          .from(investigationSpecimens)
          .where(and(eq(investigationSpecimens.tenantId, tenantId), eq(investigationSpecimens.orderId, ord.id)))
          .limit(3);

        for (const spec of specimens) {
          addNode({
            id: spec.id,
            type: 'SPECIMEN',
            label: `Specimen ${spec.accessionNumber}`,
            code: spec.accessionNumber,
            timestamp: spec.collectedAt ? new Date(spec.collectedAt).toISOString() : spec.createdAt.toISOString(),
            status: spec.collectionStatus
          });
          addEdge({
            source: ord.id,
            target: spec.id,
            relationship: 'SPECIMEN_COLLECTION',
            description: 'Phlebotomist collected sample specimen'
          });
        }
      }

      // Radiology Orders
      const radOrders = await db
        .select()
        .from(radiologyOrders)
        .where(and(eq(radiologyOrders.tenantId, tenantId), eq(radiologyOrders.patientId, rootPatientId)))
        .orderBy(desc(radiologyOrders.orderedAt))
        .limit(5);

      for (const rad of radOrders) {
        addNode({
          id: rad.id,
          type: 'RADIOLOGY_ORDER',
          label: `Radiology (${rad.modalityType})`,
          code: rad.orderNumber,
          timestamp: rad.orderedAt.toISOString(),
          status: rad.status
        });
        const parentId = rad.encounterId || rootPatientId;
        addEdge({
          source: parentId,
          target: rad.id,
          relationship: 'ORDERED_RADIOLOGY',
          description: `Ordered imaging procedure (${rad.modalityType})`
        });
      }

      // Pharmacy Prescriptions & Dispensing
      const prescriptions = await db
        .select()
        .from(pharmacyPrescriptions)
        .where(and(eq(pharmacyPrescriptions.tenantId, tenantId), eq(pharmacyPrescriptions.patientId, rootPatientId)))
        .orderBy(desc(pharmacyPrescriptions.createdAt))
        .limit(5);

      for (const rx of prescriptions) {
        addNode({
          id: rx.id,
          type: 'PRESCRIPTION',
          label: `Rx ${rx.prescriptionNumber || rx.id.slice(0, 8)}`,
          code: rx.prescriptionNumber || undefined,
          timestamp: rx.createdAt.toISOString(),
          status: rx.status
        });
        const parentId = rx.encounterId || rootPatientId;
        addEdge({
          source: parentId,
          target: rx.id,
          relationship: 'PRESCRIBED_MEDICATION',
          description: 'Doctor issued medical prescription'
        });

        // Pull dispensing
        const dispenses = await db
          .select()
          .from(pharmacyDispensing)
          .where(and(eq(pharmacyDispensing.tenantId, tenantId), eq(pharmacyDispensing.prescriptionId, rx.id)))
          .limit(2);

        for (const disp of dispenses) {
          addNode({
            id: disp.id,
            type: 'PHARMACY_DISPENSE',
            label: `Dispense ${disp.dispensingNumber}`,
            code: disp.dispensingNumber,
            timestamp: disp.createdAt.toISOString(),
            status: disp.dispensingStatus
          });
          addEdge({
            source: rx.id,
            target: disp.id,
            relationship: 'DISPENSED_MEDICATION',
            description: 'Pharmacist atomically dispensed batch items'
          });
        }
      }

      // Billing Invoices
      const invoices = await db
        .select()
        .from(billingInvoices)
        .where(and(eq(billingInvoices.tenantId, tenantId), eq(billingInvoices.patientId, rootPatientId)))
        .orderBy(desc(billingInvoices.createdAt))
        .limit(5);

      for (const inv of invoices) {
        addNode({
          id: inv.id,
          type: 'BILLING_INVOICE',
          label: `Invoice ${inv.invoiceNumber}`,
          code: inv.invoiceNumber,
          timestamp: inv.createdAt.toISOString(),
          status: inv.status,
          metadata: { totalAmount: inv.totalAmount }
        });
        const parentId = inv.encounterId || rootPatientId;
        addEdge({
          source: parentId,
          target: inv.id,
          relationship: 'BILLED_CHARGES',
          description: `Consolidated billing charges of ₹${inv.totalAmount}`
        });
      }
    }

    const uniqueDomains = Array.from(
      new Set(
        nodes.map((n) => {
          if (n.type.includes('PATIENT') || n.type.includes('ENCOUNTER')) return 'CLINICAL';
          if (n.type.includes('LAB') || n.type.includes('SPECIMEN') || n.type.includes('RESULT')) return 'LIMS';
          if (n.type.includes('RADIOLOGY')) return 'RIS';
          if (n.type.includes('PRESCRIPTION') || n.type.includes('DISPENSE')) return 'PHARMACY';
          if (n.type.includes('BILLING') || n.type.includes('INVOICE') || n.type.includes('PAYMENT')) return 'FINANCE';
          return 'CORE';
        })
      )
    );

    const completenessScore = Math.min(100, Math.round((nodes.length / 5) * 100));

    await auditRepository.recordEvent({
      eventType: 'DATA_LINEAGE_ACCESSED',
      resourceType: entityType.toLowerCase(),
      resourceId: entityId,
      tenantId,
      branchId: scope.branchId || session.branchId,
      metadata: {
        totalNodes: nodes.length,
        totalEdges: edges.length,
        domains: uniqueDomains
      }
    }, session, db);

    return {
      rootEntity: { id: entityId, type: normalizedType },
      nodes,
      edges,
      summary: {
        totalNodes: nodes.length,
        totalEdges: edges.length,
        domainsCovered: uniqueDomains,
        completenessScore
      }
    };
  }
}

export const dataLineageService = new DataLineageService();
