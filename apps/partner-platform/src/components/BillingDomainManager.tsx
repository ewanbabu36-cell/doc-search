import React, { useState, useEffect, useCallback } from 'react';
import type {
  BillingOverviewDto,
  BillingServiceCatalogDto,
  BillingPriceListDto,
  BillingChargeDto,
  BillingInvoiceDto,
  BillingPaymentDto,
  BillingReceiptDto,
  BillingRefundDto,
  BillingCreditNoteDto,
  BillingDebitAdjustmentDto,
  BillingAdvanceDto,
  BillingCashierSessionDto,
  BillingReconciliationDto,
  BillingFinancialTransactionDto,
  BillingAuditTraceDto,
  PatientBillingHistoryDto,
  RevenueAnalyticsDto,
  PanelContextDto,
  OperationalPartnerDto,
  OperationalOrganizationDto,
  OperationalFacilityDto,
  CreateServiceCatalogRequest,
  CreatePriceListRequest,
  CaptureChargeRequest,
  CreateInvoiceRequest,
  FinalizeInvoiceRequest,
  ApplyDiscountRequest,
  RecordPaymentRequest,
  AllocatePaymentRequest,
  IssueReceiptRequest,
  RequestRefundRequest,
  ApproveRefundRequest,
  ProcessRefundRequest,
  CreateCreditNoteRequest,
  CreateDebitAdjustmentRequest,
  OpenCashierSessionRequest,
  CloseCashierSessionRequest,
  ReconcileCashierSessionRequest,
  CancelInvoiceRequest
} from '@docsearch/api-contracts';
import { billingManagementService } from '../services/billing-management-service.js';
import { partnerFoundationService } from '../services/partner-foundation-service.js';

import { PanelContextSwitcher } from './common/PanelContextSwitcher.js';
import { BillingOverviewView } from './views/BillingOverviewView.js';
import { BillingChargeDirectoryView } from './views/BillingChargeDirectoryView.js';
import { InvoiceDirectoryView } from './views/InvoiceDirectoryView.js';
import { InvoiceDetailView } from './views/InvoiceDetailView.js';
import { PaymentCollectionView } from './views/PaymentCollectionView.js';
import { OutstandingReceivablesView } from './views/OutstandingReceivablesView.js';
import { RefundManagementView } from './views/RefundManagementView.js';
import { CashierSessionView } from './views/CashierSessionView.js';
import { PricingCatalogView } from './views/PricingCatalogView.js';
import { RevenueAnalyticsView } from './views/RevenueAnalyticsView.js';
import { PatientBillingHistoryView } from './views/PatientBillingHistoryView.js';
import { BillingAuditVaultView } from './views/BillingAuditVaultView.js';
import { DynamicUpiInvoiceView } from './views/DynamicUpiInvoiceView.js';

// Dialogs
import { CreateServiceCatalogDialog } from './dialogs/CreateServiceCatalogDialog.js';
import { CreatePriceListDialog } from './dialogs/CreatePriceListDialog.js';
import { CaptureChargeDialog } from './dialogs/CaptureChargeDialog.js';
import { CreateInvoiceDialog } from './dialogs/CreateInvoiceDialog.js';
import { FinalizeInvoiceDialog } from './dialogs/FinalizeInvoiceDialog.js';
import { ApplyDiscountDialog } from './dialogs/ApplyDiscountDialog.js';
import { RecordPaymentDialog } from './dialogs/RecordPaymentDialog.js';
import { AllocatePaymentDialog } from './dialogs/AllocatePaymentDialog.js';
import { IssueReceiptDialog } from './dialogs/IssueReceiptDialog.js';
import { RequestRefundDialog } from './dialogs/RequestRefundDialog.js';
import { ApproveRefundDialog } from './dialogs/ApproveRefundDialog.js';
import { ProcessRefundDialog } from './dialogs/ProcessRefundDialog.js';
import { CreateCreditNoteDialog } from './dialogs/CreateCreditNoteDialog.js';
import { CreateDebitAdjustmentDialog } from './dialogs/CreateDebitAdjustmentDialog.js';
import { OpenCashierSessionDialog } from './dialogs/OpenCashierSessionDialog.js';
import { CloseCashierSessionDialog } from './dialogs/CloseCashierSessionDialog.js';
import { ReconcileCashierSessionDialog } from './dialogs/ReconcileCashierSessionDialog.js';
import { CancelInvoiceDialog } from './dialogs/CancelInvoiceDialog.js';

export interface BillingDomainManagerProps {
  tenantId: string;
  initialContext?: PanelContextDto;
}

export const BillingDomainManager: React.FC<BillingDomainManagerProps> = ({
  tenantId,
  initialContext
}) => {
  const [activeTab, setActiveTab] = useState<string>('overview');

  // Hierarchy Context
  const [partners, setPartners] = useState<OperationalPartnerDto[]>([]);
  const [organizations, setOrganizations] = useState<OperationalOrganizationDto[]>([]);
  const [branches, setBranches] = useState<OperationalFacilityDto[]>([]);
  const [context, setContext] = useState<PanelContextDto>(
    initialContext || {
      userEmail: 'billing.admin@docsearch.docsearch.health',
      userRole: 'BILLING_DIRECTOR',
      activeTenantId: tenantId,
      activeTenantName: 'Apex Healthcare System',
      activePartnerId: '22222222-2222-4222-8222-222222222201',
      activePartnerName: 'Doc Search Healthcare Network',
      activeOrganizationId: '44444444-4444-4444-8444-444444444401',
      activeOrganizationName: 'Apex Metropolitan Hospital',
      activeFacilityId: '88888888-1111-4888-8888-111111111101',
      activeFacilityName: 'Apex Central Hospital'
    }
  );

  // Core Billing Data State
  const [overview, setOverview] = useState<BillingOverviewDto | null>(null);
  const [services, setServices] = useState<BillingServiceCatalogDto[]>([]);
  const [priceLists, setPriceLists] = useState<BillingPriceListDto[]>([]);
  const [charges, setCharges] = useState<BillingChargeDto[]>([]);
  const [invoices, setInvoices] = useState<BillingInvoiceDto[]>([]);
  const [payments, setPayments] = useState<BillingPaymentDto[]>([]);
  const [receipts, setReceipts] = useState<BillingReceiptDto[]>([]);
  const [refunds, setRefunds] = useState<BillingRefundDto[]>([]);
  const [, setCreditNotes] = useState<BillingCreditNoteDto[]>([]);
  const [, setDebitAdjustments] = useState<BillingDebitAdjustmentDto[]>([]);
  const [, setAdvances] = useState<BillingAdvanceDto[]>([]);
  const [cashierSessions, setCashierSessions] = useState<BillingCashierSessionDto[]>([]);
  const [reconciliations, setReconciliations] = useState<BillingReconciliationDto[]>([]);
  const [transactions, setTransactions] = useState<BillingFinancialTransactionDto[]>([]);
  const [auditTraces, setAuditTraces] = useState<BillingAuditTraceDto[]>([]);
  const [patientHistory, setPatientHistory] = useState<PatientBillingHistoryDto | null>(null);
  const [analytics, setAnalytics] = useState<RevenueAnalyticsDto | null>(null);

  // Selection & Selected Item State
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<BillingInvoiceDto | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<BillingPaymentDto | null>(null);
  const [selectedRefund, setSelectedRefund] = useState<BillingRefundDto | null>(null);
  const [selectedSession, setSelectedSession] = useState<BillingCashierSessionDto | null>(null);

  // Dialog Visibility Flags
  const [isCreateServiceOpen, setIsCreateServiceOpen] = useState(false);
  const [isCreatePriceListOpen, setIsCreatePriceListOpen] = useState(false);
  const [isCaptureChargeOpen, setIsCaptureChargeOpen] = useState(false);
  const [isCreateInvoiceOpen, setIsCreateInvoiceOpen] = useState(false);
  const [isFinalizeInvoiceOpen, setIsFinalizeInvoiceOpen] = useState(false);
  const [isApplyDiscountOpen, setIsApplyDiscountOpen] = useState(false);
  const [isRecordPaymentOpen, setIsRecordPaymentOpen] = useState(false);
  const [isAllocatePaymentOpen, setIsAllocatePaymentOpen] = useState(false);
  const [isIssueReceiptOpen, setIsIssueReceiptOpen] = useState(false);
  const [isRequestRefundOpen, setIsRequestRefundOpen] = useState(false);
  const [isApproveRefundOpen, setIsApproveRefundOpen] = useState(false);
  const [isProcessRefundOpen, setIsProcessRefundOpen] = useState(false);
  const [isCreateCreditNoteOpen, setIsCreateCreditNoteOpen] = useState(false);
  const [isCreateDebitAdjOpen, setIsCreateDebitAdjOpen] = useState(false);
  const [isOpenCashierOpen, setIsOpenCashierOpen] = useState(false);
  const [isCloseCashierOpen, setIsCloseCashierOpen] = useState(false);
  const [isReconcileCashierOpen, setIsReconcileCashierOpen] = useState(false);
  const [isCancelInvoiceOpen, setIsCancelInvoiceOpen] = useState(false);

  // Load Hierarchy Context
  useEffect(() => {
    const loadHierarchy = async () => {
      try {
        const pList = await partnerFoundationService.getPartners(tenantId);
        setPartners(pList);
        if (pList[0]) {
          const oList = await partnerFoundationService.getOrganizations(tenantId, pList[0].id);
          setOrganizations(oList);
          if (oList[0]) {
            const fList = await partnerFoundationService.getFacilities(tenantId, oList[0].id);
            setBranches(fList);
          }
        }
      } catch (err) {
        console.error('Failed to load billing hierarchy:', err);
      }
    };
    loadHierarchy();
  }, [tenantId]);

  // Load Domain Data
  const loadData = useCallback(async () => {
    try {
      const [
        ov,
        srvList,
        plList,
        chgList,
        invList,
        pmtList,
        rcptList,
        rfndList,
        crList,
        drList,
        advList,
        sessList,
        recList,
        txList,
        audList,
        anList,
        patHist
      ] = await Promise.all([
        billingManagementService.getOverview(tenantId, context.activeFacilityId),
        billingManagementService.getServiceCatalog(tenantId),
        billingManagementService.getPriceLists(tenantId, context.activeFacilityId),
        billingManagementService.getCharges({ tenantId, branchId: context.activeFacilityId, pageIndex: 0, pageSize: 100 }),
        billingManagementService.getInvoices({ tenantId, branchId: context.activeFacilityId, pageIndex: 0, pageSize: 100 }),
        billingManagementService.getPayments(tenantId, context.activeFacilityId),
        billingManagementService.getReceipts(tenantId, context.activeFacilityId),
        billingManagementService.getRefunds(tenantId, context.activeFacilityId),
        billingManagementService.getCreditNotes(tenantId, context.activeFacilityId),
        billingManagementService.getDebitAdjustments(tenantId, context.activeFacilityId),
        billingManagementService.getAdvances(tenantId, context.activeFacilityId),
        billingManagementService.getCashierSessions(tenantId, context.activeFacilityId),
        billingManagementService.getReconciliations(tenantId, context.activeFacilityId),
        billingManagementService.getFinancialTransactions(tenantId, context.activeFacilityId),
        billingManagementService.getBillingAuditTrail({ tenantId, branchId: context.activeFacilityId, pageIndex: 0, pageSize: 100 }),
        billingManagementService.getRevenueAnalytics(tenantId, context.activeFacilityId),
        billingManagementService.getPatientBillingHistory(tenantId, '55555555-5555-4555-8555-555555555501')
      ]);

      setOverview(ov);
      setServices(srvList);
      setPriceLists(plList);
      setCharges(chgList);
      setInvoices(invList);
      setPayments(pmtList);
      setReceipts(rcptList);
      setRefunds(rfndList);
      setCreditNotes(crList);
      setDebitAdjustments(drList);
      setAdvances(advList);
      setCashierSessions(sessList);
      setReconciliations(recList);
      setTransactions(txList);
      setAuditTraces(audList);
      setAnalytics(anList);
      setPatientHistory(patHist);

      if (selectedInvoiceId) {
        const found = invList.find((i) => i.id === selectedInvoiceId);
        setSelectedInvoice(found || null);
      }
    } catch (err) {
      console.error('Failed to load billing operational data:', err);
    }
  }, [tenantId, context.activeFacilityId, selectedInvoiceId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Nav Handlers
  const handleSelectInvoice = (invoiceId: string) => {
    setSelectedInvoiceId(invoiceId);
    const found = invoices.find((i) => i.id === invoiceId);
    setSelectedInvoice(found || null);
    setActiveTab('invoice-detail');
  };

  // Dialog Actions
  const handleCreateService = async (req: CreateServiceCatalogRequest) => {
    await billingManagementService.createService(req);
    await loadData();
  };

  const handleCreatePriceList = async (req: CreatePriceListRequest) => {
    await billingManagementService.createPriceList(req);
    await loadData();
  };

  const handleCaptureCharge = async (req: CaptureChargeRequest) => {
    await billingManagementService.captureCharge(req);
    await loadData();
  };

  const handleCreateInvoice = async (req: CreateInvoiceRequest) => {
    const inv = await billingManagementService.createInvoice(req);
    await loadData();
    handleSelectInvoice(inv.id);
  };

  const handleFinalizeInvoice = async (req: FinalizeInvoiceRequest) => {
    await billingManagementService.finalizeInvoice(req);
    await loadData();
  };

  const handleApplyDiscount = async (req: ApplyDiscountRequest) => {
    await billingManagementService.applyDiscount(req);
    await loadData();
  };

  const handleRecordPayment = async (req: RecordPaymentRequest) => {
    await billingManagementService.recordPayment(req);
    await loadData();
  };

  const handleAllocatePayment = async (req: AllocatePaymentRequest) => {
    await billingManagementService.allocatePayment(req);
    await loadData();
  };

  const handleIssueReceipt = async (req: IssueReceiptRequest) => {
    await billingManagementService.issueReceipt(req);
    await loadData();
  };

  const handleRequestRefund = async (req: RequestRefundRequest) => {
    await billingManagementService.requestRefund(req);
    await loadData();
  };

  const handleApproveRefund = async (req: ApproveRefundRequest) => {
    await billingManagementService.approveRefund(req);
    await loadData();
  };

  const handleProcessRefund = async (req: ProcessRefundRequest) => {
    await billingManagementService.processRefund(req);
    await loadData();
  };

  const handleCreateCreditNote = async (req: CreateCreditNoteRequest) => {
    await billingManagementService.createCreditNote(req);
    await loadData();
  };

  const handleCreateDebitAdjustment = async (req: CreateDebitAdjustmentRequest) => {
    await billingManagementService.createDebitAdjustment(req);
    await loadData();
  };

  const handleOpenCashierSession = async (req: OpenCashierSessionRequest) => {
    await billingManagementService.openCashierSession(req);
    await loadData();
  };

  const handleCloseCashierSession = async (req: CloseCashierSessionRequest) => {
    await billingManagementService.closeCashierSession(req);
    await loadData();
  };

  const handleReconcileCashierSession = async (req: ReconcileCashierSessionRequest) => {
    await billingManagementService.reconcileCashierSession(req);
    await loadData();
  };

  const handleCancelInvoice = async (req: CancelInvoiceRequest) => {
    await billingManagementService.cancelInvoice(req);
    await loadData();
  };

  const handleSearchPatientHistory = async (patientId: string) => {
    const res = await billingManagementService.getPatientBillingHistory(tenantId, patientId);
    return res;
  };

  const tabs = [
    { id: 'overview', label: 'Billing Overview' },
    { id: 'charges', label: `Charges (${charges.length})` },
    { id: 'invoices', label: `Invoices (${invoices.length})` },
    { id: 'payment-collection', label: `Cashier POS (${payments.length})` },
    { id: 'receivables', label: `Receivables (${invoices.filter((i) => i.dueAmount > 0).length})` },
    { id: 'refunds', label: `Refunds (${refunds.length})` },
    { id: 'cashier-sessions', label: `Cashier Shifts (${cashierSessions.length})` },
    { id: 'pricing-catalog', label: `Pricing Master (${services.length})` },
    { id: 'analytics', label: 'Revenue Analytics' },
    { id: 'patient-history', label: 'Patient Ledger' },
    { id: 'audit-vault', label: `Audit Vault (${auditTraces.length})` }
  ];

  if (selectedInvoice && activeTab === 'invoice-detail') {
    tabs.splice(3, 0, { id: 'invoice-detail', label: `Invoice ${selectedInvoice.invoiceNumber}` });
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', padding: '1.5rem' }}>
      {/* Hierarchy Switcher */}
      <PanelContextSwitcher
        context={context}
        partners={partners}
        organizations={organizations}
        facilities={branches}
        onContextChange={(newCtx) => setContext((prev) => ({ ...prev, ...newCtx }))}
      />

      {/* Domain Navigation Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem' }}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '0.6rem 1rem',
              borderRadius: '6px',
              border: 'none',
              backgroundColor: activeTab === tab.id ? '#2563eb' : '#f1f5f9',
              color: activeTab === tab.id ? '#ffffff' : '#334155',
              fontWeight: 600,
              fontSize: '0.85rem',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Views */}
      {activeTab === 'overview' && overview && (
        <BillingOverviewView
          overview={overview}
          invoices={invoices}
          charges={charges}
          payments={payments}
          cashierSessions={cashierSessions}
          onOpenCreateInvoice={() => setIsCreateInvoiceOpen(true)}
          onOpenCaptureCharge={() => setIsCaptureChargeOpen(true)}
          onOpenRecordPayment={() => {
            setSelectedInvoice(null);
            setIsRecordPaymentOpen(true);
          }}
          onOpenCashierSession={() => setIsOpenCashierOpen(true)}
          onSelectInvoice={handleSelectInvoice}
          onOpenTab={(tabKey) => setActiveTab(tabKey)}
        />
      )}

      {activeTab === 'charges' && (
        <BillingChargeDirectoryView
          charges={charges}
          onOpenCaptureCharge={() => setIsCaptureChargeOpen(true)}
          onCreateInvoiceFromCharge={(ch) => {
            handleCreateInvoice({
              tenantId,
              partnerId: ch.partnerId,
              organizationId: ch.organizationId,
              branchId: ch.branchId,
              patientId: ch.patientId,
              patientName: ch.patientName,
              patientMrn: ch.patientMrn,
              invoiceType: ch.sourceDomain === 'PHARMACY' ? 'PHARMACY' : 'OPD',
              chargeIds: [ch.id],
              items: ch.items.map((it) => ({
                chargeId: ch.id,
                chargeItemId: it.id,
                serviceCatalogId: it.serviceCatalogId || undefined,
                serviceCode: it.serviceCode || 'SRV-GEN',
                description: it.description,
                quantity: it.quantity,
                unitPrice: it.unitPrice,
                discountAmount: it.discountAmount,
                taxAmount: it.taxAmount
              })),
              dueDays: 30,
              actorId: 'Billing Officer',
              actorRole: 'Billing Attendant',
              justification: `Invoice created directly from charge ${ch.chargeNumber}`
            });
          }}
        />
      )}

      {activeTab === 'dynamic-upi' && (
        <DynamicUpiInvoiceView />
      )}

      {activeTab === 'invoices' && (
        <InvoiceDirectoryView
          invoices={invoices}
          onOpenCreateInvoice={() => setIsCreateInvoiceOpen(true)}
          onSelectInvoice={handleSelectInvoice}
          onOpenRecordPayment={(inv) => {
            setSelectedInvoice(inv);
            setIsRecordPaymentOpen(true);
          }}
        />
      )}

      {activeTab === 'invoice-detail' && selectedInvoice && (
        <InvoiceDetailView
          invoice={selectedInvoice}
          onBack={() => setActiveTab('invoices')}
          onFinalize={(inv) => {
            setSelectedInvoice(inv);
            setIsFinalizeInvoiceOpen(true);
          }}
          onApplyDiscount={(inv) => {
            setSelectedInvoice(inv);
            setIsApplyDiscountOpen(true);
          }}
          onRecordPayment={(inv) => {
            setSelectedInvoice(inv);
            setIsRecordPaymentOpen(true);
          }}
          onCreateCreditNote={(inv) => {
            setSelectedInvoice(inv);
            setIsCreateCreditNoteOpen(true);
          }}
          onCreateDebitAdjustment={(inv) => {
            setSelectedInvoice(inv);
            setIsCreateDebitAdjOpen(true);
          }}
          onCancelInvoice={(inv) => {
            setSelectedInvoice(inv);
            setIsCancelInvoiceOpen(true);
          }}
        />
      )}

      {activeTab === 'payment-collection' && (
        <PaymentCollectionView
          payments={payments}
          receipts={receipts}
          onOpenRecordPayment={() => {
            setSelectedInvoice(null);
            setIsRecordPaymentOpen(true);
          }}
          onOpenIssueReceipt={(pmt) => {
            setSelectedPayment(pmt);
            setIsIssueReceiptOpen(true);
          }}
          onOpenRefundRequest={(pmt) => {
            setSelectedPayment(pmt);
            setIsRequestRefundOpen(true);
          }}
        />
      )}

      {activeTab === 'receivables' && analytics && (
        <OutstandingReceivablesView
          invoices={invoices}
          analytics={analytics}
          onOpenRecordPayment={(inv) => {
            setSelectedInvoice(inv);
            setIsRecordPaymentOpen(true);
          }}
          onSelectInvoice={handleSelectInvoice}
        />
      )}

      {activeTab === 'refunds' && (
        <RefundManagementView
          refunds={refunds}
          onApproveRefund={(r) => {
            setSelectedRefund(r);
            setIsApproveRefundOpen(true);
          }}
          onProcessRefund={(r) => {
            setSelectedRefund(r);
            setIsProcessRefundOpen(true);
          }}
        />
      )}

      {activeTab === 'cashier-sessions' && (
        <CashierSessionView
          sessions={cashierSessions}
          reconciliations={reconciliations}
          onOpenSession={() => setIsOpenCashierOpen(true)}
          onCloseSession={(sess) => {
            setSelectedSession(sess);
            setIsCloseCashierOpen(true);
          }}
          onReconcileSession={(sess) => {
            setSelectedSession(sess);
            setIsReconcileCashierOpen(true);
          }}
        />
      )}

      {activeTab === 'pricing-catalog' && (
        <PricingCatalogView
          services={services}
          priceLists={priceLists}
          onOpenCreateService={() => setIsCreateServiceOpen(true)}
          onOpenCreatePriceList={() => setIsCreatePriceListOpen(true)}
        />
      )}

      {activeTab === 'analytics' && analytics && (
        <RevenueAnalyticsView analytics={analytics} />
      )}

      {activeTab === 'patient-history' && (
        <PatientBillingHistoryView
          initialHistory={patientHistory}
          onSearchPatient={handleSearchPatientHistory}
          onSelectInvoice={handleSelectInvoice}
        />
      )}

      {activeTab === 'audit-vault' && (
        <BillingAuditVaultView
          auditTraces={auditTraces}
          transactions={transactions}
        />
      )}

      {/* 18 Modals & Audited Dialogs */}
      <CreateServiceCatalogDialog
        isOpen={isCreateServiceOpen}
        onClose={() => setIsCreateServiceOpen(false)}
        onSubmit={handleCreateService}
        tenantId={tenantId}
        partnerId={context.activePartnerId}
        organizationId={context.activeOrganizationId || '44444444-4444-4444-8444-444444444401'}
        branchId={context.activeFacilityId}
      />

      <CreatePriceListDialog
        isOpen={isCreatePriceListOpen}
        onClose={() => setIsCreatePriceListOpen(false)}
        onSubmit={handleCreatePriceList}
        services={services}
        tenantId={tenantId}
        partnerId={context.activePartnerId}
        organizationId={context.activeOrganizationId || '44444444-4444-4444-8444-444444444401'}
        branchId={context.activeFacilityId}
      />

      <CaptureChargeDialog
        isOpen={isCaptureChargeOpen}
        onClose={() => setIsCaptureChargeOpen(false)}
        onSubmit={handleCaptureCharge}
        services={services}
        tenantId={tenantId}
        partnerId={context.activePartnerId}
        organizationId={context.activeOrganizationId || '44444444-4444-4444-8444-444444444401'}
        branchId={context.activeFacilityId || '88888888-1111-4888-8888-111111111101'}
      />

      <CreateInvoiceDialog
        isOpen={isCreateInvoiceOpen}
        onClose={() => setIsCreateInvoiceOpen(false)}
        onSubmit={handleCreateInvoice}
        pendingCharges={charges.filter((c) => c.status === 'CAPTURED')}
        tenantId={tenantId}
        partnerId={context.activePartnerId}
        organizationId={context.activeOrganizationId || '44444444-4444-4444-8444-444444444401'}
        branchId={context.activeFacilityId || '88888888-1111-4888-8888-111111111101'}
      />

      <FinalizeInvoiceDialog
        isOpen={isFinalizeInvoiceOpen}
        onClose={() => setIsFinalizeInvoiceOpen(false)}
        onSubmit={handleFinalizeInvoice}
        invoice={selectedInvoice}
        tenantId={tenantId}
      />

      <ApplyDiscountDialog
        isOpen={isApplyDiscountOpen}
        onClose={() => setIsApplyDiscountOpen(false)}
        onSubmit={handleApplyDiscount}
        invoice={selectedInvoice}
        tenantId={tenantId}
        partnerId={context.activePartnerId}
        organizationId={context.activeOrganizationId || '44444444-4444-4444-8444-444444444401'}
        branchId={context.activeFacilityId}
      />

      <RecordPaymentDialog
        isOpen={isRecordPaymentOpen}
        onClose={() => setIsRecordPaymentOpen(false)}
        onSubmit={handleRecordPayment}
        invoice={selectedInvoice}
        tenantId={tenantId}
        partnerId={context.activePartnerId}
        organizationId={context.activeOrganizationId || '44444444-4444-4444-8444-444444444401'}
        branchId={context.activeFacilityId || '88888888-1111-4888-8888-111111111101'}
      />

      <AllocatePaymentDialog
        isOpen={isAllocatePaymentOpen}
        onClose={() => setIsAllocatePaymentOpen(false)}
        onSubmit={handleAllocatePayment}
        payment={selectedPayment}
        openInvoices={invoices.filter((i) => i.dueAmount > 0)}
        tenantId={tenantId}
      />

      <IssueReceiptDialog
        isOpen={isIssueReceiptOpen}
        onClose={() => setIsIssueReceiptOpen(false)}
        onSubmit={handleIssueReceipt}
        payment={selectedPayment}
        tenantId={tenantId}
      />

      <RequestRefundDialog
        isOpen={isRequestRefundOpen}
        onClose={() => setIsRequestRefundOpen(false)}
        onSubmit={handleRequestRefund}
        payment={selectedPayment}
        tenantId={tenantId}
        partnerId={context.activePartnerId}
        organizationId={context.activeOrganizationId || '44444444-4444-4444-8444-444444444401'}
        branchId={context.activeFacilityId || '88888888-1111-4888-8888-111111111101'}
      />

      <ApproveRefundDialog
        isOpen={isApproveRefundOpen}
        onClose={() => setIsApproveRefundOpen(false)}
        onSubmit={handleApproveRefund}
        refund={selectedRefund}
        tenantId={tenantId}
      />

      <ProcessRefundDialog
        isOpen={isProcessRefundOpen}
        onClose={() => setIsProcessRefundOpen(false)}
        onSubmit={handleProcessRefund}
        refund={selectedRefund}
        tenantId={tenantId}
      />

      <CreateCreditNoteDialog
        isOpen={isCreateCreditNoteOpen}
        onClose={() => setIsCreateCreditNoteOpen(false)}
        onSubmit={handleCreateCreditNote}
        invoice={selectedInvoice}
        tenantId={tenantId}
        partnerId={context.activePartnerId}
        organizationId={context.activeOrganizationId || '44444444-4444-4444-8444-444444444401'}
        branchId={context.activeFacilityId || '88888888-1111-4888-8888-111111111101'}
      />

      <CreateDebitAdjustmentDialog
        isOpen={isCreateDebitAdjOpen}
        onClose={() => setIsCreateDebitAdjOpen(false)}
        onSubmit={handleCreateDebitAdjustment}
        invoice={selectedInvoice}
        tenantId={tenantId}
        partnerId={context.activePartnerId}
        organizationId={context.activeOrganizationId || '44444444-4444-4444-8444-444444444401'}
        branchId={context.activeFacilityId || '88888888-1111-4888-8888-111111111101'}
      />

      <OpenCashierSessionDialog
        isOpen={isOpenCashierOpen}
        onClose={() => setIsOpenCashierOpen(false)}
        onSubmit={handleOpenCashierSession}
        tenantId={tenantId}
        partnerId={context.activePartnerId}
        organizationId={context.activeOrganizationId || '44444444-4444-4444-8444-444444444401'}
        branchId={context.activeFacilityId || '88888888-1111-4888-8888-111111111101'}
      />

      <CloseCashierSessionDialog
        isOpen={isCloseCashierOpen}
        onClose={() => setIsCloseCashierOpen(false)}
        onSubmit={handleCloseCashierSession}
        session={selectedSession}
        tenantId={tenantId}
      />

      <ReconcileCashierSessionDialog
        isOpen={isReconcileCashierOpen}
        onClose={() => setIsReconcileCashierOpen(false)}
        onSubmit={handleReconcileCashierSession}
        session={selectedSession}
        tenantId={tenantId}
      />

      <CancelInvoiceDialog
        isOpen={isCancelInvoiceOpen}
        onClose={() => setIsCancelInvoiceOpen(false)}
        onSubmit={handleCancelInvoice}
        invoice={selectedInvoice}
        tenantId={tenantId}
      />
    </div>
  );
};
