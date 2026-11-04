export interface VitalSignSnapshot {
  systolicBp: number;
  diastolicBp: number;
  respiratoryRate: number; // breaths per min
  pulseBpm: number;
  oxygenSaturationPercent: number; // SpO2 %
  temperatureCelsius: number;
  gcsScore?: number | undefined; // Glasgow Coma Scale (3-15)
  alteredMentation?: boolean | undefined;
  capillaryRefillSeconds?: number | undefined;
  recordedAt?: string | undefined;
}

export interface SepsisAssessmentRequest {
  patientId: string;
  uhid: string;
  ageYears: number;
  isPediatric?: boolean | undefined;
  bedId?: string | undefined;
  wardName?: string | undefined;
  vitals: VitalSignSnapshot;
  lactateMmolL?: number | undefined;
  whiteBloodCellCount?: number | undefined;
  presumedInfectionSource?: string | undefined; // e.g. "Pneumonia", "UTI", "Intra-abdominal", "Post-op Wound"
}

export interface SepsisBundleItem {
  id: string;
  title: string;
  description: string;
  targetWindowMinutes: number;
  isCompleted: boolean;
  priority: 'STAT_CRITICAL' | 'HIGH' | 'ROUTINE';
}

export interface SepsisDeteriorationResult {
  patientId: string;
  uhid: string;
  ageYears: number;
  alertLevel: 'NORMAL' | 'WATCHLIST' | 'ELEVATED' | 'CRITICAL_SEPSIS_CODE';
  scoreType: 'qSOFA' | 'PEWS';
  scoreValue: number;
  maxScore: number;
  triggers: string[];
  recommendation: string;
  deteriorationTrend: 'STABLE' | 'DETERIORATING' | 'IMPROVING';
  oneHourBundle: SepsisBundleItem[];
  evaluatedAt: string;
}

export class SepsisDeteriorationSentinelService {
  /**
   * Evaluates patient vitals using qSOFA (Adults >= 18) or PEWS (Pediatrics < 18)
   * Implements Surviving Sepsis Campaign 1-Hour Bundle Protocols.
   */
  public evaluatePatientRisk(request: SepsisAssessmentRequest): SepsisDeteriorationResult {
    const isPediatric = request.isPediatric ?? (request.ageYears < 18);
    const vitals = request.vitals;
    const triggers: string[] = [];

    let scoreValue = 0;
    let maxScore = 3;
    let scoreType: 'qSOFA' | 'PEWS' = 'qSOFA';

    if (isPediatric) {
      scoreType = 'PEWS';
      maxScore = 9;

      // Behavior / Neurological (0 - 3)
      if (vitals.alteredMentation || (vitals.gcsScore !== undefined && vitals.gcsScore < 12)) {
        scoreValue += 3;
        triggers.push('PEWS: Lethargic / Comatose or GCS < 12 (+3)');
      } else if (vitals.gcsScore !== undefined && vitals.gcsScore <= 14) {
        scoreValue += 2;
        triggers.push('PEWS: Irritable / confused or GCS 13-14 (+2)');
      }

      // Cardiovascular (0 - 3)
      if (vitals.pulseBpm >= 160 || (vitals.capillaryRefillSeconds && vitals.capillaryRefillSeconds >= 4)) {
        scoreValue += 3;
        triggers.push('PEWS: Severe Tachycardia (Pulse >= 160 bpm) or Cap Refill >= 4s (+3)');
      } else if (vitals.pulseBpm >= 140 || (vitals.capillaryRefillSeconds && vitals.capillaryRefillSeconds >= 3)) {
        scoreValue += 2;
        triggers.push('PEWS: Tachycardia (Pulse >= 140 bpm) or Cap Refill >= 3s (+2)');
      } else if (vitals.pulseBpm >= 120) {
        scoreValue += 1;
        triggers.push('PEWS: Mild Tachycardia (+1)');
      }

      // Respiratory (0 - 3)
      if (vitals.respiratoryRate >= 50 || vitals.oxygenSaturationPercent < 90) {
        scoreValue += 3;
        triggers.push('PEWS: Severe Tachypnea (RR >= 50) or SpO2 < 90% (+3)');
      } else if (vitals.respiratoryRate >= 40 || vitals.oxygenSaturationPercent < 94) {
        scoreValue += 2;
        triggers.push('PEWS: Tachypnea (RR >= 40) or SpO2 < 94% (+2)');
      } else if (vitals.respiratoryRate >= 30) {
        scoreValue += 1;
        triggers.push('PEWS: Mild Tachypnea (RR >= 30) (+1)');
      }
    } else {
      // Adult qSOFA (Quick Sepsis-related Organ Failure Assessment)
      scoreType = 'qSOFA';
      maxScore = 3;

      // 1. Tachypnea: Respiratory Rate >= 22 breaths/min
      if (vitals.respiratoryRate >= 22) {
        scoreValue += 1;
        triggers.push(`qSOFA: Respiratory Rate elevated (${vitals.respiratoryRate} bpm >= 22) (+1)`);
      }

      // 2. Hypotension: Systolic Blood Pressure <= 100 mmHg
      if (vitals.systolicBp <= 100) {
        scoreValue += 1;
        triggers.push(`qSOFA: Systolic Blood Pressure depressed (${vitals.systolicBp} mmHg <= 100) (+1)`);
      }

      // 3. Altered Mentation: GCS < 15 or altered mentation flag
      if (vitals.alteredMentation || (vitals.gcsScore !== undefined && vitals.gcsScore < 15)) {
        scoreValue += 1;
        triggers.push(`qSOFA: Altered Mentation / Acute Neurologic Change (GCS ${vitals.gcsScore ?? '<15'}) (+1)`);
      }
    }

    // Determine Alert Level & Resuscitation Bundle
    let alertLevel: 'NORMAL' | 'WATCHLIST' | 'ELEVATED' | 'CRITICAL_SEPSIS_CODE' = 'NORMAL';
    let recommendation = 'Patient vitals stable. Continue standard routine telemetry.';
    let deteriorationTrend: 'STABLE' | 'DETERIORATING' | 'IMPROVING' = 'STABLE';

    if (scoreType === 'qSOFA') {
      if (scoreValue >= 2) {
        alertLevel = 'CRITICAL_SEPSIS_CODE';
        recommendation = '🚨 CRITICAL SEPSIS ALERT (qSOFA >= 2): Activate Rapid Response Team (RRT) & Execute Surviving Sepsis 1-Hour Bundle immediately.';
        deteriorationTrend = 'DETERIORATING';
      } else if (scoreValue === 1) {
        alertLevel = 'WATCHLIST';
        recommendation = '⚠️ Elevated risk. Repeat vitals every 30 minutes, calculate full SOFA score and monitor lactate.';
        deteriorationTrend = 'DETERIORATING';
      }
    } else {
      // PEWS
      if (scoreValue >= 4) {
        alertLevel = 'CRITICAL_SEPSIS_CODE';
        recommendation = '🚨 PEDIATRIC EMERGENCY ALERT (PEWS >= 4): Immediate PICU consult, oxygen delivery, and IV fluid resuscitation.';
        deteriorationTrend = 'DETERIORATING';
      } else if (scoreValue >= 2) {
        alertLevel = 'ELEVATED';
        recommendation = '⚠️ Moderate Pediatric Warning (PEWS 2-3): Notify pediatric registrar; reassess vitals in 60 min.';
        deteriorationTrend = 'DETERIORATING';
      }
    }

    // Surviving Sepsis Campaign 1-Hour Bundle Protocol
    const oneHourBundle: SepsisBundleItem[] = [
      {
        id: 'BUNDLE_LACTATE',
        title: 'Measure Serum Lactate STAT',
        description: 'Re-measure within 2-4 hours if initial lactate > 2.0 mmol/L to assess clearance.',
        targetWindowMinutes: 30,
        isCompleted: request.lactateMmolL !== undefined && request.lactateMmolL > 0,
        priority: 'STAT_CRITICAL'
      },
      {
        id: 'BUNDLE_BLOOD_CULTURES',
        title: 'Obtain Blood Cultures (2 Sets)',
        description: 'Collect aerobic & anaerobic peripheral sets prior to starting antimicrobials without delaying Rx.',
        targetWindowMinutes: 45,
        isCompleted: false,
        priority: 'STAT_CRITICAL'
      },
      {
        id: 'BUNDLE_BROAD_SPECTRUM_ABX',
        title: 'Administer Empiric IV Antibiotics',
        description: 'Order facility antibiogram-directed broad-spectrum coverage (e.g. Piperacillin-Tazobactam or Meropenem).',
        targetWindowMinutes: 60,
        isCompleted: false,
        priority: 'STAT_CRITICAL'
      },
      {
        id: 'BUNDLE_FLUID_BOLUS',
        title: 'Rapid Fluid Resuscitation (30 mL/kg)',
        description: 'Administer balanced crystalloids (Plasma-Lyte / Ringer Lactate) for hypotension or Lactate >= 4.0 mmol/L.',
        targetWindowMinutes: 60,
        isCompleted: false,
        priority: alertLevel === 'CRITICAL_SEPSIS_CODE' ? 'STAT_CRITICAL' : 'HIGH'
      },
      {
        id: 'BUNDLE_VASOPRESSORS',
        title: 'Vasopressor Support for MAP >= 65 mmHg',
        description: 'Titrate Noradrenaline (Norepinephrine) if MAP remains < 65 mmHg post fluid bolus.',
        targetWindowMinutes: 60,
        isCompleted: false,
        priority: vitals.systolicBp < 90 ? 'STAT_CRITICAL' : 'ROUTINE'
      }
    ];

    return {
      patientId: request.patientId,
      uhid: request.uhid,
      ageYears: request.ageYears,
      alertLevel,
      scoreType,
      scoreValue,
      maxScore,
      triggers,
      recommendation,
      deteriorationTrend,
      oneHourBundle,
      evaluatedAt: new Date().toISOString()
    };
  }

  /**
   * Retrieves active deterioration radar telemetry for an inpatient / OPD encounter
   */
  public getPatientDeteriorationRadar(patientId: string, uhid: string = 'UHID-2026-102'): SepsisDeteriorationResult {
    // Generate synthetic baseline with current timestamp
    return this.evaluatePatientRisk({
      patientId,
      uhid,
      ageYears: 54,
      isPediatric: false,
      bedId: 'ICU-BED-04',
      wardName: 'Medical Intensive Care Unit',
      vitals: {
        systolicBp: 96,
        diastolicBp: 58,
        respiratoryRate: 24,
        pulseBpm: 108,
        oxygenSaturationPercent: 93,
        temperatureCelsius: 38.9,
        alteredMentation: true,
        gcsScore: 14,
        capillaryRefillSeconds: 3,
        recordedAt: new Date().toISOString()
      },
      lactateMmolL: 2.8,
      presumedInfectionSource: 'Community-Acquired Severe Pneumonia'
    });
  }
}

export const sepsisDeteriorationSentinelService = new SepsisDeteriorationSentinelService();
