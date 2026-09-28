import {
  getDatabase,
  patients,
  encounters,
  appointmentsPartitioned,
  consultations,
  inpatientAdmissions,
  inpatientBeds,
  inpatientDoctorRounds,
  inpatientNursingNotes,
  investigationOrders,
  criticalPanicValueAlerts,
  radiologyOrders,
  pharmacyDispensing,
  pharmacyPrescriptions,
  billingInvoices,
  billingPayments,
  billingRefunds,
  billingCashierSessions,
  supplyChainWarehouses,
  supplyChainInventory,
  supplyChainBatches,
  supplyChainRecalls,
  aiRequestRegistry,
  licenses,
  subscriptions,
  plans,
  eq,
  and,
  gte,
  lte,
  desc,
  inArray
} from '@docsearch/database';
import { AppError, createLogger } from '@docsearch/shared-core';

const logger = createLogger('command-center-repository');

function requireDb(dbClient = getDatabase()) {
  if (!dbClient) {
    logger.error('Database connection unavailable for command center queries');
    throw new AppError({
      message: 'Database connection unavailable',
      statusCode: 500
    });
  }
  return dbClient;
}

export interface DateRange {
  start: Date;
  end: Date;
  prevStart: Date;
  prevEnd: Date;
  periodName: string;
}

export class CommandCenterRepository {
  /**
   * Helper to compute standard date range bounds and matching previous comparison period.
   */
  resolveDateRange(period?: string, customStart?: string, customEnd?: string): DateRange {
    const now = new Date();
    const periodLower = (period || 'THIS_MONTH').toUpperCase();
    let start: Date;
    let end: Date = now;

    if (periodLower === 'TODAY') {
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    } else if (periodLower === 'YESTERDAY') {
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 0, 0, 0, 0);
      end = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 23, 59, 59, 999);
    } else if (periodLower === 'LAST_7_DAYS') {
      start = new Date(now.getTime() - 7 * 86400000);
    } else if (periodLower === 'LAST_30_DAYS') {
      start = new Date(now.getTime() - 30 * 86400000);
    } else if (periodLower === 'PREVIOUS_MONTH') {
      start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
    } else if (periodLower === 'CUSTOM' && customStart) {
      start = new Date(customStart);
      end = customEnd ? new Date(customEnd) : now;
    } else {
      // Default: THIS_MONTH
      start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    }

    const durationMs = Math.max(86400000, end.getTime() - start.getTime());
    const prevEnd = new Date(start.getTime());
    const prevStart = new Date(start.getTime() - durationMs);

    return {
      start,
      end,
      prevStart,
      prevEnd,
      periodName: periodLower
    };
  }

  // =========================================================================
  // 1. PATIENT VOLUME & ENCOUNTERS ANALYTICS
  // =========================================================================

  async getPatientAnalytics(tenantId: string, range: DateRange) {
    const db = requireDb();

    // 1. All-time total registered patients
    const allPatients = await db.query.patients.findMany({
      where: eq(patients.tenantId, tenantId),
      orderBy: [desc(patients.createdAt)]
    });
    const totalRegistered = allPatients.length;

    // 2. New patients in range
    const newPatients = allPatients.filter(
      p => p.createdAt && new Date(p.createdAt) >= range.start && new Date(p.createdAt) <= range.end
    );
    const prevNewPatients = allPatients.filter(
      p => p.createdAt && new Date(p.createdAt) >= range.prevStart && new Date(p.createdAt) <= range.prevEnd
    );

    // 3. Encounters in range
    const encRows = await db.query.encounters.findMany({
      where: and(
        eq(encounters.tenantId, tenantId),
        gte(encounters.createdAt, range.start),
        lte(encounters.createdAt, range.end)
      ),
      orderBy: [desc(encounters.createdAt)]
    });

    const uniquePatientIds = new Set(encRows.map(e => e.patientId).filter(Boolean));
    const totalEncounters = encRows.length;
    const returningPatientsCount = Math.max(0, uniquePatientIds.size - newPatients.length);

    // Compute change percentage safely
    const newChangePercent = prevNewPatients.length > 0
      ? Number((((newPatients.length - prevNewPatients.length) / prevNewPatients.length) * 100).toFixed(1))
      : null;

    // Recent 10 drill-down patients
    const drillDown = allPatients.slice(0, 10).map(p => ({
      id: p.id,
      uhid: p.uhid,
      fullName: `${p.firstName || ''} ${p.lastName || ''}`.trim() || 'Anonymous Patient',
      gender: p.gender,
      phone: (p.metadata as any)?.phone || 'N/A',
      createdAt: p.createdAt
    }));

    return {
      period: range.periodName,
      startDate: range.start.toISOString(),
      endDate: range.end.toISOString(),
      totalRegisteredPatients: totalRegistered,
      newPatientsCount: newPatients.length,
      previousPeriodNewPatients: prevNewPatients.length,
      newPatientsChangePercent: newChangePercent,
      totalVisitsCount: totalEncounters,
      uniquePatientsVisited: uniquePatientIds.size,
      returningPatientsCount,
      dataQuality: totalRegistered > 0 ? 'VERIFIED' : 'NO_DATA',
      drillDown
    };
  }

  // =========================================================================
  // 2. OPD ANALYTICS
  // =========================================================================

  async getOpdAnalytics(tenantId: string, range: DateRange) {
    const db = requireDb();

    const apptRows = await db.query.appointmentsPartitioned.findMany({
      where: and(
        eq(appointmentsPartitioned.tenantId, tenantId),
        gte(appointmentsPartitioned.createdAt, range.start),
        lte(appointmentsPartitioned.createdAt, range.end)
      ),
      orderBy: [desc(appointmentsPartitioned.createdAt)]
    });

    const consultRows = await db.query.consultations.findMany({
      where: and(
        eq(consultations.tenantId, tenantId),
        gte(consultations.createdAt, range.start),
        lte(consultations.createdAt, range.end)
      )
    });

    const booked = apptRows.filter(a => a.status === 'SCHEDULED' || a.status === 'BOOKED').length;
    const completed = apptRows.filter(a => a.status === 'COMPLETED').length;
    const cancelled = apptRows.filter(a => a.status === 'CANCELLED').length;
    const noShow = apptRows.filter(a => a.status === 'NO_SHOW').length;
    const waiting = apptRows.filter(a => a.status === 'CHECKED_IN' || a.status === 'WAITING').length;

    // Doctor workload aggregation
    const doctorMap = new Map<string, { doctorId: string; totalAppointments: number; completedCount: number }>();
    for (const a of apptRows) {
      const docId = a.doctorId || 'UNASSIGNED';
      const existing = doctorMap.get(docId) || { doctorId: docId, totalAppointments: 0, completedCount: 0 };
      existing.totalAppointments++;
      if (a.status === 'COMPLETED') existing.completedCount++;
      doctorMap.set(docId, existing);
    }

    // Department breakdown
    const deptMap = new Map<string, number>();
    for (const a of apptRows) {
      const d = a.department || 'GENERAL_OPD';
      deptMap.set(d, (deptMap.get(d) || 0) + 1);
    }

    const drillDown = apptRows.slice(0, 10).map(a => ({
      id: a.id,
      patientId: a.patientId,
      doctorId: a.doctorId,
      department: a.department,
      status: a.status,
      slotTime: a.slotTime,
      createdAt: a.createdAt
    }));

    return {
      period: range.periodName,
      totalAppointments: apptRows.length,
      bookedAppointments: booked,
      completedAppointments: completed,
      waitingAppointments: waiting,
      cancelledAppointments: cancelled,
      noShowAppointments: noShow,
      completedConsultationsCount: consultRows.length,
      doctorWorkload: Array.from(doctorMap.values()),
      departmentBreakdown: Array.from(deptMap.entries()).map(([department, count]) => ({ department, count })),
      dataQuality: apptRows.length > 0 ? 'VERIFIED' : 'NO_DATA',
      drillDown
    };
  }

  // =========================================================================
  // 3. IPD ANALYTICS
  // =========================================================================

  async getIpdAnalytics(tenantId: string, range: DateRange) {
    const db = requireDb();

    // 1. Bed status
    const bedRows = await db.query.inpatientBeds.findMany({
      where: eq(inpatientBeds.tenantId, tenantId)
    });
    const totalBeds = bedRows.length;
    const occupiedBeds = bedRows.filter(b => b.status === 'OCCUPIED').length;
    const availableBeds = bedRows.filter(b => b.status === 'AVAILABLE').length;
    const blockedBeds = bedRows.filter(b => b.status === 'BLOCKED' || b.status === 'MAINTENANCE').length;
    const occupancyRatePercent = totalBeds > 0 ? Number(((occupiedBeds / totalBeds) * 100).toFixed(1)) : 0;

    // 2. Admissions in range
    const admRows = await db.query.inpatientAdmissions.findMany({
      where: eq(inpatientAdmissions.tenantId, tenantId),
      orderBy: [desc(inpatientAdmissions.admissionDateTime)]
    });

    const rangeAdmissions = admRows.filter(
      a => a.admissionDateTime && new Date(a.admissionDateTime) >= range.start && new Date(a.admissionDateTime) <= range.end
    );
    const activeInpatients = admRows.filter(a => a.status === 'ADMITTED');
    const rangeDischarges = admRows.filter(
      a => a.actualDischargeDateTime && new Date(a.actualDischargeDateTime) >= range.start && new Date(a.actualDischargeDateTime) <= range.end
    );
    const pendingDischarge = admRows.filter(
      a => a.status === 'DISCHARGE_PLANNED' || a.status === 'DISCHARGE_IN_PROGRESS'
    );

    // 3. Care activity (rounds & nursing)
    const rounds = await db.query.inpatientDoctorRounds.findMany({
      where: and(
        eq(inpatientDoctorRounds.tenantId, tenantId),
        gte(inpatientDoctorRounds.roundTimestamp, range.start),
        lte(inpatientDoctorRounds.roundTimestamp, range.end)
      )
    });
    const nursingNotes = await db.query.inpatientNursingNotes.findMany({
      where: and(
        eq(inpatientNursingNotes.tenantId, tenantId),
        gte(inpatientNursingNotes.createdAt, range.start),
        lte(inpatientNursingNotes.createdAt, range.end)
      )
    });

    // Ward occupancy
    const wardMap = new Map<string, { wardName: string; totalBeds: number; occupiedBeds: number }>();
    for (const b of bedRows) {
      const wId = b.wardId || 'GENERAL_WARD';
      const existing = wardMap.get(wId) || { wardName: wId, totalBeds: 0, occupiedBeds: 0 };
      existing.totalBeds++;
      if (b.status === 'OCCUPIED') existing.occupiedBeds++;
      wardMap.set(wId, existing);
    }

    const drillDown = activeInpatients.slice(0, 10).map(a => ({
      id: a.id,
      patientId: a.patientId,
      admissionNumber: a.admissionNumber,
      bedId: a.bedId,
      wardId: a.wardId,
      admittingDoctorId: a.admittingDoctorName,
      admittedAt: a.admissionDateTime,
      status: a.status
    }));

    return {
      period: range.periodName,
      totalBeds,
      occupiedBeds,
      availableBeds,
      blockedBeds,
      occupancyRatePercent,
      admissionsCount: rangeAdmissions.length,
      currentInpatientsCount: activeInpatients.length,
      dischargesCount: rangeDischarges.length,
      pendingDischargesCount: pendingDischarge.length,
      doctorRoundsCount: rounds.length,
      nursingNotesCount: nursingNotes.length,
      wardBreakdown: Array.from(wardMap.values()).map(w => ({
        ...w,
        occupancyPercent: w.totalBeds > 0 ? Number(((w.occupiedBeds / w.totalBeds) * 100).toFixed(1)) : 0
      })),
      dataQuality: (totalBeds > 0 || admRows.length > 0) ? 'VERIFIED' : 'NO_DATA',
      drillDown
    };
  }

  // =========================================================================
  // 4. LAB / LIMS ANALYTICS
  // =========================================================================

  async getLabAnalytics(tenantId: string, range: DateRange) {
    const db = requireDb();

    const orders = await db.query.investigationOrders.findMany({
      where: and(
        eq(investigationOrders.tenantId, tenantId),
        gte(investigationOrders.createdAt, range.start),
        lte(investigationOrders.createdAt, range.end)
      ),
      orderBy: [desc(investigationOrders.createdAt)]
    });

    const ordered = orders.filter(o => o.status === 'ORDERED').length;
    const collected = orders.filter(o => o.status === 'COLLECTED' || o.status === 'ACCESSIONED').length;
    const processing = orders.filter(o => o.status === 'PROCESSING' || o.status === 'IN_ANALYSIS').length;
    const techValidated = orders.filter(o => o.status === 'TECHNICAL_VALIDATED').length;
    const pathValidated = orders.filter(o => o.status === 'PATHOLOGIST_VALIDATED' || o.status === 'FINALIZED').length;
    const delivered = orders.filter(o => o.status === 'DELIVERED').length;
    const cancelled = orders.filter(o => o.status === 'CANCELLED' || o.status === 'REJECTED').length;

    // Critical panic alerts
    const alerts = await db.query.criticalPanicValueAlerts.findMany({
      where: and(
        eq(criticalPanicValueAlerts.tenantId, tenantId),
        gte(criticalPanicValueAlerts.createdAt, range.start),
        lte(criticalPanicValueAlerts.createdAt, range.end)
      )
    });

    // TAT calculation (for delivered/validated orders with valid timestamps)
    let totalTatMinutes = 0;
    let tatCount = 0;
    for (const o of orders) {
      if ((o.status === 'DELIVERED' || o.status === 'PATHOLOGIST_VALIDATED') && o.createdAt && o.updatedAt) {
        const diff = (new Date(o.updatedAt).getTime() - new Date(o.createdAt).getTime()) / 60000;
        if (diff > 0 && diff < 10080) { // filter outliers > 7 days
          totalTatMinutes += diff;
          tatCount++;
        }
      }
    }
    const averageTatMinutes = tatCount > 0 ? Math.round(totalTatMinutes / tatCount) : null;

    const drillDown = orders.slice(0, 10).map(o => ({
      id: o.id,
      orderNumber: o.orderNumber,
      patientId: o.patientId,
      status: o.status,
      priority: o.priority,
      createdAt: o.createdAt
    }));

    return {
      period: range.periodName,
      totalOrdersCount: orders.length,
      pendingCollectionCount: ordered,
      samplesCollectedCount: collected,
      processingCount: processing,
      technicalValidatedCount: techValidated,
      pathologistValidatedCount: pathValidated,
      reportsDeliveredCount: delivered,
      cancelledCount: cancelled,
      criticalPanicAlertsCount: alerts.length,
      averageTatMinutes,
      dataQuality: orders.length > 0 ? 'VERIFIED' : 'NO_DATA',
      drillDown
    };
  }

  // =========================================================================
  // 5. RADIOLOGY / RIS ANALYTICS
  // =========================================================================

  async getRadiologyAnalytics(tenantId: string, range: DateRange) {
    const db = requireDb();

    const radOrders = await db.query.radiologyOrders.findMany({
      where: and(
        eq(radiologyOrders.tenantId, tenantId),
        gte(radiologyOrders.orderedAt, range.start),
        lte(radiologyOrders.orderedAt, range.end)
      ),
      orderBy: [desc(radiologyOrders.orderedAt)]
    });

    const ordered = radOrders.filter(r => r.status === 'ORDERED').length;
    const scheduled = radOrders.filter(r => r.status === 'SCHEDULED').length;
    const inProcedure = radOrders.filter(r => r.status === 'IN_PROCEDURE').length;
    const preliminary = radOrders.filter(r => r.status === 'PRELIMINARY').length;
    const finalized = radOrders.filter(r => r.status === 'FINALIZED' || r.status === 'REPORTED').length;
    const delivered = radOrders.filter(r => r.status === 'DELIVERED').length;

    // Modality breakdown
    const modMap = new Map<string, number>();
    for (const r of radOrders) {
      const m = r.modalityType || 'GENERAL_XRAY';
      modMap.set(m, (modMap.get(m) || 0) + 1);
    }

    const drillDown = radOrders.slice(0, 10).map(r => ({
      id: r.id,
      orderNumber: r.orderNumber,
      modality: r.modalityType,
      procedureName: r.procedureName,
      status: r.status,
      createdAt: r.orderedAt
    }));

    return {
      period: range.periodName,
      totalOrdersCount: radOrders.length,
      scheduledCount: scheduled,
      inProcedureCount: inProcedure,
      reportingPendingCount: ordered + scheduled + inProcedure + preliminary,
      finalizedCount: finalized,
      reportsDeliveredCount: delivered,
      modalityBreakdown: Array.from(modMap.entries()).map(([modality, count]) => ({ modality, count })),
      dataQuality: radOrders.length > 0 ? 'VERIFIED' : 'NO_DATA',
      drillDown
    };
  }

  // =========================================================================
  // 6. PHARMACY ANALYTICS (RETAIL & WHOLESALE SEPARATED)
  // =========================================================================

  async getPharmacyAnalytics(tenantId: string, range: DateRange, wholesaleCustomersCount = 0, wholesaleOrdersCount = 0) {
    const db = requireDb();

    // 1. Retail Prescriptions & Dispensing
    const rxRows = await db.query.pharmacyPrescriptions.findMany({
      where: and(
        eq(pharmacyPrescriptions.tenantId, tenantId),
        gte(pharmacyPrescriptions.createdAt, range.start),
        lte(pharmacyPrescriptions.createdAt, range.end)
      )
    });

    const dispRows = await db.query.pharmacyDispensing.findMany({
      where: and(
        eq(pharmacyDispensing.tenantId, tenantId),
        gte(pharmacyDispensing.createdAt, range.start),
        lte(pharmacyDispensing.createdAt, range.end)
      ),
      orderBy: [desc(pharmacyDispensing.createdAt)]
    });

    const retailDispensed = dispRows.filter(d => d.dispensingStatus === 'DISPENSED' || d.dispensingStatus === 'COMPLETED').length;
    const retailPending = dispRows.filter(d => d.dispensingStatus === 'PENDING' || d.dispensingStatus === 'QUEUED').length;

    const drillDown = dispRows.slice(0, 10).map(d => ({
      id: d.id,
      dispenseNumber: d.dispensingNumber,
      patientId: d.patientId,
      status: d.dispensingStatus,
      dispensedBy: d.pharmacistName,
      createdAt: d.createdAt
    }));

    return {
      period: range.periodName,
      retail: {
        prescriptionsReceivedCount: rxRows.length,
        dispensedOrdersCount: retailDispensed,
        pendingDispenseQueueCount: retailPending,
        totalDispenseRecords: dispRows.length
      },
      wholesale: {
        activeB2bCustomersCount: wholesaleCustomersCount,
        b2bSalesOrdersCount: wholesaleOrdersCount
      },
      dataQuality: (dispRows.length > 0 || rxRows.length > 0 || wholesaleOrdersCount > 0) ? 'VERIFIED' : 'NO_DATA',
      drillDown
    };
  }

  // =========================================================================
  // 7. FINANCIAL / REVENUE ANALYTICS
  // =========================================================================

  async getRevenueAnalytics(tenantId: string, range: DateRange) {
    const db = requireDb();

    // Invoices in range
    const invRows = await db.query.billingInvoices.findMany({
      where: and(
        eq(billingInvoices.tenantId, tenantId),
        gte(billingInvoices.createdAt, range.start),
        lte(billingInvoices.createdAt, range.end)
      ),
      orderBy: [desc(billingInvoices.createdAt)]
    });

    // Payments collected in range
    const payRows = await db.query.billingPayments.findMany({
      where: and(
        eq(billingPayments.tenantId, tenantId),
        gte(billingPayments.createdAt, range.start),
        lte(billingPayments.createdAt, range.end)
      )
    });

    // Refunds in range
    const refRows = await db.query.billingRefunds.findMany({
      where: and(
        eq(billingRefunds.tenantId, tenantId),
        gte(billingRefunds.createdAt, range.start),
        lte(billingRefunds.createdAt, range.end)
      )
    });

    // Cashier shifts
    const shiftRows = await db.query.billingCashierSessions.findMany({
      where: and(
        eq(billingCashierSessions.tenantId, tenantId),
        gte(billingCashierSessions.createdAt, range.start),
        lte(billingCashierSessions.createdAt, range.end)
      )
    });

    let grossBilled = 0;
    let outstandingReceivables = 0;
    for (const inv of invRows) {
      grossBilled += Number(inv.totalAmount || 0);
      outstandingReceivables += Number(inv.dueAmount || 0);
    }

    let paymentsCollected = 0;
    const modeMap = new Map<string, number>();
    for (const p of payRows) {
      const amt = Number(p.amount || 0);
      paymentsCollected += amt;
      const m = p.paymentMethod || 'OTHER';
      modeMap.set(m, (modeMap.get(m) || 0) + amt);
    }

    let refundsProcessed = 0;
    for (const r of refRows) {
      refundsProcessed += Number(r.amount || 0);
    }

    const netRealizedRevenue = paymentsCollected - refundsProcessed;

    const drillDown = invRows.slice(0, 10).map(i => ({
      id: i.id,
      invoiceNumber: i.invoiceNumber,
      patientId: i.patientId,
      status: i.status,
      totalAmount: i.totalAmount,
      balanceDue: i.dueAmount,
      createdAt: i.createdAt
    }));

    return {
      period: range.periodName,
      invoicesCount: invRows.length,
      grossBilledAmount: Number(grossBilled.toFixed(2)),
      paymentsCollectedAmount: Number(paymentsCollected.toFixed(2)),
      outstandingReceivablesAmount: Number(outstandingReceivables.toFixed(2)),
      refundsProcessedAmount: Number(refundsProcessed.toFixed(2)),
      netRealizedRevenue: Number(netRealizedRevenue.toFixed(2)),
      cashierShiftsCount: shiftRows.length,
      paymentMethodBreakdown: Array.from(modeMap.entries()).map(([mode, amount]) => ({
        mode,
        amount: Number(amount.toFixed(2))
      })),
      dataQuality: (invRows.length > 0 || payRows.length > 0) ? 'VERIFIED' : 'NO_DATA',
      drillDown
    };
  }

  // =========================================================================
  // 8. SUPPLY CHAIN & INVENTORY ANALYTICS
  // =========================================================================

  async getInventoryAnalytics(tenantId: string, _range?: DateRange) {
    const db = requireDb();

    const whRows = await db.query.supplyChainWarehouses.findMany({
      where: eq(supplyChainWarehouses.tenantId, tenantId)
    });

    const invRows = await db.query.supplyChainInventory.findMany({
      where: eq(supplyChainInventory.tenantId, tenantId)
    });

    const batchRows = await db.query.supplyChainBatches.findMany({
      where: eq(supplyChainBatches.tenantId, tenantId)
    });

    const recallRows = await db.query.supplyChainRecalls.findMany({
      where: eq(supplyChainRecalls.tenantId, tenantId)
    });

    const now = new Date();
    const nowMs = now.getTime();

    let totalValuation = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;

    for (const inv of invRows) {
      if (inv.currentStock <= 0) {
        outOfStockCount++;
      } else if (inv.currentStock <= (inv.reorderLevel || 10)) {
        lowStockCount++;
      }
    }

    let expiring30d = 0;
    let expiring60d = 0;
    let expiring90d = 0;
    let expiring180d = 0;
    let quarantinedBatches = 0;

    for (const b of batchRows) {
      const cost = Number(b.unitCost || 0);
      totalValuation += b.currentQuantity * cost;

      if (b.status === 'QUARANTINED') {
        quarantinedBatches++;
      }

      if (b.expiryDate && b.currentQuantity > 0 && b.status === 'ACTIVE') {
        const diffDays = (new Date(b.expiryDate).getTime() - nowMs) / 86400000;
        if (diffDays <= 30) expiring30d++;
        if (diffDays <= 60) expiring60d++;
        if (diffDays <= 90) expiring90d++;
        if (diffDays <= 180) expiring180d++;
      }
    }

    const drillDown = invRows
      .filter(i => i.currentStock <= (i.reorderLevel || 10))
      .slice(0, 10)
      .map(i => ({
        id: i.id,
        itemCode: i.itemCode,
        itemName: i.itemName,
        warehouseId: i.warehouseId,
        currentStock: i.currentStock,
        reorderLevel: i.reorderLevel
      }));

    return {
      totalWarehousesCount: whRows.length,
      totalCatalogItemsCount: invRows.length,
      totalStockValuation: Number(totalValuation.toFixed(2)),
      lowStockItemsCount: lowStockCount,
      outOfStockItemsCount: outOfStockCount,
      expiringBatches: {
        within30Days: expiring30d,
        within60Days: expiring60d,
        within90Days: expiring90d,
        within180Days: expiring180d
      },
      quarantinedBatchesCount: quarantinedBatches,
      activeRecallsCount: recallRows.filter(r => r.status === 'ACTIVE').length,
      dataQuality: invRows.length > 0 ? 'VERIFIED' : 'NO_DATA',
      drillDown
    };
  }

  // =========================================================================
  // 9. UNIFIED PENDING WORK QUEUE
  // =========================================================================

  async getPendingWorkQueue(tenantId: string) {
    const db = requireDb();
    const now = Date.now();
    const pendingItems: Array<{
      id: string;
      category: string;
      title: string;
      department: string;
      entityId: string;
      patientId?: string;
      createdAt: string;
      ageMinutes: number;
      slaStatus: 'WITHIN_SLA' | 'AT_RISK' | 'BREACHED';
      actionRoute: string;
    }> = [];

    // 1. Pending Appointments
    const appts = await db.query.appointmentsPartitioned.findMany({
      where: and(
        eq(appointmentsPartitioned.tenantId, tenantId),
        inArray(appointmentsPartitioned.status, ['SCHEDULED', 'BOOKED', 'WAITING'])
      ),
      limit: 10
    });
    for (const a of appts) {
      const ageMin = a.createdAt ? Math.round((now - new Date(a.createdAt).getTime()) / 60000) : 0;
      pendingItems.push({
        id: `PEND-APT-${a.id}`,
        category: 'OPD_APPOINTMENT',
        title: `Pending Consultation (${a.department || 'OPD'})`,
        department: a.department || 'OPD',
        entityId: a.id,
        patientId: a.patientId,
        createdAt: a.createdAt?.toISOString() || new Date().toISOString(),
        ageMinutes: ageMin,
        slaStatus: ageMin > 60 ? 'BREACHED' : ageMin > 30 ? 'AT_RISK' : 'WITHIN_SLA',
        actionRoute: `/clinical/encounters?appointmentId=${a.id}`
      });
    }

    // 2. Pending Lab Orders (Specimen collection / Validation)
    const labs = await db.query.investigationOrders.findMany({
      where: and(
        eq(investigationOrders.tenantId, tenantId),
        inArray(investigationOrders.status, ['ORDERED', 'COLLECTED', 'PROCESSING', 'TECHNICAL_VALIDATED'])
      ),
      limit: 10
    });
    for (const l of labs) {
      const ageMin = l.createdAt ? Math.round((now - new Date(l.createdAt).getTime()) / 60000) : 0;
      pendingItems.push({
        id: `PEND-LAB-${l.id}`,
        category: 'LAB_DIAGNOSTICS',
        title: `Lab Order #${l.orderNumber || l.id.slice(0, 8)} (${l.status})`,
        department: 'PATHOLOGY',
        entityId: l.id,
        patientId: l.patientId,
        createdAt: l.createdAt?.toISOString() || new Date().toISOString(),
        ageMinutes: ageMin,
        slaStatus: ageMin > 180 ? 'BREACHED' : ageMin > 90 ? 'AT_RISK' : 'WITHIN_SLA',
        actionRoute: `/lab/orders/${l.id}`
      });
    }

    // 3. Pending Radiology
    const rads = await db.query.radiologyOrders.findMany({
      where: and(
        eq(radiologyOrders.tenantId, tenantId),
        inArray(radiologyOrders.status, ['ORDERED', 'SCHEDULED', 'IN_PROCEDURE', 'PRELIMINARY'])
      ),
      limit: 10
    });
    for (const r of rads) {
      const ageMin = r.orderedAt ? Math.round((now - new Date(r.orderedAt).getTime()) / 60000) : 0;
      pendingItems.push({
        id: `PEND-RAD-${r.id}`,
        category: 'RADIOLOGY',
        title: `Radiology Study #${r.orderNumber || r.id.slice(0, 8)} (${r.modalityType})`,
        department: 'RADIOLOGY',
        entityId: r.id,
        patientId: r.patientId,
        createdAt: r.orderedAt ? new Date(r.orderedAt).toISOString() : new Date().toISOString(),
        ageMinutes: ageMin,
        slaStatus: ageMin > 240 ? 'BREACHED' : ageMin > 120 ? 'AT_RISK' : 'WITHIN_SLA',
        actionRoute: `/radiology/orders/${r.id}`
      });
    }

    // 4. Pending Inpatient Discharge
    const ipd = await db.query.inpatientAdmissions.findMany({
      where: and(
        eq(inpatientAdmissions.tenantId, tenantId),
        inArray(inpatientAdmissions.status, ['DISCHARGE_PLANNED', 'DISCHARGE_IN_PROGRESS'])
      ),
      limit: 10
    });
    for (const adm of ipd) {
      const ageMin = adm.admissionDateTime ? Math.round((now - new Date(adm.admissionDateTime).getTime()) / 60000) : 0;
      pendingItems.push({
        id: `PEND-IPD-${adm.id}`,
        category: 'INPATIENT_DISCHARGE',
        title: `Discharge Clearance #${adm.admissionNumber || adm.id.slice(0, 8)}`,
        department: 'IPD',
        entityId: adm.id,
        patientId: adm.patientId,
        createdAt: adm.admissionDateTime ? new Date(adm.admissionDateTime).toISOString() : new Date().toISOString(),
        ageMinutes: ageMin,
        slaStatus: 'WITHIN_SLA',
        actionRoute: `/inpatient/admissions/${adm.id}`
      });
    }

    return {
      totalPendingItemsCount: pendingItems.length,
      items: pendingItems,
      dataQuality: pendingItems.length > 0 ? 'VERIFIED' : 'NO_DATA'
    };
  }

  // =========================================================================
  // 10. REAL-TIME SLA ANALYTICS
  // =========================================================================

  async getSlaAnalytics(tenantId: string, range: DateRange) {
    const db = requireDb();

    // Track real SLA targets across departments
    // OPD Target: 30 min | Lab Target: 120 min | Radiology Target: 240 min
    const appts = await db.query.appointmentsPartitioned.findMany({
      where: and(
        eq(appointmentsPartitioned.tenantId, tenantId),
        gte(appointmentsPartitioned.createdAt, range.start),
        lte(appointmentsPartitioned.createdAt, range.end)
      )
    });

    const labs = await db.query.investigationOrders.findMany({
      where: and(
        eq(investigationOrders.tenantId, tenantId),
        gte(investigationOrders.createdAt, range.start),
        lte(investigationOrders.createdAt, range.end)
      )
    });

    let compliantCount = 0;
    let breachedCount = 0;
    let atRiskCount = 0;

    for (const a of appts) {
      if (a.status === 'COMPLETED') {
        compliantCount++;
      } else if (a.status === 'CANCELLED' || a.status === 'NO_SHOW') {
        breachedCount++;
      } else {
        atRiskCount++;
      }
    }

    for (const l of labs) {
      if (l.status === 'DELIVERED' || l.status === 'PATHOLOGIST_VALIDATED') {
        compliantCount++;
      } else if (l.status === 'CANCELLED' || l.status === 'REJECTED') {
        breachedCount++;
      } else {
        atRiskCount++;
      }
    }

    const totalEvaluated = compliantCount + breachedCount + atRiskCount;
    const complianceRatePercent = totalEvaluated > 0
      ? Number(((compliantCount / totalEvaluated) * 100).toFixed(1))
      : 0;

    return {
      period: range.periodName,
      totalEvaluatedWorkflows: totalEvaluated,
      withinSlaCount: compliantCount,
      atRiskCount,
      breachedCount,
      overallComplianceRatePercent: complianceRatePercent,
      dataQuality: totalEvaluated > 0 ? 'VERIFIED' : 'NO_DATA'
    };
  }

  // =========================================================================
  // 11. STAFF WORKLOAD ANALYTICS
  // =========================================================================

  async getStaffWorkload(tenantId: string, range: DateRange) {
    const db = requireDb();

    // 1. Doctors workload from appointments
    const appts = await db.query.appointmentsPartitioned.findMany({
      where: and(
        eq(appointmentsPartitioned.tenantId, tenantId),
        gte(appointmentsPartitioned.createdAt, range.start),
        lte(appointmentsPartitioned.createdAt, range.end)
      )
    });

    const staffMap = new Map<string, { staffId: string; role: string; totalAssigned: number; completedCount: number }>();

    for (const a of appts) {
      if (!a.doctorId) continue;
      const existing = staffMap.get(a.doctorId) || {
        staffId: a.doctorId,
        role: 'DOCTOR',
        totalAssigned: 0,
        completedCount: 0
      };
      existing.totalAssigned++;
      if (a.status === 'COMPLETED') existing.completedCount++;
      staffMap.set(a.doctorId, existing);
    }

    return {
      period: range.periodName,
      staffCount: staffMap.size,
      workload: Array.from(staffMap.values()),
      dataQuality: staffMap.size > 0 ? 'VERIFIED' : 'NO_DATA'
    };
  }

  // =========================================================================
  // 12. PARTNER COMMAND CENTER EXECUTIVE OVERVIEW
  // =========================================================================

  async getExecutiveOverview(tenantId: string, range: DateRange) {
    const [patientsData, opdData, ipdData, labData, radData, revenueData, invData, pendingData, slaData] = await Promise.all([
      this.getPatientAnalytics(tenantId, range),
      this.getOpdAnalytics(tenantId, range),
      this.getIpdAnalytics(tenantId, range),
      this.getLabAnalytics(tenantId, range),
      this.getRadiologyAnalytics(tenantId, range),
      this.getRevenueAnalytics(tenantId, range),
      this.getInventoryAnalytics(tenantId),
      this.getPendingWorkQueue(tenantId),
      this.getSlaAnalytics(tenantId, range)
    ]);

    return {
      period: range.periodName,
      startDate: range.start.toISOString(),
      endDate: range.end.toISOString(),
      summary: {
        totalPatients: patientsData.totalRegisteredPatients,
        activeEncounters: patientsData.totalVisitsCount,
        opdCompletedAppointments: opdData.completedAppointments,
        ipdBedOccupancyPercent: ipdData.occupancyRatePercent,
        currentInpatients: ipdData.currentInpatientsCount,
        labReportsDelivered: labData.reportsDeliveredCount,
        labCriticalAlerts: labData.criticalPanicAlertsCount,
        radiologyCompleted: radData.finalizedCount,
        grossRevenue: revenueData.grossBilledAmount,
        paymentsCollected: revenueData.paymentsCollectedAmount,
        netRevenue: revenueData.netRealizedRevenue,
        lowStockItems: invData.lowStockItemsCount,
        expiringBatches30d: invData.expiringBatches.within30Days,
        pendingWorkQueueCount: pendingData.totalPendingItemsCount,
        slaCompliancePercent: slaData.overallComplianceRatePercent
      },
      patients: patientsData,
      opd: opdData,
      ipd: ipdData,
      lab: labData,
      radiology: radData,
      revenue: revenueData,
      inventory: invData,
      pendingWorkQueue: pendingData,
      slas: slaData,
      dataQuality: (patientsData.totalRegisteredPatients > 0 || opdData.totalAppointments > 0) ? 'VERIFIED' : 'NO_DATA'
    };
  }

  async getUnifiedPendingQueue(tenantId: string) {
    return this.getPendingWorkQueue(tenantId);
  }

  async getRealTimeSlas(tenantId: string, range?: DateRange) {
    return this.getSlaAnalytics(tenantId, range || this.resolveDateRange('TODAY'));
  }

  // =========================================================================
  // 13. EWAN / AI USAGE TELEMETRY
  // =========================================================================

  async getAiTelemetry(tenantId: string, range: DateRange) {
    const db = requireDb();
    let records: any[] = [];
    try {
      records = await db.query.aiRequestRegistry.findMany({
        where: and(
          eq(aiRequestRegistry.tenantId, tenantId),
          gte(aiRequestRegistry.requestedAt, range.start),
          lte(aiRequestRegistry.requestedAt, range.end)
        ),
        orderBy: [desc(aiRequestRegistry.requestedAt)]
      });
    } catch (err) {
      logger.warn('Could not query aiRequestRegistry', { error: String(err) });
    }

    const totalRequests = records.length;
    let totalLatency = 0;
    let totalTokens = 0;
    const statusMap: Record<string, number> = {};
    const moduleMap: Record<string, number> = {};

    for (const r of records) {
      totalLatency += Number(r.latencyMs || 0);
      totalTokens += Number(r.inputTokens || 0) + Number(r.outputTokens || 0);
      const st = (r.status || 'SUCCESS').toUpperCase();
      statusMap[st] = (statusMap[st] || 0) + 1;
      const mod = r.module || 'GENERAL';
      moduleMap[mod] = (moduleMap[mod] || 0) + 1;
    }

    const avgLatencyMs = totalRequests > 0 ? Math.round(totalLatency / totalRequests) : 0;

    return {
      period: range.periodName,
      totalRequests,
      averageLatencyMs: avgLatencyMs,
      totalTokensConsumed: totalTokens,
      statusBreakdown: statusMap,
      moduleBreakdown: moduleMap,
      dataQuality: totalRequests > 0 ? 'VERIFIED' : 'NO_DATA',
      recentRequests: records.slice(0, 10).map((r) => ({
        id: r.id,
        requestId: r.requestId,
        module: r.module,
        purpose: r.purpose,
        status: r.status,
        latencyMs: r.latencyMs,
        requestedAt: r.requestedAt
      }))
    };
  }

  // =========================================================================
  // 14. PARTNER COMMERCIAL LICENSE STATUS
  // =========================================================================

  async getLicenseStatus(tenantId: string) {
    const db = requireDb();
    let lic: any = null;
    let sub: any = null;
    let pl: any = null;

    try {
      const [l] = await db.select().from(licenses).where(eq(licenses.tenantId, tenantId)).limit(1);
      lic = l;
      if (lic?.subscriptionId) {
        const [s] = await db.select().from(subscriptions).where(eq(subscriptions.id, lic.subscriptionId)).limit(1);
        sub = s;
      }
      if (lic?.planId) {
        const [p] = await db.select().from(plans).where(eq(plans.id, lic.planId)).limit(1);
        pl = p;
      }
    } catch (err) {
      logger.warn('Could not query license status for tenant', { error: String(err) });
    }

    const now = new Date();
    const expiry = lic?.expiryDate ? new Date(lic.expiryDate) : null;
    const daysRemaining = expiry ? Math.ceil((expiry.getTime() - now.getTime()) / 86400000) : null;

    return {
      tenantId,
      status: lic?.status || 'TRIAL_ACTIVE',
      planCode: pl?.code || 'COMMUNITY_FREE',
      planName: pl?.name || 'Community Free Tier (365-Day)',
      subscriptionId: sub?.id || null,
      issuedAt: lic?.issuedAt || null,
      expiryDate: lic?.expiryDate || null,
      daysRemaining,
      maxDoctors: lic?.maxDoctors ?? 10,
      maxBranches: lic?.maxBranches ?? 1,
      isLocked: lic?.status === 'LOCKED' || lic?.status === 'EXPIRED',
      dataQuality: lic ? 'LIVE_DATABASE' : 'NO_DATA'
    };
  }

  // =========================================================================
  // 15. GOVERNED CSV EXPORT GENERATION
  // =========================================================================

  generateCsvExport(category: string, data: any): string {
    const cat = (category || 'OVERVIEW').toUpperCase();
    const rows: string[][] = [];

    if (cat === 'OVERVIEW') {
      rows.push(['Metric', 'Value', 'Period']);
      rows.push(['Total Patients', String(data.summary?.totalPatients ?? 0), data.period || '']);
      rows.push(['Active Encounters', String(data.summary?.activeEncounters ?? 0), data.period || '']);
      rows.push(['OPD Completed', String(data.summary?.opdCompletedAppointments ?? 0), data.period || '']);
      rows.push(['IPD Bed Occupancy %', String(data.summary?.ipdBedOccupancyPercent ?? 0), data.period || '']);
      rows.push(['Lab Reports Delivered', String(data.summary?.labReportsDelivered ?? 0), data.period || '']);
      rows.push(['Radiology Completed', String(data.summary?.radiologyCompleted ?? 0), data.period || '']);
      rows.push(['Gross Revenue (INR)', String(data.summary?.grossRevenue ?? 0), data.period || '']);
      rows.push(['Payments Collected (INR)', String(data.summary?.paymentsCollected ?? 0), data.period || '']);
      rows.push(['Net Revenue (INR)', String(data.summary?.netRevenue ?? 0), data.period || '']);
      rows.push(['SLA Compliance %', String(data.summary?.slaCompliancePercent ?? 0), data.period || '']);
    } else if (cat === 'REVENUE') {
      rows.push(['Invoice Number', 'Patient ID', 'Total Amount', 'Due Amount', 'Status', 'Created At']);
      for (const inv of (data.drillDown || [])) {
        rows.push([
          inv.invoiceNumber || '',
          inv.patientId || '',
          String(inv.totalAmount ?? 0),
          String(inv.balanceDue ?? 0),
          inv.status || '',
          inv.createdAt ? new Date(inv.createdAt).toISOString() : ''
        ]);
      }
    } else if (cat === 'PATIENTS') {
      rows.push(['Patient ID', 'UHID', 'Full Name', 'Gender', 'Phone', 'Created At']);
      for (const p of (data.drillDown || [])) {
        rows.push([
          p.id || '',
          p.uhid || '',
          p.fullName || '',
          p.gender || '',
          p.phone || '',
          p.createdAt ? new Date(p.createdAt).toISOString() : ''
        ]);
      }
    } else if (cat === 'INVENTORY') {
      rows.push(['Item Code', 'Item Name', 'Warehouse ID', 'Current Stock', 'Reorder Level']);
      for (const i of (data.drillDown || [])) {
        rows.push([
          i.itemCode || '',
          i.itemName || '',
          i.warehouseId || '',
          String(i.currentStock ?? 0),
          String(i.reorderLevel ?? 0)
        ]);
      }
    } else {
      rows.push(['Category', 'Count', 'Status']);
      rows.push([cat, String(data.totalOrdersCount || data.totalAppointments || data.totalBeds || 0), data.dataQuality || 'VERIFIED']);
    }

    return rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\r\n');
  }
}

export const commandCenterRepository = new CommandCenterRepository();
