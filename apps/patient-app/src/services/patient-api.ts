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
  };
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

export const DEMO_PATIENT: PatientProfile = {
  id: 'pat-1001',
  uhid: 'UHID-2026-89421',
  fullName: 'Rameshwar Prasad',
  age: 58,
  gender: 'MALE',
  phone: '9876543210',
  bloodGroup: 'B +ve',
  allergies: ['Penicillin', 'Sulfa Drugs'],
  activeToken: {
    tokenNumber: '14',
    doctorName: 'Dr. Vivek Sharma (MD General Medicine)',
    chamberRoom: '102 (First Floor)',
    patientsAhead: 2,
    estimatedWaitMins: 12,
    isCalled: false
  }
};

export const DEMO_PRESCRIPTIONS: PatientPrescription[] = [
  {
    id: 'rx-201',
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
    id: 'rx-104',
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
    id: 'rep-901',
    testName: 'Complete Blood Count (CBC) with Platelets',
    date: '11 Oct 2026',
    status: 'NORMAL',
    value: '13.8',
    unit: 'g/dL',
    referenceRange: '13.0 - 17.0',
    signedBy: 'Dr. K. L. Pathak (MD Pathologist, NABL Verifier)'
  },
  {
    id: 'rep-902',
    testName: 'Fasting Blood Sugar (FBS)',
    date: '11 Oct 2026',
    status: 'HIGH_ALERT',
    value: '215',
    unit: 'mg/dL',
    referenceRange: '70 - 100',
    signedBy: 'Dr. K. L. Pathak (MD Pathologist, NABL Verifier)'
  },
  {
    id: 'rep-850',
    testName: 'HbA1c Glycated Hemoglobin',
    date: '02 Sep 2026',
    status: 'HIGH_ALERT',
    value: '8.4',
    unit: '%',
    referenceRange: '< 5.7',
    signedBy: 'Dr. K. L. Pathak (MD Pathologist, NABL Verifier)'
  }
];

class PatientApiService {
  private currentPatient: PatientProfile | null = null;

  async requestOtp(_phone: string): Promise<boolean> {
    await new Promise((r) => setTimeout(r, 400));
    return true;
  }

  async verifyOtp(phone: string, _otp: string): Promise<PatientProfile> {
    await new Promise((r) => setTimeout(r, 500));
    this.currentPatient = { ...DEMO_PATIENT, phone };
    return this.currentPatient;
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
      else localStorage.removeItem('docsearch_patient_profile');
    }
  }

  getPrescriptions(): PatientPrescription[] {
    return DEMO_PRESCRIPTIONS;
  }

  getLabReports(): PatientLabReport[] {
    return DEMO_LAB_REPORTS;
  }
}

export const patientApiService = new PatientApiService();
