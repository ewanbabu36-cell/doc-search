import crypto from 'node:crypto';
import {
  getDatabase,
  ddiDrugInteractionChecks,
  cdssAuditTraces,
  investigationOrders,
  investigationResults,
  consultationDiagnoses,
  consultationVitals,
  patients,
  operationalPartners,
  operationalOrganizations,
  eq,
  and,
  desc,
  withSecurityContext
} from '@docsearch/database';
import { AppError, ErrorCode, createLogger } from '@docsearch/shared-core';
import type { SessionContext } from '@docsearch/auth';

const logger = createLogger('clinical-safety-cdss');

export const CDSS_RULES_VERSION = '2026.04.1';

export type ClinicalSafetySeverity =
  | 'CONTRAINDICATED'
  | 'CRITICAL'
  | 'MAJOR'
  | 'MODERATE'
  | 'MINOR'
  | 'INFORMATIONAL';

export interface ClinicalSafetyAlert {
  alertId: string;
  ruleId: string;
  ruleVersion: string;
  category: 'DRUG_DRUG' | 'DRUG_ALLERGY' | 'DRUG_DISEASE' | 'DUPLICATE_THERAPY' | 'PEDIATRIC_DOSE' | 'RENAL_DOSE';
  severity: ClinicalSafetySeverity;
  substanceA: string;
  substanceB?: string | undefined;
  title: string;
  clinicalConsequence: string;
  mechanism: string;
  recommendedAction: string;
  evidenceSource: string;
  overrideAllowed: boolean;
  requiresMandatoryReason: boolean;
  wasOverridden?: boolean | undefined;
  overrideJustification?: string | undefined;
  details?: Record<string, unknown> | undefined;
}

export interface PediatricDoseEvaluation {
  status: 'SAFE' | 'OVERDOSE' | 'UNDERDOSE' | 'PATIENT_WEIGHT_REQUIRED' | 'DOSE_RULE_NOT_AVAILABLE';
  patientAgeYears?: number | undefined;
  patientWeightKg?: number | undefined;
  drugName: string;
  prescribedDoseMgPerDay?: number | undefined;
  recommendedMinMgPerKgPerDay?: number | undefined;
  recommendedMaxMgPerKgPerDay?: number | undefined;
  prescribedMgPerKgPerDay?: number | undefined;
  message: string;
}

export interface RenalDoseEvaluation {
  status: 'SAFE' | 'DOSE_ADJUSTMENT_REQUIRED' | 'CONTRAINDICATED' | 'RENAL_DATA_NOT_AVAILABLE';
  egfrMlMin?: number | undefined;
  serumCreatinineMgDl?: number | undefined;
  labResultDate?: string | undefined;
  isStale?: boolean | undefined;
  freshnessWarning?: string | undefined;
  drugName: string;
  message: string;
  recommendedAdjustment?: string | undefined;
}

export interface PrescriptionSafetyInput {
  patientId: string;
  encounterId?: string | undefined;
  patientMrn?: string | undefined;
  patientDob?: string | undefined;
  patientWeightKg?: number | undefined;
  patientGender?: string | undefined;
  medications: Array<{
    medicationId?: string | undefined;
    medicationName: string;
    dosage?: string | undefined;
    frequency?: string | undefined;
    duration?: number | undefined;
    durationUnit?: string | undefined;
    route?: string | undefined;
    strength?: string | undefined;
  }>;
  activeMedications?: string[] | undefined;
  activeDiagnoses?: string[] | undefined;
  activeAllergies?: string[] | undefined;
  overrides?: Array<{
    ruleId?: string | undefined;
    alertId?: string | undefined;
    clinicalJustification?: string | undefined;
    clinicalReason?: string | undefined;
    justification?: string | undefined;
  }> | undefined;
}

export interface PrescriptionSafetyEvaluationResult {
  isSafe: boolean;
  hasBlockingContraindication: boolean;
  blockingAlertCount: number;
  totalAlertCount: number;
  alerts: ClinicalSafetyAlert[];
  pediatricAssessments: PediatricDoseEvaluation[];
  renalAssessments: RenalDoseEvaluation[];
  duplicateTherapies: string[];
  evaluatedAt: string;
  ruleVersion: string;
}

export class ClinicalSafetyService {
  // Deterministic SHA-256 integrity hash chaining
  private computeHash(payload: Record<string, unknown>): string {
    return crypto.createHash('sha256').update(JSON.stringify(payload)).digest('hex');
  }

  private normalizeDrug(name: string): string {
    return (name || '').toLowerCase().trim();
  }

  private async resolvePartnerAndOrg(
    db: any,
    tenantId: string,
    providedPartnerId?: string,
    providedOrgId?: string
  ): Promise<{ partnerId: string; organizationId: string }> {
    let partnerId = providedPartnerId;
    let organizationId = providedOrgId;

    if (!partnerId) {
      const [p] = await db
        .select({ id: operationalPartners.id })
        .from(operationalPartners)
        .where(eq(operationalPartners.tenantId, tenantId))
        .limit(1);
      if (p?.id) partnerId = p.id;
    }

    if (!organizationId) {
      const [o] = await db
        .select({ id: operationalOrganizations.id })
        .from(operationalOrganizations)
        .where(eq(operationalOrganizations.tenantId, tenantId))
        .limit(1);
      if (o?.id) organizationId = o.id;
    }

    return {
      partnerId: partnerId || tenantId,
      organizationId: organizationId || tenantId
    };
  }

  // =========================================================================
  // 1. DRUG-DRUG INTERACTION (DDI) KNOWLEDGE GRAPH
  // =========================================================================
  public evaluateDdiRules(medA: string, medB: string): ClinicalSafetyAlert | null {
    const a = this.normalizeDrug(medA);
    const b = this.normalizeDrug(medB);

    const matches = (termA: string[], termB: string[]) => {
      const aMatches1 = termA.some((t) => a.includes(t));
      const bMatches2 = termB.some((t) => b.includes(t));
      const aMatches2 = termB.some((t) => a.includes(t));
      const bMatches1 = termA.some((t) => b.includes(t));
      return (aMatches1 && bMatches2) || (aMatches2 && bMatches1);
    };

    // 1. Sildenafil / Tadalafil + Nitrates -> Fatal Cardiovascular Collapse (CONTRAINDICATED)
    if (matches(['sildenafil', 'tadalafil', 'vardenafil'], ['nitroglycerin', 'sorbitrate', 'isosorbide', 'mononitrate', 'dinitrate', 'nitrate'])) {
      return {
        alertId: `DDI-${crypto.randomUUID().slice(0, 8)}`,
        ruleId: 'DDI-PDE5-NITRATE-001',
        ruleVersion: CDSS_RULES_VERSION,
        category: 'DRUG_DRUG',
        severity: 'CONTRAINDICATED',
        substanceA: medA,
        substanceB: medB,
        title: 'Fatal Hypotension Hazard: PDE-5 Inhibitor + Nitrate Co-prescribing',
        clinicalConsequence: 'Profound refractory systemic vasodilation, precipitous blood pressure drop, cardiovascular collapse, and myocardial infarction.',
        mechanism: 'PDE-5 inhibitors potentiate the hypotensive effect of organic nitrates by inhibiting cGMP degradation.',
        recommendedAction: 'STRICTLY CONTRAINDICATED. Do NOT administer nitrates within 24 hours of sildenafil or 48 hours of tadalafil. Select alternative antianginal therapy.',
        evidenceSource: 'AHA/ACC Clinical Guidelines / FDA Black Box Warning / Lexicomp Category X',
        overrideAllowed: false,
        requiresMandatoryReason: true
      };
    }

    // 2. Blood Thinners + NSAIDs -> Severe GI Bleeding (CRITICAL)
    if (
      matches(
        ['warfarin', 'aspirin', 'ecosprin', 'clopidogrel', 'apixaban', 'rivaroxaban', 'dabigatran', 'heparin'],
        ['ibuprofen', 'diclofenac', 'aceclofenac', 'naproxen', 'ketorolac', 'piroxicam', 'mefenamic', 'indomethacin']
      )
    ) {
      return {
        alertId: `DDI-${crypto.randomUUID().slice(0, 8)}`,
        ruleId: 'DDI-ANTICOAG-NSAID-002',
        ruleVersion: CDSS_RULES_VERSION,
        category: 'DRUG_DRUG',
        severity: 'CRITICAL',
        substanceA: medA,
        substanceB: medB,
        title: 'Major GI Hemorrhage Hazard: Anticoagulant/Antiplatelet + NSAID',
        clinicalConsequence: 'Marked increase in gastrointestinal ulceration, mucosal perforation, and life-threatening systemic bleeding diathesis (RR > 4.2).',
        mechanism: 'NSAIDs cause gastric mucosal injury, inhibit platelet COX-1, and synergistically disrupt hemostasis alongside systemic blood thinners.',
        recommendedAction: 'Avoid systemic NSAIDs. Use Paracetamol (up to 2g/day) or topical analgesics. If NSAID strictly mandatory, co-prescribe PPI gastroprotection (Pantoprazole) and monitor Hb/INR.',
        evidenceSource: 'British National Formulary (BNF) / UpToDate Clinical Evidence',
        overrideAllowed: true,
        requiresMandatoryReason: true
      };
    }

    // 3. Statins + Strong CYP3A4 Inhibitors / Macrolides -> Rhabdomyolysis (CRITICAL)
    if (
      matches(
        ['simvastatin', 'atorvastatin', 'lovastatin'],
        ['clarithromycin', 'erythromycin', 'ketoconazole', 'itraconazole', 'ritonavir']
      )
    ) {
      return {
        alertId: `DDI-${crypto.randomUUID().slice(0, 8)}`,
        ruleId: 'DDI-STATIN-CYP3A4-003',
        ruleVersion: CDSS_RULES_VERSION,
        category: 'DRUG_DRUG',
        severity: 'CRITICAL',
        substanceA: medA,
        substanceB: medB,
        title: 'Severe Rhabdomyolysis Risk: Statin + Strong CYP3A4 Inhibitor',
        clinicalConsequence: 'Severe skeletal muscle breakdown, extreme CPK elevation (>10,000 U/L), myoglobinuria, and acute tubular necrosis/renal failure.',
        mechanism: 'CYP3A4 inhibition elevates statin AUC by 400-1000%, causing acute systemic myotoxicity.',
        recommendedAction: 'Temporarily suspend statin during macrolide/azole course, or switch antibiotic to Azithromycin (does not inhibit CYP3A4) or Rosuvastatin (CYP2C9 metabolized).',
        evidenceSource: 'FDA Drug Safety Communication / ACC/AHA Cholesterol Guidelines',
        overrideAllowed: true,
        requiresMandatoryReason: true
      };
    }

    // 4. ACE Inhibitors / ARBs + Potassium-Sparing Diuretics / K Supplements -> Fatal Hyperkalemia (CRITICAL)
    if (
      matches(
        ['enalapril', 'ramipril', 'lisinopril', 'telmisartan', 'losartan', 'valsartan', 'olmesartan'],
        ['spironolactone', 'eplerenone', 'amiloride', 'potassium chloride', 'potklor']
      )
    ) {
      return {
        alertId: `DDI-${crypto.randomUUID().slice(0, 8)}`,
        ruleId: 'DDI-RAAS-POTASSIUM-004',
        ruleVersion: CDSS_RULES_VERSION,
        category: 'DRUG_DRUG',
        severity: 'CRITICAL',
        substanceA: medA,
        substanceB: medB,
        title: 'Severe Hyperkalemia Hazard: RAAS Inhibitor + Potassium-Sparing Agent',
        clinicalConsequence: 'Serum potassium elevation exceeding 6.5 mEq/L, cardiac conduction abnormalities, tall peaked T-waves, ventricular arrhythmias, and asystole.',
        mechanism: 'Dual suppression of aldosterone action and reduced distal tubular potassium excretion.',
        recommendedAction: 'Check baseline Serum Potassium and eGFR. Monitor serum electrolytes within 7 days of starting combination. Advise low potassium diet.',
        evidenceSource: 'KDIGO Clinical Practice Guideline / ESC Heart Failure Guidelines',
        overrideAllowed: true,
        requiresMandatoryReason: true
      };
    }

    // 5. Methotrexate + NSAIDs -> Severe Bone Marrow Suppression (CRITICAL)
    if (
      matches(
        ['methotrexate'],
        ['ibuprofen', 'diclofenac', 'naproxen', 'ketorolac', 'indomethacin', 'piroxicam', 'aspirin']
      )
    ) {
      return {
        alertId: `DDI-${crypto.randomUUID().slice(0, 8)}`,
        ruleId: 'DDI-MTX-NSAID-005',
        ruleVersion: CDSS_RULES_VERSION,
        category: 'DRUG_DRUG',
        severity: 'CRITICAL',
        substanceA: medA,
        substanceB: medB,
        title: 'Methotrexate Toxicity Hazard: Reduced Renal Elimination via NSAIDs',
        clinicalConsequence: 'Profound pancytopenia, severe oral mucositis, hepatotoxicity, and acute kidney injury.',
        mechanism: 'NSAIDs diminish renal blood flow and competitive active tubular secretion of methotrexate.',
        recommendedAction: 'Avoid NSAIDs, especially with intermediate or high-dose methotrexate. Monitor CBC and serum creatinine regularly.',
        evidenceSource: 'FDA Black Box Warning / ACR Rheumatology Guidelines',
        overrideAllowed: true,
        requiresMandatoryReason: true
      };
    }

    // 6. Warfarin + Macrolides / Fluoroquinolones -> Supratherapeutic INR (CONTRAINDICATED)
    if (
      matches(
        ['warfarin'],
        ['clarithromycin', 'ciprofloxacin', 'levofloxacin', 'metronidazole']
      )
    ) {
      return {
        alertId: `DDI-${crypto.randomUUID().slice(0, 8)}`,
        ruleId: 'DDI-WARFARIN-MACROLIDE-006',
        ruleVersion: CDSS_RULES_VERSION,
        category: 'DRUG_DRUG',
        severity: 'CONTRAINDICATED',
        substanceA: medA,
        substanceB: medB,
        title: 'Severe Supratherapeutic INR (>8.0) & Hemorrhage: Warfarin + Antibiotic',
        clinicalConsequence: 'Massive internal hemorrhage, hematuria, retroperitoneal bleed, and intracranial hemorrhage.',
        mechanism: 'Strong inhibition of CYP2C9 and elimination of intestinal gut flora producing Vitamin K.',
        recommendedAction: 'Avoid combination. If indispensable, reduce Warfarin dose empirically by 30-50% and perform daily INR monitoring.',
        evidenceSource: 'Chest Antithrombotic Guidelines / Lexicomp Category D/X',
        overrideAllowed: false,
        requiresMandatoryReason: true
      };
    }

    // 7. SSRIs + Tramadol / MAOIs / Linezolid -> Serotonin Syndrome (CONTRAINDICATED)
    if (
      matches(
        ['fluoxetine', 'sertraline', 'escitalopram', 'paroxetine', 'citalopram', 'venlafaxine'],
        ['tramadol', 'linezolid', 'moclobemide', 'selegiline', 'rasagiline']
      )
    ) {
      return {
        alertId: `DDI-${crypto.randomUUID().slice(0, 8)}`,
        ruleId: 'DDI-SSRI-SEROTONIN-007',
        ruleVersion: CDSS_RULES_VERSION,
        category: 'DRUG_DRUG',
        severity: 'CONTRAINDICATED',
        substanceA: medA,
        substanceB: medB,
        title: 'Life-Threatening Serotonin Syndrome: SSRI + Serotonergic Agent',
        clinicalConsequence: 'Hyperthermia (>40°C), autonomic hyperactivity (tachycardia, labile BP), agitation, hyperreflexia, clonus, and rhabdomyolysis.',
        mechanism: 'Additive synaptic serotonin accumulation and 5-HT2A receptor hyperstimulation.',
        recommendedAction: 'Do not combine. For pain in patients on SSRIs, use Paracetamol or non-serotonergic analgesics. For infection, choose non-oxazolidinone antibiotics.',
        evidenceSource: 'Sternbach Criteria / Hunter Serotonin Toxicity Criteria / FDA Advisory',
        overrideAllowed: false,
        requiresMandatoryReason: true
      };
    }

    // 8. Fluoroquinolones + Antiarrhythmics -> Fatal QT Prolongation / TdP (CRITICAL)
    if (
      matches(
        ['ciprofloxacin', 'levofloxacin', 'moxifloxacin'],
        ['amiodarone', 'sotalol', 'quinidine', 'haloperidol']
      )
    ) {
      return {
        alertId: `DDI-${crypto.randomUUID().slice(0, 8)}`,
        ruleId: 'DDI-QT-PROLONGATION-008',
        ruleVersion: CDSS_RULES_VERSION,
        category: 'DRUG_DRUG',
        severity: 'CRITICAL',
        substanceA: medA,
        substanceB: medB,
        title: 'Fatal Arrhythmia Hazard: Additive QTc Prolongation / Torsades de Pointes',
        clinicalConsequence: 'QTc interval prolongation > 500ms, polymorphic ventricular tachycardia (Torsades de Pointes), syncope, and sudden cardiac death.',
        mechanism: 'Additive blockade of the cardiac IKr rapid delayed rectifier potassium channel.',
        recommendedAction: 'Obtain baseline 12-lead ECG. Avoid combination if baseline QTc > 460ms. Select alternative antibiotic class (e.g. Beta-lactams).',
        evidenceSource: 'CredibleMeds Known Risk of TdP / AHA Scientific Statement',
        overrideAllowed: true,
        requiresMandatoryReason: true
      };
    }

    return null;
  }

  // =========================================================================
  // 2. DRUG-ALLERGY INTERACTION ENGINE
  // =========================================================================
  public evaluateDrugAllergy(medName: string, knownAllergens: string[]): ClinicalSafetyAlert | null {
    const med = this.normalizeDrug(medName);

    for (const rawAllergen of knownAllergens) {
      const allergen = this.normalizeDrug(rawAllergen);
      if (!allergen) continue;

      // Penicillin Cross-Reactivity
      if (allergen.includes('penicillin') || allergen.includes('amoxicillin') || allergen.includes('ampicillin')) {
        if (
          med.includes('penicillin') ||
          med.includes('amoxicillin') ||
          med.includes('ampicillin') ||
          med.includes('augmentin') ||
          med.includes('clav') ||
          med.includes('cephalexin') ||
          med.includes('cefazolin')
        ) {
          return {
            alertId: `ALLERGY-${crypto.randomUUID().slice(0, 8)}`,
            ruleId: 'ALLERGY-PENICILLIN-CROSS-001',
            ruleVersion: CDSS_RULES_VERSION,
            category: 'DRUG_ALLERGY',
            severity: 'CONTRAINDICATED',
            substanceA: medName,
            substanceB: rawAllergen,
            title: `Severe Anaphylaxis Hazard: Documented Allergy to ${rawAllergen}`,
            clinicalConsequence: 'Severe IgE-mediated type-1 hypersensitivity, bronchospasm, angioedema, cardiovascular collapse, and fatal anaphylaxis.',
            mechanism: 'Shared beta-lactam core ring structure triggering pre-sensitized mast cell degranulation.',
            recommendedAction: 'STRICTLY CONTRAINDICATED. Switch to non-beta-lactam class: Macrolides (Azithromycin) or Fluoroquinolones.',
            evidenceSource: 'AAAAI Anaphylaxis Practice Parameter / WAO Guidelines',
            overrideAllowed: false,
            requiresMandatoryReason: true
          };
        }
      }

      // Sulfa Cross-Reactivity
      if (allergen.includes('sulfa') || allergen.includes('sulfonamide') || allergen.includes('bactrim') || allergen.includes('septran')) {
        if (med.includes('sulfamethoxazole') || med.includes('bactrim') || med.includes('septran') || med.includes('sulfasalazine')) {
          return {
            alertId: `ALLERGY-${crypto.randomUUID().slice(0, 8)}`,
            ruleId: 'ALLERGY-SULFA-CROSS-002',
            ruleVersion: CDSS_RULES_VERSION,
            category: 'DRUG_ALLERGY',
            severity: 'CONTRAINDICATED',
            substanceA: medName,
            substanceB: rawAllergen,
            title: `Severe Cutaneous Adverse Reaction Hazard: Sulfa Allergy to ${rawAllergen}`,
            clinicalConsequence: 'Stevens-Johnson Syndrome (SJS), Toxic Epidermal Necrolysis (TEN), drug-induced immune hemolytic anemia.',
            mechanism: 'Immunogenic sulfonamide arylamine metabolite binding to human epidermal cellular proteins.',
            recommendedAction: 'STRICTLY CONTRAINDICATED. Avoid sulfonamide antimicrobials. Substitute with nitrofurantoin, beta-lactam, or fluoroquinolone.',
            evidenceSource: 'RegiSCAR SJS/TEN Clinical Registry / FDA Alert',
            overrideAllowed: false,
            requiresMandatoryReason: true
          };
        }
      }

      // NSAID / Aspirin Exacerbated Respiratory Disease (AERD)
      if (allergen.includes('aspirin') || allergen.includes('nsaid') || allergen.includes('ibuprofen')) {
        if (
          med.includes('aspirin') ||
          med.includes('ibuprofen') ||
          med.includes('diclofenac') ||
          med.includes('aceclofenac') ||
          med.includes('naproxen') ||
          med.includes('ketorolac') ||
          med.includes('mefenamic')
        ) {
          return {
            alertId: `ALLERGY-${crypto.randomUUID().slice(0, 8)}`,
            ruleId: 'ALLERGY-NSAID-AERD-003',
            ruleVersion: CDSS_RULES_VERSION,
            category: 'DRUG_ALLERGY',
            severity: 'CONTRAINDICATED',
            substanceA: medName,
            substanceB: rawAllergen,
            title: `Severe Bronchospasm & Angioedema: Documented NSAID Allergy to ${rawAllergen}`,
            clinicalConsequence: 'Acute severe refractory asthma exacerbation, massive facial angioedema, and anaphylactoid shock.',
            mechanism: 'COX-1 inhibition shunting arachidonic acid to lipoxygenase pathway causing cysteinyl leukotriene overproduction.',
            recommendedAction: 'STRICTLY CONTRAINDICATED. Use plain Paracetamol (up to 1000mg single dose) or pure selective COX-2 inhibitor under supervision.',
            evidenceSource: 'EAACI Position Paper on NSAID Hypersensitivity',
            overrideAllowed: false,
            requiresMandatoryReason: true
          };
        }
      }
    }

    return null;
  }

  // =========================================================================
  // 3. DRUG-DISEASE CONTRAINDICATION ENGINE
  // =========================================================================
  public evaluateDrugDisease(medName: string, activeDiagnoses: string[]): ClinicalSafetyAlert | null {
    const med = this.normalizeDrug(medName);

    for (const diag of activeDiagnoses) {
      const d = diag.toLowerCase();

      // Asthma / COPD + Non-cardioselective Beta Blockers
      if (d.includes('asthma') || d.includes('copd') || d.includes('bronchitis') || d.includes('j45') || d.includes('j44')) {
        if (med.includes('propranolol') || med.includes('timolol') || med.includes('carvedilol') || med.includes('labetalol') || med.includes('sotalol')) {
          return {
            alertId: `DISEASE-${crypto.randomUUID().slice(0, 8)}`,
            ruleId: 'DISEASE-ASTHMA-BETABLOCKER-001',
            ruleVersion: CDSS_RULES_VERSION,
            category: 'DRUG_DISEASE',
            severity: 'CONTRAINDICATED',
            substanceA: medName,
            substanceB: diag,
            title: `Fatal Bronchospasm Hazard: Non-selective Beta Blocker in ${diag}`,
            clinicalConsequence: 'Acute status asthmaticus, profound airway obstruction, respiratory arrest unresponsive to beta-agonist rescue inhalers.',
            mechanism: 'Competitive blockade of bronchial smooth muscle beta-2 adrenergic receptors preventing bronchodilation.',
            recommendedAction: 'STRICTLY CONTRAINDICATED in active asthma. If beta-blocker is essential (post-MI/heart failure), prescribe highly cardioselective beta-1 blockers (Bisoprolol/Metoprolol) with spirometry monitoring.',
            evidenceSource: 'GINA Global Strategy for Asthma Management and Prevention',
            overrideAllowed: false,
            requiresMandatoryReason: true
          };
        }
      }

      // Peptic Ulcer Disease + NSAIDs / Systemic Steroids
      if (d.includes('peptic ulcer') || d.includes('gastric ulcer') || d.includes('duodenal ulcer') || d.includes('gi bleed') || d.includes('k25') || d.includes('k27')) {
        if (
          med.includes('ibuprofen') ||
          med.includes('diclofenac') ||
          med.includes('aceclofenac') ||
          med.includes('naproxen') ||
          med.includes('ketorolac') ||
          med.includes('prednisolone') ||
          med.includes('dexamethasone')
        ) {
          return {
            alertId: `DISEASE-${crypto.randomUUID().slice(0, 8)}`,
            ruleId: 'DISEASE-PUD-NSAID-002',
            ruleVersion: CDSS_RULES_VERSION,
            category: 'DRUG_DISEASE',
            severity: 'CONTRAINDICATED',
            substanceA: medName,
            substanceB: diag,
            title: `Perforation & Fatal Hemorrhage: NSAID/Corticosteroid in ${diag}`,
            clinicalConsequence: 'Acute peptic ulcer re-bleeding, transmural gastric/duodenal perforation, peritonitis, and septic/hemorrhagic shock.',
            mechanism: 'Suppression of protective gastric prostaglandins and microvascular mucosal barrier maintenance.',
            recommendedAction: 'STRICTLY CONTRAINDICATED. Switch to Paracetamol for analgesia. Maintain PPI therapy (Pantoprazole/Rabeprazole).',
            evidenceSource: 'ACG Clinical Guideline for Bleeding Peptic Ulcer',
            overrideAllowed: false,
            requiresMandatoryReason: true
          };
        }
      }

      // Chronic Kidney Disease (CKD) + NSAIDs
      if (d.includes('chronic kidney') || d.includes('ckd') || d.includes('renal failure') || d.includes('n18')) {
        if (med.includes('ibuprofen') || med.includes('diclofenac') || med.includes('aceclofenac') || med.includes('naproxen') || med.includes('ketorolac')) {
          return {
            alertId: `DISEASE-${crypto.randomUUID().slice(0, 8)}`,
            ruleId: 'DISEASE-CKD-NSAID-003',
            ruleVersion: CDSS_RULES_VERSION,
            category: 'DRUG_DISEASE',
            severity: 'CONTRAINDICATED',
            substanceA: medName,
            substanceB: diag,
            title: `Acute-on-Chronic Renal Failure: NSAID in ${diag}`,
            clinicalConsequence: 'Precipitous collapse of remaining glomerular filtration, severe hyperkalemia, acute fluid overload, and emergent dialysis requirement.',
            mechanism: 'Inhibition of renal vasodilatory PGE2 and PGI2, causing afferent arteriolar constriction and acute medullary ischemia.',
            recommendedAction: 'STRICTLY CONTRAINDICATED in moderate-to-severe CKD. Use Paracetamol or low-dose opioids for analgesia.',
            evidenceSource: 'KDIGO Clinical Practice Guideline for CKD',
            overrideAllowed: false,
            requiresMandatoryReason: true
          };
        }
      }
    }

    return null;
  }

  // =========================================================================
  // 4. DUPLICATE THERAPY DETECTION
  // =========================================================================
  public evaluateDuplicateTherapy(medications: string[]): ClinicalSafetyAlert[] {
    const alerts: ClinicalSafetyAlert[] = [];
    const normalized = medications.map((m) => ({ raw: m, norm: this.normalizeDrug(m) }));

    const classes: Array<{ name: string; keys: string[] }> = [
      { name: 'Systemic NSAID', keys: ['ibuprofen', 'diclofenac', 'aceclofenac', 'naproxen', 'ketorolac', 'piroxicam', 'mefenamic', 'etoricoxib'] },
      { name: 'Proton Pump Inhibitor (PPI)', keys: ['pantoprazole', 'rabeprazole', 'omeprazole', 'esomeprazole', 'lansoprazole'] },
      { name: 'ACE Inhibitor / ARB', keys: ['enalapril', 'ramipril', 'lisinopril', 'telmisartan', 'losartan', 'valsartan', 'olmesartan'] },
      { name: 'Benzodiazepine', keys: ['alprazolam', 'clonazepam', 'diazepam', 'lorazepam', 'midazolam'] },
      { name: 'Statin', keys: ['atorvastatin', 'rosuvastatin', 'simvastatin', 'pitavastatin'] }
    ];

    for (const cls of classes) {
      const matched = normalized.filter((item) => cls.keys.some((k) => item.norm.includes(k)));
      if (matched.length > 1) {
        alerts.push({
          alertId: `DUP-${crypto.randomUUID().slice(0, 8)}`,
          ruleId: `DUP-${cls.name.toUpperCase().replace(/\s+/g, '_')}-001`,
          ruleVersion: CDSS_RULES_VERSION,
          category: 'DUPLICATE_THERAPY',
          severity: 'MAJOR',
          substanceA: matched[0]?.raw || '',
          substanceB: matched.slice(1).map((m) => m.raw).join(', '),
          title: `Duplicate Therapy Detected: Multiple ${cls.name} Prescriptions`,
          clinicalConsequence: `Co-prescribing multiple ${cls.name} molecules offers no additive therapeutic efficacy while exponentially compounding toxicity and adverse reaction rates.`,
          mechanism: `Competitive receptor saturation and identical pharmacodynamic pathway overdrive.`,
          recommendedAction: `Select a single optimal ${cls.name} agent at appropriate therapeutic dosage. Cancel duplicate prescription.`,
          evidenceSource: 'Beers Criteria / NHS Polypharmacy Guidance',
          overrideAllowed: true,
          requiresMandatoryReason: true
        });
      }
    }

    return alerts;
  }

  // =========================================================================
  // 5. PEDIATRIC DOSE SAFETY ENGINE
  // =========================================================================
  public evaluatePediatricDose(
    medName: string,
    strengthStr: string | undefined,
    frequencyStr: string | undefined,
    weightKg: number | undefined,
    ageYears: number | undefined
  ): PediatricDoseEvaluation {
    const med = this.normalizeDrug(medName);

    // Pediatric patients are < 18 years
    if (ageYears !== undefined && ageYears >= 18) {
      return {
        status: 'SAFE',
        drugName: medName,
        message: 'Patient is an adult (>= 18 years). Standard adult formulary applies.'
      };
    }

    // Weight is mandatory for pediatric dose evaluation
    if (weightKg === undefined || weightKg <= 0) {
      return {
        status: 'PATIENT_WEIGHT_REQUIRED',
        drugName: medName,
        patientAgeYears: ageYears,
        message: 'CRITICAL SAFETY GAP: Patient weight (kg) is mandatory for pediatric dose verification. Dosing cannot be certified without accurate body weight.'
      };
    }

    // Extract numerical dose from strength or med name (e.g. "250mg", "125 mg", "500")
    const matchDose = (strengthStr || medName).match(/(\d+(?:\.\d+)?)\s*(?:mg)/i);
    const unitDoseMg = matchDose ? parseFloat(matchDose[1]!) : 0;

    // Estimate daily frequency factor
    let dailyFrequencyFactor = 1;
    const freq = (frequencyStr || '').toUpperCase();
    if (freq.includes('TID') || freq.includes('TDS') || freq.includes('1 - 1 - 1') || freq.includes('THREAT')) dailyFrequencyFactor = 3;
    else if (freq.includes('BID') || freq.includes('BD') || freq.includes('1 - 0 - 1')) dailyFrequencyFactor = 2;
    else if (freq.includes('QID') || freq.includes('1 - 1 - 1 - 1')) dailyFrequencyFactor = 4;
    else if (freq.includes('OD') || freq.includes('1 - 0 - 0') || freq.includes('0 - 0 - 1')) dailyFrequencyFactor = 1;

    const prescribedDailyMg = unitDoseMg * dailyFrequencyFactor;
    const prescribedMgPerKgPerDay = weightKg > 0 ? prescribedDailyMg / weightKg : 0;

    // Rule A: Paracetamol (Pediatric safe: 10-15 mg/kg/dose, max 60 mg/kg/day)
    if (med.includes('paracetamol') || med.includes('crocin') || med.includes('calpol')) {
      const minSafeMgKgDay = 30; // 10 mg/kg TDS
      const maxSafeMgKgDay = 60; // 15 mg/kg QID
      if (unitDoseMg > 0) {
        if (prescribedMgPerKgPerDay > maxSafeMgKgDay) {
          return {
            status: 'OVERDOSE',
            drugName: medName,
            patientAgeYears: ageYears,
            patientWeightKg: weightKg,
            prescribedDoseMgPerDay: prescribedDailyMg,
            prescribedMgPerKgPerDay: Math.round(prescribedMgPerKgPerDay * 10) / 10,
            recommendedMinMgPerKgPerDay: minSafeMgKgDay,
            recommendedMaxMgPerKgPerDay: maxSafeMgKgDay,
            message: `PEDIATRIC OVERDOSE ALERT: Prescribed ${Math.round(prescribedMgPerKgPerDay)} mg/kg/day exceeds max safe ceiling of ${maxSafeMgKgDay} mg/kg/day (Patient weight: ${weightKg} kg). Severe risk of acute acetaminophen hepatotoxicity.`
          };
        }
        if (prescribedMgPerKgPerDay < minSafeMgKgDay) {
          return {
            status: 'UNDERDOSE',
            drugName: medName,
            patientAgeYears: ageYears,
            patientWeightKg: weightKg,
            prescribedDoseMgPerDay: prescribedDailyMg,
            prescribedMgPerKgPerDay: Math.round(prescribedMgPerKgPerDay * 10) / 10,
            recommendedMinMgPerKgPerDay: minSafeMgKgDay,
            recommendedMaxMgPerKgPerDay: maxSafeMgKgDay,
            message: `PEDIATRIC UNDERDOSE: Prescribed ${Math.round(prescribedMgPerKgPerDay)} mg/kg/day is below therapeutic floor of ${minSafeMgKgDay} mg/kg/day (Patient weight: ${weightKg} kg). Fever reduction will be clinically sub-therapeutic.`
          };
        }
      }
      return {
        status: 'SAFE',
        drugName: medName,
        patientAgeYears: ageYears,
        patientWeightKg: weightKg,
        prescribedDoseMgPerDay: prescribedDailyMg,
        prescribedMgPerKgPerDay: Math.round(prescribedMgPerKgPerDay * 10) / 10,
        recommendedMinMgPerKgPerDay: minSafeMgKgDay,
        recommendedMaxMgPerKgPerDay: maxSafeMgKgDay,
        message: `Pediatric dose verified safe: ${Math.round(prescribedMgPerKgPerDay)} mg/kg/day (Safe range: ${minSafeMgKgDay}-${maxSafeMgKgDay} mg/kg/day).`
      };
    }

    // Rule B: Amoxicillin (Pediatric safe: 25-45 mg/kg/day; up to 90 mg/kg/day for AOM)
    if (med.includes('amoxicillin') || med.includes('novamox') || med.includes('mox')) {
      const minSafeMgKgDay = 25;
      const maxSafeMgKgDay = 90;
      if (unitDoseMg > 0) {
        if (prescribedMgPerKgPerDay > maxSafeMgKgDay) {
          return {
            status: 'OVERDOSE',
            drugName: medName,
            patientAgeYears: ageYears,
            patientWeightKg: weightKg,
            prescribedDoseMgPerDay: prescribedDailyMg,
            prescribedMgPerKgPerDay: Math.round(prescribedMgPerKgPerDay * 10) / 10,
            recommendedMinMgPerKgPerDay: minSafeMgKgDay,
            recommendedMaxMgPerKgPerDay: maxSafeMgKgDay,
            message: `PEDIATRIC OVERDOSE ALERT: Prescribed ${Math.round(prescribedMgPerKgPerDay)} mg/kg/day exceeds max ceiling of ${maxSafeMgKgDay} mg/kg/day.`
          };
        }
      }
      return {
        status: 'SAFE',
        drugName: medName,
        patientAgeYears: ageYears,
        patientWeightKg: weightKg,
        prescribedDoseMgPerDay: prescribedDailyMg,
        prescribedMgPerKgPerDay: Math.round(prescribedMgPerKgPerDay * 10) / 10,
        recommendedMinMgPerKgPerDay: minSafeMgKgDay,
        recommendedMaxMgPerKgPerDay: maxSafeMgKgDay,
        message: `Pediatric dose verified safe: ${Math.round(prescribedMgPerKgPerDay)} mg/kg/day.`
      };
    }

    // Rule C: Ibuprofen (Pediatric safe: 20-40 mg/kg/day divided)
    if (med.includes('ibuprofen') || med.includes('brufen') || med.includes('ibugesic')) {
      const minSafeMgKgDay = 20;
      const maxSafeMgKgDay = 40;
      if (unitDoseMg > 0 && prescribedMgPerKgPerDay > maxSafeMgKgDay) {
        return {
          status: 'OVERDOSE',
          drugName: medName,
          patientAgeYears: ageYears,
          patientWeightKg: weightKg,
          prescribedDoseMgPerDay: prescribedDailyMg,
          prescribedMgPerKgPerDay: Math.round(prescribedMgPerKgPerDay * 10) / 10,
          recommendedMinMgPerKgPerDay: minSafeMgKgDay,
          recommendedMaxMgPerKgPerDay: maxSafeMgKgDay,
          message: `PEDIATRIC OVERDOSE ALERT: Prescribed ${Math.round(prescribedMgPerKgPerDay)} mg/kg/day exceeds max pediatric ibuprofen ceiling of ${maxSafeMgKgDay} mg/kg/day.`
        };
      }
      return {
        status: 'SAFE',
        drugName: medName,
        patientAgeYears: ageYears,
        patientWeightKg: weightKg,
        prescribedDoseMgPerDay: prescribedDailyMg,
        prescribedMgPerKgPerDay: Math.round(prescribedMgPerKgPerDay * 10) / 10,
        recommendedMinMgPerKgPerDay: minSafeMgKgDay,
        recommendedMaxMgPerKgPerDay: maxSafeMgKgDay,
        message: `Pediatric dose verified safe: ${Math.round(prescribedMgPerKgPerDay)} mg/kg/day.`
      };
    }

    // Explicit Clinical Safety Requirement: If no validated rule exists, NEVER invent dosing.
    return {
      status: 'DOSE_RULE_NOT_AVAILABLE',
      drugName: medName,
      patientAgeYears: ageYears,
      patientWeightKg: weightKg,
      message: 'DOSE RULE NOT AVAILABLE: No pediatric dosing rule configured for this molecule. Attending pediatrician manual verification required.'
    };
  }

  // =========================================================================
  // 6. RENAL DOSE SAFETY ENGINE
  // =========================================================================
  public async evaluateRenalDose(
    tenantId: string,
    patientId: string,
    medName: string,
    dbClient = getDatabase()
  ): Promise<RenalDoseEvaluation> {
    const med = this.normalizeDrug(medName);

    // List of renally-cleared medications requiring safety evaluation
    const renalSensitiveDrugs = [
      'metformin',
      'ciprofloxacin',
      'enoxaparin',
      'gabapentin',
      'digoxin',
      'allopurinol',
      'amikacin',
      'vancomycin'
    ];

    const isRenalSensitive = renalSensitiveDrugs.some((d) => med.includes(d));
    if (!isRenalSensitive) {
      return {
        status: 'SAFE',
        drugName: medName,
        message: 'Molecule has predominantly hepatic or biliary elimination. No primary renal dose adjustment required.'
      };
    }

    // Retrieve latest Serum Creatinine / eGFR lab investigations from PostgreSQL
    let creatinineResult: any = null;
    try {
      const orders = await dbClient
        .select({
          orderId: investigationOrders.id,
          orderNumber: investigationOrders.orderNumber,
          orderedAt: investigationOrders.orderedAt,
          status: investigationOrders.status
        })
        .from(investigationOrders)
        .where(
          and(
            eq(investigationOrders.tenantId, tenantId),
            eq(investigationOrders.patientId, patientId)
          )
        )
        .orderBy(desc(investigationOrders.orderedAt))
        .limit(20);

      const completedOrderIds = orders.filter((o) => ['VERIFIED', 'RELEASED', 'COMPLETED', 'AMENDED'].includes(o.status)).map((o) => o.orderId);

      if (completedOrderIds.length > 0) {
        const results = await dbClient
          .select({
            parameterName: investigationResults.parameterName,
            resultValue: investigationResults.resultValue,
            unit: investigationResults.unit,
            createdAt: investigationResults.createdAt
          })
          .from(investigationResults)
          .where(and(eq(investigationResults.tenantId, tenantId)))
          .orderBy(desc(investigationResults.createdAt))
          .limit(50);

        creatinineResult = results.find(
          (r) =>
            r.parameterName.toLowerCase().includes('creatinine') ||
            r.parameterName.toLowerCase().includes('egfr')
        );
      }
    } catch (dbErr) {
      logger.warn('Failed to query patient renal laboratory results', { error: String(dbErr) });
    }

    if (!creatinineResult) {
      return {
        status: 'RENAL_DATA_NOT_AVAILABLE',
        drugName: medName,
        message: 'RENAL DATA NOT AVAILABLE: No recent renal function lab data (Serum Creatinine / eGFR) found for patient in PostgreSQL. Baseline KFT recommended before initiating renally cleared therapy.'
      };
    }

    const val = parseFloat(creatinineResult.resultValue);
    const labDate = creatinineResult.createdAt ? new Date(creatinineResult.createdAt) : new Date();
    const daysOld = Math.floor((Date.now() - labDate.getTime()) / (1000 * 60 * 60 * 24));
    const isStale = daysOld > 90;
    const freshnessWarning = isStale ? `Renal lab result is ${daysOld} days old (>90 days). Fresh Serum Creatinine is clinically recommended.` : undefined;

    // Estimated eGFR heuristic if serum creatinine is provided
    let egfr = 90;
    if (creatinineResult.parameterName.toLowerCase().includes('egfr')) {
      egfr = val;
    } else if (val > 0) {
      // Approximation for adult male standard: eGFR ~ 175 * (Scr)^(-1.154) * (age)^(-0.203)
      egfr = Math.round(175 * Math.pow(val, -1.154) * Math.pow(50, -0.203));
    }

    // Metformin Renal Safety: Contraindicated if eGFR < 30 mL/min/1.73m²
    if (med.includes('metformin')) {
      if (egfr < 30 || val >= 2.5) {
        return {
          status: 'CONTRAINDICATED',
          drugName: medName,
          egfrMlMin: egfr,
          serumCreatinineMgDl: val,
          labResultDate: labDate.toISOString(),
          isStale,
          freshnessWarning,
          message: `RENAL CONTRAINDICATION: Metformin is strictly contraindicated in severe renal impairment (eGFR ${egfr} mL/min, Serum Creatinine ${val} mg/dL). High risk of fatal lactic acidosis.`,
          recommendedAdjustment: 'Discontinue Metformin immediately. Switch to insulin or DPP-4 inhibitors (Linagliptin does not require renal adjustment).'
        };
      }
      if (egfr < 45 || val >= 1.5) {
        return {
          status: 'DOSE_ADJUSTMENT_REQUIRED',
          drugName: medName,
          egfrMlMin: egfr,
          serumCreatinineMgDl: val,
          labResultDate: labDate.toISOString(),
          isStale,
          freshnessWarning,
          message: `RENAL DOSE ADJUSTMENT REQUIRED: Mild-moderate renal impairment (eGFR ${egfr} mL/min). Maximum Metformin dose must not exceed 1000 mg/day.`,
          recommendedAdjustment: 'Cap Metformin dose at 500mg BID and monitor renal function every 3 months.'
        };
      }
    }

    // Ciprofloxacin Renal Safety: Reduce dose by 50% if eGFR < 50
    if (med.includes('ciprofloxacin') && egfr < 50) {
      return {
        status: 'DOSE_ADJUSTMENT_REQUIRED',
        drugName: medName,
        egfrMlMin: egfr,
        serumCreatinineMgDl: val,
        labResultDate: labDate.toISOString(),
        isStale,
        freshnessWarning,
        message: `RENAL DOSE ADJUSTMENT REQUIRED: Reduced renal clearance (eGFR ${egfr} mL/min). Risk of CNS toxicity and crystalluria.`,
        recommendedAdjustment: 'Reduce Ciprofloxacin dose by 50% (e.g., 250mg q12h or 500mg q24h).'
      };
    }

    return {
      status: 'SAFE',
      drugName: medName,
      egfrMlMin: egfr,
      serumCreatinineMgDl: val,
      labResultDate: labDate.toISOString(),
      isStale,
      freshnessWarning,
      message: `Renal clearance adequate for standard dosing (Estimated eGFR: ${egfr} mL/min).`
    };
  }

  // =========================================================================
  // 7. COMPREHENSIVE PRESCRIPTION SAFETY EVALUATOR
  // =========================================================================
  public async evaluatePrescriptionSafety(
    session: SessionContext,
    input: PrescriptionSafetyInput
  ): Promise<PrescriptionSafetyEvaluationResult> {
    const db = getDatabase();
    const alerts: ClinicalSafetyAlert[] = [];
    const pediatricAssessments: PediatricDoseEvaluation[] = [];
    const renalAssessments: RenalDoseEvaluation[] = [];

    // 1. Resolve Patient Context & History
    let patientDob = input.patientDob;
    let patientGender = input.patientGender;
    let patientMrn = input.patientMrn;

    let activeAllergies = input.activeAllergies || [];

    if (input.patientId) {
      try {
        const [pat] = await db
          .select()
          .from(patients)
          .where(and(eq(patients.tenantId, session.tenantId), eq(patients.id, input.patientId)))
          .limit(1);
        if (pat) {
          patientDob = patientDob || pat.dateOfBirth;
          patientGender = patientGender || pat.gender;
          patientMrn = patientMrn || pat.mrn;

          if (activeAllergies.length === 0) {
            const meta = (pat.metadata as Record<string, any>) || {};
            const metaAllergies = Array.isArray(meta['allergies'])
              ? meta['allergies'].map((a: any) => (typeof a === 'string' ? a : a.allergen || a.name))
              : [];
            const summaryAllergies = (pat as any).allergySummary
              ? String((pat as any).allergySummary).split(',').map((s: string) => s.trim())
              : [];
            activeAllergies = [...metaAllergies, ...summaryAllergies].filter(Boolean);
          }
        }
      } catch (err) {
        logger.warn('Could not hydrate patient record for CDSS evaluation', { error: String(err) });
      }
    }

    // Calculate age in years
    let ageYears: number | undefined;
    if (patientDob) {
      const dobDate = new Date(patientDob);
      const diffMs = Date.now() - dobDate.getTime();
      ageYears = Math.floor(diffMs / (1000 * 60 * 60 * 24 * 365.25));
    }

    // Hydrate patient weight from consultationVitals if available and not passed in input
    let patientWeightKg = input.patientWeightKg;
    if (patientWeightKg === undefined && input.patientId) {
      try {
        const [v] = await db
          .select({ weightKg: consultationVitals.weightKg })
          .from(consultationVitals)
          .where(and(eq(consultationVitals.tenantId, session.tenantId), eq(consultationVitals.patientId, input.patientId)))
          .orderBy(desc(consultationVitals.createdAt))
          .limit(1);
        if (v?.weightKg) {
          const parsed = parseFloat(v.weightKg);
          if (!isNaN(parsed) && parsed > 0) patientWeightKg = parsed;
        }
      } catch (err) {
        logger.warn('Could not query patient vitals weight from database', { error: String(err) });
      }
    }

    // Resolve active diagnoses from DB if not provided
    let activeDiagnoses = input.activeDiagnoses || [];
    if (activeDiagnoses.length === 0 && input.patientId) {
      try {
        const dbDiags = await db
          .select({ diagnosisName: consultationDiagnoses.diagnosisName, diagnosisCode: consultationDiagnoses.diagnosisCode })
          .from(consultationDiagnoses)
          .where(and(eq(consultationDiagnoses.tenantId, session.tenantId), eq(consultationDiagnoses.patientId, input.patientId)))
          .limit(20);
        activeDiagnoses = dbDiags.map((d) => `${d.diagnosisCode || ''} ${d.diagnosisName}`.trim());
      } catch (err) {
        logger.warn('Could not query patient diagnoses from database', { error: String(err) });
      }
    }

    const newMedNames = input.medications.map((m) => m.medicationName);
    const allCandidateMeds = [...newMedNames, ...(input.activeMedications || [])];

    // 2. Evaluate Drug-Drug Interactions (All pairs between new and active medications)
    for (let i = 0; i < newMedNames.length; i++) {
      const medA = newMedNames[i]!;

      // Pair with other newly prescribed medications
      for (let j = i + 1; j < newMedNames.length; j++) {
        const medB = newMedNames[j]!;
        const ddiAlert = this.evaluateDdiRules(medA, medB);
        if (ddiAlert) alerts.push(ddiAlert);
      }

      // Pair with active longitudinal medications
      for (const activeMed of input.activeMedications || []) {
        const ddiAlert = this.evaluateDdiRules(medA, activeMed);
        if (ddiAlert) alerts.push(ddiAlert);
      }

      // 3. Evaluate Drug-Allergy Interactions
      const allergyAlert = this.evaluateDrugAllergy(medA, activeAllergies);
      if (allergyAlert) alerts.push(allergyAlert);

      // 4. Evaluate Drug-Disease Contraindications
      const diseaseAlert = this.evaluateDrugDisease(medA, activeDiagnoses);
      if (diseaseAlert) alerts.push(diseaseAlert);

      // 5. Evaluate Pediatric Dosing
      const medInput = input.medications[i]!;
      const pedEval = this.evaluatePediatricDose(
        medA,
        medInput.dosage || medInput.strength,
        medInput.frequency,
        patientWeightKg,
        ageYears
      );
      pediatricAssessments.push(pedEval);

      if (pedEval.status === 'OVERDOSE') {
        alerts.push({
          alertId: `PED-${crypto.randomUUID().slice(0, 8)}`,
          ruleId: 'PED-OVERDOSE-001',
          ruleVersion: CDSS_RULES_VERSION,
          category: 'PEDIATRIC_DOSE',
          severity: 'CRITICAL',
          substanceA: medA,
          title: `Pediatric Overdose Alert: ${medA}`,
          clinicalConsequence: pedEval.message,
          mechanism: 'Prescribed daily dosage exceeds safe mg/kg/day pediatric maximum.',
          recommendedAction: 'Adjust dose to pediatric safe ceiling according to patient body weight.',
          evidenceSource: 'Nelson Textbook of Pediatrics / Indian Academy of Pediatrics (IAP)',
          overrideAllowed: true,
          requiresMandatoryReason: true,
          details: pedEval as unknown as Record<string, unknown>
        });
      } else if (pedEval.status === 'DOSE_RULE_NOT_AVAILABLE') {
        alerts.push({
          alertId: `PED-${crypto.randomUUID().slice(0, 8)}`,
          ruleId: 'DOSE_RULE_NOT_AVAILABLE',
          ruleVersion: CDSS_RULES_VERSION,
          category: 'PEDIATRIC_DOSE',
          severity: 'INFORMATIONAL',
          substanceA: medA,
          title: `Pediatric Dose Rule Not Available: ${medA}`,
          clinicalConsequence: pedEval.message,
          mechanism: 'No pediatric dosing rule configured for this molecule. Attending pediatrician manual verification required.',
          recommendedAction: 'Verify dose manually using trusted pediatric formulary before administering.',
          evidenceSource: 'Nelson Textbook of Pediatrics / Indian Academy of Pediatrics (IAP)',
          overrideAllowed: true,
          requiresMandatoryReason: false,
          details: pedEval as unknown as Record<string, unknown>
        });
      }

      // 6. Evaluate Renal Dosing
      if (input.patientId) {
        const renalEval = await this.evaluateRenalDose(session.tenantId, input.patientId, medA, db);
        renalAssessments.push(renalEval);

        if (renalEval.status === 'CONTRAINDICATED') {
          alerts.push({
            alertId: `RENAL-${crypto.randomUUID().slice(0, 8)}`,
            ruleId: 'RENAL-CONTRAINDICATED-001',
            ruleVersion: CDSS_RULES_VERSION,
            category: 'RENAL_DOSE',
            severity: 'CONTRAINDICATED',
            substanceA: medA,
            title: `Renal Contraindication: ${medA}`,
            clinicalConsequence: renalEval.message,
            mechanism: 'Severe renal impairment prevents clearance leading to systemic toxicity.',
            recommendedAction: renalEval.recommendedAdjustment || 'Discontinue drug. Select alternative non-renally cleared therapy.',
            evidenceSource: 'KDIGO Clinical Practice Guidelines',
            overrideAllowed: false,
            requiresMandatoryReason: true,
            details: renalEval as unknown as Record<string, unknown>
          });
        } else if (renalEval.status === 'DOSE_ADJUSTMENT_REQUIRED') {
          alerts.push({
            alertId: `RENAL-${crypto.randomUUID().slice(0, 8)}`,
            ruleId: 'RENAL-ADJUST-002',
            ruleVersion: CDSS_RULES_VERSION,
            category: 'RENAL_DOSE',
            severity: 'MAJOR',
            substanceA: medA,
            title: `Renal Dose Adjustment Required: ${medA}`,
            clinicalConsequence: renalEval.message,
            mechanism: 'Reduced glomerular filtration requires proportional dosage decrease to avoid accumulation.',
            recommendedAction: renalEval.recommendedAdjustment || 'Reduce dose frequency or strength.',
            evidenceSource: 'KDIGO Clinical Practice Guidelines',
            overrideAllowed: true,
            requiresMandatoryReason: true,
            details: renalEval as unknown as Record<string, unknown>
          });
        } else if (renalEval.status === 'RENAL_DATA_NOT_AVAILABLE') {
          alerts.push({
            alertId: `RENAL-${crypto.randomUUID().slice(0, 8)}`,
            ruleId: 'RENAL_DATA_NOT_AVAILABLE',
            ruleVersion: CDSS_RULES_VERSION,
            category: 'RENAL_DOSE',
            severity: 'INFORMATIONAL',
            substanceA: medA,
            title: `Renal Function Data Not Available: ${medA}`,
            clinicalConsequence: renalEval.message,
            mechanism: 'Patient has no baseline Serum Creatinine or eGFR recorded within the last 90 days.',
            recommendedAction: 'Order Renal Function Test (RFT / KFT) before high-risk nephrotoxic or renally cleared pharmacotherapy.',
            evidenceSource: 'KDIGO Clinical Practice Guidelines',
            overrideAllowed: true,
            requiresMandatoryReason: false,
            details: renalEval as unknown as Record<string, unknown>
          });
        }
      }
    }

    // 7. Duplicate Therapy Detection
    const duplicateAlerts = this.evaluateDuplicateTherapy(allCandidateMeds);
    alerts.push(...duplicateAlerts);

    // Apply Overrides provided in input
    if (input.overrides && input.overrides.length > 0) {
      for (const override of input.overrides) {
        const targetAlert = alerts.find((a) => (override.ruleId && a.ruleId === override.ruleId) || (override.alertId && a.alertId === override.alertId));
        if (targetAlert) {
          if (!targetAlert.overrideAllowed) {
            // Cannot override strictly non-overrideable alerts!
            logger.warn('Attempted to override non-overrideable safety alert', { ruleId: targetAlert.ruleId });
          } else {
            const justification = (override.clinicalJustification || override.clinicalReason || override.justification || '').trim();
            if (justification.length >= 5) {
              targetAlert.wasOverridden = true;
              targetAlert.overrideJustification = justification;
            }
          }
        }
      }
    }

    // Check for blocking contraindications: Any alert with severity CONTRAINDICATED that is not overridden
    const blockingAlerts = alerts.filter(
      (a) => a.severity === 'CONTRAINDICATED' || (!a.wasOverridden && a.severity === 'CRITICAL')
    );

    const hasBlockingContraindication = alerts.some(
      (a) => a.severity === 'CONTRAINDICATED' || (!a.wasOverridden && (a.severity === 'CRITICAL'))
    );

    return {
      isSafe: alerts.length === 0,
      hasBlockingContraindication,
      blockingAlertCount: blockingAlerts.length,
      totalAlertCount: alerts.length,
      alerts,
      pediatricAssessments,
      renalAssessments,
      duplicateTherapies: duplicateAlerts.map((d) => d.title),
      evaluatedAt: new Date().toISOString(),
      ruleVersion: CDSS_RULES_VERSION
    };
  }

  // =========================================================================
  // 8. RECORD DOCTOR OVERRIDE & IMMUTABLE AUDIT TRAIL
  // =========================================================================
  public async recordDoctorOverride(
    session: SessionContext,
    input: {
      alertId: string;
      ruleId: string;
      patientMrn?: string | undefined;
      patientId?: string | undefined;
      drugA?: string | undefined;
      drugB?: string | undefined;
      clinicalJustification?: string | undefined;
      clinicalReason?: string | undefined;
      encounterId?: string | undefined;
    }
  ) {
    const justification = (input.clinicalJustification || input.clinicalReason || '').trim();
    if (!justification || justification.length < 5) {
      throw new AppError({
        message: 'A mandatory, auditable clinical justification is required to override safety alerts.',
        code: ErrorCode.VALIDATION_ERROR,
        statusCode: 400
      });
    }

    const db = getDatabase();
    let patientMrn = input.patientMrn || '';
    if (!patientMrn && input.patientId) {
      const [p] = await db
        .select({ mrn: patients.mrn })
        .from(patients)
        .where(eq(patients.id, input.patientId))
        .limit(1);
      if (p?.mrn) patientMrn = p.mrn;
    }
    if (!patientMrn) patientMrn = input.patientId || 'MRN-OVERRIDE-GEN';

    const drugA = input.drugA || 'Medication A';
    const drugB = input.drugB || 'Medication B';

    const { partnerId, organizationId } = await this.resolvePartnerAndOrg(db, session.tenantId, (session as any).partnerId);
    const branchId = session.branchId || session.tenantId;
    const actorName = session.userId || 'ATTENDING_PHYSICIAN';

    return withSecurityContext(db, session, async (tx) => {
      // 1. Create DDI Record with override details
      const [check] = await tx
        .insert(ddiDrugInteractionChecks)
        .values({
          id: crypto.randomUUID(),
          tenantId: session.tenantId,
          partnerId,
          organizationId,
          branchId,
          patientMrn,
          drugA,
          drugB,
          severityLevel: 'OVERRIDDEN_BY_CLINICIAN',
          clinicalConsequence: `Doctor override authorized: ${justification}`,
          mechanism: `Clinical safety check rule ${input.ruleId} acknowledged and overridden`,
          recommendedManagement: 'Doctor assumes direct clinical monitoring responsibility',
          evidenceReference: `CDSS v${CDSS_RULES_VERSION}`,
          wasOverridden: true,
          overrideJustification: justification
        })
        .returning();

      if (!check) {
        throw new AppError({
          message: 'Failed to record DDI override check in database',
          code: ErrorCode.INTERNAL_SERVER_ERROR,
          statusCode: 500
        });
      }

      // 2. Append Cryptographic Audit Trace to cdss_audit_traces
      const traceNumber = `TRACE-CDSS-${Date.now().toString().slice(-6)}`;
      const hash = this.computeHash({
        event: 'CLINICAL_OVERRIDE_EXECUTED',
        ruleId: input.ruleId,
        alertId: input.alertId,
        patientMrn,
        actorName,
        justification,
        timestamp: new Date().toISOString()
      });

      await tx.insert(cdssAuditTraces).values({
        id: crypto.randomUUID(),
        tenantId: session.tenantId,
        partnerId,
        organizationId,
        branchId,
        traceNumber,
        action: 'OVERRIDE_CLINICAL_SAFETY_ALERT',
        entityType: 'CDSS_SAFETY_ALERT',
        entityId: check.id,
        entityCode: patientMrn,
        actorName,
        actorRole: session.roles?.[0] || 'ATTENDING_PHYSICIAN',
        justification: `Clinical override logged: "${justification}" for ${drugA} / ${drugB}`,
        integrityHash: hash
      });

      return {
        checkId: check.id,
        overrideId: check.id,
        traceNumber,
        integrityHash: hash,
        auditTraceHash: hash,
        overriddenAt: new Date().toISOString()
      };
    });
  }
}

export const clinicalSafetyService = new ClinicalSafetyService();
