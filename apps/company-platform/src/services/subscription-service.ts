import type {
  SubscriptionDto,
  SubscriptionStatus,
  BillingAccountDto,
  InvoiceDto,
  InvoiceStatus,
  PaymentRecordDto,
  TransitionSubscriptionRequest
} from '@docsearch/api-contracts';
import {
  mockSubscriptions,
  mockBillingAccounts,
  mockInvoices,
  mockPaymentRecords
} from './mock-subscription-data.js';

export interface SubscriptionFilters {
  partnerId?: string | undefined;
  productId?: string | undefined;
  status?: SubscriptionStatus | 'ALL' | undefined;
  search?: string | undefined;
}

export interface InvoiceFilters {
  billingAccountId?: string | undefined;
  subscriptionId?: string | undefined;
  status?: InvoiceStatus | 'ALL' | undefined;
}

export interface ISubscriptionService {
  getSubscriptions(filters?: SubscriptionFilters): Promise<SubscriptionDto[]>;
  getSubscriptionById(id: string): Promise<SubscriptionDto | null>;
  getBillingAccounts(partnerId?: string): Promise<BillingAccountDto[]>;
  getInvoices(filters?: InvoiceFilters): Promise<InvoiceDto[]>;
  getInvoiceById(id: string): Promise<InvoiceDto | null>;
  getPayments(invoiceId?: string): Promise<PaymentRecordDto[]>;
  transitionSubscription(
    id: string,
    req: TransitionSubscriptionRequest,
    actorEmail?: string
  ): Promise<SubscriptionDto>;
}

export class SubscriptionService implements ISubscriptionService {
  private readonly apiUrl?: string | undefined;
  private subscriptions: SubscriptionDto[] = [...mockSubscriptions];
  private billingAccounts: BillingAccountDto[] = [...mockBillingAccounts];
  private invoices: InvoiceDto[] = [...mockInvoices];
  private payments: PaymentRecordDto[] = [...mockPaymentRecords];

  constructor(apiUrl?: string | undefined) {
    this.apiUrl = apiUrl;
  }

  async getSubscriptions(filters?: SubscriptionFilters): Promise<SubscriptionDto[]> {
    if (this.apiUrl) {
      const params = new URLSearchParams();
      if (filters?.partnerId) params.set('partnerId', filters.partnerId);
      if (filters?.productId) params.set('productId', filters.productId);
      if (filters?.status && filters.status !== 'ALL') params.set('status', filters.status);
      if (filters?.search) params.set('search', filters.search);
      const res = await fetch(`${this.apiUrl}/api/v1/company/subscriptions?${params.toString()}`);
      if (!res.ok) throw new Error(`Failed to fetch subscriptions: ${res.statusText}`);
      return (await res.json()) as SubscriptionDto[];
    }

    let result = [...this.subscriptions];
    if (filters?.partnerId) {
      result = result.filter((s) => s.partnerId === filters.partnerId);
    }
    if (filters?.productId) {
      result = result.filter((s) => s.productId === filters.productId);
    }
    if (filters?.status && filters.status !== 'ALL') {
      result = result.filter((s) => s.status === filters.status);
    }
    if (filters?.search) {
      const q = filters.search.toLowerCase().trim();
      result = result.filter(
        (s) =>
          s.partnerTradeName.toLowerCase().includes(q) ||
          s.partnerTenantSlug.toLowerCase().includes(q) ||
          s.productName.toLowerCase().includes(q) ||
          s.planName.toLowerCase().includes(q)
      );
    }
    return result;
  }

  async getSubscriptionById(id: string): Promise<SubscriptionDto | null> {
    if (this.apiUrl) {
      const res = await fetch(`${this.apiUrl}/api/v1/company/subscriptions/${id}`);
      if (res.status === 404) return null;
      if (!res.ok) throw new Error(`Failed to fetch subscription: ${res.statusText}`);
      return (await res.json()) as SubscriptionDto;
    }
    const sub = this.subscriptions.find((s) => s.id === id);
    return sub ? { ...sub } : null;
  }

  async getBillingAccounts(partnerId?: string): Promise<BillingAccountDto[]> {
    if (this.apiUrl) {
      const url = partnerId
        ? `${this.apiUrl}/api/v1/company/billing-accounts?partnerId=${partnerId}`
        : `${this.apiUrl}/api/v1/company/billing-accounts`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Failed to fetch billing accounts: ${res.statusText}`);
      return (await res.json()) as BillingAccountDto[];
    }

    if (partnerId) {
      return this.billingAccounts.filter((b) => b.partnerId === partnerId);
    }
    return [...this.billingAccounts];
  }

  async getInvoices(filters?: InvoiceFilters): Promise<InvoiceDto[]> {
    if (this.apiUrl) {
      const params = new URLSearchParams();
      if (filters?.billingAccountId) params.set('billingAccountId', filters.billingAccountId);
      if (filters?.subscriptionId) params.set('subscriptionId', filters.subscriptionId);
      if (filters?.status && filters.status !== 'ALL') params.set('status', filters.status);
      const res = await fetch(`${this.apiUrl}/api/v1/company/invoices?${params.toString()}`);
      if (!res.ok) throw new Error(`Failed to fetch invoices: ${res.statusText}`);
      return (await res.json()) as InvoiceDto[];
    }

    let result = [...this.invoices];
    if (filters?.billingAccountId) {
      result = result.filter((i) => i.billingAccountId === filters.billingAccountId);
    }
    if (filters?.subscriptionId) {
      result = result.filter((i) => i.subscriptionId === filters.subscriptionId);
    }
    if (filters?.status && filters.status !== 'ALL') {
      result = result.filter((i) => i.status === filters.status);
    }
    return result;
  }

  async getInvoiceById(id: string): Promise<InvoiceDto | null> {
    if (this.apiUrl) {
      const res = await fetch(`${this.apiUrl}/api/v1/company/invoices/${id}`);
      if (res.status === 404) return null;
      if (!res.ok) throw new Error(`Failed to fetch invoice: ${res.statusText}`);
      return (await res.json()) as InvoiceDto;
    }
    const inv = this.invoices.find((i) => i.id === id);
    return inv ? { ...inv } : null;
  }

  async getPayments(invoiceId?: string): Promise<PaymentRecordDto[]> {
    if (this.apiUrl) {
      const url = invoiceId
        ? `${this.apiUrl}/api/v1/company/payments?invoiceId=${invoiceId}`
        : `${this.apiUrl}/api/v1/company/payments`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Failed to fetch payment records: ${res.statusText}`);
      return (await res.json()) as PaymentRecordDto[];
    }

    if (invoiceId) {
      return this.payments.filter((p) => p.invoiceId === invoiceId);
    }
    return [...this.payments];
  }

  async transitionSubscription(
    id: string,
    req: TransitionSubscriptionRequest,
    _actorEmail = 'executive.lead@docsearch.internal'
  ): Promise<SubscriptionDto> {
    if (this.apiUrl) {
      const res = await fetch(`${this.apiUrl}/api/v1/company/subscriptions/${id}/transition`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req)
      });
      if (!res.ok) throw new Error(`Failed to execute subscription transition: ${res.statusText}`);
      return (await res.json()) as SubscriptionDto;
    }

    const idx = this.subscriptions.findIndex((s) => s.id === id);
    const current = this.subscriptions[idx];
    if (idx === -1 || !current) {
      throw new Error(`Subscription ${id} not found`);
    }

    const updated: SubscriptionDto = {
      ...current,
      status: req.toStatus,
      cancellationReason: req.toStatus === 'CANCELLED' ? req.reason : current.cancellationReason,
      cancellationDate: req.toStatus === 'CANCELLED' ? new Date().toISOString() : current.cancellationDate,
      updatedAt: new Date().toISOString()
    };

    this.subscriptions[idx] = updated;
    return { ...updated };
  }
}

export const subscriptionService = new SubscriptionService();
