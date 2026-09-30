import { AppError } from '../errors/app-error.js';
import { ErrorCode } from '../errors/error-codes.js';
import {
  type ClinicalSafetyStatus,
  type ClinicalSafetyFlag,
  type ClinicalExtractedEntity,
  type ClinicalSafetyReport,
  type ClinicalValidationOptions,
  type ClinicalVitalBounds
} from './clinical-safety-types.js';
import {
  matchFormularyMedicine
} from './formulary-reference.js';

export interface AllergyCheckParams {
  patientAllergies: string[];
  itemIngredients: string[];
  containsGluten?: boolean;
}

export interface NpoCheckParams {
  isNpoActive: boolean;
  orderType: string;
}

export interface DietRestrictionParams {
  patientTherapeuticDiets: string[];
  mealDietCategory: string;
}

/**
 * Standard Physiological Vital Sign Bounds
 */
export const PHYSIOLOGICAL_VITAL_BOUNDS: Record<string, ClinicalVitalBounds> = {
  SPO2: { min: 70, max: 100, criticalLow: 85, criticalHigh: 100, unit: '%', name: 'Oxygen Saturation (SpO2)' },
  BP_SYSTOLIC: { min: 60, max: 260, criticalLow: 80, criticalHigh: 200, unit: 'mmHg', name: 'Systolic Blood Pressure' },
  BP_DIASTOLIC: { min: 30, max: 150, criticalLow: 50, criticalHigh: 120, unit: 'mmHg', name: 'Diastolic Blood Pressure' },
  HEART_RATE: { min: 30, max: 250, criticalLow: 40, criticalHigh: 180, unit: 'bpm', name: 'Heart Rate / Pulse' },
  TEMPERATURE_F: { min: 92, max: 108, criticalLow: 95, criticalHigh: 104, unit: '°F', name: 'Body Temperature (Fahrenheit)' },
  TEMPERATURE_C: { min: 33, max: 42.5, criticalLow: 35, criticalHigh: 40, unit: '°C', name: 'Body Temperature (Celsius)' },
  RESPIRATORY_RATE: { min: 8, max: 60, criticalLow: 10, criticalHigh: 40, unit: '/min', name: 'Respiratory Rate' },
  BLOOD_GLUCOSE: { min: 25, max: 800, criticalLow: 50, criticalHigh: 450, unit: 'mg/dL', name: 'Blood Glucose' }
};

export class ClinicalSafetyService {
  // =========================================================================
  // EXISTING CHECKS (PRESERVED)
  // =========================================================================

  static checkAllergy(params: AllergyCheckParams): void {
    const { patientAllergies, itemIngredients, containsGluten } = params;

    if (containsGluten && patientAllergies.map((a) => a.toUpperCase()).includes('GLUTEN')) {
      throw new AppError({
        message: 'Clinical Safety Violation: Patient is allergic to GLUTEN. Meal contains gluten-based ingredients.',
        code: ErrorCode.BAD_REQUEST,
        statusCode: 400
      });
    }

    for (const allergy of patientAllergies) {
      if (itemIngredients.map((i) => i.toLowerCase()).includes(allergy.toLowerCase())) {
        throw new AppError({
          message: `Clinical Safety Violation: Incompatible allergen detected (${allergy}) for patient.`,
          code: ErrorCode.BAD_REQUEST,
          statusCode: 400
        });
      }
    }
  }

  static checkNPO(params: NpoCheckParams): void {
    if (params.isNpoActive) {
      throw new AppError({
        message:
          'Clinical Safety Violation: Patient is currently on active NPO (Nil Per Os - Nothing by mouth). Oral meal dispatch is strictly prohibited.',
        code: ErrorCode.BAD_REQUEST,
        statusCode: 400
      });
    }
  }

  static checkDietRestriction(params: DietRestrictionParams): void {
    if (
      params.patientTherapeuticDiets.includes('RENAL_LOW_SODIUM') &&
      params.mealDietCategory === 'HIGH_SODIUM_REGULAR'
    ) {
      throw new AppError({
        message:
          'Clinical Safety Violation: Patient therapeutic diet requires RENAL_LOW_SODIUM; meal does not meet therapeutic specifications.',
        code: ErrorCode.BAD_REQUEST,
        statusCode: 400
      });
    }
  }

  static checkClinicalContraindication(condition: string, procedureName: string): void {
    if (condition.toUpperCase().includes('PREGNANCY') && procedureName.toUpperCase().includes('CT_PELVIS_IONIZING')) {
      throw new AppError({
        message:
          'Clinical Safety Alert: Ionizing radiation CT procedure is contraindicated in active pregnancy without explicit emergency override.',
        code: ErrorCode.BAD_REQUEST,
        statusCode: 400
      });
    }
  }

  static checkDuplicateOrder(existingOrderNumbers: string[], requestedOrderNumber: string): void {
    if (existingOrderNumbers.includes(requestedOrderNumber)) {
      throw new AppError({
        message: `Duplicate order violation: Clinical order ${requestedOrderNumber} already exists in active workflow.`,
        code: ErrorCode.BAD_REQUEST,
        statusCode: 409
      });
    }
  }

  // =========================================================================
  // P0-01 CLINICAL SAFETY TRANSCRIPT VALIDATION PIPELINE
  // =========================================================================

  /**
   * Evaluates an untrusted STT speech transcript for clinically sensitive entities,
   * vital signs, laboratory numerics, and formulary medicines.
   *
   * STRICT INVARIANT:
   * Whisper speech output is NEVER silently normalized or clamped.
   * Impossible vitals (e.g. "SpO2 296 percent") produce REJECTED status
   * with flags while preserving the original raw transcript.
   */
  static validateSpeechTranscript(
    rawTranscript: string,
    _options: ClinicalValidationOptions = {}
  ): ClinicalSafetyReport {
    if (!rawTranscript || !rawTranscript.trim()) {
      return {
        status: 'VALID',
        safetyFlags: [],
        entities: [],
        requiresConfirmation: false,
        suggestedAction: 'PROCEED',
        summary: 'Empty transcript provided; no clinical entities extracted.'
      };
    }

    const text = rawTranscript.trim();
    const entities: ClinicalExtractedEntity[] = [];

    // 1. Extract and Validate Vital Signs and Numeric Quantities
    this.extractVitals(text, entities);

    // 2. Extract and Validate Medications against Indian Formulary
    this.extractMedications(text, entities);

    // 3. Extract Dosage Strengths & Administration Frequencies
    this.extractDosageAndFrequencies(text, entities);

    // 4. Determine Composite Safety Status
    return this.compileSafetyReport(entities);
  }

  // -------------------------------------------------------------------------
  // 1. Vital Extraction and Physiological Range Verification
  // -------------------------------------------------------------------------

  private static extractVitals(text: string, entities: ClinicalExtractedEntity[]): void {
    // 1.1 SpO2 (Oxygen Saturation)
    // Examples: "SpO2 296 percent", "spo2 is 98%", "oxygen saturation 88", "saturation 95 percent"
    const spo2Regex = /\b(?:spo2|sp02|oxygen\s+sat(?:uration)?|saturation)\s*(?:is|=|:)?\s*(-?\d+(?:\.\d+)?)\s*(?:%|percent)?\b/gi;
    let spo2Match: RegExpExecArray | null;
    while ((spo2Match = spo2Regex.exec(text)) !== null) {
      const rawText = spo2Match[0]!;
      const rawValue = parseFloat(spo2Match[1]!);
      const bounds = PHYSIOLOGICAL_VITAL_BOUNDS['SPO2']!;

      const entity: ClinicalExtractedEntity = {
        type: 'VITAL',
        rawText,
        normalizedValue: { parameter: 'SpO2', rawValue, unit: '%' },
        unit: '%',
        range: { min: bounds.min, max: bounds.max, unit: '%' },
        flags: [],
        status: 'VALID'
      };

      // NEVER silently clamp rawValue!
      if (rawValue > 100) {
        entity.status = 'REJECTED';
        entity.flags.push('INVALID_VITAL_VALUE', 'SPO2_OUT_OF_PHYSIOLOGICAL_RANGE');
        entity.reason = `SpO2 value ${rawValue}% exceeds maximum physiological limit of 100%`;
      } else if (rawValue <= 0) {
        entity.status = 'REJECTED';
        entity.flags.push('INVALID_VITAL_VALUE', 'SPO2_OUT_OF_PHYSIOLOGICAL_RANGE');
        entity.reason = `SpO2 value ${rawValue}% is physiologically impossible (must be positive)`;
      } else if (rawValue < 50) {
        entity.status = 'REJECTED';
        entity.flags.push('INVALID_VITAL_VALUE', 'PHYSIOLOGICAL_OUTLIER');
        entity.reason = `SpO2 value ${rawValue}% represents severe non-viable hypoxemia requiring immediate physical re-evaluation`;
      } else if (rawValue < bounds.min) {
        entity.status = 'REQUIRES_CONFIRMATION';
        entity.flags.push('PHYSIOLOGICAL_OUTLIER');
        entity.reason = `Critical hypoxemia: SpO2 ${rawValue}% is below normal threshold (${bounds.min}%). Clinician verification required.`;
      } else {
        entity.status = 'VALID';
      }

      entities.push(entity);
    }

    // 1.2 Blood Pressure (Systolic / Diastolic)
    // Examples: "BP 120 over 80", "blood pressure 140/90", "BP 80 over 120", "BP 350 over 220"
    const bpRegex = /\b(?:bp|blood\s+pressure)\s*(?:is|=|:)?\s*(-?\d+)\s*(?:over|\/|\s)\s*(-?\d+)\s*(?:mm\s*hg)?\b/gi;
    let bpMatch: RegExpExecArray | null;
    while ((bpMatch = bpRegex.exec(text)) !== null) {
      const rawText = bpMatch[0]!;
      const systolic = parseInt(bpMatch[1]!, 10);
      const diastolic = parseInt(bpMatch[2]!, 10);
      const sysBounds = PHYSIOLOGICAL_VITAL_BOUNDS['BP_SYSTOLIC']!;
      const diaBounds = PHYSIOLOGICAL_VITAL_BOUNDS['BP_DIASTOLIC']!;

      const entity: ClinicalExtractedEntity = {
        type: 'VITAL',
        rawText,
        normalizedValue: { parameter: 'BLOOD_PRESSURE', systolic, diastolic, unit: 'mmHg' },
        unit: 'mmHg',
        range: { min: sysBounds.min, max: sysBounds.max, unit: 'mmHg' },
        flags: [],
        status: 'VALID'
      };

      // Inverted Blood Pressure Check
      if (systolic <= diastolic) {
        entity.status = 'REJECTED';
        entity.flags.push('INVALID_BLOOD_PRESSURE', 'INVERTED_BLOOD_PRESSURE');
        entity.reason = `Inverted blood pressure: Systolic pressure (${systolic}) cannot be lower than or equal to Diastolic pressure (${diastolic})`;
      } else if (
        systolic < sysBounds.min ||
        systolic > sysBounds.max ||
        diastolic < diaBounds.min ||
        diastolic > diaBounds.max
      ) {
        entity.status = 'REJECTED';
        entity.flags.push('INVALID_BLOOD_PRESSURE', 'PHYSIOLOGICAL_OUTLIER');
        entity.reason = `Blood pressure ${systolic}/${diastolic} mmHg is outside survivable physiological bounds (Systolic: ${sysBounds.min}-${sysBounds.max}, Diastolic: ${diaBounds.min}-${diaBounds.max})`;
      } else if (
        (sysBounds.criticalHigh !== undefined && systolic >= sysBounds.criticalHigh) ||
        (diaBounds.criticalHigh !== undefined && diastolic >= diaBounds.criticalHigh)
      ) {
        entity.status = 'REQUIRES_CONFIRMATION';
        entity.flags.push('PHYSIOLOGICAL_OUTLIER');
        entity.reason = `Hypertensive crisis alert: BP ${systolic}/${diastolic} mmHg requires immediate clinician verification.`;
      } else {
        entity.status = 'VALID';
      }

      entities.push(entity);
    }

    // 1.3 Heart Rate / Pulse
    // Examples: "heart rate 72 bpm", "pulse 500", "pulse rate is 84"
    const hrRegex = /\b(?:heart\s*rate|pulse(?:\s*rate)?|hr)\s*(?:is|=|:)?\s*(-?\d+)\s*(?:bpm|beats\s*(?:per|\/)\s*min(?:ute)?)?\b/gi;
    let hrMatch: RegExpExecArray | null;
    while ((hrMatch = hrRegex.exec(text)) !== null) {
      const rawText = hrMatch[0]!;
      const hr = parseInt(hrMatch[1]!, 10);
      const bounds = PHYSIOLOGICAL_VITAL_BOUNDS['HEART_RATE']!;

      const entity: ClinicalExtractedEntity = {
        type: 'VITAL',
        rawText,
        normalizedValue: { parameter: 'HEART_RATE', rawValue: hr, unit: 'bpm' },
        unit: 'bpm',
        range: { min: bounds.min, max: bounds.max, unit: 'bpm' },
        flags: [],
        status: 'VALID'
      };

      if (hr <= 0 || hr > bounds.max) {
        entity.status = 'REJECTED';
        entity.flags.push('INVALID_HEART_RATE', 'PHYSIOLOGICAL_OUTLIER');
        entity.reason = `Heart rate ${hr} bpm is outside physiological human limits (30-250 bpm)`;
      } else if (hr < bounds.min) {
        entity.status = 'REQUIRES_CONFIRMATION';
        entity.flags.push('PHYSIOLOGICAL_OUTLIER');
        entity.reason = `Severe bradycardia: Heart rate ${hr} bpm requires clinical confirmation.`;
      } else if (bounds.criticalHigh !== undefined && hr >= bounds.criticalHigh) {
        entity.status = 'REQUIRES_CONFIRMATION';
        entity.flags.push('PHYSIOLOGICAL_OUTLIER');
        entity.reason = `Severe tachycardia: Heart rate ${hr} bpm requires clinical confirmation.`;
      } else {
        entity.status = 'VALID';
      }

      entities.push(entity);
    }

    // 1.4 Body Temperature
    // Examples: "temperature 98.6 F", "temp 150 degrees", "fever 102 F", "temp 38.5 C"
    const tempRegex = /\b(?:temp(?:erature)?|fever)\s*(?:is|=|:)?\s*(-?\d+(?:\.\d+)?)\s*(?:degrees?)?\s*(f(?:ahrenheit)?|c(?:elsius)?)?\b/gi;
    let tempMatch: RegExpExecArray | null;
    while ((tempMatch = tempRegex.exec(text)) !== null) {
      const rawText = tempMatch[0]!;
      const rawVal = parseFloat(tempMatch[1]!);
      const unitSpec = (tempMatch[2] || '').toUpperCase();
      const isCelsius = unitSpec.startsWith('C') || (rawVal >= 30 && rawVal <= 45 && !unitSpec.startsWith('F'));
      const bounds = isCelsius ? PHYSIOLOGICAL_VITAL_BOUNDS['TEMPERATURE_C']! : PHYSIOLOGICAL_VITAL_BOUNDS['TEMPERATURE_F']!;
      const unitStr = isCelsius ? '°C' : '°F';

      const entity: ClinicalExtractedEntity = {
        type: 'VITAL',
        rawText,
        normalizedValue: { parameter: 'TEMPERATURE', rawValue: rawVal, unit: unitStr },
        unit: unitStr,
        range: { min: bounds.min, max: bounds.max, unit: unitStr },
        flags: [],
        status: 'VALID'
      };

      if (rawVal < bounds.min || rawVal > bounds.max) {
        entity.status = 'REJECTED';
        entity.flags.push('INVALID_TEMPERATURE', 'PHYSIOLOGICAL_OUTLIER');
        entity.reason = `Body temperature ${rawVal}${unitStr} is outside survivable physiological bounds (${bounds.min}-${bounds.max}${unitStr})`;
      } else if (bounds.criticalHigh !== undefined && rawVal >= bounds.criticalHigh) {
        entity.status = 'REQUIRES_CONFIRMATION';
        entity.flags.push('PHYSIOLOGICAL_OUTLIER');
        entity.reason = `High fever / Hyperpyrexia: Temperature ${rawVal}${unitStr} requires clinician confirmation.`;
      } else {
        entity.status = 'VALID';
      }

      entities.push(entity);
    }

    // 1.5 Respiratory Rate
    // Examples: "respiratory rate 16", "RR is 140 breaths per minute"
    const rrRegex = /\b(?:respiratory\s*rate|rr)\s*(?:is|=|:)?\s*(-?\d+)\s*(?:breaths?\s*(?:per|\/)\s*min(?:ute)?)?\b/gi;
    let rrMatch: RegExpExecArray | null;
    while ((rrMatch = rrRegex.exec(text)) !== null) {
      const rawText = rrMatch[0]!;
      const rr = parseInt(rrMatch[1]!, 10);
      const bounds = PHYSIOLOGICAL_VITAL_BOUNDS['RESPIRATORY_RATE']!;

      const entity: ClinicalExtractedEntity = {
        type: 'VITAL',
        rawText,
        normalizedValue: { parameter: 'RESPIRATORY_RATE', rawValue: rr, unit: '/min' },
        unit: '/min',
        range: { min: bounds.min, max: bounds.max, unit: '/min' },
        flags: [],
        status: 'VALID'
      };

      if (rr <= 0 || rr > bounds.max) {
        entity.status = 'REJECTED';
        entity.flags.push('INVALID_RESPIRATORY_RATE', 'PHYSIOLOGICAL_OUTLIER');
        entity.reason = `Respiratory rate ${rr}/min is outside physiological human limits (8-60 breaths/min)`;
      } else if (bounds.criticalHigh !== undefined && rr >= bounds.criticalHigh) {
        entity.status = 'REQUIRES_CONFIRMATION';
        entity.flags.push('PHYSIOLOGICAL_OUTLIER');
        entity.reason = `Severe tachypnea: Respiratory rate ${rr}/min requires clinical confirmation.`;
      } else {
        entity.status = 'VALID';
      }

      entities.push(entity);
    }

    // 1.6 Blood Glucose / Sugar
    // Examples: "blood sugar 110", "random blood sugar 2500 mg/dl", "glucose 450"
    const bgRegex = /\b(?:blood\s*sugar|random\s*blood\s*sugar|glucose|rbs|fbs)\s*(?:is|=|:)?\s*(-?\d+)\s*(?:mg\s*(?:\/|per)\s*d[lL])?\b/gi;
    let bgMatch: RegExpExecArray | null;
    while ((bgMatch = bgRegex.exec(text)) !== null) {
      const rawText = bgMatch[0]!;
      const bg = parseInt(bgMatch[1]!, 10);
      const bounds = PHYSIOLOGICAL_VITAL_BOUNDS['BLOOD_GLUCOSE']!;

      const entity: ClinicalExtractedEntity = {
        type: 'LAB_VALUE',
        rawText,
        normalizedValue: { parameter: 'BLOOD_GLUCOSE', rawValue: bg, unit: 'mg/dL' },
        unit: 'mg/dL',
        range: { min: bounds.min, max: bounds.max, unit: 'mg/dL' },
        flags: [],
        status: 'VALID'
      };

      if (bg <= 0 || bg > bounds.max) {
        entity.status = 'REJECTED';
        entity.flags.push('INVALID_GLUCOSE_VALUE', 'PHYSIOLOGICAL_OUTLIER');
        entity.reason = `Blood glucose ${bg} mg/dL is outside survivable physiological bounds (25-800 mg/dL)`;
      } else if (
        (bounds.criticalLow !== undefined && bg < bounds.criticalLow) ||
        (bounds.criticalHigh !== undefined && bg >= bounds.criticalHigh)
      ) {
        entity.status = 'REQUIRES_CONFIRMATION';
        entity.flags.push('PHYSIOLOGICAL_OUTLIER');
        entity.reason = `Critical glycemic alert: Glucose ${bg} mg/dL requires clinician confirmation.`;
      } else {
        entity.status = 'VALID';
      }

      entities.push(entity);
    }
  }

  // -------------------------------------------------------------------------
  // 2. Medication Extraction & Indian Formulary Matching
  // -------------------------------------------------------------------------

  private static extractMedications(text: string, entities: ClinicalExtractedEntity[]): void {
    // Strip common non-drug punctuation to isolate words
    const words = text.split(/[\s,;:!?]+/).filter(Boolean);
    const usedWordIndices = new Set<number>();

    // Phase 1: Exact formulary matching across n-grams (len = 3 down to 1)
    // Resolves multi-word brands (e.g. "Augmentin 625 Duo", "Dolo 650") and single-word generics/aliases (e.g. "Tramadol", "Pantoprazole")
    for (let len = 3; len >= 1; len--) {
      for (let i = 0; i <= words.length - len; i++) {
        let alreadyUsed = false;
        for (let k = 0; k < len; k++) {
          if (usedWordIndices.has(i + k)) {
            alreadyUsed = true;
            break;
          }
        }
        if (alreadyUsed) continue;

        const sliceWords = words.slice(i, i + len);
        const slice = sliceWords.join(' ');
        const cleanToken = slice.replace(/[^a-zA-Z0-9-]/g, '').trim();

        if (cleanToken.length < 3) continue;
        if (/^\d+$/.test(cleanToken)) continue;
        if (this.isClinicalStopword(cleanToken.toLowerCase())) continue;

        const match = matchFormularyMedicine(cleanToken);

        if (match.matchType === 'EXACT' && match.matchedDrug) {
          for (let k = 0; k < len; k++) {
            usedWordIndices.add(i + k);
          }
          const isHighRiskSchedule =
            match.matchedDrug.scheduleType === 'SCHEDULE_H1' || match.matchedDrug.scheduleType === 'SCHEDULE_X';

          entities.push({
            type: 'MEDICATION',
            rawText: slice,
            normalizedValue: {
              medicationId: match.matchedDrug.id,
              brandName: match.matchedDrug.brandName,
              genericName: match.matchedDrug.genericName,
              strength: match.matchedDrug.strength,
              scheduleType: match.matchedDrug.scheduleType
            },
            candidateMatch: match.matchedDrug.brandName,
            confidence: 1.0,
            status: isHighRiskSchedule ? 'REQUIRES_CONFIRMATION' : 'VALID',
            flags: isHighRiskSchedule
              ? ['EXACT_MEDICINE_MATCH', 'HIGH_RISK_SCHEDULE_H1']
              : ['EXACT_MEDICINE_MATCH'],
            reason: isHighRiskSchedule
              ? `Schedule ${match.matchedDrug.scheduleType} controlled drug detected (${match.matchedDrug.brandName}). Clinician confirmation required.`
              : undefined
          });
        }
      }
    }

    // Phase 2: Fuzzy and Ambiguous matching on remaining unconsumed single tokens
    // NEVER merge dosage numbers with corrupted drug names (e.g. preserves "pantoprasil" not "pantoprasil 40")
    for (let i = 0; i < words.length; i++) {
      if (usedWordIndices.has(i)) continue;

      const rawWord = words[i]!;
      const cleanToken = rawWord.replace(/[^a-zA-Z0-9-]/g, '').trim();

      if (cleanToken.length < 3) continue;
      if (/^\d+$/.test(cleanToken)) continue;
      if (this.isClinicalStopword(cleanToken.toLowerCase())) continue;

      const match = matchFormularyMedicine(cleanToken);

      if (match.matchType === 'FUZZY' && match.matchedDrug && match.score >= 0.70) {
        usedWordIndices.add(i);
        const isHighRiskSchedule =
          match.matchedDrug.scheduleType === 'SCHEDULE_H1' || match.matchedDrug.scheduleType === 'SCHEDULE_X';
        const flags: ClinicalSafetyFlag[] = ['FUZZY_MEDICINE_MATCH'];
        if (isHighRiskSchedule) {
          flags.push('HIGH_RISK_SCHEDULE_H1');
        }

        // Invariant: NEVER silently overwrite raw text! Preserve raw spoken token.
        entities.push({
          type: 'MEDICATION',
          rawText: cleanToken,
          candidateMatch: match.matchedDrug.brandName,
          confidence: match.score,
          status: 'REQUIRES_CONFIRMATION',
          flags,
          reason: `Fuzzy medicine match: Spoken "${cleanToken}" closely matches formulary record "${match.matchedDrug.brandName}" (${Math.round(match.score * 100)}% similarity). Clinician confirmation required.`
        });
      } else if (match.matchType === 'AMBIGUOUS' && match.candidateMatches.length > 0) {
        usedWordIndices.add(i);
        const isHighRiskSchedule =
          match.matchedDrug?.scheduleType === 'SCHEDULE_H1' || match.matchedDrug?.scheduleType === 'SCHEDULE_X';
        const flags: ClinicalSafetyFlag[] = ['AMBIGUOUS_MEDICINE_MATCH'];
        if (isHighRiskSchedule) {
          flags.push('HIGH_RISK_SCHEDULE_H1');
        }
        const candidateNames = match.candidateMatches.map((c) => c.drug.brandName).join(' OR ');

        entities.push({
          type: 'MEDICATION',
          rawText: cleanToken,
          candidateMatch: candidateNames,
          confidence: match.score,
          status: match.score < 0.80 ? 'UNCERTAIN' : 'REQUIRES_CONFIRMATION',
          flags,
          reason: `Ambiguous medicine match: Spoken "${cleanToken}" could match multiple distinct medications (${candidateNames}). Clinician verification required.`
        });
      }
    }
  }

  // -------------------------------------------------------------------------
  // 3. Dosage & Frequency Extraction
  // -------------------------------------------------------------------------

  private static extractDosageAndFrequencies(text: string, entities: ClinicalExtractedEntity[]): void {
    // 3.1 Dosage / Strength
    // Examples: "500 mg", "650mg", "40 mg", "50000 mg", "5 ml", "1 tablet"
    const dosageRegex = /\b(\d+(?:\.\d+)?)\s*(mg|mcg|micrograms?|g|gm|grams?|ml|drops?|puffs?|units?|iu|tab(?:let)?s?|caps?(?:ule)?s?)\b/gi;
    let doseMatch: RegExpExecArray | null;
    while ((doseMatch = dosageRegex.exec(text)) !== null) {
      const rawText = doseMatch[0]!;
      const amount = parseFloat(doseMatch[1]!);
      const unit = doseMatch[2]!.toLowerCase();

      // Check for extreme lethal/impossible single dose (e.g. 50,000 mg)
      const isExtremeDose = (unit.startsWith('mg') && amount > 10000) || (unit.startsWith('g') && amount > 50);

      entities.push({
        type: 'DOSAGE',
        rawText,
        normalizedValue: { amount, unit },
        unit,
        status: isExtremeDose ? 'REJECTED' : 'VALID',
        flags: isExtremeDose ? ['UNUSUAL_DOSAGE'] : [],
        reason: isExtremeDose
          ? `Extreme dosage warning: Single dose of ${amount} ${unit} is outside safe clinical parameters.`
          : undefined
      });
    }

    // 3.2 Administration Frequency
    // Examples: "once daily", "twice daily", "thrice a day", "OD", "BD", "TDS", "QID", "SOS", "at bedtime"
    const freqRegex = /\b(once\s+(?:a\s+)?day|twice\s+(?:a\s+)?day|thrice\s+(?:a\s+)?day|once\s+daily|twice\s+daily|three\s+times\s+daily|four\s+times\s+daily|od|bd|bid|tds|tid|qid|sos|hs|stat|q4h|q6h|q8h|q12h|at\s+bedtime|before\s+meals|after\s+meals)\b/gi;
    let freqMatch: RegExpExecArray | null;
    while ((freqMatch = freqRegex.exec(text)) !== null) {
      const rawText = freqMatch[0]!;
      entities.push({
        type: 'FREQUENCY',
        rawText,
        normalizedValue: rawText.toUpperCase(),
        status: 'VALID',
        flags: []
      });
    }
  }

  // -------------------------------------------------------------------------
  // 4. Composite Report Compilation
  // -------------------------------------------------------------------------

  private static compileSafetyReport(entities: ClinicalExtractedEntity[]): ClinicalSafetyReport {
    const safetyFlags: ClinicalSafetyFlag[] = [];
    for (const ent of entities) {
      for (const flag of ent.flags) {
        if (!safetyFlags.includes(flag)) {
          safetyFlags.push(flag);
        }
      }
    }

    // Determine overall report status:
    // Any REJECTED entity -> Overall REJECTED
    // Any REQUIRES_CONFIRMATION -> Overall REQUIRES_CONFIRMATION
    // Any UNCERTAIN -> Overall UNCERTAIN
    // Otherwise -> VALID
    const hasRejected = entities.some((e) => e.status === 'REJECTED');
    const hasRequiresConfirmation = entities.some((e) => e.status === 'REQUIRES_CONFIRMATION');
    const hasUncertain = entities.some((e) => e.status === 'UNCERTAIN');

    let status: ClinicalSafetyStatus = 'VALID';
    let requiresConfirmation = false;
    let suggestedAction: 'PROCEED' | 'VERIFY_WITH_CLINICIAN' | 'REJECT_INVALID_DATA' = 'PROCEED';
    let summary = 'All extracted clinical entities passed safety validation.';

    if (hasRejected) {
      status = 'REJECTED';
      requiresConfirmation = true;
      suggestedAction = 'REJECT_INVALID_DATA';
      const reasons = entities
        .filter((e) => e.status === 'REJECTED')
        .map((e) => e.reason || `${e.rawText} is invalid`)
        .join('; ');
      summary = `Clinical Safety Rejection: ${reasons}. Value cannot be trusted or silently clamped.`;
    } else if (hasRequiresConfirmation) {
      status = 'REQUIRES_CONFIRMATION';
      requiresConfirmation = true;
      suggestedAction = 'VERIFY_WITH_CLINICIAN';
      const reasons = entities
        .filter((e) => e.status === 'REQUIRES_CONFIRMATION')
        .map((e) => e.reason || `${e.rawText} requires confirmation`)
        .join('; ');
      summary = `Clinician Verification Required: ${reasons}`;
    } else if (hasUncertain) {
      status = 'UNCERTAIN';
      requiresConfirmation = true;
      suggestedAction = 'VERIFY_WITH_CLINICIAN';
      summary = 'Transcript contains ambiguous or low-confidence clinical elements.';
    } else if (entities.length === 0) {
      summary = 'No clinical vitals or medications detected in speech transcript.';
    }

    return {
      status,
      safetyFlags,
      entities,
      requiresConfirmation,
      suggestedAction,
      summary
    };
  }

  private static isClinicalStopword(word: string): boolean {
    const stopwords = new Set([
      'the', 'is', 'and', 'or', 'for', 'in', 'on', 'with', 'by', 'of', 'to', 'from', 'at',
      'patient', 'doctor', 'reports', 'complains', 'since', 'yesterday', 'today', 'morning',
      'evening', 'night', 'take', 'given', 'started', 'stopped', 'dose', 'tablets', 'capsules',
      'days', 'weeks', 'months', 'years', 'old', 'male', 'female', 'history', 'examination'
    ]);
    return stopwords.has(word);
  }
}
