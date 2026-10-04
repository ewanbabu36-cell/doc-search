import React, { useState, useEffect, useCallback, useMemo } from 'react';
import type {
  InvestigationOverviewDto,
  InvestigationCatalogDto,
  InvestigationPanelDto,
  InvestigationOrderDto,
  InvestigationAuditTraceDto,
  PanelContextDto,
  OperationalPartnerDto,
  OperationalOrganizationDto,
  OperationalFacilityDto,
  CreateInvestigationOrderRequest,
  CreateInvestigationPanelRequest,
  CollectSpecimenRequest,
  RejectSpecimenRequest,
  EnterInvestigationResultRequest,
  VerifyInvestigationResultRequest,
  FinalizeInvestigationReportRequest,
  ReviewInvestigationResultRequest,
  AmendInvestigationResultRequest,
  CancelInvestigationOrderRequest
} from '@docsearch/api-contracts';
import { clinicalInvestigationService } from '../services/clinical-investigation-service.js';
import { partnerFoundationService } from '../services/partner-foundation-service.js';
import { hospitalEventBus, type ActivePatientSummary, type HospitalEventPayload } from '../services/hospital-event-bus.js';

import { PanelContextSwitcher } from './common/PanelContextSwitcher.js';
import type { MicroscopeSmearReport } from './dialogs/MicroscopeEyepieceScannerModal.js';

// Lazy-loaded Views for granular chunk streaming
const InvestigationOverviewView = React.lazy(() => import('./views/InvestigationOverviewView.js').then(m => ({ default: m.InvestigationOverviewView })));
const InvestigationCatalogView = React.lazy(() => import('./views/InvestigationCatalogView.js').then(m => ({ default: m.InvestigationCatalogView })));
const InvestigationOrderDirectoryView = React.lazy(() => import('./views/InvestigationOrderDirectoryView.js').then(m => ({ default: m.InvestigationOrderDirectoryView })));
const SpecimenCollectionView = React.lazy(() => import('./views/SpecimenCollectionView.js').then(m => ({ default: m.SpecimenCollectionView })));
const InvestigationProcessingView = React.lazy(() => import('./views/InvestigationProcessingView.js').then(m => ({ default: m.InvestigationProcessingView })));
const InvestigationResultView = React.lazy(() => import('./views/InvestigationResultView.js').then(m => ({ default: m.InvestigationResultView })));
const InvestigationReportView = React.lazy(() => import('./views/InvestigationReportView.js').then(m => ({ default: m.InvestigationReportView })));
const PhysicianInvestigationReviewView = React.lazy(() => import('./views/PhysicianInvestigationReviewView.js').then(m => ({ default: m.PhysicianInvestigationReviewView })));
const PatientInvestigationHistoryView = React.lazy(() => import('./views/PatientInvestigationHistoryView.js').then(m => ({ default: m.PatientInvestigationHistoryView })));
const CriticalResultCenterView = React.lazy(() => import('./views/CriticalResultCenterView.js').then(m => ({ default: m.CriticalResultCenterView })));
const InvestigationAuditVaultView = React.lazy(() => import('./views/InvestigationAuditVaultView.js').then(m => ({ default: m.InvestigationAuditVaultView })));
const ReferringDoctorLedgerView = React.lazy(() => import('./views/ReferringDoctorLedgerView.js').then(m => ({ default: m.ReferringDoctorLedgerView })));
const PublicReportVerificationView = React.lazy(() => import('./views/PublicReportVerificationView.js').then(m => ({ default: m.PublicReportVerificationView })));
const PathologyRevenueCollectionView = React.lazy(() => import('./views/PathologyRevenueCollectionView.js').then(m => ({ default: m.PathologyRevenueCollectionView })));

// Lazy-loaded Dialogs
const CreateInvestigationOrderDialog = React.lazy(() => import('./dialogs/CreateInvestigationOrderDialog.js').then(m => ({ default: m.CreateInvestigationOrderDialog })));
const SelectInvestigationDialog = React.lazy(() => import('./dialogs/SelectInvestigationDialog.js').then(m => ({ default: m.SelectInvestigationDialog })));
const CreateInvestigationPanelDialog = React.lazy(() => import('./dialogs/CreateInvestigationPanelDialog.js').then(m => ({ default: m.CreateInvestigationPanelDialog })));
const CollectSpecimenDialog = React.lazy(() => import('./dialogs/CollectSpecimenDialog.js').then(m => ({ default: m.CollectSpecimenDialog })));
const RejectSpecimenDialog = React.lazy(() => import('./dialogs/RejectSpecimenDialog.js').then(m => ({ default: m.RejectSpecimenDialog })));
const EnterInvestigationResultDialog = React.lazy(() => import('./dialogs/EnterInvestigationResultDialog.js').then(m => ({ default: m.EnterInvestigationResultDialog })));
const PrintablePathologyReportModal = React.lazy(() => import('./dialogs/PrintablePathologyReportModal.js').then(m => ({ default: m.PrintablePathologyReportModal })));
const DirectLabBillingModal = React.lazy(() => import('./dialogs/DirectLabBillingModal.js').then(m => ({ default: m.DirectLabBillingModal })));
const DirectLabWalkInReportModal = React.lazy(() => import('./dialogs/DirectLabWalkInReportModal.js').then(m => ({ default: m.DirectLabWalkInReportModal })));
const ThermalBarcodeStickerModal = React.lazy(() => import('./dialogs/ThermalBarcodeStickerModal.js').then(m => ({ default: m.ThermalBarcodeStickerModal })));
const CriticalPanicIntimationModal = React.lazy(() => import('./dialogs/CriticalPanicIntimationModal.js').then(m => ({ default: m.CriticalPanicIntimationModal })));
const ClinicalTestLibraryExplorerModal = React.lazy(() => import('./dialogs/ClinicalTestLibraryExplorerModal.js').then(m => ({ default: m.ClinicalTestLibraryExplorerModal })));
const VerifyInvestigationResultDialog = React.lazy(() => import('./dialogs/VerifyInvestigationResultDialog.js').then(m => ({ default: m.VerifyInvestigationResultDialog })));
const FinalizeInvestigationReportDialog = React.lazy(() => import('./dialogs/FinalizeInvestigationReportDialog.js').then(m => ({ default: m.FinalizeInvestigationReportDialog })));
const ReviewInvestigationResultDialog = React.lazy(() => import('./dialogs/ReviewInvestigationResultDialog.js').then(m => ({ default: m.ReviewInvestigationResultDialog })));
const AmendInvestigationResultDialog = React.lazy(() => import('./dialogs/AmendInvestigationResultDialog.js').then(m => ({ default: m.AmendInvestigationResultDialog })));
const CancelInvestigationOrderDialog = React.lazy(() => import('./dialogs/CancelInvestigationOrderDialog.js').then(m => ({ default: m.CancelInvestigationOrderDialog })));
const MicroscopeEyepieceScannerModal = React.lazy(() => import('./dialogs/MicroscopeEyepieceScannerModal.js').then(m => ({ default: m.MicroscopeEyepieceScannerModal })));
const AutoAnalyzerSyncModal = React.lazy(() => import('./dialogs/AutoAnalyzerSyncModal.js').then(m => ({ default: m.AutoAnalyzerSyncModal })));
const PathologyReportHistoryBookModal = React.lazy(() => import('./dialogs/PathologyReportHistoryBookModal.js').then(m => ({ default: m.PathologyReportHistoryBookModal })));
const DynamicReportCustomizerModal = React.lazy(() => import('./dialogs/DynamicReportCustomizerModal.js').then(m => ({ default: m.DynamicReportCustomizerModal })));
const CustomTestLibraryManagerModal = React.lazy(() => import('./dialogs/CustomTestLibraryManagerModal.js').then(m => ({ default: m.CustomTestLibraryManagerModal })));

import { ErrorState, DataPulse, Badge, SkeletonPage, SkeletonTable, playAudioFeedback } from '@docsearch/ui-kit';

export type ActiveInvestigationTab =
  | 'overview'
  | 'catalog'
  | 'orders'
  | 'specimens'
  | 'processing'
  | 'results'
  | 'reports'
  | 'revenue'
  | 'referrals'
  | 'doctorReview'
  | 'patientHistory'
  | 'critical'
  | 'audit';

export interface ClinicalInvestigationDomainManagerProps {
  initialTab?: ActiveInvestigationTab;
}

export const ClinicalInvestigationDomainManager: React.FC<ClinicalInvestigationDomainManagerProps> = ({
  initialTab
}) => {
  const [activeTab, setActiveTab] = useState<ActiveInvestigationTab>(initialTab || 'specimens');

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  type LabStage = 'stage1_phlebotomy' | 'stage2_analyzer' | 'stage3_delivery';

  const getLabStageForTab = (tab: ActiveInvestigationTab): LabStage => {
    switch (tab) {
      case 'specimens':
      case 'orders':
      case 'catalog':
        return 'stage1_phlebotomy';
      case 'processing':
      case 'results':
      case 'critical':
      case 'doctorReview':
        return 'stage2_analyzer';
      case 'reports':
      case 'revenue':
      case 'referrals':
      case 'patientHistory':
      case 'audit':
      case 'overview':
      default:
        return 'stage3_delivery';
    }
  };

  const activeStage = getLabStageForTab(activeTab);

  const handleSelectStage = (stage: LabStage) => {
    if (activeStage === stage) return;
    if (stage === 'stage1_phlebotomy') {
      setActiveTab('specimens');
    } else if (stage === 'stage2_analyzer') {
      setActiveTab('processing');
    } else {
      setActiveTab('reports');
    }
  };
  const [context, setContext] = useState<PanelContextDto | null>(null);
  const [partners, setPartners] = useState<OperationalPartnerDto[]>([]);
  const [organizations, setOrganizations] = useState<OperationalOrganizationDto[]>([]);
  const [facilities, setFacilities] = useState<OperationalFacilityDto[]>([]);

  const [overview, setOverview] = useState<InvestigationOverviewDto | null>(null);
  const [catalog, setCatalog] = useState<InvestigationCatalogDto[]>([]);
  const [panels, setPanels] = useState<InvestigationPanelDto[]>([]);
  const [orders, setOrders] = useState<InvestigationOrderDto[]>([]);
  const [auditTraces, setAuditTraces] = useState<InvestigationAuditTraceDto[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<InvestigationOrderDto | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Dialog open states
  const [isCreateOrderOpen, setIsCreateOrderOpen] = useState(false);
  const [isSelectInvestigationOpen, setIsSelectInvestigationOpen] = useState(false);
  const [isCreatePanelOpen, setIsCreatePanelOpen] = useState(false);
  const [isCollectSpecimenOpen, setIsCollectSpecimenOpen] = useState(false);
  const [isRejectSpecimenOpen, setIsRejectSpecimenOpen] = useState(false);
  const [isEnterResultOpen, setIsEnterResultOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [isBillingModalOpen, setIsBillingModalOpen] = useState(false);
  const [isWalkInReportOpen, setIsWalkInReportOpen] = useState(false);
  const [isThermalStickerOpen, setIsThermalStickerOpen] = useState(false);
  const [stickerTargetOrder, setStickerTargetOrder] = useState<InvestigationOrderDto | null>(null);
  const [isPublicVerifyOpen, setIsPublicVerifyOpen] = useState(false);
  const [isTestLibraryModalOpen, setIsTestLibraryModalOpen] = useState(false);
  const [isVerifyResultOpen, setIsVerifyResultOpen] = useState(false);
  const [isFinalizeReportOpen, setIsFinalizeReportOpen] = useState(false);
  const [isReviewResultOpen, setIsReviewResultOpen] = useState(false);
  const [isAmendResultOpen, setIsAmendResultOpen] = useState(false);
  const [isCancelOrderOpen, setIsCancelOrderOpen] = useState(false);
  const [isPanicIntimationOpen, setIsPanicIntimationOpen] = useState(false);
  const [panicTargetOrder, setPanicTargetOrder] = useState<InvestigationOrderDto | null>(null);
  const [isMicroscopeScannerOpen, setIsMicroscopeScannerOpen] = useState(false);
  const [microscopeSuccessToast, setMicroscopeSuccessToast] = useState<string | null>(null);
  const [activePatient, setActivePatient] = useState<ActivePatientSummary | null>(() => hospitalEventBus.getActivePatient());

  // 📖 Pathology Report History Book & Dynamic Customizer State
  const [isHistoryBookOpen, setIsHistoryBookOpen] = useState(false);
  const [isEditReportOpen, setIsEditReportOpen] = useState(false);
  const [editingTargetOrder, setEditingTargetOrder] = useState<InvestigationOrderDto | null>(null);
  const [isCustomTestLibraryManagerOpen, setIsCustomTestLibraryManagerOpen] = useState(false);
  const [billingTargetOrder, setBillingTargetOrder] = useState<InvestigationOrderDto | null>(null);

  // 🔬 Auto-Analyzer & OPD Doctor Lab Orders State
  const [isAutoAnalyzerOpen, setIsAutoAnalyzerOpen] = useState(false);
  const [pendingDoctorLabOrders, setPendingDoctorLabOrders] = useState<any[]>([]);

  // 🚨 Critical Lab Panic Value Red Flag HUD State (NABL 15-Minute Protocol)
  const [panicCountdown, setPanicCountdown] = useState<number>(885);
  const [acknowledgedPanicOrderIds, setAcknowledgedPanicOrderIds] = useState<string[]>([]);

  useEffect(() => {
    const timer = setInterval(() => {
      setPanicCountdown((prev) => (prev > 0 ? prev - 1 : 900));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const criticalPanicOrders = useMemo(() => {
    return orders.filter((o) => {
      if (acknowledgedPanicOrderIds.includes(o.id)) return false;
      if (o.isCritical) return true;
      if (o.results && o.results.length > 0) {
        return o.results.some((r) => {
          if (r.isCritical) return true;
          const name = (r.parameterName || '').toLowerCase();
          const val = parseFloat(String(r.resultValue).replace(/,/g, '').replace(/[^0-9.]/g, ''));
          if (isNaN(val)) return false;
          if (name.includes('platelet') && val < 20000) return true;
          if (name.includes('potassium') && val > 6.5) return true;
          if ((name.includes('glucose') || name.includes('sugar')) && (val < 45 || val > 450)) return true;
          if (name.includes('troponin') && val > 0.04) return true;
          return false;
        });
      }
      return false;
    });
  }, [orders, acknowledgedPanicOrderIds]);

  const getPanicDetail = (order: InvestigationOrderDto) => {
    if (order.results && order.results.length > 0) {
      const crit = order.results.find((r) => {
        if (r.isCritical) return true;
        const name = (r.parameterName || '').toLowerCase();
        const val = parseFloat(String(r.resultValue).replace(/,/g, '').replace(/[^0-9.]/g, ''));
        if (isNaN(val)) return false;
        if (name.includes('platelet') && val < 20000) return true;
        if (name.includes('potassium') && val > 6.5) return true;
        if ((name.includes('glucose') || name.includes('sugar')) && (val < 45 || val > 450)) return true;
        if (name.includes('troponin') && val > 0.04) return true;
        return false;
      });
      if (crit) {
        return {
          analyte: crit.parameterName,
          value: crit.resultValue,
          unit: crit.unit || '',
          severity: 'CRITICAL PANIC'
        };
      }
    }
    return {
      analyte: order.investigationName || 'Critical Parameter',
      value: 'PANIC ALERT',
      unit: '',
      severity: 'CRITICAL PANIC'
    };
  };

  const handleSimulatePanicAlert = (type: 'platelets' | 'potassium' = 'platelets') => {
    const isPlatelets = type === 'platelets';
    const testOrder: InvestigationOrderDto = {
      id: `panic-sim-${Date.now()}`,
      tenantId: context?.activeTenantId || 'tenant-01',
      partnerId: context?.activePartnerId ?? '',
      organizationId: context?.activeOrganizationId ?? '',
      branchId: context?.activeFacilityId ?? '',
      orderNumber: `ORD-PANIC-${Math.floor(1000 + Math.random() * 9000)}`,
      patientId: 'pat-panic-01',
      patientName: isPlatelets ? 'Sunita Verma' : 'Om Prakash Sharma',
      patientMrn: isPlatelets ? 'MRN-9021' : 'MRN-8842',
      patientDob: '1978-04-12',
      patientGender: isPlatelets ? 'FEMALE' : 'MALE',
      investigationId: isPlatelets ? 'inv-cbc' : 'inv-kft',
      investigationCode: isPlatelets ? 'CBC' : 'KFT',
      investigationName: isPlatelets ? 'Complete Blood Count (CBC)' : 'Kidney Function & Electrolytes',
      investigationCategory: 'PATHOLOGY',
      specimenType: 'WHOLE_BLOOD',
      priority: 'STAT',
      status: 'PROCESSING',
      orderedAt: new Date().toISOString(),
      orderingDoctorName: 'Dr. Ramesh Gupta, MD (Cardiology)',
      orderingDoctorId: 'doc-gupta',
      encounterId: 'enc-stat-01',
      encounterNumber: 'ENC-STAT-01',
      fastingConfirmed: false,
      amendments: [],
      clinicalIndication: 'Emergency Stat Evaluation',
      isAbnormal: true,
      isCritical: true,
      specimens: [],
      results: [
        {
          id: `res-${Date.now()}-1`,
          orderId: `panic-sim-${Date.now()}`,
          investigationId: isPlatelets ? 'inv-cbc' : 'inv-kft',
          parameterCode: isPlatelets ? 'PLT' : 'K',
          parameterName: isPlatelets ? 'Platelet Count' : 'Serum Potassium',
          resultValue: isPlatelets ? '14,000' : '6.8',
          unit: isPlatelets ? '/mcL' : 'mEq/L',
          referenceRange: isPlatelets ? '1,50,000 - 4,50,000' : '3.5 - 5.1',
          abnormalFlag: 'CRITICAL',
          isCritical: true,
          status: 'ENTERED',
          enteredAt: new Date().toISOString(),
          enteredBy: 'Sysmex XN-550 ASTM'
        } as any
      ],
      metadata: {
        patientPhone: '9876543210'
      } as any,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    setOrders((prev) => [testOrder, ...prev]);
    setSelectedOrder(testOrder);
    setPanicCountdown(900);

    // 🚨 Broadcast real-time panic alert across event bus to alert doctor consultation desks
    hospitalEventBus.publish(
      'CRITICAL_PANIC_ALERT' as any,
      'PathologyLims',
      {
        orderId: testOrder.id,
        orderNumber: testOrder.orderNumber,
        patientId: testOrder.patientId,
        patientName: testOrder.patientName,
        patientMrn: testOrder.patientMrn,
        analyte: isPlatelets ? 'Platelet Count' : 'Serum Potassium',
        value: isPlatelets ? '14,000 /mcL' : '6.8 mEq/L',
        panicThreshold: isPlatelets ? '< 20,000 /mcL' : '> 6.5 mEq/L',
        orderingDoctorName: testOrder.orderingDoctorName,
        reportedAt: new Date().toISOString()
      },
      `🚨 CRITICAL PANIC VALUE: ${testOrder.patientName} - ${isPlatelets ? 'Platelets 14,000 /mcL' : 'Potassium 6.8 mEq/L'}!`
    );
  };

  useEffect(() => {
    setPendingDoctorLabOrders([]);
    const unsubCreated = hospitalEventBus.subscribe('LAB_ORDER_CREATED', (payload) => {
      void loadData();
      setMicroscopeSuccessToast(`⚡ New OPD Lab Order received for ${payload.data?.patientName || 'Patient'}!`);
      setTimeout(() => setMicroscopeSuccessToast(null), 5000);
    });

    const unsubOrdered = hospitalEventBus.subscribe('LAB_TESTS_ORDERED' as any, (payload) => {
      void loadData();
      setMicroscopeSuccessToast(`⚡ Doctor investigation requested for ${payload.data?.patientName || 'Patient'}!`);
      setTimeout(() => setMicroscopeSuccessToast(null), 5000);
    });

    const handleStorage = () => {
      void loadData();
    };
    window.addEventListener('storage', handleStorage);

    return () => {
      unsubCreated();
      unsubOrdered();
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  useEffect(() => {
    const unsubscribe = hospitalEventBus.subscribe('PATIENT_SELECTED', (payload: HospitalEventPayload) => {
      const selected = payload.data as ActivePatientSummary;
      if (selected && (selected.id || selected.uhid)) {
        setActivePatient(selected);
      }
    });

    const unsubscribeClear = hospitalEventBus.subscribe('PATIENT_CLEARED', () => {
      setActivePatient(null);
    });

    return () => {
      unsubscribe();
      unsubscribeClear();
    };
  }, []);

  // Listen for Universal Command Palette "CBC" Lab Test order trigger
  useEffect(() => {
    const handleOrderLabTest = (e: Event) => {
      const custom = e as CustomEvent<any>;
      const d = custom.detail;
      if (!d) return;

      setIsCreateOrderOpen(true);
      window.dispatchEvent(
        new CustomEvent('docsearch:optimistic_action', {
          detail: {
            actionName: `LIMS: Initiating ${d.testName || 'Complete Blood Count (CBC)'}`,
            entity: 'Pathology Lab'
          }
        })
      );
    };

    window.addEventListener('docsearch:order_lab_test', handleOrderLabTest);
    return () => window.removeEventListener('docsearch:order_lab_test', handleOrderLabTest);
  }, []);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const ctx = await partnerFoundationService.getPanelContext();
      setContext(ctx);

      const [partnersRes, orgsRes, facsRes] = await Promise.all([
        partnerFoundationService.getPartners(ctx.activeTenantId),
        partnerFoundationService.getOrganizations(ctx.activeTenantId),
        partnerFoundationService.getFacilities(ctx.activeTenantId)
      ]);
      setPartners(partnersRes);
      setOrganizations(orgsRes);
      setFacilities(facsRes);

      const [ov, cat, pan, ords, aud] = await Promise.all([
        clinicalInvestigationService.getOverview(
          ctx.activeTenantId,
          ctx.activePartnerId,
          ctx.activeOrganizationId,
          ctx.activeFacilityId
        ),
        clinicalInvestigationService.searchCatalog(ctx.activeTenantId),
        clinicalInvestigationService.getPanels(ctx.activeTenantId),
        clinicalInvestigationService.searchOrders({
          tenantId: ctx.activeTenantId,
          organizationId: ctx.activeOrganizationId,
          pageIndex: 0,
          pageSize: 100
        }),
        clinicalInvestigationService.getAuditTraces({
          tenantId: ctx.activeTenantId,
          pageIndex: 0,
          pageSize: 100
        })
      ]);

      setOverview(ov);
      setCatalog(cat);
      setPanels(pan);
      setOrders(ords);
      setAuditTraces(aud);

      if (ords.length > 0 && ords[0]) {
        setSelectedOrder(ords[0]);
      }
    } catch (err) {
      console.error('Failed to load Clinical Investigation data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load investigation data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
    const handleOrdersUpdated = () => {
      void loadData();
    };
    window.addEventListener('docsearch_orders_updated', handleOrdersUpdated);
    return () => {
      window.removeEventListener('docsearch_orders_updated', handleOrdersUpdated);
    };
  }, [loadData]);

  const handleContextChange = async (newContext: Partial<PanelContextDto>) => {
    try {
      setIsLoading(true);
      const updated = await partnerFoundationService.setPanelContext(newContext);
      setContext(updated);
      await loadData();
    } catch (err) {
      console.error('Failed to switch panel context:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Dialog action handlers
  const handleCreateOrder = async (req: CreateInvestigationOrderRequest) => {
    const created = await clinicalInvestigationService.createInvestigationOrder(req);
    setSelectedOrder(created);
    await loadData();
    setActiveTab('specimens');
  };

  const handleCreatePanel = async (req: CreateInvestigationPanelRequest) => {
    await clinicalInvestigationService.createPanel(req);
    await loadData();
  };

  const handleCollectSpecimen = async (req: CollectSpecimenRequest) => {
    await clinicalInvestigationService.collectSpecimen(req);
    await loadData();
  };

  const handleRejectSpecimen = async (req: RejectSpecimenRequest) => {
    await clinicalInvestigationService.rejectSpecimen(req);
    await loadData();
  };

  const handleEnterResult = async (req: EnterInvestigationResultRequest) => {
    await clinicalInvestigationService.enterResults(req);
    await loadData();
  };

  const handleVerifyResult = async (req: VerifyInvestigationResultRequest) => {
    await clinicalInvestigationService.verifyResults(req);
    await loadData();
    hospitalEventBus.publish(
      'LAB_REPORT_COMPLETED',
      'PathologyLims',
      {
        orderId: selectedOrder?.id || req.orderId,
        patientId: selectedOrder?.patientId,
        patientName: selectedOrder?.patientName || 'Patient',
        investigationName: selectedOrder?.investigationName || 'Lab Investigation',
        verifiedAt: new Date().toISOString()
      },
      `🔔 Lab Report Ready for Patient ${selectedOrder?.patientName || 'Patient'} (${selectedOrder?.investigationName || 'Lab Investigation'})`
    );
  };

  const handleFinalizeReport = async (req: FinalizeInvestigationReportRequest) => {
    await clinicalInvestigationService.finalizeReport(req);
    await loadData();
    hospitalEventBus.publish(
      'LAB_REPORT_COMPLETED',
      'PathologyLims',
      {
        orderId: selectedOrder?.id || req.orderId,
        patientId: selectedOrder?.patientId,
        patientName: selectedOrder?.patientName || 'Patient',
        investigationName: selectedOrder?.investigationName || 'Lab Investigation',
        verifiedAt: new Date().toISOString()
      },
      `🔔 Lab Report Ready for Patient ${selectedOrder?.patientName || 'Patient'} (${selectedOrder?.investigationName || 'Lab Investigation'})`
    );
  };

  const handleReviewResult = async (req: ReviewInvestigationResultRequest) => {
    await clinicalInvestigationService.reviewResults(req);
    await loadData();
  };

  const handleAmendResult = async (req: AmendInvestigationResultRequest) => {
    await clinicalInvestigationService.amendResult(req);
    await loadData();
  };

  const handleCancelOrder = async (req: CancelInvestigationOrderRequest) => {
    await clinicalInvestigationService.cancelInvestigationOrder(req);
    await loadData();
  };

  const handleSelectOrderById = (orderId: string) => {
    const found = orders.find((o) => o.id === orderId);
    if (found) {
      setSelectedOrder(found);
      setActiveTab('results');
    }
  };

  if (isLoading && !context) {
    return <SkeletonPage layout="table" metricCount={4} />;
  }

  if (error && !context) {
    return (
      <div style={{ padding: '24px' }}>
        <ErrorState title="Clinical Investigation System Error" message={error} onRetry={loadData} />
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', position: 'relative' }}>
        
        {context && (facilities.length > 1 || organizations.length > 1) && (
          <PanelContextSwitcher
            context={context}
            partners={partners}
            organizations={organizations}
            facilities={facilities}
            onContextChange={handleContextChange}
          />
        )}

        {/* Microscope AI Smear Toast */}
        {microscopeSuccessToast && (
          <div style={{
            backgroundColor: '#064E3B',
            border: '1.5px solid #10B981',
            color: '#A7F3D0',
            padding: '12px 18px',
            borderRadius: '10px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontWeight: 700,
            boxShadow: '0 0 15px rgba(16, 185, 129, 0.3)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>🔬</span>
              <span>{microscopeSuccessToast}</span>
            </div>
            <button
              onClick={() => setMicroscopeSuccessToast(null)}
              style={{ background: 'transparent', border: 'none', color: '#A7F3D0', cursor: 'pointer', fontWeight: 800, fontSize: '1rem' }}
            >
              ✕
            </button>
          </div>
        )}

        {/* 🚨 CRITICAL LAB PANIC VALUE "RED FLAG HUD" (NABL 15-Minute Protocol Banner) */}
        {criticalPanicOrders.length > 0 && (
          <div
            role="alert"
            style={{
              backgroundColor: '#450A0A',
              border: '2px solid #EF4444',
              borderRadius: '12px',
              padding: '16px 20px',
              color: '#FEF2F2',
              boxShadow: '0 0 24px rgba(239, 68, 68, 0.45)',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              animation: 'dsPulseRed 2s infinite ease-in-out'
            }}
          >
            <style>{`
              @keyframes dsPulseRed {
                0%, 100% { box-shadow: 0 0 16px rgba(239, 68, 68, 0.45); border-color: #EF4444; }
                50% { box-shadow: 0 0 32px rgba(239, 68, 68, 0.85); border-color: #F87171; }
              }
            `}</style>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '1.4rem' }}>🚨</span>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 900, fontSize: '0.98rem', color: '#FCA5A5', letterSpacing: '0.02em' }}>
                      CRITICAL LAB PANIC VALUE — NABL ISO 15189 MANDATORY 15-MINUTE NOTIFICATION
                    </span>
                    <span style={{
                      backgroundColor: '#DC2626',
                      color: '#FFFFFF',
                      fontSize: '0.65rem',
                      fontWeight: 900,
                      padding: '2px 8px',
                      borderRadius: '999px',
                      letterSpacing: '0.05em'
                    }}>
                      STAT RED ALERT
                    </span>
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#FECACA', marginTop: '2px' }}>
                    Urgent laboratory finding requires immediate verbal read-back intimation to the attending doctor within 15 minutes.
                  </div>
                </div>
              </div>

              {/* 15-Minute Countdown Clock */}
              <div style={{
                backgroundColor: '#7F1D1D',
                border: '1.5px solid #F87171',
                borderRadius: '8px',
                padding: '6px 14px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <span style={{ fontSize: '1rem' }}>⏱️</span>
                <div>
                  <div style={{ fontSize: '0.62rem', color: '#FCA5A5', fontWeight: 800, textTransform: 'uppercase' }}>
                    NABL 15-Min Timer
                  </div>
                  <div style={{ fontSize: '1.05rem', fontWeight: 900, color: '#FFFFFF', fontFamily: 'monospace' }}>
                    {Math.floor(panicCountdown / 60).toString().padStart(2, '0')}:{(panicCountdown % 60).toString().padStart(2, '0')}
                  </div>
                </div>
              </div>
            </div>

            {/* Panic Order Cards Carousel / Row */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {criticalPanicOrders.slice(0, 3).map((order: InvestigationOrderDto) => {
                const detail = getPanicDetail(order);
                const docName = order.orderingDoctorName || 'Attending Physician';
                const docPhone = '9876543210';
                const waText = encodeURIComponent(
                  `🚨 DocSearch Emergency Panic Value Alert: Patient ${order.patientName} (${order.patientMrn || order.orderNumber}) has critical laboratory result: ${detail.analyte}: ${detail.value} ${detail.unit}. Attending: ${docName}. Please review immediately as per NABL 15-min protocol.`
                );

                return (
                  <div
                    key={order.id}
                    style={{
                      backgroundColor: 'rgba(0, 0, 0, 0.45)',
                      border: '1px solid rgba(239, 68, 68, 0.5)',
                      borderRadius: '8px',
                      padding: '10px 14px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '12px'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 900, color: '#FFFFFF', fontSize: '0.92rem' }}>
                          {order.patientName}
                        </span>
                        <span style={{ fontSize: '0.72rem', color: '#FCA5A5', backgroundColor: 'rgba(239, 68, 68, 0.2)', padding: '1px 6px', borderRadius: '4px' }}>
                          {order.patientMrn || order.orderNumber}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: '#CBD5E1' }}>
                          Doctor: <strong style={{ color: '#F8FAFC' }}>{docName}</strong>
                        </span>
                      </div>
                      <div style={{ marginTop: '4px', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <span style={{ color: '#FCA5A5', fontWeight: 800, fontSize: '0.88rem' }}>
                          ⚡ {detail.analyte}: <span style={{ color: '#FFFFFF', textDecoration: 'underline' }}>{detail.value} {detail.unit}</span>
                        </span>
                        <span style={{ fontSize: '0.7rem', color: '#FECACA', fontStyle: 'italic' }}>
                          ({detail.analyte.toLowerCase().includes('platelet') ? 'Panic Threshold: < 20,000 /mcL' : detail.analyte.toLowerCase().includes('potassium') ? 'Panic Threshold: > 6.5 mEq/L' : 'Severe Critical Range'})
                        </span>
                      </div>
                    </div>

                    {/* Quick Actions: 1-Click WhatsApp, 1-Click Call, Log Intimation */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <a
                        href={`https://wa.me/?text=${waText}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          backgroundColor: '#059669',
                          color: '#FFFFFF',
                          padding: '7px 12px',
                          borderRadius: '6px',
                          fontSize: '0.78rem',
                          fontWeight: 800,
                          textDecoration: 'none',
                          boxShadow: '0 2px 8px rgba(5, 150, 105, 0.35)',
                          transition: 'all 0.15s ease'
                        }}
                        title="Send pre-filled emergency alert on WhatsApp to attending doctor"
                      >
                        <span>💬</span>
                        <span>1-Click WhatsApp</span>
                      </a>

                      <a
                        href={`tel:${docPhone}`}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          backgroundColor: '#0284C7',
                          color: '#FFFFFF',
                          padding: '7px 12px',
                          borderRadius: '6px',
                          fontSize: '0.78rem',
                          fontWeight: 800,
                          textDecoration: 'none',
                          boxShadow: '0 2px 8px rgba(2, 132, 199, 0.35)',
                          transition: 'all 0.15s ease'
                        }}
                        title={`Call attending physician at ${docPhone}`}
                      >
                        <span>📞</span>
                        <span>Call Doctor</span>
                      </a>

                      <button
                        type="button"
                        onClick={() => {
                          setPanicTargetOrder(order);
                          setIsPanicIntimationOpen(true);
                          playAudioFeedback('panic');
                        }}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          backgroundColor: '#DC2626',
                          color: '#FFFFFF',
                          border: '1px solid #F87171',
                          padding: '7px 12px',
                          borderRadius: '6px',
                          fontSize: '0.78rem',
                          fontWeight: 900,
                          cursor: 'pointer',
                          boxShadow: '0 2px 8px rgba(220, 38, 38, 0.35)'
                        }}
                        title="Log formal verbal read-back intimation for NABL accreditation audit"
                      >
                        <span>📝</span>
                        <span>Log Intimation</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setAcknowledgedPanicOrderIds((prev) => [...prev, order.id]);
                        }}
                        style={{
                          background: 'transparent',
                          border: '1px solid rgba(255, 255, 255, 0.2)',
                          color: '#CBD5E1',
                          padding: '7px 10px',
                          borderRadius: '6px',
                          fontSize: '0.72rem',
                          cursor: 'pointer'
                        }}
                        title="Acknowledge panic alert for this session"
                      >
                        ✕ Mute
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 1. Laboratory Operational Command Bar (Clean & Professional) */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: '#0F172A',
          border: '1px solid rgba(6, 182, 212, 0.25)',
          borderRadius: '12px',
          padding: '14px 20px',
          flexWrap: 'wrap',
          gap: '14px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.35)'
        }}>
          {/* Lab Title & Accreditation */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              backgroundColor: 'rgba(6, 182, 212, 0.15)',
              border: '1.5px solid #06B6D4',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.35rem'
            }}>
              🧪
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontWeight: 800, fontSize: '1.05rem', color: '#F8FAFC' }}>
                  Pathology Laboratory Workbench
                </span>
                <span style={{
                  backgroundColor: 'rgba(16, 185, 129, 0.15)',
                  color: '#34D399',
                  border: '1px solid rgba(16, 185, 129, 0.4)',
                  borderRadius: '6px',
                  padding: '2px 8px',
                  fontSize: '0.68rem',
                  fontWeight: 800
                }}>
                  ✓ NABL ISO 15189:2022
                </span>
                <DataPulse status="online" label="Daily QC: Approved (Level 1 & Level 2 Passed)" size="sm" color="#10B981" />
              </div>
              <div style={{ fontSize: '0.72rem', color: '#94A3B8', marginTop: '2px' }}>
                Sequential Pipeline: Phlebotomy ➔ Bench Testing ➔ Pathologist Sign-off ➔ WhatsApp Delivery
              </div>
            </div>
          </div>

          {/* Action Toolbar */}
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
            {/* Quick NABL Panic Test Buttons */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <button
                type="button"
                onClick={() => handleSimulatePanicAlert('platelets')}
                style={{
                  backgroundColor: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid rgba(239, 68, 68, 0.45)',
                  color: '#F87171',
                  borderRadius: '8px',
                  padding: '7px 12px',
                  fontSize: '0.78rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px'
                }}
                title="Simulate critical platelet count < 20,000 /uL"
              >
                <span>🚨</span>
                <span>Test Platelet (&lt; 20k)</span>
              </button>

              <button
                type="button"
                onClick={() => handleSimulatePanicAlert('potassium')}
                style={{
                  backgroundColor: 'rgba(245, 158, 11, 0.15)',
                  border: '1px solid rgba(245, 158, 11, 0.45)',
                  color: '#FBBF24',
                  borderRadius: '8px',
                  padding: '7px 12px',
                  fontSize: '0.78rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px'
                }}
                title="Simulate critical serum potassium > 6.5 mEq/L"
              >
                <span>⚡</span>
                <span>Test Potassium (&gt; 6.5)</span>
              </button>
            </div>

            {/* Express Direct Walk-In Test & Instant Print Action */}
            <button
              type="button"
              onClick={() => setIsWalkInReportOpen(true)}
              style={{
                backgroundColor: '#DC2626',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '8px',
                padding: '8px 16px',
                fontWeight: 900,
                fontSize: '0.85rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 4px 14px rgba(220, 38, 38, 0.35)',
                transition: 'all 0.15s ease'
              }}
              title="Express Walk-In: Record patient, input observed results & print NABL report on the spot"
            >
              <span>🩸</span>
              <span>+ Walk-In Test & Print</span>
            </button>

            {/* 📖 Pathology Report History Book (रजिस्टर / Diagnostic Archive) */}
            <button
              type="button"
              onClick={() => setIsHistoryBookOpen(true)}
              style={{
                backgroundColor: 'rgba(2, 132, 199, 0.2)',
                color: '#38BDF8',
                border: '1.5px solid #0284C7',
                borderRadius: '8px',
                padding: '8px 16px',
                fontWeight: 900,
                fontSize: '0.85rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 4px 14px rgba(2, 132, 199, 0.25)',
                transition: 'all 0.15s ease'
              }}
              title="Pathology Report History Book & Register of all finalized reports"
            >
              <span>📖</span>
              <span>Report History Book ({orders.filter(o => Boolean(o.report || o.status === 'VERIFIED' || o.status === 'REVIEWED' || (o.metadata as any)?.observedValues)).length})</span>
            </button>

            {/* Unified Primary Walk-In Billing Action */}
            <button
              type="button"
              onClick={() => setIsBillingModalOpen(true)}
              style={{
                backgroundColor: '#10B981',
                color: '#064E3B',
                border: 'none',
                borderRadius: '8px',
                padding: '8px 16px',
                fontWeight: 900,
                fontSize: '0.85rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)',
                transition: 'all 0.15s ease'
              }}
              title="Register walk-in patient, select tests, calculate pricing & print 80mm receipt"
            >
              <span>🧾</span>
              <span>+ New Walk-In & Billing</span>
            </button>

            {/* 💰 Revenue & Daily Collection Desk Action */}
            <button
              type="button"
              onClick={() => setActiveTab('revenue')}
              style={{
                backgroundColor: activeTab === 'revenue' ? '#10B981' : 'rgba(16, 185, 129, 0.15)',
                color: activeTab === 'revenue' ? '#064E3B' : '#34D399',
                border: '1.5px solid #10B981',
                borderRadius: '8px',
                padding: '8px 16px',
                fontWeight: 900,
                fontSize: '0.85rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 4px 14px rgba(16, 185, 129, 0.25)',
                transition: 'all 0.15s ease'
              }}
              title="Daily cash collection register, 7-day/30-day/custom-date revenue telemetry"
            >
              <span>💰</span>
              <span>Revenue & Collection</span>
            </button>

            {/* ⚙️ Custom Test Library & Laboratory Branding Manager */}
            <button
              type="button"
              onClick={() => setIsCustomTestLibraryManagerOpen(true)}
              style={{
                backgroundColor: '#0F172A',
                border: '1px solid rgba(168, 85, 247, 0.4)',
                color: '#C084FC',
                borderRadius: '8px',
                padding: '7px 12px',
                fontSize: '0.78rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
              title="Custom test profiles, parameters, ranges, prices & lab branding"
            >
              <span>⚙️</span>
              <span>Customize Tests & Lab</span>
            </button>

            {/* OPD Doctor Orders Badge */}
            {pendingDoctorLabOrders.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  setActiveTab('specimens');
                  setMicroscopeSuccessToast(`Switched to Phlebotomy queue (${pendingDoctorLabOrders.length} OPD Doctor orders pending)`);
                }}
                style={{
                  backgroundColor: 'rgba(2, 132, 199, 0.2)',
                  border: '1px solid #0284C7',
                  color: '#38BDF8',
                  borderRadius: '8px',
                  padding: '7px 12px',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
                title="View lab orders prescribed directly by OPD doctors"
              >
                <span>⚡</span>
                <span>OPD Orders ({pendingDoctorLabOrders.length})</span>
              </button>
            )}

            {/* Instrument Analyzer Sync */}
            <button
              type="button"
              onClick={() => setIsAutoAnalyzerOpen(true)}
              style={{
                backgroundColor: '#0F172A',
                border: '1px solid rgba(6, 182, 212, 0.4)',
                color: '#38BDF8',
                borderRadius: '8px',
                padding: '7px 12px',
                fontSize: '0.78rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
              title="Synchronize ASTM / HL7 serial instruments"
            >
              <span>📡</span>
              <span>Analyzer Sync</span>
            </button>

            {/* 🚨 Simulate Critical Panic Result Action */}
            <button
              type="button"
              onClick={() => handleSimulatePanicAlert('platelets')}
              style={{
                backgroundColor: 'rgba(239, 68, 68, 0.18)',
                border: '1.5px solid #EF4444',
                color: '#FCA5A5',
                borderRadius: '8px',
                padding: '7px 12px',
                fontSize: '0.78rem',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 2px 8px rgba(239, 68, 68, 0.25)'
              }}
              title="Simulate Critical Panic Finding (Platelets: 14,000 /µL) to test Red Flag HUD and NABL 15-min protocol"
            >
              <span>🚨</span>
              <span>Test Panic Alert (PLT 14k)</span>
            </button>

            {/* AI Smear Scanner */}
            <button
              type="button"
              onClick={() => setIsMicroscopeScannerOpen(true)}
              style={{
                backgroundColor: '#0F172A',
                border: '1px solid rgba(168, 85, 247, 0.4)',
                color: '#C084FC',
                borderRadius: '8px',
                padding: '7px 12px',
                fontSize: '0.78rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
              title="Digital Pathology & Whole Slide Imaging (WSI) blood smear examination"
            >
              <span>🔬</span>
              <span>Digital Pathology / WSI Viewer</span>
            </button>

            {/* Public QR Code Verification */}
            <button
              type="button"
              onClick={() => setIsPublicVerifyOpen(true)}
              style={{
                backgroundColor: '#0F172A',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#CBD5E1',
                borderRadius: '8px',
                padding: '7px 12px',
                fontSize: '0.78rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
              title="Verify public QR code cryptographic integrity"
            >
              <span>🔒</span>
              <span>Verify QR</span>
            </button>

            {/* ⛶ Fullscreen LIMS Station */}
            <button
              type="button"
              onClick={() => {
                if (!document.fullscreenElement) {
                  if (document.documentElement.requestFullscreen) {
                    document.documentElement.requestFullscreen().catch(() => {});
                  } else if ((document.documentElement as any).webkitRequestFullscreen) {
                    (document.documentElement as any).webkitRequestFullscreen();
                  }
                } else {
                  if (document.exitFullscreen) {
                    document.exitFullscreen().catch(() => {});
                  } else if ((document as any).webkitExitFullscreen) {
                    (document as any).webkitExitFullscreen();
                  }
                }
              }}
              style={{
                backgroundColor: '#0F172A',
                border: '1px solid rgba(56, 189, 248, 0.4)',
                color: '#38BDF8',
                borderRadius: '8px',
                padding: '7px 12px',
                fontSize: '0.78rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
              title="Toggle Fullscreen Pathology LIMS Station Mode (F11)"
            >
              <span>⛶</span>
              <span>Fullscreen LIMS</span>
            </button>

            {/* 🧹 1-Click Clear Test & Mock Data Action */}
            <button
              type="button"
              onClick={() => {
                const confirmed = window.confirm(
                  'Are you sure you want to clear all test & mock data?\n\nThis will purge all test patient orders, reports, and billing invoices. Master clinical test catalogs (CBC, LFT, KFT, custom tests) will remain safe.'
                );
                if (confirmed) {
                  clinicalInvestigationService.clearAllMockAndTestData();
                  setPendingDoctorLabOrders([]);
                  void loadData();
                  setMicroscopeSuccessToast('🧹 All test & mock data has been purged successfully! Laboratory is now clean.');
                  setTimeout(() => setMicroscopeSuccessToast(null), 5000);
                }
              }}
              style={{
                backgroundColor: 'rgba(239, 68, 68, 0.12)',
                border: '1px solid rgba(239, 68, 68, 0.4)',
                color: '#F87171',
                borderRadius: '8px',
                padding: '7px 12px',
                fontSize: '0.78rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
              title="Purge all test orders, reports & mock billing invoices"
            >
              <span>🧹</span>
              <span>Clear Test Data</span>
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 3-STAGE DIAGNOSTIC & PATHOLOGY PIPELINE                                   */}
        {/* Stage 1: Phlebotomy | Stage 2: Analyzer & Sign-Off | Stage 3: Delivery    */}
        {/* ========================================================================= */}
        {(() => {
          const stage1PendingCount = orders.filter((o) => o.status === 'SAMPLE_REQUIRED' || o.status === 'ORDERED').length;
          const stage2ProcessingCount = orders.filter((o) => o.status === 'PROCESSING').length;
          const stage2ReadyCount = orders.filter((o) => o.status === 'RESULT_READY' || o.status === 'VERIFIED').length;
          const criticalPanicCount = orders.filter((o) => o.isCritical).length;
          const stage3ReportsCount = orders.filter((o) => o.report || o.status === 'VERIFIED' || o.status === 'REVIEWED').length;

          return (
            <>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                  gap: '10px',
                  width: '100%',
                  paddingTop: '8px',
                  borderTop: '1px solid #1E293B',
                  marginBottom: '6px'
                }}
              >
                {/* Stage 1: Sample Collection & Triage */}
                <button
                  type="button"
                  onClick={() => handleSelectStage('stage1_phlebotomy')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    backgroundColor: activeStage === 'stage1_phlebotomy' ? 'rgba(2, 132, 199, 0.15)' : '#0E162B',
                    border: activeStage === 'stage1_phlebotomy' ? '1.5px solid #0284C7' : '1px solid #1E293B',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.15s ease',
                    boxShadow: activeStage === 'stage1_phlebotomy' ? '0 0 16px rgba(2, 132, 199, 0.15)' : 'none'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '1.35rem' }}>🩸</span>
                    <div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 800, color: activeStage === 'stage1_phlebotomy' ? '#38BDF8' : '#F8FAFC' }}>
                        1. Sample Collection & Triage
                      </div>
                      <div style={{ fontSize: '0.68rem', color: '#94A3B8' }}>
                        Vacutainer barcodes & Phlebotomy queue
                      </div>
                    </div>
                  </div>
                  <Badge variant={stage1PendingCount > 0 ? 'primary' : 'neutral'} style={{ fontSize: '0.65rem' }}>
                    {stage1PendingCount > 0 ? `${stage1PendingCount} Pending Draw` : 'Triage Clear'}
                  </Badge>
                </button>

                {/* Stage 2: Workbench & Sign-Off */}
                <button
                  type="button"
                  onClick={() => handleSelectStage('stage2_analyzer')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    backgroundColor: activeStage === 'stage2_analyzer' ? (criticalPanicCount > 0 ? 'rgba(239, 68, 68, 0.15)' : 'rgba(168, 85, 247, 0.15)') : '#0E162B',
                    border: activeStage === 'stage2_analyzer' ? (criticalPanicCount > 0 ? '1.5px solid #EF4444' : '1.5px solid #A855F7') : (criticalPanicCount > 0 ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid #1E293B'),
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.15s ease',
                    boxShadow: activeStage === 'stage2_analyzer' ? (criticalPanicCount > 0 ? '0 0 16px rgba(239, 68, 68, 0.2)' : '0 0 16px rgba(168, 85, 247, 0.15)') : 'none'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '1.35rem' }}>{criticalPanicCount > 0 ? '🚨' : '🧪'}</span>
                    <div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 800, color: activeStage === 'stage2_analyzer' ? (criticalPanicCount > 0 ? '#F87171' : '#C084FC') : '#F8FAFC' }}>
                        2. Workbench & Sign-Off
                      </div>
                      <div style={{ fontSize: '0.68rem', color: '#94A3B8' }}>
                        Analyzers, Panic Alerts & NABL approvals
                      </div>
                    </div>
                  </div>
                  <Badge variant={criticalPanicCount > 0 ? 'danger' : stage2ProcessingCount > 0 ? 'primary' : 'neutral'} style={{ fontSize: '0.65rem' }}>
                    {criticalPanicCount > 0 ? `🚨 ${criticalPanicCount} Panic Alerts` : stage2ProcessingCount > 0 ? `${stage2ProcessingCount} In Run` : `${stage2ReadyCount} Ready`}
                  </Badge>
                </button>

                {/* Stage 3: Dispatch & Billing */}
                <button
                  type="button"
                  onClick={() => handleSelectStage('stage3_delivery')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    backgroundColor: activeStage === 'stage3_delivery' ? 'rgba(16, 185, 129, 0.15)' : '#0E162B',
                    border: activeStage === 'stage3_delivery' ? '1.5px solid #10B981' : '1px solid #1E293B',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.15s ease',
                    boxShadow: activeStage === 'stage3_delivery' ? '0 0 16px rgba(16, 185, 129, 0.15)' : 'none'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '1.35rem' }}>📲</span>
                    <div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 800, color: activeStage === 'stage3_delivery' ? '#34D399' : '#F8FAFC' }}>
                        3. Dispatch & Billing
                      </div>
                      <div style={{ fontSize: '0.68rem', color: '#94A3B8' }}>
                        WhatsApp delivery, QR reports & Cash ledger
                      </div>
                    </div>
                  </div>
                  <Badge variant={stage3ReportsCount > 0 ? 'success' : 'neutral'} style={{ fontSize: '0.65rem' }}>
                    {stage3ReportsCount > 0 ? `${stage3ReportsCount} Reports Ready` : 'Ready'}
                  </Badge>
                </button>
              </div>

              {/* Contextual Sub-Pills for the Selected Lab Stage */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  flexWrap: 'wrap',
                  padding: '8px 12px',
                  backgroundColor: '#090E1A',
                  borderRadius: '10px',
                  border: '1px solid #1E293B'
                }}
              >
                {activeStage === 'stage1_phlebotomy' && (
                  <>
                    {[
                      { id: 'specimens' as ActiveInvestigationTab, label: 'Phlebotomy & Vacutainer Queue', icon: '🩸', badge: stage1PendingCount > 0 ? `${stage1PendingCount} Samples` : undefined, isPrimary: stage1PendingCount > 0 },
                      { id: 'orders' as ActiveInvestigationTab, label: 'Master Orders Directory', icon: '📋', badge: orders.length > 0 ? `${orders.length}` : undefined },
                      { id: 'catalog' as ActiveInvestigationTab, label: 'Test Catalog & Reference Library', icon: '📚', badge: catalog.length > 0 ? `${catalog.length}` : undefined }
                    ].map((tab) => {
                      const isActive = activeTab === tab.id;
                      return (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => setActiveTab(tab.id)}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '6px 12px',
                            borderRadius: '8px',
                            border: isActive ? '1.5px solid #0284C7' : '1px solid #1E293B',
                            backgroundColor: isActive ? 'rgba(2, 132, 199, 0.2)' : '#0E162B',
                            color: isActive ? '#38BDF8' : '#94A3B8',
                            fontSize: '0.78rem',
                            fontWeight: isActive ? 700 : 500,
                            cursor: 'pointer',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          <span>{tab.icon}</span>
                          <span>{tab.label}</span>
                          {tab.badge && (
                            <span
                              style={{
                                backgroundColor: isActive ? '#0284C7' : tab.isPrimary ? '#0369A1' : '#1E293B',
                                color: '#F8FAFC',
                                fontSize: '0.65rem',
                                fontWeight: 800,
                                padding: '1px 6px',
                                borderRadius: '999px'
                              }}
                            >
                              {tab.badge}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </>
                )}

                {activeStage === 'stage2_analyzer' && (
                  <>
                    {[
                      { id: 'processing' as ActiveInvestigationTab, label: 'Analyzer Workbench', icon: '🔬', badge: stage2ProcessingCount > 0 ? `${stage2ProcessingCount} In Run` : undefined },
                      { id: 'results' as ActiveInvestigationTab, label: 'Pathologist NABL Sign-Off', icon: '✍️', badge: stage2ReadyCount > 0 ? `${stage2ReadyCount} Ready` : undefined },
                      { id: 'critical' as ActiveInvestigationTab, label: 'Critical Panic Alerts Queue', icon: '🚨', badge: criticalPanicCount > 0 ? `${criticalPanicCount} Panic Alert${criticalPanicCount > 1 ? 's' : ''}` : '0 Alerts', isAlert: criticalPanicCount > 0 },
                      { id: 'doctorReview' as ActiveInvestigationTab, label: 'Physician Result Review', icon: '👨‍⚕️' }
                    ].map((tab) => {
                      const isActive = activeTab === tab.id;
                      return (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => setActiveTab(tab.id)}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '6px 12px',
                            borderRadius: '8px',
                            border: isActive ? (tab.isAlert ? '1.5px solid #EF4444' : '1.5px solid #A855F7') : (tab.isAlert ? '1px solid #EF4444' : '1px solid #1E293B'),
                            backgroundColor: isActive ? (tab.isAlert ? 'rgba(239, 68, 68, 0.25)' : 'rgba(168, 85, 247, 0.2)') : '#0E162B',
                            color: isActive ? (tab.isAlert ? '#F87171' : '#C084FC') : tab.isAlert ? '#F87171' : '#94A3B8',
                            fontSize: '0.78rem',
                            fontWeight: isActive ? 700 : 500,
                            cursor: 'pointer',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          <span>{tab.icon}</span>
                          <span>{tab.label}</span>
                          {tab.badge && (
                            <span
                              style={{
                                backgroundColor: tab.isAlert ? '#DC2626' : isActive ? '#A855F7' : '#1E293B',
                                color: '#F8FAFC',
                                fontSize: '0.65rem',
                                fontWeight: 800,
                                padding: '1px 6px',
                                borderRadius: '999px'
                              }}
                            >
                              {tab.badge}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </>
                )}

                {activeStage === 'stage3_delivery' && (
                  <>
                    {[
                      { id: 'reports' as ActiveInvestigationTab, label: 'WhatsApp & SMS Delivery', icon: '📲', badge: stage3ReportsCount > 0 ? `${stage3ReportsCount} Reports` : undefined },
                      { id: 'revenue' as ActiveInvestigationTab, label: 'Cash Collection Ledger', icon: '💰' },
                      { id: 'referrals' as ActiveInvestigationTab, label: 'Doctor Referral Ledger', icon: '💼' },
                      { id: 'patientHistory' as ActiveInvestigationTab, label: 'Patient Lab History', icon: '📁' },
                      { id: 'audit' as ActiveInvestigationTab, label: 'NABL Audit Vault', icon: '🔒' },
                      { id: 'overview' as ActiveInvestigationTab, label: 'Lab Operations Overview', icon: '📊' }
                    ].map((tab) => {
                      const isActive = activeTab === tab.id;
                      return (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => setActiveTab(tab.id)}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '6px 12px',
                            borderRadius: '8px',
                            border: isActive ? '1.5px solid #10B981' : '1px solid #1E293B',
                            backgroundColor: isActive ? 'rgba(16, 185, 129, 0.2)' : '#0E162B',
                            color: isActive ? '#34D399' : '#94A3B8',
                            fontSize: '0.78rem',
                            fontWeight: isActive ? 700 : 500,
                            cursor: 'pointer',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          <span>{tab.icon}</span>
                          <span>{tab.label}</span>
                          {tab.badge && (
                            <span
                              style={{
                                backgroundColor: isActive ? '#10B981' : '#1E293B',
                                color: isActive ? '#064E3B' : '#F8FAFC',
                                fontSize: '0.65rem',
                                fontWeight: 800,
                                padding: '1px 6px',
                                borderRadius: '999px'
                              }}
                            >
                              {tab.badge}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </>
                )}
              </div>
            </>
          );
        })()}

      {/* Active Cross-Department Patient Context Banner */}
      {activePatient && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: 'rgba(6, 182, 212, 0.12)',
          border: '1px solid rgba(6, 182, 212, 0.35)',
          borderRadius: '10px',
          padding: '10px 16px',
          marginBottom: '16px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.2)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '1.25rem' }}>🧪</span>
            <span style={{ fontSize: '0.8125rem', color: '#94A3B8' }}>Active Laboratory Patient:</span>
            <strong style={{ color: '#38BDF8', fontSize: '0.94rem', fontWeight: 800 }}>{activePatient.name}</strong>
            <span style={{ fontSize: '0.75rem', color: '#CBD5E1', backgroundColor: 'rgba(255,255,255,0.08)', padding: '2px 8px', borderRadius: '4px' }}>
              UHID: {activePatient.uhid || activePatient.id}
            </span>
            {activePatient.age && (
              <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
                • {activePatient.age}y / {activePatient.gender || 'M'}
              </span>
            )}
            <span style={{ fontSize: '0.75rem', color: '#34D399', fontWeight: 700 }}>
              ✓ Pre-selected from Hospital / OPD Consultation
            </span>
          </div>
          <button
            type="button"
            onClick={() => {
              setActivePatient(null);
              hospitalEventBus.clearActivePatient('ClinicalInvestigationDomainManager');
            }}
            style={{
              backgroundColor: 'transparent',
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: '6px',
              color: '#94A3B8',
              cursor: 'pointer',
              fontSize: '0.75rem',
              padding: '4px 10px',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#F1F5F9')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#94A3B8')}
          >
            Clear Patient ✕
          </button>
        </div>
      )}

      {/* Active Tab View (Persisted across tab switches so unsubmitted drafts/inputs are not lost) */}
      <React.Suspense fallback={<div style={{ padding: '16px' }}><SkeletonTable columns={6} rows={7} /></div>}>
      {overview && (
        <div style={{ display: activeTab === 'overview' ? 'block' : 'none' }}>
          <InvestigationOverviewView
            overview={overview}
            orders={orders}
            onOpenNewOrder={() => setIsBillingModalOpen(true)}
            onOpenWalkInTestAndPrint={() => setIsWalkInReportOpen(true)}
            onSelectOrder={handleSelectOrderById}
            onOpenTab={(tab) => setActiveTab(tab as ActiveInvestigationTab)}
          />
        </div>
      )}

      <div style={{ display: activeTab === 'catalog' ? 'block' : 'none' }}>
        <InvestigationCatalogView
          catalog={catalog}
          panels={panels}
          onOpenCreateInvestigation={() => setIsSelectInvestigationOpen(true)}
          onOpenCreatePanel={() => setIsCreatePanelOpen(true)}
        />
      </div>

      <div style={{ display: activeTab === 'orders' ? 'block' : 'none' }}>
        <InvestigationOrderDirectoryView
          orders={orders}
          onSelectOrder={handleSelectOrderById}
          onOpenCreateOrder={() => setIsBillingModalOpen(true)}
          onOpenWalkInTestAndPrint={() => setIsWalkInReportOpen(true)}
          onCancelOrder={(ord) => {
            setSelectedOrder(ord);
            setIsCancelOrderOpen(true);
          }}
        />
      </div>

      <div style={{ display: activeTab === 'specimens' ? 'block' : 'none' }}>
        <SpecimenCollectionView
          orders={orders}
          onCollectSpecimen={(ord) => {
            setSelectedOrder(ord);
            setIsCollectSpecimenOpen(true);
          }}
          onRejectSpecimen={(ord) => {
            setSelectedOrder(ord);
            setIsRejectSpecimenOpen(true);
          }}
          onPrintSticker={(ord) => {
            setStickerTargetOrder(ord);
            setIsThermalStickerOpen(true);
          }}
        />
      </div>

      <div style={{ display: activeTab === 'processing' ? 'block' : 'none' }}>
        <InvestigationProcessingView
          orders={orders}
          onSubmitResults={handleEnterResult}
          onSelectOrder={handleSelectOrderById}
        />
      </div>

      <div style={{ display: activeTab === 'results' ? 'block' : 'none' }}>
        <InvestigationResultView
          orders={orders}
          onVerifyResults={(ord) => {
            setSelectedOrder(ord);
            setIsVerifyResultOpen(true);
          }}
          onAmendResult={(ord) => {
            setSelectedOrder(ord);
            setIsAmendResultOpen(true);
          }}
          onEnterResults={(ord) => {
            setSelectedOrder(ord);
            setIsEnterResultOpen(true);
          }}
          onOpenPanicIntimation={(ord) => {
            setPanicTargetOrder(ord);
            setIsPanicIntimationOpen(true);
            playAudioFeedback('panic');
          }}
        />
      </div>

      <div style={{ display: activeTab === 'reports' ? 'block' : 'none' }}>
        <InvestigationReportView
          orders={orders}
          onFinalizeReport={(ord) => {
            setSelectedOrder(ord);
            setIsFinalizeReportOpen(true);
          }}
          onOpenBilling={(ord) => {
            setBillingTargetOrder(ord);
            setIsBillingModalOpen(true);
          }}
          onOpenEditReport={(ord) => {
            setEditingTargetOrder(ord);
            setIsEditReportOpen(true);
          }}
        />
      </div>

      <div style={{ display: activeTab === 'revenue' ? 'block' : 'none' }}>
        <PathologyRevenueCollectionView />
      </div>

      <div style={{ display: activeTab === 'referrals' ? 'block' : 'none' }}>
        <ReferringDoctorLedgerView />
      </div>

      <div style={{ display: activeTab === 'doctorReview' ? 'block' : 'none' }}>
        <PhysicianInvestigationReviewView
          orders={orders}
          onReviewResults={(ord) => {
            setSelectedOrder(ord);
            setIsReviewResultOpen(true);
          }}
          onSelectOrder={handleSelectOrderById}
          onOpenPrint={(ord) => {
            setSelectedOrder(ord);
            setIsPrintModalOpen(true);
          }}
        />
      </div>

      <div style={{ display: activeTab === 'patientHistory' ? 'block' : 'none' }}>
        <PatientInvestigationHistoryView
          orders={orders}
          onSelectOrder={handleSelectOrderById}
        />
      </div>

      <div style={{ display: activeTab === 'critical' ? 'block' : 'none' }}>
        <CriticalResultCenterView
          orders={orders}
          onReviewOrder={(ord) => {
            setSelectedOrder(ord);
            setIsReviewResultOpen(true);
          }}
          onSelectOrder={handleSelectOrderById}
        />
      </div>

      <div style={{ display: activeTab === 'audit' ? 'block' : 'none' }}>
        <InvestigationAuditVaultView auditTraces={auditTraces} />
      </div>

      {/* Dialog Modals */}
      {context && (
        <>
          <CreateInvestigationOrderDialog
            isOpen={isCreateOrderOpen}
            onClose={() => setIsCreateOrderOpen(false)}
            onSubmit={handleCreateOrder}
            catalog={catalog}
            panels={panels}
            tenantId={context.activeTenantId}
            partnerId={context.activePartnerId ?? ''}
            organizationId={context.activeOrganizationId ?? ''}
            branchId={context.activeFacilityId}
          />

          <SelectInvestigationDialog
            isOpen={isSelectInvestigationOpen}
            onClose={() => setIsSelectInvestigationOpen(false)}
            onSelect={(_inv) => {
              setIsCreateOrderOpen(true);
            }}
            catalog={catalog}
          />

          <CreateInvestigationPanelDialog
            isOpen={isCreatePanelOpen}
            onClose={() => setIsCreatePanelOpen(false)}
            onSubmit={handleCreatePanel}
            catalog={catalog}
            tenantId={context.activeTenantId}
            partnerId={context.activePartnerId ?? ''}
            organizationId={context.activeOrganizationId ?? ''}
          />

          <CollectSpecimenDialog
            isOpen={isCollectSpecimenOpen}
            onClose={() => setIsCollectSpecimenOpen(false)}
            onSubmit={handleCollectSpecimen}
            order={selectedOrder}
            tenantId={context.activeTenantId}
          />

          <RejectSpecimenDialog
            isOpen={isRejectSpecimenOpen}
            onClose={() => setIsRejectSpecimenOpen(false)}
            onSubmit={handleRejectSpecimen}
            order={selectedOrder}
            specimen={selectedOrder?.specimens[0] || null}
            tenantId={context.activeTenantId}
          />

          {selectedOrder && (
            <PrintablePathologyReportModal
              isOpen={isPrintModalOpen}
              onClose={() => setIsPrintModalOpen(false)}
              order={selectedOrder}
            />
          )}

          <EnterInvestigationResultDialog
            isOpen={isEnterResultOpen}
            onClose={() => setIsEnterResultOpen(false)}
            onSubmit={handleEnterResult}
            order={selectedOrder}
            tenantId={context.activeTenantId}
          />

          <VerifyInvestigationResultDialog
            isOpen={isVerifyResultOpen}
            onClose={() => setIsVerifyResultOpen(false)}
            onSubmit={handleVerifyResult}
            order={selectedOrder}
            tenantId={context.activeTenantId}
          />

          <FinalizeInvestigationReportDialog
            isOpen={isFinalizeReportOpen}
            onClose={() => setIsFinalizeReportOpen(false)}
            onSubmit={handleFinalizeReport}
            order={selectedOrder}
            tenantId={context.activeTenantId}
          />

          <ReviewInvestigationResultDialog
            isOpen={isReviewResultOpen}
            onClose={() => setIsReviewResultOpen(false)}
            onSubmit={handleReviewResult}
            order={selectedOrder}
            tenantId={context.activeTenantId}
          />

          <AmendInvestigationResultDialog
            isOpen={isAmendResultOpen}
            onClose={() => setIsAmendResultOpen(false)}
            onSubmit={handleAmendResult}
            order={selectedOrder}
            tenantId={context.activeTenantId}
          />

          <CancelInvestigationOrderDialog
            isOpen={isCancelOrderOpen}
            onClose={() => setIsCancelOrderOpen(false)}
            onSubmit={handleCancelOrder}
            order={selectedOrder}
            tenantId={context.activeTenantId}
          />


          {/* Front Desk Walk-In Billing & POS Receipt Modal */}
          {isBillingModalOpen && (
            <DirectLabBillingModal
              isOpen={isBillingModalOpen}
              initialReportOrder={billingTargetOrder}
              onClose={() => {
                setIsBillingModalOpen(false);
                setBillingTargetOrder(null);
                void loadData();
              }}
              onOrderCreated={(newOrd) => {
                setPendingDoctorLabOrders((prev) => [newOrd, ...prev]);
                setActiveTab('specimens');
                setMicroscopeSuccessToast(`✓ New Walk-In Bill #${newOrd.orderNumber} generated & pushed to Phlebotomy queue!`);
                setTimeout(() => setMicroscopeSuccessToast(null), 5000);
                void loadData();
              }}
            />
          )}

          {/* Express Direct Walk-In Test & Instant Print Modal */}
          {isWalkInReportOpen && (
            <DirectLabWalkInReportModal
              isOpen={isWalkInReportOpen}
              onClose={() => {
                setIsWalkInReportOpen(false);
                loadData();
              }}
            />
          )}

          {/* Phlebotomy Vacutainer Thermal Barcode Sticker Print Modal */}
          {isThermalStickerOpen && stickerTargetOrder && (
            <ThermalBarcodeStickerModal
              isOpen={isThermalStickerOpen}
              onClose={() => {
                setIsThermalStickerOpen(false);
                setStickerTargetOrder(null);
              }}
              order={stickerTargetOrder}
            />
          )}

          {/* Public Tamper-Proof QR Code Report Verification Modal / Screen */}
          {isPublicVerifyOpen && (
            <div style={{ position: 'fixed', inset: 0, zIndex: 99999, overflowY: 'auto' }}>
              <PublicReportVerificationView
                reportNumber={selectedOrder?.orderNumber ? `REP-${selectedOrder.orderNumber}` : 'REP-WALK-89410'}
                onClose={() => setIsPublicVerifyOpen(false)}
              />
            </div>
          )}

          {/* NABL Critical Panic Value Intimation Modal */}
          {isPanicIntimationOpen && (
            <CriticalPanicIntimationModal
              isOpen={isPanicIntimationOpen}
              order={panicTargetOrder}
              onClose={() => {
                setIsPanicIntimationOpen(false);
                setPanicTargetOrder(null);
              }}
              onIntimated={async () => {
                await loadData();
              }}
            />
          )}

          {/* Master Clinical Test Library Explorer Modal */}
          {isTestLibraryModalOpen && (
            <ClinicalTestLibraryExplorerModal
              isOpen={isTestLibraryModalOpen}
              onClose={() => setIsTestLibraryModalOpen(false)}
              onSelectForWalkIn={() => {
                setIsBillingModalOpen(true);
              }}
            />
          )}

          {/* AI Microscope Eyepiece Phone Scan (Pathology AI) */}
          {isMicroscopeScannerOpen && (
            <MicroscopeEyepieceScannerModal
              isOpen={isMicroscopeScannerOpen}
              patientName={selectedOrder ? (selectedOrder.patientName || `Patient #${selectedOrder.id?.slice(0, 6)}`) : 'Walk-in Smear Patient'}
              patientMrn={(selectedOrder as any)?.mrn || selectedOrder?.patientId || 'MRN-2026-PATH-092'}
              orderNumber={selectedOrder?.orderNumber || 'LAB-AI-SMEAR-01'}
              onClose={() => setIsMicroscopeScannerOpen(false)}
              onCommitSmearResults={(report: MicroscopeSmearReport) => {
                setMicroscopeSuccessToast(`✅ Blood Smear AI Results Committed: ${report.primaryDiagnosis} (${report.abnormalCount} abnormal cells, ${report.abnormalPercentage}%) · ICD-10: ${report.icd10}`);
                setTimeout(() => {
                  setMicroscopeSuccessToast(null);
                }, 7000);
              }}
            />
          )}

          {/* 📡 Automated Analyzer Machine (ASTM / HL7) Interface Modal */}
          {isAutoAnalyzerOpen && (
            <AutoAnalyzerSyncModal
              isOpen={isAutoAnalyzerOpen}
              onClose={() => setIsAutoAnalyzerOpen(false)}
              orders={orders}
              onCommitResults={(res) => {
                setMicroscopeSuccessToast(
                  `✓ Results from ${res.analyzerModel} committed to order! ${res.parameters.length} parameters ingested via ASTM interface.`
                );
                setTimeout(() => setMicroscopeSuccessToast(null), 6000);
                if (res.hasPanic) {
                  setOrders((prev) =>
                    prev.map((o) => {
                      if (o.id === res.orderId) {
                        return {
                          ...o,
                          isCritical: true,
                          isAbnormal: true,
                          status: 'RESULT_READY',
                          results: res.parameters.map((p, idx) => ({
                            id: `res-astm-${idx}-${Date.now()}`,
                            orderId: o.id,
                            investigationId: o.investigationId,
                            parameterCode: p.analyte.slice(0, 4).toUpperCase(),
                            parameterName: p.analyte,
                            resultValue: p.value,
                            unit: p.unit,
                            referenceRange: p.referenceRange,
                            abnormalFlag: p.isPanic ? 'CRITICAL' : 'NORMAL',
                            isCritical: p.isPanic,
                            status: 'ENTERED',
                            enteredAt: new Date().toISOString(),
                            enteredBy: `${res.analyzerModel} ASTM`
                          } as any))
                        };
                      }
                      return o;
                    })
                  );
                  setPanicCountdown(900);
                  const target = orders.find((o) => o.id === res.orderId) || orders[0] || null;
                  setPanicTargetOrder(target);
                  setIsPanicIntimationOpen(true);
                  playAudioFeedback('panic');
                }
              }}
            />
          )}

          {/* 📖 Pathology Report History Book (रजिस्टर / Diagnostic Archive) */}
          {isHistoryBookOpen && (
            <PathologyReportHistoryBookModal
              isOpen={isHistoryBookOpen}
              onClose={() => {
                setIsHistoryBookOpen(false);
                void loadData();
              }}
              onOpenBilling={(ord) => {
                setBillingTargetOrder(ord);
                setIsBillingModalOpen(true);
              }}
              onOpenPrint={(ord) => {
                setSelectedOrder(ord);
                setIsPrintModalOpen(true);
              }}
              onOpenEditReport={(ord) => {
                setEditingTargetOrder(ord);
                setIsEditReportOpen(true);
              }}
            />
          )}

          {/* ✏️ Dynamic Report Customizer & Amendment Modal */}
          {isEditReportOpen && editingTargetOrder && (
            <DynamicReportCustomizerModal
              isOpen={isEditReportOpen}
              order={editingTargetOrder}
              onClose={() => {
                setIsEditReportOpen(false);
                setEditingTargetOrder(null);
                void loadData();
              }}
              onSaved={(updated: InvestigationOrderDto) => {
                setEditingTargetOrder(null);
                setIsEditReportOpen(false);
                setMicroscopeSuccessToast(`✓ Report for ${updated.patientName || 'Patient'} updated & customized successfully!`);
                setTimeout(() => setMicroscopeSuccessToast(null), 5000);
                void loadData();
              }}
            />
          )}

          {/* ⚙️ Custom Test Library & Laboratory Branding Manager Modal */}
          {isCustomTestLibraryManagerOpen && (
            <CustomTestLibraryManagerModal
              isOpen={isCustomTestLibraryManagerOpen}
              onClose={() => {
                setIsCustomTestLibraryManagerOpen(false);
                void loadData();
              }}
              onSaved={() => {
                setMicroscopeSuccessToast('✓ Test library & lab branding preferences updated successfully!');
                setTimeout(() => setMicroscopeSuccessToast(null), 5000);
                void loadData();
              }}
            />
          )}
        </>
      )}
      </React.Suspense>
    </div>
  );
};
