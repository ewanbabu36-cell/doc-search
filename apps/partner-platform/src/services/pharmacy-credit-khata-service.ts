/**
 * Pharmacy Credit Khata (उधार खाता बही) Service
 *
 * Ground Reality:
 * In Indian retail and hospital-attached pharmacies, regular community customers, local families,
 * hospital staff, and admitted patients frequently purchase medicines on credit ("Udhaar").
 *
 * This service provides:
 * 1. Persistent Customer Khata Accounts (Name, Mobile, Address, Credit Limit, Max Days).
 * 2. Double-Entry Running Ledger:
 *      - DEBIT_INVOICE: Increases customer debt (+)
 *      - CREDIT_PAYMENT: Decreases customer debt (-) via Cash, UPI, Card, Bank Transfer
 *      - SETTLEMENT_WAIVER: Small round-off discount/kasar forgiven by the chemist
 * 3. Credit Limit & Overdue Headroom Verification for POS billing.
 * 4. Aging Buckets (0-15d, 16-30d, 31-60d, 60+d) for outstanding debt risk management.
 * 5. Event-driven synchronization with POS and Galla Cash Register.
 */

export interface PharmacyKhataAccount {
  id: string;
  tenantId: string;
  customerName: string;
  customerPhone: string;
  customerAddress?: string | undefined;
  uhid?: string | undefined;
  creditLimit: number; // ₹ (0 = Unlimited)
  maxCreditDays: number; // Days allowed before considered overdue (Default: 30)
  currentBalance: number; // Total Outstanding Debt (₹)
  totalBilled: number;
  totalPaid: number;
  totalWaived: number;
  lastBilledAt?: string | undefined;
  lastPaidAt?: string | undefined;
  status: 'ACTIVE' | 'BLOCKED' | 'OVERDUE';
  createdAt: string;
  updatedAt: string;
}

export type KhataEntryType = 'DEBIT_INVOICE' | 'CREDIT_PAYMENT' | 'SETTLEMENT_WAIVER';

export interface PharmacyKhataLedgerEntry {
  id: string;
  accountId: string;
  customerName: string;
  customerPhone: string;
  entryType: KhataEntryType;
  referenceId?: string | undefined; // invoiceNumber (e.g. INV-1002) or receiptNumber (e.g. RCP-20260918-01)
  amount: number;
  previousBalance: number;
  newBalance: number;
  paymentMode?: 'CASH' | 'UPI_QR' | 'CARD' | 'BANK_TRANSFER' | undefined;
  collectedByPharmacist?: string | undefined;
  notes?: string | undefined;
  takenBy?: string | undefined; // e.g. "Son Rahul", "Driver", "Self"
  invoiceItemsSummary?: string | undefined; // e.g. "Dolo 650 (2), Augmentin (1)"
  timestamp: string;
}

export interface KhataAgingBucket {
  bucket: '0_15' | '16_30' | '31_60' | '60_PLUS';
  label: string;
  amount: number;
  count: number;
  color: string;
}

export interface KhataAgingSummary {
  totalOutstanding: number;
  totalAccounts: number;
  activeAccountsCount: number;
  overdueAccountsCount: number;
  overdueAmount: number;
  totalCollectedThisMonth: number;
  buckets: KhataAgingBucket[];
}

const STORAGE_KHATA_ACCOUNTS_KEY = 'docsearch_pharmacy_khata_accounts';
const STORAGE_KHATA_LEDGER_KEY = 'docsearch_pharmacy_khata_ledger';

class PharmacyCreditKhataService {
  private accounts: PharmacyKhataAccount[] = [];
  private ledger: PharmacyKhataLedgerEntry[] = [];

  constructor() {
    this.initData();
  }

  private initData(): void {
    if (typeof window === 'undefined') return;

    try {
      const storedAcc = window.localStorage.getItem(STORAGE_KHATA_ACCOUNTS_KEY);
      if (storedAcc) {
        const parsed = JSON.parse(storedAcc);
        if (Array.isArray(parsed)) {
          this.accounts = parsed;
        }
      }
    } catch {
      this.accounts = [];
    }

    try {
      const storedLedger = window.localStorage.getItem(STORAGE_KHATA_LEDGER_KEY);
      if (storedLedger) {
        const parsedL = JSON.parse(storedLedger);
        if (Array.isArray(parsedL)) {
          this.ledger = parsedL;
        }
      }
    } catch {
      this.ledger = [];
    }

    this.syncWithInvoices();
  }

  /**
   * Auto-sync any existing CREDIT_KHATA invoices into customer accounts and ledger
   */
  public syncWithInvoices(): void {
    if (typeof window === 'undefined') return;
    try {
      const stored = window.localStorage.getItem('docsearch_pharmacy_sales_invoices');
      if (!stored) return;
      const invoices = JSON.parse(stored);
      if (!Array.isArray(invoices)) return;

      let changed = false;
      const creditInvoices = invoices.filter((inv: any) => inv.paymentMode === 'CREDIT_KHATA');

      for (const inv of creditInvoices) {
        const invNum = inv.invoiceNumber;
        if (!invNum) continue;

        const alreadyInLedger = this.ledger.some(
          (l) => l.referenceId === invNum && l.entryType === 'DEBIT_INVOICE'
        );
        if (alreadyInLedger) continue;

        const phone = (inv.patientPhone || '').replace(/\D/g, '').slice(-10);
        const name = (inv.patientName || 'Credit Customer').trim();
        let account = phone ? this.getAccountByPhone(phone) : undefined;
        if (!account) {
          account = this.accounts.find(
            (a) => a.customerName.toLowerCase() === name.toLowerCase()
          );
        }

        const now = inv.createdAt || new Date().toISOString();
        const amount = Number(inv.grandTotal || inv.totalAmount) || 0;

        if (!account) {
          const newId = `kh-acc-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
          account = {
            id: newId,
            tenantId: inv.tenantName || 'default',
            customerName: name,
            customerPhone: phone || '9876500000',
            creditLimit: 10000,
            maxCreditDays: 30,
            currentBalance: amount,
            totalBilled: amount,
            totalPaid: 0,
            totalWaived: 0,
            lastBilledAt: now,
            status: 'ACTIVE',
            createdAt: now,
            updatedAt: now
          };
          this.accounts.push(account);
        } else {
          account.currentBalance = Math.round(((account.currentBalance || 0) + amount) * 100) / 100;
          account.totalBilled = Math.round(((account.totalBilled || 0) + amount) * 100) / 100;
          account.lastBilledAt = now;
          account.updatedAt = now;
        }

        const itemsSummary = (inv.items || [])
          .slice(0, 3)
          .map((i: any) => `${i.medicationName || 'Medicine'} (${i.quantity || 1})`)
          .join(', ');

        const entry: PharmacyKhataLedgerEntry = {
          id: `kh-entry-sync-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          accountId: account.id,
          customerName: account.customerName,
          customerPhone: account.customerPhone,
          entryType: 'DEBIT_INVOICE',
          referenceId: invNum,
          amount,
          previousBalance: Math.max(0, account.currentBalance - amount),
          newBalance: account.currentBalance,
          takenBy: inv.medicinesTakenBy || inv.patientName || 'Self',
          invoiceItemsSummary: itemsSummary,
          timestamp: now
        };

        this.ledger.unshift(entry);
        changed = true;
      }

      if (changed) {
        window.localStorage.setItem(STORAGE_KHATA_ACCOUNTS_KEY, JSON.stringify(this.accounts));
        window.localStorage.setItem(STORAGE_KHATA_LEDGER_KEY, JSON.stringify(this.ledger));
      }
    } catch (e) {
      console.error('[KhataService] syncWithInvoices error:', e);
    }
  }

  private persist(): void {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(STORAGE_KHATA_ACCOUNTS_KEY, JSON.stringify(this.accounts));
      window.localStorage.setItem(STORAGE_KHATA_LEDGER_KEY, JSON.stringify(this.ledger));
      window.dispatchEvent(new CustomEvent('docsearch_khata_updated'));
    } catch (e) {
      console.error('[KhataService] Failed to persist khata data:', e);
    }
  }

  public reload(): void {
    this.initData();
  }

  public getAccounts(): PharmacyKhataAccount[] {
    this.reload();
    return [...this.accounts];
  }

  public getAccountById(id: string): PharmacyKhataAccount | undefined {
    this.reload();
    return this.accounts.find((a) => a.id === id);
  }

  public getAccountByPhone(phone: string): PharmacyKhataAccount | undefined {
    this.reload();
    const cleanPhone = (phone || '').replace(/\D/g, '').slice(-10);
    if (!cleanPhone) return undefined;
    return this.accounts.find((a) => a.customerPhone.replace(/\D/g, '').slice(-10) === cleanPhone);
  }

  public searchAccounts(query: string): PharmacyKhataAccount[] {
    this.reload();
    const q = (query || '').trim().toLowerCase();
    if (!q) return this.accounts;
    const cleanDigits = q.replace(/\D/g, '');

    return this.accounts.filter((a) => {
      const nameMatch = a.customerName.toLowerCase().includes(q);
      const phoneMatch = cleanDigits ? a.customerPhone.replace(/\D/g, '').includes(cleanDigits) : false;
      const uhidMatch = a.uhid ? a.uhid.toLowerCase().includes(q) : false;
      return nameMatch || phoneMatch || uhidMatch;
    });
  }

  /**
   * Create or update a customer khata account
   */
  public createOrUpdateAccount(
    data: {
      id?: string | undefined;
      customerName: string;
      customerPhone: string;
      customerAddress?: string | undefined;
      uhid?: string | undefined;
      creditLimit?: number | undefined;
      maxCreditDays?: number | undefined;
      tenantId?: string | undefined;
    }
  ): PharmacyKhataAccount {
    this.reload();
    const now = new Date().toISOString();
    const cleanPhone = (data.customerPhone || '').replace(/\D/g, '').slice(-10);

    let existing = data.id
      ? this.accounts.find((a) => a.id === data.id)
      : this.getAccountByPhone(cleanPhone);

    if (existing) {
      existing.customerName = data.customerName.trim() || existing.customerName;
      existing.customerPhone = cleanPhone || existing.customerPhone;
      if (data.customerAddress !== undefined) existing.customerAddress = data.customerAddress;
      if (data.uhid !== undefined) existing.uhid = data.uhid;
      if (data.creditLimit !== undefined) existing.creditLimit = Number(data.creditLimit);
      if (data.maxCreditDays !== undefined) existing.maxCreditDays = Number(data.maxCreditDays);
      existing.updatedAt = now;
      this.persist();
      return existing;
    }

    const newAccount: PharmacyKhataAccount = {
      id: data.id || `khata-acc-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      tenantId: data.tenantId || 'docsearch-pharmacy',
      customerName: data.customerName.trim(),
      customerPhone: cleanPhone,
      customerAddress: data.customerAddress || '',
      uhid: data.uhid || '',
      creditLimit: data.creditLimit !== undefined ? Number(data.creditLimit) : 5000,
      maxCreditDays: data.maxCreditDays !== undefined ? Number(data.maxCreditDays) : 30,
      currentBalance: 0,
      totalBilled: 0,
      totalPaid: 0,
      totalWaived: 0,
      status: 'ACTIVE',
      createdAt: now,
      updatedAt: now
    };

    this.accounts.unshift(newAccount);
    this.persist();
    return newAccount;
  }

  /**
   * Record a Debit entry when an invoice is completed via CREDIT_KHATA at POS
   */
  public recordInvoiceDebit(
    invoice: {
      invoiceNumber: string;
      grandTotal: number;
      patientName: string;
      patientPhone?: string | undefined;
      patientMrn?: string | undefined;
      items?: Array<{ medicationName: string; quantity: number }> | any[] | undefined;
      createdAt?: string | undefined;
      [key: string]: any;
    },
    takenBy?: string | undefined
  ): PharmacyKhataLedgerEntry {
    this.reload();
    const now = invoice.createdAt || new Date().toISOString();
    const customerPhone = (invoice.patientPhone || '').replace(/\D/g, '').slice(-10) || '0000000000';
    const customerName = (invoice.patientName || '').trim() || 'Credit Customer';

    // Auto-resolve or create account
    let account = this.getAccountByPhone(customerPhone);
    if (!account) {
      account = this.createOrUpdateAccount({
        customerName,
        customerPhone,
        uhid: invoice.patientMrn || ''
      });
    }

    const prevBalance = account.currentBalance || 0;
    const amount = Number(invoice.grandTotal) || 0;
    const nextBalance = Math.round((prevBalance + amount) * 100) / 100;

    // Update account totals
    account.currentBalance = nextBalance;
    account.totalBilled = Math.round(((account.totalBilled || 0) + amount) * 100) / 100;
    account.lastBilledAt = now;
    account.updatedAt = now;

    // Evaluate account status
    if (account.creditLimit > 0 && account.currentBalance > account.creditLimit) {
      account.status = 'BLOCKED';
    } else {
      account.status = 'ACTIVE';
    }

    // Build items summary snippet
    const itemsSummary = (invoice.items || [])
      .slice(0, 3)
      .map((i) => `${i.medicationName} (${i.quantity})`)
      .join(', ');

    const entry: PharmacyKhataLedgerEntry = {
      id: `kh-entry-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      accountId: account.id,
      customerName: account.customerName,
      customerPhone: account.customerPhone,
      entryType: 'DEBIT_INVOICE',
      referenceId: invoice.invoiceNumber,
      amount,
      previousBalance: prevBalance,
      newBalance: nextBalance,
      takenBy: takenBy || 'Self / Patient',
      invoiceItemsSummary: itemsSummary,
      timestamp: now
    };

    this.ledger.unshift(entry);
    this.persist();
    return entry;
  }

  /**
   * Record customer repayment (Credit entry) + optional round-off settlement waiver
   */
  public recordPaymentCredit(params: {
    accountId: string;
    amount: number;
    paymentMode: 'CASH' | 'UPI_QR' | 'CARD' | 'BANK_TRANSFER';
    settlementWaiver?: number | undefined;
    collectedBy?: string | undefined;
    notes?: string | undefined;
  }): { paymentEntry: PharmacyKhataLedgerEntry; waiverEntry?: PharmacyKhataLedgerEntry | undefined } {
    this.reload();
    const account = this.getAccountById(params.accountId);
    if (!account) {
      throw new Error(`Khata account not found: ${params.accountId}`);
    }

    const now = new Date().toISOString();
    const receiptNum = `RCP-${now.split('T')[0]?.replace(/-/g, '')}-${Math.floor(100 + Math.random() * 900)}`;

    let runningBal = account.currentBalance || 0;
    const payAmt = Math.max(0, Number(params.amount) || 0);

    // 1. Payment Entry
    const newBalAfterPay = Math.max(0, Math.round((runningBal - payAmt) * 100) / 100);

    const paymentEntry: PharmacyKhataLedgerEntry = {
      id: `kh-entry-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      accountId: account.id,
      customerName: account.customerName,
      customerPhone: account.customerPhone,
      entryType: 'CREDIT_PAYMENT',
      referenceId: receiptNum,
      amount: payAmt,
      previousBalance: runningBal,
      newBalance: newBalAfterPay,
      paymentMode: params.paymentMode,
      collectedByPharmacist: params.collectedBy || 'Dispensing Chemist',
      notes: params.notes || 'Khata Repayment / Udhaar Vasuli',
      timestamp: now
    };

    this.ledger.unshift(paymentEntry);
    runningBal = newBalAfterPay;
    account.totalPaid = Math.round(((account.totalPaid || 0) + payAmt) * 100) / 100;
    account.lastPaidAt = now;

    // 2. Optional Settlement Waiver (Kasar / Chhoot)
    let waiverEntry: PharmacyKhataLedgerEntry | undefined;
    const waiverAmt = Math.max(0, Number(params.settlementWaiver) || 0);
    if (waiverAmt > 0) {
      const newBalAfterWaiver = Math.max(0, Math.round((runningBal - waiverAmt) * 100) / 100);
      waiverEntry = {
        id: `kh-entry-${Date.now() + 1}-${Math.random().toString(36).slice(2, 6)}`,
        accountId: account.id,
        customerName: account.customerName,
        customerPhone: account.customerPhone,
        entryType: 'SETTLEMENT_WAIVER',
        referenceId: `WVR-${receiptNum}`,
        amount: waiverAmt,
        previousBalance: runningBal,
        newBalance: newBalAfterWaiver,
        collectedByPharmacist: params.collectedBy || 'Dispensing Chemist',
        notes: `Settlement Discount / Round-off waiver of ₹${waiverAmt.toFixed(2)}`,
        timestamp: now
      };
      this.ledger.unshift(waiverEntry);
      runningBal = newBalAfterWaiver;
      account.totalWaived = Math.round(((account.totalWaived || 0) + waiverAmt) * 100) / 100;
    }

    account.currentBalance = runningBal;
    account.updatedAt = now;

    if (account.currentBalance <= 0) {
      account.status = 'ACTIVE';
    } else if (account.creditLimit > 0 && account.currentBalance <= account.creditLimit) {
      account.status = 'ACTIVE';
    }

    this.persist();

    // Trigger DOM event so active Galla or POS re-syncs
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('docsearch_khata_payment_recorded', {
          detail: {
            accountId: account.id,
            amount: payAmt,
            paymentMode: params.paymentMode,
            receiptNumber: receiptNum
          }
        })
      );
    }

    return { paymentEntry, waiverEntry };
  }

  public getLedgerEntries(accountId: string): PharmacyKhataLedgerEntry[] {
    this.reload();
    return this.ledger
      .filter((l) => l.accountId === accountId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  public getAllLedgerEntries(): PharmacyKhataLedgerEntry[] {
    this.reload();
    return [...this.ledger];
  }

  /**
   * Aging buckets: 0-15d, 16-30d, 31-60d, 60+d
   */
  public getAgingSummary(): KhataAgingSummary {
    this.reload();
    const now = Date.now();

    const buckets: Record<'0_15' | '16_30' | '31_60' | '60_PLUS', { amount: number; count: number }> = {
      '0_15': { amount: 0, count: 0 },
      '16_30': { amount: 0, count: 0 },
      '31_60': { amount: 0, count: 0 },
      '60_PLUS': { amount: 0, count: 0 }
    };

    let totalOutstanding = 0;
    let overdueAmount = 0;
    let overdueAccountsCount = 0;

    for (const acc of this.accounts) {
      if (acc.currentBalance <= 0) continue;
      totalOutstanding += acc.currentBalance;

      // Age based on lastBilledAt or createdAt
      const refDate = acc.lastBilledAt ? new Date(acc.lastBilledAt).getTime() : new Date(acc.createdAt).getTime();
      const ageDays = Math.max(0, Math.floor((now - refDate) / (1000 * 60 * 60 * 24)));

      if (ageDays <= 15) {
        buckets['0_15'].amount += acc.currentBalance;
        buckets['0_15'].count += 1;
      } else if (ageDays <= 30) {
        buckets['16_30'].amount += acc.currentBalance;
        buckets['16_30'].count += 1;
      } else if (ageDays <= 60) {
        buckets['31_60'].amount += acc.currentBalance;
        buckets['31_60'].count += 1;
        overdueAmount += acc.currentBalance;
        overdueAccountsCount += 1;
      } else {
        buckets['60_PLUS'].amount += acc.currentBalance;
        buckets['60_PLUS'].count += 1;
        overdueAmount += acc.currentBalance;
        overdueAccountsCount += 1;
      }
    }

    // Calculate collections this month
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).getTime();
    const collectedThisMonth = this.ledger
      .filter((l) => l.entryType === 'CREDIT_PAYMENT' && new Date(l.timestamp).getTime() >= startOfMonth)
      .reduce((sum, l) => sum + l.amount, 0);

    return {
      totalOutstanding: Math.round(totalOutstanding * 100) / 100,
      totalAccounts: this.accounts.length,
      activeAccountsCount: this.accounts.filter((a) => a.currentBalance > 0).length,
      overdueAccountsCount,
      overdueAmount: Math.round(overdueAmount * 100) / 100,
      totalCollectedThisMonth: Math.round(collectedThisMonth * 100) / 100,
      buckets: [
        {
          bucket: '0_15',
          label: '0–15 Days (Current)',
          amount: Math.round(buckets['0_15'].amount * 100) / 100,
          count: buckets['0_15'].count,
          color: '#10B981' // Green
        },
        {
          bucket: '16_30',
          label: '16–30 Days (Normal)',
          amount: Math.round(buckets['16_30'].amount * 100) / 100,
          count: buckets['16_30'].count,
          color: '#38BDF8' // Blue
        },
        {
          bucket: '31_60',
          label: '31–60 Days (Follow-up)',
          amount: Math.round(buckets['31_60'].amount * 100) / 100,
          count: buckets['31_60'].count,
          color: '#F59E0B' // Amber
        },
        {
          bucket: '60_PLUS',
          label: '60+ Days (High Risk)',
          amount: Math.round(buckets['60_PLUS'].amount * 100) / 100,
          count: buckets['60_PLUS'].count,
          color: '#EF4444' // Red
        }
      ]
    };
  }

  public clearAllData(): void {
    if (typeof window === 'undefined') return;
    this.accounts = [];
    this.ledger = [];
    try {
      window.localStorage.removeItem(STORAGE_KHATA_ACCOUNTS_KEY);
      window.localStorage.removeItem(STORAGE_KHATA_LEDGER_KEY);
      window.dispatchEvent(new CustomEvent('docsearch_khata_updated'));
    } catch {}
  }
}

export const pharmacyCreditKhataService = new PharmacyCreditKhataService();
