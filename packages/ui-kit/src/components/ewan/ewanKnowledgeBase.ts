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
  category:
    | 'PATIENT_CARE'
    | 'HOSPITAL_OPERATIONS'
    | 'ADMIN_PLANS'
    | 'ADMIN_KYC'
    | 'SAFE_CRUD'
    | 'ARCHITECTURE'
    | 'CLINICAL_SAFETY'
    | 'REVENUE_INTEGRITY'
    | 'GOVERNMENT_SCHEMES'
    | 'EMERGENCY_ICU'
    | 'SUPPLY_CHAIN';
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
    id: 'account-password-reset',
    title: '🔑 Password Kaise Change Ya Reset Karein?',
    category: 'HOSPITAL_OPERATIONS',
    allowedPlatforms: ['PARTNER_PLATFORM', 'COMPANY_HQ', 'LANDING_PAGE'],
    summary: 'Universal Security: Apna login password change karein ya bhool jane par secure OTP se reset karein.',
    keywords: [
      'password',
      'change password',
      'reset password',
      'password change',
      'passward',
      'pasward',
      'pwd',
      'login',
      'credentials',
      'badal',
      'badalna',
      'naya password',
      'forgot password',
      'security'
    ],
    steps: [
      '1. Step 1 (Open Security Tab): Niche diye gaye "🔑 Open Password Settings" button par click karein (ya top-right profile avatar par click karke Security option chunein).',
      '2. Step 2 (Current Password): Apna Current Password enter karein.',
      '3. Step 3 (New Password): Naya strong password (minimum 8 characters, jisme number aur symbol ho) enter karein.',
      '4. Step 4 (Save): "Update Password" button dabayein. Password turant update ho jayega.',
      '5. Step 5 (Forgot Password): Agar password bhool gaye hain to login screen par "Forgot Password / OTP Login" use karein.'
    ],
    hinglishGuide: 'Top-right profile avatar par click karein ya niche diye gaye button se seedha Password tab kholein, purana aur naya password enter karke Save karein.',
    nextBestStep: 'Niche button click karein aur apna naya secure password set karein.',
    troubleshooting: [
      {
        commonIssue: 'Password match nahi ho raha ya weak password alert aa raha hai.',
        solution: 'Password me kam se kam 8 characters, ek uppercase letter, ek number aur ek special symbol (@, #, $) hona zaroori hai.'
      },
      {
        commonIssue: 'Purana password yaad nahi hai.',
        solution: 'Apne facility administrator se reset karwayein ya login page par Mobile OTP reset option use karein.'
      }
    ],
    technicalDetails: {
      actionKey: 'open-password-settings',
      routes: ['POST /api/v1/auth/change-password', 'POST /api/v1/auth/reset-password']
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
  },
  // =========================================================================
  // 4. EWAN 2.0 ADVANCED CLINICAL, REVENUE & STATUTORY DOMAINS (15 ENCLAVES)
  // =========================================================================
  {
    id: 'partner-ot-safety-sentinel',
    title: '🛡️ Autonomous OT Surgical Safety, PAC Clearance & Count Reconciliation',
    category: 'CLINICAL_SAFETY',
    allowedPlatforms: ['PARTNER_PLATFORM', 'COMPANY_HQ'],
    summary: 'Anaesthesia Pre-Op Clearance (PAC), WHO 3-phase checklist aur dual-nurse sponge & needle count reconciliation.',
    keywords: ['ot', 'surgery', 'pac', 'anaesthesia', 'who checklist', 'sponge count', 'needle count', 'theatre', 'operation', 'sterile'],
    targetRoles: ['SURGEON', 'ANAESTHETIST', 'OT_NURSE', 'SCRUB_NURSE', 'CIRCULATING_NURSE', 'MEDICAL_DIRECTOR', 'SUPER_ADMIN'],
    requiredModule: 'ot-safety-sentinel',
    nextBestStep: 'PAC clearance status verify karein aur incision se pehle mandatory Time-Out sign-off complete karein.',
    steps: [
      '1. Step 1 (PAC Sign-off): Anaesthetist PAC desk me NPO fasting status, ASA score aur Mallampati airway grade sign karein.',
      '2. Step 2 (WHO 3-Phase Checklist): Patient entry par Sign-In, incision se pehle Time-Out, aur closure par Sign-Out sign karein.',
      '3. Step 3 (Dual-Nurse Count): Scrub Nurse aur Circulating Nurse sponges, needles aur instruments ka count reconcile karein.',
      '4. Step 4 (Closure Lock): Discrepancy hone par wound closure auto-halt hota hai aur portable X-Ray mandatory trigger hoti hai.'
    ],
    hinglishGuide: 'OT Safety Sentinel mein bina PAC clearance ke patient entry freeze rehti hai, Time-Out ke bina incision block hota hai, aur sponge mismatch par closure band ho jata hai.',
    troubleshooting: [
      {
        commonIssue: 'Theatre admission locked dikh raha hai',
        solution: 'Anaesthetist se confirm karein ki minimum 6 ghante NPO fasting verify karke PAC clearance approve ho chuki hai.'
      }
    ],
    technicalDetails: {
      routes: [
        'POST /api/v1/partner/ot-safety/pac/sign-clearance',
        'POST /api/v1/partner/ot-safety/checklist/phase',
        'POST /api/v1/partner/ot-safety/reconciliation/count-tray'
      ],
      dbTables: ['company.ot_pac_clearances', 'company.ot_who_checklists', 'company.ot_count_reconciliations'],
      actionKey: 'open-ot-safety-sentinel'
    }
  },
  {
    id: 'partner-bedside-concierge-callbell',
    title: '🛎️ Inpatient Bedside Smart Tablet Concierge & 3-Min SLA Call Bell',
    category: 'HOSPITAL_OPERATIONS',
    allowedPlatforms: ['PARTNER_PLATFORM', 'COMPANY_HQ'],
    summary: 'Bedside smart concierge tablet, NFC nurse tap verification, 3-minute SLA escalation, aur IoT IV drip monitoring.',
    keywords: ['bedside', 'call bell', 'nurse call', 'concierge', 'iv drip', 'sla', 'dietary', 'inpatient', 'ipd'],
    targetRoles: ['NURSE', 'STAFF_NURSE', 'WARD_INCHARGE', 'HOSPITAL_ADMIN', 'SUPER_ADMIN'],
    requiredModule: 'bedside-concierge',
    nextBestStep: 'Active call bell alerts ko 3 minute ke andar bedside NFC tap se resolve karein taaki WhatsApp escalation na ho.',
    steps: [
      '1. Step 1 (Patient Trigger): Patient bedside tablet ya QR se nurse assistance ya pain relief trigger karein.',
      '2. Step 2 (3-Min Countdown): Nursing station screen par 3-minute SLA response timer countdown shuru hota hai.',
      '3. Step 3 (NFC Tap Sign-off): Ward nurse bedside tablet par ID card tap karke visit physically confirm karein.',
      '4. Step 4 (Escalation Cron): 3 minute se zyada unanswered calls turant Ward Sister aur Superintendent WhatsApp par escalate hoti hain.'
    ],
    hinglishGuide: 'Bedside tablet se call bell dabte hi 3 minute ka timer chalu hota hai. Nurse ko bedside jakar NFC tap karna hota hai warna WhatsApp alert jata hai.',
    troubleshooting: [
      {
        commonIssue: 'Call bell WhatsApp escalation trigger ho gaya',
        solution: 'Nursing desk par call open rehte hi bedside physically tap karke "RESOLVED" status mark karein.'
      }
    ],
    technicalDetails: {
      routes: [
        'POST /api/v1/partner/bedside-concierge/call-bell',
        'POST /api/v1/partner/bedside-concierge/call-bell/resolve',
        'POST /api/v1/partner/bedside-concierge/iot/iv-drip-telemetry'
      ],
      dbTables: ['company.bedside_call_bells', 'company.bedside_iv_telemetry'],
      actionKey: 'open-bedside-concierge'
    }
  },
  {
    id: 'partner-smart-pharmacy-fefo-pos',
    title: '💊 Smart Pharmacy POS: GS1 2D Barcode, FEFO Expiry Lock & CDSCO H1',
    category: 'SUPPLY_CHAIN',
    allowedPlatforms: ['PARTNER_PLATFORM', 'COMPANY_HQ'],
    summary: 'GS1 2D DataMatrix scanning, First-Expiry-First-Out (FEFO) expiry lock, CDSCO Schedule H1/X narcotics register.',
    keywords: ['pharmacy', 'pos', 'gs1', 'datamatrix', 'barcode', 'fefo', 'expiry', 'schedule h1', 'narcotics', 'cdsco'],
    targetRoles: ['PHARMACIST', 'DISPENSING_PHARMACIST', 'CHIEF_PHARMACIST', 'SUPER_ADMIN'],
    requiredModule: 'pharmacy-medication',
    nextBestStep: 'Earliest expiring batch scan karein aur Schedule H1 drugs ke liye doctor MCI registration number verify karein.',
    steps: [
      '1. Step 1 (GS1 Scan): Pharmacy counter par medicine box ka 2D DataMatrix barcode scan karein (GTIN, Batch, Expiry auto-parse).',
      '2. Step 2 (FEFO Hard-Lock): System earliest expiring batch mandate karta hai. Baad ka batch lene par 409 Conflict aayega.',
      '3. Step 3 (CDSCO H1 Register): Schedule H1/X drugs ke liye Prescribing Doctor ka MCI number aur dual digital signature note karein.',
      '4. Step 4 (Atomic Dispense): Bill settle hote hi PostgreSQL batch inventory se stock instantly reduce hota hai aur ESC/POS receipt print hoti hai.'
    ],
    hinglishGuide: 'Barcode scan karte hi GTIN aur batch auto-load hota hai. Earliest batch pehle bechna zaroori hai (FEFO). H1 दवाइयों ke liye doctor ka MCI number statutory mandatory hai.',
    troubleshooting: [
      {
        commonIssue: 'FEFO_BATCH_VIOLATION error aa raha hai',
        solution: 'Rack se woh batch uthayein jiski expiry sabse pehle hai. System dead-stock rokne ke liye later batch block karta hai.'
      }
    ],
    technicalDetails: {
      routes: [
        'POST /api/v1/partner/pharmacy-pos/scan-gs1',
        'POST /api/v1/partner/pharmacy-pos/validate-fefo',
        'POST /api/v1/partner/pharmacy-pos/h1-register',
        'POST /api/v1/partner/pharmacy-pos/settle-bill'
      ],
      dbTables: ['company.pharmacy_inventory_batches', 'company.pharmacy_controlled_substances'],
      actionKey: 'open-pharmacy-pos'
    }
  },
  {
    id: 'partner-pmjay-government-scheme',
    title: '🏛️ Ayushman Bharat PM-JAY HBP 2.2 & State Government Scheme Auto-Tariff',
    category: 'GOVERNMENT_SCHEMES',
    allowedPlatforms: ['PARTNER_PLATFORM', 'COMPANY_HQ'],
    summary: 'NHA Health Benefit Packages (HBP 2.2) tariffs, TMS Golden Card verification, pre-auth cashless coverage guarantee.',
    keywords: ['pmjay', 'ayushman bharat', 'golden card', 'hbp', 'government scheme', 'cashless', 'tms', 'sha'],
    targetRoles: ['PMJAY_DESK_EXECUTIVE', 'TPA_EXECUTIVE', 'BILLING_MANAGER', 'HOSPITAL_ADMIN', 'SUPER_ADMIN'],
    requiredModule: 'pmjay-government-scheme',
    nextBestStep: 'Patient Golden Card balance verify karein aur surgery se pehle State Health Agency pre-auth token generate karein.',
    steps: [
      '1. Step 1 (Package Search): PM-JAY master se standardized HBP 2.2 surgery package (e.g. Lap Chole @ ₹32,000) chunein.',
      '2. Step 2 (TMS Verification): Patient ABHA / Golden Card number se ₹5,00,000 active family balance verify karein.',
      '3. Step 3 (Pre-Auth Claim): Clinical admission summary aur investigation reports attach karke SHA pre-auth initiate karein.',
      '4. Step 4 (Zero-Balance Billing): Pre-auth approved hone par 100% cashless zero-balance final invoice generate karein.'
    ],
    hinglishGuide: 'Ayushman Bharat desk par Golden Card verify karke NHA package choose karein. Pre-auth aane par patient ka zero-balance bill banta hai aur paise direct SHA se aate hain.',
    troubleshooting: [
      {
        commonIssue: 'TMS portal verification timeout',
        solution: 'ABDM ABHA verification bypass switch use karein ya patient Ration Card ID se secondary lookup karein.'
      }
    ],
    technicalDetails: {
      routes: [
        'GET /api/v1/partner/pmjay/packages/search',
        'POST /api/v1/partner/pmjay/beneficiary/verify',
        'POST /api/v1/partner/pmjay/pre-auth/initiate',
        'POST /api/v1/partner/pmjay/claim/adjudicate'
      ],
      dbTables: ['company.pmjay_case_adjudications'],
      actionKey: 'open-pmjay-desk'
    }
  },
  {
    id: 'partner-blood-bank-cold-chain',
    title: '🩸 Cold-Chain Blood Bank IoT Sentinel & 48-Hour Crossmatch Auto-Release',
    category: 'CLINICAL_SAFETY',
    allowedPlatforms: ['PARTNER_PLATFORM', 'COMPANY_HQ'],
    summary: 'PRBC/FFP chiller temperature monitoring (2°C to 6°C), breach alarms, aur 48-ghante baad crossmatch auto-unfreeze.',
    keywords: ['blood bank', 'cold chain', 'prbc', 'ffp', 'crossmatch', 'temperature', 'blood group', 'transfusion'],
    targetRoles: ['BLOOD_BANK_OFFICER', 'LAB_TECHNICIAN', 'PATHOLOGIST', 'SUPER_ADMIN'],
    requiredModule: 'blood-bank-cold-chain',
    nextBestStep: 'Chiller temperature telemetry status check karein aur unutilized reserved units ko emergency pool me unfreeze karein.',
    steps: [
      '1. Step 1 (IoT Telemetry): Blood storage chillers se continuous temperature data (+2°C to +6°C) ingest hota hai.',
      '2. Step 2 (Breach Alert): Agar temp +6°C se upar jata hai, to audible alarm aur emergency SMS BBO ko jata hai.',
      '3. Step 3 (Crossmatch Reserve): Surgery ke liye blood unit cross-match karke 48-ghante reservation timer engage karein.',
      '4. Step 4 (Auto-Expiry Sweep): 48 ghante me unutilized blood units automatic General Emergency Pool me restore ho jati hain.'
    ],
    hinglishGuide: 'Blood bank chillers ka temperature 2°C se 6°C me lock rehta hai. Surgery ke liye reserve blood agar 48 ghante me use na ho, to auto-release hokar emergency pool me chala jata hai.',
    troubleshooting: [
      {
        commonIssue: 'Temperature breach alarm trigger hua',
        solution: 'Immediate backup compressor switch karein aur temperature logs me manual probe calibration note karein.'
      }
    ],
    technicalDetails: {
      routes: [
        'POST /api/v1/partner/blood-bank/telemetry/ingest',
        'POST /api/v1/partner/blood-bank/crossmatch/reserve',
        'POST /api/v1/partner/blood-bank/crossmatch/auto-expire-sweep',
        'GET /api/v1/partner/blood-bank/inventory/summary'
      ],
      dbTables: ['company.blood_bank_cold_chain_telemetry', 'company.blood_crossmatch_reservations'],
      actionKey: 'open-blood-bank'
    }
  },
  {
    id: 'partner-radiology-ecg-ai-cv',
    title: '🩻 Multi-Modal Radiology & ECG AI Computer Vision Triage (Qure.ai Benchmark)',
    category: 'CLINICAL_SAFETY',
    allowedPlatforms: ['PARTNER_PLATFORM', 'COMPANY_HQ'],
    summary: 'DICOM Chest X-Ray AI (Pneumothorax), Brain CT AI (Subdural Hematoma), aur 12-Lead ECG AI (STEMI / Cath Lab triage).',
    keywords: ['radiology', 'xray', 'ct scan', 'ecg', 'ai', 'dicom', 'pacs', 'pneumothorax', 'stemi', 'hematoma'],
    targetRoles: ['RADIOLOGIST', 'CARDIOLOGIST', 'EMERGENCY_PHYSICIAN', 'DOCTOR', 'SUPER_ADMIN'],
    requiredModule: 'radiology-ai-triage',
    nextBestStep: 'Critical red-flag queue review karein aur STEMI ECG aate hi 1-click se Cath Lab team activate karein.',
    steps: [
      '1. Step 1 (DICOM Ingest): Modality (X-Ray/CT/ECG) scan PACS Server (Port 8042) par auto-push karein.',
      '2. Step 2 (AI Inference): Deep neural net <4 second me Pneumothorax, Midline Shift ya STEMI flag karta hai.',
      '3. Step 3 (Heatmap Overlay): Radiologist viewer par red bounding box heatmap aur confidence percentage display hota hai.',
      '4. Step 4 (ER WhatsApp Alert): Critical finding detect hote hi attending emergency physician ke phone par alert broadcast hota hai.'
    ],
    hinglishGuide: 'X-Ray, CT ya ECG aate hi AI 4 second me critical bimari (jaise heart attack ya lung collapse) pehchan kar red flag karta hai aur ER team ko turant alert bhejta hai.',
    technicalDetails: {
      routes: [
        'POST /api/v1/partner/radiology-ai/analyze-scan',
        'GET /api/v1/partner/radiology-ai/critical-findings/alerts'
      ],
      dbTables: ['company.radiology_ai_analyses'],
      ports: ['8042 (PACS)', '4000 (API)'],
      actionKey: 'open-radiology-ai'
    }
  },
  {
    id: 'partner-smart-icu-deterioration',
    title: '🩺 Smart ICU & Ward Deterioration Early Warning Sentinel (NEWS2 Scoring)',
    category: 'EMERGENCY_ICU',
    allowedPlatforms: ['PARTNER_PLATFORM', 'COMPANY_HQ'],
    summary: 'National Early Warning Score (NEWS2) calculation, septic shock early warning, Rapid Response Team (RRT) crash cart dispatch.',
    keywords: ['icu', 'news2', 'deterioration', 'vitals', 'sepsis', 'rrt', 'crash cart', 'critical care', 'ward'],
    targetRoles: ['INTENSIVIST', 'ICU_NURSE', 'CRITICAL_CARE_HEAD', 'DOCTOR', 'SUPER_ADMIN'],
    requiredModule: 'smart-icu-sentinel',
    nextBestStep: 'NEWS2 score >= 7 hone par turant Rapid Response Team dispatch karein aur arterial line tray ready karein.',
    steps: [
      '1. Step 1 (Telemetry Feed): HR, BP, RR, SpO2, Temp aur AVPU conscious level telemetry stream hoti hai.',
      '2. Step 2 (NEWS2 Calculation): Algorithm continuous physiological score (0-20) calculate karta hai.',
      '3. Step 3 (Septic Shock Flag): Score >= 7 aate hi screen par red flashing "CRITICAL DETERIORATION" banner trigger hota hai.',
      '4. Step 4 (1-Click RRT Dispatch): Crash cart, defibrillator aur airway team ko ETA < 60s ke sath bedside assign karein.'
    ],
    hinglishGuide: 'Patient ke vitals se NEWS2 score calculate hota hai. Score 7 se upar aane par sepsic shock alert bajta hai aur 1-click me Rapid Response Team dispatch hoti hai.',
    technicalDetails: {
      routes: [
        'POST /api/v1/partner/smart-icu/telemetry/ingest',
        'GET /api/v1/partner/smart-icu/radar/active-beds',
        'POST /api/v1/partner/smart-icu/rrt/dispatch'
      ],
      dbTables: ['company.smart_icu_vitals_telemetry', 'company.rapid_response_team_dispatches'],
      actionKey: 'open-smart-icu'
    }
  },
  {
    id: 'partner-smart-ambulance-5g',
    title: '🚑 5G Smart Ambulance Tele-Emergency Hub & Trauma Bay Pre-Staging',
    category: 'EMERGENCY_ICU',
    allowedPlatforms: ['PARTNER_PLATFORM', 'COMPANY_HQ'],
    summary: 'In-transit live vitals stream, green corridor traffic beacon, 1-click Trauma Bay & OT 1 pre-staging.',
    keywords: ['ambulance', '5g', 'emergency', 'trauma bay', 'green corridor', 'transit', 'casualty', 'ot staging'],
    targetRoles: ['EMERGENCY_INCHARGE', 'PARAMEDIC', 'TRAUMA_SURGEON', 'HOSPITAL_ADMIN', 'SUPER_ADMIN'],
    requiredModule: 'smart-ambulance',
    nextBestStep: 'Ambulance pahunchne se pehle Trauma Bay 1 aur cross-matched O-Negative blood pre-stage karein.',
    steps: [
      '1. Step 1 (5G Stream): Paramedic patient ka in-transit ECG, SpO2 aur GPS ETA hospital command center ko stream karein.',
      '2. Step 2 (Green Corridor): Traffic police integration se ambulance ke route par signal priority request trigger karein.',
      '3. Step 3 (Trauma Pre-Stage): Hospital desk par "Pre-Stage Trauma Bay" dabayein — OT 1 aur blood bank auto-reserve honge.',
      '4. Step 4 (Zero-Delay Handover): Ambulance hospital gate par aate hi patient bina casualty paperwork ke direct OT me shift hota hai.'
    ],
    hinglishGuide: 'Ambulance se raste mein hi ECG aur vitals hospital screen par dikhte hain. Hospital pahunchne se pehle hi OT aur blood ready kar liya jata hai.',
    technicalDetails: {
      routes: [
        'POST /api/v1/partner/smart-ambulance/telemetry/stream',
        'POST /api/v1/partner/smart-ambulance/pre-stage-trauma',
        'GET /api/v1/partner/smart-ambulance/fleet/active'
      ],
      dbTables: ['company.emergency_ambulance_missions'],
      actionKey: 'open-smart-ambulance'
    }
  },
  {
    id: 'partner-corporate-b2b-saas',
    title: '🏢 Corporate Enterprise B2B Healthcare & On-Site Dispensary SaaS',
    category: 'REVENUE_INTEGRITY',
    allowedPlatforms: ['PARTNER_PLATFORM', 'COMPANY_HQ'],
    summary: 'Corporate client master (TCS, Infosys), employee bulk health pass, on-site POS, aur monthly consolidated GST invoices.',
    keywords: ['corporate', 'b2b', 'enterprise', 'employee', 'health pass', 'gst invoice', 'credit limit', 'irn'],
    targetRoles: ['CORPORATE_RELATIONS_MANAGER', 'BILLING_MANAGER', 'ACCOUNTANT', 'SUPER_ADMIN'],
    requiredModule: 'corporate-b2b',
    nextBestStep: 'Monthly corporate consumption audit karein aur Net-30 credit terms par itemized GST invoice dispatch karein.',
    steps: [
      '1. Step 1 (Corporate Account): Company credit limit (e.g. ₹50 Lakh) aur agreed OPD/IPD discount master configure karein.',
      '2. Step 2 (Employee Pass): Employees ko cashless family health pass issue karein on-site clinic access ke sath.',
      '3. Step 3 (Dispensary POS): Corporate campus dispensary me employee ID tap se cashless दवा provide karein.',
      '4. Step 4 (Consolidated Billing): Month-end par 1-click se e-invoice IRN aur B2B GSTR-1 compliant invoice generate karein.'
    ],
    hinglishGuide: 'B2B कंपनियों (जैसे TCS, Infosys) ke sath tie-up karke unke staff ko cashless treatment dein aur mahine ke aakhiri din single GST invoice bhejein.',
    technicalDetails: {
      routes: [
        'GET /api/v1/partner/corporate-b2b/accounts',
        'POST /api/v1/partner/corporate-b2b/employees/bulk-enroll',
        'POST /api/v1/partner/corporate-b2b/invoices/generate'
      ],
      dbTables: ['company.corporate_accounts', 'company.corporate_employee_passes', 'company.corporate_b2b_invoices'],
      actionKey: 'open-corporate-b2b'
    }
  },
  {
    id: 'partner-bed-turnaround-qr',
    title: '🧹 Autonomous Bed Turnaround & Housekeeping QR Dispatcher',
    category: 'HOSPITAL_OPERATIONS',
    allowedPlatforms: ['PARTNER_PLATFORM', 'COMPANY_HQ'],
    summary: 'Discharge sign-off par auto-housekeeping mission, headboard QR scan verification, 18.5% IPD bed capacity gain.',
    keywords: ['housekeeping', 'bed turnaround', 'terminal cleaning', 'qr scan', 'disinfection', 'ward', 'cleaning'],
    targetRoles: ['HOUSEKEEPING_SUPERVISOR', 'WARD_INCHARGE', 'NURSE', 'HOSPITAL_ADMIN', 'SUPER_ADMIN'],
    requiredModule: 'bed-turnaround',
    nextBestStep: 'Discharge hote hi headboard QR scan karein aur terminal sterilization sign-off karke bed available karein.',
    steps: [
      '1. Step 1 (Auto-Dispatch): Doctor ke discharge summary seal karte hi housekeeping staff ke PWA par mission trigger hota hai.',
      '2. Step 2 (QR Scan Start): Housekeeper bed headboard QR scan karke terminal cleaning shuru karein (timer engaged).',
      '3. Step 3 (Sterilization Protocol): Mattress flip, linen change aur UV surface disinfection complete karein.',
      '4. Step 4 (QR Scan Done): Sterilization QR scan karte hi bed status instantly "VACANT_READY" ho jata hai (Avg 18 mins vs 150 mins).'
    ],
    hinglishGuide: 'Discharge hote hi safai wale ke mobile par mission jata hai. Bed par laga QR code scan karke safai shuru aur khatam hoti hai jisse 2 ghante ka samay bachta hai.',
    technicalDetails: {
      routes: [
        'POST /api/v1/partner/bed-turnaround/dispatch-mission',
        'POST /api/v1/partner/bed-turnaround/scan-qr',
        'GET /api/v1/partner/bed-turnaround/metrics'
      ],
      dbTables: ['company.housekeeping_bed_missions'],
      actionKey: 'open-bed-turnaround'
    }
  },
  {
    id: 'partner-ambient-ai-scribe',
    title: '🎙️ Ambient Multilingual Clinical AI Scribe & Voice-to-FHIR Workstation',
    category: 'CLINICAL_SAFETY',
    allowedPlatforms: ['PARTNER_PLATFORM', 'COMPANY_HQ'],
    summary: 'Hinglish/Hindi doctor-patient dialogue transcription, structured SOAP notes, ICD-10 coding, ABDM FHIR R4 bundling.',
    keywords: ['ai scribe', 'ambient', 'voice to rx', 'hinglish', 'speech to text', 'soap note', 'fhir', 'icd10'],
    targetRoles: ['DOCTOR', 'CONSULTANT_PHYSICIAN', 'SURGEON', 'SUPER_ADMIN'],
    requiredModule: 'clinical-consultation',
    nextBestStep: 'Audio stream record karein, generated SOAP note verify karein aur 1-click se prescription sign karein.',
    steps: [
      '1. Step 1 (Mic Toggle): Doctor desk par "🎙️ Ambient AI Scribe" widget start karein.',
      '2. Step 2 (Natural Dialogue): Doctor aur patient aam bhasha (Hindi/English/Hinglish) me baat karein.',
      '3. Step 3 (SOAP Synthesis): AI chief complaints, vitals, ICD-10 diagnosis aur Rx dosage instantly extract karta hai.',
      '4. Step 4 (1-Click Sign & FHIR): "Sign & Issue Rx" dabate hi ABDM FHIR R4 document bundle bankar parchi print ho jati hai.'
    ],
    hinglishGuide: 'Doctor ko computer dekhne ki zaroorat nahi. Mic on karke patient se baat karein, EWAN AI apne aap poori prescription aur bimari ka code (ICD-10) generate kar dega.',
    technicalDetails: {
      routes: [
        'POST /api/v1/partner/ai-scribe/stream-transcribe',
        'POST /api/v1/partner/ai-scribe/synthesize-soap',
        'POST /api/v1/partner/ai-scribe/package-fhir-bundle'
      ],
      dbTables: ['company.ai_scribe_sessions'],
      actionKey: 'open-ai-scribe'
    }
  },
  {
    id: 'partner-nhcx-cashless-claims',
    title: '⚡ NHCX 3-Minute Cashless Claim Settlement Engine (IRDAI 2024)',
    category: 'REVENUE_INTEGRITY',
    allowedPlatforms: ['PARTNER_PLATFORM', 'COMPANY_HQ'],
    summary: 'National Health Claims Exchange (NHCX) connector: <60s Pre-Auth approval, <180s discharge settlement.',
    keywords: ['nhcx', 'insurance', 'cashless', 'claims', 'pre auth', 'settlement', 'irdai', 'tpa'],
    targetRoles: ['TPA_EXECUTIVE', 'INSURANCE_HEAD', 'BILLING_MANAGER', 'HOSPITAL_ADMIN', 'SUPER_ADMIN'],
    requiredModule: 'nhcx-insurance',
    nextBestStep: 'Pre-auth approve hone ke baad patient discharge par 1-click NHCX final settlement submit karein.',
    steps: [
      '1. Step 1 (NHCX Pre-Auth): IPD admission clinical summary aur ICD-10 codes se auto-extract karke pre-auth submit karein.',
      '2. Step 2 (<60s Approval): IRDAI standard guidelines ke tahat insurer system se instant eligibility voucher receive karein.',
      '3. Step 3 (Discharge Submission): Final hospital bill aur discharge summary NHCX FHIR Claim resource me attach karein.',
      '4. Step 4 (<180s Settlement): 3 minute ke andar digital settlement voucher aur payout token verify karein.'
    ],
    hinglishGuide: 'TPA claim ke liye ghanto wait nahi karna padega. NHCX engine se pre-auth 1 minute me aur final discharge claim 3 minute me cashless approve hota hai.',
    technicalDetails: {
      routes: [
        'POST /api/v1/partner/insurance/nhcx/pre-auth/initiate',
        'POST /api/v1/partner/insurance/nhcx/claim/settle-discharge',
        'GET /api/v1/partner/insurance/nhcx/claim/status'
      ],
      dbTables: ['company.nhcx_claims'],
      actionKey: 'open-nhcx-desk'
    }
  },
  {
    id: 'partner-revenue-leakage-hardgate',
    title: '🔒 Revenue Hard-Gates: Discharge Interceptor, Doctor Clawback & Blind-Drop',
    category: 'REVENUE_INTEGRITY',
    allowedPlatforms: ['PARTNER_PLATFORM', 'COMPANY_HQ'],
    summary: 'Unbilled items discharge hard-gate, doctor payout clawback on refunds, cashier blind-drop CCTV audit.',
    keywords: ['revenue', 'leakage', 'discharge gate', 'clawback', 'blind drop', 'cctv audit', 'ebitda', 'unbilled'],
    targetRoles: ['FINANCE_DIRECTOR', 'CHIEF_ACCOUNTANT', 'BILLING_HEAD', 'MEDICAL_DIRECTOR', 'SUPER_ADMIN'],
    requiredModule: 'revenue-protection',
    nextBestStep: 'Discharge audit checklist verify karein aur cashier drawer band karte samay blind cash entry karein.',
    steps: [
      '1. Step 1 (Discharge Gate): System OT/ICU ke unbilled items detect hote hi discharge clearance freeze kar deta hai.',
      '2. Step 2 (Auto-Post / Override): 1-Click se unbilled items invoice me add karein ya Medical Director PIN se override karein.',
      '3. Step 3 (Doctor Clawback): Patient refund hone par doctor commission ledger se accrued cut automatic deduct hota hai.',
      '4. Step 4 (Cashier Blind Drop): Cashier bina balance dekhe physical cash enter karta hai. Variance aate hi CCTV camera ref log hota hai.'
    ],
    hinglishGuide: 'Discharge Hard-Gate se ek bhi bina bill ki dawai ya item bahar nahi jati. Patient ko refund milne par doctor ka cut auto-reverse hota hai aur cashier ka cash CCTV ke sath match hota hai.',
    technicalDetails: {
      routes: [
        'GET /api/v1/partner/revenue-protection/discharge-audit/:id',
        'POST /api/v1/partner/revenue-protection/doctor-clawback/apply',
        'POST /api/v1/partner/revenue-protection/cashier-blind-drop/reconcile',
        'GET /api/v1/partner/revenue-protection/digital-twin/live'
      ],
      dbTables: ['company.billing_invoices', 'company.doctor_payout_clawbacks', 'company.cashier_blind_drops'],
      actionKey: 'open-revenue-protection'
    }
  },
  {
    id: 'partner-abdm-m1m3-health-stack',
    title: '🇮🇳 ABDM Milestones M1, M2 & M3 National Health Stack Compliance',
    category: 'GOVERNMENT_SCHEMES',
    allowedPlatforms: ['PARTNER_PLATFORM', 'COMPANY_HQ'],
    summary: 'Aadhaar OTP ABHA generation (M1), Care Context Discovery & Linking (M2), NRCES FHIR ECDH/AES-GCM encryption (M3).',
    keywords: ['abdm', 'abha', 'm1', 'm2', 'm3', 'fhir', 'ecdh', 'nha', 'national health stack'],
    targetRoles: ['RECEPTIONIST', 'MEDICAL_RECORDS_OFFICER', 'HOSPITAL_ADMIN', 'SUPER_ADMIN'],
    requiredModule: 'abdm-compliance',
    nextBestStep: 'Patient ka 14-digit ABHA number link karein aur discharge par encrypted FHIR care context NHA ko push karein.',
    steps: [
      '1. Step 1 (M1 ABHA Issuance): Aadhaar OTP se patient ka official 14-digit ABHA number aur @abdm address issue karein.',
      '2. Step 2 (M2 Linkage): Patient ke hospital visit record ko care context ID ke sath ABHA profile se link karein.',
      '3. Step 3 (M3 FHIR Document): Prescription aur lab report ko NRCES R4 standard JSON bundle me package karein.',
      '4. Step 4 (M3 ECDH Encryption): Diffie-Hellman / AES-GCM cipher se encrypted data NHA health locker ko exchange karein.'
    ],
    hinglishGuide: 'Government ke ABDM 2.0 standards: M1 me ABHA ID banti hai, M2 me hospital record link hota hai, aur M3 me encrypted prescription patient ke Ayushman app me jati hai.',
    technicalDetails: {
      routes: [
        'POST /api/v1/partner/abdm/m1/generate-aadhaar-otp',
        'POST /api/v1/partner/abdm/m1/verify-aadhaar-otp',
        'POST /api/v1/partner/abdm/m2/care-context/discover',
        'POST /api/v1/partner/abdm/m3/fhir-bundle/generate'
      ],
      dbTables: ['company.abdm_patient_records'],
      actionKey: 'open-abdm-compliance'
    }
  },
  {
    id: 'partner-offline-pwa-resilience',
    title: '📶 Offline-First PWA Local Storage & Zero-Collision PostgreSQL Replay',
    category: 'ARCHITECTURE',
    allowedPlatforms: ['PARTNER_PLATFORM', 'COMPANY_HQ'],
    summary: 'IndexedDB local buffer, internet cut hone par continuous OPD/billing, aur reconnection par atomic batch replay.',
    keywords: ['offline', 'indexeddb', 'pwa', 'sync', 'internet down', 'batch replay', 'resilience', 'cache'],
    targetRoles: ['RECEPTIONIST', 'DOCTOR', 'CASHIER', 'IT_ADMIN', 'SUPER_ADMIN'],
    requiredModule: 'offline-resilience',
    nextBestStep: 'Internet disconnected hone par normal kaam jari rakhein; internet aate hi batch replay auto-sync ho jayega.',
    steps: [
      '1. Step 1 (Offline Mode): Internet disconnect hote hi PWA automatically local IndexedDB database me switch hota hai.',
      '2. Step 2 (Zero-Interruption): Doctor prescription likhte rahein, cashier cash receipts print karte rahein.',
      '3. Step 3 (Sync Engine): Internet aate hi gateway heartbeat detect hoti hai aur sync badge green hota hai.',
      '4. Step 4 (Atomic Replay): Sabhi offline operations cryptographic audit batch banakar bina ID collision ke PostgreSQL me commit hoti hain.'
    ],
    hinglishGuide: 'Internet chala bhi jaye to hospital nahi rukega. Sabhi parchi aur bill local browser me save hote rahenge aur net aate hi bina kisi gadbad ke main database me sync ho jayenge.',
    technicalDetails: {
      routes: [
        'GET /api/v1/partner/offline-resilience/heartbeat',
        'POST /api/v1/partner/offline-resilience/replay-batch'
      ],
      dbTables: ['company.offline_sync_audits'],
      actionKey: 'open-offline-sync'
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
    'kaise', 'karein', 'karu', 'karna', 'karo', 'karenge', 'karega', 'karunga', 'sakenge', 'chahiye',
    'hoga', 'hai', 'h', 'kya', 'batao',
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

    // Platform affinity bonus & role affinity: ONLY apply if base query actually matched (score > 0)
    // This strictly prevents unrelated queries from returning false positive top matches
    if (score > 0) {
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
          score = Math.max(1, score - 50);
        }
      }
    }

    return { topic, score };
  });

  return scored
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((item) => item.topic);
}
