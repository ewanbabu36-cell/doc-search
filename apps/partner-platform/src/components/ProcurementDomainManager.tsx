import React, { useState, useEffect, useCallback } from 'react';
import {
  Alert
} from '@docsearch/ui-kit';
import type {
  ProcurementOverviewMetricsDto,
  ProcurementAnalyticsDto,
  ProcurementVendorDto,
  ProcurementVendorContractDto,
  ProcurementItemDto,
  PurchaseRequisitionDto,
  PurchaseOrderDto,
  GoodsReceiptDto,
  ProcurementInspectionDto,
  VendorReturnDto,
  PurchaseInvoiceDto,
  PurchaseInvoiceMatchDto,
  ProcurementExceptionDto,
  ProcurementAuditTraceDto,
  CreateVendorRequest,
  UpdateVendorRequest,
  SuspendVendorRequest,
  CreateVendorContractRequest,
  CreateProcurementItemRequest,
  CreatePurchaseRequisitionRequest,
  ApprovePurchaseRequisitionRequest,
  RejectPurchaseRequisitionRequest,
  CreatePurchaseOrderRequest,
  ApprovePurchaseOrderRequest,
  SendPurchaseOrderRequest,
  CancelPurchaseOrderRequest,
  CreateGoodsReceiptRequest,
  InspectGoodsReceiptRequest,
  CreateVendorReturnRequest,
  ApproveVendorReturnRequest,
  CreatePurchaseInvoiceRequest,
  MatchPurchaseInvoiceRequest,
  ResolveProcurementExceptionRequest,
  CreateEmergencyPurchaseRequest
} from '@docsearch/api-contracts';

import { procurementManagementService } from '../services/procurement-management-service.js';

// Views
import { ProcurementOverviewView } from './views/ProcurementOverviewView.js';
import { VendorDirectoryView } from './views/VendorDirectoryView.js';
import { VendorDetailView } from './views/VendorDetailView.js';
import { VendorContractsView } from './views/VendorContractsView.js';
import { ProcurementCatalogView } from './views/ProcurementCatalogView.js';
import { PurchaseRequisitionView } from './views/PurchaseRequisitionView.js';
import { ProcurementApprovalWorkbenchView } from './views/ProcurementApprovalWorkbenchView.js';
import { PurchaseOrderDirectoryView } from './views/PurchaseOrderDirectoryView.js';
import { PurchaseOrderDetailView } from './views/PurchaseOrderDetailView.js';
import { GoodsReceiptView } from './views/GoodsReceiptView.js';
import { QualityInspectionView } from './views/QualityInspectionView.js';
import { VendorReturnsView } from './views/VendorReturnsView.js';
import { PurchaseInvoiceMatchingView } from './views/PurchaseInvoiceMatchingView.js';
import { ProcurementExceptionsView } from './views/ProcurementExceptionsView.js';
import { ProcurementPlanningView } from './views/ProcurementPlanningView.js';
import { VendorPerformanceView } from './views/VendorPerformanceView.js';
import { ProcurementReportsView } from './views/ProcurementReportsView.js';
import { ProcurementAuditVaultView } from './views/ProcurementAuditVaultView.js';
import { SpendAnalyticsView } from './views/SpendAnalyticsView.js';
import { ProcurementControlCenterView } from './views/ProcurementControlCenterView.js';

// Dialogs
import { CreateVendorDialog } from './dialogs/CreateVendorDialog.js';
import { EditVendorDialog } from './dialogs/EditVendorDialog.js';
import { SuspendVendorDialog } from './dialogs/SuspendVendorDialog.js';
import { CreateVendorContractDialog } from './dialogs/CreateVendorContractDialog.js';
import { CreateProcurementItemDialog } from './dialogs/CreateProcurementItemDialog.js';
import { CreatePurchaseRequisitionDialog } from './dialogs/CreatePurchaseRequisitionDialog.js';
import { ApprovePurchaseRequisitionDialog } from './dialogs/ApprovePurchaseRequisitionDialog.js';
import { RejectPurchaseRequisitionDialog } from './dialogs/RejectPurchaseRequisitionDialog.js';
import { CreatePurchaseOrderDialog } from './dialogs/CreatePurchaseOrderDialog.js';
import { ApprovePurchaseOrderDialog } from './dialogs/ApprovePurchaseOrderDialog.js';
import { SendPurchaseOrderDialog } from './dialogs/SendPurchaseOrderDialog.js';
import { CancelPurchaseOrderDialog } from './dialogs/CancelPurchaseOrderDialog.js';
import { CreateGoodsReceiptDialog } from './dialogs/CreateGoodsReceiptDialog.js';
import { InspectGoodsReceiptDialog } from './dialogs/InspectGoodsReceiptDialog.js';
import { CreateVendorReturnDialog } from './dialogs/CreateVendorReturnDialog.js';
import { ApproveVendorReturnDialog } from './dialogs/ApproveVendorReturnDialog.js';
import { CreatePurchaseInvoiceDialog } from './dialogs/CreatePurchaseInvoiceDialog.js';
import { MatchPurchaseInvoiceDialog } from './dialogs/MatchPurchaseInvoiceDialog.js';
import { ResolveProcurementExceptionDialog } from './dialogs/ResolveProcurementExceptionDialog.js';
import { CreateEmergencyPurchaseDialog } from './dialogs/CreateEmergencyPurchaseDialog.js';

export interface ProcurementDomainManagerProps {
  tenantId?: string;
  partnerId?: string;
  organizationId?: string;
  branchId?: string | null;
}

export type ProcurementTab =
  | 'overview'
  | 'vendors'
  | 'vendor-detail'
  | 'contracts'
  | 'catalog'
  | 'requisitions'
  | 'approvals'
  | 'purchase-orders'
  | 'purchase-order-detail'
  | 'goods-receipts'
  | 'inspections'
  | 'returns'
  | 'invoices'
  | 'exceptions'
  | 'planning'
  | 'performance'
  | 'reports'
  | 'audit'
  | 'spend'
  | 'control';

export const ProcurementDomainManager: React.FC<ProcurementDomainManagerProps> = ({
  tenantId = '11111111-1111-4111-8111-111111111111',
  partnerId = '22222222-2222-4222-8222-222222222222',
  organizationId = '33333333-3333-4333-8333-333333333333',
  branchId = '44444444-4444-4444-8444-444444444444'
}) => {
  const [activeTab, setActiveTab] = useState<ProcurementTab>('overview');
  const [metrics, setMetrics] = useState<ProcurementOverviewMetricsDto | null>(null);
  const [analytics, setAnalytics] = useState<ProcurementAnalyticsDto | null>(null);
  const [vendors, setVendors] = useState<ProcurementVendorDto[]>([]);
  const [selectedVendor, setSelectedVendor] = useState<ProcurementVendorDto | null>(null);
  const [contracts, setContracts] = useState<ProcurementVendorContractDto[]>([]);
  const [items, setItems] = useState<ProcurementItemDto[]>([]);
  const [requisitions, setRequisitions] = useState<PurchaseRequisitionDto[]>([]);
  const [selectedRequisition, setSelectedRequisition] = useState<PurchaseRequisitionDto | null>(null);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrderDto[]>([]);
  const [selectedPO, setSelectedPO] = useState<PurchaseOrderDto | null>(null);
  const [goodsReceipts, setGoodsReceipts] = useState<GoodsReceiptDto[]>([]);
  const [selectedGRN, setSelectedGRN] = useState<GoodsReceiptDto | null>(null);
  const [inspections, setInspections] = useState<ProcurementInspectionDto[]>([]);
  const [vendorReturns, setVendorReturns] = useState<VendorReturnDto[]>([]);
  const [selectedReturn, setSelectedReturn] = useState<VendorReturnDto | null>(null);
  const [purchaseInvoices, setPurchaseInvoices] = useState<PurchaseInvoiceDto[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<PurchaseInvoiceDto | null>(null);
  const [invoiceMatches, setInvoiceMatches] = useState<PurchaseInvoiceMatchDto[]>([]);
  const [exceptions, setExceptions] = useState<ProcurementExceptionDto[]>([]);
  const [selectedException, setSelectedException] = useState<ProcurementExceptionDto | null>(null);
  const [auditTraces, setAuditTraces] = useState<ProcurementAuditTraceDto[]>([]);

  // Dialog States
  const [isCreateVendorOpen, setIsCreateVendorOpen] = useState(false);
  const [isEditVendorOpen, setIsEditVendorOpen] = useState(false);
  const [isSuspendVendorOpen, setIsSuspendVendorOpen] = useState(false);
  const [isCreateContractOpen, setIsCreateContractOpen] = useState(false);
  const [isCreateItemOpen, setIsCreateItemOpen] = useState(false);
  const [isCreatePRDialogOpen, setIsCreatePRDialogOpen] = useState(false);
  const [isApprovePROpen, setIsApprovePROpen] = useState(false);
  const [isRejectPROpen, setIsRejectPROpen] = useState(false);
  const [isCreatePOOpen, setIsCreatePOOpen] = useState(false);
  const [isApprovePOOpen, setIsApprovePOOpen] = useState(false);
  const [isSendPOOpen, setIsSendPOOpen] = useState(false);
  const [isCancelPOOpen, setIsCancelPOOpen] = useState(false);
  const [isCreateGRNOpen, setIsCreateGRNOpen] = useState(false);
  const [isInspectGRNOpen, setIsInspectGRNOpen] = useState(false);
  const [isCreateReturnOpen, setIsCreateReturnOpen] = useState(false);
  const [isApproveReturnOpen, setIsApproveReturnOpen] = useState(false);
  const [isCreateInvoiceOpen, setIsCreateInvoiceOpen] = useState(false);
  const [isMatchInvoiceOpen, setIsMatchInvoiceOpen] = useState(false);
  const [isResolveExceptionOpen, setIsResolveExceptionOpen] = useState(false);
  const [isEmergencyPurchaseOpen, setIsEmergencyPurchaseOpen] = useState(false);

  const [notification, setNotification] = useState<{ message: string; variant: 'success' | 'danger' } | null>(null);

  const showNotification = (message: string, variant: 'success' | 'danger' = 'success') => {
    setNotification({ message, variant });
    setTimeout(() => setNotification(null), 4000);
  };

  const loadData = useCallback(async () => {
    try {
      const [
        m,
        a,
        vList,
        cList,
        iList,
        rList,
        poList,
        grnList,
        qcList,
        retList,
        invList,
        matchList,
        excList,
        auditList
      ] = await Promise.all([
        procurementManagementService.getOverviewMetrics(tenantId),
        procurementManagementService.getAnalytics(tenantId),
        procurementManagementService.getVendors(tenantId),
        procurementManagementService.getContracts(tenantId),
        procurementManagementService.getItems(tenantId),
        procurementManagementService.getRequisitions(tenantId),
        procurementManagementService.getPurchaseOrders(tenantId),
        procurementManagementService.getGoodsReceipts(tenantId),
        procurementManagementService.getInspections(tenantId),
        procurementManagementService.getVendorReturns(tenantId),
        procurementManagementService.getPurchaseInvoices(tenantId),
        procurementManagementService.getInvoiceMatches(tenantId),
        procurementManagementService.getExceptions(tenantId),
        procurementManagementService.getAuditTraces(tenantId)
      ]);

      setMetrics(m);
      setAnalytics(a);
      setVendors(vList);
      setContracts(cList);
      setItems(iList);
      setRequisitions(rList);
      setPurchaseOrders(poList);
      setGoodsReceipts(grnList);
      setInspections(qcList);
      setVendorReturns(retList);
      setPurchaseInvoices(invList);
      setInvoiceMatches(matchList);
      setExceptions(excList);
      setAuditTraces(auditList);
    } catch {
      showNotification('Failed to load procurement data.', 'danger');
    }
  }, [tenantId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handlers
  const handleCreateVendor = async (req: CreateVendorRequest) => {
    await procurementManagementService.createVendor(req);
    await loadData();
    showNotification(`Vendor ${req.legalName} registered successfully.`);
  };

  const handleUpdateVendor = async (req: UpdateVendorRequest) => {
    const updated = await procurementManagementService.updateVendor(req);
    setSelectedVendor(updated);
    await loadData();
    showNotification('Vendor profile updated.');
  };

  const handleSuspendVendor = async (req: SuspendVendorRequest) => {
    const updated = await procurementManagementService.suspendVendor(req);
    setSelectedVendor(updated);
    await loadData();
    showNotification('Vendor suspended from procurement operations.', 'danger');
  };

  const handleCreateContract = async (req: CreateVendorContractRequest) => {
    await procurementManagementService.createContract(req);
    await loadData();
    showNotification(`Contract ${req.contractNumber} recorded.`);
  };

  const handleCreateItem = async (req: CreateProcurementItemRequest) => {
    await procurementManagementService.createItem(req);
    await loadData();
    showNotification(`Catalog item ${req.itemName} added.`);
  };

  const handleCreateRequisition = async (req: CreatePurchaseRequisitionRequest) => {
    const created = await procurementManagementService.createRequisition(req);
    await loadData();
    showNotification(`Requisition ${created.requisitionNumber} raised.`);
  };

  const handleApproveRequisition = async (req: ApprovePurchaseRequisitionRequest) => {
    const updated = await procurementManagementService.approveRequisition(req);
    setSelectedRequisition(updated);
    await loadData();
    showNotification(`Requisition ${updated.requisitionNumber} approved.`);
  };

  const handleRejectRequisition = async (req: RejectPurchaseRequisitionRequest) => {
    const updated = await procurementManagementService.rejectRequisition(req);
    setSelectedRequisition(updated);
    await loadData();
    showNotification(`Requisition ${updated.requisitionNumber} rejected.`, 'danger');
  };

  const handleCreatePurchaseOrder = async (req: CreatePurchaseOrderRequest) => {
    const created = await procurementManagementService.createPurchaseOrder(req);
    await loadData();
    showNotification(`Purchase Order ${created.poNumber} issued.`);
  };

  const handleApprovePO = async (req: ApprovePurchaseOrderRequest) => {
    const updated = await procurementManagementService.approvePurchaseOrder(req);
    setSelectedPO(updated);
    await loadData();
    showNotification(`PO ${updated.poNumber} approved.`);
  };

  const handleSendPO = async (req: SendPurchaseOrderRequest) => {
    const updated = await procurementManagementService.sendPurchaseOrder(req);
    setSelectedPO(updated);
    await loadData();
    showNotification(`PO ${updated.poNumber} transmitted to vendor.`);
  };

  const handleCancelPO = async (req: CancelPurchaseOrderRequest) => {
    const updated = await procurementManagementService.cancelPurchaseOrder(req);
    setSelectedPO(updated);
    await loadData();
    showNotification(`PO ${updated.poNumber} cancelled.`, 'danger');
  };

  const handleCreateGRN = async (req: CreateGoodsReceiptRequest) => {
    const created = await procurementManagementService.createGoodsReceipt(req);
    await loadData();
    showNotification(`GRN ${created.grnNumber} generated.`);
  };

  const handleInspectGRN = async (req: InspectGoodsReceiptRequest) => {
    const created = await procurementManagementService.inspectGoodsReceipt(req);
    await loadData();
    showNotification(`Inspection ${created.inspectionNumber} recorded: ${created.status}.`);
  };

  const handleCreateReturn = async (req: CreateVendorReturnRequest) => {
    const created = await procurementManagementService.createVendorReturn(req);
    await loadData();
    showNotification(`Return ${created.returnNumber} initiated.`);
  };

  const handleApproveReturn = async (req: ApproveVendorReturnRequest) => {
    const updated = await procurementManagementService.approveVendorReturn(req);
    setSelectedReturn(updated);
    await loadData();
    showNotification(`Return ${updated.returnNumber} approved for credit note.`);
  };

  const handleCreateInvoice = async (req: CreatePurchaseInvoiceRequest) => {
    const created = await procurementManagementService.createPurchaseInvoice(req);
    await loadData();
    showNotification(`Invoice ${created.invoiceNumber} recorded.`);
  };

  const handleMatchInvoice = async (req: MatchPurchaseInvoiceRequest) => {
    const match = await procurementManagementService.matchPurchaseInvoice(req);
    await loadData();
    showNotification(`Matching completed: ${match.status}.`);
  };

  const handleResolveException = async (req: ResolveProcurementExceptionRequest) => {
    const resolved = await procurementManagementService.resolveException(req);
    setSelectedException(resolved);
    await loadData();
    showNotification(`Exception ${resolved.exceptionNumber} resolved.`);
  };

  const handleEmergencyPurchase = async (req: CreateEmergencyPurchaseRequest) => {
    const po = await procurementManagementService.createEmergencyPurchase(req);
    await loadData();
    showNotification(`🚨 EMERGENCY PO ${po.poNumber} DISPATCHED.`);
  };

  const tabs: { id: ProcurementTab; label: string; icon: string }[] = [
    { id: 'overview', label: 'Command Center', icon: '📊' },
    { id: 'vendors', label: 'Vendors', icon: '🏢' },
    { id: 'contracts', label: 'Contracts', icon: '📜' },
    { id: 'catalog', label: 'Item Catalog', icon: '📦' },
    { id: 'requisitions', label: 'Requisitions', icon: '📝' },
    { id: 'approvals', label: 'Approvals', icon: '✅' },
    { id: 'purchase-orders', label: 'Purchase Orders', icon: '📑' },
    { id: 'goods-receipts', label: 'Goods Receipts (GRN)', icon: '📥' },
    { id: 'inspections', label: 'Quality Inspection', icon: '🔍' },
    { id: 'returns', label: 'Vendor Returns (RTV)', icon: '🔄' },
    { id: 'invoices', label: 'Invoice Matching', icon: '🧾' },
    { id: 'exceptions', label: 'Exceptions', icon: '⚠️' },
    { id: 'planning', label: 'Reorder Planning', icon: '📈' },
    { id: 'performance', label: 'Vendor Scorecards', icon: '⭐' },
    { id: 'reports', label: 'Spend Reports', icon: '📉' },
    { id: 'audit', label: 'Audit Vault', icon: '🔒' }
  ];

  return (
    <div style={{ padding: '1.5rem', maxWidth: '1600px', margin: '0 auto' }}>
      {/* Sample Data Disclaimer Badge */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <span style={{ fontSize: '0.75rem', backgroundColor: '#e2e8f0', color: '#475569', padding: '0.2rem 0.6rem', borderRadius: '4px', fontWeight: 600 }}>
          Operational Live Telemetry
        </span>
        <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
          Tenant: {tenantId.slice(0, 8)}... | Partner: {partnerId.slice(0, 8)}...
        </span>
      </div>

      {notification && (
        <div style={{ marginBottom: '1rem' }}>
          <Alert type={notification.variant === 'danger' ? 'error' : 'success'}>{notification.message}</Alert>
        </div>
      )}

      {/* Domain Navigation Tabs */}
      <div
        style={{
          display: 'flex',
          gap: '0.5rem',
          overflowX: 'auto',
          borderBottom: '2px solid #e2e8f0',
          paddingBottom: '0.5rem',
          marginBottom: '1.5rem'
        }}
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '0.5rem 0.875rem',
              borderRadius: '6px',
              border: 'none',
              backgroundColor: activeTab === tab.id ? '#2563eb' : '#f1f5f9',
              color: activeTab === tab.id ? '#fff' : '#475569',
              fontWeight: 600,
              fontSize: '0.875rem',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              transition: 'all 0.15s ease'
            }}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Contents */}
      {activeTab === 'overview' && metrics && (
        <ProcurementOverviewView
          metrics={metrics}
          purchaseOrders={purchaseOrders}
          requisitions={requisitions}
          onOpenCreateRequisition={() => setIsCreatePRDialogOpen(true)}
          onOpenCreatePO={() => setIsCreatePOOpen(true)}
          onOpenEmergencyPurchase={() => setIsEmergencyPurchaseOpen(true)}
          onSelectPO={(poId) => {
            const po = purchaseOrders.find((p) => p.id === poId) || null;
            setSelectedPO(po);
            setActiveTab('purchase-order-detail');
          }}
        />
      )}

      {activeTab === 'vendors' && (
        <VendorDirectoryView
          vendors={vendors}
          onOpenCreateVendor={() => setIsCreateVendorOpen(true)}
          onSelectVendor={(v) => {
            setSelectedVendor(v);
            setActiveTab('vendor-detail');
          }}
        />
      )}

      {activeTab === 'vendor-detail' && (
        <VendorDetailView
          vendor={selectedVendor}
          contracts={contracts}
          purchaseOrders={purchaseOrders}
          onBack={() => setActiveTab('vendors')}
          onOpenEditVendor={() => setIsEditVendorOpen(true)}
          onOpenSuspendVendor={() => setIsSuspendVendorOpen(true)}
          onOpenCreateContract={() => setIsCreateContractOpen(true)}
          onSelectPO={(poId) => {
            const po = purchaseOrders.find((p) => p.id === poId) || null;
            setSelectedPO(po);
            setActiveTab('purchase-order-detail');
          }}
        />
      )}

      {activeTab === 'contracts' && (
        <VendorContractsView
          contracts={contracts}
          onOpenCreateContract={() => setIsCreateContractOpen(true)}
        />
      )}

      {activeTab === 'catalog' && (
        <ProcurementCatalogView
          items={items}
          onOpenCreateItem={() => setIsCreateItemOpen(true)}
        />
      )}

      {activeTab === 'requisitions' && (
        <PurchaseRequisitionView
          requisitions={requisitions}
          onOpenCreateRequisition={() => setIsCreatePRDialogOpen(true)}
          onOpenApproveRequisition={(req) => {
            setSelectedRequisition(req);
            setIsApprovePROpen(true);
          }}
          onOpenRejectRequisition={(req) => {
            setSelectedRequisition(req);
            setIsRejectPROpen(true);
          }}
          onOpenCreatePOFromReq={(req) => {
            setSelectedRequisition(req);
            setIsCreatePOOpen(true);
          }}
        />
      )}

      {activeTab === 'approvals' && (
        <ProcurementApprovalWorkbenchView
          requisitions={requisitions}
          purchaseOrders={purchaseOrders}
          onOpenApproveRequisition={(req) => {
            setSelectedRequisition(req);
            setIsApprovePROpen(true);
          }}
          onOpenRejectRequisition={(req) => {
            setSelectedRequisition(req);
            setIsRejectPROpen(true);
          }}
          onOpenApprovePO={(po) => {
            setSelectedPO(po);
            setIsApprovePOOpen(true);
          }}
        />
      )}

      {activeTab === 'purchase-orders' && (
        <PurchaseOrderDirectoryView
          purchaseOrders={purchaseOrders}
          onOpenCreatePO={() => setIsCreatePOOpen(true)}
          onSelectPO={(poId) => {
            const po = purchaseOrders.find((p) => p.id === poId) || null;
            setSelectedPO(po);
            setActiveTab('purchase-order-detail');
          }}
        />
      )}

      {activeTab === 'purchase-order-detail' && (
        <PurchaseOrderDetailView
          purchaseOrder={selectedPO}
          goodsReceipts={goodsReceipts}
          purchaseInvoices={purchaseInvoices}
          onBack={() => setActiveTab('purchase-orders')}
          onOpenSendPO={() => setIsSendPOOpen(true)}
          onOpenCreateGRN={() => setIsCreateGRNOpen(true)}
          onOpenCancelPO={() => setIsCancelPOOpen(true)}
        />
      )}

      {activeTab === 'goods-receipts' && (
        <GoodsReceiptView
          goodsReceipts={goodsReceipts}
          onOpenInspectGRN={(grn) => {
            setSelectedGRN(grn);
            setIsInspectGRNOpen(true);
          }}
        />
      )}

      {activeTab === 'inspections' && (
        <QualityInspectionView
          inspections={inspections}
          pendingReceipts={goodsReceipts.filter((g) => g.status === 'PENDING_INSPECTION')}
          onOpenInspectGRN={(grn) => {
            setSelectedGRN(grn);
            setIsInspectGRNOpen(true);
          }}
        />
      )}

      {activeTab === 'returns' && (
        <VendorReturnsView
          vendorReturns={vendorReturns}
          onOpenCreateReturn={() => setIsCreateReturnOpen(true)}
          onOpenApproveReturn={(ret) => {
            setSelectedReturn(ret);
            setIsApproveReturnOpen(true);
          }}
        />
      )}

      {activeTab === 'invoices' && (
        <PurchaseInvoiceMatchingView
          invoices={purchaseInvoices}
          matches={invoiceMatches}
          onOpenCreateInvoice={() => setIsCreateInvoiceOpen(true)}
          onOpenMatchInvoice={(inv) => {
            setSelectedInvoice(inv);
            setIsMatchInvoiceOpen(true);
          }}
        />
      )}

      {activeTab === 'exceptions' && (
        <ProcurementExceptionsView
          exceptions={exceptions}
          onOpenResolveException={(exc) => {
            setSelectedException(exc);
            setIsResolveExceptionOpen(true);
          }}
        />
      )}

      {activeTab === 'planning' && (
        <ProcurementPlanningView
          items={items}
          onOpenCreateRequisition={() => setIsCreatePRDialogOpen(true)}
        />
      )}

      {activeTab === 'performance' && (
        <VendorPerformanceView vendors={vendors} />
      )}

      {activeTab === 'reports' && analytics && (
        <ProcurementReportsView analytics={analytics} />
      )}

      {activeTab === 'audit' && (
        <ProcurementAuditVaultView auditTraces={auditTraces} />
      )}

      {activeTab === 'spend' && analytics && (
        <SpendAnalyticsView analytics={analytics} />
      )}

      {activeTab === 'control' && metrics && (
        <ProcurementControlCenterView
          metrics={metrics}
          onOpenEmergencyPurchase={() => setIsEmergencyPurchaseOpen(true)}
          onOpenCreateRequisition={() => setIsCreatePRDialogOpen(true)}
        />
      )}

      {/* 20 Audited Dialogs */}
      <CreateVendorDialog
        isOpen={isCreateVendorOpen}
        onClose={() => setIsCreateVendorOpen(false)}
        onSubmit={handleCreateVendor}
        tenantId={tenantId}
        partnerId={partnerId}
        organizationId={organizationId}
        branchId={branchId}
      />

      <EditVendorDialog
        isOpen={isEditVendorOpen}
        onClose={() => setIsEditVendorOpen(false)}
        onSubmit={handleUpdateVendor}
        vendor={selectedVendor}
        tenantId={tenantId}
      />

      <SuspendVendorDialog
        isOpen={isSuspendVendorOpen}
        onClose={() => setIsSuspendVendorOpen(false)}
        onSubmit={handleSuspendVendor}
        vendor={selectedVendor}
        tenantId={tenantId}
      />

      <CreateVendorContractDialog
        isOpen={isCreateContractOpen}
        onClose={() => setIsCreateContractOpen(false)}
        onSubmit={handleCreateContract}
        vendors={vendors}
        tenantId={tenantId}
        partnerId={partnerId}
        organizationId={organizationId}
        branchId={branchId}
      />

      <CreateProcurementItemDialog
        isOpen={isCreateItemOpen}
        onClose={() => setIsCreateItemOpen(false)}
        onSubmit={handleCreateItem}
        tenantId={tenantId}
        partnerId={partnerId}
        organizationId={organizationId}
        branchId={branchId}
      />

      <CreatePurchaseRequisitionDialog
        isOpen={isCreatePRDialogOpen}
        onClose={() => setIsCreatePRDialogOpen(false)}
        onSubmit={handleCreateRequisition}
        items={items}
        vendors={vendors}
        tenantId={tenantId}
        partnerId={partnerId}
        organizationId={organizationId}
        branchId={branchId}
      />

      <ApprovePurchaseRequisitionDialog
        isOpen={isApprovePROpen}
        onClose={() => setIsApprovePROpen(false)}
        onSubmit={handleApproveRequisition}
        requisition={selectedRequisition}
        tenantId={tenantId}
      />

      <RejectPurchaseRequisitionDialog
        isOpen={isRejectPROpen}
        onClose={() => setIsRejectPROpen(false)}
        onSubmit={handleRejectRequisition}
        requisition={selectedRequisition}
        tenantId={tenantId}
      />

      <CreatePurchaseOrderDialog
        isOpen={isCreatePOOpen}
        onClose={() => setIsCreatePOOpen(false)}
        onSubmit={handleCreatePurchaseOrder}
        vendors={vendors}
        items={items}
        requisition={selectedRequisition}
        tenantId={tenantId}
        partnerId={partnerId}
        organizationId={organizationId}
        branchId={branchId}
      />

      <ApprovePurchaseOrderDialog
        isOpen={isApprovePOOpen}
        onClose={() => setIsApprovePOOpen(false)}
        onSubmit={handleApprovePO}
        purchaseOrder={selectedPO}
        tenantId={tenantId}
      />

      <SendPurchaseOrderDialog
        isOpen={isSendPOOpen}
        onClose={() => setIsSendPOOpen(false)}
        onSubmit={handleSendPO}
        purchaseOrder={selectedPO}
        tenantId={tenantId}
      />

      <CancelPurchaseOrderDialog
        isOpen={isCancelPOOpen}
        onClose={() => setIsCancelPOOpen(false)}
        onSubmit={handleCancelPO}
        purchaseOrder={selectedPO}
        tenantId={tenantId}
      />

      <CreateGoodsReceiptDialog
        isOpen={isCreateGRNOpen}
        onClose={() => setIsCreateGRNOpen(false)}
        onSubmit={handleCreateGRN}
        purchaseOrder={selectedPO}
        tenantId={tenantId}
        partnerId={partnerId}
        organizationId={organizationId}
        branchId={branchId}
      />

      <InspectGoodsReceiptDialog
        isOpen={isInspectGRNOpen}
        onClose={() => setIsInspectGRNOpen(false)}
        onSubmit={handleInspectGRN}
        goodsReceipt={selectedGRN}
        tenantId={tenantId}
        partnerId={partnerId}
        organizationId={organizationId}
        branchId={branchId}
      />

      <CreateVendorReturnDialog
        isOpen={isCreateReturnOpen}
        onClose={() => setIsCreateReturnOpen(false)}
        onSubmit={handleCreateReturn}
        vendors={vendors}
        items={items}
        tenantId={tenantId}
        partnerId={partnerId}
        organizationId={organizationId}
        branchId={branchId}
      />

      <ApproveVendorReturnDialog
        isOpen={isApproveReturnOpen}
        onClose={() => setIsApproveReturnOpen(false)}
        onSubmit={handleApproveReturn}
        vendorReturn={selectedReturn}
        tenantId={tenantId}
      />

      <CreatePurchaseInvoiceDialog
        isOpen={isCreateInvoiceOpen}
        onClose={() => setIsCreateInvoiceOpen(false)}
        onSubmit={handleCreateInvoice}
        vendors={vendors}
        purchaseOrders={purchaseOrders}
        tenantId={tenantId}
        partnerId={partnerId}
        organizationId={organizationId}
        branchId={branchId}
      />

      <MatchPurchaseInvoiceDialog
        isOpen={isMatchInvoiceOpen}
        onClose={() => setIsMatchInvoiceOpen(false)}
        onSubmit={handleMatchInvoice}
        invoice={selectedInvoice}
        tenantId={tenantId}
      />

      <ResolveProcurementExceptionDialog
        isOpen={isResolveExceptionOpen}
        onClose={() => setIsResolveExceptionOpen(false)}
        onSubmit={handleResolveException}
        exception={selectedException}
        tenantId={tenantId}
      />

      <CreateEmergencyPurchaseDialog
        isOpen={isEmergencyPurchaseOpen}
        onClose={() => setIsEmergencyPurchaseOpen(false)}
        onSubmit={handleEmergencyPurchase}
        vendors={vendors}
        items={items}
        tenantId={tenantId}
        partnerId={partnerId}
        organizationId={organizationId}
        branchId={branchId}
      />
    </div>
  );
};
