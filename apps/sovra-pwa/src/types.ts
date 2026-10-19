// Sovra Zero-Cost Healthcare PWA Messenger Types

export type MessageStatus = 'QUEUED' | 'SENT' | 'DELIVERED' | 'READ';

export type UserRole = 'PATIENT' | 'DOCTOR' | 'NURSE' | 'PHARMACIST' | 'LAB_TECH' | 'RECEPTIONIST' | 'ADMIN';

export type ClinicalCardType = 'PRESCRIPTION' | 'LAB_REPORT' | 'OPD_PAYMENT' | 'APPOINTMENT_SLIP' | 'VITALS_LOG' | 'RADIOLOGY_PACS';

export interface PacsStudyData {
  studyInstanceUid: string;
  accessionNumber?: string;
  uhid: string;
  patientName: string;
  modality: 'CT' | 'MRI' | 'XRAY' | 'US' | 'PET';
  bodyPart: string;
  studyDescription: string;
  studyDate: string;
  sliceCount: number;
  referringDoctor?: string;
  institutionName?: string;
  pacsViewerUrl?: string;
  keyFindings?: string;
  radiationDoseDlp?: string;
}

export interface MedicineItem {
  id: string;
  name: string;
  dosage: string;
  frequency: string; // e.g. "1-0-1 (BD)", "1-0-0 (OD)"
  duration: string;  // e.g. "5 days"
  instructions: string; // e.g. "After food"
  substituteAllowed?: boolean;
}

export interface PrescriptionData {
  rxId: string;
  consultationId?: string;
  uhid: string;
  patientName: string;
  patientAge: number;
  patientGender: 'M' | 'F' | 'O';
  doctorName: string;
  doctorSpecialty: string;
  doctorRegNo: string;
  clinicOrHospitalName: string;
  prescribedAt: string;
  diagnosis: string[];
  vitals?: {
    bp?: string;
    pulse?: string;
    temp?: string;
    spO2?: string;
    weight?: string;
  };
  medicines: MedicineItem[];
  generalAdvice?: string;
  followUpDate?: string;
  isSigned: boolean;
  signatureStamp: string;
}

export interface LabParameter {
  name: string;
  observedValue: string | number;
  unit: string;
  biologicalReferenceRange: string;
  status: 'NORMAL' | 'HIGH' | 'LOW' | 'CRITICAL';
}

export interface LabReportData {
  reportId: string;
  accessionNumber: string;
  uhid: string;
  patientName: string;
  testName: string;
  testCategory: string; // e.g. "Clinical Biochemistry", "Hematology"
  sampleCollectedAt: string;
  reportedAt: string;
  hospitalName: string;
  pathologistName: string;
  pathologistDegrees: string;
  parameters: LabParameter[];
  overallInterpretation: string;
  isAbnormal: boolean;
  pdfDownloadUrl?: string;
  verificationHash: string;
}

export interface OpdPaymentData {
  paymentId: string;
  appointmentId: string;
  tokenNumber: string | number;
  uhid: string;
  patientName: string;
  doctorName: string;
  doctorSpecialty: string;
  clinicName: string;
  department: string;
  feeAmount: number;
  currency: string;
  upiId: string;
  payeeName: string;
  qrPayload: string;
  upiIntentUrl: string;
  paymentStatus: 'PENDING' | 'PAID' | 'FAILED' | 'EXPIRED';
  paidAt?: string;
  transactionRef?: string;
}

export interface ClinicalCardPayload {
  type: ClinicalCardType;
  prescription?: PrescriptionData;
  labReport?: LabReportData;
  opdPayment?: OpdPaymentData;
  pacsStudy?: PacsStudyData;
}

export interface AudioVoiceNote {
  audioBase64: string;
  mimeType: string;
  durationSeconds: number;
  waveformSamples?: number[];
}

export interface DoctorVerificationInfo {
  regNo: string;
  councilName: string;
  qualification: string;
  isNmcVerified: boolean;
  verificationHash: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderRole: UserRole;
  recipientId: string;
  text: string;
  timestamp: string; // ISO 8601
  status: MessageStatus;
  isOutgoing: boolean;
  clinicalCard?: ClinicalCardPayload;
  voiceNote?: AudioVoiceNote;
  replyToMessageId?: string;
  isEncrypted?: boolean;
}

export interface Conversation {
  id: string;
  participantId: string;
  participantName: string;
  participantRole: UserRole;
  participantSubtitle?: string; // e.g. "Cardiologist - Apollo" or "UHID-2026-9021"
  participantAvatar?: string;
  participantPhone?: string;
  doctorVerification?: DoctorVerificationInfo;
  isMuted?: boolean;
  isBlocked?: boolean;
  isArchived?: boolean;
  lastMessage?: {
    text: string;
    timestamp: string;
    status: MessageStatus;
    isOutgoing: boolean;
    cardType?: ClinicalCardType;
    isVoiceNote?: boolean;
  };
  unreadCount: number;
  isOnline: boolean;
  lastSeen?: string;
  isTyping?: boolean;
  pinned?: boolean;
  updatedAt: string;
}

export interface UserProfile {
  id: string;
  name: string;
  role: UserRole;
  phone: string;
  uhid?: string;
  hospitalOrClinicName: string;
  avatar?: string;
  regNo?: string;
  isVerified: boolean;
}

export interface OutboxSyncItem {
  id: string;
  message: Message;
  retryCount: number;
  queuedAt: string;
}
