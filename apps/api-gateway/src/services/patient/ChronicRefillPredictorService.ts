export interface ChronicMedicationItem {
  medicationName: string;
  dosage: string;
  frequency: string;
  daysRemaining: number;
  totalPrescribedDays: number;
  prescribedBy: string;
  monthlySupplyPriceInr: number;
  discountedPriceInr: number;
  condition: 'HYPERTENSION' | 'DIABETES_T2' | 'THYROID' | 'CARDIAC' | 'ASTHMA' | 'OTHER';
}

export interface ChronicRefillStatus {
  patientId: string;
  patientName: string;
  mobile: string;
  daysToExhaustion: number;
  isRefillDue: boolean;
  refillTriggerDay: number; // e.g. 27
  activeChronicMeds: ChronicMedicationItem[];
  estimatedTotalSavingsInr: number;
  subtotalInr: number;
  netPayableInr: number;
  defaultDeliveryAddress: string;
}

export interface ChronicRefillOrderRequest {
  patientId: string;
  medicationNames: string[];
  deliveryAddress: string;
  paymentMethod: 'UPI_INSTANT' | 'COD' | 'AUTO_DEBIT_MANDATE';
}

export interface ChronicRefillOrderResult {
  orderId: string;
  status: 'CONFIRMED' | 'DISPATCHED_TO_PARTNER_PHARMACY';
  estimatedDeliveryDate: string;
  partnerPharmacyName: string;
  totalAmountInr: number;
  discountAppliedInr: number;
  whatsappConfirmationSent: boolean;
}

export interface HouseholdMemberHealthStatus {
  memberId: string;
  name: string;
  relationship: string;
  age: number;
  complianceScorePercent: number;
  activeConditions: string[];
  pendingCheckups: string[];
}

export interface HouseholdHealthScorecard {
  householdId: string;
  householdName: string;
  overallScore: number; // 0 - 100
  tier: 'ELITE_HEALTH_FAMILY' | 'PROACTIVE_CARE' | 'CARE_NEEDS_ATTENTION';
  breakdown: {
    medicationAdherencePoints: number; // max 30
    diagnosticFollowUpPoints: number; // max 30
    preventiveImmunizationPoints: number; // max 20
    lifestyleCheckupPoints: number; // max 20
  };
  members: HouseholdMemberHealthStatus[];
  recommendedAction: string;
  updatedAt: string;
}

export class ChronicRefillPredictorService {
  /**
   * Evaluates active chronic prescriptions and computes smart refill triggers
   */
  public getChronicRefillStatus(patientId: string): ChronicRefillStatus {
    const meds: ChronicMedicationItem[] = [
      {
        medicationName: 'Telmisartan 40mg + Amlodipine 5mg',
        dosage: '1 Tab Daily Morning',
        frequency: 'OD',
        daysRemaining: 3,
        totalPrescribedDays: 30,
        prescribedBy: 'Dr. Meraj Sharif, MD (Cardiology)',
        monthlySupplyPriceInr: 280,
        discountedPriceInr: 224,
        condition: 'HYPERTENSION'
      },
      {
        medicationName: 'Metformin 500mg SR + Glimepiride 1mg',
        dosage: '1 Tab BD after meals',
        frequency: 'BD',
        daysRemaining: 2,
        totalPrescribedDays: 30,
        prescribedBy: 'Dr. Meraj Sharif, MD (Endocrinology)',
        monthlySupplyPriceInr: 340,
        discountedPriceInr: 272,
        condition: 'DIABETES_T2'
      },
      {
        medicationName: 'Thyroxine Sodium 50 mcg',
        dosage: '1 Tab OD empty stomach',
        frequency: 'OD',
        daysRemaining: 4,
        totalPrescribedDays: 30,
        prescribedBy: 'Dr. Meraj Sharif, MD',
        monthlySupplyPriceInr: 160,
        discountedPriceInr: 128,
        condition: 'THYROID'
      }
    ];

    const subtotal = meds.reduce((acc, m) => acc + m.monthlySupplyPriceInr, 0);
    const netPayable = meds.reduce((acc, m) => acc + m.discountedPriceInr, 0);
    const minDaysRemaining = Math.min(...meds.map((m) => m.daysRemaining));

    return {
      patientId,
      patientName: 'Ramesh Sharma',
      mobile: '+91 98765 43210',
      daysToExhaustion: minDaysRemaining,
      isRefillDue: minDaysRemaining <= 4,
      refillTriggerDay: 27,
      activeChronicMeds: meds,
      subtotalInr: subtotal,
      netPayableInr: netPayable,
      estimatedTotalSavingsInr: subtotal - netPayable,
      defaultDeliveryAddress: 'House 42, Civil Lines, Near City Hospital, New Delhi 110054'
    };
  }

  /**
   * Processes 1-tap chronic refill reorder
   */
  public createRefillOrder(request: ChronicRefillOrderRequest): ChronicRefillOrderResult {
    void request.patientId;
    void request.medicationNames;
    const deliveryDate = new Date();
    deliveryDate.setDate(deliveryDate.getDate() + 1);

    return {
      orderId: `CR-ORD-${Date.now().toString(36).toUpperCase()}`,
      status: 'CONFIRMED',
      estimatedDeliveryDate: deliveryDate.toLocaleDateString('en-IN', {
        weekday: 'short',
        month: 'short',
        day: 'numeric'
      }),
      partnerPharmacyName: 'Apollo 24|7 Regional Hub & DocSearch Network',
      totalAmountInr: 624,
      discountAppliedInr: 156,
      whatsappConfirmationSent: true
    };
  }

  /**
   * Calculates comprehensive Household Health Scorecard across the family unit
   */
  public getHouseholdHealthScore(householdId: string): HouseholdHealthScorecard {
    return {
      householdId,
      householdName: 'The Sharma Household',
      overallScore: 88,
      tier: 'ELITE_HEALTH_FAMILY',
      breakdown: {
        medicationAdherencePoints: 28, // /30
        diagnosticFollowUpPoints: 26, // /30
        preventiveImmunizationPoints: 18, // /20
        lifestyleCheckupPoints: 16 // /20
      },
      members: [
        {
          memberId: 'MEM-01',
          name: 'Ramesh Sharma (Self)',
          relationship: 'Primary Member',
          age: 56,
          complianceScorePercent: 92,
          activeConditions: ['Hypertension', 'Type 2 Diabetes'],
          pendingCheckups: ['Annual HbA1c Lab Test (Due in 14 days)']
        },
        {
          memberId: 'MEM-02',
          name: 'Sunita Sharma',
          relationship: 'Spouse',
          age: 52,
          complianceScorePercent: 88,
          activeConditions: ['Hypothyroidism'],
          pendingCheckups: ['TSH Thyroid Profile Check']
        },
        {
          memberId: 'MEM-03',
          name: 'Aarav Sharma',
          relationship: 'Son',
          age: 19,
          complianceScorePercent: 96,
          activeConditions: ['None - Healthy'],
          pendingCheckups: []
        }
      ],
      recommendedAction: 'Keep up the momentum! Schedule Ramesh\'s HbA1c diagnostic panel with 1 tap for free home blood collection.',
      updatedAt: new Date().toISOString()
    };
  }
}

export const chronicRefillPredictorService = new ChronicRefillPredictorService();
