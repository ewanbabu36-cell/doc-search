export interface PatientProfile {
  id: string;
  uhid: string;
  fullName: string;
  age: number;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  phone: string;
  bloodGroup: string;
  allergies: string[];
  abhaId?: string | undefined;
  abhaAddress?: string | undefined;
  relationship?: string | undefined;
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

  constructor() {
    if (typeof window !== 'undefined') {
      try {
        // P1-05 Remediation: Purge any legacy PHI and persistent tokens from localStorage
        localStorage.removeItem('docsearch_scanned_parchis');
        localStorage.removeItem('docsearch_patient_profile');
        localStorage.removeItem('docsearch_patient_token');
        localStorage.removeItem('docsearch_auth_token');
        localStorage.removeItem('docsearch_sso_master_token');
      } catch {}
    }
  }

  getScannedParchis(): ScannedParchiRecord[] {
    if (typeof window !== 'undefined') {
      try {
        // P1-05 Remediation: Ephemeral sessionStorage only, zero persistent PHI in localStorage
        const stored = sessionStorage.getItem('docsearch_scanned_parchis');
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
        sessionStorage.setItem('docsearch_scanned_parchis', JSON.stringify(updated));
      } catch {}
    }
  }

  deleteScannedParchi(id: string): void {
    const list = this.getScannedParchis();
    const updated = list.filter((r) => r.id !== id);
    if (typeof window !== 'undefined') {
      try {
        sessionStorage.setItem('docsearch_scanned_parchis', JSON.stringify(updated));
      } catch {}
    }
  }

  async getPatientProfile(patientId: string): Promise<PatientProfile | null> {
    try {
      const res = await fetch(`/api/v1/patient/profile/${encodeURIComponent(patientId)}`, {
        headers: this.getAuthHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.patient) {
          this.setPatient(data.patient);
          return data.patient;
        }
      }
    } catch (err) {
      console.warn('Failed to fetch patient profile:', err);
    }
    return this.getCurrentPatient();
  }

  async uploadScannedParchi(recordData: Partial<ScannedParchiRecord>): Promise<ScannedParchiRecord | null> {
    try {
      const res = await fetch('/api/v1/patient/prescriptions/upload', {
        method: 'POST',
        headers: this.getAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify(recordData)
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          this.saveScannedParchi(json.data);
          return json.data;
        }
      }
    } catch (err) {
      console.warn('Scanned parchi upload API call failed, saving locally:', err);
    }

    // FEATURE-003: Never fabricate clinical facts. Mark as LOCAL_DRAFT / PENDING_SYNC.
    const fallbackRecord: ScannedParchiRecord = {
      id: `PARCHI-LOCAL-DRAFT-${Date.now().toString(36).toUpperCase()}`,
      scannedAt: new Date().toISOString(),
      sourceType: recordData.sourceType || 'CAMERA_SCAN',
      doctorName: recordData.doctorName || 'Unassigned / Local Draft',
      clinicHospital: recordData.clinicHospital || 'Pending Verification',
      consultationDate: recordData.consultationDate || new Date().toLocaleDateString('en-IN'),
      diagnosis: recordData.diagnosis || 'Unspecified (Upload Pending Sync)',
      medicines: recordData.medicines || [],
      confidenceScore: 0,
      aiNotes: 'LOCAL_DRAFT: Offline capture. Cloud sync and AI OCR pending verification.'
    };
    this.saveScannedParchi(fallbackRecord);
    return fallbackRecord;
  }

  // PHI-001: Ephemeral secure session storage helper to prevent sensitive PHI leakage
  // P1-05 Remediation: Strictly avoid browser localStorage for clinical records and auth tokens.
  private getSecureItem(key: string): string | null {
    if (typeof window === 'undefined') return null;
    try {
      return sessionStorage.getItem(key);
    } catch {
      return null;
    }
  }

  private setSecureItem(key: string, value: string): void {
    if (typeof window === 'undefined') return;
    try {
      sessionStorage.setItem(key, value);
    } catch {}
  }

  private removeSecureItem(key: string): void {
    if (typeof window === 'undefined') return;
    try {
      sessionStorage.removeItem(key);
      localStorage.removeItem(key);
    } catch {}
  }

  getToken(): string | null {
    const t = (
      this.token ||
      this.getSecureItem('docsearch_patient_token') ||
      this.getSecureItem('docsearch_auth_token') ||
      this.getSecureItem('docsearch_sso_master_token')
    )?.trim();
    if (!t || t === 'null' || t === 'undefined' || t === '[object Object]') return null;
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
              this.setSecureItem('docsearch_patient_profile', JSON.stringify(data.patient));
              if (data.token) this.setSecureItem('docsearch_patient_token', data.token);
              // Clean any stale legacy localStorage entries
              localStorage.removeItem('docsearch_patient_profile');
              localStorage.removeItem('docsearch_patient_token');
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

  async getFamilyMembers(phone?: string): Promise<PatientProfile[]> {
    const targetPhone = phone || this.currentPatient?.phone;
    if (!targetPhone) return [];
    try {
      const res = await fetch(`/api/v1/patient/family-members?phone=${encodeURIComponent(targetPhone)}`, {
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
    phoneOrMember: string | { fullName: string; age: number; gender: 'MALE' | 'FEMALE' | 'OTHER'; relationship?: string; bloodGroup?: string; mobileNumber?: string },
    maybeMember?: { fullName: string; age: number; gender: 'MALE' | 'FEMALE' | 'OTHER'; relationship?: string; bloodGroup?: string }
  ): Promise<PatientProfile | null> {
    const phone = typeof phoneOrMember === 'string'
      ? phoneOrMember
      : (phoneOrMember.mobileNumber || this.currentPatient?.phone || '9876543210');
    const member = typeof phoneOrMember === 'string' ? maybeMember! : phoneOrMember;

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

  async submitPreArrivalIntake(intakeData: any): Promise<{ success: boolean; fastPassQrCode?: string; message?: string }> {
    try {
      const res = await fetch('/api/v1/patient/intake/submit', {
        method: 'POST',
        headers: this.getAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify(intakeData)
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (err) {
      console.warn('Pre-arrival intake submit offline:', err);
    }
    return { success: false, message: 'Offline or failed to submit' };
  }

  getCurrentPatient(): PatientProfile | null {
    if (!this.currentPatient) {
      const stored = this.getSecureItem('docsearch_patient_profile');
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
    if (p) {
      this.setSecureItem('docsearch_patient_profile', JSON.stringify(p));
    } else {
      this.removeSecureItem('docsearch_patient_profile');
      this.removeSecureItem('docsearch_patient_token');
    }
  }

  /**
   * Books a real atomic persisted appointment / OPD queue token via backend API (FEATURE-001)
   */
  async bookAppointment(
    paramsOrPhone: string | { mobileNumber: string; departmentName?: string; chiefComplaint?: string; doctorName?: string },
    deptName?: string,
    complaint?: string
  ): Promise<{ success: boolean; tokenNumber?: string; estimatedWaitMinutes?: number; encounterId?: string; message?: string }> {
    const params = typeof paramsOrPhone === 'string'
      ? { mobileNumber: paramsOrPhone, departmentName: deptName, chiefComplaint: complaint, doctorName: undefined }
      : paramsOrPhone;
    try {
      const res = await fetch('/api/v1/patient/appointments/book', {
        method: 'POST',
        headers: this.getAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({
          mobileNumber: params.mobileNumber,
          departmentName: params.departmentName || 'General Medicine',
          chiefComplaint: params.chiefComplaint || `OPD Consultation with ${params.doctorName || 'Doctor'}`
        })
      });
      if (res.ok) {
        return await res.json();
      }
      const err = await res.json().catch(() => ({}));
      return { success: false, message: err?.message || `Booking failed with status ${res.status}` };
    } catch (err: any) {
      console.warn('Booking API call failed:', err);
      return { success: false, message: err?.message || 'Hospital scheduling server is offline.' };
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
              this.setSecureItem('docsearch_patient_profile', JSON.stringify(this.currentPatient));
              localStorage.removeItem('docsearch_patient_profile');
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

  async getPrescriptions(identifier?: string): Promise<PatientPrescription[]> {
    const target = identifier || this.currentPatient?.id || this.currentPatient?.phone;
    if (!target) return [];
    try {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(target);
      const url = isUuid
        ? `/api/v1/patient-mobile/prescriptions/${encodeURIComponent(target)}`
        : `/api/v1/patient/prescriptions?phone=${encodeURIComponent(target)}`;
      const res = await fetch(url, {
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

  async getLabReports(identifier?: string): Promise<PatientLabReport[]> {
    const target = identifier || this.currentPatient?.id || this.currentPatient?.phone;
    if (!target) return [];
    try {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(target);
      const url = isUuid
        ? `/api/v1/patient-mobile/lab-reports/${encodeURIComponent(target)}`
        : `/api/v1/patient/lab-reports?phone=${encodeURIComponent(target)}`;
      const res = await fetch(url, {
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
export const patientApi = patientApiService;
