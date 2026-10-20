/**
 * DOC SEARCH — Dynamic Multi-Industry UI Terminology Adapter
 * 
 * Dynamically translates sidebar labels, dashboard cards, and navigation
 * items based on the active partner tenant's industry vertical.
 * Defaults safely to HEALTHCARE to guarantee 100% zero-regression backward compatibility.
 */

import { resolveIndustryPreset, type IndustryVertical } from '@docsearch/shared-core';

export interface CardTerminology {
  title: string;
  subtitle?: string;
  countLabel?: string;
}

export interface IndustryTerminologySummary {
  vertical: IndustryVertical;
  industryName: string;
  badgeIcon: string;
  accentColor: string;
  customerSingular: string;
  customerPlural: string;
  providerSingular: string;
  providerPlural: string;
  resourceSingular: string;
  resourcePlural: string;
  serviceSingular: string;
  servicePlural: string;
  appointmentSingular: string;
  appointmentPlural: string;
  queueSingular: string;
  queuePlural: string;
}

/**
 * Maps known sidebar labels across the 6 major industry verticals.
 */
const INDUSTRY_LABEL_DICTIONARY: Record<IndustryVertical, Record<string, string>> = {
  HEALTHCARE: {
    // Zero modifications: Keep 100% authentic clinical labels
    'Doctor Roster': 'Doctor Roster',
    'Doctor Roster & Shifts': 'Doctor Roster & Shifts',
    'OPD Appointments': 'OPD Appointments',
    'OPD Queue': 'OPD Queue',
    'Patient Directory': 'Patient Directory',
    'Inpatient & Beds': 'Inpatient & Beds',
    'Bed Matrix': 'Bed Matrix',
    'Clinical Consultation': 'Clinical Consultation',
    'Billing & Invoices': 'Billing & Invoices',
    'Prescriptions & Pharmacy': 'Prescriptions & Pharmacy',
    'Investigation & Labs': 'Investigation & Labs',
    'Emergency & Trauma': 'Emergency & Trauma',
    'Operation Theatre': 'Operation Theatre'
  },

  SALON_SPA: {
    'Doctor Roster': 'Stylists & Chairs',
    'Doctor Roster & Shifts': 'Stylist Roster & Shifts',
    'OPD Appointments': 'Appointments & Bookings',
    'OPD Queue': 'Chair Waiting Queue',
    'Patient Directory': 'Clients & Guests',
    'Inpatient & Beds': 'Spa Suites & Stations',
    'Bed Matrix': 'Chair & Station Matrix',
    'Clinical Consultation': 'Styling & Treatments',
    'Billing & Invoices': 'Client POS & Billing',
    'Prescriptions & Pharmacy': 'Beauty Products & Retail',
    'Investigation & Labs': 'Skin & Hair Profiles',
    'Emergency & Trauma': 'VIP Walk-in Priority',
    'Operation Theatre': 'Bridal & Private Suites'
  },

  LEGAL_CONSULTING: {
    'Doctor Roster': 'Advocates & Partners',
    'Doctor Roster & Shifts': 'Advocate Roster & Availability',
    'OPD Appointments': 'Consultation Sessions',
    'OPD Queue': 'Hearing & Client Queue',
    'Patient Directory': 'Client File Registry',
    'Inpatient & Beds': 'Meeting Rooms & Chambers',
    'Bed Matrix': 'Chamber Occupancy',
    'Clinical Consultation': 'Case Briefing & Advisory',
    'Billing & Invoices': 'Retainer & Hourly Billing',
    'Prescriptions & Pharmacy': 'Case Document Vault',
    'Investigation & Labs': 'Forensic Audit & Due Diligence',
    'Emergency & Trauma': 'Urgent Court Motion Desk',
    'Operation Theatre': 'Arbitration Chambers'
  },

  AUTO_SERVICE: {
    'Doctor Roster': 'Service Bays & Mechanics',
    'Doctor Roster & Shifts': 'Technician Shift Roster',
    'OPD Appointments': 'Service Slots & Bookings',
    'OPD Queue': 'Floor Bay Queue',
    'Patient Directory': 'Vehicle Owners & Fleet',
    'Inpatient & Beds': 'Service Bays & Lifts',
    'Bed Matrix': 'Bay Allocation Matrix',
    'Clinical Consultation': 'Vehicle Inspection & Job Card',
    'Billing & Invoices': 'Estimates & Invoices',
    'Prescriptions & Pharmacy': 'Spare Parts & Consumables',
    'Investigation & Labs': 'Diagnostics & OBD Scan',
    'Emergency & Trauma': 'Breakdown & Towing Triage',
    'Operation Theatre': 'Engine & Overhaul Bay'
  },

  FITNESS_SPORTS: {
    'Doctor Roster': 'Trainers & Coaches',
    'Doctor Roster & Shifts': 'Coach Availability & Roster',
    'OPD Appointments': 'Court & Session Bookings',
    'OPD Queue': 'Player Turn Queue',
    'Patient Directory': 'Athletes & Members',
    'Inpatient & Beds': 'Courts, Turfs & Studios',
    'Bed Matrix': 'Court Booking Matrix',
    'Clinical Consultation': 'Fitness Assessment & Training',
    'Billing & Invoices': 'Membership & Court Fees',
    'Prescriptions & Pharmacy': 'Supplements & Equipment',
    'Investigation & Labs': 'Body Composition & Vitals',
    'Emergency & Trauma': 'Sports Injury First-Aid',
    'Operation Theatre': 'Tournament Arena'
  },

  EDUCATION_COACHING: {
    'Doctor Roster': 'Faculty & Counselors',
    'Doctor Roster & Shifts': 'Faculty Timetable & Roster',
    'OPD Appointments': '1-on-1 Sessions & Batches',
    'OPD Queue': 'Doubt Clearing Queue',
    'Patient Directory': 'Students & Candidates',
    'Inpatient & Beds': 'Classrooms & Mock Labs',
    'Bed Matrix': 'Classroom Allocation',
    'Clinical Consultation': 'Counseling & Mentorship',
    'Billing & Invoices': 'Tuition & Fee Receipts',
    'Prescriptions & Pharmacy': 'Study Materials & Kits',
    'Investigation & Labs': 'Mock Tests & Evaluations',
    'Emergency & Trauma': 'Exam Escalation Helpdesk',
    'Operation Theatre': 'Main Lecture Auditorium'
  }
};

/**
 * Translates a UI label to match the tenant's industry vertical.
 * Defaults strictly to the original label if healthcare or unmatched.
 */
export function adaptSidebarLabel(rawLabel: string, industryType?: string | null): string {
  if (!rawLabel || typeof rawLabel !== 'string') return rawLabel;

  const preset = resolveIndustryPreset(industryType);
  if (preset.vertical === 'HEALTHCARE') {
    return rawLabel;
  }

  const dict = INDUSTRY_LABEL_DICTIONARY[preset.vertical];
  if (!dict) return rawLabel;

  // Direct match
  if (dict[rawLabel]) return dict[rawLabel];

  // Trimmed match
  const trimmed = rawLabel.trim();
  if (dict[trimmed]) return dict[trimmed];

  // Match without leading emoji
  const withoutEmoji = rawLabel.replace(/^[\p{Emoji}\p{Emoji_Component}\p{Extended_Pictographic}\s]+/u, '').trim();
  if (dict[withoutEmoji]) {
    return dict[withoutEmoji];
  }

  return rawLabel;
}

/**
 * Translates a dashboard card's titles and labels.
 */
export function adaptDashboardCard(card: CardTerminology, industryType?: string | null): CardTerminology {
  const preset = resolveIndustryPreset(industryType);
  if (preset.vertical === 'HEALTHCARE') {
    return card;
  }

  const result: CardTerminology = {
    title: adaptSidebarLabel(card.title, industryType)
  };
  if (card.subtitle !== undefined) {
    result.subtitle = adaptSidebarLabel(card.subtitle, industryType);
  }
  if (card.countLabel !== undefined) {
    result.countLabel = adaptSidebarLabel(card.countLabel, industryType);
  }
  return result;
}

/**
 * Returns a high-level terminology summary for headers, badges, and breadcrumbs.
 */
export function getIndustryTerminologySummary(industryType?: string | null): IndustryTerminologySummary {
  const preset = resolveIndustryPreset(industryType);
  const v = preset.vocabulary;

  return {
    vertical: preset.vertical,
    industryName: preset.name,
    badgeIcon: preset.badgeIcon,
    accentColor: preset.accentColor,
    customerSingular: v.customer.singular,
    customerPlural: v.customer.plural,
    providerSingular: v.provider.singular,
    providerPlural: v.provider.plural,
    resourceSingular: v.resource.singular,
    resourcePlural: v.resource.plural,
    serviceSingular: v.service.singular,
    servicePlural: v.service.plural,
    appointmentSingular: v.appointment.singular,
    appointmentPlural: v.appointment.plural,
    queueSingular: v.queue.singular,
    queuePlural: v.queue.plural
  };
}
