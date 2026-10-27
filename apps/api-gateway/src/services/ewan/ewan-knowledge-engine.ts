/**
 * EWAN 2.0 Omniscient Healthcare Master Brain — Knowledge Engine
 * Zero-mock semantic query matching across 15 clinical, operational, and statutory hospital domains.
 */

export interface EwanKnowledgeEntry {
  id: string;
  domain: string;
  category: string;
  title: string;
  summary: string;
  hinglishGuide: string;
  keywords: string[];
  steps: string[];
  actionKey: string;
  deepLinkRoute: string;
  targetRoles: string[];
  troubleshooting: Array<{ commonIssue: string; solution: string }>;
  statutoryReference?: string;
}

export const EWAN_15_DOMAIN_KNOWLEDGE: EwanKnowledgeEntry[] = [
  {
    id: 'ot-safety-sentinel',
    domain: 'OT_SURGICAL_SAFETY',
    category: 'CLINICAL_OPERATIONS',
    title: 'Autonomous OT Surgical Safety Sentinel & WHO Checklist',
    summary: 'Ensures zero-tolerance patient safety during surgical operations via Pre-Op Anaesthesia Clearance (PAC) hard-gates, digital WHO 3-phase checklist, and dual-nurse sponge/needle count reconciliation.',
    hinglishGuide: 'OT me patient ko andar lene se pehle PAC clearance mandatory hai. Fasting status aur airway Mallampati score verify karein. WHO 3-phase Sign-In, Time-Out, Sign-Out pura karein. Cavity closure se pehle scrub aur circulating nurse dono count tally karein.',
    keywords: ['ot', 'surgery', 'surgical', 'safety', 'who checklist', 'sponge count', 'needle count', 'pac', 'anaesthesia', 'time out', 'sign in', 'sign out', 'tray'],
    steps: [
      'Navigate to OT Surgical Safety Sentinel workbench.',
      'Check Anaesthesia Pre-Op Clearance (PAC) signed status and NPO fasting >= 6 hours.',
      'Execute WHO Safe Surgery Phase: Sign-In before anaesthesia induction.',
      'Perform Time-Out before surgical incision with entire surgical team present.',
      'Conduct dual-nurse sponge and needle reconciliation before surgical wound closure.',
      'If count is unbalanced, trigger immediate portable X-ray before patient leaves theatre.'
    ],
    actionKey: 'OPEN_OT_SAFETY_SENTINEL',
    deepLinkRoute: '/ot-safety-sentinel',
    targetRoles: ['SURGEON', 'ANAESTHETIST', 'OT_NURSE', 'CHIEF_MEDICAL_OFFICER'],
    troubleshooting: [
      {
        commonIssue: 'Surgical wound closure blocked due to sponge discrepancy count.',
        solution: 'Circulating nurse and scrub nurse must perform physical recount of sponges and kick-buckets. Order immediate C-Arm/portable X-ray before closure sign-off.'
      },
      {
        commonIssue: 'PAC status showing FROZEN or NPO fasting incomplete.',
        solution: 'Anaesthetist must document clinical risk override or re-schedule surgery slot post mandatory 6-hour solid fasting duration.'
      }
    ],
    statutoryReference: 'WHO Guidelines for Safe Surgery (2009) & NABH 5th Edition COP.8'
  },
  {
    id: 'bedside-concierge-callbell',
    domain: 'BEDSIDE_CONCIERGE_CALLBELL',
    category: 'INPATIENT_OPERATIONS',
    title: 'Inpatient Bedside Smart Tablet & Nurse Call Bell Escalation',
    summary: 'Bedside touch tablet providing inpatient concierge, multi-tier nurse call bell with strict 3-minute SLA auto-escalation, IoT IV drip monitoring, and in-room dietary requests.',
    hinglishGuide: 'Bedside tablet se patient nurse ko call kar sakte hain. Agar 3 minute me nurse acknowledge nahi karti to call Ward Sister ko escalate ho jati hai, aur 7 minute me Medical Superintendent ko WhatsApp aur soundbox alert jata hai.',
    keywords: ['bedside', 'nurse call', 'call bell', 'inpatient', 'tablet', 'sla', 'iv drip', 'escalation', 'dietary', 'concierge'],
    steps: [
      'Patient or attendant presses bedside nurse call trigger on tablet.',
      'Central nursing station displays flashing amber/red alarm with 3-minute SLA timer.',
      'Attending nurse scans bedside NFC tag or QR code to acknowledge and log bedside arrival.',
      'If unresolved at 3 minutes, automatic Tier 1 escalation dispatches WhatsApp to Ward In-Charge.',
      'If unresolved at 7 minutes, Tier 2 escalation broadcasts emergency alarm to Medical Superintendent.'
    ],
    actionKey: 'OPEN_BEDSIDE_CONCIERGE',
    deepLinkRoute: '/bedside-concierge',
    targetRoles: ['WARD_NURSE', 'NURSING_SUPERINTENDENT', 'HOSPITAL_ADMINISTRATOR'],
    troubleshooting: [
      {
        commonIssue: 'Nurse call bell triggering repeatedly for non-emergency water requests.',
        solution: 'Configure call type on tablet interface: distinguish between Urgent Clinical Assist and Hospitality / Water Request to avoid alert fatigue.'
      }
    ],
    statutoryReference: 'NABH 5th Edition PRE.3 & Quality Safety Indicator QPS.4'
  },
  {
    id: 'smart-pharmacy-fefo-pos',
    domain: 'SMART_PHARMACY_FEFO_POS',
    category: 'PHARMACY_OPERATIONS',
    title: 'Smart Pharmacy FEFO Inventory & Schedule H1 POS',
    summary: 'High-speed optical barcode POS dispensing using First-Expiry-First-Out (FEFO) batch allocation, automated Schedule H1 narcotics register, and CDSCO compliance tracking.',
    hinglishGuide: 'Pharmacy POS me दवा scan karte hi sabse pehle expire hone wala batch auto-select hota hai. Schedule H1 dawaon ke liye doctor ka registration number aur patient ka phone/ID proof verify karna lazmi hai.',
    keywords: ['pharmacy', 'pos', 'fefo', 'expiry', 'schedule h1', 'narcotics', 'barcode', 'gtin', 'inventory', 'batches'],
    steps: [
      'Scan 2D DataMatrix or GS1 barcode on medication blister/box.',
      'FEFO engine locks the nearest valid expiry batch (minimum 90-day threshold).',
      'If medication is tagged Schedule H1, mandatory prompt collects Prescribing Doctor Reg No and Patient ID proof.',
      'Print GST tax invoice with batch number, expiry date, and digital QR receipt.',
      'Daily Schedule H1 register is auto-compiled and digitally signed for Drug Inspector review.'
    ],
    actionKey: 'OPEN_PHARMACY_POS',
    deepLinkRoute: '/pharmacy-pos',
    targetRoles: ['PHARMACIST', 'CHIEF_PHARMACIST', 'STORE_MANAGER'],
    troubleshooting: [
      {
        commonIssue: 'Cashier trying to dispense a batch nearing 30 days to expiry.',
        solution: 'System enforces hard block on batches < 45 days. Auto-generate RTV (Return to Vendor) credit note to claim full refund from pharmaceutical distributor.'
      }
    ],
    statutoryReference: 'Drugs and Cosmetics Rules 1945 Rule 65 & Schedule H1 Mandate'
  },
  {
    id: 'pmjay-government-scheme',
    domain: 'PMJAY_GOVERNMENT_SCHEME',
    category: 'STATUTORY_SCHEMES',
    title: 'Ayushman Bharat PM-JAY HBP 2.2 Pre-Auth & Claims Engine',
    summary: 'End-to-end integration with National Health Authority (NHA) Ayushman Bharat PM-JAY HBP 2.2 package catalog, Golden Card verification, biometric pre-auth, and zero-out-of-pocket claim processing.',
    hinglishGuide: 'PM-JAY Ayushman Bharat ke Golden Card ko verify karein, HBP 2.2 package code select karein, pre-auth upload karein. Patient se 1 rupiya bhi out-of-pocket charge karna prohibited hai.',
    keywords: ['pmjay', 'ayushman bharat', 'golden card', 'hbp', 'hbp 2.2', 'preauth', 'sha', 'nha', 'claim', 'government scheme'],
    steps: [
      'Enter patient PM-JAY Golden Card ID or Ration Card number to verify active entitlement.',
      'Select eligible surgical/medical package from HBP 2.2 master schedule.',
      'Submit digital Pre-Authorization bundle with Aadhaar KYC and clinical investigation proofs.',
      'Upon SHA approval, initiate admission under zero-deposit policy.',
      'Post-discharge, compile claim bundle and submit to State Health Agency portal within 7 days.'
    ],
    actionKey: 'OPEN_PMJAY_SCHEME',
    deepLinkRoute: '/pmjay-scheme',
    targetRoles: ['AYUSHMAN_MITRA', 'BILLING_EXECUTIVE', 'TPA_COORDINATOR'],
    troubleshooting: [
      {
        commonIssue: 'Pre-auth rejected due to missing diagnostic histopathology/radiology attachment.',
        solution: 'Attach signed DICOM report and clinical biopsy slide proof directly via the PM-JAY query workbench and re-submit for expedited query turnaround.'
      }
    ],
    statutoryReference: 'National Health Authority (NHA) PM-JAY Guidelines & HBP 2.2 Norms'
  },
  {
    id: 'blood-bank-cold-chain',
    domain: 'BLOOD_BANK_COLD_CHAIN',
    category: 'TRANSFUSION_SAFETY',
    title: 'Blood Bank Cold-Chain IoT & Crossmatch Sentinel',
    summary: 'Continuous 2°C–6°C cold-chain IoT temperature logging for PRBC/FFP, digital Coombs test crossmatch reconciliation, and automated discard protocol for haemolysed units.',
    hinglishGuide: 'Blood bank me PRBC units ko 2 se 6 degree Celsius par maintain rakhna hota hai. Crossmatch me Major aur Minor compatibility test verify hone ke baad hi unit issue karein. Temperature breach hone par unit auto-quarantine hoti hai.',
    keywords: ['blood bank', 'cold chain', 'iot', 'temperature', 'prbc', 'ffp', 'platelets', 'crossmatch', 'transfusion', 'coombs test'],
    steps: [
      'IoT temperature sensor continuously streams refrigeration telemetry every 60 seconds.',
      'If temperature drifts outside 2.0°C–6.0°C for > 15 minutes, automated SMS alert notifies technician.',
      'Perform ABO and Rh typing followed by Indirect Antiglobulin (Coombs) crossmatch test.',
      'Scan unit barcode at bedside with dual-nurse verification before initiating blood transfusion.',
      'Log transfusion start time, vitals at 15 minutes, and completion vitals.'
    ],
    actionKey: 'OPEN_BLOOD_BANK',
    deepLinkRoute: '/blood-bank',
    targetRoles: ['BLOOD_BANK_OFFICER', 'LAB_TECHNICIAN', 'TRANSFUSION_NURSE'],
    troubleshooting: [
      {
        commonIssue: 'Blood unit temperature exceeded 8°C during ward transit.',
        solution: 'Do not transfuse unit. Return immediately to Blood Bank for plasma free haemoglobin testing or condemnation according to NBTC guidelines.'
      }
    ],
    statutoryReference: 'National Blood Transfusion Council (NBTC) & Drugs Controller General of India'
  },
  {
    id: 'radiology-ecg-ai-cv',
    domain: 'RADIOLOGY_AI_CV',
    category: 'DIAGNOSTIC_INTELLIGENCE',
    title: 'Radiology AI Heatmap & Critical Panic Value Alerting',
    summary: 'Edge AI computer vision for chest X-ray pneumothorax detection, CT head haemorrhage triage, and 12-lead ECG STEMI detection with sub-90-second panic value alerts to emergency doctors.',
    hinglishGuide: 'Radiology AI chest X-ray aur CT scan ko automatically screen karta hai. Agar pneumothorax ya intracranial haemorrhage detect hota hai to system turant emergency radiologist aur ER doctor ko notification bhejta hai.',
    keywords: ['radiology', 'xray', 'ct scan', 'ecg', 'ai', 'computer vision', 'pneumothorax', 'stemi', 'panic value', 'dicom'],
    steps: [
      'Modality pushes DICOM study to DocSearch PACS server via C-STORE.',
      'AI pipeline executes inference for acute critical pathologies (haemorrhage, fracture, consolidation).',
      'If critical finding confidence > 85%, study is pre-pended to Emergency Stat Worklist.',
      'Automated panic value WhatsApp and audio soundbox dispatched to duty ER physician.',
      'Radiologist signs formal verification report within mandated 30-minute critical SLA.'
    ],
    actionKey: 'OPEN_RADIOLOGY_AI',
    deepLinkRoute: '/radiology-ai',
    targetRoles: ['RADIOLOGIST', 'ER_PHYSICIAN', 'PACS_ADMINISTRATOR'],
    troubleshooting: [
      {
        commonIssue: 'High motion artifact on portable ICU chest X-ray obscuring AI inference.',
        solution: 'Request repeat exposure with radiographer or switch to manual contrast windowing on WebDICOM viewer.'
      }
    ],
    statutoryReference: 'AERB Radiation Safety Norms & NABH 5th Edition CAD.1'
  },
  {
    id: 'smart-icu-deterioration',
    domain: 'SMART_ICU_DETERIORATION',
    category: 'CRITICAL_CARE',
    title: 'Smart ICU Early Deterioration Radar & NEWS2 Sentinel',
    summary: 'Automated National Early Warning Score (NEWS2) telemetry processing, sepsis early warning predictor, and bedside arterial line/ventilator threshold alerting.',
    hinglishGuide: 'ICU me patient ke pulse, BP, SpO2, respiratory rate aur consciousness level se NEWS2 score calculate hota hai. Score 5 se upar jate hi code blue ya rapid response team ko alert trigger hota hai.',
    keywords: ['icu', 'deterioration', 'news2', 'sepsis', 'ventilator', 'vitals', 'code blue', 'rapid response', 'lactate'],
    steps: [
      'Connect bedside monitor to DocSearch IoT Bridge or manually verify automated vitals stream.',
      'System calculates aggregate NEWS2 score on each vitals cycle.',
      'Score 1–4: Standard monitoring (every 4 hours).',
      'Score 5–6: Urgent escalation to ICU Registrar and blood gas/lactate panel requisition.',
      'Score >= 7: Red Code Alert dispatched to Intensivist and Rapid Response Team.'
    ],
    actionKey: 'OPEN_SMART_ICU',
    deepLinkRoute: '/smart-icu',
    targetRoles: ['INTENSIVIST', 'ICU_NURSE', 'RAPID_RESPONSE_TEAM'],
    troubleshooting: [
      {
        commonIssue: 'False positive NEWS2 alerts triggered by patient disconnection from SpO2 probe.',
        solution: 'Verify sensor signal quality index (SQI) before acknowledging alarm. Clean sensor probe with isopropyl alcohol and re-check pulse waveform.'
      }
    ],
    statutoryReference: 'Royal College of Physicians NEWS2 Standard & Surviving Sepsis Campaign'
  },
  {
    id: 'smart-ambulance-5g',
    domain: 'SMART_AMBULANCE_5G',
    category: 'EMERGENCY_SERVICES',
    title: 'Smart Ambulance 5G Pre-Hospital Triage & Golden Hour Pre-emption',
    summary: 'Live telemetry streaming from Advanced Life Support (ALS) ambulances to emergency room, pre-hospital STEMI / stroke code activation, and instant bed/theatre pre-booking.',
    hinglishGuide: 'Ambulance me baithe patient ka 12-lead ECG aur vitals raste me hi hospital ke ER display par dikhta hai. Hospital pahunchne se pehle Cath Lab ya Trauma OT ready rakhi jati hai.',
    keywords: ['ambulance', 'emergency', '5g', 'golden hour', 'pre-hospital', 'stemi', 'stroke', 'cath lab', 'triage'],
    steps: [
      'Paramedic boards patient and activates GPS incident run on Mobile Companion.',
      'Connect telemetry leads; vitals, SpO2, and ECG stream live to hospital ER command wall.',
      'If STEMI detected, activate Code STEMI; Cath Lab team is pre-summoned while ambulance is in transit.',
      'Zero-delay handover: ER physician receives patient directly into resuscitation bay.'
    ],
    actionKey: 'OPEN_AMBULANCE_TRANSFER',
    deepLinkRoute: '/ambulance-transfer',
    targetRoles: ['EMERGENCY_PHYSICIAN', 'PARAMEDIC', 'TRIAGE_NURSE'],
    troubleshooting: [
      {
        commonIssue: 'Cellular network dead-spot during transit preventing live video stream.',
        solution: 'DocSearch offline sync caches telemetry packets locally on ambulance gateway and flushes on connection recovery; vital numerical telemetry prioritised over high-bandwidth video.'
      }
    ],
    statutoryReference: 'National Ambulance Code (AIS:125) & Golden Hour Trauma Protocols'
  },
  {
    id: 'corporate-b2b-saas',
    domain: 'CORPORATE_B2B_SAAS',
    category: 'COMMERCIAL_OPERATIONS',
    title: 'Corporate B2B Health & TPA Credit Limit Management',
    summary: 'Corporate employee health wellness plans, annual executive health checkups, real-time credit limit utilization tracking, and consolidated monthly invoicing.',
    hinglishGuide: 'Corporate companies ke employees ke health checkups aur cashless OPD ko manage karein. Credit limit exceed hone par auto-hold lagayein aur month-end par single GST invoice generate karein.',
    keywords: ['corporate', 'b2b', 'tpa', 'credit limit', 'annual health check', 'billing', 'invoice', 'gst', 'receivables'],
    steps: [
      'Onboard corporate client with credit agreement, credit limit ceiling, and payment terms (Net 30/60).',
      'Employee presents Corporate Employee ID; system verifies active roster entitlement.',
      'Services are charged against company balance with zero cash collection from employee.',
      'Generate monthly consolidated tax invoice with itemized audit attachments for corporate accounts payable.'
    ],
    actionKey: 'OPEN_CORPORATE_B2B',
    deepLinkRoute: '/corporate-b2b',
    targetRoles: ['CORPORATE_RELATIONS_MANAGER', 'ACCOUNTS_RECEIVABLE_LEAD'],
    troubleshooting: [
      {
        commonIssue: 'Corporate client invoice rejected due to unverified employee designation.',
        solution: 'Sync active roster list via Excel/CSV import under Corporate Client Master before generating billing summary.'
      }
    ],
    statutoryReference: 'Companies Act 2013 Occupational Health Norms & GST Rule 46'
  },
  {
    id: 'bed-turnaround-qr',
    domain: 'BED_TURNAROUND_QR',
    category: 'FACILITY_OPERATIONS',
    title: 'Fast Bed Turnaround & Housekeeping QR Handshake',
    summary: 'Streamlines patient discharge bed release, automated housekeeping dispatch, UV-C terminal disinfection certification, and instant bed status update via physical bedside QR scans.',
    hinglishGuide: 'Patient ke discharge hote hi bed VACANT_DIRTY mark hota hai. Housekeeping team bed par laga QR scan karke cleaning start karti hai aur UV disinfection ke baad VACANT_READY mark karti hai taaki naya admission turant ho sake.',
    keywords: ['bed turnaround', 'discharge', 'housekeeping', 'qr code', 'cleaning', 'terminal cleaning', 'uvc', 'admission', 'occupancy'],
    steps: [
      'Discharge clearance automatically sets bed status to VACANT_DIRTY.',
      'Housekeeping staff receives automated push notification on smartphone.',
      'Staff arrives at bed and scans physical bedside QR code to log "CLEANING_IN_PROGRESS".',
      'Complete terminal disinfection checklist (linen change, surface wiping, UV-C run).',
      'Staff scans QR code to sign off; bed status instantly becomes VACANT_CLEAN for front desk admissions.'
    ],
    actionKey: 'OPEN_BED_TURNAROUND',
    deepLinkRoute: '/bed-turnaround',
    targetRoles: ['HOUSEKEEPING_SUPERVISOR', 'BED_MANAGER', 'ADMISSION_COORDINATOR'],
    troubleshooting: [
      {
        commonIssue: 'Bed showing dirty in system for > 45 minutes after patient departure.',
        solution: 'EWAN pending bottleneck radar automatically escalates idle dirty beds exceeding 30-minute SLA to Facility Manager.'
      }
    ],
    statutoryReference: 'NABH 5th Edition HIC.2 & Infection Prevention Protocols'
  },
  {
    id: 'ambient-ai-scribe',
    domain: 'AMBIENT_AI_SCRIBE',
    category: 'CLINICAL_DOCUMENTATION',
    title: 'Ambient Clinical AI Scribe & Multilingual EMR Generation',
    summary: 'Real-time conversational speech-to-text recording doctor-patient consultations in Hindi, Hinglish, and English, auto-extracting chief complaints, symptoms, vitals, prescriptions, and ICD-10 codes.',
    hinglishGuide: 'Doctor aur patient ke beech ki normal baatcheet ko AI sunkar structured clinical prescription aur discharge summary me convert kar deta hai. Doctor review karke 1 click me sign-off karte hain.',
    keywords: ['ambient', 'ai scribe', 'voice', 'speech to text', 'emr', 'soap notes', 'prescription', 'icd10', 'hinglish', 'consultation'],
    steps: [
      'Doctor clicks "Start Ambient Recording" on OPD Consultation Desk.',
      'Doctor conducts normal natural conversation with patient in Hindi/Hinglish/English.',
      'AI pipeline extracts Chief Complaints, History of Present Illness, Clinical Exam, and Rx.',
      'Doctor reviews auto-populated SOAP note, makes minor edits if desired, and clicks "Sign & Finalize".',
      'Signed prescription is instantly sent to patient WhatsApp and pharmacy queue.'
    ],
    actionKey: 'OPEN_AMBIENT_AI_SCRIBE',
    deepLinkRoute: '/ambient-ai-scribe',
    targetRoles: ['CONSULTING_DOCTOR', 'MEDICAL_OFFICER', 'CLINICAL_SCRIBE'],
    troubleshooting: [
      {
        commonIssue: 'Background clinic noise causing missed drug dosage words in speech.',
        solution: 'Use directional noise-cancelling microphone or position microphone within 1 metre of doctor and patient.'
      }
    ],
    statutoryReference: 'NMC Registered Medical Practitioner (Professional Conduct) Regulations 2023'
  },
  {
    id: 'nhcx-cashless-claims',
    domain: 'NHCX_CASHLESS_CLAIMS',
    category: 'HEALTH_INSURANCE',
    title: 'NHCX / IRDAI 100% Cashless Health Insurance Engine',
    summary: 'FHIR R4 standardized communication with National Health Claims Exchange (NHCX), automated pre-auth claim scrubbers, and 100% cashless treatment claim processing within 1-hour discharge SLA.',
    hinglishGuide: 'National Health Claims Exchange (NHCX) ke through sabhi insurance companies se direct cashless approvals milte hain. IRDAI ke naye 1-hour discharge rule ke mutabiq discharge bill submit karein taaki penalty na lage.',
    keywords: ['nhcx', 'insurance', 'tpa', 'cashless', 'irdai', 'preauth', 'fhir', 'discharge clearance', 'claim', 'adjudication'],
    steps: [
      'Patient presents health insurance policy number during IPD admission.',
      'System queries NHCX gateway using FHIR Coverage Eligibility Request.',
      'Instant pre-authorization amount is received and bound to patient billing account.',
      'On planned discharge date, pre-adjudicated bill bundle is submitted to NHCX.',
      'Final cashless claim approval received within mandated 60-minute window.'
    ],
    actionKey: 'OPEN_NHCX_INSURANCE',
    deepLinkRoute: '/nhcx-insurance',
    targetRoles: ['TPA_DESK_EXECUTIVE', 'BILLING_MANAGER', 'FINANCE_CONTROLLER'],
    troubleshooting: [
      {
        commonIssue: 'TPA claim denied for lack of Active Medical Management necessity note.',
        solution: 'Use RCM Pre-Auth Scrubber to auto-detect missing vitals chart and append attending physician signed IPD notes before NHCX submission.'
      }
    ],
    statutoryReference: 'IRDAI Master Circular on Health Insurance (2024) 1-Hour Cashless SLA'
  },
  {
    id: 'revenue-leakage-hardgate',
    domain: 'REVENUE_LEAKAGE_HARDGATE',
    category: 'FINANCIAL_INTEGRITY',
    title: 'Revenue Leakage Sentinel & Doctor Split Settlement',
    summary: 'Scans PostgreSQL tables for unbilled consumables from OT/ICU, unadjusted doctor commissions on patient refunds, cashier blind-drop variances, and expired stock holding.',
    hinglishGuide: 'Hospital me hone wale revenue losses ko pakadne wala engine: OT me use hue implant jo bill me add nahi hue, doctor ke commission jo refund ke baad bhi debit nahi hue, aur cashier ke cash drop ka farq — sab auto-detect aur auto-heal hota hai.',
    keywords: ['revenue leakage', 'doctor commission', 'clawback', 'cashier drop', 'blind drop', 'unbilled', 'consumables', 'auto heal', 'audit'],
    steps: [
      'Open EWAN Revenue Leakage Sentinel tab.',
      'Click "Run Live Audit" to trigger deep SQL scans across clinical tables.',
      'Review flagged leakage line items categorized by unbilled consumables, doctor clawbacks, and cashier variances.',
      'Click "1-Click Auto-Heal All" to execute atomic reconciliation.',
      'Export verified GSTR-1 and reconciliation certificates for auditors.'
    ],
    actionKey: 'OPEN_REVENUE_LEAKAGE',
    deepLinkRoute: '/ewan-super-brain',
    targetRoles: ['CHIEF_FINANCIAL_OFFICER', 'BILLING_AUDITOR', 'INTERNAL_AUDITOR'],
    troubleshooting: [
      {
        commonIssue: 'Doctor objecting to commission clawback debit note.',
        solution: 'Show audit log linking the debit note to specific cancelled patient consultation invoice and refund transaction reference.'
      }
    ],
    statutoryReference: 'NABH CQI.4 & Standard Accounting Practice Ind AS 115'
  },
  {
    id: 'abdm-m1m3-health-stack',
    domain: 'ABDM_M1M3_STACK',
    category: 'GOVERNMENT_DIGITAL_HEALTH',
    title: 'ABDM M1, M2, M3 Ayushman Bharat Digital Mission Stack',
    summary: 'Full Milestone 1 (ABHA creation, Scan & Share), Milestone 2 (HIP Health Information Provider records push), and Milestone 3 (HIU Health Information User consent gateway).',
    hinglishGuide: 'Ayushman Bharat Digital Mission ke tehat patient ka 14-digit ABHA number create karein, Scan & Share counter se 10 second me registration karein, aur patient ke purane lab/radiology records consent ke saath fetch karein.',
    keywords: ['abdm', 'abha', 'm1', 'm2', 'm3', 'scan and share', 'hip', 'hiu', 'consent', 'digital health', 'nha'],
    steps: [
      'Patient scans hospital ABDM QR code via ABHA app or Aarogya Setu.',
      'Front desk clicks "Accept Scan Token" to auto-populate patient demographic form in 5 seconds.',
      'Clinician creates consultation note; system signs and pushes FHIR DiagnosticReport to ABDM HIP vault.',
      'HIU consent manager allows doctor to request past medical records from external hospitals upon patient OTP consent.'
    ],
    actionKey: 'OPEN_ABDM_OVERVIEW',
    deepLinkRoute: '/abdm-overview',
    targetRoles: ['FRONT_DESK_EXECUTIVE', 'ABDM_NODAL_OFFICER', 'MEDICAL_RECORDS_OFFICER'],
    troubleshooting: [
      {
        commonIssue: 'Aadhaar OTP not received by patient during ABHA creation.',
        solution: 'Use Mobile OTP fallback or biometric fingerprint scanner registered under DocSearch Hardware Bridge.'
      }
    ],
    statutoryReference: 'National Digital Health Mission (NDHM) Security and Privacy Policy'
  },
  {
    id: 'offline-pwa-resilience',
    domain: 'OFFLINE_PWA_RESILIENCE',
    category: 'INFRASTRUCTURE_RELIABILITY',
    title: 'Offline PWA Local Storage & SQLite/IndexedDB Bi-Directional Sync',
    summary: 'Guarantees uninterrupted clinic and OPD operations during broadband or server outages using ServiceWorker caching, IndexedDB transactional staging, and conflict-free sync reconciliation.',
    hinglishGuide: 'Internet band hone par bhi OPD, prescription likhna aur billing rukti nahi hai. Sara data local browser storage me save hota hai aur internet aate hi background me server se bina data loss ke sync ho jata hai.',
    keywords: ['offline', 'pwa', 'sync', 'indexeddb', 'sqlite', 'local storage', 'resilience', 'cache', 'conflict resolution'],
    steps: [
      'When internet disconnection occurs, UI indicator turns amber ("OFFLINE_MODE_ACTIVE").',
      'Clinicians continue issuing OPD tokens, creating consultations, and dispensing medicines locally.',
      'Transactions are queued in browser IndexedDB with deterministic UUIDs.',
      'On reconnection, Sync Worker flushes queued mutations to `/api/v1/partner/offline-sync/flush`.',
      'Server acknowledges and reconciles any conflicting record revisions without data loss.'
    ],
    actionKey: 'OPEN_OFFLINE_SYNC',
    deepLinkRoute: '/offline-sync',
    targetRoles: ['IT_ADMINISTRATOR', 'CLINIC_OPERATIONS_MANAGER', 'FRONT_DESK'],
    troubleshooting: [
      {
        commonIssue: 'Pending sync count not reducing after broadband internet restored.',
        solution: 'Click "Force Trigger Sync Now" on Offline Sync Workbench to manually flush the IndexedDB transmission queue.'
      }
    ],
    statutoryReference: 'ISO 27001 Business Continuity & ISO 22301 Disaster Recovery'
  }
];

export function searchEwanKnowledge(
  query: string,
  domainFilter?: string,
  _lang?: string,
  userRole?: string
): EwanKnowledgeEntry[] {
  const clean = (query || '').trim().toLowerCase();
  if (!clean && !domainFilter) {
    return EWAN_15_DOMAIN_KNOWLEDGE.slice(0, 8);
  }

  let candidates = EWAN_15_DOMAIN_KNOWLEDGE;
  if (domainFilter && domainFilter !== 'ALL') {
    candidates = candidates.filter(
      (c) => c.domain.toUpperCase() === domainFilter.toUpperCase() || c.id === domainFilter
    );
  }

  if (!clean) {
    return candidates;
  }

  const stopWords = new Set(['the', 'is', 'at', 'which', 'on', 'a', 'an', 'and', 'or', 'to', 'in', 'kaise', 'kya', 'hai', 'karein']);
  const words = clean
    .replace(/[?,.!]/g, ' ')
    .split(/\s+/)
    .filter((w) => !stopWords.has(w))
    .filter(Boolean);

  const scored = candidates.map((entry) => {
    let score = 0;
    const titleLower = entry.title.toLowerCase();
    const summaryLower = entry.summary.toLowerCase();
    const hinglishLower = entry.hinglishGuide.toLowerCase();

    // Exact string match
    if (titleLower.includes(clean)) score += 40;
    if (summaryLower.includes(clean)) score += 25;
    if (hinglishLower.includes(clean)) score += 20;

    // Keyword match
    for (const kw of entry.keywords) {
      const kwLower = kw.toLowerCase();
      if (kwLower === clean) score += 50;
      else if (clean.includes(kwLower) || kwLower.includes(clean)) score += 25;
      for (const w of words) {
        if (kwLower === w) score += 20;
        else if (kwLower.includes(w) || w.includes(kwLower)) score += 10;
      }
    }

    // Word match against title and summary
    for (const w of words) {
      if (titleLower.includes(w)) score += 15;
      if (summaryLower.includes(w)) score += 8;
      if (hinglishLower.includes(w)) score += 5;
    }

    // Role affinity bonus
    if (userRole && entry.targetRoles.includes(userRole.toUpperCase())) {
      score += 15;
    }

    return { entry, score };
  });

  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((s) => s.entry);
}
