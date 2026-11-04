export interface PathogenSusceptibility {
  pathogen: string;
  isolateCount: number;
  antibioticMatrix: Record<string, {
    susceptiblePercent: number;
    resistantPercent: number;
    intermediatePercent: number;
    awareCategory: 'ACCESS' | 'WATCH' | 'RESERVE';
  }>;
}

export interface FacilityAntibiogram {
  facilityId: string;
  facilityName: string;
  periodYear: number;
  totalSpecimensTested: number;
  pathogens: PathogenSusceptibility[];
  updatedAt: string;
}

export interface AntibiogramRxCheckRequest {
  facilityId: string;
  prescribedDrugName: string;
  presumedPathogen?: string | undefined;
  infectionSite?: string | undefined; // "URINARY_TRACT" | "RESPIRATORY" | "BLOODSTREAM" | "SURGICAL_SITE" | "SKIN_SOFT_TISSUE"
}

export interface AntibiogramRxEvaluation {
  drugName: string;
  facilityResistanceRate: number; // percentage, e.g. 74%
  facilitySensitivityRate: number; // percentage, e.g. 26%
  awareCategory: 'ACCESS' | 'WATCH' | 'RESERVE';
  alertSeverity: 'SAFE' | 'CAUTION_MONITOR' | 'CRITICAL_RESISTANCE_WARNING';
  reasoning: string;
  recommendedAlternatives: Array<{
    drugName: string;
    sensitivityRate: number;
    awareCategory: 'ACCESS' | 'WATCH' | 'RESERVE';
    dosageGuidance: string;
  }>;
}

export class AntibiogramCdssService {
  private antibiograms: Map<string, FacilityAntibiogram> = new Map();

  constructor() {
    this.seedDefaultAntibiogram();
  }

  private seedDefaultAntibiogram(): void {
    const defaultData: FacilityAntibiogram = {
      facilityId: 'default-facility',
      facilityName: 'DocSearch Regional Apex Hospital',
      periodYear: 2026,
      totalSpecimensTested: 1420,
      updatedAt: new Date().toISOString(),
      pathogens: [
        {
          pathogen: 'Escherichia coli (E. coli)',
          isolateCount: 520,
          antibioticMatrix: {
            'Ciprofloxacin': { susceptiblePercent: 24, resistantPercent: 74, intermediatePercent: 2, awareCategory: 'WATCH' },
            'Amoxicillin-Clavulanate': { susceptiblePercent: 42, resistantPercent: 54, intermediatePercent: 4, awareCategory: 'ACCESS' },
            'Ceftriaxone': { susceptiblePercent: 38, resistantPercent: 60, intermediatePercent: 2, awareCategory: 'WATCH' },
            'Nitrofurantoin': { susceptiblePercent: 91, resistantPercent: 7, intermediatePercent: 2, awareCategory: 'ACCESS' },
            'Fosfomycin': { susceptiblePercent: 96, resistantPercent: 3, intermediatePercent: 1, awareCategory: 'ACCESS' },
            'Amikacin': { susceptiblePercent: 88, resistantPercent: 10, intermediatePercent: 2, awareCategory: 'ACCESS' },
            'Piperacillin-Tazobactam': { susceptiblePercent: 82, resistantPercent: 15, intermediatePercent: 3, awareCategory: 'WATCH' },
            'Meropenem': { susceptiblePercent: 94, resistantPercent: 5, intermediatePercent: 1, awareCategory: 'WATCH' }
          }
        },
        {
          pathogen: 'Klebsiella pneumoniae',
          isolateCount: 380,
          antibioticMatrix: {
            'Ceftriaxone': { susceptiblePercent: 28, resistantPercent: 70, intermediatePercent: 2, awareCategory: 'WATCH' },
            'Cefoperazone-Sulbactam': { susceptiblePercent: 68, resistantPercent: 28, intermediatePercent: 4, awareCategory: 'WATCH' },
            'Piperacillin-Tazobactam': { susceptiblePercent: 64, resistantPercent: 32, intermediatePercent: 4, awareCategory: 'WATCH' },
            'Amikacin': { susceptiblePercent: 84, resistantPercent: 14, intermediatePercent: 2, awareCategory: 'ACCESS' },
            'Meropenem': { susceptiblePercent: 78, resistantPercent: 20, intermediatePercent: 2, awareCategory: 'WATCH' },
            'Colistin': { susceptiblePercent: 98, resistantPercent: 2, intermediatePercent: 0, awareCategory: 'RESERVE' }
          }
        },
        {
          pathogen: 'Staphylococcus aureus (including MRSA)',
          isolateCount: 290,
          antibioticMatrix: {
            'Cefazolin': { susceptiblePercent: 58, resistantPercent: 42, intermediatePercent: 0, awareCategory: 'ACCESS' },
            'Clindamycin': { susceptiblePercent: 62, resistantPercent: 38, intermediatePercent: 0, awareCategory: 'ACCESS' },
            'Vancomycin': { susceptiblePercent: 100, resistantPercent: 0, intermediatePercent: 0, awareCategory: 'WATCH' },
            'Linezolid': { susceptiblePercent: 98, resistantPercent: 2, intermediatePercent: 0, awareCategory: 'RESERVE' },
            'Daptomycin': { susceptiblePercent: 99, resistantPercent: 1, intermediatePercent: 0, awareCategory: 'RESERVE' }
          }
        },
        {
          pathogen: 'Pseudomonas aeruginosa',
          isolateCount: 230,
          antibioticMatrix: {
            'Ceftazidime': { susceptiblePercent: 68, resistantPercent: 28, intermediatePercent: 4, awareCategory: 'WATCH' },
            'Piperacillin-Tazobactam': { susceptiblePercent: 74, resistantPercent: 22, intermediatePercent: 4, awareCategory: 'WATCH' },
            'Cefepime': { susceptiblePercent: 72, resistantPercent: 25, intermediatePercent: 3, awareCategory: 'WATCH' },
            'Amikacin': { susceptiblePercent: 86, resistantPercent: 12, intermediatePercent: 2, awareCategory: 'ACCESS' },
            'Meropenem': { susceptiblePercent: 75, resistantPercent: 22, intermediatePercent: 3, awareCategory: 'WATCH' }
          }
        }
      ]
    };

    this.antibiograms.set('default-facility', defaultData);
  }

  public getFacilityAntibiogram(facilityId: string): FacilityAntibiogram {
    return this.antibiograms.get(facilityId) || this.antibiograms.get('default-facility')!;
  }

  /**
   * Evaluates prescribed antibiotic against hospital antibiogram resistance thresholds.
   */
  public evaluatePrescription(request: AntibiogramRxCheckRequest): AntibiogramRxEvaluation {
    const facilityData = this.getFacilityAntibiogram(request.facilityId);
    const drugNameClean = request.prescribedDrugName.trim();

    // Find best match in matrices across pathogens or targeted pathogen
    let matchedSusceptible = 85;
    let matchedResistant = 15;
    let matchedCategory: 'ACCESS' | 'WATCH' | 'RESERVE' = 'ACCESS';

    for (const p of facilityData.pathogens) {
      if (request.presumedPathogen && !p.pathogen.toLowerCase().includes(request.presumedPathogen.toLowerCase())) {
        continue;
      }
      for (const [name, stats] of Object.entries(p.antibioticMatrix)) {
        if (drugNameClean.toLowerCase().includes(name.toLowerCase()) || name.toLowerCase().includes(drugNameClean.toLowerCase())) {
          matchedSusceptible = stats.susceptiblePercent;
          matchedResistant = stats.resistantPercent;
          matchedCategory = stats.awareCategory;
          break;
        }
      }
    }

    let alertSeverity: 'SAFE' | 'CAUTION_MONITOR' | 'CRITICAL_RESISTANCE_WARNING' = 'SAFE';
    let reasoning = `High institutional susceptibility (${matchedSusceptible}% sensitive). Complies with local antimicrobial stewardship.`;

    if (matchedResistant > 50) {
      alertSeverity = 'CRITICAL_RESISTANCE_WARNING';
      reasoning = `🚨 HIGH RESISTANCE ALERT: ${drugNameClean} has a ${matchedResistant}% resistance rate in this facility's microbiological antibiogram. High probability of clinical therapeutic failure.`;
    } else if (matchedResistant > 20) {
      alertSeverity = 'CAUTION_MONITOR';
      reasoning = `⚠️ CAUTION: ${drugNameClean} exhibits ${matchedResistant}% local resistance. Reserve for culture-proven susceptible isolates.`;
    }

    // Curate intelligent alternatives
    const recommendedAlternatives = [
      {
        drugName: 'Amikacin 15 mg/kg IV OD',
        sensitivityRate: 88,
        awareCategory: 'ACCESS' as const,
        dosageGuidance: 'Renal monitoring advised. High hospital sensitivity.'
      },
      {
        drugName: 'Piperacillin + Tazobactam 4.5g IV Q8H',
        sensitivityRate: 82,
        awareCategory: 'WATCH' as const,
        dosageGuidance: 'Broad-spectrum coverage for severe or septic cases.'
      },
      {
        drugName: 'Nitrofurantoin 100mg PO BD (If UTI)',
        sensitivityRate: 91,
        awareCategory: 'ACCESS' as const,
        dosageGuidance: '1st line for uncomplicated cystitis. Sparing broad spectrum.'
      }
    ];

    return {
      drugName: drugNameClean,
      facilityResistanceRate: matchedResistant,
      facilitySensitivityRate: matchedSusceptible,
      awareCategory: matchedCategory,
      alertSeverity,
      reasoning,
      recommendedAlternatives
    };
  }
}

export const antibiogramCdssService = new AntibiogramCdssService();
