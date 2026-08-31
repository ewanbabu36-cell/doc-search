import React, { useState, useEffect, useCallback } from 'react';
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

import { PanelContextSwitcher } from './common/PanelContextSwitcher.js';
import { InvestigationOverviewView } from './views/InvestigationOverviewView.js';
import { InvestigationCatalogView } from './views/InvestigationCatalogView.js';
import { InvestigationOrderDirectoryView } from './views/InvestigationOrderDirectoryView.js';
import { SpecimenCollectionView } from './views/SpecimenCollectionView.js';
import { InvestigationProcessingView } from './views/InvestigationProcessingView.js';
import { InvestigationResultView } from './views/InvestigationResultView.js';
import { InvestigationReportView } from './views/InvestigationReportView.js';
import { PhysicianInvestigationReviewView } from './views/PhysicianInvestigationReviewView.js';
import { PatientInvestigationHistoryView } from './views/PatientInvestigationHistoryView.js';
import { CriticalResultCenterView } from './views/CriticalResultCenterView.js';
import { InvestigationAuditVaultView } from './views/InvestigationAuditVaultView.js';

// Dialogs
import { CreateInvestigationOrderDialog } from './dialogs/CreateInvestigationOrderDialog.js';
import { SelectInvestigationDialog } from './dialogs/SelectInvestigationDialog.js';
import { CreateInvestigationPanelDialog } from './dialogs/CreateInvestigationPanelDialog.js';
import { CollectSpecimenDialog } from './dialogs/CollectSpecimenDialog.js';
import { RejectSpecimenDialog } from './dialogs/RejectSpecimenDialog.js';
import { EnterInvestigationResultDialog } from './dialogs/EnterInvestigationResultDialog.js';
import { PrintablePathologyReportModal } from './dialogs/PrintablePathologyReportModal.js';
import { VerifyInvestigationResultDialog } from './dialogs/VerifyInvestigationResultDialog.js';
import { FinalizeInvestigationReportDialog } from './dialogs/FinalizeInvestigationReportDialog.js';
import { ReviewInvestigationResultDialog } from './dialogs/ReviewInvestigationResultDialog.js';
import { AmendInvestigationResultDialog } from './dialogs/AmendInvestigationResultDialog.js';
import { CancelInvestigationOrderDialog } from './dialogs/CancelInvestigationOrderDialog.js';

import { Tabs, Spinner, ErrorState } from '@docsearch/ui-kit';

export type ActiveInvestigationTab =
  | 'overview'
  | 'catalog'
  | 'orders'
  | 'specimens'
  | 'processing'
  | 'results'
  | 'reports'
  | 'doctorReview'
  | 'patientHistory'
  | 'critical'
  | 'audit';

export const ClinicalInvestigationDomainManager: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveInvestigationTab>('overview');
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
  const [isVerifyResultOpen, setIsVerifyResultOpen] = useState(false);
  const [isFinalizeReportOpen, setIsFinalizeReportOpen] = useState(false);
  const [isReviewResultOpen, setIsReviewResultOpen] = useState(false);
  const [isAmendResultOpen, setIsAmendResultOpen] = useState(false);
  const [isCancelOrderOpen, setIsCancelOrderOpen] = useState(false);

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
  };

  const handleFinalizeReport = async (req: FinalizeInvestigationReportRequest) => {
    await clinicalInvestigationService.finalizeReport(req);
    await loadData();
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
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
        <Spinner size="lg" />
      </div>
    );
  }

  if (error && !context) {
    return (
      <div style={{ padding: '24px' }}>
        <ErrorState title="Clinical Investigation System Error" message={error} onRetry={loadData} />
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {context && (
        <PanelContextSwitcher
          context={context}
          partners={partners}
          organizations={organizations}
          facilities={facilities}
          onContextChange={handleContextChange}
        />
      )}

      {/* Navigation tabs */}
      <Tabs
        tabs={[
          { id: 'overview', label: '📊 Operations Overview' },
          { id: 'catalog', label: `📚 Catalog (${catalog.length})` },
          { id: 'orders', label: `📋 Orders Directory (${orders.length})` },
          { id: 'specimens', label: `🩸 Phlebotomy Station (${orders.filter((o) => o.status === 'SAMPLE_REQUIRED' || o.status === 'ORDERED').length})` },
          { id: 'processing', label: `⚙️ Lab Processing (${orders.filter((o) => o.status === 'PROCESSING').length})` },
          { id: 'results', label: '🔬 Result Verification' },
          { id: 'reports', label: '📄 Diagnostic Reports' },
          { id: 'doctorReview', label: `👨‍⚕️ Physician Review (${orders.filter((o) => o.status === 'VERIFIED').length})` },
          { id: 'patientHistory', label: '🕰️ Patient History' },
          { id: 'critical', label: `🚨 Critical Panic (${orders.filter((o) => o.isCritical).length})` },
          { id: 'audit', label: '🔒 Audit Vault' }
        ]}
        activeTabId={activeTab}
        onTabChange={(tabId: string) => setActiveTab(tabId as ActiveInvestigationTab)}
      />

      {/* Active Tab View */}
      {activeTab === 'overview' && overview && (
        <InvestigationOverviewView
          overview={overview}
          orders={orders}
          onOpenNewOrder={() => setIsCreateOrderOpen(true)}
          onSelectOrder={handleSelectOrderById}
          onOpenTab={(tab) => setActiveTab(tab as ActiveInvestigationTab)}
          onOpenPrint={(ord) => {
            setSelectedOrder(ord);
            setIsPrintModalOpen(true);
          }}
        />
      )}

      {activeTab === 'catalog' && (
        <InvestigationCatalogView
          catalog={catalog}
          panels={panels}
          onOpenCreateInvestigation={() => setIsSelectInvestigationOpen(true)}
          onOpenCreatePanel={() => setIsCreatePanelOpen(true)}
        />
      )}

      {activeTab === 'orders' && (
        <InvestigationOrderDirectoryView
          orders={orders}
          onSelectOrder={handleSelectOrderById}
          onOpenCreateOrder={() => setIsCreateOrderOpen(true)}
          onCancelOrder={(ord) => {
            setSelectedOrder(ord);
            setIsCancelOrderOpen(true);
          }}
          onOpenPrint={(ord) => {
            setSelectedOrder(ord);
            setIsPrintModalOpen(true);
          }}
        />
      )}

      {activeTab === 'specimens' && (
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
        />
      )}

      {activeTab === 'processing' && (
        <InvestigationProcessingView
          orders={orders}
          onSubmitResults={handleEnterResult}
          onSelectOrder={handleSelectOrderById}
          onOpenPrint={(ord) => {
            setSelectedOrder(ord);
            setIsPrintModalOpen(true);
          }}
        />
      )}

      {activeTab === 'results' && (
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
          onOpenPrint={(ord) => {
            setSelectedOrder(ord);
            setIsPrintModalOpen(true);
          }}
        />
      )}

      {activeTab === 'reports' && (
        <InvestigationReportView
          orders={orders}
          onFinalizeReport={(ord) => {
            setSelectedOrder(ord);
            setIsFinalizeReportOpen(true);
          }}
        />
      )}

      {activeTab === 'doctorReview' && (
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
      )}

      {activeTab === 'patientHistory' && (
        <PatientInvestigationHistoryView
          orders={orders}
          onSelectOrder={handleSelectOrderById}
        />
      )}

      {activeTab === 'critical' && (
        <CriticalResultCenterView
          orders={orders}
          onReviewOrder={(ord) => {
            setSelectedOrder(ord);
            setIsReviewResultOpen(true);
          }}
          onSelectOrder={handleSelectOrderById}
        />
      )}

      {activeTab === 'audit' && (
        <InvestigationAuditVaultView auditTraces={auditTraces} />
      )}

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
        </>
      )}
    </div>
  );
};
