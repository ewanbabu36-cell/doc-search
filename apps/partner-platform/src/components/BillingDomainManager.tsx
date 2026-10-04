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
import { CreateInvoiceView } from './views/CreateInvoiceView.js';
import { InstantBillSettlementView } from './views/InstantBillSettlementView.js';
import { DailyCounterCashLedgerView } from './views/DailyCounterCashLedgerView.js';
import { TpaInsuranceClaimsDeskView } from './views/TpaInsuranceClaimsDeskView.js';
import { RcmAntiLeakageDeskView } from './views/RcmAntiLeakageDeskView.js';
import { ShiftHandoverSignOffView } from './views/ShiftHandoverSignOffView.js';
import { TabOverflowMenu } from './common/TabOverflowMenu.js';
import { DocSearchSpatialCore3D } from '@docsearch/ui-kit';
import { hospitalEventBus, type ActivePatientSummary, type HospitalEventPayload } from '../services/hospital-event-bus.js';

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
  initialTab?: string;
}

export const BillingDomainManager: React.FC<BillingDomainManagerProps> = ({
  tenantId,
  initialContext,
  initialTab
}) => {
  const [activeTab, setActiveTab] = useState<string>(initialTab || 'instant-settlement');

  useEffect(() => {
    if (initialTab) {
      if (initialTab === 'pos' || initialTab === 'payment-collection' || initialTab === 'settlement') {
        setActiveTab('instant-settlement');
      } else if (initialTab === 'claims' || initialTab === 'insurance' || initialTab === 'claims-desk') {
        setActiveTab('claims-desk');
      } else if (initialTab === 'cash-ledger' || initialTab === 'ledger') {
        setActiveTab('cash-ledger');
      } else if (initialTab === 'shift-handover' || initialTab === 'handover') {
        setActiveTab('shift-handover');
      } else if (initialTab === 'rcm' || initialTab === 'leakage' || initialTab === 'anti-leakage' || initialTab === 'rcm-anti-leakage') {
        setActiveTab('rcm-anti-leakage');
      } else {
        setActiveTab(initialTab);
      }
    }
  }, [initialTab]);

  // Hierarchy Context
  const [partners, setPartners] = useState<OperationalPartnerDto[]>([]);
  const [organizations, setOrganizations] = useState<OperationalOrganizationDto[]>([]);
  const [branches, setBranches] = useState<OperationalFacilityDto[]>([]);
  const [context, setContext] = useState<PanelContextDto>(
    initialContext || {
      userEmail: 'billing.admin@docsearch.docsearch.health',
      userRole: 'BILLING_DIRECTOR',
      activeTenantId: tenantId,
      activeTenantName: 'DocSearch Healthcare Network',
      activePartnerId: '22222222-2222-4222-8222-222222222201',
      activePartnerName: 'Doc Search Healthcare Network',
      activeOrganizationId: '44444444-4444-4444-8444-444444444401',
      activeOrganizationName: 'Healthcare Facility',
      activeFacilityId: '88888888-1111-4888-8888-111111111101',
      activeFacilityName: 'Main Facility Branch'
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

      setOverview(ov || null);
      setServices(Array.isArray(srvList) ? srvList : []);
      setPriceLists(Array.isArray(plList) ? plList : []);
      setCharges(Array.isArray(chgList) ? chgList : []);
      setInvoices(Array.isArray(invList) ? invList : []);
      setPayments(Array.isArray(pmtList) ? pmtList : []);
      setReceipts(Array.isArray(rcptList) ? rcptList : []);
      setRefunds(Array.isArray(rfndList) ? rfndList : []);
      setCreditNotes(Array.isArray(crList) ? crList : []);
      setDebitAdjustments(Array.isArray(drList) ? drList : []);
      setAdvances(Array.isArray(advList) ? advList : []);
      setCashierSessions(Array.isArray(sessList) ? sessList : []);
      setReconciliations(Array.isArray(recList) ? recList : []);
      setTransactions(Array.isArray(txList) ? txList : []);
      setAuditTraces(Array.isArray(audList) ? audList : []);
      setAnalytics(anList || null);
      setPatientHistory(patHist || null);

      if (selectedInvoiceId && Array.isArray(invList)) {
        const found = invList.find((i) => i.id === selectedInvoiceId);
        if (found) {
          setSelectedInvoice(found);
        }
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
    const found = (invoices || []).find((i) => i.id === invoiceId);
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
    setSelectedInvoice(inv);
    setSelectedInvoiceId(inv.id);
    setActiveTab('invoice-detail');
    await loadData();
    setSelectedInvoice((prev) => prev || inv);
    const patId = req.patientId || inv.patientId || '55555555-5555-4555-8555-555555555501';
    const patHist = await billingManagementService.getPatientBillingHistory(tenantId, patId);
    if (patHist) {
      setPatientHistory(patHist);
    }
  };

  const handleUpdateInvoice = async (updated: Partial<BillingInvoiceDto> & { id: string }) => {
    const inv = await billingManagementService.updateInvoice(updated);
    setSelectedInvoice(inv);
    await loadData();
    setSelectedInvoice(inv);
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


  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', padding: '1.5rem' }}>
      {/* 3D Spatial Feature Core: Billing & RCM */}
      <DocSearchSpatialCore3D
        preset="billing"
        height={360}
        interactive={true}
        onNodeClick={(id) => {
          if (id === 'counter-pos' || id === 'qr-pos') {
            setActiveTab('payment-collection');
          } else if (id === 'gst-ledger') {
            setActiveTab('invoices');
          } else if (id === 'tpa-claims' || id === 'corporate-credit') {
            setActiveTab('receivables');
          } else if (id === 'settlements') {
            setActiveTab('refunds');
          } else if (id === 'audit-log') {
            setActiveTab('audit-vault');
          }
        }}
      />

      {/* Hierarchy Switcher */}
      <PanelContextSwitcher
        context={context}
        partners={partners}
        organizations={organizations}
        facilities={branches}
        onContextChange={(newCtx) => setContext((prev) => ({ ...prev, ...newCtx }))}
      />

      {/* 4-Pillar Quick Navigation Bar for Cashier / Billing Officer Workstation */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
        gap: '12px',
        marginBottom: '6px'
      }}>
        {/* Pillar 1: ⚡ Instant Bill Settlement */}
        <div
          onClick={() => setActiveTab('instant-settlement')}
          style={{
            backgroundColor: activeTab === 'instant-settlement' ? 'rgba(56, 189, 248, 0.2)' : 'var(--ds-color-surface)',
            border: `1.5px solid ${activeTab === 'instant-settlement' ? 'var(--ds-color-accent)' : 'var(--ds-color-border, rgba(255,255,255,0.08))'}`,
            borderRadius: '10px',
            padding: '12px 16px',
            cursor: 'pointer',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            transition: 'all 0.15s ease'
          }}
        >
          <div>
            <span style={{ fontSize: '0.68rem', color: 'var(--ds-color-accent)', fontWeight: 700, textTransform: 'uppercase' }}>
              ⚡ 1. Instant Bill Settlement
            </span>
            <div style={{ fontSize: '1.2rem', fontWeight: 900, color: 'var(--ds-color-text-primary)' }}>
              {(payments || []).length} Payments
            </div>
          </div>
          <span style={{ fontSize: '1.4rem' }}>⚡</span>
        </div>

        {/* Pillar 2: 💵 Daily Counter Cash Ledger */}
        <div
          onClick={() => setActiveTab('cash-ledger')}
          style={{
            backgroundColor: activeTab === 'cash-ledger' ? 'rgba(16, 185, 129, 0.2)' : 'var(--ds-color-surface)',
            border: `1.5px solid ${activeTab === 'cash-ledger' ? 'var(--ds-color-success)' : 'var(--ds-color-border, rgba(255,255,255,0.08))'}`,
            borderRadius: '10px',
            padding: '12px 16px',
            cursor: 'pointer',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            transition: 'all 0.15s ease'
          }}
        >
          <div>
            <span style={{ fontSize: '0.68rem', color: 'var(--ds-color-success)', fontWeight: 700, textTransform: 'uppercase' }}>
              💵 2. Daily Cash Ledger
            </span>
            <div style={{ fontSize: '1.2rem', fontWeight: 900, color: 'var(--ds-color-success)' }}>
              ₹20,150 Tally
            </div>
          </div>
          <span style={{ fontSize: '1.4rem' }}>💵</span>
        </div>

        {/* Pillar 3: 📑 TPA / Insurance Claims Desk */}
        <div
          onClick={() => setActiveTab('claims-desk')}
          style={{
            backgroundColor: activeTab === 'claims-desk' ? 'rgba(245, 158, 11, 0.2)' : 'var(--ds-color-surface)',
            border: `1.5px solid ${activeTab === 'claims-desk' ? 'var(--ds-color-warning)' : 'var(--ds-color-border, rgba(255,255,255,0.08))'}`,
            borderRadius: '10px',
            padding: '12px 16px',
            cursor: 'pointer',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            transition: 'all 0.15s ease'
          }}
        >
          <div>
            <span style={{ fontSize: '0.68rem', color: 'var(--ds-color-warning)', fontWeight: 700, textTransform: 'uppercase' }}>
              📑 3. TPA / Insurance Desk
            </span>
            <div style={{ fontSize: '1.2rem', fontWeight: 900, color: 'var(--ds-color-warning)' }}>
              4 Pre-Auths
            </div>
          </div>
          <span style={{ fontSize: '1.4rem' }}>📑</span>
        </div>

        {/* Pillar 4: 🛡️ Anti-Leakage & RCM Desk */}
        <div
          onClick={() => setActiveTab('rcm-anti-leakage')}
          style={{
            backgroundColor: activeTab === 'rcm-anti-leakage' ? 'rgba(239, 68, 68, 0.2)' : 'var(--ds-color-surface)',
            border: `1.5px solid ${activeTab === 'rcm-anti-leakage' ? '#EF4444' : 'var(--ds-color-border, rgba(255,255,255,0.08))'}`,
            borderRadius: '10px',
            padding: '12px 16px',
            cursor: 'pointer',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            transition: 'all 0.15s ease'
          }}
        >
          <div>
            <span style={{ fontSize: '0.68rem', color: '#EF4444', fontWeight: 700, textTransform: 'uppercase' }}>
              🛡️ 4. Anti-Leakage Desk
            </span>
            <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#EF4444' }}>
              ₹38.4k Recovered
            </div>
          </div>
          <span style={{ fontSize: '1.4rem' }}>🛡️</span>
        </div>

        {/* Pillar 5: 🔄 Shift Handover Sign-off */}
        <div
          onClick={() => setActiveTab('shift-handover')}
          style={{
            backgroundColor: activeTab === 'shift-handover' ? 'rgba(168, 85, 247, 0.2)' : 'var(--ds-color-surface)',
            border: `1.5px solid ${activeTab === 'shift-handover' ? 'var(--ds-color-accent)' : 'var(--ds-color-border, rgba(255,255,255,0.08))'}`,
            borderRadius: '10px',
            padding: '12px 16px',
            cursor: 'pointer',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            transition: 'all 0.15s ease'
          }}
        >
          <div>
            <span style={{ fontSize: '0.68rem', color: 'var(--ds-color-accent)', fontWeight: 700, textTransform: 'uppercase' }}>
              🔄 5. Shift Handover
            </span>
            <div style={{ fontSize: '1.2rem', fontWeight: 900, color: 'var(--ds-color-accent)' }}>
              Mandatory Sign-off
            </div>
          </div>
          <span style={{ fontSize: '1.4rem' }}>🔄</span>
        </div>
      </div>

      {/* Domain Navigation Tabs */}
      <div
        style={{
          position: 'relative',
          zIndex: 40,
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          flexWrap: 'wrap',
          backgroundColor: 'var(--ds-color-surface)',
          border: '1px solid var(--ds-color-border)',
          borderRadius: '10px',
          padding: '6px 8px'
        }}
      >
        {[
          { id: 'instant-settlement', label: '⚡ Instant Settlement' },
          { id: 'cash-ledger', label: '💵 Daily Cash Ledger' },
          { id: 'claims-desk', label: '📑 TPA / Insurance Claims' },
          { id: 'rcm-anti-leakage', label: '🛡️ Anti-Leakage Desk' },
          { id: 'shift-handover', label: '🔄 Shift Handover' },
          { id: 'invoices', label: `🧾 Invoices (${(invoices || []).length})` },
          { id: 'create-invoice', label: '➕ Full Tax Invoice' },
          { id: 'payment-collection', label: `💳 Payment Ledger (${(payments || []).length})` },
          { id: 'charges', label: `📑 Charges (${(charges || []).length})` },
          { id: 'receivables', label: `⏳ Receivables (${(invoices || []).filter((i) => Number(i?.dueAmount || 0) > 0).length})` },
          { id: 'overview', label: '📊 Billing Overview' },
          ...(selectedInvoice && activeTab === 'invoice-detail' ? [{ id: 'invoice-detail', label: `Invoice ${selectedInvoice.invoiceNumber}` }] : [])
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
                borderRadius: '6px',
                border: isActive ? '1px solid var(--ds-color-accent)' : '1px solid transparent',
                backgroundColor: isActive ? 'var(--ds-color-primary)' : 'transparent',
                color: isActive ? 'var(--ds-color-primary-foreground)' : 'var(--ds-color-text-muted)',
                fontWeight: isActive ? 700 : 500,
                fontSize: '0.8rem',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = 'var(--ds-color-surface-hover)';
                  e.currentTarget.style.color = 'var(--ds-color-text-primary)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = 'var(--ds-color-text-muted)';
                }
              }}
            >
              <span>{tab.label}</span>
            </button>
          );
        })}

        {/* Secondary Modules Dropdown */}
        <TabOverflowMenu
          label="More Billing Tools"
          options={[
            { id: 'dynamic-upi', label: '📱 Dynamic UPI QR Desk' },
            { id: 'cashier-sessions', label: '💼 Cashier Shifts', count: (cashierSessions || []).length },
            { id: 'refunds', label: '↩️ Refunds', count: (refunds || []).length },
            { id: 'pricing-catalog', label: '🏷️ Pricing Master', count: (services || []).length },
            { id: 'patient-history', label: '👤 Patient Ledger' },
            { id: 'analytics', label: '📈 Revenue Analytics' },
            { id: 'audit-vault', label: '🔒 Audit Vault', count: (auditTraces || []).length }
          ]}
          activeId={activeTab}
          onSelect={(id) => setActiveTab(id)}
          onReset={() => setActiveTab('overview')}
          accentColor="var(--ds-color-primary)"
          activeBorderColor="var(--ds-color-accent)"
        />
      </div>

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
            <span style={{ fontSize: '1.25rem' }}>🧾</span>
            <span style={{ fontSize: '0.8125rem', color: 'var(--ds-color-text-muted)' }}>Active Cashier Patient:</span>
            <strong style={{ color: 'var(--ds-color-accent)', fontSize: '0.94rem', fontWeight: 800 }}>{activePatient.name}</strong>
            <span style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-secondary)', backgroundColor: 'rgba(255,255,255,0.08)', padding: '2px 8px', borderRadius: '4px' }}>
              UHID: {activePatient.uhid || activePatient.id}
            </span>
            {activePatient.age && (
              <span style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-muted)' }}>
                • {activePatient.age}y / {activePatient.gender || 'M'}
              </span>
            )}
            <span style={{ fontSize: '0.75rem', color: 'var(--ds-color-success)', fontWeight: 700 }}>
              ✓ Auto-linked from OPD / Hospital Context
            </span>
          </div>
          <button
            type="button"
            onClick={() => {
              setActivePatient(null);
              hospitalEventBus.clearActivePatient('BillingDomainManager');
            }}
            style={{
              backgroundColor: 'transparent',
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: '6px',
              color: 'var(--ds-color-text-muted)',
              cursor: 'pointer',
              fontSize: '0.75rem',
              padding: '4px 10px',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--ds-color-text-primary)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--ds-color-text-muted)')}
          >
            Clear Patient ✕
          </button>
        </div>
      )}

      {/* Tab Views */}
      {activeTab === 'instant-settlement' && (
        <InstantBillSettlementView
          onOpenCashLedger={() => setActiveTab('cash-ledger')}
          onSettlementComplete={() => loadData()}
        />
      )}

      {activeTab === 'cash-ledger' && (
        <DailyCounterCashLedgerView
          onOpenShiftHandover={() => setActiveTab('shift-handover')}
        />
      )}

      {activeTab === 'claims-desk' && (
        <TpaInsuranceClaimsDeskView />
      )}

      {activeTab === 'rcm-anti-leakage' && (
        <RcmAntiLeakageDeskView />
      )}

      {activeTab === 'shift-handover' && (
        <ShiftHandoverSignOffView
          onBackToLedger={() => setActiveTab('cash-ledger')}
          onHandoverComplete={() => loadData()}
        />
      )}

      {activeTab === 'overview' && overview && (
        <BillingOverviewView
          overview={overview}
          invoices={invoices}
          charges={charges}
          payments={payments}
          cashierSessions={cashierSessions}
          onOpenCreateInvoice={() => setActiveTab('create-invoice')}
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

      {activeTab === 'create-invoice' && (
        <CreateInvoiceView
          tenantId={tenantId}
          partnerId={context.activePartnerId}
          organizationId={context.activeOrganizationId || '44444444-4444-4444-8444-444444444401'}
          branchId={context.activeFacilityId || '88888888-1111-4888-8888-111111111101'}
          pendingCharges={(charges || []).filter((c) => c && c.status === 'CAPTURED')}
          services={services}
          onBack={() => setActiveTab('invoices')}
          onSubmit={handleCreateInvoice}
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
              items: (ch.items || []).map((it) => ({
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
          onOpenCreateInvoice={() => setActiveTab('create-invoice')}
          onSelectInvoice={handleSelectInvoice}
          onOpenRecordPayment={(inv) => {
            setSelectedInvoice(inv);
            setIsRecordPaymentOpen(true);
          }}
        />
      )}

      {activeTab === 'invoice-detail' && (
        selectedInvoice ? (
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
            onUpdateInvoice={handleUpdateInvoice}
          />
        ) : (
          <div style={{ padding: '2rem', textAlign: 'center', backgroundColor: 'var(--ds-color-surface)', borderRadius: '8px', border: '1px solid var(--ds-color-border)' }}>
            <h3 style={{ color: 'var(--ds-color-text-primary)', marginBottom: '0.5rem' }}>Invoice Details Not Available</h3>
            <p style={{ color: 'var(--ds-color-text-secondary)', marginBottom: '1rem' }}>The requested invoice record could not be loaded.</p>
            <button
              style={{ padding: '0.5rem 1rem', background: 'var(--ds-color-primary)', color: 'var(--ds-color-primary-foreground)', borderRadius: '6px', border: 'none', cursor: 'pointer', fontWeight: 600 }}
              onClick={() => setActiveTab('invoices')}
            >
              ← Return to Invoices Directory
            </button>
          </div>
        )
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
        pendingCharges={(charges || []).filter((c) => c && c.status === 'CAPTURED')}
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
