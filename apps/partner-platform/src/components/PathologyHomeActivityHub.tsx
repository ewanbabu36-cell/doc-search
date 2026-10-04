import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Card,
  Badge,
  Button,
  DataPulse,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TableContainer
} from '@docsearch/ui-kit';
import { clinicalInvestigationService } from '../services/clinical-investigation-service.js';
import { partnerFoundationService, type ClinicInvitationDto } from '../services/partner-foundation-service.js';
import type {
  InvestigationOverviewDto,
  InvestigationOrderDto,
  InvestigationAuditTraceDto
} from '@docsearch/api-contracts';
import type { PartnerModuleKey } from './PartnerPlatformShell.js';
import { MicroscopeEyepieceScannerModal, type MicroscopeSmearReport } from './dialogs/MicroscopeEyepieceScannerModal.js';
import { PathologistTargetCockpitView } from './views/PathologistTargetCockpitView.js';

export type LaboratoryPhase = 'ALL' | 'PRE_ANALYTICAL' | 'ANALYTICAL' | 'POST_ANALYTICAL';

export const INITIAL_3PHASE_LIMS_ORDERS: (InvestigationOrderDto & {
  labPhase?: 'PRE_ANALYTICAL' | 'ANALYTICAL' | 'POST_ANALYTICAL';
  deltaCheckAlert?: string;
  readbackLogged?: boolean;
  readbackLogDetails?: string;
  rejectionReasonDetails?: string;
  autoDispatchedChannels?: string[];
  analyzerMachine?: string;
  testParameter?: string;
  observedResult?: string;
})[] = [
  // 1. Pre-Analytical: Pending Collection (Phlebotomy queue)
  {
    id: 'ORD-LAB-90410',
    tenantId: '11111111-1111-4111-8111-111111111111',
    partnerId: '11111111-1111-4111-8111-111111111111',
    organizationId: '00000000-0000-0000-0000-000000000001',
    orderNumber: 'ORD-LAB-90410',
    patientId: 'PAT-41029',
    patientName: 'Suresh Rao',
    patientMrn: 'MRN-41029',
    patientGender: 'MALE',
    patientDob: '1971-04-12',
    orderingDoctorName: 'Dr. Rajesh Sharma, MD',
    specimenType: 'Venous Blood (EDTA K2)',
    status: 'SAMPLE_REQUIRED',
    priority: 'ROUTINE',
    isCritical: false,
    labPhase: 'PRE_ANALYTICAL',
    testParameter: 'Complete Blood Count (CBC) & ESR',
    observedResult: 'Awaiting Phlebotomy Collection',
    createdAt: new Date(Date.now() - 45 * 60000).toISOString(),
    orderedAt: new Date(Date.now() - 45 * 60000).toISOString(),
    specimens: [
      {
        id: 'SPEC-90410',
        orderId: 'ORD-LAB-90410',
        accessionNumber: 'LAB-2026-90410',
        specimenType: 'Venous Blood (EDTA)',
        collectionStatus: 'PENDING',
        rejectionStatus: false,
        createdAt: new Date().toISOString()
      } as any
    ]
  } as any,
  // 2. Pre-Analytical: Sample Accessioning (Barcodes scanned at reception)
  {
    id: 'ORD-LAB-90411',
    tenantId: '11111111-1111-4111-8111-111111111111',
    partnerId: '11111111-1111-4111-8111-111111111111',
    organizationId: '00000000-0000-0000-0000-000000000001',
    orderNumber: 'ORD-LAB-90411',
    patientId: 'PAT-88219',
    patientName: 'Anita Verma',
    patientMrn: 'MRN-88219',
    patientGender: 'FEMALE',
    patientDob: '1984-08-25',
    orderingDoctorName: 'Dr. Sunita Kapoor (Endo)',
    specimenType: 'Serum (Gold SST Vacutainer)',
    status: 'ORDERED',
    priority: 'ROUTINE',
    isCritical: false,
    labPhase: 'PRE_ANALYTICAL',
    testParameter: 'Liver Function Test (LFT) & Lipid Profile',
    observedResult: '2D Barcode Accessioned & Centrifuged',
    createdAt: new Date(Date.now() - 30 * 60000).toISOString(),
    orderedAt: new Date(Date.now() - 30 * 60000).toISOString(),
    specimens: [
      {
        id: 'SPEC-90411',
        orderId: 'ORD-LAB-90411',
        accessionNumber: 'LAB-2026-90411',
        specimenType: 'Serum SST',
        collectionStatus: 'COLLECTED',
        rejectionStatus: false,
        collectedAt: new Date(Date.now() - 25 * 60000).toISOString(),
        createdAt: new Date().toISOString()
      } as any
    ]
  } as any,
  // 3. Pre-Analytical: Rejection Log (Microclot in EDTA / Citrate)
  {
    id: 'ORD-LAB-90409',
    tenantId: '11111111-1111-4111-8111-111111111111',
    partnerId: '11111111-1111-4111-8111-111111111111',
    organizationId: '00000000-0000-0000-0000-000000000001',
    orderNumber: 'ORD-LAB-90409',
    patientId: 'PAT-10923',
    patientName: 'Rahul Mehra',
    patientMrn: 'MRN-10923',
    patientGender: 'MALE',
    patientDob: '1958-11-04',
    orderingDoctorName: 'Dr. Vivek Sharma (Cardio)',
    specimenType: 'Sodium Citrate 3.2% Blue Top',
    status: 'CANCELLED',
    priority: 'STAT',
    isCritical: false,
    labPhase: 'PRE_ANALYTICAL',
    rejectionReasonDetails: 'Fibrin Microclot in 3.2% Sodium Citrate tube invalidates optical coagulation analyzer. Phlebotomy redraw required.',
    testParameter: 'Coagulation Profile (PT / INR & APTT)',
    observedResult: 'REJECTED: Microclot Present (Redraw Alert)',
    createdAt: new Date(Date.now() - 60 * 60000).toISOString(),
    orderedAt: new Date(Date.now() - 60 * 60000).toISOString(),
    specimens: [
      {
        id: 'SPEC-90409',
        orderId: 'ORD-LAB-90409',
        accessionNumber: 'LAB-2026-90409',
        specimenType: 'Citrated Plasma',
        collectionStatus: 'REJECTED',
        rejectionStatus: true,
        rejectionReason: 'MICROCLOT_PRESENT',
        rejectedAt: new Date(Date.now() - 40 * 60000).toISOString(),
        createdAt: new Date().toISOString()
      } as any
    ]
  } as any,
  // 4. Analytical: In Analyzer (HL7 / ASTM machine run)
  {
    id: 'ORD-LAB-90412',
    tenantId: '11111111-1111-4111-8111-111111111111',
    partnerId: '11111111-1111-4111-8111-111111111111',
    organizationId: '00000000-0000-0000-0000-000000000001',
    orderNumber: 'ORD-LAB-90412',
    patientId: 'PAT-50122',
    patientName: 'Kavita Patel',
    patientMrn: 'MRN-50122',
    patientGender: 'FEMALE',
    patientDob: '1991-03-18',
    orderingDoctorName: 'Dr. Alok Nath (Gastro)',
    specimenType: 'Serum SST (Centrifuged)',
    status: 'PROCESSING',
    priority: 'ROUTINE',
    isCritical: false,
    labPhase: 'ANALYTICAL',
    analyzerMachine: 'Roche Cobas 6000 (Rack #3, Slot 4)',
    testParameter: 'Comprehensive Metabolic Panel (CMP)',
    observedResult: 'Testing In-Progress (ASTM Bidirectional Run)',
    createdAt: new Date(Date.now() - 20 * 60000).toISOString(),
    orderedAt: new Date(Date.now() - 20 * 60000).toISOString(),
    specimens: [
      {
        id: 'SPEC-90412',
        orderId: 'ORD-LAB-90412',
        accessionNumber: 'LAB-2026-90412',
        specimenType: 'Serum SST',
        collectionStatus: 'COLLECTED',
        rejectionStatus: false,
        createdAt: new Date().toISOString()
      } as any
    ]
  } as any,
  // 5. Analytical: Delta Check Exception (Sudden Abnormal Shift)
  {
    id: 'ORD-LAB-90413',
    tenantId: '11111111-1111-4111-8111-111111111111',
    partnerId: '11111111-1111-4111-8111-111111111111',
    organizationId: '00000000-0000-0000-0000-000000000001',
    orderNumber: 'ORD-LAB-90413',
    patientId: 'PAT-77341',
    patientName: 'Mohammad Rizwan',
    patientMrn: 'MRN-77341',
    patientGender: 'MALE',
    patientDob: '1967-07-15',
    orderingDoctorName: 'Dr. Neha Gupta (Nephro)',
    specimenType: 'Serum Plain Red Top',
    status: 'PROCESSING',
    priority: 'STAT',
    isCritical: false,
    labPhase: 'ANALYTICAL',
    deltaCheckAlert: 'Creatinine: 3.4 mg/dL vs Prev: 0.9 mg/dL (+277% surge in 24h). AKI vs Artifact.',
    testParameter: 'Renal Function: Serum Creatinine',
    observedResult: '3.4 mg/dL (Prev: 0.9 mg/dL • +277% Shift)',
    createdAt: new Date(Date.now() - 15 * 60000).toISOString(),
    orderedAt: new Date(Date.now() - 15 * 60000).toISOString(),
    specimens: [
      {
        id: 'SPEC-90413',
        orderId: 'ORD-LAB-90413',
        accessionNumber: 'LAB-2026-90413',
        specimenType: 'Serum Plain',
        collectionStatus: 'COLLECTED',
        rejectionStatus: false,
        createdAt: new Date().toISOString()
      } as any
    ]
  } as any,
  // 6. Post-Analytical: Critical / Panic Value (Mandatory Read-Back Log)
  {
    id: 'ORD-LAB-90414',
    tenantId: '11111111-1111-4111-8111-111111111111',
    partnerId: '11111111-1111-4111-8111-111111111111',
    organizationId: '00000000-0000-0000-0000-000000000001',
    orderNumber: 'ORD-LAB-90414',
    patientId: 'PAT-33019',
    patientName: 'Deepak Gupta',
    patientMrn: 'MRN-33019',
    patientGender: 'MALE',
    patientDob: '1964-09-02',
    orderingDoctorName: 'Dr. Vivek Sharma (Cardio)',
    specimenType: 'Serum SST Vacutainer',
    status: 'RESULT_READY',
    priority: 'STAT',
    isCritical: true,
    labPhase: 'POST_ANALYTICAL',
    readbackLogged: false,
    testParameter: 'Serum Potassium (ISE)',
    observedResult: '6.8 mEq/L (CRITICAL PANIC > 6.5)',
    createdAt: new Date(Date.now() - 10 * 60000).toISOString(),
    orderedAt: new Date(Date.now() - 10 * 60000).toISOString(),
    specimens: [
      {
        id: 'SPEC-90414',
        orderId: 'ORD-LAB-90414',
        accessionNumber: 'LAB-2026-90414',
        specimenType: 'Serum SST',
        collectionStatus: 'COLLECTED',
        rejectionStatus: false,
        createdAt: new Date().toISOString()
      } as any
    ]
  } as any,
  // 7. Post-Analytical: Pending Pathologist Sign-Off (DSC)
  {
    id: 'ORD-LAB-90415',
    tenantId: '11111111-1111-4111-8111-111111111111',
    partnerId: '11111111-1111-4111-8111-111111111111',
    organizationId: '00000000-0000-0000-0000-000000000001',
    orderNumber: 'ORD-LAB-90415',
    patientId: 'PAT-66120',
    patientName: 'Sunita Devi',
    patientMrn: 'MRN-66120',
    patientGender: 'FEMALE',
    patientDob: '1978-01-30',
    orderingDoctorName: 'Dr. Alok Nath (Consultant)',
    specimenType: 'Serum SST Gold Top',
    status: 'RESULT_READY',
    priority: 'ROUTINE',
    isCritical: false,
    labPhase: 'POST_ANALYTICAL',
    testParameter: 'Thyroid Profile Total (T3, T4, TSH Ultrasensitive)',
    observedResult: 'TSH: 2.14 mIU/L • T3: 1.2 ng/mL • T4: 8.4 µg/dL',
    createdAt: new Date(Date.now() - 50 * 60000).toISOString(),
    orderedAt: new Date(Date.now() - 50 * 60000).toISOString(),
    specimens: [
      {
        id: 'SPEC-90415',
        orderId: 'ORD-LAB-90415',
        accessionNumber: 'LAB-2026-90415',
        specimenType: 'Serum SST',
        collectionStatus: 'COLLECTED',
        rejectionStatus: false,
        createdAt: new Date().toISOString()
      } as any
    ]
  } as any,
  // 8. Post-Analytical: Auto-Dispatched Report
  {
    id: 'ORD-LAB-90408',
    tenantId: '11111111-1111-4111-8111-111111111111',
    partnerId: '11111111-1111-4111-8111-111111111111',
    organizationId: '00000000-0000-0000-0000-000000000001',
    orderNumber: 'ORD-LAB-90408',
    patientId: 'PAT-21098',
    patientName: 'Vikram Singh',
    patientMrn: 'MRN-21098',
    patientGender: 'MALE',
    patientDob: '1975-06-14',
    orderingDoctorName: 'Dr. Rajesh Sharma, MD',
    specimenType: 'Whole Blood EDTA',
    status: 'VERIFIED',
    priority: 'ROUTINE',
    isCritical: false,
    labPhase: 'POST_ANALYTICAL',
    autoDispatchedChannels: ['WHATSAPP', 'SMS', 'PATIENT_PORTAL', 'NABL_QR'],
    testParameter: 'Glycated Hemoglobin (HbA1c HPLC)',
    observedResult: 'HbA1c: 6.4% (Good Glycemic Control)',
    createdAt: new Date(Date.now() - 90 * 60000).toISOString(),
    orderedAt: new Date(Date.now() - 90 * 60000).toISOString(),
    specimens: [
      {
        id: 'SPEC-90408',
        orderId: 'ORD-LAB-90408',
        accessionNumber: 'LAB-2026-90408',
        specimenType: 'Whole Blood EDTA',
        collectionStatus: 'COLLECTED',
        rejectionStatus: false,
        createdAt: new Date().toISOString()
      } as any
    ]
  } as any
];

export interface PathologyHomeActivityHubProps {
  tenantId?: string | undefined;
  onNavigateModule: (moduleKey: PartnerModuleKey, subTab?: string) => void;
  staffName?: string | undefined;
  facilityName?: string | undefined;
  role?: string | undefined;
}

export const PathologyHomeActivityHub: React.FC<PathologyHomeActivityHubProps> = ({
  tenantId = 'default',
  onNavigateModule,
  staffName = 'Lab Professional',
  facilityName = 'Pathology & Diagnostic LIS Hub',
  role = 'PATHOLOGIST'
}) => {
  const [_overview, setOverview] = useState<InvestigationOverviewDto | null>(null);
  const [orders, setOrders] = useState<InvestigationOrderDto[]>(() => INITIAL_3PHASE_LIMS_ORDERS as any);
  const [auditTraces, setAuditTraces] = useState<InvestigationAuditTraceDto[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'ANALYZING' | 'CRITICAL' | 'READY' | 'COMPLETED'>('ALL');
  const [activePhase, setActivePhase] = useState<LaboratoryPhase>('ALL');

  // Step 3: Interactive Modals for Standard 3-Phase Laboratory Workflows
  const [isPanicModalOpen, setIsPanicModalOpen] = useState(false);
  const [activePanicOrder, setActivePanicOrder] = useState<any>(null);
  const [panicCallerName, setPanicCallerName] = useState(staffName || 'Dr. Rajesh Sharma');
  const [panicReceiverName, setPanicReceiverName] = useState('Dr. Vivek Sharma (Cardiologist)');
  const [panicReadbackConfirmed, setPanicReadbackConfirmed] = useState(true);

  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [activeRejectOrder, setActiveRejectOrder] = useState<any>(null);
  const [rejectionReasonSelect, setRejectionReasonSelect] = useState<'MICROCLOT_IN_EDTA' | 'HEMOLYSIS_3PLUS' | 'QNS_QUANTITY_NOT_SUFFICIENT' | 'LIPEMIC_TURBIDITY' | 'INCORRECT_VACUTAINER'>('MICROCLOT_IN_EDTA');
  const [rejectionNotes, setRejectionNotes] = useState('');
  const [rejectionRedrawRequired, setRejectionRedrawRequired] = useState(true);

  const [isQcModalOpen, setIsQcModalOpen] = useState(false);
  const [isDeltaModalOpen, setIsDeltaModalOpen] = useState(false);
  const [activeDeltaOrder, setActiveDeltaOrder] = useState<any>(null);
  const [isBatchDscModalOpen, setIsBatchDscModalOpen] = useState(false);

  const [isMicroscopeModalOpen, setIsMicroscopeModalOpen] = useState(false);
  const [quickNotification, setQuickNotification] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setQuickNotification(msg);
    setTimeout(() => setQuickNotification(null), 3500);
  };

  // 🤝 1-Click Clinic Partner Handshake
  const [incomingInvitations, setIncomingInvitations] = useState<ClinicInvitationDto[]>(() =>
    partnerFoundationService.getIncomingClinicInvitations('PATHOLOGY')
  );
  const [clinicCodeInput, setClinicCodeInput] = useState('');
  const [isLinkingCode, setIsLinkingCode] = useState(false);
  const [isB2BModalOpen, setIsB2BModalOpen] = useState(false);
  const [activeRolePerspective, setActiveRolePerspective] = useState<'PATHOLOGIST' | 'TECHNICIAN' | 'PHLEBOTOMIST'>(() => {
    if (role === 'PHLEBOTOMIST') return 'PHLEBOTOMIST';
    if (role === 'LAB_TECHNICIAN') return 'TECHNICIAN';
    return 'PATHOLOGIST';
  });
  const [qcApproved, setQcApproved] = useState(true);

  const refreshInvitations = useCallback(() => {
    setIncomingInvitations(partnerFoundationService.getIncomingClinicInvitations('PATHOLOGY'));
  }, []);

  useEffect(() => {
    window.addEventListener('docsearch_partner_links_updated', refreshInvitations);
    window.addEventListener('storage', refreshInvitations);
    return () => {
      window.removeEventListener('docsearch_partner_links_updated', refreshInvitations);
      window.removeEventListener('storage', refreshInvitations);
    };
  }, [refreshInvitations]);

  const handleAcceptTieUp = (invitationIdOrCode: string) => {
    const res = partnerFoundationService.acceptClinicInvitation(invitationIdOrCode, 'PATHOLOGY', {
      partnerId: 'lab-partner-01',
      partnerName: facilityName || 'Shree Ram Diagnostics & Pathology',
      partnerCode: 'LAB-SHREE-RAM-01',
      phone: '+91 98350 11223'
    });
    triggerToast(res.message);
    refreshInvitations();
  };

  const handleDeclineTieUp = (invitationIdOrCode: string) => {
    const res = partnerFoundationService.declineClinicInvitation(invitationIdOrCode, 'PATHOLOGY');
    triggerToast(res.message);
    refreshInvitations();
  };

  const handleManualCodeLink = () => {
    if (!clinicCodeInput.trim()) return;
    setIsLinkingCode(true);
    const res = partnerFoundationService.acceptClinicInvitation(clinicCodeInput.trim(), 'PATHOLOGY', {
      partnerId: 'lab-partner-01',
      partnerName: facilityName || 'Shree Ram Diagnostics & Pathology',
      partnerCode: 'LAB-SHREE-RAM-01',
      phone: '+91 98350 11223'
    });
    setIsLinkingCode(false);
    triggerToast(res.message);
    if (res.success) {
      setClinicCodeInput('');
    }
    refreshInvitations();
  };

  const handleTogglePause = (clinicId: string, currentPaused: boolean) => {
    partnerFoundationService.togglePartnerConnectionStatus(clinicId, 'PATHOLOGY', !currentPaused);
    triggerToast(!currentPaused ? '⏸️ Requisitions paused for this clinic' : '▶️ Requisitions resumed for this clinic');
    refreshInvitations();
  };

  const handleDisconnect = (clinicId: string) => {
    partnerFoundationService.disconnectClinic(clinicId, 'PATHOLOGY');
    triggerToast('Disconnected from clinic.');
    refreshInvitations();
  };

  const loadLabData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [ovData, ordData, audData] = await Promise.all([
        clinicalInvestigationService.getOverview(tenantId),
        clinicalInvestigationService.searchOrders({ tenantId, pageIndex: 1, pageSize: 100 }),
        clinicalInvestigationService.getAuditTraces({ tenantId, pageIndex: 1, pageSize: 50 })
      ]);
      setOverview(ovData);
      if (ordData && ordData.length > 0) {
        setOrders(ordData);
      } else {
        setOrders(INITIAL_3PHASE_LIMS_ORDERS as any);
      }
      setAuditTraces(audData);
    } catch (err) {
      console.warn('Could not load Pathology Home live telemetry:', err);
    } finally {
      setIsLoading(false);
    }
  }, [tenantId]);

  useEffect(() => {
    void loadLabData();
    const interval = setInterval(() => {
      if (typeof document !== 'undefined' && document.hidden) return;
      void loadLabData();
    }, 15000);
    return () => clearInterval(interval);
  }, [loadLabData]);

  // Counts by 3-Phase testing lifecycle
  const preAnalyticalCount = useMemo(() => {
    return orders.filter((o) => o.status === 'SAMPLE_REQUIRED' || o.status === 'ORDERED' || o.status === 'CANCELLED' || (o as any).labPhase === 'PRE_ANALYTICAL').length;
  }, [orders]);

  const analyticalCount = useMemo(() => {
    return orders.filter((o) => o.status === 'PROCESSING' || (o as any).labPhase === 'ANALYTICAL').length;
  }, [orders]);

  const postAnalyticalCount = useMemo(() => {
    return orders.filter((o) => o.status === 'RESULT_READY' || o.status === 'VERIFIED' || o.status === 'REVIEWED' || o.isCritical || (o as any).labPhase === 'POST_ANALYTICAL').length;
  }, [orders]);

  // Filtered orders list for today's active table
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const q = searchTerm.toLowerCase();
      const accNum = order.specimens?.[0]?.accessionNumber || '';
      const matchesSearch =
        !q ||
        order.orderNumber.toLowerCase().includes(q) ||
        (order.patientName || '').toLowerCase().includes(q) ||
        (order.patientMrn || '').toLowerCase().includes(q) ||
        accNum.toLowerCase().includes(q) ||
        (order.specimenType || '').toLowerCase().includes(q);

      if (!matchesSearch) return false;

      // Filter by Active Laboratory Phase if selected
      if (activePhase === 'PRE_ANALYTICAL') {
        const isPre = order.status === 'SAMPLE_REQUIRED' || order.status === 'ORDERED' || order.status === 'CANCELLED' || (order as any).labPhase === 'PRE_ANALYTICAL';
        if (!isPre) return false;
      } else if (activePhase === 'ANALYTICAL') {
        const isAna = order.status === 'PROCESSING' || (order as any).labPhase === 'ANALYTICAL';
        if (!isAna) return false;
      } else if (activePhase === 'POST_ANALYTICAL') {
        const isPost = order.status === 'RESULT_READY' || order.status === 'VERIFIED' || order.status === 'REVIEWED' || order.isCritical || (order as any).labPhase === 'POST_ANALYTICAL';
        if (!isPost) return false;
      }

      if (statusFilter === 'CRITICAL') return order.isCritical;
      if (statusFilter === 'PENDING') return order.status === 'SAMPLE_REQUIRED' || order.status === 'ORDERED';
      if (statusFilter === 'ANALYZING') return order.status === 'PROCESSING' || order.status === 'SAMPLE_COLLECTED';
      if (statusFilter === 'READY') return order.status === 'RESULT_READY';
      if (statusFilter === 'COMPLETED') return order.status === 'VERIFIED' || order.status === 'REVIEWED';
      return true;
    });
  }, [orders, searchTerm, statusFilter, activePhase]);

  // Critical panic orders
  const criticalOrders = useMemo(() => {
    return orders.filter((o) => o.isCritical);
  }, [orders]);

  const handleCommitMicroscopeReport = (report: MicroscopeSmearReport) => {
    setIsMicroscopeModalOpen(false);
    triggerToast(`🔬 AI Smear Result Recorded: ${report.primaryDiagnosis} (${report.confidenceScore}% confidence)`);
    void loadLabData();
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        padding: '16px 20px 48px',
        color: '#F8FAFC',
        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, sans-serif'
      }}
    >
      {/* Quick Toast Alert */}
      {quickNotification && (
        <div
          className="ds-spring-press"
          style={{
            position: 'fixed',
            top: '20px',
            right: '24px',
            zIndex: 10003,
            backgroundColor: 'rgba(15, 23, 42, 0.96)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(168, 85, 247, 0.4)',
            color: '#F8FAFC',
            padding: '10px 18px',
            borderRadius: '10px',
            boxShadow: '0 12px 30px rgba(0, 0, 0, 0.6)',
            fontSize: '0.85rem',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <span>⚡</span>
          <span>{quickNotification}</span>
        </div>
      )}

      {/* 🤝 1-CLICK MUTUAL HANDSHAKE & CLINIC TIE-UP WIDGET */}
      {/* A. Pending Invitations Banner (High Visibility) */}
      {incomingInvitations.filter((inv) => inv.status === 'PENDING').map((inv) => (
        <div
          key={inv.invitationId}
          style={{
            background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.18) 0%, rgba(15, 23, 42, 0.98) 100%)',
            border: '1.5px solid #A855F7',
            borderRadius: '14px',
            padding: '16px 20px',
            boxShadow: '0 8px 24px rgba(168, 85, 247, 0.25)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '16px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                width: '46px',
                height: '46px',
                borderRadius: '12px',
                backgroundColor: 'rgba(168, 85, 247, 0.25)',
                border: '1.5px solid #A855F7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.5rem'
              }}
            >
              🔔
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.95rem', fontWeight: 800, color: '#E9D5FF' }}>
                  NEW CLINIC TIE-UP INVITATION
                </span>
                <Badge variant="warning">Code: {inv.clinicCode}</Badge>
                <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>• Received {inv.sentAt}</span>
              </div>
              <div style={{ marginTop: '3px', fontSize: '1rem', fontWeight: 700, color: '#F8FAFC' }}>
                🩺 {inv.clinicName} <span style={{ fontWeight: 400, color: '#94A3B8', fontSize: '0.875rem' }}>({inv.doctorName})</span>
              </div>
              <div style={{ marginTop: '2px', fontSize: '0.8125rem', color: '#CBD5E1' }}>
                📍 {inv.address} | 📞 {inv.phone}
              </div>
              <div style={{ marginTop: '4px', fontSize: '0.8125rem', color: '#C084FC', fontWeight: 600 }}>
                ✨ Wants to link with your LIS as their EXCLUSIVE PATHOLOGY PARTNER for digital lab requisitions.
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Button
              variant="success"
              onClick={() => handleAcceptTieUp(inv.invitationId)}
              style={{
                backgroundColor: '#10B981',
                color: '#FFFFFF',
                fontWeight: 700,
                padding: '10px 18px',
                fontSize: '0.875rem',
                borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.4)'
              }}
            >
              ✓ Accept & Link Lab
            </Button>
            <Button
              variant="outline"
              onClick={() => handleDeclineTieUp(inv.invitationId)}
              style={{
                borderColor: '#EF4444',
                color: '#EF4444',
                padding: '10px 14px',
                fontSize: '0.875rem',
                borderRadius: '8px'
              }}
            >
              ✕ Decline
            </Button>
          </div>
        </div>
      ))}

      {/* B. Active Connected Clinics Strip & Quick Code Linker */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          padding: '12px 18px',
          backgroundColor: 'rgba(15, 23, 42, 0.75)',
          border: '1px solid rgba(148, 163, 184, 0.2)',
          borderRadius: '12px'
        }}
      >
        {/* Left: Connected Clinics */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase' }}>
            🤝 Partner Network:
          </span>
          {incomingInvitations.filter((inv) => inv.status === 'ACCEPTED').length === 0 ? (
            <span style={{ fontSize: '0.8125rem', color: '#64748B', fontStyle: 'italic' }}>
              No clinics linked yet. Enter invite code below to link.
            </span>
          ) : (
            incomingInvitations
              .filter((inv) => inv.status === 'ACCEPTED')
              .map((inv) => (
                <div
                  key={inv.invitationId}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '4px 10px',
                    backgroundColor: inv.isPaused ? 'rgba(239, 68, 68, 0.15)' : 'rgba(168, 85, 247, 0.15)',
                    border: `1px solid ${inv.isPaused ? '#EF4444' : '#A855F7'}`,
                    borderRadius: '8px'
                  }}
                >
                  <span style={{ fontSize: '0.75rem' }}>{inv.isPaused ? '⏸️' : '🟢'}</span>
                  <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#F8FAFC' }}>
                    {inv.clinicName}
                  </span>
                  <Badge variant={inv.isPaused ? 'neutral' : 'success'}>
                    {inv.isPaused ? 'PAUSED' : 'AUTO-ROUTING ACTIVE'}
                  </Badge>
                  <button
                    onClick={() => handleTogglePause(inv.clinicId, !!inv.isPaused)}
                    title={inv.isPaused ? 'Resume orders' : 'Pause orders'}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '0.75rem',
                      color: '#C084FC',
                      padding: '2px 4px'
                    }}
                  >
                    {inv.isPaused ? '▶️ Resume' : '⏸️ Pause'}
                  </button>
                  <button
                    onClick={() => handleDisconnect(inv.clinicId)}
                    title="Disconnect Clinic"
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '0.75rem',
                      color: '#EF4444',
                      padding: '2px 4px'
                    }}
                  >
                    ✕
                  </button>
                </div>
              ))
          )}
        </div>

        {/* Right: Clean Settings Shift Button */}
        <div>
          <button
            type="button"
            onClick={() => setIsB2BModalOpen(true)}
            style={{
              padding: '6px 12px',
              backgroundColor: '#1E293B',
              border: '1px solid #334155',
              borderRadius: '6px',
              color: '#38BDF8',
              fontSize: '0.75rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.15s ease'
            }}
            title="Configure referral clinics and incoming requisition routing"
          >
            ⚙️ Settings → B2B Partnerships
          </button>
        </div>
      </div>

      {/* 🤝 Settings → B2B Partnerships Modal */}
      {isB2BModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 99999,
            padding: '16px'
          }}
          onClick={() => setIsB2BModalOpen(false)}
        >
          <div
            style={{
              backgroundColor: '#0F172A',
              border: '1px solid #334155',
              borderRadius: '16px',
              maxWidth: '500px',
              width: '100%',
              padding: '24px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.75)',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #1E293B', paddingBottom: '12px' }}>
              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#F8FAFC', margin: 0 }}>
                  ⚙️ Settings → B2B Partnerships &amp; Clinic Routing
                </h3>
                <p style={{ fontSize: '0.75rem', color: '#94A3B8', margin: '4px 0 0 0' }}>
                  Connect external clinics and auto-route diagnostic lab requisitions
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsB2BModalOpen(false)}
                style={{ background: 'none', border: 'none', color: '#94A3B8', fontSize: '1.2rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#CBD5E1' }}>
                Enter Clinic Partnership Invite Code:
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  value={clinicCodeInput}
                  onChange={(e) => setClinicCodeInput(e.target.value)}
                  placeholder="e.g. CLINIC-SHARMA-2026"
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    backgroundColor: '#020617',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    color: '#F8FAFC',
                    fontSize: '0.875rem',
                    textTransform: 'uppercase'
                  }}
                />
                <Button
                  variant="primary"
                  disabled={isLinkingCode || !clinicCodeInput.trim()}
                  onClick={() => {
                    handleManualCodeLink();
                  }}
                  style={{ padding: '8px 16px', fontSize: '0.875rem', fontWeight: 700, borderRadius: '8px' }}
                >
                  {isLinkingCode ? 'Linking...' : 'Link Now'}
                </Button>
              </div>
            </div>

            <div style={{ backgroundColor: 'rgba(56, 189, 248, 0.08)', border: '1px solid rgba(56, 189, 248, 0.2)', borderRadius: '8px', padding: '12px' }}>
              <p style={{ fontSize: '0.75rem', color: '#38BDF8', margin: 0 }}>
                💡 <strong>Admin Note:</strong> Clinic invite codes link external hospital and clinic OPD desks directly to your LIMS testing workbench. Once connected, doctor requisitions appear in your Phlebotomy &amp; Analyzer queues automatically.
              </p>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '8px' }}>
              <Button variant="outline" onClick={() => setIsB2BModalOpen(false)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {activeRolePerspective === 'PATHOLOGIST' ? (
        <PathologistTargetCockpitView
          facilityName={facilityName}
          staffName={staffName}
          qcApproved={qcApproved}
          onToggleQcApproved={() => setQcApproved((prev) => !prev)}
          onOpenQcModal={() => setIsQcModalOpen(true)}
          onOpenRejectModal={(order) => {
            setActiveRejectOrder(order || orders[0]);
            setIsRejectModalOpen(true);
          }}
          onOpenPanicModal={(order) => {
            setActivePanicOrder(order || criticalOrders[0] || orders[0]);
            setIsPanicModalOpen(true);
          }}
          onOpenBatchDscModal={() => setIsBatchDscModalOpen(true)}
          onOpenWsiModal={() => setIsMicroscopeModalOpen(true)}
          onOpenDeltaModal={(order) => {
            setActiveDeltaOrder(order || orders[0]);
            setIsDeltaModalOpen(true);
          }}
          onNavigateModule={onNavigateModule}
          triggerToast={triggerToast}
          activeRolePerspective={activeRolePerspective}
          onChangeRolePerspective={setActiveRolePerspective}
        />
      ) : (
        <>
          {/* 🔬 STEP 2: REAL-WORLD LABORATORY ROLE ISOLATION WORKSPACE SWITCHER */}
          <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          padding: '12px 18px',
          backgroundColor: '#0F172A',
          border: '1.5px solid rgba(168, 85, 247, 0.35)',
          borderRadius: '16px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.5)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.8125rem', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Laboratory Workstation:
          </span>
          <div style={{ display: 'flex', gap: '6px', backgroundColor: 'rgba(255, 255, 255, 0.04)', padding: '4px', borderRadius: '10px' }}>
            <button
              type="button"
              onClick={() => {
                setActiveRolePerspective('PATHOLOGIST');
                setStatusFilter('READY');
                triggerToast('Switched to Pathologist / Lab Director Cockpit (Shahab Admin)');
              }}
              style={{
                padding: '7px 14px',
                borderRadius: '8px',
                border: '1px solid transparent',
                backgroundColor: 'transparent',
                color: '#94A3B8',
                fontWeight: 600,
                fontSize: '0.8125rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.15s ease'
              }}
            >
              <span>🔬</span>
              <span>Pathologist Cockpit (MD Sign-Off)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveRolePerspective('TECHNICIAN');
                setStatusFilter('ANALYZING');
                triggerToast('Switched to Lab Technician Testing Workbench');
              }}
              style={{
                padding: '7px 14px',
                borderRadius: '8px',
                border: activeRolePerspective === 'TECHNICIAN' ? '1.5px solid #38BDF8' : '1px solid transparent',
                backgroundColor: activeRolePerspective === 'TECHNICIAN' ? 'rgba(56, 189, 248, 0.25)' : 'transparent',
                color: activeRolePerspective === 'TECHNICIAN' ? '#F8FAFC' : '#94A3B8',
                fontWeight: activeRolePerspective === 'TECHNICIAN' ? 800 : 600,
                fontSize: '0.8125rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.15s ease'
              }}
            >
              <span>⚙️</span>
              <span>Lab Technician Workbench</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveRolePerspective('PHLEBOTOMIST');
                setStatusFilter('PENDING');
                triggerToast('Switched to Phlebotomy & Intake Desk');
              }}
              style={{
                padding: '7px 14px',
                borderRadius: '8px',
                border: activeRolePerspective === 'PHLEBOTOMIST' ? '1.5px solid #F59E0B' : '1px solid transparent',
                backgroundColor: activeRolePerspective === 'PHLEBOTOMIST' ? 'rgba(245, 158, 11, 0.25)' : 'transparent',
                color: activeRolePerspective === 'PHLEBOTOMIST' ? '#F8FAFC' : '#94A3B8',
                fontWeight: activeRolePerspective === 'PHLEBOTOMIST' ? 800 : 600,
                fontSize: '0.8125rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.15s ease'
              }}
            >
              <span>🩸</span>
              <span>Phlebotomy &amp; Intake Desk</span>
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Badge variant="primary" style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#34D399', borderColor: 'rgba(16, 185, 129, 0.3)' }}>
            NABL &amp; ISO-15189 Standard
          </Badge>
          <span style={{ fontSize: '0.75rem', color: '#64748B' }}>Role-Isolated Architecture</span>
        </div>
      </div>

      {/* Dynamic Header Banner by Active Role */}
      <div
        className="ds-glass-panel"
        style={{
          borderRadius: '16px',
          padding: '18px 24px',
          background: activeRolePerspective === 'TECHNICIAN'
            ? 'linear-gradient(135deg, rgba(8, 47, 73, 0.85) 0%, rgba(15, 23, 42, 0.95) 100%)'
            : 'linear-gradient(135deg, rgba(69, 26, 3, 0.85) 0%, rgba(15, 23, 42, 0.95) 100%)',
          border: activeRolePerspective === 'TECHNICIAN'
            ? '1px solid rgba(56, 189, 248, 0.35)'
            : '1px solid rgba(245, 158, 11, 0.35)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.35)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: activeRolePerspective === 'TECHNICIAN' ? 'rgba(56, 189, 248, 0.2)' : 'rgba(245, 158, 11, 0.2)',
              border: `1.5px solid ${activeRolePerspective === 'TECHNICIAN' ? '#38BDF8' : '#F59E0B'}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.5rem'
            }}
          >
            {activeRolePerspective === 'TECHNICIAN' ? '⚙️' : '🩸'}
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <h1 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 800, color: 'var(--ds-color-text-primary)', letterSpacing: '-0.02em' }}>
                {activeRolePerspective === 'TECHNICIAN'
                  ? 'Laboratory Technician Workbench'
                  : 'Phlebotomy & Sample Collection Desk'}
              </h1>
              <Badge
                variant={activeRolePerspective === 'TECHNICIAN' ? 'info' : 'warning'}
                style={{ fontSize: '0.72rem' }}
              >
                {activeRolePerspective === 'TECHNICIAN'
                  ? 'Analytical Stage'
                  : 'Pre-Analytical Intake'}
              </Badge>
              <DataPulse status="online" label="Daily QC: Approved (Level 1 & Level 2 Passed)" size="sm" style={{ color: '#34D399', fontSize: '0.7rem' }} />
            </div>
            <p style={{ margin: '4px 0 0', fontSize: '0.82rem', color: 'var(--ds-color-text-muted)' }}>
              {facilityName} • Logged in: <strong style={{ color: 'var(--ds-color-text-primary)' }}>{staffName}</strong> (
              {activeRolePerspective === 'TECHNICIAN' ? 'LAB TECHNICIAN' : 'PHLEBOTOMIST'}
              )
            </p>
          </div>
        </div>

        {/* Role-Specific Action Bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>

          {activeRolePerspective === 'TECHNICIAN' && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  triggerToast('⚙️ ASTM/HL7 Bi-directional Command Sent: Worklist pushed to Sysmex & Cobas');
                }}
                style={{
                  borderColor: 'rgba(56, 189, 248, 0.5)',
                  color: '#38BDF8',
                  backgroundColor: 'rgba(56, 189, 248, 0.12)',
                  fontWeight: 700,
                  fontSize: '0.8rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <span>⚙️</span>
                <span>Push HL7 Analyzer Worklist</span>
              </Button>

              <Button
                variant="primary"
                size="sm"
                onClick={() => onNavigateModule('clinical-investigation', 'processing')}
                style={{
                  backgroundColor: '#0284C7',
                  color: '#FFFFFF',
                  fontWeight: 800,
                  fontSize: '0.8rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <span>📝</span>
                <span>Enter Raw Values</span>
              </Button>
            </>
          )}

          {activeRolePerspective === 'PHLEBOTOMIST' && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  triggerToast('🖨️ Printing Barcode Labels: Vacutainer UID labels queued on Zebra printer');
                }}
                style={{
                  borderColor: 'rgba(245, 158, 11, 0.5)',
                  color: '#FCD34D',
                  backgroundColor: 'rgba(245, 158, 11, 0.12)',
                  fontWeight: 700,
                  fontSize: '0.8rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <span>🖨️</span>
                <span>Print Vacutainer Barcodes</span>
              </Button>

              <Button
                variant="primary"
                size="sm"
                onClick={() => onNavigateModule('clinical-investigation', 'specimens')}
                style={{
                  backgroundColor: '#D97706',
                  color: '#FFFFFF',
                  fontWeight: 800,
                  fontSize: '0.8rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <span>🩸</span>
                <span>Phlebotomy Draw Queue</span>
              </Button>
            </>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={() => onNavigateModule('clinical-investigation')}
            style={{ fontSize: '0.8rem', fontWeight: 600 }}
          >
            Open LIMS ➔
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              triggerToast('↻ Synchronizing live sample telemetry...');
              void loadLabData();
            }}
            style={{ fontSize: '0.8rem', padding: '6px 10px' }}
            title="Refresh Live Data"
          >
            <span>↻</span>
          </Button>
        </div>
      </div>


      {activeRolePerspective === 'TECHNICIAN' && (
        <div
          style={{
            backgroundColor: 'rgba(56, 189, 248, 0.1)',
            border: '1.5px solid rgba(56, 189, 248, 0.4)',
            borderRadius: '14px',
            padding: '12px 18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '1.25rem' }}>🧪</span>
            <div>
              <strong style={{ fontSize: '0.85rem', color: '#7DD3FC' }}>
                PRE-ANALYTICAL TUBE INTEGRITY &amp; CENTRIFUGATION SORTER
              </strong>
              <div style={{ fontSize: '0.75rem', color: '#CBD5E1', marginTop: '2px' }}>
                EDTA Lavender (Passed) • Serum SST Gold (Centrifuged 3000 RPM) • Sodium Citrate Blue (Passed) • Zero Hemolysis / Zero Clots
              </div>
            </div>
          </div>
          <Badge variant="info">Batch Ready for Instrument Load</Badge>
        </div>
      )}

      {activeRolePerspective === 'PHLEBOTOMIST' && (
        <div
          style={{
            backgroundColor: 'rgba(245, 158, 11, 0.1)',
            border: '1.5px solid rgba(245, 158, 11, 0.4)',
            borderRadius: '14px',
            padding: '12px 18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '1.25rem' }}>🩸</span>
            <div>
              <strong style={{ fontSize: '0.85rem', color: '#FCD34D' }}>
                PHLEBOTOMY DRAW BOOTH #1 ACTIVE &amp; VACUTAINER ACCESSIONING
              </strong>
              <div style={{ fontSize: '0.75rem', color: '#CBD5E1', marginTop: '2px' }}>
                Barcode Scanner Connected • Vacutainers Stocked (EDTA, SST, Citrate, Fluoride) • Sharps Disposal Safe
              </div>
            </div>
          </div>
          <Badge variant="warning">Ready for Patient Intake</Badge>
        </div>
      )}

      {/* Critical Panic Value Alert Strip (Always Alerting If Panic Present) */}
      {criticalOrders.length > 0 && (
        <div
          style={{
            backgroundColor: 'rgba(239, 68, 68, 0.12)',
            border: '1.5px solid #EF4444',
            borderRadius: '14px',
            padding: '14px 18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
            boxShadow: '0 4px 20px rgba(239, 68, 68, 0.2)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '1.5rem', animation: 'pulse 1.2s infinite' }}>🚨</span>
            <div>
              <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#FCA5A5' }}>
                CRITICAL VALUE CALL DESK (READ-BACK LOGGED) — {criticalOrders.length} Critical Order{criticalOrders.length > 1 ? 's' : ''}
              </div>
              <div style={{ fontSize: '0.78rem', color: '#CBD5E1', marginTop: '2px' }}>
                Life-threatening critical values detected. Mandatory telephonic read-back verbal confirmation per NABL ISO-15189 clause 5.8.2.
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const crit = criticalOrders[0];
                if (crit) {
                  setActivePanicOrder(crit);
                  setIsPanicModalOpen(true);
                } else {
                  setStatusFilter('CRITICAL');
                }
              }}
              style={{ borderColor: '#EF4444', color: '#FCA5A5', backgroundColor: 'rgba(239, 68, 68, 0.2)', fontSize: '0.75rem', fontWeight: 700 }}
            >
              📞 Critical Value Call Desk ({criticalOrders.length})
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => onNavigateModule('clinical-investigation', 'critical')}
              style={{ backgroundColor: '#DC2626', color: '#FFF', fontSize: '0.75rem', fontWeight: 800 }}
            >
              Resolve in LIMS ➔
            </Button>
          </div>
        </div>
      )}

      {/* 🧪 STEP 3: INDUSTRY STANDARD 3-PHASE LABORATORY WORKFLOW PIPELINE */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          padding: '16px 20px',
          backgroundColor: '#0F172A',
          border: '1.5px solid rgba(56, 189, 248, 0.3)',
          borderRadius: '16px',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.4)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '1rem', fontWeight: 800, color: '#38BDF8', letterSpacing: '0.02em' }}>
              LABORATORY TESTING LIFECYCLE (ISO-15189 / NABL)
            </span>
            <Badge variant="neutral" style={{ fontSize: '0.7rem' }}>
              3-Phase Standard Pipeline
            </Badge>
          </div>
          <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
            Filter entire workbench by clinical phase:
          </span>
        </div>

        {/* Horizontal 3-Phase Stepper Selector */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '8px',
            backgroundColor: 'rgba(255, 255, 255, 0.03)',
            padding: '6px',
            borderRadius: '12px'
          }}
        >
          {/* All Phases Button */}
          <button
            type="button"
            onClick={() => {
              setActivePhase('ALL');
              triggerToast('Displaying all 3 laboratory testing phases');
            }}
            style={{
              padding: '10px 14px',
              borderRadius: '8px',
              border: activePhase === 'ALL' ? '1.5px solid #A855F7' : '1px solid rgba(255, 255, 255, 0.08)',
              backgroundColor: activePhase === 'ALL' ? 'rgba(168, 85, 247, 0.25)' : 'transparent',
              color: activePhase === 'ALL' ? '#F8FAFC' : '#94A3B8',
              fontWeight: activePhase === 'ALL' ? 800 : 600,
              fontSize: '0.8rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              transition: 'all 0.15s ease'
            }}
          >
            <span>🌐 All Phases</span>
            <Badge variant={activePhase === 'ALL' ? 'primary' : 'neutral'}>{orders.length}</Badge>
          </button>

          {/* Phase 1: Pre-Analytical Button */}
          <button
            type="button"
            onClick={() => {
              setActivePhase('PRE_ANALYTICAL');
              triggerToast('Phase 1: Pre-Analytical Stage (Intake, Phlebotomy, Accessioning & Rejections)');
            }}
            style={{
              padding: '10px 14px',
              borderRadius: '8px',
              border: activePhase === 'PRE_ANALYTICAL' ? '1.5px solid #F59E0B' : '1px solid rgba(255, 255, 255, 0.08)',
              backgroundColor: activePhase === 'PRE_ANALYTICAL' ? 'rgba(245, 158, 11, 0.25)' : 'transparent',
              color: activePhase === 'PRE_ANALYTICAL' ? '#F8FAFC' : '#94A3B8',
              fontWeight: activePhase === 'PRE_ANALYTICAL' ? 800 : 600,
              fontSize: '0.8rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              transition: 'all 0.15s ease'
            }}
          >
            <span>🩸 Phase 1: Pre-Analytical</span>
            <Badge variant={activePhase === 'PRE_ANALYTICAL' ? 'warning' : 'neutral'}>{preAnalyticalCount}</Badge>
          </button>

          {/* Phase 2: Analytical Button */}
          <button
            type="button"
            onClick={() => {
              setActivePhase('ANALYTICAL');
              triggerToast('Phase 2: Analytical Testing Stage (Analyzer Racks, QC & Delta Checks)');
            }}
            style={{
              padding: '10px 14px',
              borderRadius: '8px',
              border: activePhase === 'ANALYTICAL' ? '1.5px solid #38BDF8' : '1px solid rgba(255, 255, 255, 0.08)',
              backgroundColor: activePhase === 'ANALYTICAL' ? 'rgba(56, 189, 248, 0.25)' : 'transparent',
              color: activePhase === 'ANALYTICAL' ? '#F8FAFC' : '#94A3B8',
              fontWeight: activePhase === 'ANALYTICAL' ? 800 : 600,
              fontSize: '0.8rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              transition: 'all 0.15s ease'
            }}
          >
            <span>⚙️ Phase 2: Analytical</span>
            <Badge variant={activePhase === 'ANALYTICAL' ? 'info' : 'neutral'}>{analyticalCount}</Badge>
          </button>

          {/* Phase 3: Post-Analytical Button */}
          <button
            type="button"
            onClick={() => {
              setActivePhase('POST_ANALYTICAL');
              triggerToast('Phase 3: Post-Analytical Stage (Critical Read-Back, DSC Sign-Off & Dispatch)');
            }}
            style={{
              padding: '10px 14px',
              borderRadius: '8px',
              border: activePhase === 'POST_ANALYTICAL' ? '1.5px solid #10B981' : '1px solid rgba(255, 255, 255, 0.08)',
              backgroundColor: activePhase === 'POST_ANALYTICAL' ? 'rgba(16, 185, 129, 0.25)' : 'transparent',
              color: activePhase === 'POST_ANALYTICAL' ? '#F8FAFC' : '#94A3B8',
              fontWeight: activePhase === 'POST_ANALYTICAL' ? 800 : 600,
              fontSize: '0.8rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              transition: 'all 0.15s ease'
            }}
          >
            <span>📋 Phase 3: Post-Analytical</span>
            <Badge variant={activePhase === 'POST_ANALYTICAL' ? 'success' : 'neutral'}>{postAnalyticalCount}</Badge>
          </button>
        </div>
      </div>

      {/* 3-PHASE CLINICAL KPI CARDS GRID */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '14px'
        }}
      >
        {/* PHASE 1: PRE-ANALYTICAL CARDS */}
        {(activePhase === 'ALL' || activePhase === 'PRE_ANALYTICAL') && (
          <>
            {/* 1.1 Pending Collection (Phlebotomy Queue) */}
            <Card
              padding="md"
              className="ds-glass-panel ds-interactive"
              style={{
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                border: '1.5px solid rgba(245, 158, 11, 0.35)',
                background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.08) 0%, rgba(15, 23, 42, 0.7) 100%)'
              }}
              onClick={() => {
                setActivePhase('PRE_ANALYTICAL');
                setStatusFilter('PENDING');
                triggerToast('Filtered: Patients awaiting phlebotomy blood draw');
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.72rem', color: '#FCD34D', fontWeight: 800, textTransform: 'uppercase' }}>
                  Pre-Analytic: Phlebotomy Draw
                </span>
                <span style={{ fontSize: '1.2rem' }}>🩸</span>
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#F59E0B', margin: '6px 0 2px' }}>
                {orders.filter((o) => o.status === 'SAMPLE_REQUIRED' || o.status === 'ORDERED').length}
              </div>
              <div style={{ fontSize: '0.72rem', color: '#CBD5E1', fontWeight: 600 }}>
                Pending Venipuncture / Draw Queue
              </div>
            </Card>

            {/* 1.2 Sample Accessioning & Barcode Check */}
            <Card
              padding="md"
              className="ds-glass-panel ds-interactive"
              style={{
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                border: '1.5px solid rgba(217, 119, 6, 0.35)',
                background: 'linear-gradient(135deg, rgba(217, 119, 6, 0.08) 0%, rgba(15, 23, 42, 0.7) 100%)'
              }}
              onClick={() => {
                setActivePhase('PRE_ANALYTICAL');
                setStatusFilter('ALL');
                triggerToast('Filtered: Accessioned samples with 2D barcode labels');
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.72rem', color: '#FBBF24', fontWeight: 800, textTransform: 'uppercase' }}>
                  Pre-Analytic: Accessioning
                </span>
                <span style={{ fontSize: '1.2rem' }}>🏷️</span>
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#FCD34D', margin: '6px 0 2px' }}>
                {orders.filter((o) => o.status === 'SAMPLE_COLLECTED' || (o as any).labPhase === 'PRE_ANALYTICAL').length}
              </div>
              <div style={{ fontSize: '0.72rem', color: '#CBD5E1', fontWeight: 600 }}>
                2D Datamatrix Labels Scanned at Intake
              </div>
            </Card>

            {/* 1.3 Pre-Analytical Rejection Log */}
            <Card
              padding="md"
              className="ds-glass-panel ds-interactive"
              style={{
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                border: '1.5px solid rgba(239, 68, 68, 0.4)',
                background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(15, 23, 42, 0.7) 100%)'
              }}
              onClick={() => {
                const rejOrder = orders.find((o) => o.status === 'CANCELLED' || (o as any).rejectionReasonDetails) || orders[0];
                setActiveRejectOrder(rejOrder);
                setIsRejectModalOpen(true);
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.72rem', color: '#FCA5A5', fontWeight: 800, textTransform: 'uppercase' }}>
                  Pre-Analytic: Rejection Log
                </span>
                <span style={{ fontSize: '1.2rem' }}>🚫</span>
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#EF4444', margin: '6px 0 2px' }}>
                {orders.filter((o) => o.status === 'CANCELLED' || (o as any).rejectionReasonDetails).length}
              </div>
              <div style={{ fontSize: '0.72rem', color: '#FCA5A5', fontWeight: 600 }}>
                Clotted / Hemolyzed / QNS Redraw Alert
              </div>
            </Card>
          </>
        )}

        {/* PHASE 2: ANALYTICAL CARDS */}
        {(activePhase === 'ALL' || activePhase === 'ANALYTICAL') && (
          <>
            {/* 2.1 Daily Instrument QC (Levey-Jennings) */}
            <Card
              padding="md"
              className="ds-glass-panel ds-interactive"
              style={{
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                border: '1.5px solid rgba(56, 189, 248, 0.35)',
                background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.08) 0%, rgba(15, 23, 42, 0.7) 100%)'
              }}
              onClick={() => setIsQcModalOpen(true)}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.72rem', color: '#7DD3FC', fontWeight: 800, textTransform: 'uppercase' }}>
                  Analytic: Levey-Jennings QC
                </span>
                <span style={{ fontSize: '1.2rem' }}>📊</span>
              </div>
              <div style={{ fontSize: '1.35rem', fontWeight: 800, color: qcApproved ? '#34D399' : '#F59E0B', margin: '8px 0 4px' }}>
                {qcApproved ? 'PASS (Westgard)' : 'QC PENDING'}
              </div>
              <div style={{ fontSize: '0.72rem', color: '#CBD5E1', fontWeight: 600 }}>
                Sysmex XN-1000 &amp; Cobas 6000 Racks
              </div>
            </Card>

            {/* 2.2 In-Analyzer Batch Runs */}
            <Card
              padding="md"
              className="ds-glass-panel ds-interactive"
              style={{
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                border: '1.5px solid rgba(14, 165, 233, 0.35)',
                background: 'linear-gradient(135deg, rgba(14, 165, 233, 0.08) 0%, rgba(15, 23, 42, 0.7) 100%)'
              }}
              onClick={() => {
                setActivePhase('ANALYTICAL');
                setStatusFilter('ANALYZING');
                triggerToast('Filtered: In-analyzer active biochemistry & hematology testing');
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.72rem', color: '#38BDF8', fontWeight: 800, textTransform: 'uppercase' }}>
                  Analytic: In-Analyzer Runs
                </span>
                <span style={{ fontSize: '1.2rem' }}>⚙️</span>
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#38BDF8', margin: '6px 0 2px' }}>
                {orders.filter((o) => o.status === 'PROCESSING').length}
              </div>
              <div style={{ fontSize: '0.72rem', color: '#CBD5E1', fontWeight: 600 }}>
                ASTM/HL7 Real-Time Machine Fetch
              </div>
            </Card>

            {/* 2.3 Delta Check Exceptions */}
            <Card
              padding="md"
              className="ds-glass-panel ds-interactive"
              style={{
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                border: '1.5px solid rgba(168, 85, 247, 0.4)',
                background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.08) 0%, rgba(15, 23, 42, 0.7) 100%)'
              }}
              onClick={() => {
                const deltaOrder = orders.find((o) => (o as any).deltaCheckAlert) || orders[0];
                setActiveDeltaOrder(deltaOrder);
                setIsDeltaModalOpen(true);
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.72rem', color: '#D8B4FE', fontWeight: 800, textTransform: 'uppercase' }}>
                  Analytic: Delta Check Alert
                </span>
                <span style={{ fontSize: '1.2rem' }}>📈</span>
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#C084FC', margin: '6px 0 2px' }}>
                {orders.filter((o) => (o as any).deltaCheckAlert).length}
              </div>
              <div style={{ fontSize: '0.72rem', color: '#E9D5FF', fontWeight: 600 }}>
                Sudden Shift vs History (Creatinine +277%)
              </div>
            </Card>
          </>
        )}

        {/* PHASE 3: POST-ANALYTICAL CARDS */}
        {(activePhase === 'ALL' || activePhase === 'POST_ANALYTICAL') && (
          <>
            {/* 3.1 Critical Value Call Desk (Read-Back Logged) */}
            <Card
              padding="md"
              className="ds-glass-panel ds-interactive"
              style={{
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                border: '1.5px solid rgba(239, 68, 68, 0.5)',
                background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.12) 0%, rgba(15, 23, 42, 0.7) 100%)'
              }}
              onClick={() => {
                const critOrder = orders.find((o) => o.isCritical) || orders[0];
                setActivePanicOrder(critOrder);
                setIsPanicModalOpen(true);
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.72rem', color: '#FCA5A5', fontWeight: 800, textTransform: 'uppercase' }}>
                  Critical Value Call Desk
                </span>
                <span style={{ fontSize: '1.2rem' }}>🚨</span>
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#EF4444', margin: '6px 0 2px' }}>
                {criticalOrders.length}
              </div>
              <div style={{ fontSize: '0.72rem', color: '#FCA5A5', fontWeight: 600 }}>
                Critical Value Call Desk (Read-Back Logged)
              </div>
            </Card>

            {/* 3.2 Pending Pathologist Sign-Off (DSC) */}
            <Card
              padding="md"
              className="ds-glass-panel ds-interactive"
              style={{
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                border: '1.5px solid rgba(139, 92, 246, 0.4)',
                background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.08) 0%, rgba(15, 23, 42, 0.7) 100%)'
              }}
              onClick={() => setIsBatchDscModalOpen(true)}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.72rem', color: '#C4B5FD', fontWeight: 800, textTransform: 'uppercase' }}>
                  Post-Analytic: DSC Sign-Off
                </span>
                <span style={{ fontSize: '1.2rem' }}>✍️</span>
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#A78BFA', margin: '6px 0 2px' }}>
                {orders.filter((o) => o.status === 'RESULT_READY').length}
              </div>
              <div style={{ fontSize: '0.72rem', color: '#C4B5FD', fontWeight: 600 }}>
                Class-3 Digital Signature Token Ready
              </div>
            </Card>

            {/* 3.3 Auto-Dispatched Reports */}
            <Card
              padding="md"
              className="ds-glass-panel ds-interactive"
              style={{
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                border: '1.5px solid rgba(16, 185, 129, 0.35)',
                background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(15, 23, 42, 0.7) 100%)'
              }}
              onClick={() => {
                setActivePhase('POST_ANALYTICAL');
                setStatusFilter('COMPLETED');
                triggerToast('Filtered: Auto-dispatched reports via WhatsApp, SMS, and Portal');
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.72rem', color: '#6EE7B7', fontWeight: 800, textTransform: 'uppercase' }}>
                  Post-Analytic: Dispatched
                </span>
                <span style={{ fontSize: '1.2rem' }}>📱</span>
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#10B981', margin: '6px 0 2px' }}>
                {orders.filter((o) => o.status === 'VERIFIED' || o.status === 'REVIEWED').length}
              </div>
              <div style={{ fontSize: '0.72rem', color: '#A7F3D0', fontWeight: 600 }}>
                WhatsApp, SMS &amp; NABL QR Released
              </div>
            </Card>
          </>
        )}
      </div>

      {/* Main Activity Workstation: Split Layout (Today's Specimen Queue + Recent Activity Feed) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2.2fr) minmax(0, 1fr)', gap: '20px', alignItems: 'start' }}>
        
        {/* Left Column: Today's Specimen & Investigation Queue */}
        <div
          className="ds-glass-panel"
          style={{
            borderRadius: '16px',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            backgroundColor: 'rgba(18, 24, 38, 0.75)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          {/* Table Header & Search Filter Bar */}
          <div
            style={{
              padding: '16px 20px',
              borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '12px'
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--ds-color-text-primary)' }}>
                  Today's Specimen & Investigation Queue
                </span>
                <Badge variant="neutral">{filteredOrders.length} items</Badge>
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-muted)', marginTop: '2px' }}>
                Live laboratory intake, barcode tracking, and testing status
              </div>
            </div>

            {/* Filter Pills */}
            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
              {(['ALL', 'PENDING', 'ANALYZING', 'CRITICAL', 'READY', 'COMPLETED'] as const).map((filterKey) => (
                <button
                  key={filterKey}
                  type="button"
                  onClick={() => setStatusFilter(filterKey)}
                  style={{
                    backgroundColor: statusFilter === filterKey ? 'rgba(168, 85, 247, 0.25)' : 'rgba(255, 255, 255, 0.04)',
                    border: statusFilter === filterKey ? '1px solid #A855F7' : '1px solid rgba(255, 255, 255, 0.08)',
                    color: statusFilter === filterKey ? '#D8B4FE' : '#94A3B8',
                    borderRadius: '6px',
                    padding: '4px 8px',
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.12s ease'
                  }}
                >
                  {filterKey}
                </button>
              ))}
            </div>
          </div>

          {/* Search Box */}
          <div style={{ padding: '10px 20px', borderBottom: '1px solid rgba(255, 255, 255, 0.06)', backgroundColor: 'rgba(255, 255, 255, 0.015)' }}>
            <div style={{ position: 'relative', width: '100%' }}>
              <span style={{ position: 'absolute', left: '10px', top: '8px', fontSize: '0.8rem', color: '#64748B' }}>🔍</span>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search patient, accession number, barcode or specimen type..."
                style={{
                  width: '100%',
                  backgroundColor: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '8px',
                  padding: '7px 10px 7px 32px',
                  color: '#F8FAFC',
                  fontSize: '0.8rem',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>
          </div>

          {/* Table Body */}
          <TableContainer style={{ maxHeight: '440px', overflowY: 'auto' }}>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead style={{ fontSize: '0.72rem', color: '#94A3B8' }}>ACCESSION # / BARCODE</TableHead>
                  <TableHead style={{ fontSize: '0.72rem', color: '#94A3B8' }}>PATIENT &amp; MRN</TableHead>
                  <TableHead style={{ fontSize: '0.72rem', color: '#94A3B8' }}>TEST PARAMETER &amp; RESULT</TableHead>
                  <TableHead style={{ fontSize: '0.72rem', color: '#94A3B8' }}>PHASE &amp; STATUS</TableHead>
                  <TableHead style={{ fontSize: '0.72rem', color: '#94A3B8', textAlign: 'right' }}>CLINICAL ACTION</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} style={{ textAlign: 'center', padding: '32px', color: '#94A3B8' }}>
                      Loading live pathology telemetry...
                    </TableCell>
                  </TableRow>
                ) : filteredOrders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} style={{ textAlign: 'center', padding: '32px', color: '#64748B' }}>
                      No diagnostic orders matching the selected filter.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredOrders.map((order) => {
                    const isCrit = order.isCritical;
                    const deltaAlert = (order as any).deltaCheckAlert;
                    const rejDetails = (order as any).rejectionReasonDetails;
                    const autoDispatched = (order as any).autoDispatchedChannels;
                    const statusColor =
                      order.status === 'VERIFIED' || order.status === 'REVIEWED'
                        ? 'success'
                        : order.status === 'RESULT_READY'
                        ? 'primary'
                        : isCrit
                        ? 'critical'
                        : order.status === 'PROCESSING'
                        ? 'info'
                        : 'warning';

                    const phaseName =
                      (order as any).labPhase === 'PRE_ANALYTICAL' || order.status === 'SAMPLE_REQUIRED' || order.status === 'ORDERED' || order.status === 'CANCELLED'
                        ? 'Phase 1: Pre-Analytical'
                        : (order as any).labPhase === 'ANALYTICAL' || order.status === 'PROCESSING'
                        ? 'Phase 2: Analytical'
                        : 'Phase 3: Post-Analytical';

                    const phaseBadgeVariant =
                      phaseName === 'Phase 1: Pre-Analytical' ? 'warning' : phaseName === 'Phase 2: Analytical' ? 'info' : 'success';

                    return (
                      <TableRow
                        key={order.id}
                        style={{
                          backgroundColor: isCrit
                            ? 'rgba(239, 68, 68, 0.08)'
                            : deltaAlert
                            ? 'rgba(168, 85, 247, 0.08)'
                            : rejDetails
                            ? 'rgba(239, 68, 68, 0.05)'
                            : undefined,
                          transition: 'background-color 0.12s ease'
                        }}
                      >
                        <TableCell>
                          <div style={{ fontFamily: 'monospace', fontWeight: 700, color: '#38BDF8', fontSize: '0.78rem' }}>
                            {order.specimens?.[0]?.accessionNumber || order.orderNumber}
                          </div>
                          <div style={{ fontSize: '0.68rem', color: '#64748B' }}>
                            {new Date(order.orderedAt || order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                          {(order as any).analyzerMachine && (
                            <div style={{ fontSize: '0.65rem', color: '#38BDF8', marginTop: '2px' }}>
                              {(order as any).analyzerMachine}
                            </div>
                          )}
                        </TableCell>

                        <TableCell>
                          <div style={{ fontWeight: 700, color: '#F1F5F9', fontSize: '0.8rem' }}>
                            {order.patientName || 'Anonymous Walk-In'}
                          </div>
                          <div style={{ fontSize: '0.68rem', color: '#94A3B8' }}>
                            MRN: {order.patientMrn || 'N/A'}
                          </div>
                          <div style={{ fontSize: '0.65rem', color: '#64748B' }}>
                            {order.orderingDoctorName || 'OPD Doctor'}
                          </div>
                        </TableCell>

                        <TableCell>
                          <div style={{ fontWeight: 700, color: '#E2E8F0', fontSize: '0.78rem' }}>
                            {(order as any).testParameter || order.specimenType || 'Venous Blood'}
                          </div>
                          {(order as any).observedResult && (
                            <div
                              style={{
                                fontSize: '0.72rem',
                                color: isCrit ? '#EF4444' : deltaAlert ? '#C084FC' : rejDetails ? '#F87171' : '#34D399',
                                fontWeight: 700,
                                marginTop: '2px'
                              }}
                            >
                              {(order as any).observedResult}
                            </div>
                          )}
                          <div style={{ fontSize: '0.65rem', color: '#94A3B8', marginTop: '2px' }}>
                            {order.specimenType || 'Whole Blood'} • {order.priority === 'STAT' ? '⚡ STAT / URGENT' : 'Routine'}
                          </div>
                        </TableCell>

                        <TableCell>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-start' }}>
                            <Badge variant={phaseBadgeVariant as any} style={{ fontSize: '0.65rem' }}>
                              {phaseName}
                            </Badge>
                            <Badge variant={statusColor as any} style={{ fontSize: '0.68rem' }}>
                              {isCrit
                                ? '🚨 CRITICAL (CALL DESK)'
                                : deltaAlert
                                ? '📈 DELTA ALERT'
                                : rejDetails
                                ? '🚫 REJECTED'
                                : order.status.replace(/_/g, ' ')}
                            </Badge>
                          </div>
                        </TableCell>

                        <TableCell style={{ textAlign: 'right' }}>
                          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px', flexWrap: 'wrap' }}>
                            {/* Critical Read-Back Modal Trigger */}
                            {isCrit && (
                              <Button
                                size="sm"
                                onClick={() => {
                                  setActivePanicOrder(order);
                                  setIsPanicModalOpen(true);
                                }}
                                style={{
                                  fontSize: '0.68rem',
                                  padding: '3px 8px',
                                  backgroundColor: '#DC2626',
                                  color: '#FFF',
                                  border: 'none',
                                  fontWeight: 800
                                }}
                                title="Critical Value Call Desk (Read-Back Logged per NABL ISO-15189 clause 5.8.2)"
                              >
                                📞 Critical Call Desk
                              </Button>
                            )}

                            {/* Delta-Check Modal Trigger */}
                            {deltaAlert && (
                              <Button
                                size="sm"
                                onClick={() => {
                                  setActiveDeltaOrder(order);
                                  setIsDeltaModalOpen(true);
                                }}
                                style={{
                                  fontSize: '0.68rem',
                                  padding: '3px 8px',
                                  backgroundColor: 'rgba(168, 85, 247, 0.25)',
                                  color: '#E9D5FF',
                                  border: '1px solid #A855F7',
                                  fontWeight: 700
                                }}
                                title="Inspect sudden abnormal shift vs patient baseline"
                              >
                                📈 Delta Check
                              </Button>
                            )}

                            {/* Rejection Modal Trigger */}
                            {(rejDetails || order.status === 'CANCELLED') && (
                              <Button
                                size="sm"
                                onClick={() => {
                                  setActiveRejectOrder(order);
                                  setIsRejectModalOpen(true);
                                }}
                                style={{
                                  fontSize: '0.68rem',
                                  padding: '3px 8px',
                                  backgroundColor: 'rgba(239, 68, 68, 0.2)',
                                  color: '#FCA5A5',
                                  border: '1px solid #EF4444',
                                  fontWeight: 700
                                }}
                                title="View Pre-Analytical Specimen Rejection and Redraw Log"
                              >
                                🚫 Rejection Log
                              </Button>
                            )}

                            {/* Batch DSC Sign-Off Trigger */}
                            {order.status === 'RESULT_READY' && (
                              <Button
                                size="sm"
                                onClick={() => {
                                  setIsBatchDscModalOpen(true);
                                }}
                                style={{
                                  fontSize: '0.68rem',
                                  padding: '3px 8px',
                                  backgroundColor: '#7C3AED',
                                  color: '#FFF',
                                  border: 'none',
                                  fontWeight: 700
                                }}
                                title="Apply Class-3 DSC Digital Token and release verified report"
                              >
                                ✍️ Sign DSC
                              </Button>
                            )}

                            {/* Auto-Dispatched Alert */}
                            {autoDispatched && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  triggerToast(`📱 Report auto-dispatched to ${autoDispatched.join(', ')} with NABL QR verification`);
                                }}
                                style={{
                                  fontSize: '0.68rem',
                                  padding: '3px 8px',
                                  borderColor: 'rgba(16, 185, 129, 0.5)',
                                  color: '#6EE7B7'
                                }}
                                title="Auto-dispatched via WhatsApp, SMS, and Patient Portal"
                              >
                                📱 Dispatched
                              </Button>
                            )}


                            {activeRolePerspective === 'TECHNICIAN' && (order.status === 'ORDERED' || order.status === 'SAMPLE_COLLECTED') && (
                              <Button
                                size="sm"
                                onClick={() => {
                                  triggerToast(`⚙️ Accession ${order.specimens?.[0]?.accessionNumber || order.orderNumber} loaded onto analyzer rack`);
                                }}
                                style={{
                                  fontSize: '0.68rem',
                                  padding: '3px 7px',
                                  backgroundColor: '#0284C7',
                                  color: '#FFF',
                                  border: 'none',
                                  fontWeight: 700
                                }}
                              >
                                ⚙️ Load Rack
                              </Button>
                            )}

                            {activeRolePerspective === 'PHLEBOTOMIST' && (order.status === 'SAMPLE_REQUIRED' || order.status === 'ORDERED') && (
                              <Button
                                size="sm"
                                onClick={() => {
                                  triggerToast(`🩸 Sample collected for ${order.patientName || 'Patient'} (${order.specimenType || 'Venous Blood'})`);
                                  void loadLabData();
                                }}
                                style={{
                                  fontSize: '0.68rem',
                                  padding: '3px 7px',
                                  backgroundColor: '#D97706',
                                  color: '#FFF',
                                  border: 'none',
                                  fontWeight: 700
                                }}
                              >
                                🩸 Draw Blood
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </div>

        {/* Right Column: Recent Activity Feed & Analyzer Hardware Status */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {/* Recent Lab Activities Feed */}
          <div
            className="ds-glass-panel"
            style={{
              borderRadius: '16px',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              backgroundColor: 'rgba(18, 24, 38, 0.75)',
              padding: '16px 18px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--ds-color-text-primary)' }}>
                  Recent Lab Activities
                </span>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#10B981' }} />
              </div>
              <span style={{ fontSize: '0.7rem', color: 'var(--ds-color-text-muted)' }}>Live Audit Trace</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '280px', overflowY: 'auto' }}>
              {auditTraces.length > 0 ? (
                auditTraces.slice(0, 6).map((trace) => (
                  <div
                    key={trace.id}
                    style={{
                      backgroundColor: 'var(--ds-color-surface-subtle, rgba(255, 255, 255, 0.03))',
                      border: '1px solid var(--ds-color-border-subtle, rgba(255, 255, 255, 0.06))',
                      borderRadius: '8px',
                      padding: '8px 10px',
                      fontSize: '0.75rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '3px'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 700, color: '#38BDF8' }}>{trace.action.replace(/_/g, ' ')}</span>
                      <span style={{ color: 'var(--ds-color-text-muted)', fontSize: '0.68rem' }}>
                        {new Date(trace.occurredAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div style={{ color: 'var(--ds-color-text-secondary)', fontSize: '0.72rem' }}>
                      {trace.justification || `Action performed on ${trace.targetEntity} (${trace.targetEntityId})`}
                    </div>
                    <div style={{ fontSize: '0.65rem', color: 'var(--ds-color-text-muted)' }}>
                      Actor: {trace.actorRole}
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ padding: '16px', textAlign: 'center', color: 'var(--ds-color-text-muted)', fontSize: '0.75rem' }}>
                  No recent activity records found in this audit window.
                </div>
              )}
            </div>
          </div>

          {/* Analyzer Hardware Interface Status */}
          <div
            className="ds-glass-panel"
            style={{
              borderRadius: '16px',
              border: '1px solid var(--ds-color-border-subtle, rgba(255, 255, 255, 0.08))',
              backgroundColor: 'var(--ds-color-surface, rgba(18, 24, 38, 0.75))',
              padding: '16px 18px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--ds-color-text-primary)' }}>
                Diagnostic Analyzers & Gateways
              </span>
              <Badge variant="neutral" style={{ fontSize: '0.65rem' }}>ASTM / HL7</Badge>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {[
                { name: 'Sysmex XN-550', type: 'Hematology Cell Counter', status: 'ONLINE', latency: '4ms' },
                { name: 'Roche Cobas c311', type: 'Clinical Chemistry', status: 'ONLINE', latency: '12ms' },
                { name: 'Digital Pathology / WSI Lens', type: 'Blood Smear Morphology (WSI)', status: 'STANDBY', latency: 'Local' }
              ].map((hw) => (
                <div
                  key={hw.name}
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.025)',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                    borderRadius: '8px',
                    padding: '8px 10px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700, color: '#F1F5F9', fontSize: '0.75rem' }}>{hw.name}</div>
                    <div style={{ fontSize: '0.68rem', color: '#94A3B8' }}>{hw.type}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '0.65rem', color: hw.status === 'ONLINE' ? '#34D399' : '#A855F7', fontWeight: 700 }}>
                      ● {hw.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ fontSize: '0.68rem', color: '#64748B', lineHeight: '1.4' }}>
              Hardware interface engine handles direct TCP/RS232 bidirectional query-broadcast with auto-accession matching.
            </div>
          </div>

        </div>
      </div>
        </>
      )}

      {/* Microscope AI Eyepiece Scanner Modal */}
      {isMicroscopeModalOpen && (
        <MicroscopeEyepieceScannerModal
          isOpen={isMicroscopeModalOpen}
          onClose={() => setIsMicroscopeModalOpen(false)}
          onCommitSmearResults={handleCommitMicroscopeReport}
          patientName="Walk-in Hematology Specimen"
          patientMrn="MRN-SMEAR-01"
          orderNumber="ORD-AI-9021"
        />
      )}

      {/* 1. NABL ISO-15189 Clause 5.8.2 Mandatory Telephone Read-Back Modal */}
      {isPanicModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 10005,
            backgroundColor: 'rgba(0, 0, 0, 0.78)',
            backdropFilter: 'blur(10px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px'
          }}
        >
          <div
            className="ds-glass-panel"
            style={{
              width: '100%',
              maxWidth: '560px',
              backgroundColor: '#0F172A',
              border: '2px solid #EF4444',
              borderRadius: '18px',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              boxShadow: '0 20px 60px rgba(239, 68, 68, 0.35)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '2rem' }}>🚨</span>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#FCA5A5' }}>
                    CRITICAL VALUE CALL DESK (READ-BACK LOGGED)
                  </h3>
                  <div style={{ fontSize: '0.72rem', color: '#94A3B8', marginTop: '2px' }}>
                    NABL ISO-15189 Clause 5.8.2 • Direct Clinician Verbal Notification
                  </div>
                </div>
              </div>
              <Badge variant="critical">CRITICAL VALUE CALL DESK</Badge>
            </div>

            <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '12px', padding: '12px 16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontSize: '0.75rem', color: '#CBD5E1' }}>Patient:</span>
                <strong style={{ fontSize: '0.82rem', color: '#F8FAFC' }}>
                  {activePanicOrder?.patientName || 'Rajesh V. Verma'} ({activePanicOrder?.patientMrn || 'MRN-90214'})
                </strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontSize: '0.75rem', color: '#CBD5E1' }}>Investigation:</span>
                <span style={{ fontSize: '0.82rem', color: '#E2E8F0', fontWeight: 700 }}>
                  {activePanicOrder?.testParameter || 'Serum Potassium (Critical)'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(239, 68, 68, 0.25)', paddingTop: '6px', marginTop: '6px' }}>
                <span style={{ fontSize: '0.78rem', color: '#FCA5A5', fontWeight: 800 }}>OBSERVED PANIC RESULT:</span>
                <span style={{ fontSize: '1.15rem', color: '#EF4444', fontWeight: 900 }}>
                  {activePanicOrder?.observedResult || '6.8 mEq/L (Critical Limit > 6.2)'}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#CBD5E1', display: 'block', marginBottom: '4px' }}>
                  Reporting Laboratory Officer (Caller):
                </label>
                <input
                  type="text"
                  value={panicCallerName}
                  onChange={(e) => setPanicCallerName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    backgroundColor: '#1E293B',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    color: '#F8FAFC',
                    fontSize: '0.82rem',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#CBD5E1', display: 'block', marginBottom: '4px' }}>
                  Receiving Clinician / Doctor:
                </label>
                <input
                  type="text"
                  value={panicReceiverName}
                  onChange={(e) => setPanicReceiverName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    backgroundColor: '#1E293B',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    color: '#F8FAFC',
                    fontSize: '0.82rem',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', marginTop: '6px', backgroundColor: 'rgba(255, 255, 255, 0.03)', padding: '10px', borderRadius: '8px' }}>
                <input
                  type="checkbox"
                  id="panic-readback-check"
                  checked={panicReadbackConfirmed}
                  onChange={(e) => setPanicReadbackConfirmed(e.target.checked)}
                  style={{ marginTop: '3px', cursor: 'pointer' }}
                />
                <label htmlFor="panic-readback-check" style={{ fontSize: '0.75rem', color: '#E2E8F0', cursor: 'pointer', lineHeight: '1.4' }}>
                  <strong>Mandatory Verbal Read-Back Confirmed:</strong> The ordering clinician verbally repeated back the patient's full name, MRN, and exact critical panic value word-for-word per NABL ISO-15189 clause 5.8.2.
                </label>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '14px' }}>
              <Button variant="outline" size="sm" onClick={() => setIsPanicModalOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                disabled={!panicReadbackConfirmed}
                onClick={() => {
                  setIsPanicModalOpen(false);
                  triggerToast(`✅ Verbal Read-Back Logged & Sealed per NABL ISO-15189 clause 5.8.2 for Dr. ${panicReceiverName}`);
                }}
                style={{ backgroundColor: '#DC2626', color: '#FFF', fontWeight: 800 }}
              >
                ✓ Seal &amp; Certify Read-Back in LIMS
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Pre-Analytical Specimen Rejection & Redraw Modal */}
      {isRejectModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 10005,
            backgroundColor: 'rgba(0, 0, 0, 0.78)',
            backdropFilter: 'blur(10px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px'
          }}
        >
          <div
            className="ds-glass-panel"
            style={{
              width: '100%',
              maxWidth: '560px',
              backgroundColor: '#0F172A',
              border: '2px solid #F59E0B',
              borderRadius: '18px',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              boxShadow: '0 20px 60px rgba(245, 158, 11, 0.35)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '2rem' }}>🚫</span>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#FCD34D' }}>
                    PRE-ANALYTICAL SPECIMEN REJECTION
                  </h3>
                  <div style={{ fontSize: '0.72rem', color: '#94A3B8', marginTop: '2px' }}>
                    CLSI GP44-A4 / ISO-15189 Specimen Quality Integrity Policy
                  </div>
                </div>
              </div>
              <Badge variant="warning">REDRAW ALERT</Badge>
            </div>

            <div style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.3)', borderRadius: '12px', padding: '12px 16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontSize: '0.75rem', color: '#CBD5E1' }}>Accession #:</span>
                <strong style={{ fontSize: '0.82rem', color: '#38BDF8', fontFamily: 'monospace' }}>
                  {activeRejectOrder?.specimens?.[0]?.accessionNumber || activeRejectOrder?.orderNumber || 'LAB-2026-90403'}
                </strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontSize: '0.75rem', color: '#CBD5E1' }}>Patient:</span>
                <strong style={{ fontSize: '0.82rem', color: '#F8FAFC' }}>
                  {activeRejectOrder?.patientName || 'Suman K. Sengupta'} ({activeRejectOrder?.patientMrn || 'MRN-88301'})
                </strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.75rem', color: '#CBD5E1' }}>Specimen Tube:</span>
                <span style={{ fontSize: '0.82rem', color: '#FCD34D', fontWeight: 600 }}>
                  {activeRejectOrder?.specimenType || 'Citrate Plasma (Light Blue)'}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#CBD5E1', display: 'block', marginBottom: '4px' }}>
                  Clinical Rejection Criterion:
                </label>
                <select
                  value={rejectionReasonSelect}
                  onChange={(e) => setRejectionReasonSelect(e.target.value as any)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    backgroundColor: '#1E293B',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    color: '#F8FAFC',
                    fontSize: '0.82rem',
                    boxSizing: 'border-box'
                  }}
                >
                  <option value="MICROCLOT_IN_EDTA">Gross Microclots in Tube (Invalidates Platelets &amp; Coagulation)</option>
                  <option value="HEMOLYSIS_3PLUS">In-Vitro Hemolysis (+++) (Invalidates Potassium, LDH, AST)</option>
                  <option value="QNS_QUANTITY_NOT_SUFFICIENT">Quantity Not Sufficient (QNS) for automated rack run</option>
                  <option value="LIPEMIC_TURBIDITY">Severe Lipemia / Turbidity interfering with photometric assay</option>
                  <option value="INCORRECT_VACUTAINER">Incorrect tube type / expired anticoagulant ratio</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#CBD5E1', display: 'block', marginBottom: '4px' }}>
                  Technologist Clinical Observations:
                </label>
                <textarea
                  rows={2}
                  value={rejectionNotes}
                  onChange={(e) => setRejectionNotes(e.target.value)}
                  placeholder="e.g. Fibrin microthreads visualized on wooden applicator stick check; tube rejected prior to analyzer aspiration."
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    backgroundColor: '#1E293B',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    color: '#F8FAFC',
                    fontSize: '0.8rem',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                <input
                  type="checkbox"
                  id="reject-redraw-check"
                  checked={rejectionRedrawRequired}
                  onChange={(e) => setRejectionRedrawRequired(e.target.checked)}
                  style={{ cursor: 'pointer' }}
                />
                <label htmlFor="reject-redraw-check" style={{ fontSize: '0.75rem', color: '#FCD34D', cursor: 'pointer', fontWeight: 700 }}>
                  ⚡ Trigger Immediate Urgent Phlebotomy Redraw Alert to OPD Chamber / In-Patient Ward
                </label>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '14px' }}>
              <Button variant="outline" size="sm" onClick={() => setIsRejectModalOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  setIsRejectModalOpen(false);
                  triggerToast(`🚫 Specimen rejected (${rejectionReasonSelect}). Redraw notification dispatched.`);
                }}
                style={{ backgroundColor: '#D97706', color: '#FFF', fontWeight: 800 }}
              >
                🚫 Confirm Specimen Rejection &amp; Alert Phlebotomy
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Daily Instrument QC (Levey-Jennings) Modal */}
      {isQcModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 10005,
            backgroundColor: 'rgba(0, 0, 0, 0.78)',
            backdropFilter: 'blur(10px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px'
          }}
        >
          <div
            className="ds-glass-panel"
            style={{
              width: '100%',
              maxWidth: '640px',
              backgroundColor: '#0F172A',
              border: '2px solid #38BDF8',
              borderRadius: '18px',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              boxShadow: '0 20px 60px rgba(56, 189, 248, 0.35)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '2rem' }}>📊</span>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#7DD3FC' }}>
                    DAILY INSTRUMENT QUALITY CONTROL (IQC)
                  </h3>
                  <div style={{ fontSize: '0.72rem', color: '#94A3B8', marginTop: '2px' }}>
                    Levey-Jennings Control Chart • CLSI C24-A3 / Westgard Multi-Rule Evaluation
                  </div>
                </div>
              </div>
              <Badge variant="info">Sysmex XN-1000 &amp; Cobas 6000</Badge>
            </div>

            {/* Levey-Jennings SVG Control Chart */}
            <div style={{ backgroundColor: '#020617', border: '1px solid #1E293B', borderRadius: '12px', padding: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.72rem', color: '#94A3B8' }}>
                <span>Control Lot #CX-4091 (Target Mean: 13.0 g/dL, SD: 0.40)</span>
                <span style={{ color: '#34D399', fontWeight: 700 }}>Run: PASS (+1.25 SD)</span>
              </div>
              <svg viewBox="0 0 500 140" style={{ width: '100%', height: '140px', display: 'block' }}>
                {/* Horizontal SD reference lines */}
                <line x1="40" y1="20" x2="480" y2="20" stroke="#EF4444" strokeDasharray="3 3" strokeWidth="1" />
                <text x="5" y="24" fill="#EF4444" fontSize="9" fontWeight="700">+3 SD</text>

                <line x1="40" y1="45" x2="480" y2="45" stroke="#F59E0B" strokeDasharray="3 3" strokeWidth="1" />
                <text x="5" y="49" fill="#F59E0B" fontSize="9" fontWeight="700">+2 SD</text>

                <line x1="40" y1="70" x2="480" y2="70" stroke="#10B981" strokeWidth="1.5" />
                <text x="5" y="74" fill="#10B981" fontSize="9" fontWeight="800">MEAN</text>

                <line x1="40" y1="95" x2="480" y2="95" stroke="#F59E0B" strokeDasharray="3 3" strokeWidth="1" />
                <text x="5" y="99" fill="#F59E0B" fontSize="9" fontWeight="700">-2 SD</text>

                <line x1="40" y1="120" x2="480" y2="120" stroke="#EF4444" strokeDasharray="3 3" strokeWidth="1" />
                <text x="5" y="124" fill="#EF4444" fontSize="9" fontWeight="700">-3 SD</text>

                {/* Plotted QC points connected by polyline */}
                <polyline
                  fill="none"
                  stroke="#38BDF8"
                  strokeWidth="2"
                  points="50,72 80,68 110,65 140,75 170,62 200,69 230,73 260,60 290,66 320,70 350,58 380,64 410,55 440,62 470,54"
                />
                {/* Plotted QC dots */}
                {[
                  [50, 72], [80, 68], [110, 65], [140, 75], [170, 62],
                  [200, 69], [230, 73], [260, 60], [290, 66], [320, 70],
                  [350, 58], [380, 64], [410, 55], [440, 62], [470, 54]
                ].map(([cx, cy], i) => (
                  <circle key={i} cx={cx} cy={cy} r={i === 14 ? '4.5' : '3'} fill={i === 14 ? '#34D399' : '#38BDF8'} stroke="#0F172A" strokeWidth="1.5" />
                ))}
              </svg>
            </div>

            {/* Westgard Rules Compliance Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
              {[
                { rule: '1-2s (Warning)', status: 'PASS', desc: 'Single run < 2 SD' },
                { rule: '1-3s (Random)', status: 'PASS', desc: 'No point > 3 SD' },
                { rule: '2-2s (Systematic)', status: 'PASS', desc: 'No run 2x > 2 SD' },
                { rule: 'R-4s (Range)', status: 'PASS', desc: 'Range within limits' }
              ].map((wg) => (
                <div key={wg.rule} style={{ backgroundColor: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.25)', borderRadius: '8px', padding: '8px', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.68rem', fontWeight: 800, color: '#6EE7B7' }}>{wg.rule}</div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 900, color: '#34D399', margin: '2px 0' }}>✅ {wg.status}</div>
                  <div style={{ fontSize: '0.62rem', color: '#94A3B8' }}>{wg.desc}</div>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '14px' }}>
              <Button variant="outline" size="sm" onClick={() => setIsQcModalOpen(false)}>
                Close
              </Button>
              <Button
                variant="success"
                size="sm"
                onClick={() => {
                  setQcApproved(true);
                  setIsQcModalOpen(false);
                  triggerToast('✅ Daily QC Calibration Certified: Instrument runs approved for next 24 hours.');
                }}
                style={{ backgroundColor: '#059669', color: '#FFF', fontWeight: 800 }}
              >
                ✅ Approve Morning QC Calibration (Valid 24h)
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 4. Delta Check Discrepancy Exception Modal */}
      {isDeltaModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 10005,
            backgroundColor: 'rgba(0, 0, 0, 0.78)',
            backdropFilter: 'blur(10px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px'
          }}
        >
          <div
            className="ds-glass-panel"
            style={{
              width: '100%',
              maxWidth: '580px',
              backgroundColor: '#0F172A',
              border: '2px solid #A855F7',
              borderRadius: '18px',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              boxShadow: '0 20px 60px rgba(168, 85, 247, 0.35)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '2rem' }}>📈</span>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#D8B4FE' }}>
                    DELTA CHECK EXCEPTION REVIEW
                  </h3>
                  <div style={{ fontSize: '0.72rem', color: '#94A3B8', marginTop: '2px' }}>
                    Reflexive Historical Variance • ISO-15189 Quality Control
                  </div>
                </div>
              </div>
              <Badge variant="primary">+277% SURGE</Badge>
            </div>

            <div style={{ backgroundColor: 'rgba(168, 85, 247, 0.1)', border: '1px solid rgba(168, 85, 247, 0.3)', borderRadius: '12px', padding: '14px 16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.75rem', color: '#CBD5E1' }}>Patient:</span>
                <strong style={{ fontSize: '0.85rem', color: '#F8FAFC' }}>
                  {activeDeltaOrder?.patientName || 'Harish Chandra Roy'} ({activeDeltaOrder?.patientMrn || 'MRN-90215'})
                </strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.75rem', color: '#CBD5E1' }}>Parameter:</span>
                <span style={{ fontSize: '0.82rem', color: '#E9D5FF', fontWeight: 700 }}>
                  {activeDeltaOrder?.testParameter || 'Serum Creatinine (Kinetic Jaffe)'}
                </span>
              </div>

              {/* Side-by-Side Comparison */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '10px', borderTop: '1px solid rgba(168, 85, 247, 0.25)', paddingTop: '10px' }}>
                <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.03)', padding: '10px', borderRadius: '8px' }}>
                  <div style={{ fontSize: '0.68rem', color: '#94A3B8' }}>Previous (24h ago):</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#34D399' }}>0.90 mg/dL</div>
                  <div style={{ fontSize: '0.65rem', color: '#CBD5E1' }}>Normal baseline</div>
                </div>
                <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.15)', padding: '10px', borderRadius: '8px' }}>
                  <div style={{ fontSize: '0.68rem', color: '#FCA5A5' }}>Current Run (Today):</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#EF4444' }}>3.40 mg/dL</div>
                  <div style={{ fontSize: '0.65rem', color: '#FCA5A5', fontWeight: 700 }}>+277.8% shift (Limit &gt;50%)</div>
                </div>
              </div>
            </div>

            <div style={{ backgroundColor: 'rgba(56, 189, 248, 0.08)', border: '1px solid rgba(56, 189, 248, 0.25)', borderRadius: '10px', padding: '10px 14px', fontSize: '0.75rem', color: '#CBD5E1', lineHeight: '1.4' }}>
              💡 <strong>Pathologist Clinical Correlation:</strong> Roche Cobas c311 duplicate rerun confirmed 3.39 mg/dL. Inpatient nephrology charts verify Acute Kidney Injury (AKI) post major cardiovascular surgery. Result is genuine pathology, not pre-analytical error.
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '14px' }}>
              <Button variant="outline" size="sm" onClick={() => setIsDeltaModalOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  setIsDeltaModalOpen(false);
                  triggerToast('📈 Delta Check verified and medically certified as Acute Kidney Injury (AKI). Released.');
                }}
                style={{ backgroundColor: '#7C3AED', color: '#FFF', fontWeight: 800 }}
              >
                ✓ Verify AKI Pathology &amp; Release
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 5. Class-3 PKI Digital Signature (DSC) & Auto-Dispatch Modal */}
      {isBatchDscModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 10005,
            backgroundColor: 'rgba(0, 0, 0, 0.78)',
            backdropFilter: 'blur(10px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px'
          }}
        >
          <div
            className="ds-glass-panel"
            style={{
              width: '100%',
              maxWidth: '580px',
              backgroundColor: '#0F172A',
              border: '2px solid #8B5CF6',
              borderRadius: '18px',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              boxShadow: '0 20px 60px rgba(139, 92, 246, 0.35)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '2rem' }}>✍️</span>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#C4B5FD' }}>
                    CLASS-3 PKI DIGITAL SIGNATURE &amp; DISPATCH
                  </h3>
                  <div style={{ fontSize: '0.72rem', color: '#94A3B8', marginTop: '2px' }}>
                    NABL Accredited Signatory • IT Act 2000 Section 3 Cryptographic Token
                  </div>
                </div>
              </div>
              <Badge variant="primary">eMudhra DSC</Badge>
            </div>

            <div style={{ backgroundColor: 'rgba(139, 92, 246, 0.1)', border: '1px solid rgba(139, 92, 246, 0.3)', borderRadius: '12px', padding: '14px 16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontSize: '0.75rem', color: '#CBD5E1' }}>Digital Signatory:</span>
                <strong style={{ fontSize: '0.85rem', color: '#F8FAFC' }}>
                  Dr. Shahab (MD Pathology, DCP)
                </strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontSize: '0.75rem', color: '#CBD5E1' }}>MCI Medical Reg #:</span>
                <span style={{ fontSize: '0.8rem', color: '#C4B5FD', fontFamily: 'monospace', fontWeight: 700 }}>
                  MCI-2019-48201
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.75rem', color: '#CBD5E1' }}>Certificate Hash:</span>
                <span style={{ fontSize: '0.72rem', color: '#94A3B8', fontFamily: 'monospace' }}>
                  SHA256: 8f2a...91b4 (FIPS 140-2 Level 3)
                </span>
              </div>
            </div>

            <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.03)', borderRadius: '10px', padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#E2E8F0' }}>
                Multi-Channel Automated Dispatch Protocol:
              </div>
              {[
                '📱 WhatsApp Instant PDF Delivery with NABL Dynamic Verification QR',
                '💬 SMS Automated Notification with 128-bit Encrypted Download Link',
                '🩺 Doctor OPD Cockpit EMR Direct Electronic Transmission',
                '🗄️ Patient Portal Health Locker Cloud Sync'
              ].map((channel, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem', color: '#34D399' }}>
                  <span>✓</span>
                  <span>{channel}</span>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '14px' }}>
              <Button variant="outline" size="sm" onClick={() => setIsBatchDscModalOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  setIsBatchDscModalOpen(false);
                  triggerToast('✍️ Batch DSC applied! Reports cryptographically signed and dispatched via WhatsApp, SMS, and Portal with NABL QR.');
                  void loadLabData();
                }}
                style={{ backgroundColor: '#7C3AED', color: '#FFF', fontWeight: 800 }}
              >
                ✍️ Apply DSC Token &amp; Dispatch All
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
