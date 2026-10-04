/**
 * Pharmacy Revenue & Galla Shift Handover Service
 *
 * Ground Reality: Indian chemist counters operate in multiple shifts (Morning Pharmacist, Evening Pharmacist, Night Closing).
 * "Galla Milana" (Cash drawer reconciliation) is the single most critical daily accounting operation.
 *
 * Capabilities:
 * - Real-time cash collection & sales ledger persistence
 * - Multi-interval aggregation: TODAY, Last 7 Days (7D), Last 30 Days (30D), All Time (ALL), Custom Date Range (CUSTOM)
 * - Payment mode breakdown: CASH, UPI/QR (PhonePe/GPay), CARD, CREDIT_KHATA (Udhaar)
 * - Galla / Shift Handover tracking:
 *     Expected Cash = Opening Float + Cash Sales Inflow - Petty Cash Expenses
 *     Actual Counted Cash = Sum of physical note denominations (500, 200, 100, 50, 20, 10, Coins)
 *     Discrepancy Check = Actual - Expected (Shortage / Surplus / Balanced)
 * - CSV Export for Tally / Accounting and 80mm Thermal Shift Handover Slip generation
 */

import type { PharmacyInvoiceData } from '../components/dialogs/PharmacyInvoiceSlipModal.js';
import { INDIAN_PHARMACY_FORMULARY, type IndianMedicationFormularyItem } from './indian-pharmacy-catalog.js';

export interface PharmacySalesInvoiceRecord extends PharmacyInvoiceData {
  id: string;
  createdAt: string; // ISO 8601 string for reliable date matching
}

export interface PharmacyProfitItemBreakdown {
  medicationName: string;
  genericName?: string | undefined;
  batchNumber: string;
  quantity: number;
  salePrice: number;
  purchaseCostPtr: number;
  totalSale: number;
  totalCost: number;
  profit: number;
  marginPercent: number;
}

export interface PharmacyInvoiceProfitRecord {
  id: string;
  invoiceNumber: string;
  invoiceDate: string;
  createdAt: string;
  patientName: string;
  patientPhone?: string | undefined;
  doctorName?: string | undefined;
  paymentMode: 'CASH' | 'UPI_QR' | 'CARD' | 'CREDIT_KHATA';
  revenue: number;
  cost: number;
  profit: number;
  marginPercent: number;
  totalUnits: number;
  items: PharmacyProfitItemBreakdown[];
}

export interface PharmacyProfitReportSummary {
  interval: 'TODAY' | '7D' | '30D' | 'ALL' | 'CUSTOM';
  customFromDate?: string | undefined;
  customToDate?: string | undefined;
  totalRevenue: number;
  totalCost: number;
  totalProfit: number;
  overallMarginPercent: number;
  invoiceCount: number;
  totalUnitsSold: number;
  avgProfitPerBill: number;
  paymentModeProfits: {
    CASH: { revenue: number; cost: number; profit: number; count: number };
    UPI_QR: { revenue: number; cost: number; profit: number; count: number };
    CARD: { revenue: number; cost: number; profit: number; count: number };
    CREDIT_KHATA: { revenue: number; cost: number; profit: number; count: number };
  };
  topProfitableMeds: Array<{
    medicationName: string;
    quantity: number;
    revenue: number;
    cost: number;
    profit: number;
    marginPercent: number;
  }>;
  invoices: PharmacyInvoiceProfitRecord[];
}

export interface GallaDenominationBreakup {
  n500: number;
  n200: number;
  n100: number;
  n50: number;
  n20: number;
  n10: number;
  coins: number;
}

export type ShiftType = 'MORNING' | 'EVENING' | 'NIGHT' | 'FULL_DAY';

export interface GallaShiftHandoverRecord {
  id: string;
  handoverNumber: string; // e.g. "GLA-2026-09-18-01"
  shiftType: ShiftType;
  shiftLabel: string;
  handoverDate: string; // YYYY-MM-DD
  handoverTimestamp: string; // ISO 8601
  outgoingPharmacistName: string;
  outgoingPharmacistRegNo: string;
  incomingPharmacistName: string;
  incomingPharmacistRegNo: string;
  openingDrawerFloat: number; // Subah ka khulla balance (e.g. ₹2,000)
  cashSalesInflow: number; // Sum of CASH sales in this shift
  upiSalesInflow: number;
  cardSalesInflow: number;
  khataSalesInflow: number;
  grossShiftRevenue: number;
  shiftInvoiceCount: number;
  pettyCashOutflow: number; // Dukaan kharche (chai, courier, snacks)
  pettyCashRemarks: string;
  expectedDrawerCash: number; // openingDrawerFloat + cashSalesInflow - pettyCashOutflow
  actualCountedCash: number; // Physical cash counted
  denominationBreakup: GallaDenominationBreakup;
  discrepancy: number; // actualCountedCash - expectedDrawerCash
  discrepancyStatus: 'BALANCED' | 'SHORTAGE' | 'SURPLUS';
  discrepancyReason?: string | undefined;
  notes?: string | undefined;
}

export interface PharmacyRevenueMetricCardData {
  amount: number;
  invoiceCount: number;
  cashAmount: number;
  upiAmount: number;
  cardAmount: number;
  khataAmount: number;
}

export interface PharmacyRevenueSummaryResult {
  today: PharmacyRevenueMetricCardData;
  last7Days: PharmacyRevenueMetricCardData;
  last30Days: PharmacyRevenueMetricCardData;
  allTime: PharmacyRevenueMetricCardData;
  filtered: {
    amount: number;
    subtotal: number;
    discountTotal: number;
    taxableTotal: number;
    gstTotal: number;
    invoiceCount: number;
    paymentModes: {
      CASH: number;
      UPI_QR: number;
      CARD: number;
      CREDIT_KHATA: number;
    };
    invoices: PharmacySalesInvoiceRecord[];
    dailyTrend: Array<{ date: string; label: string; amount: number; count: number }>;
  };
}

const STORAGE_INVOICES_KEY = 'docsearch_pharmacy_invoices';
const STORAGE_HANDOVERS_KEY = 'docsearch_pharmacy_galla_handovers';

class PharmacyRevenueGallaService {
  private invoices: PharmacySalesInvoiceRecord[] = [];
  private handovers: GallaShiftHandoverRecord[] = [];

  constructor() {
    this.initData();
  }

  private initData(): void {
    if (typeof window === 'undefined') return;

    // 1. Load Sales Invoices
    try {
      const storedInvoices = window.localStorage.getItem(STORAGE_INVOICES_KEY);
      if (storedInvoices) {
        const parsed = JSON.parse(storedInvoices);
        if (Array.isArray(parsed) && parsed.length > 0) {
          this.invoices = parsed.map((inv, idx) => this.normalizeInvoice(inv, idx));
        }
      }
    } catch {
      this.invoices = [];
    }

    // Seed realistic Indian chemist sales ONLY IF explicitly enabled for demo/testing
    const isDemoSeedEnabled =
      typeof window !== 'undefined' &&
      window.localStorage.getItem('docsearch_pharmacy_demo_seed') === 'true';

    if (this.invoices.length === 0 && isDemoSeedEnabled) {
      this.invoices = this.generateRealisticSeedInvoices();
      try {
        window.localStorage.setItem(STORAGE_INVOICES_KEY, JSON.stringify(this.invoices));
      } catch {}
    }

    // 2. Load Galla Shift Handovers
    try {
      const storedHandovers = window.localStorage.getItem(STORAGE_HANDOVERS_KEY);
      if (storedHandovers) {
        const parsedH = JSON.parse(storedHandovers);
        if (Array.isArray(parsedH)) {
          this.handovers = parsedH;
        }
      }
    } catch {
      this.handovers = [];
    }

    if (this.handovers.length === 0 && isDemoSeedEnabled) {
      this.handovers = this.generateRealisticSeedHandovers();
      try {
        window.localStorage.setItem(STORAGE_HANDOVERS_KEY, JSON.stringify(this.handovers));
      } catch {}
    }
  }

  private normalizeInvoice(inv: any, index: number): PharmacySalesInvoiceRecord {
    let createdAt = inv.createdAt;
    if (!createdAt) {
      if (inv.invoiceDate && inv.invoiceDate.includes('/')) {
        // e.g. "18/09/2026, 1:40:00 pm" or "18/09/2026"
        const parts = inv.invoiceDate.split(',')[0].trim().split('/');
        if (parts.length === 3) {
          const d = parts[0]?.padStart(2, '0');
          const m = parts[1]?.padStart(2, '0');
          const y = parts[2];
          createdAt = `${y}-${m}-${d}T10:00:00.000Z`;
        }
      }
      if (!createdAt) {
        createdAt = new Date(Date.now() - index * 3600000).toISOString();
      }
    }

    return {
      id: inv.id || `inv-rec-${inv.invoiceNumber || index}`,
      invoiceNumber: inv.invoiceNumber || `INV-${index + 1000}`,
      invoiceDate: inv.invoiceDate || new Date(createdAt).toLocaleString('en-IN'),
      tenantName: inv.tenantName || 'Pharmacy Healthcare',
      drugLicenseNo: inv.drugLicenseNo || '',
      gstin: inv.gstin || '',
      pharmacistName: inv.pharmacistName || '',
      pharmacistRegNo: inv.pharmacistRegNo || '',
      patientName: inv.patientName || 'Walk-in Customer',
      patientPhone: inv.patientPhone || '',
      patientMrn: inv.patientMrn,
      doctorName: inv.doctorName || '',
      doctorNmcReg: inv.doctorNmcReg || '',
      paymentMode: (['CASH', 'UPI_QR', 'CARD', 'CREDIT_KHATA'].includes(inv.paymentMode)
        ? inv.paymentMode
        : 'CASH') as any,
      items: Array.isArray(inv.items) ? inv.items : [],
      subtotal: Number(inv.subtotal || inv.grandTotal || 0),
      discountPercent: Number(inv.discountPercent || 0),
      discountAmount: Number(inv.discountAmount || 0),
      taxableAmount: Number(inv.taxableAmount || Math.round((inv.grandTotal || 0) / 1.12)),
      cgstAmount: Number(inv.cgstAmount || 0),
      sgstAmount: Number(inv.sgstAmount || 0),
      grandTotal: Number(inv.grandTotal || 0),
      containsScheduleH: !!inv.containsScheduleH,
      createdAt
    };
  }

  private generateRealisticSeedInvoices(): PharmacySalesInvoiceRecord[] {
    const seedTemplates = [
      {
        patient: 'Ramesh Sharma',
        phone: '9820144910',
        doctor: 'Dr. Sarah Jenkins, MD',
        doctorNmc: 'NMC-48291-DEL',
        mode: 'CASH' as const,
        items: [
          { medicationName: 'Dolo 650', genericName: 'Paracetamol 650mg', batchNumber: 'BTH-2026-F8', expiryDate: '12/2027', quantity: 2, unit: 'Strip', mrp: 34.34, rate: 34.34, gstRate: 12, hsnCode: '30049060', total: 68.68 },
          { medicationName: 'Augmentin 625 Duo', genericName: 'Amoxycillin + Clavulanate', batchNumber: 'BTH-AUG-01', expiryDate: '10/2027', quantity: 1, unit: 'Strip', mrp: 204.00, rate: 204.00, gstRate: 12, hsnCode: '30049060', total: 204.00 }
        ],
        hoursAgo: 1
      },
      {
        patient: 'Sunita Mehra',
        phone: '9819034821',
        doctor: 'Dr. Rajesh Verma, MBBS',
        doctorNmc: 'NMC-71932-MAH',
        mode: 'UPI_QR' as const,
        items: [
          { medicationName: 'Pan 40', genericName: 'Pantoprazole Sodium 40mg', batchNumber: 'BTH-PAN-02', expiryDate: '08/2027', quantity: 2, unit: 'Strip', mrp: 155.00, rate: 155.00, gstRate: 12, hsnCode: '30049060', total: 310.00 },
          { medicationName: 'Shelcal 500', genericName: 'Calcium with Vitamin D3', batchNumber: 'BTH-SHE-04', expiryDate: '06/2028', quantity: 1, unit: 'Strip', mrp: 131.00, rate: 131.00, gstRate: 12, hsnCode: '30049060', total: 131.00 }
        ],
        hoursAgo: 3
      },
      {
        patient: 'Deepak Patel',
        phone: '9840291845',
        doctor: 'Dr. Sunita Rao, DM (Cardio)',
        doctorNmc: 'NMC-89104-MAH',
        mode: 'CASH' as const,
        items: [
          { medicationName: 'Telma 40', genericName: 'Telmisartan 40mg', batchNumber: 'BTH-TEL-01', expiryDate: '11/2027', quantity: 3, unit: 'Strip', mrp: 220.00, rate: 220.00, gstRate: 12, hsnCode: '30049060', total: 660.00 },
          { medicationName: 'Glycomet 500 SR', genericName: 'Metformin HCl 500mg', batchNumber: 'BTH-GLY-03', expiryDate: '01/2028', quantity: 2, unit: 'Strip', mrp: 48.00, rate: 48.00, gstRate: 12, hsnCode: '30049060', total: 96.00 }
        ],
        hoursAgo: 5
      },
      {
        patient: 'Vikram Choudhury (Regular Khata)',
        phone: '9821094812',
        doctor: 'Dr. Amit Roy, DCH',
        doctorNmc: 'NMC-61902-WB',
        mode: 'CREDIT_KHATA' as const,
        items: [
          { medicationName: 'Ascoril-LS Syrup', genericName: 'Levosalbutamol + Ambroxol', batchNumber: 'BTH-ASC-01', expiryDate: '05/2027', quantity: 2, unit: 'Bottle', mrp: 118.00, rate: 118.00, gstRate: 12, hsnCode: '30049060', total: 236.00 },
          { medicationName: 'Taxim-O 200', genericName: 'Cefixime 200mg', batchNumber: 'BTH-TAX-02', expiryDate: '09/2027', quantity: 1, unit: 'Strip', mrp: 108.00, rate: 108.00, gstRate: 12, hsnCode: '30049060', total: 108.00 }
        ],
        hoursAgo: 7
      },
      {
        patient: 'Anita Deshmukh',
        phone: '9867012948',
        doctor: 'Dr. S. K. Gupta, MD',
        doctorNmc: 'NMC-38491-DEL',
        mode: 'CARD' as const,
        items: [
          { medicationName: 'Azithral 500', genericName: 'Azithromycin 500mg', batchNumber: 'BTH-AZI-01', expiryDate: '12/2027', quantity: 2, unit: 'Strip', mrp: 132.00, rate: 132.00, gstRate: 12, hsnCode: '30049060', total: 264.00 }
        ],
        hoursAgo: 24 // Yesterday
      },
      {
        patient: 'Mohammad Tariq',
        phone: '9830114920',
        doctor: 'Dr. Sarah Jenkins, MD',
        doctorNmc: 'NMC-48291-DEL',
        mode: 'CASH' as const,
        items: [
          { medicationName: 'Dolo 650', genericName: 'Paracetamol 650mg', batchNumber: 'BTH-2026-F8', expiryDate: '12/2027', quantity: 3, unit: 'Strip', mrp: 34.34, rate: 34.34, gstRate: 12, hsnCode: '30049060', total: 103.02 },
          { medicationName: 'Combiflam', genericName: 'Ibuprofen + Paracetamol', batchNumber: 'BTH-COM-01', expiryDate: '07/2027', quantity: 2, unit: 'Strip', mrp: 48.00, rate: 48.00, gstRate: 12, hsnCode: '30049060', total: 96.00 }
        ],
        hoursAgo: 48 // 2 days ago
      },
      {
        patient: 'Kavita Joshi',
        phone: '9870123984',
        doctor: 'Dr. Rajesh Verma, MBBS',
        doctorNmc: 'NMC-71932-MAH',
        mode: 'UPI_QR' as const,
        items: [
          { medicationName: 'Augmentin 625 Duo', genericName: 'Amoxycillin + Clavulanate', batchNumber: 'BTH-AUG-01', expiryDate: '10/2027', quantity: 2, unit: 'Strip', mrp: 204.00, rate: 204.00, gstRate: 12, hsnCode: '30049060', total: 408.00 }
        ],
        hoursAgo: 72 // 3 days ago
      },
      {
        patient: 'Harish Nair',
        phone: '9890124859',
        doctor: 'Dr. Sunita Rao, DM',
        doctorNmc: 'NMC-89104-MAH',
        mode: 'CASH' as const,
        items: [
          { medicationName: 'Telma 40', genericName: 'Telmisartan 40mg', batchNumber: 'BTH-TEL-01', expiryDate: '11/2027', quantity: 2, unit: 'Strip', mrp: 220.00, rate: 220.00, gstRate: 12, hsnCode: '30049060', total: 440.00 }
        ],
        hoursAgo: 120 // 5 days ago
      },
      {
        patient: 'Pooja Agarwal',
        phone: '9819284756',
        doctor: 'Dr. S. K. Gupta, MD',
        doctorNmc: 'NMC-38491-DEL',
        mode: 'UPI_QR' as const,
        items: [
          { medicationName: 'Pan 40', genericName: 'Pantoprazole Sodium 40mg', batchNumber: 'BTH-PAN-02', expiryDate: '08/2027', quantity: 3, unit: 'Strip', mrp: 155.00, rate: 155.00, gstRate: 12, hsnCode: '30049060', total: 465.00 }
        ],
        hoursAgo: 240 // 10 days ago
      }
    ];

    return seedTemplates.map((tpl, i) => {
      const invDate = new Date(Date.now() - tpl.hoursAgo * 3600000);
      const subtotal = Math.round(tpl.items.reduce((s, it) => s + it.total, 0) * 100) / 100;
      const discount = 0;
      const grandTotal = subtotal;
      const taxable = Math.round((grandTotal / 1.12) * 100) / 100;
      const gst = Math.round((grandTotal - taxable) * 100) / 100;

      return {
        id: `seed-rx-inv-${i + 1}`,
        invoiceNumber: `INV-PHARM-${invDate.getFullYear()}-${100800 + i}`,
        invoiceDate: invDate.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
        tenantName: 'DocSearch Chemist & Retail Pharmacy',
        drugLicenseNo: 'FORM 20B/21B - MH-WZ-284910',
        gstin: '27AABCP1842Q1Z8',
        pharmacistName: 'Suresh Patel, R.Ph.',
        pharmacistRegNo: 'MH-RPH-84291',
        patientName: tpl.patient,
        patientPhone: tpl.phone,
        doctorName: tpl.doctor,
        doctorNmcReg: tpl.doctorNmc,
        paymentMode: tpl.mode,
        items: tpl.items as any,
        subtotal,
        discountPercent: 0,
        discountAmount: discount,
        taxableAmount: taxable,
        cgstAmount: Math.round((gst / 2) * 100) / 100,
        sgstAmount: Math.round((gst / 2) * 100) / 100,
        grandTotal,
        containsScheduleH: tpl.items.some((it) => it.medicationName.includes('Augmentin') || it.medicationName.includes('Telma') || it.medicationName.includes('Taxim')),
        createdAt: invDate.toISOString()
      };
    });
  }

  private generateRealisticSeedHandovers(): GallaShiftHandoverRecord[] {
    const yesterday = new Date(Date.now() - 24 * 3600000);
    const yDateStr = yesterday.toISOString().split('T')[0]!;

    return [
      {
        id: 'gla-rec-001',
        handoverNumber: `GLA-${yDateStr}-M1`,
        shiftType: 'MORNING',
        shiftLabel: 'Morning Shift (08:00 AM - 03:30 PM)',
        handoverDate: yDateStr,
        handoverTimestamp: `${yDateStr}T15:30:00.000Z`,
        outgoingPharmacistName: 'Suresh Patel, R.Ph.',
        outgoingPharmacistRegNo: 'MH-RPH-84291',
        incomingPharmacistName: 'Ramesh Kulkarni, D.Pharm',
        incomingPharmacistRegNo: 'MH-RPH-91024',
        openingDrawerFloat: 2000,
        cashSalesInflow: 4850,
        upiSalesInflow: 3620,
        cardSalesInflow: 1250,
        khataSalesInflow: 640,
        grossShiftRevenue: 10360,
        shiftInvoiceCount: 18,
        pettyCashOutflow: 150, // Chai & Snacks for counter staff
        pettyCashRemarks: 'Tea & Snacks for counter staff + Parcel delivery tip',
        expectedDrawerCash: 6700, // 2000 + 4850 - 150
        actualCountedCash: 6700,
        denominationBreakup: {
          n500: 10, // 5000
          n200: 5,  // 1000
          n100: 5,  // 500
          n50: 2,   // 100
          n20: 3,   // 60
          n10: 4,   // 40
          coins: 0
        },
        discrepancy: 0,
        discrepancyStatus: 'BALANCED',
        notes: 'Morning shift smooth. All Schedule H antibiotics verified with doctor NMC reg numbers.'
      },
      {
        id: 'gla-rec-002',
        handoverNumber: `GLA-${yDateStr}-E2`,
        shiftType: 'EVENING',
        shiftLabel: 'Evening Shift & Dukaan Closing (03:30 PM - 10:30 PM)',
        handoverDate: yDateStr,
        handoverTimestamp: `${yDateStr}T22:30:00.000Z`,
        outgoingPharmacistName: 'Ramesh Kulkarni, D.Pharm',
        outgoingPharmacistRegNo: 'MH-RPH-91024',
        incomingPharmacistName: 'Suresh Patel, R.Ph. (Owner / Night Lock)',
        incomingPharmacistRegNo: 'MH-RPH-84291',
        openingDrawerFloat: 2500,
        cashSalesInflow: 6240,
        upiSalesInflow: 5410,
        cardSalesInflow: 1800,
        khataSalesInflow: 920,
        grossShiftRevenue: 14370,
        shiftInvoiceCount: 26,
        pettyCashOutflow: 320, // Electrician tube repair
        pettyCashRemarks: 'Shop tube-light repair + courier booking',
        expectedDrawerCash: 8420, // 2500 + 6240 - 320
        actualCountedCash: 8420,
        denominationBreakup: {
          n500: 14, // 7000
          n200: 5,  // 1000
          n100: 3,  // 300
          n50: 2,   // 100
          n20: 0,
          n10: 2,   // 20
          coins: 0
        },
        discrepancy: 0,
        discrepancyStatus: 'BALANCED',
        notes: 'Night locker locked. Cash safe handed over.'
      }
    ];
  }

  /**
   * Reload data from localStorage and external events
   */
  public reload(): void {
    this.initData();
  }

  /**
   * Explicitly seed realistic mock data for testing/demo purposes
   */
  public seedDemoData(): void {
    if (typeof window === 'undefined') return;
    this.invoices = this.generateRealisticSeedInvoices();
    this.handovers = this.generateRealisticSeedHandovers();
    try {
      window.localStorage.setItem(STORAGE_INVOICES_KEY, JSON.stringify(this.invoices));
      window.localStorage.setItem(STORAGE_HANDOVERS_KEY, JSON.stringify(this.handovers));
      window.localStorage.setItem('docsearch_pharmacy_demo_seed', 'true');
    } catch {}
  }

  /**
   * Clear all pharmacy sales and galla ledger data (Zero-state clean room)
   */
  public clearAllData(): void {
    if (typeof window === 'undefined') return;
    this.invoices = [];
    this.handovers = [];
    try {
      window.localStorage.removeItem(STORAGE_INVOICES_KEY);
      window.localStorage.removeItem(STORAGE_HANDOVERS_KEY);
      window.localStorage.removeItem('docsearch_pharmacy_demo_seed');
    } catch {}
  }

  public getInvoices(): PharmacySalesInvoiceRecord[] {
    this.reload();
    return [...this.invoices];
  }

  public getHandovers(): GallaShiftHandoverRecord[] {
    this.reload();
    return [...this.handovers];
  }

  public saveGallaHandover(record: Omit<GallaShiftHandoverRecord, 'id' | 'handoverNumber' | 'handoverTimestamp'>): GallaShiftHandoverRecord {
    this.reload();
    const now = new Date();
    const dateStr = record.handoverDate || now.toISOString().split('T')[0]!;
    const suffix = String(this.handovers.length + 1).padStart(2, '0');

    const newRecord: GallaShiftHandoverRecord = {
      ...record,
      id: `gla-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      handoverNumber: `GLA-${dateStr.replace(/-/g, '')}-${(record.shiftType || 'G').charAt(0)}${suffix}`,
      handoverTimestamp: now.toISOString()
    };

    this.handovers.unshift(newRecord);

    try {
      window.localStorage.setItem(STORAGE_HANDOVERS_KEY, JSON.stringify(this.handovers));
      window.dispatchEvent(new Event('docsearch_galla_updated'));
      window.dispatchEvent(new Event('docsearch_billing_updated'));
    } catch {}

    return newRecord;
  }

  /**
   * Calculates multi-interval revenue metrics: Today, Last 7 Days, Last 30 Days, All, Custom
   */
  public getRevenueSummary(
    interval: 'TODAY' | '7D' | '30D' | 'ALL' | 'CUSTOM' = 'TODAY',
    customFromDate?: string,
    customToDate?: string
  ): PharmacyRevenueSummaryResult {
    this.reload();

    const now = new Date();
    const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const sevenDaysAgo = todayMidnight - 6 * 24 * 60 * 60 * 1000;
    const thirtyDaysAgo = todayMidnight - 29 * 24 * 60 * 60 * 1000;

    const createEmptyMetric = (): PharmacyRevenueMetricCardData => ({
      amount: 0,
      invoiceCount: 0,
      cashAmount: 0,
      upiAmount: 0,
      cardAmount: 0,
      khataAmount: 0
    });

    const todayMetric = createEmptyMetric();
    const last7DaysMetric = createEmptyMetric();
    const last30DaysMetric = createEmptyMetric();
    const allTimeMetric = createEmptyMetric();

    // Determine filter range
    let rangeStart = 0;
    let rangeEnd = Number.MAX_SAFE_INTEGER;

    if (interval === 'TODAY') {
      rangeStart = todayMidnight;
      rangeEnd = todayMidnight + 24 * 60 * 60 * 1000 - 1;
    } else if (interval === '7D') {
      rangeStart = sevenDaysAgo;
      rangeEnd = now.getTime();
    } else if (interval === '30D') {
      rangeStart = thirtyDaysAgo;
      rangeEnd = now.getTime();
    } else if (interval === 'CUSTOM') {
      if (customFromDate) {
        rangeStart = new Date(`${customFromDate}T00:00:00`).getTime();
      }
      if (customToDate) {
        rangeEnd = new Date(`${customToDate}T23:59:59.999`).getTime();
      }
    }

    const filteredInvoices: PharmacySalesInvoiceRecord[] = [];
    const paymentModes = {
      CASH: 0,
      UPI_QR: 0,
      CARD: 0,
      CREDIT_KHATA: 0
    };

    let filteredAmount = 0;
    let filteredSubtotal = 0;
    let filteredDiscountTotal = 0;
    let filteredTaxableTotal = 0;
    let filteredGstTotal = 0;

    // Daily trend buckets
    const dailyMap = new Map<string, { date: string; label: string; amount: number; count: number }>();

    for (const inv of this.invoices) {
      const invTime = new Date(inv.createdAt).getTime();
      const amount = inv.grandTotal || 0;
      const mode = inv.paymentMode;

      // Update All Time
      allTimeMetric.amount += amount;
      allTimeMetric.invoiceCount += 1;
      if (mode === 'CASH') allTimeMetric.cashAmount += amount;
      else if (mode === 'UPI_QR') allTimeMetric.upiAmount += amount;
      else if (mode === 'CARD') allTimeMetric.cardAmount += amount;
      else if (mode === 'CREDIT_KHATA') allTimeMetric.khataAmount += amount;

      // Update Today
      if (invTime >= todayMidnight && invTime <= todayMidnight + 24 * 60 * 60 * 1000 - 1) {
        todayMetric.amount += amount;
        todayMetric.invoiceCount += 1;
        if (mode === 'CASH') todayMetric.cashAmount += amount;
        else if (mode === 'UPI_QR') todayMetric.upiAmount += amount;
        else if (mode === 'CARD') todayMetric.cardAmount += amount;
        else if (mode === 'CREDIT_KHATA') todayMetric.khataAmount += amount;
      }

      // Update 7D
      if (invTime >= sevenDaysAgo && invTime <= now.getTime()) {
        last7DaysMetric.amount += amount;
        last7DaysMetric.invoiceCount += 1;
        if (mode === 'CASH') last7DaysMetric.cashAmount += amount;
        else if (mode === 'UPI_QR') last7DaysMetric.upiAmount += amount;
        else if (mode === 'CARD') last7DaysMetric.cardAmount += amount;
        else if (mode === 'CREDIT_KHATA') last7DaysMetric.khataAmount += amount;
      }

      // Update 30D
      if (invTime >= thirtyDaysAgo && invTime <= now.getTime()) {
        last30DaysMetric.amount += amount;
        last30DaysMetric.invoiceCount += 1;
        if (mode === 'CASH') last30DaysMetric.cashAmount += amount;
        else if (mode === 'UPI_QR') last30DaysMetric.upiAmount += amount;
        else if (mode === 'CARD') last30DaysMetric.cardAmount += amount;
        else if (mode === 'CREDIT_KHATA') last30DaysMetric.khataAmount += amount;
      }

      // Filter Evaluation
      if (invTime >= rangeStart && invTime <= rangeEnd) {
        filteredInvoices.push(inv);
        filteredAmount += amount;
        filteredSubtotal += inv.subtotal || amount;
        filteredDiscountTotal += inv.discountAmount || 0;
        filteredTaxableTotal += inv.taxableAmount || Math.round(amount / 1.12);
        filteredGstTotal += (inv.cgstAmount || 0) + (inv.sgstAmount || 0);

        if (mode === 'CASH') paymentModes.CASH += amount;
        else if (mode === 'UPI_QR') paymentModes.UPI_QR += amount;
        else if (mode === 'CARD') paymentModes.CARD += amount;
        else if (mode === 'CREDIT_KHATA') paymentModes.CREDIT_KHATA += amount;

        // Bucket for trend
        const dateKey = new Date(inv.createdAt).toISOString().split('T')[0]!;
        const existingTrend = dailyMap.get(dateKey) || {
          date: dateKey,
          label: new Date(inv.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
          amount: 0,
          count: 0
        };
        existingTrend.amount += amount;
        existingTrend.count += 1;
        dailyMap.set(dateKey, existingTrend);
      }
    }

    const dailyTrend = Array.from(dailyMap.values()).sort((a, b) => a.date.localeCompare(b.date));

    // Rounding totals
    todayMetric.amount = Math.round(todayMetric.amount * 100) / 100;
    last7DaysMetric.amount = Math.round(last7DaysMetric.amount * 100) / 100;
    last30DaysMetric.amount = Math.round(last30DaysMetric.amount * 100) / 100;
    allTimeMetric.amount = Math.round(allTimeMetric.amount * 100) / 100;

    return {
      today: todayMetric,
      last7Days: last7DaysMetric,
      last30Days: last30DaysMetric,
      allTime: allTimeMetric,
      filtered: {
        amount: Math.round(filteredAmount * 100) / 100,
        subtotal: Math.round(filteredSubtotal * 100) / 100,
        discountTotal: Math.round(filteredDiscountTotal * 100) / 100,
        taxableTotal: Math.round(filteredTaxableTotal * 100) / 100,
        gstTotal: Math.round(filteredGstTotal * 100) / 100,
        invoiceCount: filteredInvoices.length,
        paymentModes: {
          CASH: Math.round(paymentModes.CASH * 100) / 100,
          UPI_QR: Math.round(paymentModes.UPI_QR * 100) / 100,
          CARD: Math.round(paymentModes.CARD * 100) / 100,
          CREDIT_KHATA: Math.round(paymentModes.CREDIT_KHATA * 100) / 100
        },
        invoices: filteredInvoices.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
        dailyTrend
      }
    };
  }

  /**
   * Record a new POS or dispensing invoice into the revenue ledger
   */
  public recordInvoice(data: PharmacyInvoiceData): PharmacySalesInvoiceRecord {
    this.reload();
    const invoiceRecord: PharmacySalesInvoiceRecord = {
      ...data,
      id: `inv-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`,
      createdAt: new Date().toISOString()
    };

    // Prepend to invoices
    this.invoices.unshift(invoiceRecord);

    try {
      window.localStorage.setItem(STORAGE_INVOICES_KEY, JSON.stringify(this.invoices));
      window.dispatchEvent(new CustomEvent('docsearch_billing_updated', { detail: invoiceRecord }));
      window.dispatchEvent(new CustomEvent('docsearch_galla_updated', { detail: invoiceRecord }));
      window.dispatchEvent(new Event('storage'));
    } catch {
      // Storage quota or SSR safe
    }

    return invoiceRecord;
  }

  /**
   * Complete wipeout of revenue & shift handover records for fresh slate reset
   */
  public clearAll(): void {
    this.invoices = [];
    this.handovers = [];
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.removeItem(STORAGE_INVOICES_KEY);
        window.localStorage.removeItem(STORAGE_HANDOVERS_KEY);
        window.dispatchEvent(new Event('docsearch_billing_updated'));
        window.dispatchEvent(new Event('docsearch_galla_updated'));
        window.dispatchEvent(new Event('storage'));
      } catch {}
    }
  }

  /**
   * Export Sales Invoices to CSV formatted for Indian CA / Tally Accounting
   */
  public exportInvoicesCsv(invoices: PharmacySalesInvoiceRecord[], filename = 'Pharmacy_Sales_Register.csv'): void {
    const headers = [
      'Invoice Number',
      'Date & Time',
      'Customer / Patient',
      'Mobile Number',
      'Prescribing Doctor',
      'Doctor NMC Reg',
      'Payment Mode',
      'Total Items',
      'Subtotal (INR)',
      'Discount (INR)',
      'Taxable Amount (INR)',
      'CGST 6% (INR)',
      'SGST 6% (INR)',
      'Total GST (INR)',
      'Grand Total (INR)',
      'Contains Schedule H'
    ];

    const rows = invoices.map((inv) => {
      const itemsCount = (inv.items || []).reduce((sum, item) => sum + (item.quantity || 1), 0);
      const totalGst = (inv.cgstAmount || 0) + (inv.sgstAmount || 0);

      return [
        `"${inv.invoiceNumber}"`,
        `"${inv.invoiceDate}"`,
        `"${(inv.patientName || '').replace(/"/g, '""')}"`,
        `"${inv.patientPhone || ''}"`,
        `"${(inv.doctorName || '').replace(/"/g, '""')}"`,
        `"${inv.doctorNmcReg || ''}"`,
        `"${inv.paymentMode}"`,
        itemsCount,
        inv.subtotal.toFixed(2),
        inv.discountAmount.toFixed(2),
        inv.taxableAmount.toFixed(2),
        inv.cgstAmount.toFixed(2),
        inv.sgstAmount.toFixed(2),
        totalGst.toFixed(2),
        inv.grandTotal.toFixed(2),
        inv.containsScheduleH ? 'YES' : 'NO'
      ].join(',');
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  /**
   * Export Galla Shift Handovers to CSV for internal audit & cash control
   */
  public exportHandoversCsv(handovers: GallaShiftHandoverRecord[], filename = 'Pharmacy_Galla_Handovers.csv'): void {
    const headers = [
      'Handover No',
      'Date',
      'Shift Type',
      'Outgoing Pharmacist',
      'Incoming Pharmacist',
      'Opening Float (INR)',
      'Cash Sales (INR)',
      'Petty Cash Expenses (INR)',
      'Expected Cash (INR)',
      'Actual Counted Cash (INR)',
      'Discrepancy (INR)',
      'Status',
      'Gross Shift Sales (INR)',
      'Invoice Count',
      'Petty Cash Remarks',
      'Handover Notes'
    ];

    const rows = handovers.map((h) => [
      `"${h.handoverNumber}"`,
      `"${h.handoverDate}"`,
      `"${h.shiftType}"`,
      `"${h.outgoingPharmacistName}"`,
      `"${h.incomingPharmacistName}"`,
      h.openingDrawerFloat.toFixed(2),
      h.cashSalesInflow.toFixed(2),
      h.pettyCashOutflow.toFixed(2),
      h.expectedDrawerCash.toFixed(2),
      h.actualCountedCash.toFixed(2),
      h.discrepancy.toFixed(2),
      `"${h.discrepancyStatus}"`,
      h.grossShiftRevenue.toFixed(2),
      h.shiftInvoiceCount,
      `"${(h.pettyCashRemarks || '').replace(/"/g, '""')}"`,
      `"${(h.notes || '').replace(/"/g, '""')}"`
    ].join(','));

    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  /**
   * Calculates comprehensive pharmacy profit & net margin analytics:
   * Profit = Sale Amount (MRP) - Acquisition Cost (Wholesale PTR)
   * Supports: TODAY, 7D, 30D, ALL, and CUSTOM date range.
   */
  public getProfitSummary(
    interval: 'TODAY' | '7D' | '30D' | 'ALL' | 'CUSTOM' = 'TODAY',
    customFromDate?: string,
    customToDate?: string
  ): PharmacyProfitReportSummary {
    this.reload();

    const now = new Date();
    const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const sevenDaysAgo = todayMidnight - 6 * 24 * 60 * 60 * 1000;
    const thirtyDaysAgo = todayMidnight - 29 * 24 * 60 * 60 * 1000;

    let rangeStart = 0;
    let rangeEnd = Number.MAX_SAFE_INTEGER;

    if (interval === 'TODAY') {
      rangeStart = todayMidnight;
      rangeEnd = todayMidnight + 24 * 60 * 60 * 1000 - 1;
    } else if (interval === '7D') {
      rangeStart = sevenDaysAgo;
      rangeEnd = now.getTime();
    } else if (interval === '30D') {
      rangeStart = thirtyDaysAgo;
      rangeEnd = now.getTime();
    } else if (interval === 'CUSTOM') {
      if (customFromDate) {
        rangeStart = new Date(`${customFromDate}T00:00:00`).getTime();
      }
      if (customToDate) {
        rangeEnd = new Date(`${customToDate}T23:59:59.999`).getTime();
      }
    }

    const filteredInvoices: PharmacyInvoiceProfitRecord[] = [];
    const paymentModeProfits = {
      CASH: { revenue: 0, cost: 0, profit: 0, count: 0 },
      UPI_QR: { revenue: 0, cost: 0, profit: 0, count: 0 },
      CARD: { revenue: 0, cost: 0, profit: 0, count: 0 },
      CREDIT_KHATA: { revenue: 0, cost: 0, profit: 0, count: 0 }
    };

    let totalRevenue = 0;
    let totalCost = 0;
    let totalUnitsSold = 0;

    const medProfitMap = new Map<string, {
      medicationName: string;
      quantity: number;
      revenue: number;
      cost: number;
      profit: number;
    }>();

    // Map formulary items for fast PTR lookup
    const formularyByName = new Map<string, IndianMedicationFormularyItem>();
    for (const item of INDIAN_PHARMACY_FORMULARY) {
      formularyByName.set(item.brandName.toLowerCase(), item);
    }

    const lookupPtr = (name: string, generic?: string, unitRate?: number, explicitCost?: number): number => {
      if (explicitCost && explicitCost > 0) return explicitCost;
      const lower = (name || '').toLowerCase().trim();
      const direct = formularyByName.get(lower);
      if (direct?.costPrice) return direct.costPrice;

      const partial = INDIAN_PHARMACY_FORMULARY.find(
        (f) => lower.includes(f.brandName.toLowerCase()) || f.brandName.toLowerCase().includes(lower)
      );
      if (partial?.costPrice) return partial.costPrice;

      if (generic) {
        const genLower = generic.toLowerCase().trim();
        const matchGen = INDIAN_PHARMACY_FORMULARY.find(
          (f) => genLower.includes(f.genericName.toLowerCase()) || f.genericName.toLowerCase().includes(genLower)
        );
        if (matchGen?.costPrice) return matchGen.costPrice;
      }

      // Default PTR for retail pharmacy is roughly 70% of retail rate (30% gross profit margin)
      return unitRate ? Math.round(unitRate * 0.70 * 100) / 100 : 15.00;
    };

    for (const inv of this.invoices) {
      const invTime = new Date(inv.createdAt).getTime();
      if (invTime < rangeStart || invTime > rangeEnd) continue;

      let invCost = 0;
      let invUnits = 0;
      const profitItems: PharmacyProfitItemBreakdown[] = [];

      for (const it of inv.items || []) {
        const qty = Number(it.quantity || 1);
        const salePrice = Number(it.rate || it.mrp || 0);
        const ptr = lookupPtr(it.medicationName, it.genericName, salePrice, (it as any).costPrice);
        const lineSale = Math.round((Number(it.total) || (qty * salePrice)) * 100) / 100;
        const lineCost = Math.round(qty * ptr * 100) / 100;
        const lineProfit = Math.round((lineSale - lineCost) * 100) / 100;
        const marginPct = lineSale > 0 ? Math.round((lineProfit / lineSale) * 100 * 10) / 10 : 0;

        invCost += lineCost;
        invUnits += qty;
        totalUnitsSold += qty;

        profitItems.push({
          medicationName: it.medicationName,
          genericName: it.genericName,
          batchNumber: it.batchNumber,
          quantity: qty,
          salePrice,
          purchaseCostPtr: ptr,
          totalSale: lineSale,
          totalCost: lineCost,
          profit: lineProfit,
          marginPercent: marginPct
        });

        // Track med profit leaderboard
        const medKey = (it.medicationName || 'Medicine').trim();
        const existing = medProfitMap.get(medKey) || {
          medicationName: medKey,
          quantity: 0,
          revenue: 0,
          cost: 0,
          profit: 0
        };
        existing.quantity += qty;
        existing.revenue = Math.round((existing.revenue + lineSale) * 100) / 100;
        existing.cost = Math.round((existing.cost + lineCost) * 100) / 100;
        existing.profit = Math.round((existing.profit + lineProfit) * 100) / 100;
        medProfitMap.set(medKey, existing);
      }

      // If invoice had items, use invCost; if empty items, estimate 70% cost of grandTotal
      const finalInvCost = invCost > 0 ? Math.round(invCost * 100) / 100 : Math.round(inv.grandTotal * 0.70 * 100) / 100;
      const invRevenue = Math.round(inv.grandTotal * 100) / 100;
      const invProfit = Math.round(Math.max(0, invRevenue - finalInvCost) * 100) / 100;
      const invMargin = invRevenue > 0 ? Math.round((invProfit / invRevenue) * 100 * 10) / 10 : 0;

      totalRevenue = Math.round((totalRevenue + invRevenue) * 100) / 100;
      totalCost = Math.round((totalCost + finalInvCost) * 100) / 100;

      // Payment mode buckets
      const mode = (inv.paymentMode in paymentModeProfits ? inv.paymentMode : 'CASH') as keyof typeof paymentModeProfits;
      paymentModeProfits[mode].revenue = Math.round((paymentModeProfits[mode].revenue + invRevenue) * 100) / 100;
      paymentModeProfits[mode].cost = Math.round((paymentModeProfits[mode].cost + finalInvCost) * 100) / 100;
      paymentModeProfits[mode].profit = Math.round((paymentModeProfits[mode].profit + invProfit) * 100) / 100;
      paymentModeProfits[mode].count += 1;

      filteredInvoices.push({
        id: inv.id,
        invoiceNumber: inv.invoiceNumber,
        invoiceDate: inv.invoiceDate,
        createdAt: inv.createdAt,
        patientName: inv.patientName,
        patientPhone: inv.patientPhone,
        doctorName: inv.doctorName,
        paymentMode: inv.paymentMode,
        revenue: invRevenue,
        cost: finalInvCost,
        profit: invProfit,
        marginPercent: invMargin,
        totalUnits: invUnits,
        items: profitItems
      });
    }

    const totalProfit = Math.round(Math.max(0, totalRevenue - totalCost) * 100) / 100;
    const overallMargin = totalRevenue > 0 ? Math.round((totalProfit / totalRevenue) * 100 * 10) / 10 : 0;
    const invoiceCount = filteredInvoices.length;
    const avgProfitPerBill = invoiceCount > 0 ? Math.round((totalProfit / invoiceCount) * 100) / 100 : 0;

    const topProfitableMeds = Array.from(medProfitMap.values())
      .map((m) => ({
        ...m,
        marginPercent: m.revenue > 0 ? Math.round((m.profit / m.revenue) * 100 * 10) / 10 : 0
      }))
      .sort((a, b) => b.profit - a.profit)
      .slice(0, 10);

    return {
      interval,
      customFromDate,
      customToDate,
      totalRevenue,
      totalCost,
      totalProfit,
      overallMarginPercent: overallMargin,
      invoiceCount,
      totalUnitsSold,
      avgProfitPerBill,
      paymentModeProfits,
      topProfitableMeds,
      invoices: filteredInvoices
    };
  }

  /**
   * Generates and downloads a clean CSV profit statement for accountants & auditors
   */
  public exportProfitReportCsv(summary: PharmacyProfitReportSummary, filename = 'pharmacy_profit_statement.csv'): void {
    if (typeof window === 'undefined') return;

    const headers = [
      'Invoice No',
      'Date & Time',
      'Patient Name',
      'Doctor Name',
      'Payment Mode',
      'Units Sold',
      'Sale Revenue (INR)',
      'Purchase Cost PTR (INR)',
      'Net Profit (INR)',
      'Margin %',
      'Items Detail'
    ];

    const rows = summary.invoices.map((inv) => [
      `"${inv.invoiceNumber}"`,
      `"${inv.invoiceDate}"`,
      `"${inv.patientName}"`,
      `"${inv.doctorName || 'Counter Sale'}"`,
      `"${inv.paymentMode}"`,
      inv.totalUnits,
      inv.revenue.toFixed(2),
      inv.cost.toFixed(2),
      inv.profit.toFixed(2),
      `${inv.marginPercent.toFixed(1)}%`,
      `"${inv.items.map((it) => `${it.medicationName} (${it.quantity}x)`).join('; ')}"`
    ].join(','));

    // Summary header line
    const summaryRows = [
      `"REPORT INTERVAL","${summary.interval}"`,
      `"TOTAL SALES REVENUE","${summary.totalRevenue.toFixed(2)}"`,
      `"TOTAL PURCHASE COST (PTR)","${summary.totalCost.toFixed(2)}"`,
      `"TOTAL NET PROFIT","${summary.totalProfit.toFixed(2)}"`,
      `"OVERALL MARGIN %","${summary.overallMarginPercent.toFixed(1)}%"`,
      `"TOTAL INVOICES","${summary.invoiceCount}"`,
      `"TOTAL UNITS SOLD","${summary.totalUnitsSold}"`,
      `"AVG PROFIT PER BILL","${summary.avgProfitPerBill.toFixed(2)}"`,
      '""'
    ];

    const csvContent = '\uFEFF' + [...summaryRows, headers.join(','), ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

export const pharmacyRevenueGallaService = new PharmacyRevenueGallaService();
