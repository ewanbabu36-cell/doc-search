import React, { useState, useEffect, useCallback } from 'react';
import type {
  PharmacyOverviewDto,
  MedicationCatalogDto,
  PharmacyInventoryDto,
  PharmacyBatchDto,
  PharmacyPrescriptionDto,
  PharmacyDispensingDto,
  PharmacyStockMovementDto,
  PharmacySubstitutionRequestDto,
  PharmacyReturnDto,
  PharmacyStockAdjustmentDto,
  PharmacyAuditTraceDto,
  PanelContextDto,
  OperationalPartnerDto,
  OperationalOrganizationDto,
  OperationalFacilityDto,
  CreateMedicationRequest,
  ReceiveStockRequest,
  VerifyPrescriptionRequest,
  ReserveStockRequest,
  DispenseMedicationRequest,
  PartialDispenseMedicationRequest,
  CreateSubstitutionRequest,
  ApproveSubstitutionRequest,
  RejectSubstitutionRequest,
  CreateReturnRequest,
  CreateStockAdjustmentRequest,
  TransferStockRequest,
  BlockBatchRequest,
  UnblockBatchRequest,
  CancelPrescriptionRequest,
  ReverseDispensingRequest
} from '@docsearch/api-contracts';
import { pharmacyManagementService } from '../services/pharmacy-management-service.js';
import { partnerFoundationService } from '../services/partner-foundation-service.js';

import { PanelContextSwitcher } from './common/PanelContextSwitcher.js';
import { PharmacyOverviewView } from './views/PharmacyOverviewView.js';
import { MedicationCatalogView } from './views/MedicationCatalogView.js';
import { PharmacyPrescriptionQueueView } from './views/PharmacyPrescriptionQueueView.js';
import { PrescriptionVerificationView } from './views/PrescriptionVerificationView.js';
import { DispensingWorkbenchView } from './views/DispensingWorkbenchView.js';
import { InventoryManagementView } from './views/InventoryManagementView.js';
import { BatchExpiryView } from './views/BatchExpiryView.js';
import { StockMovementLedgerView } from './views/StockMovementLedgerView.js';
import { ReturnsAndAdjustmentsView } from './views/ReturnsAndAdjustmentsView.js';
import { PatientMedicationHistoryView } from './views/PatientMedicationHistoryView.js';
import { PharmacyReportsView } from './views/PharmacyReportsView.js';
import { PharmacyAuditVaultView } from './views/PharmacyAuditVaultView.js';

// Dialogs
import { CreateMedicationDialog } from './dialogs/CreateMedicationDialog.js';
import { ReceiveStockDialog } from './dialogs/ReceiveStockDialog.js';
import { VerifyPrescriptionDialog } from './dialogs/VerifyPrescriptionDialog.js';
import { ReserveStockDialog } from './dialogs/ReserveStockDialog.js';
import { DispenseMedicationDialog } from './dialogs/DispenseMedicationDialog.js';
import { PartialDispenseDialog } from './dialogs/PartialDispenseDialog.js';
import { SubstituteMedicationDialog } from './dialogs/SubstituteMedicationDialog.js';
import { ApproveSubstitutionDialog } from './dialogs/ApproveSubstitutionDialog.js';
import { ReturnMedicationDialog } from './dialogs/ReturnMedicationDialog.js';
import { StockAdjustmentDialog } from './dialogs/StockAdjustmentDialog.js';
import { TransferStockDialog } from './dialogs/TransferStockDialog.js';
import { BlockBatchDialog } from './dialogs/BlockBatchDialog.js';
import { UnblockBatchDialog } from './dialogs/UnblockBatchDialog.js';
import { ReverseDispensingDialog } from './dialogs/ReverseDispensingDialog.js';
import { CancelPrescriptionDialog } from './dialogs/CancelPrescriptionDialog.js';

import { Tabs, Spinner, ErrorState } from '@docsearch/ui-kit';

export type ActivePharmacyTab =
  | 'overview'
  | 'catalog'
  | 'prescriptions'
  | 'verify'
  | 'dispense'
  | 'inventory'
  | 'expiry'
  | 'movements'
  | 'returns'
  | 'patientHistory'
  | 'reports'
  | 'audit';

export const PharmacyDomainManager: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActivePharmacyTab>('overview');
  const [context, setContext] = useState<PanelContextDto | null>(null);
  const [partners, setPartners] = useState<OperationalPartnerDto[]>([]);
  const [organizations, setOrganizations] = useState<OperationalOrganizationDto[]>([]);
  const [facilities, setFacilities] = useState<OperationalFacilityDto[]>([]);

  // Pharmacy Domain State
  const [overview, setOverview] = useState<PharmacyOverviewDto | null>(null);
  const [catalog, setCatalog] = useState<MedicationCatalogDto[]>([]);
  const [inventory, setInventory] = useState<PharmacyInventoryDto[]>([]);
  const [batches, setBatches] = useState<PharmacyBatchDto[]>([]);
  const [prescriptions, setPrescriptions] = useState<PharmacyPrescriptionDto[]>([]);
  const [dispensingRecords, setDispensingRecords] = useState<PharmacyDispensingDto[]>([]);
  const [movements, setMovements] = useState<PharmacyStockMovementDto[]>([]);
  const [substitutions, setSubstitutions] = useState<PharmacySubstitutionRequestDto[]>([]);
  const [returns, setReturns] = useState<PharmacyReturnDto[]>([]);
  const [adjustments, setAdjustments] = useState<PharmacyStockAdjustmentDto[]>([]);
  const [audits, setAudits] = useState<PharmacyAuditTraceDto[]>([]);

  const [selectedPrescriptionId, setSelectedPrescriptionId] = useState<string | null>(null);
  const [selectedDispensing, setSelectedDispensing] = useState<PharmacyDispensingDto | null>(null);
  const [selectedBatch, setSelectedBatch] = useState<PharmacyBatchDto | null>(null);
  const [selectedSubReq, setSelectedSubReq] = useState<PharmacySubstitutionRequestDto | null>(null);

  // Dialog Controls
  const [isCreateMedOpen, setIsCreateMedOpen] = useState(false);
  const [isReceiveStockOpen, setIsReceiveStockOpen] = useState(false);
  const [isVerifyOpen, setIsVerifyOpen] = useState(false);
  const [isReserveStockOpen, setIsReserveStockOpen] = useState(false);
  const [isDispenseOpen, setIsDispenseOpen] = useState(false);
  const [isPartialDispenseOpen, setIsPartialDispenseOpen] = useState(false);
  const [isSubstituteOpen, setIsSubstituteOpen] = useState(false);
  const [isApproveSubOpen, setIsApproveSubOpen] = useState(false);
  const [isReturnOpen, setIsReturnOpen] = useState(false);
  const [isAdjustmentOpen, setIsAdjustmentOpen] = useState(false);
  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [isBlockBatchOpen, setIsBlockBatchOpen] = useState(false);
  const [isUnblockBatchOpen, setIsUnblockBatchOpen] = useState(false);
  const [isReverseDispenseOpen, setIsReverseDispenseOpen] = useState(false);
  const [isCancelRxOpen, setIsCancelRxOpen] = useState(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const ctx = await partnerFoundationService.getPanelContext();
      setContext(ctx);

      const [pList, orgList, facList] = await Promise.all([
        partnerFoundationService.getPartners(ctx.activeTenantId),
        partnerFoundationService.getOrganizations(ctx.activeTenantId),
        partnerFoundationService.getFacilities(ctx.activeTenantId)
      ]);
      setPartners(pList);
      setOrganizations(orgList);
      setFacilities(facList);

      const [
        overviewData,
        catalogData,
        inventoryData,
        batchData,
        rxData,
        movData,
        subData,
        returnData,
        adjData,
        auditData
      ] = await Promise.all([
        pharmacyManagementService.getOverview(ctx.activeTenantId, ctx.activeFacilityId),
        pharmacyManagementService.getMedicationCatalog(ctx.activeTenantId),
        pharmacyManagementService.getInventory(ctx.activeTenantId, ctx.activeFacilityId),
        pharmacyManagementService.getBatches(ctx.activeTenantId, ctx.activeFacilityId),
        pharmacyManagementService.getPrescriptionQueue({
          tenantId: ctx.activeTenantId,
          branchId: ctx.activeFacilityId,
          pageIndex: 0,
          pageSize: 100
        }),
        pharmacyManagementService.getStockMovements(ctx.activeTenantId, ctx.activeFacilityId),
        pharmacyManagementService.getSubstitutionRequests(ctx.activeTenantId, ctx.activeFacilityId),
        pharmacyManagementService.getReturns(ctx.activeTenantId, ctx.activeFacilityId),
        pharmacyManagementService.getAdjustments(ctx.activeTenantId, ctx.activeFacilityId),
        pharmacyManagementService.getAuditTraces({
          tenantId: ctx.activeTenantId,
          branchId: ctx.activeFacilityId,
          pageIndex: 0,
          pageSize: 100
        })
      ]);

      setOverview(overviewData);
      setCatalog(catalogData);
      setInventory(inventoryData);
      setBatches(batchData);
      setPrescriptions(rxData);
      setMovements(movData);
      setSubstitutions(subData);
      setReturns(returnData);
      setAdjustments(adjData);
      setAudits(auditData);

      // Load dispensing history
      const patientHist = await pharmacyManagementService.getPatientMedicationHistory(ctx.activeTenantId, '55555555-1111-4555-8555-111111111101');
      setDispensingRecords(patientHist.dispensing);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load pharmacy domain data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const handleContextChange = async (newContext: Partial<PanelContextDto>) => {
    try {
      setLoading(true);
      const updated = await partnerFoundationService.setPanelContext(newContext);
      setContext(updated);
      await loadData();
    } catch (err) {
      console.error('Failed to change context:', err);
    } finally {
      setLoading(false);
    }
  };

  // Handlers
  const handleCreateMedication = async (req: CreateMedicationRequest) => {
    await pharmacyManagementService.createMedication(req);
    await loadData();
  };

  const handleReceiveStock = async (req: ReceiveStockRequest) => {
    await pharmacyManagementService.receiveStock(req);
    await loadData();
  };

  const handleVerifyPrescription = async (req: VerifyPrescriptionRequest) => {
    await pharmacyManagementService.verifyPrescription(req);
    await loadData();
  };

  const handleReserveStock = async (req: ReserveStockRequest) => {
    await pharmacyManagementService.reserveStock(req);
    await loadData();
  };

  const handleDispenseMedication = async (req: DispenseMedicationRequest) => {
    await pharmacyManagementService.dispenseMedication(req);
    await loadData();
  };

  const handlePartialDispense = async (req: PartialDispenseMedicationRequest) => {
    await pharmacyManagementService.partialDispenseMedication(req);
    await loadData();
  };

  const handleCreateSubstitution = async (req: CreateSubstitutionRequest) => {
    await pharmacyManagementService.createSubstitutionRequest(req);
    await loadData();
  };

  const handleApproveSubstitution = async (req: ApproveSubstitutionRequest) => {
    await pharmacyManagementService.approveSubstitution(req);
    await loadData();
  };

  const handleRejectSubstitution = async (req: RejectSubstitutionRequest) => {
    await pharmacyManagementService.rejectSubstitution(req);
    await loadData();
  };

  const handleCreateReturn = async (req: CreateReturnRequest) => {
    await pharmacyManagementService.createReturn(req);
    await loadData();
  };

  const handleCreateAdjustment = async (req: CreateStockAdjustmentRequest) => {
    await pharmacyManagementService.createStockAdjustment(req);
    await loadData();
  };

  const handleTransferStock = async (req: TransferStockRequest) => {
    await pharmacyManagementService.transferStock(req);
    await loadData();
  };

  const handleBlockBatch = async (req: BlockBatchRequest) => {
    await pharmacyManagementService.blockBatch(req);
    await loadData();
  };

  const handleUnblockBatch = async (req: UnblockBatchRequest) => {
    await pharmacyManagementService.unblockBatch(req);
    await loadData();
  };

  const handleCancelPrescription = async (req: CancelPrescriptionRequest) => {
    await pharmacyManagementService.cancelPrescription(req);
    await loadData();
  };

  const handleReverseDispensing = async (req: ReverseDispensingRequest) => {
    await pharmacyManagementService.reverseDispensing(req);
    await loadData();
  };

  const selectedPrescription = prescriptions.find((p) => p.id === selectedPrescriptionId) || prescriptions[0] || null;

  const tabs = [
    { id: 'overview', label: '📊 Pharmacy Overview' },
    { id: 'catalog', label: '📚 Master Catalog' },
    { id: 'prescriptions', label: `📋 Queue (${prescriptions.filter((p) => p.status !== 'COMPLETED' && p.status !== 'CANCELLED').length})` },
    { id: 'verify', label: '🔬 Verification' },
    { id: 'dispense', label: '💊 Dispensing' },
    { id: 'inventory', label: '📦 Stock Inventory' },
    { id: 'expiry', label: '⏳ Expiry & FEFO' },
    { id: 'movements', label: '📑 Stock Ledger' },
    { id: 'returns', label: `⚖️ Substitutions & Returns (${substitutions.filter((s) => s.status === 'PENDING_APPROVAL').length})` },
    { id: 'patientHistory', label: '👤 Patient History' },
    { id: 'reports', label: '📈 Reports' },
    { id: 'audit', label: '🔒 Audit Vault' }
  ];

  if (!context && loading) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center' }}>
        <Spinner size="lg" />
        <p style={{ marginTop: '1rem', color: '#64748b' }}>Initializing Pharmacy Domain & Operational Hierarchy...</p>
      </div>
    );
  }

  if (error && !overview) {
    return <ErrorState title="Pharmacy Domain Error" message={error} onRetry={loadData} />;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '24px' }}>
      {/* Context Switcher */}
      {context && (
        <PanelContextSwitcher
          context={context}
          partners={partners}
          organizations={organizations}
          facilities={facilities}
          onContextChange={handleContextChange}
        />
      )}

      {/* Tabs */}
      <Tabs
        tabs={tabs}
        activeTabId={activeTab}
        onTabChange={(tabId) => setActiveTab(tabId as ActivePharmacyTab)}
      />

      {/* Tab Content */}
      {loading ? (
        <div style={{ padding: '2rem', textAlign: 'center' }}>
          <Spinner size="md" />
        </div>
      ) : (
        <>
          {activeTab === 'overview' && overview && (
            <PharmacyOverviewView
              overview={overview}
              prescriptions={prescriptions}
              inventory={inventory}
              batches={batches}
              onOpenReceiveStock={() => setIsReceiveStockOpen(true)}
              onSelectPrescription={(id) => {
                setSelectedPrescriptionId(id);
                setActiveTab('dispense');
              }}
              onOpenTab={(tab) => setActiveTab(tab as ActivePharmacyTab)}
            />
          )}

          {activeTab === 'catalog' && (
            <MedicationCatalogView
              catalog={catalog}
              onOpenCreateMedication={() => setIsCreateMedOpen(true)}
            />
          )}

          {activeTab === 'prescriptions' && (
            <PharmacyPrescriptionQueueView
              prescriptions={prescriptions}
              onSelectPrescription={(id) => {
                setSelectedPrescriptionId(id);
                setActiveTab('dispense');
              }}
              onOpenVerifyDialog={(rx) => {
                setSelectedPrescriptionId(rx.id);
                setIsVerifyOpen(true);
              }}
              onOpenDispenseDialog={(rx) => {
                setSelectedPrescriptionId(rx.id);
                setIsDispenseOpen(true);
              }}
              onOpenCancelDialog={(rx) => {
                setSelectedPrescriptionId(rx.id);
                setIsCancelRxOpen(true);
              }}
            />
          )}

          {activeTab === 'verify' && (
            <PrescriptionVerificationView
              prescription={selectedPrescription}
              batches={batches}
              onVerify={(rx) => {
                setSelectedPrescriptionId(rx.id);
                setIsVerifyOpen(true);
              }}
              onRequestSubstitution={(rx) => {
                setSelectedPrescriptionId(rx.id);
                setIsSubstituteOpen(true);
              }}
              onReserveStock={(rx) => {
                setSelectedPrescriptionId(rx.id);
                setIsReserveStockOpen(true);
              }}
              onBackToQueue={() => setActiveTab('prescriptions')}
            />
          )}

          {activeTab === 'dispense' && (
            <DispensingWorkbenchView
              prescription={selectedPrescription}
              dispensingRecords={dispensingRecords}
              batches={batches}
              onOpenDispenseDialog={(rx) => {
                setSelectedPrescriptionId(rx.id);
                setIsDispenseOpen(true);
              }}
              onOpenPartialDispenseDialog={(rx) => {
                setSelectedPrescriptionId(rx.id);
                setIsPartialDispenseOpen(true);
              }}
              onOpenReturnDialog={(dsp) => {
                setSelectedDispensing(dsp);
                setIsReturnOpen(true);
              }}
              onOpenReverseDialog={(dsp) => {
                setSelectedDispensing(dsp);
                setIsReverseDispenseOpen(true);
              }}
              onBackToQueue={() => setActiveTab('prescriptions')}
            />
          )}

          {activeTab === 'inventory' && (
            <InventoryManagementView
              inventory={inventory}
              onOpenReceiveStock={() => setIsReceiveStockOpen(true)}
              onOpenStockAdjustment={() => setIsAdjustmentOpen(true)}
              onOpenTransferStock={() => setIsTransferOpen(true)}
            />
          )}

          {activeTab === 'expiry' && (
            <BatchExpiryView
              batches={batches}
              onOpenBlockDialog={(b) => {
                setSelectedBatch(b);
                setIsBlockBatchOpen(true);
              }}
              onOpenUnblockDialog={(b) => {
                setSelectedBatch(b);
                setIsUnblockBatchOpen(true);
              }}
            />
          )}

          {activeTab === 'movements' && (
            <StockMovementLedgerView movements={movements} />
          )}

          {activeTab === 'returns' && (
            <ReturnsAndAdjustmentsView
              returns={returns}
              adjustments={adjustments}
              substitutions={substitutions}
              onOpenStockAdjustment={() => setIsAdjustmentOpen(true)}
              onApproveSubstitution={(sub) => {
                setSelectedSubReq(sub);
                setIsApproveSubOpen(true);
              }}
              onRejectSubstitution={(sub) => {
                handleRejectSubstitution({
                  tenantId: context?.activeTenantId || '',
                  requestId: sub.id,
                  rejectedByDoctorId: 'aaaa1111-1111-4aaa-8aaa-111111111101',
                  rejectionReason: 'Alternative formulation not therapeutically indicated.',
                  actorId: 'dr.sarah.jenkins@docsearch.docsearch.health',
                  actorRole: 'ATTENDING_DOCTOR',
                  justification: 'Physician review rejected substitution.'
                });
              }}
            />
          )}

          {activeTab === 'patientHistory' && (
            <PatientMedicationHistoryView
              prescriptions={prescriptions}
              dispensing={dispensingRecords}
            />
          )}

          {activeTab === 'reports' && overview && (
            <PharmacyReportsView
              overview={overview}
              inventory={inventory}
              batches={batches}
              prescriptions={prescriptions}
            />
          )}

          {activeTab === 'audit' && (
            <PharmacyAuditVaultView auditTraces={audits} />
          )}
        </>
      )}

      {/* Dialog Modals */}
      {context && (
        <>
          <CreateMedicationDialog
            isOpen={isCreateMedOpen}
            onClose={() => setIsCreateMedOpen(false)}
            onSubmit={handleCreateMedication}
            tenantId={context.activeTenantId}
            partnerId={context.activePartnerId}
            organizationId={context.activeOrganizationId || ''}
            branchId={context.activeFacilityId}
          />

          <ReceiveStockDialog
            isOpen={isReceiveStockOpen}
            onClose={() => setIsReceiveStockOpen(false)}
            onSubmit={handleReceiveStock}
            medications={catalog}
            tenantId={context.activeTenantId}
            partnerId={context.activePartnerId}
            organizationId={context.activeOrganizationId || ''}
            branchId={context.activeFacilityId || ''}
          />

          <VerifyPrescriptionDialog
            isOpen={isVerifyOpen}
            onClose={() => setIsVerifyOpen(false)}
            onSubmit={handleVerifyPrescription}
            prescription={selectedPrescription}
            tenantId={context.activeTenantId}
          />

          <ReserveStockDialog
            isOpen={isReserveStockOpen}
            onClose={() => setIsReserveStockOpen(false)}
            onSubmit={handleReserveStock}
            prescription={selectedPrescription}
            batches={batches}
            tenantId={context.activeTenantId}
          />

          <DispenseMedicationDialog
            isOpen={isDispenseOpen}
            onClose={() => setIsDispenseOpen(false)}
            onSubmit={handleDispenseMedication}
            prescription={selectedPrescription}
            batches={batches}
            tenantId={context.activeTenantId}
            partnerId={context.activePartnerId}
            organizationId={context.activeOrganizationId || ''}
            branchId={context.activeFacilityId || ''}
          />

          <PartialDispenseDialog
            isOpen={isPartialDispenseOpen}
            onClose={() => setIsPartialDispenseOpen(false)}
            onSubmit={handlePartialDispense}
            prescription={selectedPrescription}
            batches={batches}
            tenantId={context.activeTenantId}
            partnerId={context.activePartnerId}
            organizationId={context.activeOrganizationId || ''}
            branchId={context.activeFacilityId || ''}
          />

          <SubstituteMedicationDialog
            isOpen={isSubstituteOpen}
            onClose={() => setIsSubstituteOpen(false)}
            onSubmit={handleCreateSubstitution}
            prescription={selectedPrescription}
            catalog={catalog}
            tenantId={context.activeTenantId}
            partnerId={context.activePartnerId}
            organizationId={context.activeOrganizationId || ''}
            branchId={context.activeFacilityId || ''}
          />

          <ApproveSubstitutionDialog
            isOpen={isApproveSubOpen}
            onClose={() => setIsApproveSubOpen(false)}
            onSubmit={handleApproveSubstitution}
            substitutionRequest={selectedSubReq}
            tenantId={context.activeTenantId}
          />

          <ReturnMedicationDialog
            isOpen={isReturnOpen}
            onClose={() => setIsReturnOpen(false)}
            onSubmit={handleCreateReturn}
            dispensing={selectedDispensing}
            tenantId={context.activeTenantId}
            partnerId={context.activePartnerId}
            organizationId={context.activeOrganizationId || ''}
            branchId={context.activeFacilityId || ''}
          />

          <StockAdjustmentDialog
            isOpen={isAdjustmentOpen}
            onClose={() => setIsAdjustmentOpen(false)}
            onSubmit={handleCreateAdjustment}
            batches={batches}
            tenantId={context.activeTenantId}
            partnerId={context.activePartnerId}
            organizationId={context.activeOrganizationId || ''}
            branchId={context.activeFacilityId || ''}
          />

          <TransferStockDialog
            isOpen={isTransferOpen}
            onClose={() => setIsTransferOpen(false)}
            onSubmit={handleTransferStock}
            batches={batches}
            tenantId={context.activeTenantId}
            partnerId={context.activePartnerId}
            organizationId={context.activeOrganizationId || ''}
            sourceBranchId={context.activeFacilityId || ''}
          />

          <BlockBatchDialog
            isOpen={isBlockBatchOpen}
            onClose={() => setIsBlockBatchOpen(false)}
            onSubmit={handleBlockBatch}
            batch={selectedBatch}
            tenantId={context.activeTenantId}
          />

          <UnblockBatchDialog
            isOpen={isUnblockBatchOpen}
            onClose={() => setIsUnblockBatchOpen(false)}
            onSubmit={handleUnblockBatch}
            batch={selectedBatch}
            tenantId={context.activeTenantId}
          />

          <ReverseDispensingDialog
            isOpen={isReverseDispenseOpen}
            onClose={() => setIsReverseDispenseOpen(false)}
            onSubmit={handleReverseDispensing}
            dispensing={selectedDispensing}
            tenantId={context.activeTenantId}
          />

          <CancelPrescriptionDialog
            isOpen={isCancelRxOpen}
            onClose={() => setIsCancelRxOpen(false)}
            onSubmit={handleCancelPrescription}
            prescription={selectedPrescription}
            tenantId={context.activeTenantId}
          />
        </>
      )}
    </div>
  );
};
