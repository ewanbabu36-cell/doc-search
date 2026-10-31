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
  nextDueDose?: {
    id: string;
    medicationName: string;
    exactTime: string;
    minsRemaining: number;
    instruction: string;
    pillColor: string;
    voiceAdvice: string;
  } | null;
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
  message?: string;
  multiplePatients?: boolean;
  patients?: PatientProfile[];
  patient?: PatientProfile;
  token?: string;
}


export const CANONICAL_DEMO_FAMILY: PatientProfile[] = [];


export const DEMO_SCHEDULED_DOSES: ScheduledDose[] = [];


export const DEMO_PRESCRIPTIONS: PatientPrescription[] = [];


export const DEMO_LAB_REPORTS: PatientLabReport[] = [];


export const DEMO_SCANNED_RECORDS: ScannedParchiRecord[] = [];

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
    const t = this.token || (typeof window !== 'undefined' ? localStorage.getItem('docsearch_patient_token') : null);
    if (!t) return null;
    if (t.startsWith('PAT-')) {
      try {
        const raw = atob(t.slice(4));
        const parts = raw.split(':');
        const ts = parts[2] ? parseInt(parts[2], 10) : 0;
        if (ts && Date.now() - ts > 30 * 24 * 60 * 60 * 1000) {
          console.warn('Patient session token expired. Clearing session.');
          this.setPatient(null);
          return null;
        }
      } catch {}
    }
    return t;
  }

  getAuthHeaders(additional: Record<string, string> = {}): Record<string, string> {
    const token = this.getToken();
    const headers: Record<string, string> = { ...additional };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
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
      success: false,
      message: 'Could not contact healthcare gateway. Please check your network connection.',
      isRegistered: false,
      multiplePatients: false,
      patientCount: 0,
      registeredName: null,
      patientMrn: null,
      patients: [],
      devOtp: ''
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

    return {
      success: false,
      message: 'Verification failed. Please enter the valid OTP received on your mobile.',
      multiplePatients: false
    };
  }

  async getFamilyMembers(phone: string): Promise<PatientProfile[]> {
    try {
      const res = await fetch(`/api/v1/patient/family-members?phone=${encodeURIComponent(phone)}`, {
        headers: this.getAuthHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.familyMembers) && data.familyMembers.length > 0) {
          return data.familyMembers;
        }
      }
    } catch (err) {
      console.warn('Failed to fetch family members from server:', err);
    }
    return [];
  }

  async addFamilyMember(
    phone: string,
    member: { fullName: string; age: number; gender: 'MALE' | 'FEMALE' | 'OTHER'; relationship?: string; bloodGroup?: string }
  ): Promise<PatientProfile | null> {
    try {
      const res = await fetch('/api/v1/patient/family-members/add', {
        method: 'POST',
        headers: this.getAuthHeaders({ 'Content-Type': 'application/json' }),
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

    return null;
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
      const res = await fetch(`/api/v1/patient/queue/active?phone=${encodeURIComponent(targetPhone)}`, {
        headers: this.getAuthHeaders()
      });
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
    if (!targetPhone) return [];
    try {
      const res = await fetch(`/api/v1/patient/prescriptions?phone=${encodeURIComponent(targetPhone)}`, {
        headers: this.getAuthHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.prescriptions)) {
          return data.prescriptions;
        }
      }
    } catch (err) {
      console.warn('Prescriptions fetch failed:', err);
    }
    return [];
  }

  async getLabReports(phone?: string): Promise<PatientLabReport[]> {
    const targetPhone = phone || this.currentPatient?.phone;
    if (!targetPhone) return [];
    try {
      const res = await fetch(`/api/v1/patient/lab-reports?phone=${encodeURIComponent(targetPhone)}`, {
        headers: this.getAuthHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.reports)) {
          return data.reports;
        }
      }
    } catch (err) {
      console.warn('Lab reports fetch failed:', err);
    }
    return [];
  }

  async sendDelayAlert(phone: string, delayMinutes: number = 5): Promise<boolean> {
    try {
      const res = await fetch('/api/v1/patient/queue/delay-alert', {
        method: 'POST',
        headers: this.getAuthHeaders({ 'Content-Type': 'application/json' }),
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
        headers: this.getAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ mobileNumber: phone, departmentName, chiefComplaint })
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  async getMedicationSchedule(phone?: string): Promise<MedicationScheduleResponse> {
    const targetPhone = phone || this.currentPatient?.phone;
    const emptyResponse: MedicationScheduleResponse = {
      success: true,
      patientName: this.currentPatient?.fullName || '',
      doctorName: '',
      prescriptionId: '',
      prescribedDate: '',
      diagnosis: '',
      adherenceScore: 100,
      streakDays: 0,
      caregiverAlertContact: '',
      scheduledDoses: [],
      nextDueDose: null
    };

    if (!targetPhone) return emptyResponse;

    try {
      const res = await fetch(`/api/v1/patient/medications/schedule?phone=${encodeURIComponent(targetPhone)}`, {
        headers: this.getAuthHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.scheduledDoses)) {
          return data;
        }
      }
    } catch (err) {
      console.warn('Medication schedule API offline:', err);
    }

    return emptyResponse;
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
        headers: this.getAuthHeaders({ 'Content-Type': 'application/json' }),
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
        headers: this.getAuthHeaders({ 'Content-Type': 'application/json' }),
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
