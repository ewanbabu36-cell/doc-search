/**
 * DOC SEARCH — Master Indian Healthcare Formulary Reference
 * Curated high-frequency compendium across major Indian pharmaceutical brands and generics.
 * Provides exact matching, Levenshtein distance evaluation, and schedule classification.
 */

export interface FormularyDrugRecord {
  id: string;
  brandName: string;
  genericName: string;
  strength: string;
  dosageForm: string;
  category: string;
  scheduleType: 'OTC' | 'SCHEDULE_H' | 'SCHEDULE_H1' | 'SCHEDULE_X' | 'GENERAL';
  manufacturer?: string;
  aliases?: string[];
}

/**
 * High-Frequency Indian Pharmacy Drug Compendium (100+ Essential Formulations)
 */
export const INDIAN_FORMULARY_REFERENCE: FormularyDrugRecord[] = [
  // Analgesics / Antipyretics / NSAIDs
  { id: 'f-pcm-650-dolo', brandName: 'Dolo 650', genericName: 'Paracetamol', strength: '650 mg', dosageForm: 'TABLET', category: 'ANALGESIC', scheduleType: 'OTC', aliases: ['Dolo', 'Dolo-650'] },
  { id: 'f-pcm-650-calpol', brandName: 'Calpol 650', genericName: 'Paracetamol', strength: '650 mg', dosageForm: 'TABLET', category: 'ANALGESIC', scheduleType: 'OTC', aliases: ['Calpol', 'Calpol-650'] },
  { id: 'f-pcm-500-crocin', brandName: 'Crocin 500', genericName: 'Paracetamol', strength: '500 mg', dosageForm: 'TABLET', category: 'ANALGESIC', scheduleType: 'OTC', aliases: ['Crocin', 'Crocin Advance'] },
  { id: 'f-pcm-650-pacimol', brandName: 'Pacimol 650', genericName: 'Paracetamol', strength: '650 mg', dosageForm: 'TABLET', category: 'ANALGESIC', scheduleType: 'OTC', aliases: ['Pacimol'] },
  { id: 'f-pcm-generic', brandName: 'Paracetamol', genericName: 'Paracetamol', strength: '500 mg', dosageForm: 'TABLET', category: 'ANALGESIC', scheduleType: 'OTC', aliases: ['Acetaminophen'] },
  { id: 'f-ibu-400-brufen', brandName: 'Brufen 400', genericName: 'Ibuprofen', strength: '400 mg', dosageForm: 'TABLET', category: 'ANALGESIC', scheduleType: 'SCHEDULE_H', aliases: ['Brufen', 'Ibuprofen'] },
  { id: 'f-dic-50-voveran', brandName: 'Voveran 50', genericName: 'Diclofenac Sodium', strength: '50 mg', dosageForm: 'TABLET', category: 'ANALGESIC', scheduleType: 'SCHEDULE_H', aliases: ['Voveran', 'Diclofenac'] },
  { id: 'f-ace-zerodol-p', brandName: 'Zerodol-P', genericName: 'Aceclofenac + Paracetamol', strength: '100 mg + 325 mg', dosageForm: 'TABLET', category: 'ANALGESIC', scheduleType: 'SCHEDULE_H', aliases: ['Zerodol P'] },
  { id: 'f-ace-zerodol-sp', brandName: 'Zerodol-SP', genericName: 'Aceclofenac + Paracetamol + Serratiopeptidase', strength: '100 mg + 325 mg + 15 mg', dosageForm: 'TABLET', category: 'ANALGESIC', scheduleType: 'SCHEDULE_H', aliases: ['Zerodol SP'] },
  { id: 'f-tra-50-tramazac', brandName: 'Tramazac 50', genericName: 'Tramadol Hydrochloride', strength: '50 mg', dosageForm: 'CAPSULE', category: 'ANALGESIC', scheduleType: 'SCHEDULE_H1', aliases: ['Tramadol', 'Tramazac'] },
  { id: 'f-tra-ultracet', brandName: 'Ultracet', genericName: 'Tramadol + Paracetamol', strength: '37.5 mg + 325 mg', dosageForm: 'TABLET', category: 'ANALGESIC', scheduleType: 'SCHEDULE_H1', aliases: ['Ultracet Semi'] },

  // Gastrointestinal / PPIs / Antiemetics
  { id: 'f-pan-40-pantocid', brandName: 'Pantocid 40', genericName: 'Pantoprazole', strength: '40 mg', dosageForm: 'TABLET', category: 'GASTROINTESTINAL', scheduleType: 'SCHEDULE_H', aliases: ['Pantocid', 'Pantoprazole 40'] },
  { id: 'f-pan-40-pan', brandName: 'Pan 40', genericName: 'Pantoprazole', strength: '40 mg', dosageForm: 'TABLET', category: 'GASTROINTESTINAL', scheduleType: 'SCHEDULE_H', aliases: ['Pan-40', 'Pan D'] },
  { id: 'f-pan-40-pantop', brandName: 'Pantop 40', genericName: 'Pantoprazole', strength: '40 mg', dosageForm: 'TABLET', category: 'GASTROINTESTINAL', scheduleType: 'SCHEDULE_H', aliases: ['Pantop'] },
  { id: 'f-pan-generic', brandName: 'Pantoprazole', genericName: 'Pantoprazole', strength: '40 mg', dosageForm: 'TABLET', category: 'GASTROINTESTINAL', scheduleType: 'SCHEDULE_H', aliases: ['Pantoprazol'] },
  { id: 'f-ome-20-omez', brandName: 'Omez 20', genericName: 'Omeprazole', strength: '20 mg', dosageForm: 'CAPSULE', category: 'GASTROINTESTINAL', scheduleType: 'SCHEDULE_H', aliases: ['Omez', 'Omeprazole'] },
  { id: 'f-rab-20-razo', brandName: 'Razo 20', genericName: 'Rabeprazole', strength: '20 mg', dosageForm: 'TABLET', category: 'GASTROINTESTINAL', scheduleType: 'SCHEDULE_H', aliases: ['Razo', 'Rabeprazole', 'Rabicip'] },
  { id: 'f-eso-40-nexpro', brandName: 'Nexpro 40', genericName: 'Esomeprazole', strength: '40 mg', dosageForm: 'TABLET', category: 'GASTROINTESTINAL', scheduleType: 'SCHEDULE_H', aliases: ['Nexpro', 'Esomeprazole'] },
  { id: 'f-ond-4-emeset', brandName: 'Emeset 4', genericName: 'Ondansetron', strength: '4 mg', dosageForm: 'TABLET', category: 'GASTROINTESTINAL', scheduleType: 'SCHEDULE_H', aliases: ['Emeset', 'Ondansetron', 'Vomikind'] },
  { id: 'f-dom-10-motilium', brandName: 'Motilium', genericName: 'Domperidone', strength: '10 mg', dosageForm: 'TABLET', category: 'GASTROINTESTINAL', scheduleType: 'SCHEDULE_H', aliases: ['Domperidone', 'Vomistop'] },
  { id: 'f-ran-150-zantac', brandName: 'Rantac 150', genericName: 'Ranitidine', strength: '150 mg', dosageForm: 'TABLET', category: 'GASTROINTESTINAL', scheduleType: 'SCHEDULE_H', aliases: ['Rantac', 'Aciloc', 'Ranitidine'] },

  // Antibiotics & Antimicrobials
  { id: 'f-amx-625-augmentin', brandName: 'Augmentin 625 Duo', genericName: 'Amoxicillin + Potassium Clavulanate', strength: '500 mg + 125 mg', dosageForm: 'TABLET', category: 'ANTIBIOTIC', scheduleType: 'SCHEDULE_H1', aliases: ['Augmentin', 'Augmentin 625'] },
  { id: 'f-amx-625-clavam', brandName: 'Clavam 625', genericName: 'Amoxicillin + Potassium Clavulanate', strength: '500 mg + 125 mg', dosageForm: 'TABLET', category: 'ANTIBIOTIC', scheduleType: 'SCHEDULE_H1', aliases: ['Clavam', 'Clavam-625'] },
  { id: 'f-amx-500-mox', brandName: 'Mox 500', genericName: 'Amoxicillin', strength: '500 mg', dosageForm: 'CAPSULE', category: 'ANTIBIOTIC', scheduleType: 'SCHEDULE_H', aliases: ['Mox', 'Amoxicillin'] },
  { id: 'f-azi-500-azithral', brandName: 'Azithral 500', genericName: 'Azithromycin', strength: '500 mg', dosageForm: 'TABLET', category: 'ANTIBIOTIC', scheduleType: 'SCHEDULE_H1', aliases: ['Azithral', 'Azithral-500'] },
  { id: 'f-azi-500-azee', brandName: 'Azee 500', genericName: 'Azithromycin', strength: '500 mg', dosageForm: 'TABLET', category: 'ANTIBIOTIC', scheduleType: 'SCHEDULE_H1', aliases: ['Azee', 'Azithromycin'] },
  { id: 'f-cef-200-taxim-o', brandName: 'Taxim-O 200', genericName: 'Cefixime', strength: '200 mg', dosageForm: 'TABLET', category: 'ANTIBIOTIC', scheduleType: 'SCHEDULE_H1', aliases: ['Taxim O', 'Cefixime', 'Zifi 200'] },
  { id: 'f-cip-500-ciplox', brandName: 'Ciplox 500', genericName: 'Ciprofloxacin', strength: '500 mg', dosageForm: 'TABLET', category: 'ANTIBIOTIC', scheduleType: 'SCHEDULE_H1', aliases: ['Ciplox', 'Cifran 500', 'Ciprofloxacin'] },
  { id: 'f-lev-500-levomac', brandName: 'Levomac 500', genericName: 'Levofloxacin', strength: '500 mg', dosageForm: 'TABLET', category: 'ANTIBIOTIC', scheduleType: 'SCHEDULE_H1', aliases: ['Levomac', 'L-Cin 500', 'Levofloxacin'] },
  { id: 'f-met-400-flagyl', brandName: 'Flagyl 400', genericName: 'Metronidazole', strength: '400 mg', dosageForm: 'TABLET', category: 'ANTIBIOTIC', scheduleType: 'SCHEDULE_H', aliases: ['Flagyl', 'Metrogyl 400', 'Metronidazole'] },
  { id: 'f-dox-100-doxy', brandName: 'Doxicip 100', genericName: 'Doxycycline', strength: '100 mg', dosageForm: 'CAPSULE', category: 'ANTIBIOTIC', scheduleType: 'SCHEDULE_H', aliases: ['Doxicip', 'Doxycycline', 'Doxy-1'] },

  // Cardiovascular & Antihypertensive
  { id: 'f-tel-40-telma', brandName: 'Telma 40', genericName: 'Telmisartan', strength: '40 mg', dosageForm: 'TABLET', category: 'CARDIOVASCULAR', scheduleType: 'SCHEDULE_H', aliases: ['Telma', 'Telma-40', 'Telmisartan'] },
  { id: 'f-tel-40-telmikind', brandName: 'Telmikind 40', genericName: 'Telmisartan', strength: '40 mg', dosageForm: 'TABLET', category: 'CARDIOVASCULAR', scheduleType: 'SCHEDULE_H', aliases: ['Telmikind', 'Telpres 40'] },
  { id: 'f-aml-5-amlong', brandName: 'Amlong 5', genericName: 'Amlodipine', strength: '5 mg', dosageForm: 'TABLET', category: 'CARDIOVASCULAR', scheduleType: 'SCHEDULE_H', aliases: ['Amlong', 'Stamlo 5', 'Amlodipine'] },
  { id: 'f-los-50-losacar', brandName: 'Losacar 50', genericName: 'Losartan Potassium', strength: '50 mg', dosageForm: 'TABLET', category: 'CARDIOVASCULAR', scheduleType: 'SCHEDULE_H', aliases: ['Losacar', 'Losartan', 'Repace'] },
  { id: 'f-ate-50-tenormin', brandName: 'Tenormin 50', genericName: 'Atenolol', strength: '50 mg', dosageForm: 'TABLET', category: 'CARDIOVASCULAR', scheduleType: 'SCHEDULE_H', aliases: ['Tenormin', 'Atenolol', 'Betacard'] },
  { id: 'f-met-50-metolar', brandName: 'Metolar 50', genericName: 'Metoprolol Tartrate', strength: '50 mg', dosageForm: 'TABLET', category: 'CARDIOVASCULAR', scheduleType: 'SCHEDULE_H', aliases: ['Metolar', 'Metoprolol', 'Betaloc'] },
  { id: 'f-ram-5-cardace', brandName: 'Cardace 5', genericName: 'Ramipril', strength: '5 mg', dosageForm: 'TABLET', category: 'CARDIOVASCULAR', scheduleType: 'SCHEDULE_H', aliases: ['Cardace', 'Ramipril'] },
  { id: 'f-ato-10-atorva', brandName: 'Atorva 10', genericName: 'Atorvastatin', strength: '10 mg', dosageForm: 'TABLET', category: 'CARDIOVASCULAR', scheduleType: 'SCHEDULE_H', aliases: ['Atorva', 'Lipivas', 'Atorvastatin', 'Storvas'] },
  { id: 'f-ros-10-rosuvas', brandName: 'Rosuvas 10', genericName: 'Rosuvastatin', strength: '10 mg', dosageForm: 'TABLET', category: 'CARDIOVASCULAR', scheduleType: 'SCHEDULE_H', aliases: ['Rosuvas', 'Rosuvastatin', 'Rosavel'] },

  // Antidiabetic
  { id: 'f-met-500-glycomet', brandName: 'Glycomet 500', genericName: 'Metformin Hydrochloride', strength: '500 mg', dosageForm: 'TABLET', category: 'ANTIDIABETIC', scheduleType: 'SCHEDULE_H', aliases: ['Glycomet', 'Metformin', 'Gluconorm'] },
  { id: 'f-met-850-glycomet', brandName: 'Glycomet 850', genericName: 'Metformin Hydrochloride', strength: '850 mg', dosageForm: 'TABLET', category: 'ANTIDIABETIC', scheduleType: 'SCHEDULE_H', aliases: ['Glycomet SR'] },
  { id: 'f-gli-1-amaryl', brandName: 'Amaryl 1', genericName: 'Glimepiride', strength: '1 mg', dosageForm: 'TABLET', category: 'ANTIDIABETIC', scheduleType: 'SCHEDULE_H', aliases: ['Amaryl', 'Glimepiride', 'Glimestar'] },
  { id: 'f-gli-2-amaryl', brandName: 'Amaryl 2', genericName: 'Glimepiride', strength: '2 mg', dosageForm: 'TABLET', category: 'ANTIDIABETIC', scheduleType: 'SCHEDULE_H', aliases: ['Amaryl 2mg'] },
  { id: 'f-ten-20-tenglyn', brandName: 'Tenglyn 20', genericName: 'Teneligliptin', strength: '20 mg', dosageForm: 'TABLET', category: 'ANTIDIABETIC', scheduleType: 'SCHEDULE_H', aliases: ['Tenglyn', 'Teneligliptin', 'Ziten'] },
  { id: 'f-sit-100-januvia', brandName: 'Januvia 100', genericName: 'Sitagliptin', strength: '100 mg', dosageForm: 'TABLET', category: 'ANTIDIABETIC', scheduleType: 'SCHEDULE_H', aliases: ['Januvia', 'Sitagliptin', 'Istavel'] },
  { id: 'f-vil-50-galvus', brandName: 'Galvus 50', genericName: 'Vildagliptin', strength: '50 mg', dosageForm: 'TABLET', category: 'ANTIDIABETIC', scheduleType: 'SCHEDULE_H', aliases: ['Galvus', 'Vildagliptin'] },

  // Respiratory & Antiallergic
  { id: 'f-cet-10-cetzine', brandName: 'Cetzine 10', genericName: 'Cetirizine', strength: '10 mg', dosageForm: 'TABLET', category: 'RESPIRATORY', scheduleType: 'SCHEDULE_H', aliases: ['Cetzine', 'Cetirizine', 'Alerid', 'Okacet'] },
  { id: 'f-lev-5-levocet', brandName: 'Levocet 5', genericName: 'Levocetirizine', strength: '5 mg', dosageForm: 'TABLET', category: 'RESPIRATORY', scheduleType: 'SCHEDULE_H', aliases: ['Levocet', 'Levocetirizine', 'Teczine', '1-AL'] },
  { id: 'f-mon-10-montair', brandName: 'Montair 10', genericName: 'Montelukast', strength: '10 mg', dosageForm: 'TABLET', category: 'RESPIRATORY', scheduleType: 'SCHEDULE_H', aliases: ['Montair', 'Montelukast', 'Telekast'] },
  { id: 'f-mon-montair-lc', brandName: 'Montair-LC', genericName: 'Montelukast + Levocetirizine', strength: '10 mg + 5 mg', dosageForm: 'TABLET', category: 'RESPIRATORY', scheduleType: 'SCHEDULE_H', aliases: ['Montair LC', 'Montek-LC'] },
  { id: 'f-sal-2-asthalin', brandName: 'Asthalin 2', genericName: 'Salbutamol', strength: '2 mg', dosageForm: 'TABLET', category: 'RESPIRATORY', scheduleType: 'SCHEDULE_H', aliases: ['Asthalin', 'Salbutamol', 'Ventorlin'] },
  { id: 'f-sal-asthalin-inhaler', brandName: 'Asthalin Inhaler', genericName: 'Salbutamol Inhaler', strength: '100 mcg', dosageForm: 'INHALER', category: 'RESPIRATORY', scheduleType: 'SCHEDULE_H', aliases: ['Asthalin CFC Free Inhaler'] },
  { id: 'f-bud-budecort', brandName: 'Budecort 200', genericName: 'Budesonide', strength: '200 mcg', dosageForm: 'INHALER', category: 'RESPIRATORY', scheduleType: 'SCHEDULE_H', aliases: ['Budecort', 'Budesonide'] },

  // Sedatives / Anxiolytics (High-Risk Schedule H / H1 / X)
  { id: 'f-alp-025-alprax', brandName: 'Alprax 0.25', genericName: 'Alprazolam', strength: '0.25 mg', dosageForm: 'TABLET', category: 'GENERAL', scheduleType: 'SCHEDULE_H1', aliases: ['Alprax', 'Alprazolam', 'Restyl'] },
  { id: 'f-clo-05-clonafit', brandName: 'Clonafit 0.5', genericName: 'Clonazepam', strength: '0.5 mg', dosageForm: 'TABLET', category: 'GENERAL', scheduleType: 'SCHEDULE_H1', aliases: ['Clonafit', 'Clonazepam', 'Rivotril'] },
  { id: 'f-lor-1-ativan', brandName: 'Ativan 1', genericName: 'Lorazepam', strength: '1 mg', dosageForm: 'TABLET', category: 'GENERAL', scheduleType: 'SCHEDULE_H1', aliases: ['Ativan', 'Lorazepam', 'Trapex'] },

  // Vitamins & Supplements
  { id: 'f-vit-shelcal-500', brandName: 'Shelcal 500', genericName: 'Calcium + Vitamin D3', strength: '500 mg + 250 IU', dosageForm: 'TABLET', category: 'VITAMINS_MINERALS', scheduleType: 'OTC', aliases: ['Shelcal', 'Calcium'] },
  { id: 'f-vit-limcee-500', brandName: 'Limcee 500', genericName: 'Vitamin C (Ascorbic Acid)', strength: '500 mg', dosageForm: 'TABLET', category: 'VITAMINS_MINERALS', scheduleType: 'OTC', aliases: ['Limcee', 'Celin', 'Vitamin C'] },
  { id: 'f-vit-becosules', brandName: 'Becosules', genericName: 'Vitamin B-Complex + Vitamin C', strength: 'Standard', dosageForm: 'CAPSULE', category: 'VITAMINS_MINERALS', scheduleType: 'OTC', aliases: ['Becosules Z', 'B Complex'] },
  { id: 'f-vit-neurobion', brandName: 'Neurobion Forte', genericName: 'Vitamin B1 + B6 + B12', strength: 'Standard', dosageForm: 'TABLET', category: 'VITAMINS_MINERALS', scheduleType: 'OTC', aliases: ['Neurobion'] }
];

/**
 * Normalized token cache for rapid lookup
 */
const NORMALIZED_FORMULARY_INDEX = new Map<string, FormularyDrugRecord>();

for (const drug of INDIAN_FORMULARY_REFERENCE) {
  NORMALIZED_FORMULARY_INDEX.set(normalizeToken(drug.brandName), drug);
  NORMALIZED_FORMULARY_INDEX.set(normalizeToken(drug.genericName), drug);
  if (drug.aliases) {
    for (const alias of drug.aliases) {
      NORMALIZED_FORMULARY_INDEX.set(normalizeToken(alias), drug);
    }
  }
}

export function normalizeToken(token: string): string {
  return token
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .trim();
}

/**
 * Compute Levenshtein distance between two strings
 */
export function computeLevenshteinDistance(a: string, b: string): number {
  const an = a.length;
  const bn = b.length;
  if (an === 0) return bn;
  if (bn === 0) return an;

  const matrix: number[][] = [];
  for (let i = 0; i <= an; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= bn; j++) {
    matrix[0]![j] = j;
  }

  for (let i = 1; i <= an; i++) {
    for (let j = 1; j <= bn; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i]![j] = Math.min(
        matrix[i - 1]![j]! + 1, // deletion
        matrix[i]![j - 1]! + 1, // insertion
        matrix[i - 1]![j - 1]! + cost // substitution
      );
    }
  }

  return matrix[an]![bn]!;
}

/**
 * Search candidate drugs in the Indian Formulary
 */
export interface FormularyMatchResult {
  matchType: 'EXACT' | 'FUZZY' | 'AMBIGUOUS' | 'NONE';
  matchedDrug?: FormularyDrugRecord | undefined;
  candidateMatches: Array<{ drug: FormularyDrugRecord; similarity: number }>;
  score: number;
}

export function matchFormularyMedicine(rawToken: string): FormularyMatchResult {
  const norm = normalizeToken(rawToken);
  if (!norm || norm.length < 3) {
    return { matchType: 'NONE', candidateMatches: [], score: 0 };
  }

  // 1. Direct exact lookup
  if (NORMALIZED_FORMULARY_INDEX.has(norm)) {
    const matched = NORMALIZED_FORMULARY_INDEX.get(norm)!;
    return {
      matchType: 'EXACT',
      matchedDrug: matched,
      candidateMatches: [{ drug: matched, similarity: 1.0 }],
      score: 1.0
    };
  }

  // 2. Fuzzy similarity candidate search across formulary
  const candidates: Array<{ drug: FormularyDrugRecord; similarity: number; isPrefixStem?: boolean }> = [];

  for (const drug of INDIAN_FORMULARY_REFERENCE) {
    const targets = [drug.brandName, drug.genericName, ...(drug.aliases || [])];
    let maxSim = 0;
    let isStem = false;

    for (const target of targets) {
      const normTarget = normalizeToken(target);
      const isPrefix = norm.length >= 3 && normTarget.startsWith(norm);

      // Skip if vastly different length unless it is a prefix stem
      if (!isPrefix && Math.abs(norm.length - normTarget.length) > 4) continue;

      let sim = 0;
      if (Math.abs(norm.length - normTarget.length) <= 4) {
        const dist = computeLevenshteinDistance(norm, normTarget);
        const maxLen = Math.max(norm.length, normTarget.length);
        sim = (maxLen - dist) / maxLen;
      }

      if (isPrefix && normTarget.length > norm.length) {
        const stemSim = 0.65 + (norm.length / normTarget.length) * 0.25;
        if (stemSim > sim) {
          sim = stemSim;
          isStem = true;
        }
      }

      if (sim > maxSim) {
        maxSim = sim;
      }
    }

    // Plausible candidate threshold
    if (maxSim >= 0.65) {
      candidates.push({ drug, similarity: Math.round(maxSim * 100) / 100, isPrefixStem: isStem });
    }
  }

  // Sort descending by similarity
  candidates.sort((a, b) => b.similarity - a.similarity);

  if (candidates.length === 0) {
    return { matchType: 'NONE', candidateMatches: [], score: 0 };
  }

  const best = candidates[0]!;

  // If best match was identified as an incomplete prefix stem, return AMBIGUOUS
  if (best.isPrefixStem) {
    return {
      matchType: 'AMBIGUOUS',
      matchedDrug: best.drug,
      candidateMatches: candidates.slice(0, 3),
      score: best.similarity
    };
  }

  // Ambiguity check: if top 2 candidates have virtually identical similarity (>0.80 and delta < 0.05) from different families
  if (
    candidates.length > 1 &&
    candidates[1]!.similarity >= 0.80 &&
    best.similarity - candidates[1]!.similarity < 0.05 &&
    best.drug.genericName !== candidates[1]!.drug.genericName
  ) {
    return {
      matchType: 'AMBIGUOUS',
      matchedDrug: best.drug,
      candidateMatches: candidates.slice(0, 3),
      score: best.similarity
    };
  }

  return {
    matchType: 'FUZZY',
    matchedDrug: best.drug,
    candidateMatches: candidates.slice(0, 3),
    score: best.similarity
  };
}
