import type {
  DynamicOfferDto,
  DynamicPricingCalculationDto,
  DynamicPricingRequestDto,
  PricingLineItemDto
} from '@docsearch/api-contracts';
import { RuleEngine } from './rule-engine.js';
import * as crypto from 'crypto';

export interface PlanConfig {
  code: string;
  name: string;
  version: number;
  currency: string;
  baseMonthlyPriceInr: number;
  baseAnnualPriceInr: number;
  includedDoctorSeats: number;
  additionalSeatPriceInr: number;
  includedBranches: number;
  additionalBranchPriceInr: number;
  taxRatePercent: number;
}

export interface AddonModuleConfig {
  code: string;
  name: string;
  priceInr: number;
  billingType: 'PER_MONTH' | 'PER_UNIT' | 'ONE_TIME';
}

export class PricingEngine {
  /**
   * Evaluates and calculates dynamic pricing with server-side offer validation.
   */
  public static calculatePrice(
    request: DynamicPricingRequestDto,
    planConfig: PlanConfig,
    availableAddons: AddonModuleConfig[] = [],
    availableOffers: DynamicOfferDto[] = []
  ): DynamicPricingCalculationDto {
    const isAnnual = request.billingFrequency === 'ANNUAL';
    const basePrice = isAnnual ? planConfig.baseAnnualPriceInr : planConfig.baseMonthlyPriceInr;

    const lineItems: PricingLineItemDto[] = [
      {
        code: planConfig.code,
        name: `${planConfig.name} (${request.billingFrequency})`,
        type: 'BASE_PLAN',
        unitPrice: basePrice,
        quantity: 1,
        totalPrice: basePrice
      }
    ];

    // Calculate additional doctor seats
    const totalSeats = request.doctorSeats || planConfig.includedDoctorSeats;
    const extraSeats = Math.max(0, totalSeats - planConfig.includedDoctorSeats);
    if (extraSeats > 0) {
      const seatTotal = extraSeats * planConfig.additionalSeatPriceInr * (isAnnual ? 12 : 1);
      lineItems.push({
        code: 'ADDON_EXTRA_SEATS',
        name: `Additional Doctor Seats (${extraSeats} seats)`,
        type: 'SEAT_ADDON',
        unitPrice: planConfig.additionalSeatPriceInr * (isAnnual ? 12 : 1),
        quantity: extraSeats,
        totalPrice: seatTotal
      });
    }

    // Calculate additional branches
    const totalBranches = request.branchCount || planConfig.includedBranches;
    const extraBranches = Math.max(0, totalBranches - planConfig.includedBranches);
    if (extraBranches > 0) {
      const branchTotal = extraBranches * planConfig.additionalBranchPriceInr * (isAnnual ? 12 : 1);
      lineItems.push({
        code: 'ADDON_EXTRA_BRANCHES',
        name: `Additional Branch Units (${extraBranches} units)`,
        type: 'BRANCH_ADDON',
        unitPrice: planConfig.additionalBranchPriceInr * (isAnnual ? 12 : 1),
        quantity: extraBranches,
        totalPrice: branchTotal
      });
    }

    // Selected clinical addons
    let addonsTotal = 0;
    for (const addonCode of request.selectedAddonCodes || []) {
      const addon = availableAddons.find((a) => a.code === addonCode);
      if (addon) {
        const addonPrice = addon.billingType === 'PER_MONTH' && isAnnual ? addon.priceInr * 12 : addon.priceInr;
        addonsTotal += addonPrice;
        lineItems.push({
          code: addon.code,
          name: addon.name,
          type: 'CLINICAL_ADDON',
          unitPrice: addonPrice,
          quantity: 1,
          totalPrice: addonPrice
        });
      }
    }

    const subtotal = lineItems.reduce((acc, item) => acc + item.totalPrice, 0);

    // Dynamic Offer Evaluation
    let appliedOffer: DynamicPricingCalculationDto['appliedOffer'] | undefined;
    let discountTotal = 0;

    if (request.couponOfferCode) {
      const offer = availableOffers.find(
        (o) => o.code.toUpperCase() === request.couponOfferCode?.toUpperCase() && o.status === 'ACTIVE'
      );

      if (offer) {
        const currentDate = new Date().toISOString().slice(0, 10);
        const isDateValid = currentDate >= offer.validFrom && currentDate <= offer.validUntil;

        // Build evaluation context
        const evalContext = {
          customer: request.customerContext || {},
          plan: {
            code: planConfig.code,
            frequency: request.billingFrequency,
            subtotal
          },
          organization: {
            type: request.organizationType,
            branches: totalBranches,
            seats: totalSeats
          },
          currentDate
        };

        const isEligible = isDateValid && RuleEngine.evaluateExpression(offer.eligibilityRule, evalContext);

        if (isEligible) {
          if (offer.discountType === 'PERCENTAGE') {
            discountTotal = Math.round((subtotal * offer.discountValue) / 100);
          } else {
            discountTotal = Math.min(subtotal, offer.discountValue);
          }

          appliedOffer = {
            offerCode: offer.code,
            offerName: offer.name,
            discountAmount: discountTotal,
            ruleDescription: offer.description
          };

          lineItems.push({
            code: offer.code,
            name: `Offer Discount: ${offer.name}`,
            type: 'DISCOUNT',
            unitPrice: -discountTotal,
            quantity: 1,
            totalPrice: -discountTotal
          });
        }
      }
    }

    const taxableAmount = Math.max(0, subtotal - discountTotal);
    const taxRatePercent = planConfig.taxRatePercent;
    const taxAmount = Math.round((taxableAmount * taxRatePercent) / 100);
    const finalGrandTotal = taxableAmount + taxAmount;

    lineItems.push({
      code: 'TAX_GST',
      name: `Goods & Services Tax (GST ${taxRatePercent}%)`,
      type: 'TAX',
      unitPrice: taxAmount,
      quantity: 1,
      totalPrice: taxAmount
    });

    const calculatedAt = new Date().toISOString();
    const hashPayload = JSON.stringify({
      calculatedAt,
      planCode: planConfig.code,
      planVersion: planConfig.version,
      subtotal,
      discountTotal,
      finalGrandTotal,
      lineItems
    });

    const immutableSnapshotHash = crypto.createHash('sha256').update(hashPayload).digest('hex');

    return {
      id: `PRC-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`,
      calculatedAt,
      planCode: planConfig.code,
      planVersion: planConfig.version,
      currency: planConfig.currency,
      basePrice,
      addonsTotal,
      subtotal,
      appliedOffer,
      discountTotal,
      taxableAmount,
      taxRatePercent,
      taxAmount,
      finalGrandTotal,
      lineItems,
      immutableSnapshotHash
    };
  }
}
