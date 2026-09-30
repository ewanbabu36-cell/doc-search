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
import { getUnifiedPartnerProfile } from '../utils/roleProfileResolver.js';

import { PanelContextSwitcher } from './common/PanelContextSwitcher.js';
import { pharmacyRevenueGallaService } from '../services/pharmacy-revenue-galla-service.js';
import { cdscoInspectionAuditService } from '../services/cdsco-inspection-audit-service.js';
import { pharmacyOfflineStorageService } from '../services/pharmacy-offline-storage-service.js';
import { pharmacySyncEngine } from '../services/pharmacy-sync-engine.js';
import { serviceWorkerCompanion } from '../services/service-worker-companion.js';
import type { HospitalStaffUser } from './auth/HospitalStaffLogin.js';
import { hospitalEventBus, type ActivePatientSummary, type HospitalEventPayload } from '../services/hospital-event-bus.js';
import type { ParsedWholesaleInvoice } from '../services/wholesale-invoice-parser.js';

// Lazy-loaded Views for ultra-fast, granular chunk streaming
const PharmacyOverviewView = React.lazy(() => import('./views/PharmacyOverviewView.js').then(m => ({ default: m.PharmacyOverviewView })));
const MedicationCatalogView = React.lazy(() => import('./views/MedicationCatalogView.js').then(m => ({ default: m.MedicationCatalogView })));
const PharmacyPrescriptionQueueView = React.lazy(() => import('./views/PharmacyPrescriptionQueueView.js').then(m => ({ default: m.PharmacyPrescriptionQueueView })));
const PrescriptionVerificationView = React.lazy(() => import('./views/PrescriptionVerificationView.js').then(m => ({ default: m.PrescriptionVerificationView })));
const DispensingWorkbenchView = React.lazy(() => import('./views/DispensingWorkbenchView.js').then(m => ({ default: m.DispensingWorkbenchView })));
const InventoryManagementView = React.lazy(() => import('./views/InventoryManagementView.js').then(m => ({ default: m.InventoryManagementView })));
const BatchExpiryView = React.lazy(() => import('./views/BatchExpiryView.js').then(m => ({ default: m.BatchExpiryView })));
const StockMovementLedgerView = React.lazy(() => import('./views/StockMovementLedgerView.js').then(m => ({ default: m.StockMovementLedgerView })));
const ReturnsAndAdjustmentsView = React.lazy(() => import('./views/ReturnsAndAdjustmentsView.js').then(m => ({ default: m.ReturnsAndAdjustmentsView })));
const PatientMedicationHistoryView = React.lazy(() => import('./views/PatientMedicationHistoryView.js').then(m => ({ default: m.PatientMedicationHistoryView })));
const PharmacyReportsView = React.lazy(() => import('./views/PharmacyReportsView.js').then(m => ({ default: m.PharmacyReportsView })));
const FastPharmacyPosCounterView = React.lazy(() => import('./views/FastPharmacyPosCounterView.js').then(m => ({ default: m.FastPharmacyPosCounterView })));
const PharmacyRevenueGallaDeskView = React.lazy(() => import('./views/PharmacyRevenueGallaDeskView.js').then(m => ({ default: m.PharmacyRevenueGallaDeskView })));
const PharmacyCustomerKhataDeskView = React.lazy(() => import('./views/PharmacyCustomerKhataDeskView.js').then(m => ({ default: m.PharmacyCustomerKhataDeskView })));
const EpidemicOutbreakRadarView = React.lazy(() => import('./views/EpidemicOutbreakRadarView.js').then(m => ({ default: m.EpidemicOutbreakRadarView })));
const CdscoDrugInspectorAuditVaultView = React.lazy(() => import('./views/CdscoDrugInspectorAuditVaultView.js').then(m => ({ default: m.CdscoDrugInspectorAuditVaultView })));

// Lazy-loaded Dialogs
const PharmacyOfflineSyncModal = React.lazy(() => import('./dialogs/PharmacyOfflineSyncModal.js').then(m => ({ default: m.PharmacyOfflineSyncModal })));
const CreateMedicationDialog = React.lazy(() => import('./dialogs/CreateMedicationDialog.js').then(m => ({ default: m.CreateMedicationDialog })));
const ReceiveStockDialog = React.lazy(() => import('./dialogs/ReceiveStockDialog.js').then(m => ({ default: m.ReceiveStockDialog })));
const WholesaleInvoiceUploadModal = React.lazy(() => import('./dialogs/WholesaleInvoiceUploadModal.js').then(m => ({ default: m.WholesaleInvoiceUploadModal })));
const VerifyPrescriptionDialog = React.lazy(() => import('./dialogs/VerifyPrescriptionDialog.js').then(m => ({ default: m.VerifyPrescriptionDialog })));
const ReserveStockDialog = React.lazy(() => import('./dialogs/ReserveStockDialog.js').then(m => ({ default: m.ReserveStockDialog })));
const DispenseMedicationDialog = React.lazy(() => import('./dialogs/DispenseMedicationDialog.js').then(m => ({ default: m.DispenseMedicationDialog })));
const PartialDispenseDialog = React.lazy(() => import('./dialogs/PartialDispenseDialog.js').then(m => ({ default: m.PartialDispenseDialog })));
const SubstituteMedicationDialog = React.lazy(() => import('./dialogs/SubstituteMedicationDialog.js').then(m => ({ default: m.SubstituteMedicationDialog })));
const ApproveSubstitutionDialog = React.lazy(() => import('./dialogs/ApproveSubstitutionDialog.js').then(m => ({ default: m.ApproveSubstitutionDialog })));
const ReturnMedicationDialog = React.lazy(() => import('./dialogs/ReturnMedicationDialog.js').then(m => ({ default: m.ReturnMedicationDialog })));
const StockAdjustmentDialog = React.lazy(() => import('./dialogs/StockAdjustmentDialog.js').then(m => ({ default: m.StockAdjustmentDialog })));
const TransferStockDialog = React.lazy(() => import('./dialogs/TransferStockDialog.js').then(m => ({ default: m.TransferStockDialog })));
const BlockBatchDialog = React.lazy(() => import('./dialogs/BlockBatchDialog.js').then(m => ({ default: m.BlockBatchDialog })));
const UnblockBatchDialog = React.lazy(() => import('./dialogs/UnblockBatchDialog.js').then(m => ({ default: m.UnblockBatchDialog })));
const ReverseDispensingDialog = React.lazy(() => import('./dialogs/ReverseDispensingDialog.js').then(m => ({ default: m.ReverseDispensingDialog })));
const CancelPrescriptionDialog = React.lazy(() => import('./dialogs/CancelPrescriptionDialog.js').then(m => ({ default: m.CancelPrescriptionDialog })));

import { ErrorState, Dialog, Button, Badge, EffectIntensityProvider, SkeletonPage, SkeletonTable } from '@docsearch/ui-kit';

export interface PharmacyDomainManagerProps {
  currentUser?: HospitalStaffUser | undefined;
  initialTab?: ActivePharmacyTab;
  onTabChange?: (tab: ActivePharmacyTab) => void;
}

export type ActivePharmacyTab =
  | 'pos'
  | 'revenue'
  | 'prescriptions'
  | 'inventory'
  | 'outbreakRadar'
  | 'compliance'
  | 'overview'
  | 'catalog'
  | 'verify'
  | 'dispense'
  | 'expiry'
  | 'movements'
  | 'returns'
  | 'patientHistory'
  | 'reports'
  | 'audit'
  | 'auditVault'
  | 'narcotics'
  | 'khata';

export const PharmacyDomainManager: React.FC<PharmacyDomainManagerProps> = ({
  currentUser,
  initialTab,
  onTabChange
}) => {
  const [activeTab, setActiveTab] = useState<ActivePharmacyTab>(initialTab || 'pos');
  const [isScopeExpanded, setIsScopeExpanded] = useState(false);

  useEffect(() => {
    if (initialTab && initialTab !== activeTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);
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
  const [posPreloadBatch, setPosPreloadBatch] = useState<PharmacyBatchDto | null>(null);
  const [posPreloadPrescriptionId, setPosPreloadPrescriptionId] = useState<string | null>(null);
  const [activePatient, setActivePatient] = useState<ActivePatientSummary | null>(() => hospitalEventBus.getActivePatient());

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

  // Dialog Controls
  const [isCreateMedOpen, setIsCreateMedOpen] = useState(false);
  const [isReceiveStockOpen, setIsReceiveStockOpen] = useState(false);
  const [isWholesaleUploadOpen, setIsWholesaleUploadOpen] = useState(false);
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
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [resetMode, setResetMode] = useState<'CLEAR_ALL' | 'RESET_FORMULARY'>('CLEAR_ALL');

  // 📡 Offline PWA & Background Sync State
  const [isOfflineSyncModalOpen, setIsOfflineSyncModalOpen] = useState(false);
  const [isStationOffline, setIsStationOffline] = useState(() => pharmacyOfflineStorageService.isOffline());
  const [pendingOfflineBills, setPendingOfflineBills] = useState(0);

  useEffect(() => {
    void serviceWorkerCompanion.register();
    void pharmacySyncEngine.triggerSyncIfPending();

    const unsub = pharmacyOfflineStorageService.subscribeStatus((off) => {
      setIsStationOffline(off);
      void pharmacyOfflineStorageService.getPendingSyncCount().then(setPendingOfflineBills);
    });
    void pharmacyOfflineStorageService.getPendingSyncCount().then(setPendingOfflineBills);
    return unsub;
  }, []);

  // 💰 Live Pharmacy Revenue Telemetry (Today's Collection)
  const [todayRevenue, setTodayRevenue] = useState<number>(() => {
    try {
      return pharmacyRevenueGallaService.getRevenueSummary('TODAY').today.amount;
    } catch {
      return 0;
    }
  });

  useEffect(() => {
    const handleRevenueUpdate = () => {
      try {
        const fresh = pharmacyRevenueGallaService.getRevenueSummary('TODAY');
        setTodayRevenue(fresh.today.amount);
      } catch {}
    };

    window.addEventListener('docsearch_billing_updated', handleRevenueUpdate);
    window.addEventListener('docsearch_galla_updated', handleRevenueUpdate);
    window.addEventListener('storage', handleRevenueUpdate);

    return () => {
      window.removeEventListener('docsearch_billing_updated', handleRevenueUpdate);
      window.removeEventListener('docsearch_galla_updated', handleRevenueUpdate);
      window.removeEventListener('storage', handleRevenueUpdate);
    };
  }, []);

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
      const allDispensing = await pharmacyManagementService.getAllDispensingRecords(ctx.activeTenantId);
      setDispensingRecords(allDispensing);

      // Seed / Refresh local IndexedDB cache for Tier-2/3 offline resilience
      if (catalogData && batchData) {
        void pharmacyOfflineStorageService.cacheInventorySnapshot(
          catalogData.map((c) => ({
            id: c.id,
            medicationCode: c.medicationCode,
            name: c.brandName || c.genericName,
            genericName: c.genericName,
            brandName: c.brandName,
            dosageForm: c.dosageForm,
            strength: c.strength,
            category: c.category,
            scheduleType: c.controlledMedication ? 'SCHEDULE_H1' : 'SCHEDULE_H',
            unitPrice: (c as any).unitPrice ?? 20.0
          })),
          batchData.map((b) => ({
            id: b.id,
            medicationId: b.medicationId,
            batchNumber: b.batchNumber,
            manufacturer: b.manufacturer,
            expiryDate: b.expiryDate,
            availableQuantity: b.availableQuantity,
            unitCost: Number(b.unitCost) || 0,
            status: b.status,
            daysToExpiry: b.daysToExpiry
          }))
        );
      }
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

  const handleClearData = async (mode: 'CLEAR_ALL' | 'RESET_FORMULARY') => {
    try {
      setLoading(true);
      if (mode === 'CLEAR_ALL') {
        await pharmacyManagementService.clearPharmacyData(context?.activeTenantId);
        pharmacyRevenueGallaService.clearAll();
        cdscoInspectionAuditService.clearAll();
        setTodayRevenue(0);
      } else {
        await pharmacyManagementService.resetToCleanFormulary(context?.activeTenantId);
      }
      await loadData();
      setIsResetConfirmOpen(false);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to reset pharmacy data');
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

  const handleWholesaleInward = async (invoice: ParsedWholesaleInvoice) => {
    if (!context) return;
    await pharmacyManagementService.bulkInwardWholesaleInvoice({
      tenantId: context.activeTenantId,
      partnerId: context.activePartnerId,
      organizationId: context.activeOrganizationId || '',
      branchId: context.activeFacilityId || '',
      invoice,
      actorId: currentUser?.email || 'pharma.head@docsearch.health',
      actorRole: currentUser?.role || 'PHARMACY_MANAGER',
      justification: `Wholesale GRN Inward: ${invoice.distributorName} (${invoice.invoiceNumber})`
    });
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

  const handleSeedDevMockStock = async () => {
    if (!context) return;
    await pharmacyManagementService.seedDevMockStock({
      tenantId: context.activeTenantId,
      partnerId: context.activePartnerId,
      organizationId: context.activeOrganizationId || '',
      branchId: context.activeFacilityId || '',
      actorId: currentUser?.email || 'pharma.head@docsearch.health',
      actorRole: currentUser?.role || 'PHARMACY_MANAGER'
    });
    await loadData();
  };

  const handleCleanupDevMockStock = async () => {
    if (!context) return;
    await pharmacyManagementService.cleanupDevMockStock(context.activeTenantId);
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

  const handleDirectPosDispense = async (payload: {
    patientName: string;
    patientPhone: string;
    doctorName?: string | undefined;
    doctorNmcReg?: string | undefined;
    prescriptionId?: string | undefined;
    items: Array<{
      medicationId: string;
      batchId: string;
      quantity: number;
      unitPrice: number;
      dosageInstructions?: string | undefined;
      isLoose?: boolean | undefined;
      packUnits?: number | undefined;
    }>;
  }) => {
    if (!context) return;
    await pharmacyManagementService.directPosDispense({
      tenantId: context.activeTenantId,
      partnerId: context.activePartnerId,
      organizationId: context.activeOrganizationId || undefined,
      branchId: context.activeFacilityId || undefined,
      pharmacistName: currentUser?.name || getUnifiedPartnerProfile(currentUser).pharmacistName || 'Registered Pharmacist',
      ...payload
    });
    await loadData();
  };

  const selectedPrescription = prescriptions.find((p) => p.id === selectedPrescriptionId) || prescriptions[0] || null;

  const pendingRxCount = prescriptions.filter((p) => p.status !== 'COMPLETED' && p.status !== 'CANCELLED').length;
  const nearExpiryCount = batches.filter((b) => (b.daysToExpiry ?? 999) < 60 && b.status !== 'EXPIRED' && b.status !== 'DEPLETED').length;

  type PharmacyMode = 'dispense' | 'inventory' | 'regulatory';

  const getPharmacyModeForTab = (tab: ActivePharmacyTab): PharmacyMode => {
    switch (tab) {
      case 'pos':
      case 'prescriptions':
      case 'verify':
      case 'dispense':
      case 'khata':
      case 'patientHistory':
        return 'dispense';
      case 'inventory':
      case 'catalog':
      case 'expiry':
      case 'movements':
      case 'returns':
      case 'outbreakRadar':
        return 'inventory';
      case 'revenue':
      case 'auditVault':
      case 'compliance':
      case 'audit':
      case 'narcotics':
      case 'reports':
      case 'overview':
      default:
        return 'regulatory';
    }
  };

  const activeMode = getPharmacyModeForTab(activeTab);

  const handleSelectTab = (tab: ActivePharmacyTab) => {
    if (tab === 'compliance' || tab === 'audit') {
      setActiveTab('auditVault');
      onTabChange?.('auditVault');
      return;
    }
    setActiveTab(tab);
    onTabChange?.(tab);
  };

  const handleSelectMode = (mode: PharmacyMode) => {
    if (activeMode === mode) return;
    if (mode === 'dispense') {
      handleSelectTab('pos');
    } else if (mode === 'inventory') {
      handleSelectTab('inventory');
    } else {
      handleSelectTab('revenue');
    }
  };

  // ⚡ Keyboard Accelerators: Alt+1 (Dispense & POS), Alt+2 (Inventory & Stock), Alt+3 (Regulatory & Ledger)
  useEffect(() => {
    const handleModeHotkeys = (e: KeyboardEvent) => {
      if (e.altKey && !e.ctrlKey && !e.metaKey) {
        if (e.key === '1') {
          e.preventDefault();
          handleSelectMode('dispense');
        } else if (e.key === '2') {
          e.preventDefault();
          handleSelectMode('inventory');
        } else if (e.key === '3') {
          e.preventDefault();
          handleSelectMode('regulatory');
        }
      }
    };

    window.addEventListener('keydown', handleModeHotkeys);
    return () => window.removeEventListener('keydown', handleModeHotkeys);
  }, [activeMode]);

  if (!context && loading) {
    return <SkeletonPage layout="table" metricCount={4} />;
  }

  if (error && !overview) {
    return <ErrorState title="Pharmacy Domain Error" message={error} onRetry={loadData} />;
  }

  return (
    <EffectIntensityProvider initialIntensity="operational">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '10px 14px', width: '100%', minHeight: '100vh', boxSizing: 'border-box' }}>
        {/* Pharmacy Command Ribbon */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          padding: '12px 18px',
          backgroundColor: '#0F172A',
          border: '1px solid #1E293B',
          borderRadius: '12px',
          color: '#F8FAFC'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              backgroundColor: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid #10B981',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.4rem'
            }}
          >
            💊
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <span style={{ fontWeight: 800, fontSize: '1.05rem', color: '#F1F5F9' }}>
                {currentUser?.tenantName || context?.activePartnerName || 'Pharmacy Dispensing Counter'}
              </span>
              <span
                style={{
                  backgroundColor: 'rgba(16, 185, 129, 0.2)',
                  color: '#34D399',
                  fontSize: '0.7rem',
                  fontWeight: 800,
                  padding: '2px 8px',
                  borderRadius: '12px',
                  border: '1px solid rgba(16, 185, 129, 0.4)'
                }}
              >
                ● COUNTER READY (Retail POS)
              </span>
              <span
                style={{
                  backgroundColor: 'rgba(56, 189, 248, 0.15)',
                  color: '#38BDF8',
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: '12px',
                  border: '1px solid rgba(56, 189, 248, 0.3)'
                }}
              >
                ⚡ {batches.filter((b) => b.availableQuantity > 0).length} Live Batches
              </span>

              {/* 💰 Live Revenue Telemetry Badge (Non-duplicate indicator; navigation handled by Revenue tab) */}
              <span
                style={{
                  backgroundColor: 'rgba(16, 185, 129, 0.15)',
                  border: '1px solid #10B981',
                  color: '#34D399',
                  fontSize: '0.7rem',
                  fontWeight: 800,
                  padding: '2px 9px',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
                title="Today's Live Counter Collections Telemetry"
              >
                <span>💰</span>
                <span>Aaj Ka Galla: ₹{todayRevenue.toLocaleString('en-IN')}</span>
              </span>

              {/* 📡 Offline-First PWA Status Pill */}
              <button
                type="button"
                onClick={() => setIsOfflineSyncModalOpen(true)}
                style={{
                  backgroundColor: isStationOffline
                    ? 'rgba(239, 68, 68, 0.2)'
                    : pendingOfflineBills > 0
                    ? 'rgba(245, 158, 11, 0.2)'
                    : 'rgba(16, 185, 129, 0.15)',
                  border: `1px solid ${isStationOffline ? '#EF4444' : pendingOfflineBills > 0 ? '#F59E0B' : '#10B981'}`,
                  color: isStationOffline ? '#FCA5A5' : pendingOfflineBills > 0 ? '#FCD34D' : '#34D399',
                  fontSize: '0.7rem',
                  fontWeight: 800,
                  padding: '2px 9px',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
                title="Offline PWA & Background Sync Vault [F10]"
              >
                <span>{isStationOffline ? '🔴' : '🟢'}</span>
                <span>{isStationOffline ? `OFFLINE PWA (${pendingOfflineBills})` : pendingOfflineBills > 0 ? `SYNC QUEUE (${pendingOfflineBills})` : 'PWA SYNC READY'}</span>
              </button>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginTop: '3px', fontSize: '0.75rem', color: '#94A3B8', flexWrap: 'wrap' }}>
              <span>📜 <strong>DL:</strong> 20B/21B-LIC-{(context?.activeFacilityId?.slice(0, 6) || 'MH400').toUpperCase()}</span>
              <span style={{ color: '#475569' }}>|</span>
              <span>🏛️ <strong>GSTIN:</strong> 27AAAC{(context?.activeTenantId?.slice(0, 4) || 'D889').toUpperCase()}1Z5</span>
              <span style={{ color: '#475569' }}>|</span>
              <span>👨‍⚕️ <strong>Pharmacist:</strong> <span style={{ color: '#E2E8F0' }}>{currentUser?.name || 'Authorized Dispenser'}</span> <span style={{ color: '#10B981' }}>({currentUser?.roleTitle || 'Reg. Chemist'})</span></span>
            </div>
          </div>
        </div>

        {/* Right side: Wholesale Inward, Reset Action, Active Facility Branch & Scope Switcher Toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {/* Quick Action: Clear / Reset Pharmacy Data */}
          <button
            type="button"
            onClick={() => {
              setResetMode('CLEAR_ALL');
              setIsResetConfirmOpen(true);
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 14px',
              borderRadius: '8px',
              backgroundColor: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              color: '#FCA5A5',
              fontSize: '0.8rem',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
            title="Clear or reset pharmacy store data"
          >
            <span>🧹 Clear / Reset Store Data</span>
          </button>

          {/* Real-World Quick Action: Inward Stockist Purchase Invoice */}
          <button
            type="button"
            onClick={() => setIsWholesaleUploadOpen(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 16px',
              borderRadius: '8px',
              backgroundColor: 'rgba(16, 185, 129, 0.2)',
              border: '1.5px solid #10B981',
              color: '#34D399',
              fontSize: '0.82rem',
              fontWeight: 800,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              boxShadow: '0 2px 10px rgba(16, 185, 129, 0.25)'
            }}
            title="Directly inward stock from wholesale purchase bills (PDF, Marg ERP, Vyapar, or photo)"
          >
            <span>📦 + Inward Wholesale Bill</span>
          </button>

          <div
            style={{
              padding: '6px 12px',
              borderRadius: '8px',
              backgroundColor: '#1E293B',
              border: '1px solid #334155',
              fontSize: '0.8rem',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <span style={{ color: '#38BDF8' }}>📍</span>
            <span style={{ color: '#E2E8F0', fontWeight: 600 }}>
              {facilities.find((f) => f.id === context?.activeFacilityId)?.facilityName || 'Central Dispensary Counter'}
            </span>
          </div>

          <button
            type="button"
            onClick={() => setIsScopeExpanded(!isScopeExpanded)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '8px',
              backgroundColor: isScopeExpanded ? '#334155' : 'rgba(255, 255, 255, 0.05)',
              border: '1px solid #475569',
              color: '#F1F5F9',
              fontSize: '0.78rem',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
            title="Switch partner, organization, or facility branch"
          >
            <span>⇄ Switch Branch</span>
            <span style={{ fontSize: '0.7rem' }}>{isScopeExpanded ? '▲' : '▼'}</span>
          </button>
        </div>
      </div>

      {/* Collapsible Context Switcher */}
      {isScopeExpanded && context && (
        <div style={{ animation: 'fadeIn 0.2s ease-in-out' }}>
          <PanelContextSwitcher
            context={context}
            partners={partners}
            organizations={organizations}
            facilities={facilities}
            onContextChange={handleContextChange}
          />
        </div>
      )}

      {/* Pharmacy Sub-Pages & Operational Action Toolbar (No duplicate menu cards, zero horizontal scrollbar) */}
      <div
        style={{
          backgroundColor: '#0F172A',
          border: '1px solid #1E293B',
          borderRadius: '12px',
          padding: '12px 16px',
          marginBottom: '1.25rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          boxShadow: '0 4px 16px rgba(0,0,0,0.25)'
        }}
      >
        {/* Top Row: Context & Direct Page Action Buttons */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '10px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '1.2rem' }}>💊</span>
            <div>
              <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#F8FAFC' }}>
                Pharmacy Operations & POS Dispensary
              </div>
              <div style={{ fontSize: '0.72rem', color: '#94A3B8' }}>
                Fast walk-in POS billing, digital e-prescriptions, FEFO batch stock, and CDSCO H1 compliance
              </div>
            </div>
          </div>

          {/* Direct Action Buttons Right on the Page */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>

            <button
              type="button"
              onClick={() => setIsCreateMedOpen(true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 12px',
                borderRadius: '8px',
                backgroundColor: '#1E293B',
                border: '1px solid #334155',
                color: '#CBD5E1',
                fontSize: '0.78rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
              title="Add a new brand or molecule to master formulary"
            >
              <span>+ Add Drug</span>
            </button>

            <button
              type="button"
              onClick={() => setIsReceiveStockOpen(true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 12px',
                borderRadius: '8px',
                backgroundColor: '#1E293B',
                border: '1px solid #334155',
                color: '#CBD5E1',
                fontSize: '0.78rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
              title="Receive stock manually or via delivery challan"
            >
              <span>+ Receive Stock (GRN)</span>
            </button>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                fontSize: '0.6875rem',
                color: '#10B981',
                fontWeight: 700,
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                padding: '5px 9px',
                borderRadius: '8px',
                border: '1px solid rgba(16, 185, 129, 0.25)'
              }}
            >
              <span
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  backgroundColor: '#10B981',
                  boxShadow: '0 0 8px #10B981'
                }}
              />
              POS Terminal Online
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* PHARMACY 3-STAGE OPERATIONAL PIPELINE                                      */}
        {/* 1. 🛒 Dispense & POS  |  2. 📦 Inventory & Batches  |  3. 📊 Regulatory & Galla */}
        {/* ========================================================================= */}
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
          {/* Mode 1: Dispense & POS */}
          <button
            type="button"
            onClick={() => handleSelectMode('dispense')}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 14px',
              borderRadius: '10px',
              backgroundColor: activeMode === 'dispense' ? 'rgba(16, 185, 129, 0.15)' : '#0E162B',
              border: activeMode === 'dispense' ? '1.5px solid #10B981' : '1px solid #1E293B',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'all 0.15s ease',
              boxShadow: activeMode === 'dispense' ? '0 0 16px rgba(16, 185, 129, 0.15)' : 'none'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '1.35rem' }}>🛒</span>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 800, color: activeMode === 'dispense' ? '#34D399' : '#F8FAFC' }}>
                    1. Dispense & POS
                  </span>
                  <span style={{ fontSize: '0.62rem', fontWeight: 800, color: '#94A3B8', backgroundColor: '#1E293B', padding: '1px 5px', borderRadius: '4px', border: '1px solid #334155' }}>
                    Alt+1
                  </span>
                </div>
                <div style={{ fontSize: '0.68rem', color: '#94A3B8' }}>
                  Walk-in counter, e-Rx queue & khata
                </div>
              </div>
            </div>
            <Badge variant={pendingRxCount > 0 ? 'primary' : 'success'} style={{ fontSize: '0.65rem' }}>
              {pendingRxCount > 0 ? `${pendingRxCount} Rx Pending` : 'Counter Ready'}
            </Badge>
          </button>

          {/* Mode 2: Inventory & Stock */}
          <button
            type="button"
            onClick={() => handleSelectMode('inventory')}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 14px',
              borderRadius: '10px',
              backgroundColor: activeMode === 'inventory' ? 'rgba(2, 132, 199, 0.15)' : '#0E162B',
              border: activeMode === 'inventory' ? '1.5px solid #0284C7' : '1px solid #1E293B',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'all 0.15s ease',
              boxShadow: activeMode === 'inventory' ? '0 0 16px rgba(2, 132, 199, 0.15)' : 'none'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '1.35rem' }}>📦</span>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 800, color: activeMode === 'inventory' ? '#38BDF8' : '#F8FAFC' }}>
                    2. Inventory & Stock
                  </span>
                  <span style={{ fontSize: '0.62rem', fontWeight: 800, color: '#94A3B8', backgroundColor: '#1E293B', padding: '1px 5px', borderRadius: '4px', border: '1px solid #334155' }}>
                    Alt+2
                  </span>
                </div>
                <div style={{ fontSize: '0.68rem', color: '#94A3B8' }}>
                  Batches, Inward, Low Stock & Expiry
                </div>
              </div>
            </div>
            <Badge variant={nearExpiryCount > 0 ? 'warning' : 'neutral'} style={{ fontSize: '0.65rem' }}>
              {nearExpiryCount > 0 ? `${nearExpiryCount} Near Expiry` : `${batches.filter((b) => b.availableQuantity > 0).length} Batches`}
            </Badge>
          </button>

          {/* Mode 3: Regulatory & Ledger */}
          <button
            type="button"
            onClick={() => handleSelectMode('regulatory')}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 14px',
              borderRadius: '10px',
              backgroundColor: activeMode === 'regulatory' ? 'rgba(168, 85, 247, 0.15)' : '#0E162B',
              border: activeMode === 'regulatory' ? '1.5px solid #A855F7' : '1px solid #1E293B',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'all 0.15s ease',
              boxShadow: activeMode === 'regulatory' ? '0 0 16px rgba(168, 85, 247, 0.15)' : 'none'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '1.35rem' }}>📊</span>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 800, color: activeMode === 'regulatory' ? '#C084FC' : '#F8FAFC' }}>
                    3. Regulatory & Ledger
                  </span>
                  <span style={{ fontSize: '0.62rem', fontWeight: 800, color: '#94A3B8', backgroundColor: '#1E293B', padding: '1px 5px', borderRadius: '4px', border: '1px solid #334155' }}>
                    Alt+3
                  </span>
                </div>
                <div style={{ fontSize: '0.68rem', color: '#94A3B8' }}>
                  Schedule H1, Cash Galla & Reports
                </div>
              </div>
            </div>
            <Badge variant="neutral" style={{ fontSize: '0.65rem', color: todayRevenue > 0 ? '#34D399' : undefined }}>
              {todayRevenue > 0 ? `₹${todayRevenue.toLocaleString('en-IN')}` : 'CDSCO Compliant'}
            </Badge>
          </button>
        </div>

        {/* Contextual Sub-Pills for the Selected Mode */}
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
          {activeMode === 'dispense' && (
            <>
              {[
                { id: 'pos' as ActivePharmacyTab, label: 'Fast POS Counter', icon: '🛒', badge: todayRevenue > 0 ? `₹${todayRevenue.toLocaleString('en-IN')}` : undefined },
                { id: 'prescriptions' as ActivePharmacyTab, label: 'Doctor Rx Queue', icon: '📋', badge: pendingRxCount > 0 ? `${pendingRxCount} Pending` : undefined, isPrimary: pendingRxCount > 0 },
                { id: 'khata' as ActivePharmacyTab, label: 'Customer Credit Khata', icon: '📒' },
                { id: 'patientHistory' as ActivePharmacyTab, label: 'Patient Rx History', icon: '👤' }
              ].map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => handleSelectTab(tab.id)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '6px 12px',
                      borderRadius: '8px',
                      border: isActive ? '1.5px solid #10B981' : '1px solid #1E293B',
                      backgroundColor: isActive ? 'rgba(16, 185, 129, 0.2)' : '#0E162B',
                      color: isActive ? '#6EE7B7' : '#94A3B8',
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
                          backgroundColor: isActive ? '#10B981' : tab.isPrimary ? '#0284C7' : '#1E293B',
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

          {activeMode === 'inventory' && (
            <>
              {[
                { id: 'inventory' as ActivePharmacyTab, label: 'Live Stock & Batches', icon: '📦', badge: `${batches.filter((b) => b.availableQuantity > 0).length} Batches` },
                { id: 'catalog' as ActivePharmacyTab, label: 'Master Drug Catalog', icon: '📚', badge: catalog.length > 0 ? `${catalog.length}` : undefined },
                { id: 'expiry' as ActivePharmacyTab, label: 'Stock Expiry & Reorder', icon: '⚠️', badge: nearExpiryCount > 0 ? `${nearExpiryCount} Near Expiry` : undefined, isAlert: nearExpiryCount > 0 },
                { id: 'outbreakRadar' as ActivePharmacyTab, label: 'Epidemic Outbreak Radar', icon: '📡' },
                { id: 'movements' as ActivePharmacyTab, label: 'Stock Movements', icon: '🚚' },
                { id: 'returns' as ActivePharmacyTab, label: 'Returns & Adjustments', icon: '🔄' }
              ].map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => handleSelectTab(tab.id)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '6px 12px',
                      borderRadius: '8px',
                      border: isActive ? '1.5px solid #0284C7' : tab.isAlert ? '1px solid #F59E0B' : '1px solid #1E293B',
                      backgroundColor: isActive ? 'rgba(2, 132, 199, 0.2)' : '#0E162B',
                      color: isActive ? '#38BDF8' : tab.isAlert ? '#FBBF24' : '#94A3B8',
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
                          backgroundColor: isActive ? '#0284C7' : tab.isAlert ? '#D97706' : '#1E293B',
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

              <button
                type="button"
                onClick={() => setIsWholesaleUploadOpen(true)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 14px',
                  borderRadius: '8px',
                  border: '1.5px solid #10B981',
                  backgroundColor: 'rgba(16, 185, 129, 0.15)',
                  color: '#34D399',
                  fontSize: '0.78rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  boxShadow: '0 2px 8px rgba(16, 185, 129, 0.2)'
                }}
                title="Import Marg ERP / Vyapar / Busy CSV Invoice with 1-Click Batch Inwarding"
              >
                <span>⚡</span>
                <span>1-Click Marg CSV Ingestion</span>
              </button>
            </>
          )}

          {activeMode === 'regulatory' && (
            <>
              {[
                { id: 'revenue' as ActivePharmacyTab, label: 'Daily Galla & Collections', icon: '💰', badge: todayRevenue > 0 ? `₹${todayRevenue.toLocaleString('en-IN')}` : undefined },
                { id: 'auditVault' as ActivePharmacyTab, label: 'CDSCO Regulatory Vault', icon: '⚖️', badge: 'Form 20B/21B' },
                { id: 'narcotics' as ActivePharmacyTab, label: 'Schedule H / Narcotics', icon: '💊', badge: 'CDSCO H1', isAlert: true },
                { id: 'reports' as ActivePharmacyTab, label: 'MIS & Regulatory Reports', icon: '📊' },
                { id: 'overview' as ActivePharmacyTab, label: 'Operations Overview', icon: '📈' }
              ].map((tab) => {
                const isActive = activeTab === tab.id || (tab.id === 'auditVault' && (activeTab === 'compliance' || activeTab === 'audit'));
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => handleSelectTab(tab.id)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '6px 12px',
                      borderRadius: '8px',
                      border: isActive ? '1.5px solid #A855F7' : '1px solid #1E293B',
                      backgroundColor: isActive ? 'rgba(168, 85, 247, 0.2)' : '#0E162B',
                      color: isActive ? '#C084FC' : '#94A3B8',
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
                          backgroundColor: isActive ? '#A855F7' : tab.isAlert ? '#DC2626' : '#1E293B',
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
        </div>
      </div>

      {/* Contextual Sub-Tab Navigation Ribbon for Drilldown Views */}
      {(activeTab === 'verify' || activeTab === 'dispense') && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 16px',
            backgroundColor: '#1E293B',
            borderRadius: '8px',
            border: '1px solid #334155'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: '#CBD5E1' }}>
            <span style={{ color: '#38BDF8', fontWeight: 700 }}>
              {activeTab === 'verify' ? '🔍 Prescription Clinical Verification' : '💊 Dispensing Workbench'}
            </span>
            <span>•</span>
            <span>Order #{selectedPrescription?.prescriptionNumber || 'Selected'}</span>
            <span>({selectedPrescription?.patientName || 'Patient'})</span>
          </div>
          <button
            type="button"
            onClick={() => handleSelectTab('prescriptions')}
            style={{
              background: 'none',
              border: 'none',
              color: '#38BDF8',
              fontSize: '0.8rem',
              fontWeight: 700,
              cursor: 'pointer',
              textDecoration: 'underline'
            }}
          >
            ← Return to Full Rx Queue
          </button>
        </div>
      )}

      {/* Active Cross-Department Patient Context Banner */}
      {activePatient && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: 'rgba(56, 189, 248, 0.12)',
          border: '1px solid rgba(56, 189, 248, 0.35)',
          borderRadius: '10px',
          padding: '10px 16px',
          marginBottom: '16px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.2)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '1.25rem' }}>👤</span>
            <span style={{ fontSize: '0.8125rem', color: '#94A3B8' }}>Active Counter Patient:</span>
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
              ✓ Auto-linked from OPD Doctor Desk
            </span>
          </div>
          <button
            type="button"
            onClick={() => {
              setActivePatient(null);
              hospitalEventBus.clearActivePatient('PharmacyDomainManager');
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

      {/* Tab Content */}
      {loading ? (
        <div style={{ padding: '16px' }}>
          <SkeletonTable columns={6} rows={8} />
        </div>
      ) : (
        <React.Suspense fallback={<div style={{ padding: '16px' }}><SkeletonTable columns={6} rows={8} /></div>}>
          {activeTab === 'pos' && (
            <FastPharmacyPosCounterView
              batches={batches}
              prescriptions={prescriptions}
              catalog={catalog}
              currentUser={currentUser}
              initialBatchToSell={posPreloadBatch}
              onClearInitialBatchToSell={() => setPosPreloadBatch(null)}
              initialPrescriptionId={posPreloadPrescriptionId}
              onClearInitialPrescriptionId={() => setPosPreloadPrescriptionId(null)}
              onClosePos={() => handleSelectTab('inventory')}
              dispensingRecords={dispensingRecords}
              onDispenseSubmit={handleDirectPosDispense}
              onOpenCdscoVault={() => handleSelectTab('auditVault')}
            />
          )}

          {activeTab === 'outbreakRadar' && (
            <EpidemicOutbreakRadarView
              onInwardGeneratedPo={() => {
                loadData();
              }}
            />
          )}

          {activeTab === 'revenue' && (
            <PharmacyRevenueGallaDeskView />
          )}

          {(activeTab === 'auditVault' || activeTab === 'compliance' || activeTab === 'audit' || activeTab === 'narcotics') && (
            <CdscoDrugInspectorAuditVaultView
              currentUser={currentUser}
              dispensingRecords={dispensingRecords}
              audits={audits}
              movements={movements}
              batches={batches}
              initialSubView={activeTab === 'compliance' || activeTab === 'narcotics' ? 'scheduleH' : activeTab === 'audit' ? 'traces' : 'inspector'}
            />
          )}

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
              batches={batches}
              onSelectPrescription={(id) => {
                setSelectedPrescriptionId(id);
                setActiveTab('dispense');
              }}
              onOpenVerifyDialog={(rx) => {
                setSelectedPrescriptionId(rx.id);
                setActiveTab('verify');
              }}
              onOpenDispenseDialog={(rx) => {
                setSelectedPrescriptionId(rx.id);
                setIsDispenseOpen(true);
              }}
              onOpenCancelDialog={(rx) => {
                setSelectedPrescriptionId(rx.id);
                setIsCancelRxOpen(true);
              }}
              onLoadToPos={(rxId) => {
                setPosPreloadPrescriptionId(rxId);
                handleSelectTab('pos');
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
              onProceedToPos={() => {
                if (selectedPrescription) {
                  setPosPreloadPrescriptionId(selectedPrescription.id);
                }
                setActiveTab('pos');
              }}
            />
          )}

          {activeTab === 'inventory' && (
            <InventoryManagementView
              inventory={inventory}
              batches={batches}
              movements={movements}
              returns={returns}
              adjustments={adjustments}
              onOpenReceiveStock={() => setIsReceiveStockOpen(true)}
              onOpenWholesaleUpload={() => setIsWholesaleUploadOpen(true)}
              onOpenClearData={
                (currentUser?.role === 'SUPER_ADMIN' || currentUser?.role === 'HOSPITAL_ADMIN' || currentUser?.role === 'HOSPITAL_DIRECTOR' || currentUser?.role === 'PHARMACY_DIRECTOR')
                  ? () => {
                      setResetMode('CLEAR_ALL');
                      setIsResetConfirmOpen(true);
                    }
                  : undefined
              }
              onOpenStockAdjustment={() => setIsAdjustmentOpen(true)}
              onOpenTransferStock={() => setIsTransferOpen(true)}
              onOpenBlockDialog={(b) => {
                setSelectedBatch(b);
                setIsBlockBatchOpen(true);
              }}
              onOpenUnblockDialog={(b) => {
                setSelectedBatch(b);
                setIsUnblockBatchOpen(true);
              }}
              onNavigateToPos={(batch) => {
                if (batch) {
                  setPosPreloadBatch(batch);
                }
                handleSelectTab('pos');
              }}
              onSeedDevMockStock={handleSeedDevMockStock}
              onCleanupDevMockStock={handleCleanupDevMockStock}
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

          {activeTab === 'khata' && (
            <PharmacyCustomerKhataDeskView />
          )}

          {activeTab === 'reports' && (
            overview ? (
              <PharmacyReportsView
                overview={overview}
                inventory={inventory}
                batches={batches}
                prescriptions={prescriptions}
              />
            ) : (
              <div style={{ padding: '16px' }}>
                <SkeletonPage metricCount={4} layout="table" />
              </div>
            )
          )}
        </React.Suspense>
      )}

      {/* Dialog Modals */}
      {context && (
        <React.Suspense fallback={null}>
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

          <WholesaleInvoiceUploadModal
            isOpen={isWholesaleUploadOpen}
            onClose={() => setIsWholesaleUploadOpen(false)}
            tenantId={context.activeTenantId}
            partnerId={context.activePartnerId}
            organizationId={context.activeOrganizationId || ''}
            branchId={context.activeFacilityId || ''}
            onConfirmInward={handleWholesaleInward}
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

          {/* Reset / Clear Pharmacy Store Data Dialog */}
          <Dialog
            isOpen={isResetConfirmOpen}
            onClose={() => setIsResetConfirmOpen(false)}
            title="🧹 Pharmacy Data Management (Clear / Reset Store Data)"
            isFullPage={true}
            maxWidth="full"
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '8px 0' }}>
              <div style={{ color: '#E2E8F0', fontSize: '0.88rem', lineHeight: '1.5' }}>
                Select an option below to manage or reset your pharmacy inventory and sales data:
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '12px',
                    padding: '12px',
                    borderRadius: '8px',
                    backgroundColor: resetMode === 'CLEAR_ALL' ? 'rgba(239, 68, 68, 0.15)' : '#1E293B',
                    border: resetMode === 'CLEAR_ALL' ? '1.5px solid #EF4444' : '1px solid #334155',
                    cursor: 'pointer'
                  }}
                >
                  <input
                    type="radio"
                    name="resetPharmacyMode"
                    checked={resetMode === 'CLEAR_ALL'}
                    onChange={() => setResetMode('CLEAR_ALL')}
                    style={{ marginTop: '3px' }}
                  />
                  <div>
                    <div style={{ fontWeight: 700, color: '#F87171', fontSize: '0.9rem' }}>
                      🗑️ Clear All Inventory (Start Clean - 0 Batches)
                    </div>
                    <div style={{ fontSize: '0.78rem', color: '#94A3B8', marginTop: '4px' }}>
                      Purges all test batches, historical invoices, and stock ledgers, providing a clean Day-0 slate to inward verified wholesale stockist invoices (Marg ERP, Busy, Vyapar).
                    </div>
                  </div>
                </label>

                <label
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '12px',
                    padding: '12px',
                    borderRadius: '8px',
                    backgroundColor: resetMode === 'RESET_FORMULARY' ? 'rgba(56, 189, 248, 0.15)' : '#1E293B',
                    border: resetMode === 'RESET_FORMULARY' ? '1.5px solid #38BDF8' : '1px solid #334155',
                    cursor: 'pointer'
                  }}
                >
                  <input
                    type="radio"
                    name="resetPharmacyMode"
                    checked={resetMode === 'RESET_FORMULARY'}
                    onChange={() => setResetMode('RESET_FORMULARY')}
                    style={{ marginTop: '3px' }}
                  />
                  <div>
                    <div style={{ fontWeight: 700, color: '#38BDF8', fontSize: '0.9rem' }}>
                      🔄 Reset to Standard Formulary (50+ Essential Medicines)
                    </div>
                    <div style={{ fontSize: '0.78rem', color: '#94A3B8', marginTop: '4px' }}>
                      Restores a comprehensive standard formulary with 50+ essential clinical medications and standard test batches.
                    </div>
                  </div>
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
                <Button
                  variant="secondary"
                  onClick={() => setIsResetConfirmOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={() => handleClearData(resetMode)}
                  style={{
                    backgroundColor: resetMode === 'CLEAR_ALL' ? '#DC2626' : '#2563EB',
                    borderColor: resetMode === 'CLEAR_ALL' ? '#DC2626' : '#2563EB'
                  }}
                >
                  {resetMode === 'CLEAR_ALL' ? 'Yes, Clear All Inventory' : 'Yes, Reset to Standard Formulary'}
                </Button>
              </div>
            </div>
          </Dialog>
        </React.Suspense>
      )}

      {/* 📡 Offline-First PWA & Background Sync Vault Modal */}
      <React.Suspense fallback={null}>
        {isOfflineSyncModalOpen && (
          <PharmacyOfflineSyncModal
            isOpen={isOfflineSyncModalOpen}
            onClose={() => setIsOfflineSyncModalOpen(false)}
          />
        )}
      </React.Suspense>
      </div>
    </EffectIntensityProvider>
  );
};
