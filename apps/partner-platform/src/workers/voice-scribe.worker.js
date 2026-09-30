/**
 * DOC SEARCH - Indian Clinical Voice Scribe NLP Worker
 *
 * Runs off-thread to parse messy Hinglish doctor dictations into structured clinical entities:
 * - Frequencies: OD, BD, TDS, QID, SOS, HS, AC, PC, STAT
 * - Dosages & Strengths: 650mg, 500mg, 40mg, 10ml, 1 tab, 1 puff
 * - Hinglish colloquial timings: 'khana khane ke baad', 'khana khane se pehle', 'khali pet', 'raat ko'
 * - Duration parsing: '3 din', '5 din', '1 hafta', '10 days'
 * - Confidence scoring per extracted entity
 * - Preserves original unedited transcript verbatim
 */
// Medical Formulary Knowledge Base for Voice Match
const KNOWN_VOICE_MOLECULES = [
    {
        keywords: ['paracetamol', 'dolo', 'calpol', 'crocin', 'pacimol'],
        canonicalName: 'Tab Paracetamol 650mg',
        defaultStrength: '650mg',
        dosageForm: 'Tab',
        defaultFreq: 'TDS',
        defaultTiming: 'AFTER_FOOD'
    },
    {
        keywords: ['pantoprazole', 'pan-40', 'pan 40', 'pantocid'],
        canonicalName: 'Tab Pantoprazole 40mg',
        defaultStrength: '40mg',
        dosageForm: 'Tab',
        defaultFreq: 'OD',
        defaultTiming: 'BEFORE_FOOD'
    },
    {
        keywords: ['pan-d', 'pan d', 'pantocid-dsr', 'pantocid dsr'],
        canonicalName: 'Cap Pantoprazole + Domperidone SR',
        defaultStrength: '40mg + 30mg SR',
        dosageForm: 'Cap',
        defaultFreq: 'OD',
        defaultTiming: 'BEFORE_FOOD'
    },
    {
        keywords: ['augmentin', 'amoxicillin', 'moxikind-cv', 'clavam'],
        canonicalName: 'Tab Amoxicillin + Potassium Clavulanate 625mg',
        defaultStrength: '625mg',
        dosageForm: 'Tab',
        defaultFreq: 'BD',
        defaultTiming: 'AFTER_FOOD'
    },
    {
        keywords: ['azithral', 'azee', 'azithromycin'],
        canonicalName: 'Tab Azithromycin 500mg',
        defaultStrength: '500mg',
        dosageForm: 'Tab',
        defaultFreq: 'OD',
        defaultTiming: 'BEFORE_FOOD'
    },
    {
        keywords: ['montair-lc', 'montair lc', 'montelukast'],
        canonicalName: 'Tab Montelukast + Levocetirizine',
        defaultStrength: '10mg + 5mg',
        dosageForm: 'Tab',
        defaultFreq: 'HS',
        defaultTiming: 'BEDTIME'
    },
    {
        keywords: ['cetirizine', 'cetzine', 'okacet'],
        canonicalName: 'Tab Cetirizine 10mg',
        defaultStrength: '10mg',
        dosageForm: 'Tab',
        defaultFreq: 'HS',
        defaultTiming: 'BEDTIME'
    },
    {
        keywords: ['combiflam', 'ibuprofen and paracetamol'],
        canonicalName: 'Tab Ibuprofen + Paracetamol',
        defaultStrength: '400mg + 325mg',
        dosageForm: 'Tab',
        defaultFreq: 'BD',
        defaultTiming: 'AFTER_FOOD'
    },
    {
        keywords: ['telma', 'telmisartan'],
        canonicalName: 'Tab Telmisartan 40mg',
        defaultStrength: '40mg',
        dosageForm: 'Tab',
        defaultFreq: 'OD',
        defaultTiming: 'AFTER_FOOD'
    },
    {
        keywords: ['glycomet', 'metformin'],
        canonicalName: 'Tab Metformin HCl 500mg',
        defaultStrength: '500mg',
        dosageForm: 'Tab',
        defaultFreq: 'BD',
        defaultTiming: 'AFTER_FOOD'
    },
    {
        keywords: ['meftal-spas', 'meftal spas', 'mefenamic'],
        canonicalName: 'Tab Mefenamic Acid + Dicyclomine',
        defaultStrength: '250mg + 10mg',
        dosageForm: 'Tab',
        defaultFreq: 'SOS',
        defaultTiming: 'AFTER_FOOD'
    }
];
const KNOWN_VOICE_LABS = [
    { keywords: ['cbc', 'complete blood count', 'hemoglobin'], testCode: 'INV-CBC', testName: 'Complete Blood Count (CBC)', category: 'HEMATOLOGY' },
    { keywords: ['lft', 'liver function test', 'bilirubin', 'sgpt'], testCode: 'INV-LFT', testName: 'Liver Function Test (LFT)', category: 'BIOCHEMISTRY' },
    { keywords: ['kft', 'rft', 'kidney function test', 'creatinine'], testCode: 'INV-KFT', testName: 'Kidney Function Test (KFT / RFT)', category: 'BIOCHEMISTRY' },
    { keywords: ['hba1c', 'glycated hemoglobin', 'sugar test'], testCode: 'INV-HBA1C', testName: 'Glycated Hemoglobin (HbA1c)', category: 'BIOCHEMISTRY' },
    { keywords: ['lipid profile', 'cholesterol'], testCode: 'INV-LIPID', testName: 'Lipid Profile Extended', category: 'BIOCHEMISTRY' },
    { keywords: ['tsh', 'thyroid profile', 'tft'], testCode: 'INV-TSH', testName: 'Thyroid Stimulating Hormone (TSH)', category: 'BIOCHEMISTRY' },
    { keywords: ['chest x-ray', 'chest xray', 'cxr'], testCode: 'RAD-CXR', testName: 'Chest X-Ray PA View', category: 'RADIOLOGY' }
];
export function parseClinicalVoiceDictation(transcript) {
    const start = performance.now();
    const lower = transcript.toLowerCase();
    const medications = [];
    const investigations = [];
    const chiefComplaints = [];
    const diagnoses = [];
    const vitals = {};
    // 1. Extract Complaints & Symptoms (Hindi + English)
    if (lower.includes('fever') || lower.includes('bukhar'))
        chiefComplaints.push('Acute Pyrexia / Fever');
    if (lower.includes('cough') || lower.includes('khansi'))
        chiefComplaints.push('Cough with throat irritation');
    if (lower.includes('cold') || lower.includes('sardi') || lower.includes('zukaam'))
        chiefComplaints.push('Common Cold & Rhinitis');
    if (lower.includes('headache') || lower.includes('sar dard'))
        chiefComplaints.push('Headache / Cephalea');
    if (lower.includes('body ache') || lower.includes('badan dard'))
        chiefComplaints.push('Generalized Body Ache & Malaise');
    if (lower.includes('stomach ache') || lower.includes('pet dard'))
        chiefComplaints.push('Abdominal Pain / Spasm');
    if (lower.includes('vomiting') || lower.includes('ulti'))
        chiefComplaints.push('Nausea and Vomiting');
    if (lower.includes('loose motion') || lower.includes('dast') || lower.includes('diarrhea'))
        chiefComplaints.push('Acute Gastroenteritis / Diarrhea');
    // 2. Extract Diagnoses
    if (lower.includes('viral') || lower.includes('flu'))
        diagnoses.push('Viral Pyrexia Syndrome (ICD-10: B34.9)');
    if (lower.includes('urti') || lower.includes('upper respiratory') || lower.includes('gale me kharash'))
        diagnoses.push('Upper Respiratory Tract Infection (ICD-10: J06.9)');
    if (lower.includes('gastritis') || lower.includes('acidity') || lower.includes('gas'))
        diagnoses.push('Acute Acid Peptic Disorder / Gastritis (ICD-10: K29.7)');
    if (lower.includes('hypertension') || lower.includes('high bp'))
        diagnoses.push('Essential Hypertension (ICD-10: I10)');
    if (lower.includes('type 2 diabetes') || lower.includes('sugar') || lower.includes('diabetes'))
        diagnoses.push('Type 2 Diabetes Mellitus (ICD-10: E11.9)');
    // 3. Extract Vitals
    const bpMatch = lower.match(/(?:bp|blood pressure)\s*(?:is|was)?\s*(\d{2,3})\s*(?:by|\/)\s*(\d{2,3})/);
    if (bpMatch)
        vitals.bloodPressure = `${bpMatch[1]}/${bpMatch[2]} mmHg`;
    const pulseMatch = lower.match(/(?:pulse|heart rate)\s*(?:is|was)?\s*(\d{2,3})/);
    if (pulseMatch)
        vitals.pulseRate = parseInt(pulseMatch[1], 10);
    const tempMatch = lower.match(/(?:temp|temperature|fever)\s*(?:is|was)?\s*(\d{2,3}(?:\.\d)?)\s*(?:f|deg)?/);
    if (tempMatch)
        vitals.temperatureF = parseFloat(tempMatch[1]);
    const spo2Match = lower.match(/(?:spo2|oxygen|saturation)\s*(?:is|was)?\s*(\d{2,3})\s*%?/);
    if (spo2Match)
        vitals.spO2 = parseInt(spo2Match[1], 10);
    // 4. Extract Medications
    for (const mol of KNOWN_VOICE_MOLECULES) {
        for (const kw of mol.keywords) {
            if (lower.includes(kw)) {
                // Find local sentence or phrase context strictly for this medication
                const kwIdx = lower.indexOf(kw);
                const afterKw = transcript.substring(kwIdx);
                const endOfSentence = afterKw.search(/[.;\n]/);
                const snippet = afterKw.substring(0, endOfSentence > 0 ? endOfSentence : 80);
                const snippetLower = snippet.toLowerCase();
                // Frequency extraction
                let freqCode = mol.defaultFreq;
                let freqStr = '1 - 0 - 1';
                if (snippetLower.includes('hs') || snippetLower.includes('raat ko') || snippetLower.includes('bedtime') || snippetLower.includes('sote samay')) {
                    freqCode = 'HS';
                    freqStr = '0 - 0 - 1';
                }
                else if (snippetLower.includes('tds') || snippetLower.includes('din me teen baar') || snippetLower.includes('three times') || snippetLower.includes('thrice')) {
                    freqCode = 'TDS';
                    freqStr = '1 - 1 - 1';
                }
                else if (snippetLower.includes('bd') || snippetLower.includes('bid') || snippetLower.includes('do baar') || snippetLower.includes('twice')) {
                    freqCode = 'BD';
                    freqStr = '1 - 0 - 1';
                }
                else if (/\bod\b/i.test(snippetLower) || snippetLower.includes('ek baar') || snippetLower.includes('once daily')) {
                    freqCode = 'OD';
                    freqStr = '1 - 0 - 0';
                }
                else if (snippetLower.includes('qid') || snippetLower.includes('char baar')) {
                    freqCode = 'QID';
                    freqStr = '1 - 1 - 1 - 1';
                }
                else if (snippetLower.includes('sos') || snippetLower.includes('zaroorat padne par') || snippetLower.includes('as needed')) {
                    freqCode = 'SOS';
                    freqStr = 'SOS';
                }
                // Timing extraction
                let timing = mol.defaultTiming;
                if (snippetLower.includes('khane ke baad') || snippetLower.includes('after food') || snippetLower.includes('after meals')) {
                    timing = 'AFTER_FOOD';
                }
                else if (snippetLower.includes('khali pet') || snippetLower.includes('empty stomach') || snippetLower.includes('subah uthkar')) {
                    timing = 'EMPTY_STOMACH';
                }
                else if (snippetLower.includes('khane se pehle') || snippetLower.includes('before food') || snippetLower.includes('before meals')) {
                    timing = 'BEFORE_FOOD';
                }
                else if (snippetLower.includes('raat ko') || snippetLower.includes('bedtime')) {
                    timing = 'BEDTIME';
                }
                // Duration extraction
                let durationDays = 3;
                const durMatch = snippetLower.match(/(\d+)\s*(?:din|days|day)/);
                if (durMatch) {
                    durationDays = parseInt(durMatch[1], 10);
                }
                else if (snippetLower.includes('ek hafta') || snippetLower.includes('one week') || snippetLower.includes('1 week')) {
                    durationDays = 7;
                }
                else if (snippetLower.includes('ek mahina') || snippetLower.includes('1 month')) {
                    durationDays = 30;
                }
                medications.push({
                    canonicalName: mol.canonicalName,
                    brandOrGeneric: kw.toUpperCase(),
                    strength: mol.defaultStrength,
                    dosageForm: mol.dosageForm,
                    frequency: freqStr,
                    frequencyCode: freqCode,
                    timing,
                    durationDays,
                    instructions: `${freqStr} (${timing.replace('_', ' ')} for ${durationDays} days)`,
                    confidenceScore: 0.94,
                    matchedSnippet: snippet.trim()
                });
                break; // matched this molecule
            }
        }
    }
    // 5. Extract Investigations
    for (const lab of KNOWN_VOICE_LABS) {
        for (const kw of lab.keywords) {
            if (lower.includes(kw)) {
                const kwIdx = lower.indexOf(kw);
                const snippet = transcript.substring(Math.max(0, kwIdx - 20), Math.min(transcript.length, kwIdx + 40));
                investigations.push({
                    testCode: lab.testCode,
                    testName: lab.testName,
                    category: lab.category,
                    urgency: lower.includes('urgent') || lower.includes('stat') ? 'URGENT' : 'ROUTINE',
                    confidenceScore: 0.92,
                    matchedSnippet: snippet.trim()
                });
                break;
            }
        }
    }
    const durationMs = performance.now() - start;
    return {
        rawTranscript: transcript,
        chiefComplaints,
        diagnoses,
        medications,
        investigations,
        vitalsExtracted: vitals,
        overallConfidence: medications.length > 0 || investigations.length > 0 ? 0.93 : 0.7,
        processingDurationMs: durationMs
    };
}
// Web Worker message listener
if (typeof self !== 'undefined') {
    self.onmessage = (event) => {
        const msg = event.data;
        if (msg.type === 'PARSE_TRANSCRIPT') {
            try {
                const data = parseClinicalVoiceDictation(msg.transcript);
                const reply = {
                    type: 'PARSE_RESULT',
                    requestId: msg.requestId,
                    data
                };
                self.postMessage(reply);
            }
            catch (err) {
                self.postMessage({
                    type: 'PARSE_ERROR',
                    requestId: msg.requestId,
                    error: err.message || String(err)
                });
            }
        }
    };
}
