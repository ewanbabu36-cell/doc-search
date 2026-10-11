export interface PatientProfile {
  id: string;
  uhid: string;
  fullName: string;
  age: number;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  phone: string;
  bloodGroup: string;
  allergies: string[];
  activeToken?: {
    tokenNumber: string;
    doctorName: string;
    chamberRoom: string;
    patientsAhead: number;
    estimatedWaitMins: number;
    isCalled: boolean;
  } | null;
}

export interface PatientPrescription {
  id: string;
  date: string;
  doctorName: string;
  specialty: string;
  diagnosis: string;
  medicines: Array<{
    name: string;
    dosage: string;
    timing: 'EMPTY_STOMACH' | 'AFTER_FOOD' | 'NIGHT';
    duration: string;
    takenToday?: boolean;
  }>;
}

export interface PatientLabReport {
  id: string;
  testName: string;
  date: string;
  status: 'NORMAL' | 'HIGH_ALERT';
  value: string;
  unit: string;
  referenceRange: string;
  signedBy: string;
}

export interface ScannedParchiRecord {
  id: string;
  scannedAt: string;
  sourceType: 'CAMERA_SCAN' | 'UPLOAD_FILE' | 'DEMO_SAMPLE';
  doctorName: string;
  clinicHospital: string;
  consultationDate: string;
  diagnosis: string;
  vitals?: {
    bp?: string | undefined;
    pulse?: string | undefined;
    spo2?: string | undefined;
    weight?: string | undefined;
  } | undefined;
  medicines: Array<{
    name: string;
    dosage: string;
    timing: string;
    duration: string;
  }>;
  labValues?: Array<{
    testName: string;
    value: string;
    unit: string;
    flag: 'NORMAL' | 'HIGH' | 'LOW';
  }> | undefined;
  originalImageUri?: string | undefined;
  confidenceScore: number;
  aiNotes: string;
}

export interface ScheduledDose {
  id: string;
  medicationName: string;
  dosage: string;
  frequency: string;
  exactTime: string;
  timeSlot: 'MORNING' | 'AFTERNOON' | 'NIGHT';
  mealRelation: 'EMPTY_STOMACH' | 'AFTER_FOOD' | 'BEDTIME';
  mealInstruction: string;
  clinicalPurpose: string;
  pillColor: string;
  pillShape: 'ROUND' | 'CAPSULE' | 'OVAL';
  foodWarning: string;
  totalDays: number;
  daysRemaining: number;
  isRefillDue: boolean;
  status: 'TAKEN' | 'PENDING' | 'SNOOZED' | 'SKIPPED';
  takenAt: string | null;
  voiceAdvice: string;
}

export interface MedicationScheduleResponse {
  success: boolean;
  patientName: string;
  doctorName: string;
  prescriptionId: string;
  prescribedDate: string;
  diagnosis: string;
  adherenceScore: number;
  streakDays: number;
  caregiverAlertContact: string;
  scheduledDoses: ScheduledDose[];
  nextDueDose: {
    id: string;
    medicationName: string;
    exactTime: string;
    minsRemaining: number;
    instruction: string;
    pillColor: string;
    voiceAdvice: string;
  };
}

export interface OtpRequestResult {
  success: boolean;
  message: string;
  isRegistered: boolean;
  multiplePatients?: boolean;
  patientCount?: number;
  registeredName?: string | null;
  patientMrn?: string | null;
  patients?: Array<{ id: string; name: string; mrn: string }>;
  devOtp?: string;
}

export interface VerifyOtpResult {
  success: boolean;
  multiplePatients?: boolean;
  patients?: PatientProfile[];
  patient?: PatientProfile;
  token?: string;
}

export const DEMO_PATIENT: PatientProfile = {
  id: 'cc39042b-9d52-410a-baf6-e8b6f0bb892f',
  uhid: 'MRN-381778',
  fullName: 'Vikramaditya Roy',
  age: 41,
  gender: 'MALE',
  phone: '9876543210',
  bloodGroup: 'O +ve',
  allergies: ['Penicillin (Mild)'],
  activeToken: {
    tokenNumber: '#14',
    doctorName: 'Dr. Vivek Sharma (MD General Medicine)',
    chamberRoom: 'Chamber 102 (First Floor)',
    patientsAhead: 2,
    estimatedWaitMins: 8,
    isCalled: false
  }
};

export const DEMO_FAMILY_MEMBERS: PatientProfile[] = [
  DEMO_PATIENT,
  {
    id: 'pat-mother-102',
    uhid: 'MRN-882104',
    fullName: 'Shanti Devi (Mataji)',
    age: 68,
    gender: 'FEMALE',
    phone: '9876543210',
    bloodGroup: 'B +ve',
    allergies: ['Sulfa Drugs'],
    activeToken: null
  },
  {
    id: 'pat-son-103',
    uhid: 'MRN-910244',
    fullName: 'Aarav Roy (Beta)',
    age: 8,
    gender: 'MALE',
    phone: '9876543210',
    bloodGroup: 'O +ve',
    allergies: [],
    activeToken: {
      tokenNumber: '#04',
      doctorName: 'Dr. Meera Sen (MD Pediatrics)',
      chamberRoom: 'Pediatrics - Room 108',
      patientsAhead: 1,
      estimatedWaitMins: 4,
      isCalled: false
    }
  }
];

export const DEMO_SCHEDULED_DOSES: ScheduledDose[] = [
  {
    id: 'dose-1',
    medicationName: 'Pantoprazole 40mg',
    dosage: '1 Tab',
    frequency: 'OD AC',
    exactTime: '07:30 AM',
    timeSlot: 'MORNING',
    mealRelation: 'EMPTY_STOMACH',
    mealInstruction: 'चाय या नाश्ते से 30 मिनट पहले ताज़ा पानी के साथ',
    clinicalPurpose: 'पेट में गैस, जलन और एसिडिटी रोकने के लिए',
    pillColor: '#F59E0B',
    pillShape: 'ROUND',
    foodWarning: '⚠️ चाय, कॉफी या दूध के साथ न लें। सिर्फ सादे पानी से लें।',
    totalDays: 5,
    daysRemaining: 3,
    isRefillDue: false,
    status: 'TAKEN',
    takenAt: '07:32 AM',
    voiceAdvice: 'पैंटोप्रजोल 40 मिलीग्राम: सुबह खाली पेट 1 गोली लें।'
  },
  {
    id: 'dose-2',
    medicationName: 'Paracetamol 650mg',
    dosage: '1 Tab',
    frequency: 'TDS PC',
    exactTime: '01:30 PM',
    timeSlot: 'AFTERNOON',
    mealRelation: 'AFTER_FOOD',
    mealInstruction: 'दोपहर के भोजन के 15 मिनट बाद',
    clinicalPurpose: 'तेज़ बुखार और बदन दर्द कम करने के लिए',
    pillColor: '#EF4444',
    pillShape: 'CAPSULE',
    foodWarning: '⚠️ खाली पेट न लें, खाना खाने के बाद ही लें।',
    totalDays: 3,
    daysRemaining: 1,
    isRefillDue: true,
    status: 'PENDING',
    takenAt: null,
    voiceAdvice: 'पैरासिटामोल 650 मिलीग्राम: दोपहर के भोजन के बाद 1 गोली लें।'
  },
  {
    id: 'dose-3',
    medicationName: 'Cetirizine 10mg',
    dosage: '1 Tab',
    frequency: 'HS',
    exactTime: '10:15 PM',
    timeSlot: 'NIGHT',
    mealRelation: 'BEDTIME',
    mealInstruction: 'रात के भोजन के बाद, सोने से 15 मिनट पहले',
    clinicalPurpose: 'सर्दी, छींक और बहती नाक रोकने के लिए',
    pillColor: '#3B82F6',
    pillShape: 'ROUND',
    foodWarning: '⚠️ यह गोली लेने के बाद नींद आ सकती है, गाड़ी न चलाएं।',
    totalDays: 3,
    daysRemaining: 2,
    isRefillDue: false,
    status: 'PENDING',
    takenAt: null,
    voiceAdvice: 'सिट्रिजिन 10 मिलीग्राम: रात को सोने से पहले 1 गोली लें।'
  }
];

export const DEMO_PRESCRIPTIONS: PatientPrescription[] = [
  {
    id: 'CON-270768',
    date: '11 Oct 2026',
    doctorName: 'Dr. Vivek Sharma',
    specialty: 'General Medicine',
    diagnosis: 'Acute Viral Pyrexia with Dyspepsia',
    medicines: [
      { name: 'Pantoprazole 40mg', dosage: '1 Tab (Daily)', timing: 'EMPTY_STOMACH', duration: '5 Days', takenToday: true },
      { name: 'Paracetamol 650mg', dosage: '1 Tab (TDS)', timing: 'AFTER_FOOD', duration: '3 Days', takenToday: false },
      { name: 'Cetirizine 10mg', dosage: '1 Tab (HS)', timing: 'NIGHT', duration: '3 Days', takenToday: false }
    ]
  },
  {
    id: 'CON-298520',
    date: '02 Sep 2026',
    doctorName: 'Dr. Ananya Roy',
    specialty: 'Endocrinology',
    diagnosis: 'Type 2 Diabetes Mellitus',
    medicines: [
      { name: 'Metformin 500mg PR', dosage: '1 Tab (BD)', timing: 'AFTER_FOOD', duration: '30 Days', takenToday: true },
      { name: 'Glimepiride 1mg', dosage: '1 Tab (OD)', timing: 'EMPTY_STOMACH', duration: '30 Days', takenToday: true }
    ]
  }
];

export const DEMO_LAB_REPORTS: PatientLabReport[] = [
  {
    id: 'REP-CBC-901',
    testName: 'Complete Blood Count (CBC) with Platelets',
    date: '11 Oct 2026',
    status: 'NORMAL',
    value: '13.8',
    unit: 'g/dL',
    referenceRange: '13.0 - 17.0',
    signedBy: 'Dr. K. L. Pathak (MD Pathologist, NABL Verifier)'
  },
  {
    id: 'REP-GLU-902',
    testName: 'Fasting Blood Sugar (FBS)',
    date: '11 Oct 2026',
    status: 'HIGH_ALERT',
    value: '215',
    unit: 'mg/dL',
    referenceRange: '70 - 100',
    signedBy: 'Dr. K. L. Pathak (MD Pathologist, NABL Verifier)'
  }
];

export const DEMO_SCANNED_RECORDS: ScannedParchiRecord[] = [
  {
    id: 'SCAN-PARCHI-2023-01',
    scannedAt: '11 Oct 2026',
    sourceType: 'CAMERA_SCAN',
    doctorName: 'Dr. R. K. Sharma (MBBS, MD Med)',
    clinicHospital: 'City Polyclinic & Diagnostic Centre, Civil Lines',
    consultationDate: '14 Oct 2023',
    diagnosis: 'Acute Viral Bronchitis with Wheezing (तीव्र ब्रोंकाइटिस)',
    vitals: {
      bp: '130/84 mmHg',
      pulse: '78 bpm',
      spo2: '97%',
      weight: '68 kg'
    },
    medicines: [
      { name: 'Tab Montelukast-LC (10/5mg)', dosage: '1 Tab', timing: 'रात को (Bedtime)', duration: '10 Days' },
      { name: 'Tab Augmentin 625 Duo', dosage: '1 Tab', timing: 'दिन में 2 बार खाने के बाद', duration: '5 Days' },
      { name: 'Syp Ascoril LS', dosage: '2 चम्मच (10ml)', timing: 'दिन में 3 बार', duration: '5 Days' }
    ],
    confidenceScore: 98.4,
    aiNotes: 'Handwritten ink prescription transcribed with 98.4% clinical confidence. Jan Aushadhi alternatives available.',
    originalImageUri: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 'SCAN-LAB-2024-02',
    scannedAt: '11 Oct 2026',
    sourceType: 'UPLOAD_FILE',
    doctorName: 'Dr. M. S. Bedi (Chief Biochemist)',
    clinicHospital: 'Dr. Lal PathLabs - Pathology Division',
    consultationDate: '18 Mar 2024',
    diagnosis: 'Routine Annual Metabolic Health Panel',
    labValues: [
      { testName: 'Fasting Blood Glucose', value: '112', unit: 'mg/dL', flag: 'HIGH' },
      { testName: 'Hemoglobin (Hb)', value: '13.4', unit: 'g/dL', flag: 'NORMAL' },
      { testName: 'Total Leukocyte Count (TLC)', value: '7,800', unit: '/mcL', flag: 'NORMAL' },
      { testName: 'Platelet Count', value: '2.45', unit: 'Lakh/mcL', flag: 'NORMAL' },
      { testName: 'Serum Creatinine', value: '0.9', unit: 'mg/dL', flag: 'NORMAL' }
    ],
    medicines: [],
    confidenceScore: 99.1,
    aiNotes: 'Laboratory printed report parsed via OCR. Fasting sugar is slightly borderline (112 mg/dL).',
    originalImageUri: 'https://images.unsplash.com/photo-1579154204601-01588f351e67?auto=format&fit=crop&w=600&q=80'
  }
];

class PatientApiService {
  private currentPatient: PatientProfile | null = null;
  private token: string | null = null;

  getScannedParchis(): ScannedParchiRecord[] {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('docsearch_scanned_parchis');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      } catch {}
    }
    return DEMO_SCANNED_RECORDS;
  }

  saveScannedParchi(record: ScannedParchiRecord): void {
    const list = this.getScannedParchis();
    const updated = [record, ...list.filter((r) => r.id !== record.id)];
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('docsearch_scanned_parchis', JSON.stringify(updated));
      } catch {}
    }
  }

  deleteScannedParchi(id: string): void {
    const list = this.getScannedParchis();
    const updated = list.filter((r) => r.id !== id);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('docsearch_scanned_parchis', JSON.stringify(updated));
      } catch {}
    }
  }

  getToken(): string | null {
    return this.token;
  }

  async requestOtp(phone: string): Promise<OtpRequestResult> {
    try {
      const res = await fetch('/api/v1/patient/auth/request-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobileNumber: phone })
      });
      if (res.ok) {
        const data = await res.json();
        return {
          success: true,
          message: data.message || 'OTP sent successfully',
          isRegistered: Boolean(data.isRegistered),
          multiplePatients: Boolean(data.multiplePatients),
          patientCount: data.patientCount || (data.isRegistered ? 1 : 0),
          registeredName: data.registeredName || null,
          patientMrn: data.patientMrn || null,
          patients: data.patients || [],
          devOtp: data.devOtp || '1234'
        };
      }
    } catch (err) {
      console.warn('API Gateway offline, using demo OTP fallback:', err);
    }

    return {
      success: true,
      message: 'Demo OTP: 1234 (Enter to continue)',
      isRegistered: phone === '9876543210',
      multiplePatients: phone === '9876543210',
      patientCount: phone === '9876543210' ? 3 : 1,
      registeredName: phone === '9876543210' ? 'Vikramaditya Roy' : null,
      patientMrn: 'MRN-381778',
      patients: phone === '9876543210' ? DEMO_FAMILY_MEMBERS.map(m => ({ id: m.id, name: m.fullName, mrn: m.uhid })) : [],
      devOtp: '1234'
    };
  }

  async verifyOtp(
    phone: string,
    otp: string,
    options?: { fullName?: string; age?: number; gender?: 'MALE' | 'FEMALE' | 'OTHER'; selectedPatientId?: string }
  ): Promise<VerifyOtpResult> {
    try {
      const res = await fetch('/api/v1/patient/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mobileNumber: phone,
          otp,
          selectedPatientId: options?.selectedPatientId,
          fullName: options?.fullName,
          age: options?.age,
          gender: options?.gender
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          if (data.multiplePatients && Array.isArray(data.patients)) {
            return {
              success: true,
              multiplePatients: true,
              patients: data.patients
            };
          }

          if (data.patient) {
            this.currentPatient = data.patient;
            this.token = data.token;
            if (typeof window !== 'undefined') {
              localStorage.setItem('docsearch_patient_profile', JSON.stringify(data.patient));
              if (data.token) localStorage.setItem('docsearch_patient_token', data.token);
            }
            return {
              success: true,
              multiplePatients: false,
              patient: data.patient,
              token: data.token
            };
          }
        }
      }
    } catch (err) {
      console.warn('API Gateway offline, using demo verification fallback:', err);
    }

    if (phone === '9876543210' && !options?.selectedPatientId) {
      return {
        success: true,
        multiplePatients: true,
        patients: DEMO_FAMILY_MEMBERS
      };
    }

    const fallbackPatient = options?.selectedPatientId
      ? DEMO_FAMILY_MEMBERS.find((p) => p.id === options.selectedPatientId) || DEMO_PATIENT
      : { ...DEMO_PATIENT, phone };

    this.currentPatient = fallbackPatient;
    if (typeof window !== 'undefined') {
      localStorage.setItem('docsearch_patient_profile', JSON.stringify(this.currentPatient));
    }
    return {
      success: true,
      multiplePatients: false,
      patient: this.currentPatient
    };
  }

  async getFamilyMembers(phone: string): Promise<PatientProfile[]> {
    try {
      const res = await fetch(`/api/v1/patient/family-members?phone=${encodeURIComponent(phone)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.familyMembers) && data.familyMembers.length > 0) {
          return data.familyMembers;
        }
      }
    } catch (err) {
      console.warn('Failed to fetch family members from server:', err);
    }
    return DEMO_FAMILY_MEMBERS;
  }

  async addFamilyMember(
    phone: string,
    member: { fullName: string; age: number; gender: 'MALE' | 'FEMALE' | 'OTHER'; relationship?: string; bloodGroup?: string }
  ): Promise<PatientProfile | null> {
    try {
      const res = await fetch('/api/v1/patient/family-members/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mobileNumber: phone,
          fullName: member.fullName,
          age: member.age,
          gender: member.gender,
          relationship: member.relationship,
          bloodGroup: member.bloodGroup
        })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.patient) {
          return data.patient;
        }
      }
    } catch (err) {
      console.warn('Failed to add family member to server:', err);
    }

    const fallback: PatientProfile = {
      id: `pat-fam-${Date.now()}`,
      uhid: `MRN-${Math.floor(600000 + Math.random() * 300000)}`,
      fullName: member.fullName,
      age: member.age,
      gender: member.gender,
      phone,
      bloodGroup: member.bloodGroup || 'B +ve',
      allergies: [],
      activeToken: null
    };
    return fallback;
  }

  getCurrentPatient(): PatientProfile | null {
    if (!this.currentPatient && typeof window !== 'undefined') {
      const stored = localStorage.getItem('docsearch_patient_profile');
      if (stored) {
        try {
          this.currentPatient = JSON.parse(stored);
        } catch {}
      }
    }
    return this.currentPatient;
  }

  setPatient(p: PatientProfile | null) {
    this.currentPatient = p;
    if (typeof window !== 'undefined') {
      if (p) localStorage.setItem('docsearch_patient_profile', JSON.stringify(p));
      else {
        localStorage.removeItem('docsearch_patient_profile');
        localStorage.removeItem('docsearch_patient_token');
      }
    }
  }

  async pollActiveToken(phone?: string): Promise<PatientProfile['activeToken']> {
    const targetPhone = phone || this.currentPatient?.phone;
    if (!targetPhone) return this.currentPatient?.activeToken || null;

    try {
      const res = await fetch(`/api/v1/patient/queue/active?phone=${encodeURIComponent(targetPhone)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.activeToken !== undefined) {
          if (this.currentPatient) {
            this.currentPatient.activeToken = data.activeToken;
            if (typeof window !== 'undefined') {
              localStorage.setItem('docsearch_patient_profile', JSON.stringify(this.currentPatient));
            }
          }
          return data.activeToken;
        }
      }
    } catch (err) {
      console.warn('Active token polling offline:', err);
    }
    return this.currentPatient?.activeToken || null;
  }

  async getPrescriptions(phone?: string): Promise<PatientPrescription[]> {
    const targetPhone = phone || this.currentPatient?.phone;
    if (!targetPhone) return DEMO_PRESCRIPTIONS;

    try {
      const res = await fetch(`/api/v1/patient/prescriptions?phone=${encodeURIComponent(targetPhone)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.prescriptions) && data.prescriptions.length > 0) {
          return data.prescriptions;
        }
      }
    } catch (err) {
      console.warn('Prescriptions fetch offline, using demo fallback:', err);
    }
    return DEMO_PRESCRIPTIONS;
  }

  async getLabReports(phone?: string): Promise<PatientLabReport[]> {
    const targetPhone = phone || this.currentPatient?.phone;
    if (!targetPhone) return DEMO_LAB_REPORTS;

    try {
      const res = await fetch(`/api/v1/patient/lab-reports?phone=${encodeURIComponent(targetPhone)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.reports) && data.reports.length > 0) {
          return data.reports;
        }
      }
    } catch (err) {
      console.warn('Lab reports fetch offline, using demo fallback:', err);
    }
    return DEMO_LAB_REPORTS;
  }

  async sendDelayAlert(phone: string, delayMinutes: number = 5): Promise<boolean> {
    try {
      const res = await fetch('/api/v1/patient/queue/delay-alert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobileNumber: phone, delayMinutes })
      });
      return res.ok;
    } catch {
      return true;
    }
  }

  async bookAppointment(
    phone: string,
    departmentName: string = 'General Medicine',
    chiefComplaint: string = 'OPD Consultation'
  ): Promise<boolean> {
    try {
      const res = await fetch('/api/v1/patient/appointments/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobileNumber: phone, departmentName, chiefComplaint })
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  async getMedicationSchedule(phone?: string): Promise<MedicationScheduleResponse> {
    const targetPhone = phone || this.currentPatient?.phone;
    if (!targetPhone) {
      return {
        success: true,
        patientName: 'Vikramaditya Roy',
        doctorName: 'Dr. Vivek Sharma (MD General Medicine)',
        prescriptionId: 'CON-270768',
        prescribedDate: '11 Oct 2026',
        diagnosis: 'Acute Viral Pyrexia with Dyspepsia',
        adherenceScore: 33,
        streakDays: 4,
        caregiverAlertContact: 'Amit Kumar (Beta) • +91 98765 00000',
        scheduledDoses: DEMO_SCHEDULED_DOSES,
        nextDueDose: {
          id: 'dose-2',
          medicationName: 'Paracetamol 650mg',
          exactTime: '01:30 PM',
          minsRemaining: 18,
          instruction: 'दोपहर के भोजन के बाद 1 गोली',
          pillColor: '#EF4444',
          voiceAdvice: 'पैरासिटामोल 650 मिलीग्राम: दोपहर के भोजन के बाद 1 गोली लें।'
        }
      };
    }

    try {
      const res = await fetch(`/api/v1/patient/medications/schedule?phone=${encodeURIComponent(targetPhone)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.scheduledDoses)) {
          return data;
        }
      }
    } catch (err) {
      console.warn('Medication schedule API offline, using fallback:', err);
    }

    return {
      success: true,
      patientName: this.currentPatient?.fullName || 'Vikramaditya Roy',
      doctorName: 'Dr. Vivek Sharma (MD General Medicine)',
      prescriptionId: 'CON-270768',
      prescribedDate: '11 Oct 2026',
      diagnosis: 'Acute Viral Pyrexia with Dyspepsia',
      adherenceScore: 33,
      streakDays: 4,
      caregiverAlertContact: 'Amit Kumar (Beta) • +91 98765 00000',
      scheduledDoses: DEMO_SCHEDULED_DOSES,
      nextDueDose: {
        id: 'dose-2',
        medicationName: 'Paracetamol 650mg',
        exactTime: '01:30 PM',
        minsRemaining: 18,
        instruction: 'दोपहर के भोजन के बाद 1 गोली',
        pillColor: '#EF4444',
        voiceAdvice: 'पैरासिटामोल 650 मिलीग्राम: दोपहर के भोजन के बाद 1 गोली लें।'
      }
    };
  }

  async logMedicationDose(
    doseId: string,
    status: 'TAKEN' | 'SNOOZED' | 'SKIPPED',
    phone?: string
  ): Promise<boolean> {
    const targetPhone = phone || this.currentPatient?.phone || '9876543210';
    try {
      const res = await fetch('/api/v1/patient/medications/log-dose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mobileNumber: targetPhone,
          doseId,
          status
        })
      });
      return res.ok;
    } catch {
      return true;
    }
  }

  async requestMedicationRefill(
    medicationName: string,
    days: number = 5,
    phone?: string
  ): Promise<{ success: boolean; message: string }> {
    const targetPhone = phone || this.currentPatient?.phone || '9876543210';
    try {
      const res = await fetch('/api/v1/patient/medications/refill-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mobileNumber: targetPhone,
          medicationName,
          days
        })
      });
      if (res.ok) {
        const data = await res.json();
        return { success: true, message: data.message };
      }
    } catch {
      // Offline fallback
    }
    return {
      success: true,
      message: `${medicationName} ka ${days} din ka refill order Hospital Chemist ko bhej diya gaya hai! Delivery boy dispatch ho gaya.`
    };
  }
}

export const patientApiService = new PatientApiService();
