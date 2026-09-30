import {
  getDatabase,
  emergencyEncounters,
  doctorProfiles,
  operationalStaff,
  encounters,
  encounterQueues,
  inpatientBeds,
  inpatientWards,
  investigationOrders,
  investigationCatalog,
  pharmacyPrescriptions,
  patients,
  operationalDepartments,
  partnerProfiles,
  billingAccounts,
  invoices,
  eq,
  desc
} from '@docsearch/database';

export interface DailyOperationsData {
  dataSource: 'live';
  calculatedAt: string;
  metrics: {
    totalPartners: number;
    activePartners: number;
    pendingDoctorsCount: number;
    grossDailyBilling: number;
    docSearchTake: number;
    hospitalNetPayouts: number;
    unresolvedEscalationsCount: number;
    appointmentsToday: number;
    appointmentsCompleted: number;
    appointmentsInConsultation: number;
    appointmentsWaiting: number;
    totalBedsCount: number;
    occupiedBedsCount: number;
    vacantIcuBedsCount: number;
    ventilatorsReadyCount: number;
    rxOrdersToday: number;
    pathologyTestsToday: number;
    radiologyOrdersToday: number;
  };
  doctors: Array<{
    id: string;
    name: string;
    specialty: string;
    hospital: string;
    nmc: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    time: string;
    qualification?: string | undefined;
  }>;
  settlementBatches: Array<{
    id: string;
    legalName: string;
    domain: string;
    planId: string;
    batchAmount: number;
    status: 'Pending' | 'Disbursed';
  }>;
  escalations: Array<{
    id: string;
    hospital: string;
    issue: string;
    priority: 'P1 CRITICAL' | 'P2 HIGH' | 'P3 ROUTINE';
    status: 'UNRESOLVED' | 'ACKNOWLEDGED';
    time: string;
    patientName?: string | undefined;
    patientMrn?: string | undefined;
    zoneName?: string | undefined;
    bedNumber?: string | undefined;
  }>;
  specialtyQueues: Array<{
    specialty: string;
    activeDoctors: number;
    currentToken: string;
    avgWait: string;
  }>;
  bedZones: Array<{
    zone: string;
    beds: string;
    icu: string;
    status: 'OPTIMAL' | 'SURGE ALERT' | 'MAINTENANCE';
    color: string;
    totalBeds: number;
    occupiedBeds: number;
  }>;
  diagnosticOrders: Array<{
    id: string;
    patient: string;
    test: string;
    lab: string;
    status: string;
    orderedAt: string;
  }>;
}

export class OperationsRepository {
  async getDailyOperations(dbClient = getDatabase()): Promise<DailyOperationsData> {
    const now = new Date();

    // 1. Fetch Partners
    const partners = await dbClient
      .select({
        id: partnerProfiles.id,
        legalName: partnerProfiles.legalName,
        tradeName: partnerProfiles.tradeName,
        lifecycleStatus: partnerProfiles.lifecycleStatus,
        metadata: partnerProfiles.metadata
      })
      .from(partnerProfiles);

    const totalPartners = partners.length;
    const activePartners = partners.filter((p) => p.lifecycleStatus === 'ACTIVE').length;

    // 2. Fetch Doctors with Staff
    const rawDocs = await dbClient
      .select({
        id: doctorProfiles.id,
        doctorCode: doctorProfiles.doctorCode,
        medicalLicenseNumber: doctorProfiles.medicalLicenseNumber,
        primarySpecialty: doctorProfiles.primarySpecialty,
        qualification: doctorProfiles.qualification,
        status: doctorProfiles.status,
        fullName: operationalStaff.fullName,
        joiningDate: operationalStaff.joiningDate,
        partnerId: doctorProfiles.partnerId
      })
      .from(doctorProfiles)
      .innerJoin(operationalStaff, eq(doctorProfiles.staffId, operationalStaff.id))
      .orderBy(desc(doctorProfiles.createdAt));

    const doctors = rawDocs.map((doc, idx) => {
      const partner = partners.find((p) => p.id === doc.partnerId) || partners[idx % partners.length] || partners[0];
      const hospitalName = partner?.legalName || partner?.tradeName || 'Apex Multi-Specialty Hospital';
      const status: 'PENDING' | 'APPROVED' | 'REJECTED' =
        doc.status === 'VERIFIED' ? 'APPROVED' : doc.status === 'REJECTED' ? 'REJECTED' : 'PENDING';

      const diffMs = now.getTime() - (doc.joiningDate ? new Date(doc.joiningDate).getTime() : now.getTime());
      const diffMins = Math.max(1, Math.floor(diffMs / (1000 * 60)));
      const timeStr = diffMins < 60 ? `${diffMins} min ago` : diffMins < 1440 ? `${Math.floor(diffMins / 60)}h ago` : 'Today';

      return {
        id: doc.id,
        name: doc.fullName,
        specialty: doc.primarySpecialty,
        hospital: hospitalName,
        nmc: doc.medicalLicenseNumber,
        status,
        time: timeStr,
        qualification: doc.qualification
      };
    });

    const pendingDoctorsCount = doctors.filter((d) => d.status === 'PENDING').length;

    // 3. Fetch Emergency Escalations
    const rawEmgs = await dbClient
      .select({
        id: emergencyEncounters.id,
        encounterNumber: emergencyEncounters.encounterNumber,
        patientName: emergencyEncounters.patientName,
        patientMrn: emergencyEncounters.patientMrn,
        chiefComplaint: emergencyEncounters.chiefComplaint,
        currentStatus: emergencyEncounters.currentStatus,
        currentZoneName: emergencyEncounters.currentZoneName,
        currentBedNumber: emergencyEncounters.currentBedNumber,
        triageEsiLevel: emergencyEncounters.triageEsiLevel,
        isTraumaAlert: emergencyEncounters.isTraumaAlert,
        arrivalTimestamp: emergencyEncounters.arrivalTimestamp,
        partnerId: emergencyEncounters.partnerId
      })
      .from(emergencyEncounters)
      .orderBy(desc(emergencyEncounters.arrivalTimestamp));

    const escalations = rawEmgs.map((emg, idx) => {
      const partner = partners.find((p) => p.id === emg.partnerId) || partners[idx % partners.length] || partners[0];
      const hospitalName = partner?.legalName || partner?.tradeName || 'Apex Multi-Specialty Hospital';
      const isResolved =
        emg.currentStatus === 'RESOLVED' ||
        emg.currentStatus === 'ACKNOWLEDGED' ||
        emg.currentStatus === 'DISCHARGED';
      const status: 'UNRESOLVED' | 'ACKNOWLEDGED' = isResolved ? 'ACKNOWLEDGED' : 'UNRESOLVED';
      const priority: 'P1 CRITICAL' | 'P2 HIGH' | 'P3 ROUTINE' =
        emg.isTraumaAlert || emg.triageEsiLevel === 'LEVEL_1_RESUSCITATION' ? 'P1 CRITICAL' : 'P2 HIGH';

      const diffMs = now.getTime() - new Date(emg.arrivalTimestamp).getTime();
      const diffMins = Math.max(1, Math.floor(diffMs / (1000 * 60)));
      const timeStr = diffMins > 1440 ? `${Math.floor(diffMins / 1440)}d ago` : diffMins > 60 ? `${Math.floor(diffMins / 60)}h ago` : `${diffMins} min ago`;

      return {
        id: emg.encounterNumber || emg.id,
        hospital: hospitalName,
        issue: emg.chiefComplaint,
        priority,
        status,
        time: timeStr,
        patientName: emg.patientName,
        patientMrn: emg.patientMrn,
        zoneName: emg.currentZoneName || undefined,
        bedNumber: emg.currentBedNumber || undefined
      };
    });

    const unresolvedEscalationsCount = escalations.filter((e) => e.status === 'UNRESOLVED').length;

    // 4. Fetch Encounters & OPD Queues
    const rawEncounters = await dbClient
      .select({
        id: encounters.id,
        encounterNumber: encounters.encounterNumber,
        status: encounters.status,
        departmentId: encounters.departmentId,
        doctorId: encounters.doctorId
      })
      .from(encounters);

    const rawQueues = await dbClient
      .select({
        id: encounterQueues.id,
        tokenNumber: encounterQueues.tokenNumber,
        queueStatus: encounterQueues.queueStatus,
        estimatedWaitMinutes: encounterQueues.estimatedWaitMinutes,
        departmentId: encounterQueues.departmentId,
        doctorId: encounterQueues.doctorId
      })
      .from(encounterQueues);

    const rawDepartments = await dbClient
      .select({
        id: operationalDepartments.id,
        departmentName: operationalDepartments.departmentName
      })
      .from(operationalDepartments);

    const appointmentsToday = rawEncounters.length;
    const appointmentsCompleted = rawEncounters.filter((e) => e.status === 'COMPLETED').length;
    const appointmentsInConsultation = rawEncounters.filter((e) => e.status === 'IN_CONSULTATION').length;
    const appointmentsWaiting = rawEncounters.filter(
      (e) => e.status === 'CHECKED_IN' || e.status === 'WAITING' || e.status === 'REGISTERED'
    ).length;

    // Group specialty queues by department
    const specialtyQueues = rawDepartments
      .map((dept) => {
        const deptDocs = rawDocs.filter((d) => d.partnerId && d.primarySpecialty.toLowerCase().includes(dept.departmentName.toLowerCase().split(' ')[0] || ''));
        const deptQueues = rawQueues.filter((q) => q.departmentId === dept.id);
        const latestQueue = deptQueues[deptQueues.length - 1];
        const activeDoctorCount = deptDocs.length > 0 ? deptDocs.length : (deptQueues.length > 0 ? 1 : 0);

        if (deptQueues.length === 0 && activeDoctorCount === 0) {
          return null;
        }

        return {
          specialty: dept.departmentName,
          activeDoctors: activeDoctorCount,
          currentToken: latestQueue ? `Token #${latestQueue.tokenNumber}` : 'Waiting',
          avgWait: latestQueue ? `${latestQueue.estimatedWaitMinutes || 10} min` : '5 min'
        };
      })
      .filter((q): q is NonNullable<typeof q> => q !== null);

    // 5. Inpatient Beds & Wards
    const rawBeds = await dbClient
      .select({
        id: inpatientBeds.id,
        bedClass: inpatientBeds.bedClass,
        status: inpatientBeds.status,
        hasVentilator: inpatientBeds.hasVentilator,
        wardId: inpatientBeds.wardId
      })
      .from(inpatientBeds);

    const rawWards = await dbClient
      .select({
        id: inpatientWards.id,
        wardName: inpatientWards.wardName,
        wardType: inpatientWards.wardType,
        totalBeds: inpatientWards.totalBeds,
        occupiedBeds: inpatientWards.occupiedBeds,
        ventilatorCapable: inpatientWards.ventilatorCapable
      })
      .from(inpatientWards);

    const totalBedsCount = rawBeds.length > 0 ? rawBeds.length : rawWards.reduce((acc, w) => acc + w.totalBeds, 0);
    const occupiedBedsCount = rawBeds.filter((b) => b.status === 'OCCUPIED').length;
    const vacantIcuBedsCount = rawBeds.filter((b) => b.bedClass === 'ICU' && b.status === 'AVAILABLE').length;
    const ventilatorsReadyCount = rawBeds.filter((b) => b.hasVentilator && b.status === 'AVAILABLE').length;

    const bedZones = rawWards.map((w) => {
      const isSurge = w.totalBeds > 0 && w.occupiedBeds / w.totalBeds > 0.85;
      const icuVacant = w.wardType === 'ICU' ? Math.max(0, w.totalBeds - w.occupiedBeds) : 0;
      return {
        zone: w.wardName,
        beds: `${w.occupiedBeds} / ${w.totalBeds} occupied`,
        icu: `${icuVacant} ICU Vacant`,
        status: (isSurge ? 'SURGE ALERT' : 'OPTIMAL') as 'OPTIMAL' | 'SURGE ALERT',
        color: isSurge ? '#EF4444' : '#10B981',
        totalBeds: w.totalBeds,
        occupiedBeds: w.occupiedBeds
      };
    });

    // 6. Diagnostics & Prescriptions
    const rawLabs = await dbClient
      .select({
        id: investigationOrders.id,
        orderNumber: investigationOrders.orderNumber,
        priority: investigationOrders.priority,
        status: investigationOrders.status,
        clinicalIndication: investigationOrders.clinicalIndication,
        orderedAt: investigationOrders.orderedAt,
        metadata: investigationOrders.metadata,
        patientFirst: patients.firstName,
        patientLast: patients.lastName,
        patientMrn: patients.mrn,
        testName: investigationCatalog.testName,
        category: investigationCatalog.category
      })
      .from(investigationOrders)
      .leftJoin(patients, eq(investigationOrders.patientId, patients.id))
      .leftJoin(investigationCatalog, eq(investigationOrders.investigationId, investigationCatalog.id))
      .orderBy(desc(investigationOrders.orderedAt));

    const rawRxs = await dbClient
      .select({
        id: pharmacyPrescriptions.id,
        prescriptionNumber: pharmacyPrescriptions.prescriptionNumber,
        priority: pharmacyPrescriptions.priority,
        status: pharmacyPrescriptions.status,
        notes: pharmacyPrescriptions.notes,
        prescribedAt: pharmacyPrescriptions.prescribedAt,
        patientFirst: patients.firstName,
        patientLast: patients.lastName,
        patientMrn: patients.mrn
      })
      .from(pharmacyPrescriptions)
      .leftJoin(patients, eq(pharmacyPrescriptions.patientId, patients.id))
      .orderBy(desc(pharmacyPrescriptions.prescribedAt));

    const diagnosticOrders: Array<{
      id: string;
      patient: string;
      test: string;
      lab: string;
      status: string;
      orderedAt: string;
    }> = [];

    rawLabs.forEach((lab) => {
      const pName = [lab.patientFirst, lab.patientLast].filter(Boolean).join(' ');
      const pLabel = lab.patientMrn ? `${pName} (${lab.patientMrn})` : pName || 'Patient';
      const meta = (lab.metadata as any) || {};
      const testTitle = meta.testName || lab.testName || 'Diagnostic Lab Order';
      const labName = meta.labCenter || 'Central Diagnostics Lab';

      diagnosticOrders.push({
        id: lab.orderNumber || lab.id,
        patient: pLabel,
        test: testTitle,
        lab: labName,
        status: lab.status === 'SAMPLE_COLLECTED' ? 'Sample Collected' : lab.status === 'PROCESSING' ? 'Processing' : lab.status,
        orderedAt: lab.orderedAt.toISOString()
      });
    });

    rawRxs.forEach((rx) => {
      const pName = [rx.patientFirst, rx.patientLast].filter(Boolean).join(' ');
      const pLabel = rx.patientMrn ? `${pName} (${rx.patientMrn})` : pName || 'Patient';

      diagnosticOrders.push({
        id: rx.prescriptionNumber || rx.id,
        patient: pLabel,
        test: rx.notes || 'Prescription Order',
        lab: 'Central Hospital Pharmacy',
        status: rx.status === 'DISPENSED' ? 'Dispatched' : rx.status,
        orderedAt: rx.prescribedAt.toISOString()
      });
    });

    const rxOrdersToday = rawRxs.length;
    const pathologyTestsToday = rawLabs.filter((l) => l.category === 'HEMATOLOGY' || l.category === 'BIOCHEMISTRY' || !l.category).length;
    const radiologyOrdersToday = rawLabs.filter((l) => l.category === 'RADIOLOGY').length;

    // 7. Billing & Settlements
    const rawInvoices = await dbClient
      .select({
        id: invoices.id,
        invoiceNumber: invoices.invoiceNumber,
        totalAmount: invoices.totalAmount,
        status: invoices.status,
        billingAccountId: invoices.billingAccountId
      })
      .from(invoices)
      .leftJoin(billingAccounts, eq(invoices.billingAccountId, billingAccounts.id));

    const totalInvoiceAmount = rawInvoices.reduce((acc, inv) => acc + (parseFloat(inv.totalAmount || '0') || 0), 0);
    const grossDailyBilling = Math.round(totalInvoiceAmount);
    const docSearchTake = Math.round(grossDailyBilling * 0.08);
    const hospitalNetPayouts = grossDailyBilling - docSearchTake;

    const areInvoicesDisbursed = rawInvoices.length > 0 && rawInvoices.every((i) => i.status === 'PAID');

    const settlementBatches = partners.map((partner, idx) => {
      const meta = (partner.metadata as any) || {};
      const share = partners.length === 1 ? 1.0 : idx === 0 ? 0.6 : 0.4 / Math.max(1, partners.length - 1);
      const batchAmount = Math.round(hospitalNetPayouts * share);
      return {
        id: partner.id,
        legalName: partner.legalName,
        domain: meta.domain || 'network-partner',
        planId: meta.planId || 'ENTERPRISE',
        batchAmount,
        status: areInvoicesDisbursed ? ('Disbursed' as const) : ('Pending' as const)
      };
    });

    return {
      dataSource: 'live',
      calculatedAt: now.toISOString(),
      metrics: {
        totalPartners,
        activePartners,
        pendingDoctorsCount,
        grossDailyBilling,
        docSearchTake,
        hospitalNetPayouts,
        unresolvedEscalationsCount,
        appointmentsToday,
        appointmentsCompleted,
        appointmentsInConsultation,
        appointmentsWaiting,
        totalBedsCount,
        occupiedBedsCount,
        vacantIcuBedsCount,
        ventilatorsReadyCount,
        rxOrdersToday,
        pathologyTestsToday,
        radiologyOrdersToday
      },
      doctors,
      settlementBatches,
      escalations,
      specialtyQueues,
      bedZones,
      diagnosticOrders
    };
  }

  async acknowledgeEmergency(id: string, dbClient = getDatabase()): Promise<{ acknowledged: boolean; id: string }> {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    const condition = isUuid
      ? eq(emergencyEncounters.id, id)
      : eq(emergencyEncounters.encounterNumber, id);

    await dbClient
      .update(emergencyEncounters)
      .set({
        currentStatus: 'RESOLVED',
        updatedAt: new Date()
      })
      .where(condition);

    return { acknowledged: true, id };
  }

  async verifyDoctor(
    id: string,
    status: 'APPROVED' | 'REJECTED',
    dbClient = getDatabase()
  ): Promise<{ success: boolean; id: string; status: string }> {
    const dbStatus = status === 'APPROVED' ? 'VERIFIED' : 'REJECTED';
    await dbClient
      .update(doctorProfiles)
      .set({
        status: dbStatus,
        updatedAt: new Date()
      })
      .where(eq(doctorProfiles.id, id));

    return { success: true, id, status: dbStatus };
  }

  async processPayouts(dbClient = getDatabase()): Promise<{ success: boolean; message: string }> {
    await dbClient
      .update(invoices)
      .set({
        status: 'PAID',
        updatedAt: new Date()
      });

    return { success: true, message: 'Batch payouts released successfully.' };
  }
}

export const operationsRepository = new OperationsRepository();
