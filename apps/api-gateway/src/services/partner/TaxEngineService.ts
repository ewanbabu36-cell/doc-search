import crypto from 'node:crypto';
import { getDatabase, gstTaxRates, eq, and } from '@docsearch/database';
import { type SessionContext, ScopeGuard } from '@docsearch/auth';

export interface TaxCalculationItem {
  serviceName: string;
  category?: string | undefined;
  quantity: number;
  unitPrice: number;
  discountAmount?: number | undefined;
  taxCategory?: string | undefined;
  hsnSacCode?: string | undefined;
}

export interface CalculatedTaxLineItem {
  serviceName: string;
  category: string;
  quantity: number;
  unitPrice: number;
  grossAmount: number;
  discountAmount: number;
  taxableAmount: number;
  cgstRatePercent: number;
  sgstRatePercent: number;
  igstRatePercent: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  taxAmount: number;
  netAmount: number;
  hsnSacCode: string;
  isExempt: boolean;
}

export interface TaxCalculationResult {
  items: CalculatedTaxLineItem[];
  subtotal: number;
  discountTotal: number;
  taxableTotal: number;
  cgstTotal: number;
  sgstTotal: number;
  igstTotal: number;
  taxTotal: number;
  grandTotal: number;
  totalAmount?: number;
  isInterstate: boolean;
}

const DEFAULT_CATEGORY_RULES: Record<string, { hsnSacCode: string; cgst: number; sgst: number; igst: number; isExempt: boolean }> = {
  HEALTHCARE_EXEMPT: { hsnSacCode: '999312', cgst: 0, sgst: 0, igst: 0, isExempt: true },
  CONSULTATION: { hsnSacCode: '999312', cgst: 0, sgst: 0, igst: 0, isExempt: true },
  LAB_TEST: { hsnSacCode: '999316', cgst: 0, sgst: 0, igst: 0, isExempt: true },
  LABORATORY: { hsnSacCode: '999316', cgst: 0, sgst: 0, igst: 0, isExempt: true },
  RADIOLOGY: { hsnSacCode: '999315', cgst: 0, sgst: 0, igst: 0, isExempt: true },
  PHARMACY: { hsnSacCode: '3004', cgst: 2.5, sgst: 2.5, igst: 5.0, isExempt: false },
  BED_CHARGES: { hsnSacCode: '999311', cgst: 2.5, sgst: 2.5, igst: 5.0, isExempt: false },
  SURGERY_OT: { hsnSacCode: '999313', cgst: 0, sgst: 0, igst: 0, isExempt: true },
  NURSING: { hsnSacCode: '999314', cgst: 0, sgst: 0, igst: 0, isExempt: true },
  BLOOD_BANK: { hsnSacCode: '999317', cgst: 0, sgst: 0, igst: 0, isExempt: true },
  PACKAGE: { hsnSacCode: '999319', cgst: 0, sgst: 0, igst: 0, isExempt: true },
  GENERAL: { hsnSacCode: '999319', cgst: 9, sgst: 9, igst: 18, isExempt: false }
};

export class TaxEngineService {
  async getTaxRates(session: SessionContext, tx: any = getDatabase()) {
    const scope = ScopeGuard.resolveEffectiveQueryScope(session);
    let rates = await tx
      .select()
      .from(gstTaxRates)
      .where(and(eq(gstTaxRates.tenantId, scope.tenantId), eq(gstTaxRates.isActive, true)));

    if (rates.length === 0) {
      const defaultRates = [
        { id: crypto.randomUUID(), tenantId: scope.tenantId, taxCategory: 'CONSULTATION', hsnSacCode: '999312', cgstRatePercent: '0.00', sgstRatePercent: '0.00', igstRatePercent: '0.00', isExempt: true, description: 'Healthcare Consultation (Exempt)' },
        { id: crypto.randomUUID(), tenantId: scope.tenantId, taxCategory: 'PHARMACY', hsnSacCode: '3004', cgstRatePercent: '2.50', sgstRatePercent: '2.50', igstRatePercent: '5.00', isExempt: false, description: 'Medicines & Pharmaceuticals (5% GST)' },
        { id: crypto.randomUUID(), tenantId: scope.tenantId, taxCategory: 'INVESTIGATION', hsnSacCode: '999316', cgstRatePercent: '0.00', sgstRatePercent: '0.00', igstRatePercent: '0.00', isExempt: true, description: 'Diagnostic Pathology (Exempt)' },
        { id: crypto.randomUUID(), tenantId: scope.tenantId, taxCategory: 'RADIOLOGY', hsnSacCode: '999315', cgstRatePercent: '0.00', sgstRatePercent: '0.00', igstRatePercent: '0.00', isExempt: true, description: 'Radiology Imaging (Exempt)' },
        { id: crypto.randomUUID(), tenantId: scope.tenantId, taxCategory: 'ROOM_BED', hsnSacCode: '999311', cgstRatePercent: '2.50', sgstRatePercent: '2.50', igstRatePercent: '5.00', isExempt: false, description: 'Non-ICU Room Bed (5% GST)' },
        { id: crypto.randomUUID(), tenantId: scope.tenantId, taxCategory: 'GENERAL', hsnSacCode: '999319', cgstRatePercent: '9.00', sgstRatePercent: '9.00', igstRatePercent: '18.00', isExempt: false, description: 'General Administrative (18% GST)' }
      ];
      try {
        await tx.insert(gstTaxRates).values(defaultRates).onConflictDoNothing();
        rates = await tx
          .select()
          .from(gstTaxRates)
          .where(and(eq(gstTaxRates.tenantId, scope.tenantId), eq(gstTaxRates.isActive, true)));
      } catch {}
    }

    return rates;
  }

  async upsertTaxRate(
    data: {
      taxCategory: string;
      hsnSacCode: string;
      cgstRatePercent: number;
      sgstRatePercent: number;
      igstRatePercent: number;
      isExempt?: boolean | undefined;
      description?: string | undefined;
    },
    session: SessionContext,
    tx: any = getDatabase()
  ) {
    const scope = ScopeGuard.resolveEffectiveQueryScope(session);
    const category = data.taxCategory.toUpperCase();

    const [existing] = await tx
      .select()
      .from(gstTaxRates)
      .where(and(eq(gstTaxRates.tenantId, scope.tenantId), eq(gstTaxRates.taxCategory, category)))
      .limit(1);

    if (existing) {
      const [updated] = await tx
        .update(gstTaxRates)
        .set({
          hsnSacCode: data.hsnSacCode,
          cgstRatePercent: String(data.cgstRatePercent),
          sgstRatePercent: String(data.sgstRatePercent),
          igstRatePercent: String(data.igstRatePercent),
          isExempt: Boolean(data.isExempt),
          description: data.description || existing.description,
          isActive: true
        })
        .where(eq(gstTaxRates.id, existing.id))
        .returning();
      return updated;
    } else {
      const [created] = await tx
        .insert(gstTaxRates)
        .values({
          tenantId: scope.tenantId,
          taxCategory: category,
          hsnSacCode: data.hsnSacCode,
          cgstRatePercent: String(data.cgstRatePercent),
          sgstRatePercent: String(data.sgstRatePercent),
          igstRatePercent: String(data.igstRatePercent),
          isExempt: Boolean(data.isExempt),
          description: data.description || `${category} tax rate`,
          isActive: true
        })
        .returning();
      return created;
    }
  }

  async createTaxRate(session: SessionContext, data: any, tx: any = getDatabase()) {
    return this.upsertTaxRate(data, session, tx);
  }

  async calculateTaxes(
    items: TaxCalculationItem[],
    options: {
      tenantId: string;
      isInterstate?: boolean | undefined;
      patientState?: string | undefined;
      facilityState?: string | undefined;
    },
    tx: any = getDatabase()
  ): Promise<TaxCalculationResult> {
    const isInterstate = Boolean(
      options.isInterstate ||
      (options.patientState && options.facilityState && options.patientState.toLowerCase() !== options.facilityState.toLowerCase())
    );

    // Fetch tenant configured rates
    const configuredRates = await tx
      .select()
      .from(gstTaxRates)
      .where(and(eq(gstTaxRates.tenantId, options.tenantId), eq(gstTaxRates.isActive, true)));

    const rateMap = new Map<string, any>();
    for (const r of configuredRates) {
      rateMap.set(r.taxCategory.toUpperCase(), r);
    }

    let subtotal = 0;
    let discountTotal = 0;
    let taxableTotal = 0;
    let cgstTotal = 0;
    let sgstTotal = 0;
    let igstTotal = 0;
    let taxTotal = 0;

    const calculatedItems: CalculatedTaxLineItem[] = items.map((item) => {
      const qty = Math.max(1, item.quantity || 1);
      const unitPrice = Math.max(0, item.unitPrice || 0);
      const grossAmount = Math.round(qty * unitPrice * 100) / 100;
      const discountAmount = Math.min(grossAmount, Math.max(0, item.discountAmount || 0));
      const taxableAmount = Math.round((grossAmount - discountAmount) * 100) / 100;

      const category = (item.taxCategory || item.category || 'GENERAL').toUpperCase();
      const dbRule = rateMap.get(category);
      const defaultRule = DEFAULT_CATEGORY_RULES[category] || DEFAULT_CATEGORY_RULES['GENERAL'] || { hsnSacCode: '999319', cgst: 0, sgst: 0, igst: 0, isExempt: true };

      const isExempt = dbRule ? Boolean(dbRule.isExempt) : Boolean(defaultRule.isExempt);
      const hsnSacCode = dbRule?.hsnSacCode || defaultRule.hsnSacCode;

      let cgstRatePercent = 0;
      let sgstRatePercent = 0;
      let igstRatePercent = 0;
      let cgstAmount = 0;
      let sgstAmount = 0;
      let igstAmount = 0;

      if (!isExempt) {
        if (isInterstate) {
          igstRatePercent = dbRule ? parseFloat(dbRule.igstRatePercent) : defaultRule.igst;
          igstAmount = Math.round((taxableAmount * igstRatePercent / 100) * 100) / 100;
        } else {
          cgstRatePercent = dbRule ? parseFloat(dbRule.cgstRatePercent) : defaultRule.cgst;
          sgstRatePercent = dbRule ? parseFloat(dbRule.sgstRatePercent) : defaultRule.sgst;
          cgstAmount = Math.round((taxableAmount * cgstRatePercent / 100) * 100) / 100;
          sgstAmount = Math.round((taxableAmount * sgstRatePercent / 100) * 100) / 100;
        }
      }

      const itemTax = isInterstate ? igstAmount : Math.round((cgstAmount + sgstAmount) * 100) / 100;
      const netAmount = Math.round((taxableAmount + itemTax) * 100) / 100;

      subtotal += grossAmount;
      discountTotal += discountAmount;
      taxableTotal += taxableAmount;
      cgstTotal += cgstAmount;
      sgstTotal += sgstAmount;
      igstTotal += igstAmount;
      taxTotal += itemTax;

      return {
        serviceName: item.serviceName || 'Healthcare Service',
        category,
        quantity: qty,
        unitPrice,
        grossAmount,
        discountAmount,
        taxableAmount,
        cgstRatePercent,
        sgstRatePercent,
        igstRatePercent,
        cgstAmount,
        sgstAmount,
        igstAmount,
        taxAmount: itemTax,
        netAmount,
        hsnSacCode,
        isExempt
      };
    });

    subtotal = Math.round(subtotal * 100) / 100;
    discountTotal = Math.round(discountTotal * 100) / 100;
    taxableTotal = Math.round(taxableTotal * 100) / 100;
    cgstTotal = Math.round(cgstTotal * 100) / 100;
    sgstTotal = Math.round(sgstTotal * 100) / 100;
    igstTotal = Math.round(igstTotal * 100) / 100;
    taxTotal = Math.round(taxTotal * 100) / 100;
    const grandTotal = Math.round((taxableTotal + taxTotal) * 100) / 100;

    return {
      items: calculatedItems,
      subtotal,
      discountTotal,
      taxableTotal,
      cgstTotal,
      sgstTotal,
      igstTotal,
      taxTotal,
      grandTotal,
      totalAmount: grandTotal,
      isInterstate
    };
  }
}

export const taxEngineService = new TaxEngineService();
