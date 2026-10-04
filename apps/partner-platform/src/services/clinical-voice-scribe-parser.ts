/**
 * Real-Time Clinical AI Voice Scribe & Natural Language Parser
 * Supports Web Speech API (Hindi / Hinglish / English - Indian Accent)
 * 
 * Extracts:
 * 1. Chief Complaints & Presenting Symptoms
 * 2. ICD-10 Clinical Diagnosis & Assessment
 * 3. Prescribed Medications (with Frequency, Timing, Duration & Jan Aushadhi generic mapping)
 * 4. Diagnostic Investigations & Pathology Tests
 * 5. Lifestyle Advice & Non-pharmacological Treatment Plan
 */

import {
  INDIAN_100_OPD_LAB_CATALOG,
  matchSymptomToICD10
} from './clinical-diagnostic-icd10-catalog.js';

import {
  POPULAR_OPD_DRUGS
} from './clinical-diagnostic-icd10-catalog.js';

export interface ScribePrescribedMedication {
  id: string;
  medicationName: string;
  strength: string;
  dosage: string;
  frequency: string;
  duration: number;
  durationUnit: string;
  beforeAfterFood: 'AFTER_FOOD' | 'BEFORE_FOOD' | 'WITH_FOOD' | 'BEDTIME' | 'EMPTY_STOMACH';
  instructions: string;
  genericSubstitute?: {
    name: string;
    janAushadhiPrice: number;
    brandPrice: number;
  };
}

export interface ParsedClinicalVoiceData {
  rawTranscript: string;
  chiefComplaint: string;
  clinicalAssessment: string;
  icd10Code: string;
  treatmentPlan: string;
  prescribedMedicines: ScribePrescribedMedication[];
  orderedLabs: string[];
  followUpDays: string;
}

// Check if Web Speech API is supported in current browser
export function isWebSpeechSupported(): boolean {
  if (typeof window === 'undefined') return false;
  return Boolean((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);
}

/**
 * Normalize Hindi Devanagari script, numbers, and clinical tokens into unified matching terms
 */
export function normalizeDoctorSpeech(text: string): string {
  if (!text) return '';
  let s = text.toLowerCase();
  
  // Convert Devanagari digits to standard digits
  s = s.replace(/०/g, '0').replace(/१/g, '1').replace(/२/g, '2').replace(/३/g, '3')
       .replace(/४/g, '4').replace(/५/g, '5').replace(/६/g, '6').replace(/७/g, '7')
       .replace(/८/g, '8').replace(/९/g, '9');

  // Unified bilingual phonetic and clinical mapping
  const devanagariRules: [RegExp, string][] = [
    [/पेरासिटामोल|पैरासिटामोल|पैरासीटामोल/g, ' paracetamol dolo '],
    [/डोलो\s*6?5?0?/g, ' dolo 650 paracetamol '],
    [/पैन|पैन\s*40|पेन\s*40|पेंटोप्राजोल|पेंटोप्रजोल/g, ' pan 40 pantoprazole '],
    [/अजिथ्रल|एजिथ्रोमाइसिन/g, ' azithral azithromycin '],
    [/ऑगमेंटिन|ऑग्मेंटिन/g, ' augmentin amoxyclav '],
    [/सिट्रिजिन|सिट्रिजीन|सेटजिन/g, ' cetzine cetirizine '],
    [/मोंटेयर|मोंटेयर-एलसी/g, ' montair-lc levocetirizine '],
    [/टेल्मा|टेलमिसार्टन/g, ' telma 40 telmisartan '],
    [/ग्लूकोमेट|ग्लाइकोमेट|मेटफॉर्मिन/g, ' glycomet 500 metformin '],
    [/ओआरएस|इलेक्ट्रल/g, ' electral ors '],
    [/एमिसेट|ओनडानसेट्रॉन/g, ' emeset 4 ondansetron '],
    [/मेफ्टाल|मेफ्टल/g, ' meftal-spas '],
    [/सीबीसी|सी\.बी\.सी\./g, ' cbc complete blood count '],
    [/एलएफटी/g, ' lft liver function test '],
    [/केएफटी/g, ' kft kidney function test '],
    [/एचबीए1सी/g, ' hba1c glycated hemoglobin '],
    [/ईसीजी/g, ' ecg 12-lead '],
    [/एक्सरे|एक्स-रे/g, ' x-ray chest '],
    [/यूएसजी|अल्ट्रासाउंड/g, ' usg ultrasound '],
    [/डेंगू/g, ' dengue ns1 '],
    [/टाइफाइड|विडाल/g, ' typhoid widal '],
    [/मलेरिया/g, ' malaria '],
    [/थायरॉयड|थायराइड/g, ' thyroid '],
    [/विटामिन/g, ' vitamin '],
    [/यूरिन|पेशाब/g, ' urine '],
    [/बुखार/g, ' bukhar fever pyrexia '],
    [/खांसी|खाँसी/g, ' cough khansi '],
    [/गले में दर्द|गला/g, ' gale me dard sore throat pharyngitis '],
    [/दस्त|लूज मोशन|पतले दस्त/g, ' loose motion dast diarrhea '],
    [/उल्टी|जी मिचलाना/g, ' vomiting ulti nausea '],
    [/पेट दर्द|पेट में दर्द|मरोड़/g, ' pet me dard stomach pain '],
    [/गैस|एसिडिटी|जलन/g, ' acidity gas heartburn gerd '],
    [/सिर दर्द|सर दर्द/g, ' sar dard headache migraine '],
    [/पेशाब में जलन/g, ' burning urine peshab me jalan uti '],
    [/जोड़ों में दर्द|घुटने में दर्द/g, ' joint pain knee pain osteoarthritis '],
    [/सुबह[- ]?शाम/g, ' subah sham 1-0-1 '],
    [/दोपहर/g, ' dopahar '],
    [/रात|रात को|सोते समय/g, ' raat ko bedtime 0-0-1 '],
    [/खाली पेट/g, ' khali pet empty stomach before food '],
    [/खाने के बाद/g, ' khane ke baad after food '],
    [/दिन/g, ' din days '],
    [/भाप|भांप/g, ' steam bhaanp '],
    [/गर्म पानी|गरम पानी/g, ' garam paani warm water ']
  ];

  for (const [re, rep] of devanagariRules) {
    s = s.replace(re, rep);
  }
  return s;
}

/**
 * Intelligent Multi-lingual Clinical NLP Parser for Doctor-Patient Consultation
 * Parses Hindi, Hinglish, and English spoken consultation into structured EMR data.
 */
export function parseDoctorVoiceTranscript(transcript: string): ParsedClinicalVoiceData {
  if (!transcript || !transcript.trim()) {
    return {
      rawTranscript: '',
      chiefComplaint: '',
      clinicalAssessment: '',
      icd10Code: '',
      treatmentPlan: '',
      prescribedMedicines: [],
      orderedLabs: [],
      followUpDays: '3 Days'
    };
  }

  const rawLower = `${transcript.toLowerCase()} ${normalizeDoctorSpeech(transcript)}`;

  // 1. CHIEF COMPLAINTS EXTRACTION
  const complaints: string[] = [];

  // Common Hindi / English symptom phrases
  if (rawLower.includes('bukhar') || rawLower.includes('fever') || rawLower.includes('pyrexia') || rawLower.includes('tap')) {
    if (rawLower.includes('3 din') || rawLower.includes('teen din') || rawLower.includes('3 days')) {
      complaints.push('High grade fever for 3 days with chills');
    } else if (rawLower.includes('2 din') || rawLower.includes('do din') || rawLower.includes('2 days')) {
      complaints.push('Fever with chills for 2 days');
    } else if (rawLower.includes('5 din') || rawLower.includes('panch din') || rawLower.includes('5 days')) {
      complaints.push('Continuous fever for 5 days');
    } else {
      complaints.push('Fever with generalized bodyache');
    }
  }

  if (rawLower.includes('gale me dard') || rawLower.includes('gala kharab') || rawLower.includes('sore throat') || rawLower.includes('throat pain')) {
    complaints.push('Sore throat & painful swallowing (pharyngitis)');
  }

  if (rawLower.includes('khansi') || rawLower.includes('cough') || rawLower.includes('balgam') || rawLower.includes('phlegm')) {
    if (rawLower.includes('sukhi') || rawLower.includes('dry')) {
      complaints.push('Dry hacking nocturnal cough');
    } else {
      complaints.push('Productive cough with phlegm');
    }
  }

  if (rawLower.includes('dast') || rawLower.includes('loose motion') || rawLower.includes('diarrhea') || rawLower.includes('diarrhoea') || rawLower.includes('pet kharab')) {
    complaints.push('Watery loose motions & spasmodic cramps');
  }

  if (rawLower.includes('ulti') || rawLower.includes('vomiting') || rawLower.includes('nausea') || rawLower.includes('ji machlana')) {
    complaints.push('Recurrent nausea and vomiting');
  }

  if (rawLower.includes('pet me dard') || rawLower.includes('stomach pain') || rawLower.includes('abdominal pain') || rawLower.includes('marod')) {
    complaints.push('Colicky abdominal discomfort & pain');
  }

  if (rawLower.includes('acidity') || rawLower.includes('jalan') || rawLower.includes('gas') || rawLower.includes('heartburn') || rawLower.includes('khatti dakar')) {
    complaints.push('Retrosternal burning, acid reflux & dyspepsia');
  }

  if (rawLower.includes('sar dard') || rawLower.includes('sir dard') || rawLower.includes('headache') || rawLower.includes('migraine')) {
    complaints.push('Throbbing frontal headache & malaise');
  }

  if (rawLower.includes('peshab me jalan') || rawLower.includes('burning urine') || rawLower.includes('uti') || rawLower.includes('peshab')) {
    complaints.push('Burning micturition & urinary frequency');
  }

  if (rawLower.includes('ghutne me dard') || rawLower.includes('joint pain') || rawLower.includes('jodo me dard') || rawLower.includes('knee pain')) {
    complaints.push('Bilateral knee joint pain & morning stiffness');
  }

  if (rawLower.includes('badan dard') || rawLower.includes('bodyache') || rawLower.includes('body ache') || rawLower.includes('thakan') || rawLower.includes('fatigue')) {
    complaints.push('Severe generalized myalgia and malaise');
  }

  if (rawLower.includes('saas phool') || rawLower.includes('saans phool') || rawLower.includes('dum ghut') || rawLower.includes('breathless') || rawLower.includes('dyspnea')) {
    complaints.push('Exertional dyspnea & acute breathlessness');
  }

  if (rawLower.includes('seene me dard') || rawLower.includes('chhati me dard') || rawLower.includes('chest pain') || rawLower.includes('chest heaviness')) {
    complaints.push('Retrosternal chest tightness & heaviness (r/o CAD)');
  }

  if (rawLower.includes('kamar me dard') || rawLower.includes('peeth me dard') || rawLower.includes('back pain') || rawLower.includes('kamar dard')) {
    complaints.push('Mechanical lower back pain (lumbago) with muscular spasm');
  }

  if (rawLower.includes('chakkar') || rawLower.includes('chakar') || rawLower.includes('dizziness') || rawLower.includes('vertigo')) {
    complaints.push('Episodic vertigo, postural imbalance & lightheadedness');
  }

  if (rawLower.includes('khujli') || rawLower.includes('daane') || rawLower.includes('rash') || rawLower.includes('allergy')) {
    complaints.push('Pruritic erythematous skin rash & allergic dermatitis');
  }

  if (rawLower.includes('sugar') || rawLower.includes('diabetes') || rawLower.includes('madhumeh')) {
    complaints.push('Type 2 Diabetes follow-up with uncontrolled glycemia');
  }

  if (rawLower.includes('bp') || rawLower.includes('blood pressure') || rawLower.includes('hypertension')) {
    complaints.push('Elevated BP recordings with lightheadedness');
  }

  const chiefComplaint = complaints.length > 0
    ? complaints.join('; ')
    : 'Patient presented with seasonal acute complaints for clinical evaluation';

  // 2. DIAGNOSIS & ICD-10 EXTRACTION
  let clinicalAssessment = '';
  let icd10Code = '';

  // Priority check against clinical symptom catalog
  const matchedDiag = matchSymptomToICD10(transcript) || matchSymptomToICD10(chiefComplaint);
  if (matchedDiag) {
    clinicalAssessment = matchedDiag.name;
    icd10Code = matchedDiag.code;
  } else if (rawLower.includes('dengue')) {
    clinicalAssessment = 'Dengue Fever / Serology Positive';
    icd10Code = 'A90';
  } else if (rawLower.includes('typhoid') || rawLower.includes('motijhara')) {
    clinicalAssessment = 'Enteric Typhoid Fever';
    icd10Code = 'A01.0';
  } else if (rawLower.includes('malaria')) {
    clinicalAssessment = 'Malaria Infection (P. Vivax / Falciparum)';
    icd10Code = 'B54';
  } else if (rawLower.includes('gastro') || rawLower.includes('dast') || rawLower.includes('loose motion')) {
    clinicalAssessment = 'Acute Infective Gastroenteritis with Dehydration';
    icd10Code = 'A09';
  } else if (rawLower.includes('fever') || rawLower.includes('bukhar') || rawLower.includes('gala') || rawLower.includes('cough')) {
    clinicalAssessment = 'Acute Viral Upper Respiratory Infection (URI) with Pyrexia';
    icd10Code = 'J06.9';
  } else if (rawLower.includes('sugar') || rawLower.includes('diabetes')) {
    clinicalAssessment = 'Type 2 Diabetes Mellitus without Complications';
    icd10Code = 'E11.9';
  } else if (rawLower.includes('bp') || rawLower.includes('hypertension')) {
    clinicalAssessment = 'Essential Primary Hypertension';
    icd10Code = 'I10';
  } else {
    clinicalAssessment = 'Acute Clinical Consultation & Symptomatic Assessment';
    icd10Code = 'Z71.9';
  }

  // 3. MEDICATIONS EXTRACTION
  const prescribedMedicines: ScribePrescribedMedication[] = [];
  const addedDrugIds = new Set<string>();

  // Determine global duration from speech if mentioned
  let detectedDuration = 3;
  if (rawLower.includes('5 din') || rawLower.includes('5 days') || rawLower.includes('panch din')) {
    detectedDuration = 5;
  } else if (rawLower.includes('7 din') || rawLower.includes('7 days') || rawLower.includes('ek hafta') || rawLower.includes('1 week')) {
    detectedDuration = 7;
  } else if (rawLower.includes('10 din') || rawLower.includes('10 days')) {
    detectedDuration = 10;
  } else if (rawLower.includes('15 din') || rawLower.includes('15 days')) {
    detectedDuration = 15;
  } else if (rawLower.includes('1 month') || rawLower.includes('ek mahina') || rawLower.includes('30 din') || rawLower.includes('30 days')) {
    detectedDuration = 30;
  }

  // Iterate over POPULAR_OPD_DRUGS catalog to match mentions
  POPULAR_OPD_DRUGS.forEach((drug) => {
    const brandTerm = drug.name.toLowerCase().replace(/tab |cap |syp |sachet /g, '').trim();
    const genTerm = drug.genericName.toLowerCase().split(' ')[0] || '';

    const isBrandMentioned = brandTerm.length >= 3 && rawLower.includes(brandTerm);
    const isGenericMentioned = genTerm.length >= 4 && rawLower.includes(genTerm);

    if ((isBrandMentioned || isGenericMentioned) && !addedDrugIds.has(drug.id)) {
      addedDrugIds.add(drug.id);

      // Frequency detection context near drug mention
      let freq = drug.frequency;
      if (rawLower.includes('subah sham') || rawLower.includes('subah shaam') || rawLower.includes('do baar') || rawLower.includes('twice daily') || rawLower.includes('bd') || rawLower.includes('bid')) {
        freq = '1 - 0 - 1';
      } else if (rawLower.includes('teeno time') || rawLower.includes('teen baar') || rawLower.includes('thrice daily') || rawLower.includes('tid')) {
        freq = '1 - 1 - 1';
      } else if (rawLower.includes('rozana subah') || rawLower.includes('ek baar subah') || rawLower.includes('once daily') || rawLower.includes('od')) {
        freq = '1 - 0 - 0';
      } else if (rawLower.includes('raat ko') || rawLower.includes('sote samay') || rawLower.includes('bedtime') || rawLower.includes('hs')) {
        freq = '0 - 0 - 1';
      } else if (rawLower.includes('zarurat') || rawLower.includes('jab dard') || rawLower.includes('sos')) {
        freq = 'SOS';
      }

      // Timing detection
      let timing: 'AFTER_FOOD' | 'BEFORE_FOOD' | 'BEDTIME' | 'EMPTY_STOMACH' = drug.beforeAfterFood;
      if (rawLower.includes('khali pet') || rawLower.includes('empty stomach') || rawLower.includes('khane se pehle') || rawLower.includes('before food')) {
        timing = 'EMPTY_STOMACH';
      } else if (rawLower.includes('khane ke baad') || rawLower.includes('after food') || rawLower.includes('after meals')) {
        timing = 'AFTER_FOOD';
      } else if (rawLower.includes('raat ko') || rawLower.includes('sote samay')) {
        timing = 'BEDTIME';
      }

      // Duration: if chronic (e.g. Telma, Glycomet), default to 30 days unless specified
      const duration = (drug.category === 'Blood Pressure' || drug.category === 'Diabetes')
        ? (detectedDuration >= 15 ? detectedDuration : 30)
        : detectedDuration;

      prescribedMedicines.push({
        id: `scribe-med-${drug.id}-${Date.now()}`,
        medicationName: drug.name,
        strength: drug.strength,
        dosage: drug.dosage,
        frequency: freq,
        duration,
        durationUnit: 'DAYS',
        beforeAfterFood: timing,
        instructions: drug.instructions || (timing === 'EMPTY_STOMACH' ? 'Morning 30 mins before breakfast' : 'Take after meals with water'),
        genericSubstitute: {
          name: drug.genericSubstituteName,
          janAushadhiPrice: drug.janAushadhiPrice,
          brandPrice: drug.brandPrice
        }
      });
    }
  });

  // Fallback defaults if specific medicines weren't caught but complaints require standard treatment
  if (prescribedMedicines.length === 0) {
    if (rawLower.includes('bukhar') || rawLower.includes('fever')) {
      const dolo = POPULAR_OPD_DRUGS.find((d) => d.id === 'drug-dolo650')!;
      const pan = POPULAR_OPD_DRUGS.find((d) => d.id === 'drug-pan40')!;
      prescribedMedicines.push({
        id: `scribe-fallback-dolo-${Date.now()}`,
        medicationName: dolo.name,
        strength: dolo.strength,
        dosage: dolo.dosage,
        frequency: '1 - 0 - 1',
        duration: detectedDuration,
        durationUnit: 'DAYS',
        beforeAfterFood: 'AFTER_FOOD',
        instructions: 'After meals if temp > 100°F',
        genericSubstitute: { name: dolo.genericSubstituteName, janAushadhiPrice: dolo.janAushadhiPrice, brandPrice: dolo.brandPrice }
      });
      prescribedMedicines.push({
        id: `scribe-fallback-pan-${Date.now()}`,
        medicationName: pan.name,
        strength: pan.strength,
        dosage: pan.dosage,
        frequency: '1 - 0 - 0',
        duration: 5,
        durationUnit: 'DAYS',
        beforeAfterFood: 'EMPTY_STOMACH',
        instructions: 'Morning 30 mins before breakfast',
        genericSubstitute: { name: pan.genericSubstituteName, janAushadhiPrice: pan.janAushadhiPrice, brandPrice: pan.brandPrice }
      });
    } else if (rawLower.includes('dast') || rawLower.includes('loose motion') || rawLower.includes('ulti')) {
      const ors = POPULAR_OPD_DRUGS.find((d) => d.id === 'drug-ors')!;
      const emeset = POPULAR_OPD_DRUGS.find((d) => d.id === 'drug-emeset4')!;
      prescribedMedicines.push({
        id: `scribe-fallback-ors-${Date.now()}`,
        medicationName: ors.name,
        strength: ors.strength,
        dosage: ors.dosage,
        frequency: 'SOS / Frequent',
        duration: 3,
        durationUnit: 'DAYS',
        beforeAfterFood: 'AFTER_FOOD',
        instructions: 'Mix 1 packet in 1L drinking water, sip continuously',
        genericSubstitute: { name: ors.genericSubstituteName, janAushadhiPrice: ors.janAushadhiPrice, brandPrice: ors.brandPrice }
      });
      prescribedMedicines.push({
        id: `scribe-fallback-eme-${Date.now()}`,
        medicationName: emeset.name,
        strength: emeset.strength,
        dosage: emeset.dosage,
        frequency: '1 - 0 - 1',
        duration: 2,
        durationUnit: 'DAYS',
        beforeAfterFood: 'BEFORE_FOOD',
        instructions: 'Dissolve in mouth 15 mins before meals',
        genericSubstitute: { name: emeset.genericSubstituteName, janAushadhiPrice: emeset.janAushadhiPrice, brandPrice: emeset.brandPrice }
      });
    }
  }

  // 4. DIAGNOSTIC LAB INVESTIGATIONS EXTRACTION
  const orderedLabs: string[] = [];
  const addedLabNames = new Set<string>();

  INDIAN_100_OPD_LAB_CATALOG.forEach((lab) => {
    const testCodeTerm = lab.testCode.toLowerCase().replace(/[^a-z0-9]/g, '');
    const shortTerm = lab.shortName.toLowerCase();
    const nameTerm = lab.name.toLowerCase();

    const isMatched =
      (shortTerm.length >= 3 && rawLower.includes(shortTerm)) ||
      (nameTerm.length >= 4 && rawLower.includes(nameTerm)) ||
      (testCodeTerm.length >= 3 && rawLower.includes(testCodeTerm));

    if (isMatched && !addedLabNames.has(lab.name)) {
      addedLabNames.add(lab.name);
      orderedLabs.push(lab.name);
    }
  });

  // Contextual lab additions based on symptoms if none explicitly identified
  if (orderedLabs.length === 0) {
    if (rawLower.includes('dengue')) {
      orderedLabs.push('Complete Blood Count (CBC / Hemogram)', 'Dengue NS1 Antigen Rapid Card');
    } else if (rawLower.includes('typhoid') || rawLower.includes('motijhara')) {
      orderedLabs.push('Complete Blood Count (CBC / Hemogram)', 'Widal Slide Agglutination Test (Typhoid)');
    } else if (rawLower.includes('bukhar') || rawLower.includes('fever')) {
      orderedLabs.push('Complete Blood Count (CBC / Hemogram)');
    } else if (rawLower.includes('sugar') || rawLower.includes('diabetes')) {
      orderedLabs.push('HbA1c (Glycated Hemoglobin)', 'Fasting Blood Sugar (FBS)');
    } else if (rawLower.includes('bp') || rawLower.includes('heart')) {
      orderedLabs.push('12-Lead Electrocardiogram (ECG)', 'Lipid Profile Complete (Cholesterol)');
    } else if (rawLower.includes('peshab') || rawLower.includes('uti')) {
      orderedLabs.push('Urine Routine & Microscopic Examination (Urine R/M)');
    }
  }

  // 5. TREATMENT PLAN & LIFESTYLE ADVICE EXTRACTION
  const adviceList: string[] = [];
  if (rawLower.includes('steam') || rawLower.includes('bhaanp') || rawLower.includes('bhanp')) {
    adviceList.push('• Steam inhalation twice daily with plain water for 5 days');
  }
  if (rawLower.includes('garam paani') || rawLower.includes('warm water') || rawLower.includes('paani')) {
    adviceList.push('• Drink plenty of warm fluids (>2.5 litres/day)');
  }
  if (rawLower.includes('khichdi') || rawLower.includes('daliya') || rawLower.includes('light diet')) {
    adviceList.push('• Soft light diet: khichdi, curd, banana, coconut water');
  }
  if (rawLower.includes('oily') || rawLower.includes('tel') || rawLower.includes('spicy') || rawLower.includes('masaledar')) {
    adviceList.push('• Avoid oily, fried, extremely spicy foods and cold drinks');
  }
  if (rawLower.includes('namak') || rawLower.includes('salt')) {
    adviceList.push('• Restrict dietary salt to < 5g/day; avoid pickles, papad and namkeen');
  }
  if (rawLower.includes('meetha') || rawLower.includes('sugar band') || rawLower.includes('mithai')) {
    adviceList.push('• Strict diabetic diet: avoid sugar, sweets, potatoes, white rice');
  }
  if (rawLower.includes('rest') || rawLower.includes('aaram')) {
    adviceList.push('• Adequate rest, avoid strenuous physical exertion');
  }

  // Follow-up review days
  let followUpDays = '3 Days';
  if (rawLower.includes('5 din baad') || rawLower.includes('5 days')) {
    followUpDays = '5 Days';
  } else if (rawLower.includes('hafta') || rawLower.includes('1 week') || rawLower.includes('7 days')) {
    followUpDays = '7 Days';
  } else if (rawLower.includes('mahina') || rawLower.includes('1 month') || rawLower.includes('30 days')) {
    followUpDays = '30 Days';
  }

  adviceList.push(`• Review in OPD after ${followUpDays} or immediately if symptoms worsen`);

  const treatmentPlan = adviceList.join('\n');

  return {
    rawTranscript: transcript,
    chiefComplaint,
    clinicalAssessment,
    icd10Code,
    treatmentPlan,
    prescribedMedicines,
    orderedLabs,
    followUpDays
  };
}

/**
 * Browser Web Speech API Controller for Indian OPD Scribe
 */
export class ClinicalWebSpeechService {
  private recognition: any = null;
  private isListening = false;
  private lang = 'hi-IN'; // Default: Hindi/Hinglish (also handles English flawlessly)
  private onResultCallback?: (interim: string, final: string) => void;
  private onErrorCallback?: (errorMsg: string) => void;
  private onStatusChangeCallback?: (isListening: boolean) => void;
  private accumulatedFinalTranscript = '';

  constructor(lang = 'hi-IN') {
    this.lang = lang;
    this.initRecognition();
  }

  private initRecognition() {
    if (typeof window === 'undefined') return;
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    this.recognition = new SpeechRecognition();
    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.lang = this.lang;

    this.recognition.onstart = () => {
      this.isListening = true;
      this.onStatusChangeCallback?.(true);
    };

    this.recognition.onend = () => {
      this.isListening = false;
      this.onStatusChangeCallback?.(false);
    };

    this.recognition.onerror = (event: any) => {
      let msg = event.error || 'Speech recognition error';
      if (event.error === 'not-allowed') {
        msg = 'Microphone permission blocked. Please allow mic access in your browser.';
      } else if (event.error === 'no-speech') {
        msg = 'No speech detected. Please speak clearly into the microphone.';
      }
      this.onErrorCallback?.(msg);
      this.isListening = false;
      this.onStatusChangeCallback?.(false);
    };

    this.recognition.onresult = (event: any) => {
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          this.accumulatedFinalTranscript += (this.accumulatedFinalTranscript ? ' ' : '') + event.results[i][0].transcript;
        } else {
          interim += event.results[i][0].transcript;
        }
      }
      this.onResultCallback?.(interim, this.accumulatedFinalTranscript);
    };
  }

  public setLanguage(lang: 'hi-IN' | 'en-IN' | 'en-US') {
    this.lang = lang;
    if (this.recognition) {
      this.recognition.lang = lang;
    }
  }

  public start(
    onResult: (interim: string, final: string) => void,
    onError: (errorMsg: string) => void,
    onStatusChange: (isListening: boolean) => void
  ): boolean {
    if (!this.recognition) {
      onError('Web Speech API is not supported in this browser. Please use Chrome or Edge.');
      return false;
    }

    this.onResultCallback = onResult;
    this.onErrorCallback = onError;
    this.onStatusChangeCallback = onStatusChange;
    this.accumulatedFinalTranscript = '';

    try {
      this.recognition.start();
      return true;
    } catch (err: any) {
      if (err.name === 'InvalidStateError') {
        // Recognition already started
        return true;
      }
      onError(err.message || 'Failed to start microphone');
      return false;
    }
  }

  public stop() {
    if (this.recognition && this.isListening) {
      try {
        this.recognition.stop();
      } catch {
        // Safe ignore
      }
    }
    this.isListening = false;
    this.onStatusChangeCallback?.(false);
  }

  public reset() {
    this.stop();
    this.accumulatedFinalTranscript = '';
  }

  public getFinalTranscript(): string {
    return this.accumulatedFinalTranscript;
  }
}
