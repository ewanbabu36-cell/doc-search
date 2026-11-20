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

export interface DoctorReelDto {
  id: string;
  doctorId: string;
  doctorName: string;
  doctorSpecialty: string;
  doctorDegree: string;
  nmcRegistrationNumber: string;
  hospitalName: string;
  doctorAvatarUrl: string;

  // Media & Video
  videoUrl: string;
  thumbnailUrl: string;
  durationSeconds: number;

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
  isLikedByPatient?: boolean;
  isSavedByPatient?: boolean;

  // Regulatory & Trust
  isNmcVerified: boolean;
  publishedAt: string;
}

export interface CreateDoctorReelRequest {
  title: string;
  category: ReelCategory;
  videoUrl: string;
  thumbnailUrl?: string;
  durationSeconds: number;
  summaryHindi: string;
  summaryEnglish: string;
  clinicalDos: string[];
  clinicalDonts: string[];
  tags: string[];
  nextAvailableSlot: string;
  opdConsultationFee: number;
  isTeleconsultAvailable: boolean;
}

export type ReelEngagementAction = 'LIKE' | 'UNLIKE' | 'SAVE' | 'UNSAVE' | 'SHARE' | 'BOOK_CONSULT';

export interface ReelEngagementEvent {
  reelId: string;
  patientId: string;
  action: ReelEngagementAction;
  timestamp: string;
}
