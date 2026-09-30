/**
 * EWAN — Master Brain Knowledge Base
 * Role-Gated & Platform-Isolated Knowledge Architecture.
 *
 * PERSONA SEPARATION RULES:
 * 1. LANDING_PAGE (Customer / Patient): Sees ONLY patient care, doctor booking, ABHA, and emergency help.
 *    STRICTLY FORBIDDEN from seeing: plan creation, admin approvals, DB schema, or internal pricing.
 * 2. PARTNER_PLATFORM (Hospital / Clinic / Doctor): Sees daily hospital OS (Fast OPD, Doctor EMR, Pharmacy POS, Cashier, Upgrading their plan).
 *    STRICTLY FORBIDDEN from seeing: internal company plan creation or cross-partner admin controls.
 * 3. COMPANY_HQ (Super Admin / Founder): Master brain for creating plans, approving partner KYC, database safe CRUD, and architecture.
 */

export type EwanPlatform = 'COMPANY_HQ' | 'PARTNER_PLATFORM' | 'LANDING_PAGE';

export interface EwanKnowledgeTopic {
  id: string;
  title: string;
  category: 'PATIENT_CARE' | 'HOSPITAL_OPERATIONS' | 'ADMIN_PLANS' | 'ADMIN_KYC' | 'SAFE_CRUD' | 'ARCHITECTURE';
  allowedPlatforms: EwanPlatform[];
  summary: string;
  keywords: string[];
  steps: string[];
  hinglishGuide: string;
  targetRoles?: string[] | undefined;
  restrictedRoles?: string[] | undefined;
  roleHandoffGuidance?: Record<string, { boundaryNote: string; handoffSteps: string[] }> | undefined;
  requiredModule?: string | undefined;
  nextBestStep?: string | undefined;
  troubleshooting?: { commonIssue: string; solution: string }[] | undefined;
  technicalDetails?: {
    routes?: string[] | undefined;
    dbTables?: string[] | undefined;
    ports?: string[] | undefined;
    actionKey?: string | undefined;
  } | undefined;
}

export const EWAN_KNOWLEDGE_TOPICS: EwanKnowledgeTopic[] = [
  // ==========================================
  // 1. PATIENT / CUSTOMER TOPICS (LANDING_PAGE ONLY)
  // ==========================================
  {
    id: 'patient-find-doctor',
    title: '🩺 Doctor Ya Hospital Kaise Search Karein?',
    category: 'PATIENT_CARE',
    allowedPlatforms: ['LANDING_PAGE'],
    summary: 'Aas-paas ke verified doctors aur multi-specialty hospitals dhoondhein.',
    keywords: ['doctor', 'hospital', 'dhoondh', 'search', 'specialist', 'clinic', 'kaha', 'paas', 'find', 'cardiologist', 'dentist'],
    steps: [
      '1. Step 1 (Search): Home page par area ya doctor specialty (e.g. Cardiologist, Dental) type karein.',
      '2. Step 2 (Filter): Verified green badge aur OPD timings check karein.',
      '3. Step 3 (Connect): "Book Consultation" ya call button se instant slot confirm karein.'
    ],
    hinglishGuide: 'Home page par area ya bimari search karein, verified green badge dekhein, aur direct book karein.',
    technicalDetails: {
      actionKey: 'scroll-to-search'
    }
  },
  {
    id: 'patient-book-opd',
    title: '🎫 Online OPD Token & Live Queue Kaise Check Karein?',
    category: 'PATIENT_CARE',
    allowedPlatforms: ['LANDING_PAGE'],
    summary: 'Ghar baithe digital OPD token lein aur real-time waiting line track karein.',
    keywords: ['appointment', 'token', 'book', 'queue', 'line', 'number', 'opd', 'parchi', 'slip', 'waiting'],
    steps: [
      '1. Step 1 (Token Button): Hospital profile par "Get OPD Token" par click karein.',
      '2. Step 2 (Patient Info): Mobile number aur patient ka naam enter karein.',
      '3. Step 3 (Instant Token): Screen aur WhatsApp par digital token number mil jayega.',
      '4. Step 4 (Live Tracker): Screen par live dekhein doctor kis number ko dekh rahe hain.'
    ],
    hinglishGuide: '"Get OPD Token" dabayein, mobile number dalein, aur screen par live status dekhein bina line lagaye.',
    technicalDetails: {
      actionKey: 'open-patient-booking'
    }
  },
  {
    id: 'patient-abha-records',
    title: '🇮🇳 ABHA Health ID & Digital Parcha Kaise Link Karein?',
    category: 'PATIENT_CARE',
    allowedPlatforms: ['LANDING_PAGE'],
    summary: 'Ayushman Bharat ABHA ID se digital prescription aur lab reports sync karein.',
    keywords: ['abha', 'ayushman', 'health id', 'report', 'prescription', 'parchi', 'download', 'lab', 'records'],
    steps: [
      '1. Step 1 (ABHA Link): "Link ABHA ID" button par click karein.',
      '2. Step 2 (Verify OTP): Apna 14-digit ABHA number ya Aadhaar OTP enter karein.',
      '3. Step 3 (Auto-Sync): Doctor ki likhi parchi aur lab reports auto-sync ho jayengi.',
      '4. Step 4 (Anytime Download): WhatsApp ya browser se kabhi bhi prescription download karein.'
    ],
    hinglishGuide: 'ABHA ID link karein aur apni parchi ya lab report mobile par hamesha surakshit rakhein.',
    technicalDetails: {
      actionKey: 'open-abha-linker'
    }
  },
  {
    id: 'partner-join-docsearch',
    title: '🏥 Hospital / Clinic Partner Network Me Kaise Judien?',
    category: 'PATIENT_CARE',
    allowedPlatforms: ['LANDING_PAGE'],
    summary: 'Doctor, clinic ya hospital ko DocSearch par self-register karein.',
    keywords: ['partner', 'hospital register', 'clinic register', 'join', 'doctor registration', 'onboard', 'signup'],
    steps: [
      '1. Step 1 (Register Link): Top header me "Partner Onboarding" par click karein.',
      '2. Step 2 (Form Fill): Hospital Name, Facility Type, aur Mobile Number bharein.',
      '3. Step 3 (Instant Submit): Form submit hote hi verification queue me chala jayega.',
      '4. Step 4 (Dashboard Login): Approval ke baad hospital dashboard (Port 5175) login mil jayega.'
    ],
    hinglishGuide: '"Partner Onboarding" par basic form bharein aur approval ke baad hospital OS access payein.',
    technicalDetails: {
      actionKey: 'open-partner-registration'
    }
  },
  {
    id: 'patient-emergency-sos',
    title: '🚨 24x7 Emergency SOS & Ambulance Kaise Bulayein?',
    category: 'PATIENT_CARE',
    allowedPlatforms: ['LANDING_PAGE'],
    summary: 'Emergency trauma care aur nazdeeki ambulance turant call karein.',
    keywords: ['emergency', 'ambulance', 'sos', 'trauma', 'accident', 'urgent', '108', 'casualty'],
    steps: [
      '1. Step 1 (SOS Button): Home page par red "Emergency SOS" button dabayein.',
      '2. Step 2 (GPS Location): Current location allow karein taaki paas ka hospital detect ho.',
      '3. Step 3 (Call Ambulance): Direct hospital emergency desk aur ambulance driver se connect ho jayenge.'
    ],
    hinglishGuide: 'Emergency SOS dabayein, location allow karein aur direct nazdeeki trauma team se call par connect karein.',
    technicalDetails: {
      actionKey: 'open-emergency-sos'
    }
  },

  // ==========================================
  // 2. PARTNER PLATFORM TOPICS (HOSPITAL / CLINIC / DOCTOR STAFF)
  // ==========================================
  {
    id: 'partner-fast-opd',
    title: '⚡ 30-Second Me Fast OPD Token Kaise Katein?',
    category: 'HOSPITAL_OPERATIONS',
    allowedPlatforms: ['PARTNER_PLATFORM'],
    summary: 'Single-screen drawer se 30 second me patient register karein aur thermal slip print karein.',
    keywords: ['opd', 'token', 'patient', 'reception', 'slip', 'parchi', 'counter', 'quick', 'fast opd', 'registration'],
    targetRoles: ['RECEPTIONIST', 'FRONT_DESK_LEAD', 'FRONT_DESK', 'SUPER_ADMIN'],
    requiredModule: 'patient-registration',
    nextBestStep: 'Patient register karne ke baad "Generate Token & Print Slip" dabayein aur thermal slip patient ko dein.',
    steps: [
      '1. Step 1 (Open Drawer): Top bar me "⚡ + Quick Patient & Token" par click karein.',
      '2. Step 2 (Fill 3 Fields): Mobile number (10 digits), Patient name, aur Doctor chunein.',
      '3. Step 3 (Print Slip): "Generate Token & Print Slip" dabayein — thermal printer par slip print hogi.',
      '4. Step 4 (Queue Push): Patient doctor ke waiting queue me automatic transfer ho jayega.'
    ],
    hinglishGuide: 'Top bar me "+ Quick Patient & Token" dabayein, 3 details bharein aur thermal slip print karein.',
    troubleshooting: [
      {
        commonIssue: 'Thermal slip print nahi ho rahi',
        solution: 'Browser print settings mein Margins "None" aur Paper Size "58mm / 80mm Roll" select karein.'
      }
    ],
    technicalDetails: {
      actionKey: 'open-fast-opd-drawer'
    }
  },
  {
    id: 'partner-doctor-emr',
    title: '🩺 Doctor Desk: Digital Prescription & Diagnosis Kaise Likhein?',
    category: 'HOSPITAL_OPERATIONS',
    allowedPlatforms: ['PARTNER_PLATFORM'],
    summary: 'Doctor consultation workstation, medicine search aur 1-click WhatsApp Rx.',
    keywords: ['doctor', 'emr', 'prescription', 'consult', 'dawa', 'diagnosis', 'rx', 'soap', 'consultation', 'vitals', 'doctor consultation'],
    targetRoles: ['DOCTOR', 'ATTENDING_DOCTOR', 'SURGEON', 'CARDIOLOGIST', 'CONSULTANT_PHYSICIAN', 'SUPER_ADMIN'],
    restrictedRoles: ['RECEPTIONIST', 'FRONT_DESK_LEAD', 'REGISTRATION_CLERK', 'BILLING_EXECUTIVE'],
    requiredModule: 'clinical-consultation',
    roleHandoffGuidance: {
      RECEPTIONIST: {
        boundaryNote:
          'Consultation Doctor-role workflow ka part hai. Aapke current Reception scope mein main patient ko Doctor stage tak correctly process/handoff karne ka verified workflow bata sakta hoon.',
        handoffSteps: [
          '1. Step 1: Patient name & mobile number se existing registration search karein ya new entry karein.',
          '2. Step 2: ABDM ABHA verification ya new ABHA create karein.',
          '3. Step 3: Respective Doctor aur OPD slot choose karke Token generate karein.',
          '4. Step 4: Thermal slip print karke patient ko Doctor OPD room transfer karein.'
        ]
      }
    },
    nextBestStep: 'Vitals review karein, ICD-10 diagnosis fill karein, aur "Sign & Finalize Rx" click karein.',
    steps: [
      '1. Step 1 (Doctor Desk): "Doctor OPD Desk" kholein aur queue se patient select karein.',
      '2. Step 2 (Vitals & Complaints): Chief complaints aur Vitals (BP, Pulse, Temp) note karein.',
      '3. Step 3 (Smart Rx): Medicine box me 2 akshar type karein — dosage aur frequency auto-load hogi (CDSS interaction check automatic).',
      '4. Step 4 (Sign & Dispatch): "Sign & Finalize Rx" dabayein — parchi pharmacy aur WhatsApp par chali jayegi.'
    ],
    hinglishGuide: 'Doctor Desk kholein, symptoms aur medicine add karein aur Sign dabakar pharmacy & WhatsApp bhejein.',
    troubleshooting: [
      {
        commonIssue: 'Patient queue mein nahi dikh raha',
        solution: 'Top bar se LiveSync Refresh dabayein aur Reception se confirm karein ki token generate hua hai.'
      }
    ],
    technicalDetails: {
      actionKey: 'open-doctor-desk'
    }
  },
  {
    id: 'partner-pharmacy-pos',
    title: '💊 Pharmacy Medicine POS & GST Bill Kaise Banayein?',
    category: 'HOSPITAL_OPERATIONS',
    allowedPlatforms: ['PARTNER_PLATFORM'],
    summary: 'Barcode scan, Doctor Rx auto-load, batch expiry FIFO tracking aur thermal GST bill.',
    keywords: ['pharmacy', 'pos', 'medicine', 'bill', 'barcode', 'dawai', 'gst', 'batch', 'expiry', 'rx queue'],
    steps: [
      '1. Step 1 (POS Open): "Pharmacy Medicine POS" tab me jayein.',
      '2. Step 2 (Select Rx): "Doctor Rx Queue" se patient chunein ya barcode scan karein.',
      '3. Step 3 (Expiry Check): System automatic FIFO batch expiry aur stock verify karega.',
      '4. Step 4 (Collect & Print): "Print GST Bill" dabayein aur Cash ya UPI collect karein.'
    ],
    hinglishGuide: 'Pharmacy tab me Rx Queue se patient chunein, system batch expiry verify karega, aur GST bill print karein.',
    technicalDetails: {
      actionKey: 'open-pharmacy-pos'
    }
  },
  {
    id: 'partner-cashier-billing',
    title: '💳 Cashier & Instant UPI Billing Desk Kaise Chalayein?',
    category: 'HOSPITAL_OPERATIONS',
    allowedPlatforms: ['PARTNER_PLATFORM'],
    summary: 'Dynamic UPI QR code se instant payment collect karein aur invoice print karein.',
    keywords: ['billing', 'cashier', 'pos bill', 'upi', 'payment', 'receipt', 'discharge', 'tpa', 'fees', 'invoice'],
    steps: [
      '1. Step 1 (Billing Desk): Top bar se "+ Quick POS Bill" ya "Billing Desk" kholein.',
      '2. Step 2 (Fetch Patient): Phone number ya MRN dalkar pending consultation/tests dekhein.',
      '3. Step 3 (Scan QR): Screen par dynamic UPI QR code banega jo patient scan karega.',
      '4. Step 4 (Print Invoice): Payment confirm hote hi B2C Tax Invoice slip print karein.'
    ],
    hinglishGuide: 'Billing desk me patient kholein, dynamic UPI QR scan karwayein aur tax invoice print karein.',
    technicalDetails: {
      actionKey: 'open-billing-desk'
    }
  },
  {
    id: 'partner-profile-statutory-guard',
    title: '⚠️ Hospital Profile Update & Bill/Report Print Guard Rule',
    category: 'HOSPITAL_OPERATIONS',
    allowedPlatforms: ['PARTNER_PLATFORM', 'COMPANY_HQ'],
    summary: 'Statutory Rule: Legal Name, CEA Reg No aur 6-digit PIN ke bina print block rahega.',
    keywords: ['profile', 'profile update', 'print block', 'bill print', 'report generate', 'cea', 'license', 'alert', 'pin', 'address'],
    steps: [
      '1. Step 1 (Statutory Gate): Clinical Establishments Act ke mutabiq incomplete profile par print block hota hai.',
      '2. Step 2 (Pre-Print Alert): Profile incomplete hone par Print click karte hi warning alert aayega.',
      '3. Step 3 (1-Click Fill): "Update Profile Now" dabayein aur Address (PIN) & License No bharein.',
      '4. Step 4 (Instant Unlock): Save karte hi bill printing aur clinical reports turant unlock ho jayengi.'
    ],
    hinglishGuide: 'Incomplete profile par print block rehta hai. "Update Profile Now" dabakar Address & License save karein, turant unlock hoga.',
    technicalDetails: {
      actionKey: 'open-partner-profile-settings',
      routes: ['POST /api/v1/partners/profile', 'GET /api/v1/partners/profile']
    }
  },
  {
    id: 'partner-inpatient-ipd',
    title: '🛏️ IPD Inpatient: Bed Allocation & Discharge Kaise Karein?',
    category: 'HOSPITAL_OPERATIONS',
    allowedPlatforms: ['PARTNER_PLATFORM'],
    summary: 'Ward/ICU bed allot karein, daily rounds note karein aur discharge summary banayein.',
    keywords: ['ipd', 'inpatient', 'bed', 'admit', 'admission', 'ward', 'icu', 'discharge', 'rounds'],
    steps: [
      '1. Step 1 (IPD Desk): "Inpatient Management (IPD)" tab open karein.',
      '2. Step 2 (Allot Bed): Available bed (General/ICU) select karein aur patient admit karein.',
      '3. Step 3 (Daily Care): Daily nursing vitals, doctor rounds aur medications note karein.',
      '4. Step 4 (Discharge): Dues clear hone par 1-click Discharge Summary print karein.'
    ],
    hinglishGuide: 'IPD module me bed allot karein, daily rounds likhein aur dues clear karke Discharge Summary generate karein.',
    technicalDetails: {
      actionKey: 'open-inpatient-ipd'
    }
  },
  {
    id: 'partner-lab-investigation',
    title: '🔬 Pathology Lab & Diagnostic Reports Kaise Enter Karein?',
    category: 'HOSPITAL_OPERATIONS',
    allowedPlatforms: ['PARTNER_PLATFORM'],
    summary: 'Test sample barcode scan karein, values enter karein aur digital signed report release karein.',
    keywords: ['lab', 'pathology', 'investigation', 'test', 'blood test', 'cbc', 'lft', 'report', 'specimen'],
    steps: [
      '1. Step 1 (Lab Desk): "Clinical Investigation (Lab)" module kholein.',
      '2. Step 2 (Sample Collect): Doctor dwara prescribed test (CBC, LFT, etc.) select karein.',
      '3. Step 3 (Enter Results): Test values fill karein — abnormal values automatic highlight hongi.',
      '4. Step 4 (Sign & Share): Pathologist digital sign karein — report WhatsApp par auto-dispatch hogi.'
    ],
    hinglishGuide: 'Lab tab me test values dalein, abnormal values check karein, aur sign karte hi WhatsApp par share karein.',
    technicalDetails: {
      actionKey: 'open-lab-investigation'
    }
  },
  {
    id: 'partner-emergency-trauma',
    title: '🚨 Emergency & Trauma Triage (Red/Yellow/Green) Kaise Manage Karein?',
    category: 'HOSPITAL_OPERATIONS',
    allowedPlatforms: ['PARTNER_PLATFORM'],
    summary: 'Emergency patients ka priority triage karein aur rapid trauma team alert karein.',
    keywords: ['emergency', 'trauma', 'triage', 'casualty', 'red flag', 'news2', 'critical', 'resuscitation'],
    steps: [
      '1. Step 1 (Emergency Desk): "Emergency & Trauma" tab par click karein.',
      '2. Step 2 (Assign Triage): Severity chunein — Red (Immediate), Yellow (Urgent), Green (Stable).',
      '3. Step 3 (Rapid Vitals): NEWS2 deterioration score aur Glasgow Coma Scale check karein.',
      '4. Step 4 (Transfer / OT): 1-click me Crash Cart team alert karein ya OT/ICU transfer karein.'
    ],
    hinglishGuide: 'Emergency module me Red/Yellow/Green triage karein, NEWS2 check karein aur team ko alert karein.',
    technicalDetails: {
      actionKey: 'open-emergency-trauma'
    }
  },
  {
    id: 'partner-ot-management',
    title: '🔪 Operation Theatre (OT): Surgery Booking & PAC Clearance',
    category: 'HOSPITAL_OPERATIONS',
    allowedPlatforms: ['PARTNER_PLATFORM'],
    summary: 'OT table schedule karein, Surgeon/Anesthetist assign karein aur notes banayein.',
    keywords: ['ot', 'operation theatre', 'surgery', 'surgeon', 'anesthesia', 'pac', 'operative notes'],
    steps: [
      '1. Step 1 (OT Desk): "Operation Theatre" module kholein.',
      '2. Step 2 (Book Slot): Surgery date, time slot, aur OT Room select karein.',
      '3. Step 3 (Team & PAC): Chief Surgeon, Anesthesia team aur Pre-Anesthesia Check verify karein.',
      '4. Step 4 (Post-Op Note): Surgery ke baad Operative Notes aur implant details lock karein.'
    ],
    hinglishGuide: 'OT module me surgery slot book karein, PAC verify karein aur post-op notes record karein.',
    technicalDetails: {
      actionKey: 'open-ot-management'
    }
  },
  {
    id: 'partner-abdm-gateway',
    title: '🇮🇳 ABDM M1/M2/M3: Scan & Share QR Counter Kaise Chalayein?',
    category: 'HOSPITAL_OPERATIONS',
    allowedPlatforms: ['PARTNER_PLATFORM'],
    summary: 'Ayushman Bharat Digital Mission compliant counter par 5-sec QR registration.',
    keywords: ['abdm', 'm1', 'm2', 'm3', 'scan and share', 'qr counter', 'ayushman', 'fhir', 'hip', 'hiu'],
    steps: [
      '1. Step 1 (ABDM Counter): "ABDM FHIR Gateway" tab me jayein.',
      '2. Step 2 (Display QR): Counter par hospital ka ABDM 2.0 Scan & Share QR display karein.',
      '3. Step 3 (Patient Scan): Patient Aarogya Setu ya ABHA app se scan karega.',
      '4. Step 4 (Auto Registration): Demographic data 5 second me auto-pull hokar token cut jayega.'
    ],
    hinglishGuide: 'ABDM Gateway se QR lagayein, patient scan karega aur 5 second me zero-paper registration ho jayegi.',
    technicalDetails: {
      actionKey: 'open-abdm-gateway'
    }
  },
  {
    id: 'partner-ai-scribe',
    title: '🎙️ AI Voice Prescription & Clinical CDSS Kaise Use Karein?',
    category: 'HOSPITAL_OPERATIONS',
    allowedPlatforms: ['PARTNER_PLATFORM'],
    summary: 'Doctor sirf bolein — AI automatic clinical notes, dawa aur diagnosis draft karega.',
    keywords: ['voice', 'ai scribe', 'speech', 'dictation', 'cdss', 'audio', 'mic', 'whisper'],
    steps: [
      '1. Step 1 (Mic Button): Doctor Desk par Mic icon dabayein.',
      '2. Step 2 (Speak Hindi/Eng): Doctor patient ke lakshan aur prescribed medicine bolein.',
      '3. Step 3 (AI Structuring): AI SOAP format me complaints, vitals aur medicines auto-arrange karega.',
      '4. Step 4 (Doctor Approve): 1 click me review karke prescription lock karein.'
    ],
    hinglishGuide: 'Doctor Desk par Mic dabayein, bolkar prescription likhwayein aur AI SOAP format me auto-save karega.',
    technicalDetails: {
      actionKey: 'open-ai-scribe'
    }
  },
  {
    id: 'partner-whatsapp-desk',
    title: '💬 WhatsApp Patient Portal & Automated Reminders',
    category: 'HOSPITAL_OPERATIONS',
    allowedPlatforms: ['PARTNER_PLATFORM'],
    summary: 'Prescription, lab reports, follow-up reminders WhatsApp par automatic bhejein.',
    keywords: ['whatsapp', 'chat', 'sms', 'reminder', 'broadcast', 'notification', 'share rx'],
    steps: [
      '1. Step 1 (WhatsApp Desk): "WhatsApp Patient Portal" tab kholein.',
      '2. Step 2 (Auto Templates): Prescription send, appointment reminder aur payment receipts on karein.',
      '3. Step 3 (Live Status): Delivered aur Read receipts live track karein.',
      '4. Step 4 (Zero Manual Work): Bill ya report bante hi patient ke mobile par turant chali jayegi.'
    ],
    hinglishGuide: 'WhatsApp portal se automated alerts on karein — prescription aur bill bante hi patient ko auto-send hoga.',
    technicalDetails: {
      actionKey: 'open-whatsapp-desk'
    }
  },
  {
    id: 'partner-staff-directory',
    title: '👥 Doctors & Hospital Staff Management Kaise Karein?',
    category: 'HOSPITAL_OPERATIONS',
    allowedPlatforms: ['PARTNER_PLATFORM'],
    summary: 'Doctor schedule, receptionist, nurse aur pharmacist ke logins & permissions set karein.',
    keywords: ['staff', 'doctor add', 'employee', 'nurse', 'receptionist', 'roles', 'permissions', 'roster'],
    steps: [
      '1. Step 1 (Staff Desk): "Staff Administration" module me jayein.',
      '2. Step 2 (Add Member): "+ Add Staff" dabakar Name, Role (Doctor/Nurse/Cashier) bharein.',
      '3. Step 3 (Set Clearance): Receptionist ko billing aur Doctor ko EMR clearance dein.',
      '4. Step 4 (OPD Slots): Doctor ka daily OPD timing aur room number set karein.'
    ],
    hinglishGuide: 'Staff module me naye doctor ya staff add karein, role permissions set karein aur OPD timing bind karein.',
    technicalDetails: {
      actionKey: 'open-staff-directory'
    }
  },
  {
    id: 'partner-bank-settings',
    title: '🏦 Bank Account, UPI QR & Daily Settlement Setup',
    category: 'HOSPITAL_OPERATIONS',
    allowedPlatforms: ['PARTNER_PLATFORM'],
    summary: 'Hospital bank details, IFSC, aur custom UPI QR code configure karein.',
    keywords: ['bank', 'account', 'ifsc', 'settlement', 'upi qr', 'payout', 'bank details', 'payment setup'],
    steps: [
      '1. Step 1 (Open Settings): Profile icon se "Account Settings" kholein.',
      '2. Step 2 (Bank Tab): "Bank & Payouts" tab par click karein.',
      '3. Step 3 (Enter Details): Account Number, IFSC Code, aur Account Holder Name bharein.',
      '4. Step 4 (Instant Save): Save karte hi cashier desk par aapka custom UPI QR set ho jayega.'
    ],
    hinglishGuide: 'Settings me Bank tab kholein, IFSC aur account save karein — counter par aapka direct UPI chalu ho jayega.',
    technicalDetails: {
      actionKey: 'open-bank-settings'
    }
  },
  {
    id: 'partner-upgrade-subscription',
    title: '📦 Hospital Subscription Plan Kaise Upgrade Ya Renew Karein?',
    category: 'HOSPITAL_OPERATIONS',
    allowedPlatforms: ['PARTNER_PLATFORM'],
    summary: 'Current plan quota dekhein aur naye features ke liye plan upgrade karein.',
    keywords: ['plan', 'upgrade', 'renew', 'subscription', 'quota', 'recharge', 'expire', 'hospital plan', 'pricing'],
    steps: [
      '1. Step 1 (Subscription Tab): Settings me "Subscription & Plans" dekhein.',
      '2. Step 2 (Check Limits): Current plan (Clinic Starter / Hospital Pro) aur bache tokens dekhein.',
      '3. Step 3 (Select Tier): Higher plan select karein aur "Upgrade Plan" dabayein.',
      '4. Step 4 (Instant Unlock): UPI/Card payment hote hi naye features turant activate ho jayenge.'
    ],
    hinglishGuide: 'Settings me plan limits dekhein, "Upgrade Plan" dabayein aur payment karke naye modules unlock karein.',
    technicalDetails: {
      actionKey: 'open-hospital-subscription'
    }
  },

  // ==========================================
  // 3. COMPANY HQ (SUPER ADMIN / FOUNDER / MASTER BRAIN ONLY) - 15 COMPREHENSIVE TASKS
  // ==========================================
  {
    id: 'admin-approve-kyc',
    title: '✅ Partner KYC Verification & 1-Click Approval Kaise Karein?',
    category: 'ADMIN_KYC',
    allowedPlatforms: ['COMPANY_HQ'],
    summary: 'Executive Action Inbox se hospital documents check karke 1-click me verify karein.',
    keywords: ['kyc', 'approve', 'partner approval', 'verification', 'license', 'action inbox', 'activate', 'onboard', 'hospital approve', 'verify hospital'],
    steps: [
      '1. Step 1 (Action Inbox): Home screen par top "Executive Action Inbox" kholein.',
      '2. Step 2 (Review Docs): Hospital Name, City, Medical Council Reg aur CEA certificate preview karein.',
      '3. Step 3 (Inspect Owner): Owner Aadhaar/PAN aur contact details check karein.',
      '4. Step 4 (1-Click Approve): "✅ 1-Click Approve" button dabayein — hospital ka Partner OS instantly live ho jayega.'
    ],
    hinglishGuide: 'HQ Action Inbox me pending card dekhein aur "✅ 1-Click Approve" dabakar hospital ko turant activate karein.',
    technicalDetails: {
      routes: ['PATCH /api/v1/company/partners/:id/kyc-status'],
      dbTables: ['partner_profiles'],
      ports: ['5174 (HQ)'],
      actionKey: 'open-partner-lifecycle'
    }
  },
  {
    id: 'admin-create-plans',
    title: '💳 SaaS Subscription Plans, Pricing & Quotas Kaise Banayein?',
    category: 'ADMIN_PLANS',
    allowedPlatforms: ['COMPANY_HQ'],
    summary: 'Naye SaaS plans banayein, doctor/bed quota set karein aur 18% GST lagayein.',
    keywords: ['plan', 'pricing', 'subscription tier', 'quota', 'entitlement', 'b2b billing', 'gst', 'mrr', 'naya plan', 'doctor limit', 'bed limit', 'plan banaye'],
    steps: [
      '1. Step 1 (Open Module): "Product Plans, Tiers & Quotas" module kholein.',
      '2. Step 2 (New Plan): "+ Create SaaS Plan" button dabayein.',
      '3. Step 3 (Price & Limits): Monthly fee (₹), Allowed Doctors count, Bed count aur 18% GST set karein.',
      '4. Step 4 (Save & Deploy): Feature checkboxes (AI Scribe, ABDM, PACS) toggle karke Save karein.'
    ],
    hinglishGuide: 'HQ me Product Plans me jayein, price aur doctor limits bharein, features attach karein aur publish karein.',
    technicalDetails: {
      routes: ['POST /api/v1/company/product/plans', 'GET /api/v1/company/product/plans'],
      dbTables: ['subscriptions_catalog', 'subscription_entitlements'],
      ports: ['5174 (HQ)', '4000 (API)'],
      actionKey: 'open-product-plans'
    }
  },
  {
    id: 'admin-configure-partner-modules',
    title: '⚙️ Hospital Modules (IPD, Lab, OT, Pharmacy) On/Off Kaise Karein?',
    category: 'ADMIN_KYC',
    allowedPlatforms: ['COMPANY_HQ'],
    summary: 'Kisi bhi hospital ke specific modules ko enable/disable karein aur custom configuration dein.',
    keywords: ['module on off', 'toggle module', 'disable module', 'hospital settings', 'cockpit', 'ipd band', 'lab on', 'partner config', 'enable module'],
    steps: [
      '1. Step 1 (Partner CRM): "CRM & Healthcare Partner Lifecycle" me jayein.',
      '2. Step 2 (Select Facility): Hospitals list me se target hospital par click karein.',
      '3. Step 3 (Module Toggles): Configuration Cockpit me IPD, OT, Lab ya Pharmacy switch toggle karein.',
      '4. Step 4 (Sync Tenant): "Save & Sync Configuration" dabayein — hospital dashboard me turant reflect hoga.'
    ],
    hinglishGuide: 'Partner Lifecycle me hospital select karein, module switches toggle karein aur save karte hi sync ho jayega.',
    technicalDetails: {
      routes: ['PATCH /api/v1/company/partners/:id/modules'],
      dbTables: ['partner_configurations'],
      ports: ['5174 (HQ)'],
      actionKey: 'open-partner-cockpit'
    }
  },
  {
    id: 'admin-growth-carepass',
    title: '👑 Care Pass Pricing & Partner Commission Split Kaise Set Karein?',
    category: 'ADMIN_PLANS',
    allowedPlatforms: ['COMPANY_HQ'],
    summary: 'Patient Care Pass subscription rate aur hospital commission margin % configure karein.',
    keywords: ['care pass', 'growth engine', 'commission', 'margin split', 'monetization', 'patient pass', 'revenue split', 'commission set'],
    steps: [
      '1. Step 1 (Growth HQ): "Growth Engine & Monetization HQ" module kholein.',
      '2. Step 2 (Care Pass Tier): Individual ya Family Care Pass tier select karein.',
      '3. Step 3 (Set Split %): Platform commission margin (e.g. 15%) aur Hospital payout share set karein.',
      '4. Step 4 (Publish): "Update Care Pass Rules" dabayein — landing page aur billing me instantly apply hoga.'
    ],
    hinglishGuide: 'Growth Engine me Care Pass tier select karein, commission % dalein aur publish karein.',
    technicalDetails: {
      routes: ['POST /api/v1/company/growth/care-pass'],
      dbTables: ['care_pass_plans', 'partner_commission_rules'],
      ports: ['5174 (HQ)'],
      actionKey: 'open-growth-engine'
    }
  },
  {
    id: 'admin-finance-billing',
    title: '🧾 Partner Recurring Billing & 18% GST Ledger Kaise Check Karein?',
    category: 'ADMIN_PLANS',
    allowedPlatforms: ['COMPANY_HQ'],
    summary: 'Hospitals ke monthly subscription invoices, pending payments aur 18% GST ledger track karein.',
    keywords: ['finance', 'billing', 'gst ledger', 'invoice', 'pending payment', 'recurring bill', 'tax invoice', 'reconciliation', 'hisab'],
    steps: [
      '1. Step 1 (Finance Module): "Subscription / Billing / Finance" tab open karein.',
      '2. Step 2 (Invoice Ledger): Live hospital subscriptions aur pending renewal dues dekhein.',
      '3. Step 3 (GST Breakdown): 18% B2B GST (CGST + SGST) collection report inspect karein.',
      '4. Step 4 (Export Statement): Statutory CA audit ke liye "Export GST Ledger (CSV/PDF)" dabayein.'
    ],
    hinglishGuide: 'Finance tab me hospital invoices aur 18% GST ledger dekhein aur audit report download karein.',
    technicalDetails: {
      routes: ['GET /api/v1/company/billing/invoices'],
      dbTables: ['subscription_invoices', 'gst_tax_ledgers'],
      ports: ['5174 (HQ)'],
      actionKey: 'open-finance-billing'
    }
  },
  {
    id: 'admin-broadcast-message',
    title: '📢 Pan-India WhatsApp & SMS Broadcast Kaise Bhejein?',
    category: 'HOSPITAL_OPERATIONS',
    allowedPlatforms: ['COMPANY_HQ'],
    summary: 'Sabhi hospitals ya doctors ko platform update, release note ya emergency notification bhejein.',
    keywords: ['broadcast', 'whatsapp alert', 'bulk message', 'sms notification', 'announcement', 'all doctors', 'communication', 'message bhejna', 'broadcast kaise kare'],
    steps: [
      '1. Step 1 (Communication Hub): "Broadcast & WhatsApp Engagement Hub" kholein.',
      '2. Step 2 (Audience Select): Target Audience chunein (All Hospitals, Doctors Only, ya Specific Tier).',
      '3. Step 3 (Draft Content): Broadcast Title aur Hindi/English message body type karein.',
      '4. Step 4 (Dispatch): "Send Pan-India Broadcast" dabayein — seconds me sabhi ko delivered ho jayega.'
    ],
    hinglishGuide: 'Communication Hub me message type karein, Audience select karein aur 1 click me dispatch karein.',
    technicalDetails: {
      routes: ['POST /api/v1/company/communication/broadcast'],
      ports: ['5174 (HQ)'],
      actionKey: 'open-broadcast-hub'
    }
  },
  {
    id: 'admin-abdm-compliance',
    title: '🇮🇳 ABDM 2.0 (M1, M2, M3) Compliance & NABH Audit Kaise Check Karein?',
    category: 'ARCHITECTURE',
    allowedPlatforms: ['COMPANY_HQ'],
    summary: 'Government Ayushman Bharat milestones (M1, M2, M3) aur NABH digital audit check karein.',
    keywords: ['abdm compliance', 'm1', 'm2', 'm3', 'nabh audit', 'ayushman bharat', 'regulatory', 'fhir gateway', 'hip hiu', 'sarkari compliance'],
    steps: [
      '1. Step 1 (Compliance Hub): "Regulatory Compliance & ABDM Hub" me jayein.',
      '2. Step 2 (Audit Milestones): M1 (ABHA Creation), M2 (Scan & Share), M3 (Health Records Exchange) status dekhein.',
      '3. Step 3 (Hospital Audit): Kisi bhi partner hospital ki FHIR payload compliance score inspect karein.',
      '4. Step 4 (Certificate): Statutory compliance verification pass hone par "Issue ABDM Certificate" karein.'
    ],
    hinglishGuide: 'ABDM Hub me M1/M2/M3 compliance score dekhein aur verified hospitals ko certificate issue karein.',
    technicalDetails: {
      routes: ['GET /api/v1/company/compliance/abdm-milestones'],
      ports: ['5174 (HQ)'],
      actionKey: 'open-abdm-compliance'
    }
  },
  {
    id: 'admin-rbac-permissions',
    title: '🛡️ Admin Staff RBAC Permissions & Role Clearance Kaise Dein?',
    category: 'SAFE_CRUD',
    allowedPlatforms: ['COMPANY_HQ'],
    summary: 'Company HQ ke employees ko domain-level RBAC security clearance assign karein.',
    keywords: ['rbac', 'staff permission', 'staff access', 'employee access', 'role policy', 'security seal', 'clearance', 'user role', 'admin access', 'clearance dena', 'rbac access', 'permissions'],
    steps: [
      '1. Step 1 (Security Desk): "Security / Zero-Trust RBAC / Audit" module kholein.',
      '2. Step 2 (Select Staff): Internal HQ Employee list me se target user chunein.',
      '3. Step 3 (Set Clearance): Finance, CRM, Compliance ya Technology domains ke checkboxes toggle karein.',
      '4. Step 4 (Lock Policy): "Commit RBAC Policy" dabayein — unauthorized domains turant 403 shield se lock ho jayenge.'
    ],
    hinglishGuide: 'Security module me employee select karein, allowed domains tick karein aur commit policy dabayein.',
    technicalDetails: {
      routes: ['POST /api/v1/company/security/rbac-policies'],
      dbTables: ['staff_role_policies'],
      ports: ['5174 (HQ)'],
      actionKey: 'open-rbac-security'
    }
  },
  {
    id: 'admin-leak-investigation',
    title: '🕵️ Forensic Audit Trace & Data Leak Kaise Investigate Karein?',
    category: 'SAFE_CRUD',
    allowedPlatforms: ['COMPANY_HQ'],
    summary: 'Suspicious data export, IP watermark breach ya deleted record ka forensic root-cause trace karein.',
    keywords: ['leak', 'forensic', 'data breach', 'investigate', 'watermark', 'ip trace', 'tamper', 'suspicious activity', 'leak pakdna', 'chori trace'],
    steps: [
      '1. Step 1 (Audit Module): "Security / Zero-Trust RBAC / Audit" me jayein.',
      '2. Step 2 (Forensic Search): Staff Employee Code, IP Address ya Timestamp dalkar query karein.',
      '3. Step 3 (Inspect Evidence): Tamper-evident forensic watermark aur exact patient records access log dekhein.',
      '4. Step 4 (Break-Glass Review): Emergency access use hone par "Lock Terminal" ya "Revoke Clearance" karein.'
    ],
    hinglishGuide: 'Audit module me Employee Code ya IP Address dalein, forensic logs dekhein aur breach hone par terminal lock karein.',
    technicalDetails: {
      routes: ['GET /api/v1/company/security/forensic-trace'],
      ports: ['5174 (HQ)'],
      actionKey: 'open-leak-investigation'
    }
  },
  {
    id: 'admin-ai-governance',
    title: '🧠 Clinical AI Registry, CDSS Guardrails & Token Limits Kaise Manage Karein?',
    category: 'ARCHITECTURE',
    allowedPlatforms: ['COMPANY_HQ'],
    summary: 'AI Voice Scribe, diagnostic CDSS safety prompts aur token consumption oversight control karein.',
    keywords: ['ai governance', 'cdss', 'prompt safety', 'token limit', 'llm registry', 'whisper api', 'clinical ai', 'ai safety', 'model limit'],
    steps: [
      '1. Step 1 (AI Platform): "Clinical AI & Safety Governance" module open karein.',
      '2. Step 2 (Model Registry): Active clinical LLM models (Whisper, Gemini CDSS) ki latency aur error rate dekhein.',
      '3. Step 3 (Safety Guardrails): Hallucination prevention aur statutory drug interaction warning thresholds set karein.',
      '4. Step 4 (Quota Control): Har hospital ke monthly AI Voice Scribe token quotas adjust karein.'
    ],
    hinglishGuide: 'AI Platform me Whisper & Gemini error rates dekhein, clinical safety prompts set karein aur token quota allot karein.',
    technicalDetails: {
      routes: ['GET /api/v1/company/ai/models'],
      ports: ['5174 (HQ)'],
      actionKey: 'open-ai-governance'
    }
  },
  {
    id: 'admin-infrastructure-monitoring',
    title: '🖥️ Cluster Health, API Latency & Redis Cache Monitoring Kaise Karein?',
    category: 'ARCHITECTURE',
    allowedPlatforms: ['COMPANY_HQ'],
    summary: 'Fastify REST Gateway, PostgreSQL replica sync aur cluster memory telemetry monitor karein.',
    keywords: ['infrastructure', 'cluster health', 'latency', 'redis cache', 'server health', 'api gateway status', 'monitoring', 'failover', 'server check'],
    steps: [
      '1. Step 1 (Infra Desk): "Infrastructure / Monitoring / DR" module kholein.',
      '2. Step 2 (Health Ticker): Fastify Gateway (Port 4000), p95 latency (<45ms), aur CPU/Memory load dekhein.',
      '3. Step 3 (Database Health): PostgreSQL connection pool aur read/write split replication sync verify karein.',
      '4. Step 4 (DR Drill): Kisi node failure par "Initiate Standby Failover" test karein.'
    ],
    hinglishGuide: 'Infrastructure module me Fastify p95 latency, PostgreSQL pool aur Redis memory health live track karein.',
    technicalDetails: {
      routes: ['GET /api/v1/company/infrastructure/telemetry'],
      ports: ['5174 (HQ)', '4000 (API)'],
      actionKey: 'open-infrastructure-monitoring'
    }
  },
  {
    id: 'admin-founder-approvals',
    title: '🏛️ Founder 2-Man Rule Approvals & Risk Governance Kaise Handle Karein?',
    category: 'SAFE_CRUD',
    allowedPlatforms: ['COMPANY_HQ'],
    summary: 'Sensitive actions (database purge, partner termination, license revoke) ke liye dual approval dena.',
    keywords: ['founder approval', '2-man rule', 'risk governance', 'dual approval', 'high risk action', 'executive signoff', 'founder approval dena'],
    steps: [
      '1. Step 1 (Open Approvals): Top header me "🛡️ Founder Approvals" button dabayein.',
      '2. Step 2 (Inspect Request): Pending request ka Reason, Requesting Admin aur Impact analysis padhein.',
      '3. Step 3 (Verify Integrity): Action signature aur cryptographic verification hash check karein.',
      '4. Step 4 (Approve / Reject): "Approve Action" dabakar cryptographic digital signature se unlock karein.'
    ],
    hinglishGuide: 'Top bar me Founder Approvals kholein, risk analysis dekhein aur 2-man rule ke tahat action sign-off karein.',
    technicalDetails: {
      routes: ['POST /api/v1/company/founder-approvals/sign'],
      ports: ['5174 (HQ)'],
      actionKey: 'open-founder-approvals'
    }
  },
  {
    id: 'admin-safe-crud',
    title: '🛡️ Safe CRUD Rules & Day-0 Safe Directory Purge Protocols',
    category: 'SAFE_CRUD',
    allowedPlatforms: ['COMPANY_HQ'],
    summary: 'Strict data integrity: Foreign key protection, soft-delete protocol (is_active=false), aur Day-0 safe purge.',
    keywords: ['safe crud', 'delete hospital', 'purge test data', 'soft delete', 'foreign key safety', 'reset directory', 'delete', 'remove'],
    steps: [
      '1. Rule 1 (No SQL Hard Delete): Patients ya bills par kabhi DELETE FROM mat chalao — foreign keys break hongi.',
      '2. Rule 2 (Soft-Delete Standard): Hamesha is_active = false ya CANCELLED status use karein.',
      '3. Rule 3 (Day-0 Safe Purge): Test data safa karne ke liye POST /reset-directory transaction use karein.',
      '4. Rule 4 (Zero-Mock Invariant): Sabhi hospitals database driven hone chahiye, koi hardcoded mock data nahi.'
    ],
    hinglishGuide: 'Database me kabhi hard delete mat karein — hamesha soft-delete use karein aur purge ke liye transactional endpoint use karein.',
    technicalDetails: {
      routes: ['POST /api/v1/company/partners/reset-directory'],
      dbTables: ['partner_profiles', 'audit_events'],
      ports: ['4000 (API)'],
      actionKey: 'open-audit-trace'
    }
  },
  {
    id: 'admin-theme-whitelabel',
    title: '🎨 Hospital White-Label Branding & 14 Clinical Themes Kaise Badlein?',
    category: 'ARCHITECTURE',
    allowedPlatforms: ['COMPANY_HQ'],
    summary: 'Hospital custom colors, brand logo aur 14 enterprise themes (Obsidian, Swiss, Gold) configure karein.',
    keywords: ['theme', 'whitelabel', 'brand logo', 'color scheme', 'theme studio', 'swiss clinical', 'obsidian', 'branding', 'theme badlna', 'color badlna'],
    steps: [
      '1. Step 1 (Theme Studio): Top bar me Theme icon (Palette) par click karein.',
      '2. Step 2 (Select Theme): 14 Enterprise Clinical Themes me se preferred theme preview karein.',
      '3. Step 3 (White-Label): "Apply White-Label to Shell" checkbox toggle karke custom hospital name aur hex color dalein.',
      '4. Step 4 (Apply): "Save Theme Preference" dabayein — puri screen instantly update ho jayegi.'
    ],
    hinglishGuide: 'Theme Studio kholein, 14 themes me se chunein aur hospital branding colors customize karein.',
    technicalDetails: {
      actionKey: 'open-theme-studio',
      ports: ['5174 (HQ)']
    }
  },
  {
    id: 'admin-monorepo-arch',
    title: '🏗️ Monorepo Architecture, Ports (4000, 5173, 5174, 5175) & Services Blueprint',
    category: 'ARCHITECTURE',
    allowedPlatforms: ['COMPANY_HQ'],
    summary: 'Complete architecture: API Gateway, Landing, HQ, Partner OS, aur PostgreSQL schemas.',
    keywords: ['architecture', 'port', 'ports', '4000', '5173', '5174', '5175', 'fastify', 'postgres', 'drizzle', 'monorepo', 'gateway', 'vite', 'start all'],
    steps: [
      '1. Port 4000 (API Gateway): apps/api-gateway (Fastify 5 REST API + JWT Zero-Trust).',
      '2. Port 5173 (Landing Portal): apps/landing-page (Public portal & patient onboarding).',
      '3. Port 5174 (Company HQ): apps/company-platform (Super Admin governance command center).',
      '4. Port 5175 (Partner Platform): apps/partner-platform (Hospital OS for daily OPD/EMR/Pharmacy).',
      '5. Start-All Command: Ek command me sabhi servers run karne ke liye "node scripts/start-all.js" use karein.'
    ],
    hinglishGuide: 'System 4 ports par run hota hai: 4000 (API), 5173 (Landing), 5174 (HQ), aur 5175 (Partner Platform).',
    technicalDetails: {
      ports: ['4000 (API)', '5173 (Landing)', '5174 (HQ)', '5175 (Partner)'],
      actionKey: 'open-infrastructure-monitoring'
    }
  },
  {
    id: 'admin-ai-document-verification',
    title: '🤖 EWAN AI Auto-KYC Screener: Valid vs Invalid Document Pehchan Kaise Karein?',
    category: 'ADMIN_KYC',
    allowedPlatforms: ['COMPANY_HQ'],
    summary: 'EWAN 4-layer document verification: Statutory GSTIN Luhn Mod-36 checksum, NMC/CEA syntax, expiry date aur legal entity name match.',
    keywords: ['upload document', 'document verification', 'valid invalid', 'fake document', 'expired license', 'gstin checksum', 'nmc license', 'document check', 'auto kyc', 'document kyc', 'kyc verification', 'pahchan', 'document', 'documents'],
    steps: [
      '1. Step 1 (Inbox Dekhein): "Executive Action Inbox" me pending registration ke samne EWAN AI Scorecard dekhein (🟢 Safe ya 🔴 High Risk).',
      '2. Step 2 (4-Layer Audit): "🔍 View AI Audit Checks" dabakar GSTIN Checksum, Medical Council License, Expiry Date aur Name Match verify karein.',
      '3. Step 3 (EWAN Consultation): "🧠 Ask EWAN to Audit" dabakar EWAN se instant automated compliance verdict lein.',
      '4. Step 4 (Decision): Agar score ≥ 80% aur 0 fraud flags ho to "✅ 1-Click Approve" dabayein, fake/expired hone par "❌ Reject" karein.'
    ],
    hinglishGuide: 'EWAN AI Screener har document ke GSTIN Mod-36 checksum, Medical Council syntax, expiry aur entity name ko 4 layers me check karke 1-Click safe approval deta hai.',
    technicalDetails: {
      routes: ['GET /api/v1/company/partners/verification-queue', 'PATCH /api/v1/company/partners/:id/kyc-status'],
      ports: ['5174 (HQ)', '4000 (API)'],
      actionKey: 'open-partner-verification'
    }
  }
];

/**
 * Filter topics strictly by active platform / user persona.
 */
export function getTopicsForPlatform(platform: EwanPlatform | 'UNIVERSAL'): EwanKnowledgeTopic[] {
  if (platform === 'UNIVERSAL' || platform === 'COMPANY_HQ') {
    return EWAN_KNOWLEDGE_TOPICS;
  }
  return EWAN_KNOWLEDGE_TOPICS.filter((t) => t.allowedPlatforms.includes(platform));
}

/**
 * Search knowledge base with conversational stop-word cleaning and smart relevance scoring.
 */
export function searchEwanKnowledge(
  query: string,
  platform: EwanPlatform | 'UNIVERSAL' = 'UNIVERSAL',
  userRole?: string
): EwanKnowledgeTopic[] {
  const allowedTopics = getTopicsForPlatform(platform);

  if (!query || query.trim().length === 0) {
    return allowedTopics;
  }

  const clean = query.toLowerCase().trim();
  const normalizedUserRole = userRole ? userRole.trim().toUpperCase().replace(/[\s-]+/g, '_') : undefined;

  // Filter out conversational Hindi/English stop-words so user queries like "broadcast kaise karu" or "task kaise hoga" isolate the core subject
  const stopWords = new Set([
    'kaise', 'karein', 'karu', 'karna', 'karo', 'hoga', 'hai', 'h', 'kya', 'batao',
    'step', 'steps', 'bhul', 'gaya', 'task', 'ko', 'me', 'se', 'par', 'ki', 'ke',
    'aur', 'kaha', 'hota', 'padega', 'bhai', 'please', 'help', 'kare'
  ]);

  const words = clean
    .replace(/[?,.!]/g, ' ')
    .split(/\s+/)
    .filter((w) => !stopWords.has(w))
    .filter(Boolean);

  const scored = allowedTopics.map((topic) => {
    let score = 0;
    const titleLower = topic.title.toLowerCase();
    const summaryLower = topic.summary.toLowerCase();
    const hinglishLower = topic.hinglishGuide.toLowerCase();

    // Direct clean query match
    if (titleLower.includes(clean)) score += 35;
    if (summaryLower.includes(clean)) score += 20;

    // Keyword match
    for (const kw of topic.keywords) {
      const kwLower = kw.toLowerCase();
      if (kwLower === clean) score += 40;
      else if (clean.includes(kwLower) || kwLower.includes(clean)) score += 20;
      for (const w of words) {
        if (kwLower === w) score += 18;
        else if (kwLower.includes(w) || w.includes(kwLower)) score += 8;
      }
    }

    // Word match against title and summary
    for (const w of words) {
      if (titleLower.includes(w)) score += 12;
      if (summaryLower.includes(w)) score += 6;
      if (hinglishLower.includes(w)) score += 2;
    }

    // Platform affinity bonus: prioritize topics authored for the active platform
    if (platform !== 'UNIVERSAL' && topic.allowedPlatforms.includes(platform as EwanPlatform)) {
      score += 15;
    }

    // Role affinity bonus & restriction check
    if (normalizedUserRole) {
      if (topic.targetRoles && topic.targetRoles.includes(normalizedUserRole)) {
        score += 25;
      }
      if (topic.restrictedRoles && topic.restrictedRoles.includes(normalizedUserRole)) {
        // Demote topic so it doesn't mask role boundary enforcement
        score = Math.max(0, score - 50);
      }
    }

    return { topic, score };
  });

  return scored
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((item) => item.topic);
}
