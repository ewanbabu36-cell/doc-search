/**
 * DOC SEARCH — Universal Multi-Industry Appointment & Scheduling Presets
 * 
 * Provides domain ontology abstraction and vocabulary mapping for 6 major industry verticals.
 * Enforces strict fallback to 'HEALTHCARE' to guarantee 100% zero-regression backward compatibility.
 */

export type IndustryVertical =
  | 'HEALTHCARE'
  | 'SALON_SPA'
  | 'LEGAL_CONSULTING'
  | 'AUTO_SERVICE'
  | 'FITNESS_SPORTS'
  | 'EDUCATION_COACHING';

export interface IndustryVocabulary {
  customer: { singular: string; plural: string; idLabel: string };
  provider: { singular: string; plural: string };
  resource: { singular: string; plural: string };
  service: { singular: string; plural: string };
  appointment: { singular: string; plural: string };
  queue: { singular: string; plural: string };
  intakeNote: { singular: string; plural: string };
}

export interface IntakeFieldDefinition {
  field: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'boolean';
  required: boolean;
  options?: string[];
}

export interface IndustryPresetConfig {
  id: string;
  vertical: IndustryVertical;
  name: string;
  badgeIcon: string;
  accentColor: string;
  description: string;
  defaultPlanTier: string;
  roles: string[];
  features: Record<string, boolean>;
  vocabulary: IndustryVocabulary;
  defaultModules: string[];
  customIntakeFields: IntakeFieldDefinition[];
}

export const INDUSTRY_PRESETS: Record<IndustryVertical, IndustryPresetConfig> = {
  HEALTHCARE: {
    id: 'HEALTHCARE',
    vertical: 'HEALTHCARE',
    name: 'Healthcare & Clinical Practice',
    badgeIcon: '🏥',
    accentColor: '#0EA5E9',
    description: 'Hospitals, multi-specialty clinics, diagnostic centres, and pathology laboratories.',
    defaultPlanTier: 'HOSPITAL_PRO',
    roles: ['HOSPITAL_ADMIN', 'DOCTOR'],
    features: { appointments: true, roster: true, lims: true, pacs: true, ipd: true, pharmacy: true, billing: true },
    vocabulary: {
      customer: { singular: 'Patient', plural: 'Patients', idLabel: 'UHID / Patient ID' },
      provider: { singular: 'Doctor', plural: 'Doctors & Specialists' },
      resource: { singular: 'Chamber / Bed', plural: 'Consultation Chambers & Beds' },
      service: { singular: 'Consultation', plural: 'Clinical Procedures & Consultations' },
      appointment: { singular: 'OPD Appointment', plural: 'OPD Appointments' },
      queue: { singular: 'OPD Token Queue', plural: 'Live OPD Queues' },
      intakeNote: { singular: 'Clinical SOAP Note', plural: 'Clinical Case Sheets' }
    },
    defaultModules: ['EMR', 'OPD_ROSTER', 'PHARMACY', 'LIMS', 'PACS', 'IPD', 'BILLING'],
    customIntakeFields: [
      { field: 'chiefComplaint', label: 'Chief Complaint / Symptoms', type: 'text', required: true },
      { field: 'bloodGroup', label: 'Blood Group', type: 'select', required: false, options: ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'] },
      { field: 'isEmergency', label: 'Emergency Triage', type: 'boolean', required: false }
    ]
  },

  SALON_SPA: {
    id: 'SALON_SPA',
    vertical: 'SALON_SPA',
    name: 'Salons, Spas & Wellness',
    badgeIcon: '💇',
    accentColor: '#EC4899',
    description: 'Hair salons, luxury spas, nail studios, aesthetic skin clinics, and massage parlors.',
    defaultPlanTier: 'SALON_PRO',
    roles: ['SALON_MANAGER', 'STYLIST'],
    features: { appointments: true, roster: true, chair_management: true, packages: true, billing: true },
    vocabulary: {
      customer: { singular: 'Client / Guest', plural: 'Clients & Guests', idLabel: 'Client Card ID' },
      provider: { singular: 'Stylist / Therapist', plural: 'Stylists & Therapists' },
      resource: { singular: 'Styling Chair / Spa Suite', plural: 'Chairs & Spa Suites' },
      service: { singular: 'Treatment / Service', plural: 'Salon & Spa Services' },
      appointment: { singular: 'Session Booking', plural: 'Bookings & Appointments' },
      queue: { singular: 'Walk-in Chair Queue', plural: 'Live Chair Waiting Queue' },
      intakeNote: { singular: 'Client Consultation Card', plural: 'Client Service Records' }
    },
    defaultModules: ['CALENDAR_ROSTER', 'LIVE_QUEUE', 'INVENTORY_STOCK', 'BILLING_POS', 'LOYALTY_REWARDS'],
    customIntakeFields: [
      { field: 'hairOrSkinType', label: 'Hair / Skin Profile', type: 'select', required: false, options: ['Normal', 'Dry', 'Oily', 'Sensitive', 'Color-Treated'] },
      { field: 'allergiesOrPreferences', label: 'Allergies / Special Requests', type: 'text', required: false },
      { field: 'preferredStylist', label: 'Preferred Stylist', type: 'text', required: false }
    ]
  },

  LEGAL_CONSULTING: {
    id: 'LEGAL_CONSULTING',
    vertical: 'LEGAL_CONSULTING',
    name: 'Legal Chambers & Financial Advisory',
    badgeIcon: '⚖️',
    accentColor: '#6366F1',
    description: 'Advocates, chartered accountants, taxation consultants, corporate law chambers, and notaries.',
    defaultPlanTier: 'LEGAL_PRO',
    roles: ['MANAGING_PARTNER', 'ASSOCIATE'],
    features: { appointments: true, calendar: true, case_briefs: true, time_tracking: true, billing: true },
    vocabulary: {
      customer: { singular: 'Client', plural: 'Clients', idLabel: 'Client File No' },
      provider: { singular: 'Advocate / Partner', plural: 'Advocates & Consultants' },
      resource: { singular: 'Conference Room / Chamber', plural: 'Chambers & Meeting Rooms' },
      service: { singular: 'Advisory / Case Review', plural: 'Legal & Tax Services' },
      appointment: { singular: 'Consultation Session', plural: 'Consultation Sessions' },
      queue: { singular: 'Appointment Queue', plural: 'Meeting Queues' },
      intakeNote: { singular: 'Case Briefing Note', plural: 'Case History Files' }
    },
    defaultModules: ['CALENDAR_ROSTER', 'DOCUMENT_VAULT', 'TIME_TRACKING', 'RETAINER_BILLING'],
    customIntakeFields: [
      { field: 'caseType', label: 'Legal / Advisory Domain', type: 'select', required: true, options: ['Corporate', 'Civil / Property', 'Taxation / GST', 'Criminal', 'Arbitration', 'Family'] },
      { field: 'caseTitle', label: 'Brief Matter Summary', type: 'text', required: true },
      { field: 'isUrgentHearing', label: 'Court Hearing Due in 48h', type: 'boolean', required: false }
    ]
  },

  AUTO_SERVICE: {
    id: 'AUTO_SERVICE',
    vertical: 'AUTO_SERVICE',
    name: 'Auto Service & Detailing Workshops',
    badgeIcon: '🚗',
    accentColor: '#F59E0B',
    description: 'Multi-brand garages, authorized car service workshops, detailing studios, and tyre centres.',
    defaultPlanTier: 'AUTO_PRO',
    roles: ['WORKSHOP_MANAGER', 'SERVICE_ADVISOR'],
    features: { appointments: true, bay_scheduling: true, job_cards: true, parts_inventory: true, billing: true },
    vocabulary: {
      customer: { singular: 'Vehicle Owner', plural: 'Vehicle Owners', idLabel: 'Vehicle Reg Number' },
      provider: { singular: 'Service Advisor / Mechanic', plural: 'Service Advisors & Technicians' },
      resource: { singular: 'Service Bay / Lift', plural: 'Service Bays & Hydraulic Lifts' },
      service: { singular: 'Job Card / Service Package', plural: 'Maintenance & Repair Packages' },
      appointment: { singular: 'Service Slot', plural: 'Service Bookings' },
      queue: { singular: 'Workshop Floor Bay Queue', plural: 'Bay Assignment Queue' },
      intakeNote: { singular: 'Vehicle Job Card', plural: 'Vehicle Inspection Sheets' }
    },
    defaultModules: ['BAY_ROSTER', 'JOB_CARD_TRACKING', 'PARTS_INVENTORY', 'ESTIMATION_BILLING'],
    customIntakeFields: [
      { field: 'vehicleMakeModel', label: 'Vehicle Make & Model', type: 'text', required: true },
      { field: 'registrationNumber', label: 'Registration / License Plate Number', type: 'text', required: true },
      { field: 'odometerKm', label: 'Odometer Reading (KM)', type: 'number', required: false },
      { field: 'serviceType', label: 'Service Category', type: 'select', required: true, options: ['Periodic Service', 'Brake / Suspension', 'AC Repair', 'Bodywork / Detailing', 'General Inspection'] }
    ]
  },

  FITNESS_SPORTS: {
    id: 'FITNESS_SPORTS',
    vertical: 'FITNESS_SPORTS',
    name: 'Fitness Clubs, Sports Academies & Courts',
    badgeIcon: '🏸',
    accentColor: '#10B981',
    description: 'Badminton & tennis court rentals, crossfit gyms, yoga studios, and personal training.',
    defaultPlanTier: 'FITNESS_PRO',
    roles: ['FITNESS_DIRECTOR', 'TRAINER'],
    features: { appointments: true, court_booking: true, class_roster: true, memberships: true, billing: true },
    vocabulary: {
      customer: { singular: 'Member / Athlete', plural: 'Members & Players', idLabel: 'Membership ID' },
      provider: { singular: 'Coach / Personal Trainer', plural: 'Coaches & Instructors' },
      resource: { singular: 'Court / Turf / Studio', plural: 'Courts, Turf & Studios' },
      service: { singular: 'Slot / Training Session', plural: 'Classes & Court Sessions' },
      appointment: { singular: 'Court Booking / Session', plural: 'Court & Trainer Bookings' },
      queue: { singular: 'Court Turn Queue', plural: 'Check-in Queue' },
      intakeNote: { singular: 'Fitness Assessment Card', plural: 'Player Training Logs' }
    },
    defaultModules: ['COURT_CALENDAR', 'TRAINER_ROSTER', 'MEMBERSHIP_PASSES', 'BILLING_POS'],
    customIntakeFields: [
      { field: 'courtOrActivity', label: 'Activity / Sport', type: 'select', required: true, options: ['Badminton Court', 'Tennis Court', 'Box Cricket / Turf', 'Personal Gym Training', 'Yoga / Pilates Class'] },
      { field: 'numberOfPlayers', label: 'Number of Players / Guests', type: 'number', required: false },
      { field: 'skillLevel', label: 'Proficiency Level', type: 'select', required: false, options: ['Beginner', 'Intermediate', 'Advanced / Tournament'] }
    ]
  },

  EDUCATION_COACHING: {
    id: 'EDUCATION_COACHING',
    vertical: 'EDUCATION_COACHING',
    name: 'Education Institutes, Coaching & Tutors',
    badgeIcon: '🎓',
    accentColor: '#8B5CF6',
    description: '1-on-1 tutoring centres, career counselors, study-abroad consultants, and music academies.',
    defaultPlanTier: 'EDU_PRO',
    roles: ['ACADEMIC_ADMIN', 'INSTRUCTOR'],
    features: { appointments: true, batch_sessions: true, classroom_allocation: true, attendance: true, billing: true },
    vocabulary: {
      customer: { singular: 'Student / Candidate', plural: 'Students & Candidates', idLabel: 'Student Enrollment ID' },
      provider: { singular: 'Faculty / Counselor', plural: 'Faculty & Mentors' },
      resource: { singular: 'Classroom / Mock Desk', plural: 'Classrooms & Labs' },
      service: { singular: '1-on-1 Session / Evaluation', plural: 'Courses & Mentorship Sessions' },
      appointment: { singular: 'Doubt / Counseling Slot', plural: 'Scheduled Sessions' },
      queue: { singular: 'Counseling Waiting Queue', plural: 'Session Queue' },
      intakeNote: { singular: 'Student Assessment Sheet', plural: 'Academic Progress Cards' }
    },
    defaultModules: ['FACULTY_CALENDAR', 'BATCH_ROSTER', 'STUDENT_ENROLLMENT', 'FEE_RECEIPTS'],
    customIntakeFields: [
      { field: 'subjectOrGoal', label: 'Subject / Target Examination', type: 'text', required: true },
      { field: 'currentGrade', label: 'Current Grade / College Year', type: 'text', required: false },
      { field: 'sessionFormat', label: 'Session Delivery Format', type: 'select', required: true, options: ['Offline Classroom', '1-on-1 In-Person', 'Online Video Consultation'] }
    ]
  }
};

/**
 * Resolves an industry preset configuration.
 * Always safely defaults to 'HEALTHCARE' to guarantee 100% zero-regression backward compatibility.
 */
export function resolveIndustryPreset(industry?: string | null): IndustryPresetConfig {
  if (!industry) {
    return INDUSTRY_PRESETS.HEALTHCARE;
  }

  const normalized = industry.toUpperCase().trim() as IndustryVertical;
  if (normalized in INDUSTRY_PRESETS) {
    return INDUSTRY_PRESETS[normalized];
  }

  // Fallback mappings for casual inputs
  if (normalized.includes('SALON') || normalized.includes('SPA') || normalized.includes('BEAUTY') || normalized.includes('HAIR')) {
    return INDUSTRY_PRESETS.SALON_SPA;
  }
  if (normalized.includes('AUTO') || normalized.includes('GARAGE') || normalized.includes('CAR') || normalized.includes('VEHICLE') || normalized.includes('MOTOR')) {
    return INDUSTRY_PRESETS.AUTO_SERVICE;
  }
  if (normalized.includes('LEGAL') || normalized.includes('LAWYER') || normalized.includes('ADVOCATE') || normalized.includes('ATTORNEY') || /\bCA\b/.test(normalized) || normalized.includes('CHARTERED')) {
    return INDUSTRY_PRESETS.LEGAL_CONSULTING;
  }
  if (normalized.includes('FITNESS') || normalized.includes('GYM') || normalized.includes('SPORT') || normalized.includes('COURT') || normalized.includes('TRAINER')) {
    return INDUSTRY_PRESETS.FITNESS_SPORTS;
  }
  if (normalized.includes('EDU') || normalized.includes('COACH') || normalized.includes('TUTOR') || normalized.includes('STUDENT') || normalized.includes('TEACH')) {
    return INDUSTRY_PRESETS.EDUCATION_COACHING;
  }

  return INDUSTRY_PRESETS.HEALTHCARE;
}
