/**
 * Pathology & Diagnostic Laboratory Revenue Service
 * Real-time cash collection, multi-interval aggregation (Today, 7D, 30D, Custom Date),
 * payment mode breakdown, and invoice ledger persistence.
 */

export interface LabInvoiceRecord {
  id: string;
  invoiceNumber: string;
  orderId?: string | undefined;
  orderNumber?: string | undefined;
  patientName: string;
  patientAge: number;
  patientGender: 'Male' | 'Female' | 'Other';
  patientMrn: string;
  patientPhone: string;
  referringDoctor: string;
  tests: string[];
  packageName?: string | undefined;
  investigationName: string;
  department: string;
  subtotal: number;
  discount: number;
  tax: number;
  netPayable: number;
  paidAmount: number;
  balanceDue: number;
  paymentMode: 'CASH' | 'UPI' | 'CARD' | 'NET_BANKING' | 'INSURANCE';
  status: 'PAID' | 'PARTIAL_DUE';
  billedAt: string; // ISO 8601 string
  cashierName?: string | undefined;
  notes?: string | undefined;
}

export interface RevenueMetricCardData {
  amount: number;
  invoiceCount: number;
  cashAmount: number;
  upiAmount: number;
  cardAmount: number;
  otherAmount: number;
}

export interface RevenueSummaryResult {
  today: RevenueMetricCardData;
  last7Days: RevenueMetricCardData;
  last30Days: RevenueMetricCardData;
  allTime: RevenueMetricCardData;
  filtered: {
    amount: number;
    billedTotal: number;
    discountTotal: number;
    balanceDueTotal: number;
    invoiceCount: number;
    paymentModes: {
      CASH: number;
      UPI: number;
      CARD: number;
      NET_BANKING: number;
      INSURANCE: number;
    };
    departments: Record<string, number>;
    invoices: LabInvoiceRecord[];
    dailyTrend: Array<{ date: string; label: string; amount: number; count: number }>;
  };
}

class PathologyRevenueService {
  private invoices: LabInvoiceRecord[] = [];

  constructor() {
    this.invoices = this.loadInvoices();
  }

  private loadInvoices(): LabInvoiceRecord[] {
    return [];
  }

  public clearAllInvoices(): void {
    this.invoices = [];
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('docsearch_billing_updated'));
      window.dispatchEvent(new Event('docsearch_orders_updated'));
    }
  }

  public getAllInvoices(): LabInvoiceRecord[] {
    return [...this.invoices].sort((a, b) => new Date(b.billedAt).getTime() - new Date(a.billedAt).getTime());
  }

  public recordInvoice(invoiceData: Omit<LabInvoiceRecord, 'id'>): LabInvoiceRecord {
    const id = `inv-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const newRecord: LabInvoiceRecord = {
      ...invoiceData,
      id
    };

    this.invoices.unshift(newRecord);

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('docsearch_billing_updated'));
      window.dispatchEvent(new Event('docsearch_orders_updated'));
    }

    return newRecord;
  }

  // Calculate high-speed multi-interval metrics (Today, 7D, 30D, Custom)
  public getRevenueSummary(
    activeFilter: 'TODAY' | '7D' | '30D' | 'ALL' | 'CUSTOM' = 'TODAY',
    customStartDate?: string,
    customEndDate?: string
  ): RevenueSummaryResult {
    const all = this.getAllInvoices();
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const sevenDaysAgo = now.getTime() - (7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = now.getTime() - (30 * 24 * 60 * 60 * 1000);

    const calcMetric = (items: LabInvoiceRecord[]): RevenueMetricCardData => {
      let amount = 0;
      let cash = 0;
      let upi = 0;
      let card = 0;
      let other = 0;

      for (const item of items) {
        amount += item.paidAmount;
        if (item.paymentMode === 'CASH') cash += item.paidAmount;
        else if (item.paymentMode === 'UPI') upi += item.paidAmount;
        else if (item.paymentMode === 'CARD') card += item.paidAmount;
        else other += item.paidAmount;
      }

      return {
        amount,
        invoiceCount: items.length,
        cashAmount: cash,
        upiAmount: upi,
        cardAmount: card,
        otherAmount: other
      };
    };

    // Pre-calculate fixed buckets
    const todayInvoices = all.filter((inv) => new Date(inv.billedAt).getTime() >= startOfToday);
    const last7DaysInvoices = all.filter((inv) => new Date(inv.billedAt).getTime() >= sevenDaysAgo);
    const last30DaysInvoices = all.filter((inv) => new Date(inv.billedAt).getTime() >= thirtyDaysAgo);

    // Filter items based on activeFilter
    let filteredInvoices = all;

    if (activeFilter === 'TODAY') {
      filteredInvoices = todayInvoices;
    } else if (activeFilter === '7D') {
      filteredInvoices = last7DaysInvoices;
    } else if (activeFilter === '30D') {
      filteredInvoices = last30DaysInvoices;
    } else if (activeFilter === 'CUSTOM' && customStartDate && customEndDate) {
      const startMs = new Date(`${customStartDate}T00:00:00`).getTime();
      const endMs = new Date(`${customEndDate}T23:59:59`).getTime();
      filteredInvoices = all.filter((inv) => {
        const t = new Date(inv.billedAt).getTime();
        return t >= startMs && t <= endMs;
      });
    }

    let filteredAmount = 0;
    let filteredBilledTotal = 0;
    let filteredDiscountTotal = 0;
    let filteredBalanceDue = 0;

    const paymentModes = {
      CASH: 0,
      UPI: 0,
      CARD: 0,
      NET_BANKING: 0,
      INSURANCE: 0
    };

    const departments: Record<string, number> = {};

    for (const inv of filteredInvoices) {
      filteredAmount += inv.paidAmount;
      filteredBilledTotal += inv.netPayable;
      filteredDiscountTotal += inv.discount;
      filteredBalanceDue += inv.balanceDue;

      if (inv.paymentMode in paymentModes) {
        paymentModes[inv.paymentMode] += inv.paidAmount;
      } else {
        paymentModes.CASH += inv.paidAmount;
      }

      const dept = inv.department || 'General Pathology';
      departments[dept] = (departments[dept] || 0) + inv.paidAmount;
    }

    // Calculate daily trend for the filtered set or last 7 days
    const trendMap = new Map<string, { label: string; amount: number; count: number }>();
    const trendRangeDays = activeFilter === '30D' ? 30 : 7;
    for (let i = trendRangeDays - 1; i >= 0; i--) {
      const d = new Date(now.getTime() - (i * 24 * 60 * 60 * 1000));
      const dateKey = d.toISOString().split('T')[0]!;
      const label = d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
      trendMap.set(dateKey, { label, amount: 0, count: 0 });
    }

    for (const inv of filteredInvoices) {
      const dKey = inv.billedAt.split('T')[0];
      if (dKey && trendMap.has(dKey)) {
        const curr = trendMap.get(dKey)!;
        curr.amount += inv.paidAmount;
        curr.count += 1;
      }
    }

    const dailyTrend = Array.from(trendMap.entries()).map(([date, data]) => ({
      date,
      label: data.label,
      amount: data.amount,
      count: data.count
    }));

    return {
      today: calcMetric(todayInvoices),
      last7Days: calcMetric(last7DaysInvoices),
      last30Days: calcMetric(last30DaysInvoices),
      allTime: calcMetric(all),
      filtered: {
        amount: filteredAmount,
        billedTotal: filteredBilledTotal,
        discountTotal: filteredDiscountTotal,
        balanceDueTotal: filteredBalanceDue,
        invoiceCount: filteredInvoices.length,
        paymentModes,
        departments,
        invoices: filteredInvoices,
        dailyTrend
      }
    };
  }

  // Export invoices to CSV spreadsheet
  public exportInvoicesCsv(invoices: LabInvoiceRecord[], fileName = 'Pathology_Cash_Collection_Register.csv'): void {
    if (typeof window === 'undefined') return;

    const headers = [
      'Invoice Number',
      'Billed Date & Time',
      'Patient Name',
      'Age',
      'Gender',
      'UHID / MRN',
      'Phone',
      'Referring Doctor',
      'Tests / Package',
      'Department',
      'Net Payable (INR)',
      'Paid Amount (INR)',
      'Balance Due (INR)',
      'Payment Mode',
      'Status'
    ];

    const rows = invoices.map((i) => [
      `"${i.invoiceNumber}"`,
      `"${new Date(i.billedAt).toLocaleString('en-IN')}"`,
      `"${i.patientName}"`,
      i.patientAge,
      `"${i.patientGender}"`,
      `"${i.patientMrn}"`,
      `"${i.patientPhone}"`,
      `"${i.referringDoctor}"`,
      `"${(i.tests || []).join('; ')}"`,
      `"${i.department}"`,
      i.netPayable,
      i.paidAmount,
      i.balanceDue,
      `"${i.paymentMode}"`,
      `"${i.status}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}

export const pathologyRevenueService = new PathologyRevenueService();
