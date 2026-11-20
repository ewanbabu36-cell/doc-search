/**
 * DocSearch Swasthya Shorts — Doctor Reels & Medical Awareness Data Contracts
 * 100% Doctor-Verified, NMC-Compliant Clinical Education & Direct OPD Conversion
 */

export type ReelCategory =
  | 'CARDIOLOGY'
  | 'PEDIATRICS'
  | 'DIABETES_METABOLIC'
  | 'WOMEN_HEALTH'
  | 'ORTHOPEDICS'
  | 'SEASONAL_INFECTIONS'
  | 'EYE_CARE'
  | 'MENTAL_WELLNESS'
  | 'PRE_POST_SURGERY';

export interface ReelSubtitleCue {
  id: string;
  startSeconds: number;
  endSeconds: number;
  textHi: string;
  textEn: string;
}

export interface ReelStreamLadder {
  hlsMasterUrl: string; // e.g., "https://cdn.docsearch.health/reels/hls/master.m3u8"
  fallbackMp4Url: string;
  resolutions: {
    label: '360p' | '480p' | '720p' | '1080p';
    bitrateKbps: number;
    width: number;
    height: number;
    streamUrl: string;
  }[];
}

export interface NmcComplianceReport {
  isNmcVerified: boolean;
  nmcRegistrationNumber: string;
  stateMedicalCouncil: string;
  disclaimerText: string;
  genericPrescriptionCompliant: boolean;
  flaggedCommercialBrands: string[];
  signedAt: string;
}

export interface DoctorReelDto {
  id: string;
  doctorId: string;
  doctorName: string;
  doctorSpecialty: string;
  doctorDegree: string;
  nmcRegistrationNumber: string;
  hospitalName: string;
  doctorAvatarUrl: string;

  // Media & Video (HLS + Progressive MP4 Fallback)
  videoUrl: string;
  thumbnailUrl: string;
  durationSeconds: number;
  streamLadder?: ReelStreamLadder | undefined;
  subtitles?: ReelSubtitleCue[] | undefined;

  // Content & Clinical Guidance
  title: string;
  summaryHindi: string;
  summaryEnglish: string;
  category: ReelCategory;
  tags: string[];
  clinicalDos: string[];
  clinicalDonts: string[];

  // Doctor OPD / Teleconsult Booking Integration
  opdConsultationFee: number;
  nextAvailableSlot: string; // e.g. "Today 4:30 PM"
  isTeleconsultAvailable: boolean;

  // Engagement Metrics
  viewsCount: number;
  likesCount: number;
  sharesCount: number;
  consultsBookedCount: number;
  isLikedByPatient?: boolean | undefined;
  isSavedByPatient?: boolean | undefined;

  // Regulatory & Trust (NMC RMP 2023 Compliance)
  isNmcVerified: boolean;
  disclaimerText?: string | undefined;
  nmcCompliance?: NmcComplianceReport | undefined;
  publishedAt: string;
}

export interface CreateDoctorReelRequest {
  title: string;
  category: ReelCategory;
  videoUrl: string;
  thumbnailUrl?: string | undefined;
  durationSeconds: number;
  summaryHindi: string;
  summaryEnglish: string;
  clinicalDos: string[];
  clinicalDonts: string[];
  tags: string[];
  nextAvailableSlot: string;
  opdConsultationFee: number;
  isTeleconsultAvailable: boolean;
  subtitles?: ReelSubtitleCue[] | undefined;
}

export type ReelEngagementAction = 'LIKE' | 'UNLIKE' | 'SAVE' | 'UNSAVE' | 'SHARE' | 'BOOK_CONSULT';

export interface ReelEngagementEvent {
  reelId: string;
  patientId: string;
  action: ReelEngagementAction;
  timestamp: string;
}

/**
 * NMC RMP Ethics 2023 Commercial Drug Brand Mapper
 * Maps trade names to recommended generic INN formulations
 */
export const COMMERCIAL_DRUG_BRAND_MAP: Record<string, string> = {
  crocin: 'Paracetamol',
  dolo: 'Paracetamol',
  calpol: 'Paracetamol',
  augmentin: 'Amoxicillin + Clavulanic Acid',
  voveran: 'Diclofenac',
  combiflam: 'Ibuprofen + Paracetamol',
  meftal: 'Mefenamic Acid',
  'meftal-spas': 'Mefenamic Acid + Dicyclomine',
  'pan-d': 'Pantoprazole + Domperidone',
  pantocid: 'Pantoprazole',
  zifi: 'Cefixime',
  azithral: 'Azithromycin',
  allegra: 'Fexofenadine',
  montek: 'Montelukast',
  'montek-lc': 'Levocetirizine + Montelukast',
  glycomet: 'Metformin',
  telma: 'Telmisartan'
};

export const DEFAULT_NMC_HEALTH_DISCLAIMER =
  '⚕️ चिकित्सीय अस्वीकरण (Medical Disclaimer): यह स्वास्थ्य रील NMC (National Medical Commission) आचार संहिता 2023 के तहत केवल जन-जागरूकता हेतु है। यह व्यक्तिगत चिकित्सीय जांच या इलाज का विकल्प नहीं है। लक्षण होने पर पंजीकृत डॉक्टर से परामर्श अवश्य लें।';
