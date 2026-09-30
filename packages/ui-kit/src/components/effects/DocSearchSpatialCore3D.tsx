import React from 'react';

export type SpatialPillarId = string;

export interface SpatialPillarNode {
  id: string;
  name: string;
  code?: string | undefined;
  icon: string;
  color: string;
  angle?: number | undefined; // in radians
  distance?: number | undefined; // in pixels
  description?: string | undefined;
  badge?: string | undefined;
  action?: (() => void) | undefined;
}

export interface NodeMetric {
  count?: number | string | undefined;
  label?: string | undefined;
  status?: 'NOMINAL' | 'BUSY' | 'ALERT' | undefined;
}

export type SpatialPresetKey =
  | 'overview'
  | 'patient-registration'
  | 'clinical-consultation'
  | 'pharmacy'
  | 'billing'
  | 'inpatient'
  | 'pathology'
  | 'emergency'
  | 'doctor-roster'
  | 'partner-crm'
  | 'growth-engine'
  | 'finance'
  | 'support'
  | 'ai-governance'
  | 'radiology'
  | 'blood-bank'
  | 'ot'
  | 'mrd'
  | 'analytics'
  | 'compliance'
  | 'security';

export interface SpatialPresetConfig {
  title: string;
  subtitle: string;
  coreTitle: string;
  coreSubtitle: string;
  coreIcon: string;
  coreColor: string;
  nodes: SpatialPillarNode[];
}

export const SPATIAL_PRESETS: Record<SpatialPresetKey, SpatialPresetConfig> = {
  overview: {
    title: 'DOC SEARCH HEALTHCARE OS',
    subtitle: 'SPATIAL ORCHESTRATION CORE • LIVE TELEMETRY',
    coreTitle: 'DOC SEARCH',
    coreSubtitle: 'OS CORE',
    coreIcon: '🌐',
    coreColor: '#0284C7',
    nodes: [
      { id: 'patient', name: 'Patient 360', code: 'PIL-01', icon: '📇', color: '#06B6D4' },
      { id: 'doctor', name: 'Doctor & e-Rx', code: 'PIL-02', icon: '🩺', color: '#10B981' },
      { id: 'hospital', name: 'Inpatient & ADT', code: 'PIL-03', icon: '🏥', color: '#3B82F6' },
      { id: 'lab', name: 'Pathology LIMS', code: 'PIL-04', icon: '🧪', color: '#F59E0B' },
      { id: 'pharmacy', name: 'Pharmacy & FEFO', code: 'PIL-05', icon: '💊', color: '#EC4899' },
      { id: 'finance', name: 'Revenue & TPA', code: 'PIL-06', icon: '💳', color: '#8B5CF6' },
      { id: 'ai', name: 'Clinical CDSS AI', code: 'PIL-07', icon: '🧠', color: '#6366F1' }
    ]
  },
  'patient-registration': {
    title: 'PATIENT 360 & MASTER REGISTRY',
    subtitle: 'ABHA IDENTITY, DEMOGRAPHICS & CLINICAL ONBOARDING',
    coreTitle: 'PATIENT 360',
    coreSubtitle: 'REGISTRY CORE',
    coreIcon: '📇',
    coreColor: '#06B6D4',
    nodes: [
      { id: 'abha-kyc', name: 'ABHA ID & KYC', code: 'PR-01', icon: '🆔', color: '#06B6D4' },
      { id: 'demographics', name: 'Demographics Master', code: 'PR-02', icon: '👤', color: '#3B82F6' },
      { id: 'emergency-contacts', name: 'Emergency Contacts', code: 'PR-03', icon: '📞', color: '#EF4444' },
      { id: 'triage-vitals', name: 'Triage & Initial Vitals', code: 'PR-04', icon: '🫀', color: '#10B981' },
      { id: 'insurance-tpa', name: 'Insurance & TPA', code: 'PR-05', icon: '🛡️', color: '#8B5CF6' },
      { id: 'token-queue', name: 'OPD Queue Tokens', code: 'PR-06', icon: '🎫', color: '#F59E0B' },
      { id: 'consent-biometrics', name: 'Consent & Biometrics', code: 'PR-07', icon: '🔒', color: '#EC4899' }
    ]
  },
  'clinical-consultation': {
    title: 'CLINICAL CONSULTATION & EMR',
    subtitle: 'ELECTRONIC HEALTH RECORDS, CDSS & DIGITAL PRESCRIPTION',
    coreTitle: 'CLINICAL EMR',
    coreSubtitle: 'CONSULTATION CORE',
    coreIcon: '🩺',
    coreColor: '#10B981',
    nodes: [
      { id: 'complaints', name: 'Chief Complaints', code: 'CC-01', icon: '📝', color: '#06B6D4' },
      { id: 'vitals-news2', name: 'Vitals & NEWS2', code: 'CC-02', icon: '📊', color: '#10B981' },
      { id: 'icd10', name: 'ICD-10 Diagnoses', code: 'CC-03', icon: '🔬', color: '#F59E0B' },
      { id: 'erx', name: 'e-Prescriptions (Rx)', code: 'CC-04', icon: '💊', color: '#EC4899' },
      { id: 'ai-cdss', name: 'AI Clinical CDSS', code: 'CC-05', icon: '🤖', color: '#6366F1' },
      { id: 'lab-orders', name: 'Diagnostics Orders', code: 'CC-06', icon: '🧪', color: '#3B82F6' },
      { id: 'tele-followup', name: 'Telemedicine & OPD', code: 'CC-07', icon: '📅', color: '#8B5CF6' }
    ]
  },
  pharmacy: {
    title: 'PHARMACY DISPENSARY & FEFO INVENTORY',
    subtitle: 'RETAIL POS, DRUG SCHEDULES & BATCH LEVEL TELEMETRY',
    coreTitle: 'PHARMACY OS',
    coreSubtitle: 'DISPENSARY CORE',
    coreIcon: '💊',
    coreColor: '#EC4899',
    nodes: [
      { id: 'pos-billing', name: 'Counter POS & Billing', code: 'PH-01', icon: '🧾', color: '#10B981' },
      { id: 'fefo-stock', name: 'FEFO Batch Inventory', code: 'PH-02', icon: '📦', color: '#3B82F6' },
      { id: 'schedule-h1', name: 'Schedule H1 Narcotics', code: 'PH-03', icon: '⚠️', color: '#EF4444' },
      { id: 'interaction-cdss', name: 'Drug Interaction CDSS', code: 'PH-04', icon: '🛡️', color: '#6366F1' },
      { id: 'barcode-dispense', name: 'Barcode Dispensing', code: 'PH-05', icon: '🏷️', color: '#06B6D4' },
      { id: 'expiry-sentinel', name: 'Expiry Sentinel Alert', code: 'PH-06', icon: '⏳', color: '#F59E0B' },
      { id: 'supplier-po', name: 'Supplier Purchase PO', code: 'PH-07', icon: '🚚', color: '#8B5CF6' }
    ]
  },
  billing: {
    title: 'BILLING & REVENUE CYCLE MANAGEMENT (RCM)',
    subtitle: '18% GST COMPLIANCE, TPA CLAIMS & COUNTER COLLECTIONS',
    coreTitle: 'BILLING & RCM',
    coreSubtitle: 'FINANCE CORE',
    coreIcon: '🧾',
    coreColor: '#8B5CF6',
    nodes: [
      { id: 'counter-pos', name: 'Counter POS Invoicing', code: 'BIL-01', icon: '💳', color: '#10B981' },
      { id: 'gst-ledger', name: '18% GST Tax Ledger', code: 'BIL-02', icon: '🏛️', color: '#3B82F6' },
      { id: 'tpa-claims', name: 'Insurance / TPA Desk', code: 'BIL-03', icon: '🛡️', color: '#8B5CF6' },
      { id: 'qr-pos', name: 'UPI & Razorpay POS', code: 'BIL-04', icon: '📲', color: '#06B6D4' },
      { id: 'corporate-credit', name: 'Corporate Credit AR', code: 'BIL-05', icon: '🏢', color: '#F59E0B' },
      { id: 'settlements', name: 'Refunds & Settlement', code: 'BIL-06', icon: '🔄', color: '#EC4899' },
      { id: 'audit-log', name: 'Immutable Audit Trail', code: 'BIL-07', icon: '🔒', color: '#64748B' }
    ]
  },
  inpatient: {
    title: 'INPATIENT MANAGEMENT & ADT (IPD)',
    subtitle: 'REAL-TIME 3D BED BOARD, OT ROSTER & CLINICAL NURSING',
    coreTitle: 'INPATIENT IPD',
    coreSubtitle: 'BED & WARD CORE',
    coreIcon: '🛏️',
    coreColor: '#3B82F6',
    nodes: [
      { id: 'bed-board', name: 'Live 3D Bed Board', code: 'IPD-01', icon: '🛏️', color: '#3B82F6' },
      { id: 'nursing-desk', name: 'Nursing Station Desk', code: 'IPD-02', icon: '👩‍⚕️', color: '#10B981' },
      { id: 'ot-surgery', name: 'OT & Surgery Roster', code: 'IPD-03', icon: '🔪', color: '#EC4899' },
      { id: 'sbar-handover', name: 'SBAR Shift Handover', code: 'IPD-04', icon: '🔄', color: '#F59E0B' },
      { id: 'diet-kitchen', name: 'Diet & Nutrition Hub', code: 'IPD-05', icon: '🥗', color: '#14B8A6' },
      { id: 'icu-telemetry', name: 'ICU Vitals Telemetry', code: 'IPD-06', icon: '📈', color: '#EF4444' },
      { id: 'discharge-clearance', name: 'Discharge Clearance', code: 'IPD-07', icon: '✅', color: '#8B5CF6' }
    ]
  },
  pathology: {
    title: 'PATHOLOGY & DIAGNOSTIC LABORATORY (LIS)',
    subtitle: 'SAMPLE COLLECTION, ANALYZERS & DIGITAL PATHOLOGIST SIGN-OFF',
    coreTitle: 'PATHOLOGY LIMS',
    coreSubtitle: 'DIAGNOSTIC CORE',
    coreIcon: '🧪',
    coreColor: '#F59E0B',
    nodes: [
      { id: 'sample-barcode', name: 'Sample Barcode Intake', code: 'LIS-01', icon: '🩸', color: '#EF4444' },
      { id: 'analyzer-interface', name: 'Automated Analyzers', code: 'LIS-02', icon: '🔬', color: '#3B82F6' },
      { id: 'panic-alerts', name: 'Critical Panic Alerts', code: 'LIS-03', icon: '🚨', color: '#F59E0B' },
      { id: 'pathologist-sign', name: 'Digital Pathologist Sign', code: 'LIS-04', icon: '✍️', color: '#10B981' },
      { id: 'nabl-qc', name: 'NABL Quality Control', code: 'LIS-05', icon: '🎯', color: '#8B5CF6' },
      { id: 'qr-reports', name: 'WhatsApp QR Reports', code: 'LIS-06', icon: '📲', color: '#06B6D4' },
      { id: 'reagent-stock', name: 'Reagent Cold-Chain', code: 'LIS-07', icon: '📦', color: '#EC4899' }
    ]
  },
  emergency: {
    title: 'EMERGENCY & TRAUMA CARE CENTRE',
    subtitle: 'ESI TRIAGE PROTOCOLS, CRASH CART & STAT RESUSCITATION',
    coreTitle: 'EMERGENCY TRAUMA',
    coreSubtitle: 'RESCUE CORE',
    coreIcon: '🚨',
    coreColor: '#EF4444',
    nodes: [
      { id: 'esi-triage', name: 'ESI Priority Triage', code: 'ER-01', icon: '🚦', color: '#EF4444' },
      { id: 'crash-cart', name: 'Crash Cart & Resus', code: 'ER-02', icon: '⚡', color: '#F59E0B' },
      { id: 'stat-bed', name: 'Immediate Bed Lock', code: 'ER-03', icon: '🛏️', color: '#3B82F6' },
      { id: 'blood-bank', name: 'Emergency Blood Bank', code: 'ER-04', icon: '🩸', color: '#EC4899' },
      { id: 'trauma-call', name: 'Trauma Surgery On-Call', code: 'ER-05', icon: '📞', color: '#10B981' },
      { id: 'mlc-registry', name: 'MLC Legal Registry', code: 'ER-06', icon: '⚖️', color: '#8B5CF6' },
      { id: 'ambulance-gps', name: 'Ambulance Fleet GPS', code: 'ER-07', icon: '🚑', color: '#06B6D4' }
    ]
  },
  'doctor-roster': {
    title: 'DOCTOR ROSTER & WORKFORCE ADMINISTRATION',
    subtitle: 'OPD CLINIC TIMINGS, CREDENTIALS & SHIFT COVERAGE',
    coreTitle: 'WORKFORCE ROSTER',
    coreSubtitle: 'CLINICAL STAFF CORE',
    coreIcon: '👨‍⚕️',
    coreColor: '#14B8A6',
    nodes: [
      { id: 'opd-slots', name: 'OPD Slot Management', code: 'DOC-01', icon: '⏱️', color: '#06B6D4' },
      { id: 'credentials', name: 'MCI / Medical License', code: 'DOC-02', icon: '📜', color: '#10B981' },
      { id: 'leave-shifts', name: 'Leave & Shift Covers', code: 'DOC-03', icon: '🏖️', color: '#F59E0B' },
      { id: 'dept-allocation', name: 'Department Allocation', code: 'DOC-04', icon: '🏥', color: '#3B82F6' },
      { id: 'token-velocity', name: 'OPD Token Velocity', code: 'DOC-05', icon: '⚡', color: '#EC4899' },
      { id: 'revenue-share', name: 'Doctor Fee Split Ledger', code: 'DOC-06', icon: '💳', color: '#8B5CF6' },
      { id: 'nabh-compliance', name: 'NABH Duty Roster Seal', code: 'DOC-07', icon: '🛡️', color: '#14B8A6' }
    ]
  },
  'partner-crm': {
    title: 'PARTNER LIFECYCLE & VERIFICATION CRM',
    subtitle: 'HEALTHCARE ONBOARDING, BAA GOVERNANCE & MARGIN SETTLEMENTS',
    coreTitle: 'PARTNER CRM',
    coreSubtitle: 'LIFECYCLE CORE',
    coreIcon: '🏥',
    coreColor: '#38BDF8',
    nodes: [
      { id: 'kyc-queue', name: 'KYC Verification Queue', code: 'CRM-01', icon: '📄', color: '#10B981' },
      { id: 'baa-agreements', name: 'BAA & DPDP Legal Vault', code: 'CRM-02', icon: '⚖️', color: '#F59E0B' },
      { id: 'tier-quotas', name: 'Hospital Tier Quotas', code: 'CRM-03', icon: '👑', color: '#06B6D4' },
      { id: 'empanelment', name: 'Doctor Empanelment', code: 'CRM-04', icon: '👨‍⚕️', color: '#8B5CF6' },
      { id: 'settlement-ledger', name: 'Settlement Ledgers', code: 'CRM-05', icon: '💳', color: '#3B82F6' },
      { id: 'sla-uptime', name: 'Facility Uptime SLA', code: 'CRM-06', icon: '⏱️', color: '#EC4899' },
      { id: 'hospital-support', name: 'Hospital Support Desk', code: 'CRM-07', icon: '🎧', color: '#64748B' }
    ]
  },
  'growth-engine': {
    title: 'GROWTH ENGINE & MONETIZATION HQ',
    subtitle: 'CARE PASS SUBSCRIPTIONS, COMMISSIONS & PAN-INDIA EXPANSION',
    coreTitle: 'GROWTH ENGINE',
    coreSubtitle: 'MONETIZATION CORE',
    coreIcon: '👑',
    coreColor: '#F59E0B',
    nodes: [
      { id: 'care-pass', name: 'Care Pass Subscriptions', code: 'GRO-01', icon: '💎', color: '#F59E0B' },
      { id: 'commission-splits', name: 'Partner Commission Splits', code: 'GRO-02', icon: '💰', color: '#10B981' },
      { id: 'whatsapp-broadcast', name: 'WhatsApp Engagement Hub', code: 'GRO-03', icon: '📲', color: '#06B6D4' },
      { id: 'dynamic-margins', name: 'Dynamic Margin Engine', code: 'GRO-04', icon: '📈', color: '#EC4899' },
      { id: 'clinic-pipeline', name: 'Clinic Tie-Up Pipeline', code: 'GRO-05', icon: '🤝', color: '#3B82F6' },
      { id: 'instant-payouts', name: 'Instant Payout Gateway', code: 'GRO-06', icon: '⚡', color: '#8B5CF6' },
      { id: 'expansion-kpis', name: 'Pan-India Growth KPIs', code: 'GRO-07', icon: '🇮🇳', color: '#14B8A6' }
    ]
  },
  finance: {
    title: 'SUBSCRIPTION / BILLING / FINANCE',
    subtitle: '18% GST TAX LEDGER, RECURRING SAAS & REVENUE RECOGNITION',
    coreTitle: 'FINANCE & GST',
    coreSubtitle: 'REVENUE CORE',
    coreIcon: '💳',
    coreColor: '#8B5CF6',
    nodes: [
      { id: 'recurring-saas', name: 'Recurring SaaS Invoices', code: 'FIN-01', icon: '🧾', color: '#10B981' },
      { id: 'gst-ledger', name: '18% GST Tax Invoices', code: 'FIN-02', icon: '🏛️', color: '#3B82F6' },
      { id: 'gateway-webhooks', name: 'Razorpay / Bank Webhooks', code: 'FIN-03', icon: '🔌', color: '#06B6D4' },
      { id: 'tds-reconciliation', name: 'TDS & Bank Reconcile', code: 'FIN-04', icon: '📊', color: '#F59E0B' },
      { id: 'dunning-recovery', name: 'Dunning & Churn Alerts', code: 'FIN-05', icon: '⚠️', color: '#EF4444' },
      { id: 'deferred-revenue', name: 'Deferred Revenue Ledger', code: 'FIN-06', icon: '📅', color: '#8B5CF6' },
      { id: 'financial-audit', name: 'Financial Audit Reports', code: 'FIN-07', icon: '📁', color: '#EC4899' }
    ]
  },
  support: {
    title: 'CUSTOMER SUCCESS & HOSPITAL SUPPORT',
    subtitle: 'DOCTOR HELPDESK TICKETS, P1 INCIDENT ESCALATION & CSAT',
    coreTitle: 'SUPPORT DESK',
    coreSubtitle: 'CUSTOMER SUCCESS',
    coreIcon: '🎧',
    coreColor: '#06B6D4',
    nodes: [
      { id: 'p1-incidents', name: 'Priority 1 Incidents', code: 'SUP-01', icon: '🚨', color: '#EF4444' },
      { id: 'doctor-tickets', name: 'Doctor Helpdesk Tickets', code: 'SUP-02', icon: '🩺', color: '#06B6D4' },
      { id: 'whatsapp-bot', name: 'WhatsApp AI Support Bot', code: 'SUP-03', icon: '💬', color: '#10B981' },
      { id: 'csat-radar', name: 'CSAT & Feedback Radar', code: 'SUP-04', icon: '⭐', color: '#F59E0B' },
      { id: 'on-call-rota', name: 'Emergency On-Call Rota', code: 'SUP-05', icon: '📞', color: '#EC4899' },
      { id: 'knowledge-base', name: 'Hospital Knowledge Base', code: 'SUP-06', icon: '📚', color: '#3B82F6' },
      { id: 'health-scorecard', name: 'Partner Health Scorecard', code: 'SUP-07', icon: '❤️', color: '#8B5CF6' }
    ]
  },
  'ai-governance': {
    title: 'CLINICAL AI & SAFETY GOVERNANCE',
    subtitle: 'CDSS ENGINE, PHI REDACTOR & HALLUCINATION DEFENSE',
    coreTitle: 'CLINICAL AI',
    coreSubtitle: 'SAFETY & CDSS',
    coreIcon: '🧠',
    coreColor: '#6366F1',
    nodes: [
      { id: 'medical-scribe', name: 'Ambient Medical Scribe', code: 'AI-01', icon: '🎙️', color: '#6366F1' },
      { id: 'cdss-engine', name: 'Differential CDSS Engine', code: 'AI-02', icon: '🔬', color: '#06B6D4' },
      { id: 'phi-redactor', name: 'Zero-Leak PHI Redactor', code: 'AI-03', icon: '🔒', color: '#10B981' },
      { id: 'guardrails', name: 'Clinical Safety Rules', code: 'AI-04', icon: '🛡️', color: '#F59E0B' },
      { id: 'token-quotas', name: 'Token Quotas & Latency', code: 'AI-05', icon: '⚡', color: '#EC4899' },
      { id: 'doctor-review', name: 'Doctor-in-the-Loop Sign', code: 'AI-06', icon: '👨‍⚕️', color: '#3B82F6' },
      { id: 'adverse-radar', name: 'Adverse Event Radar', code: 'AI-07', icon: '⚠️', color: '#EF4444' }
    ]
  },
  radiology: {
    title: 'RADIOLOGY PACS & CLINICAL IMAGING',
    subtitle: 'DICOM CLOUD ARCHIVE, AI HEATMAPS & MODALITY WORKLIST',
    coreTitle: 'RADIOLOGY PACS',
    coreSubtitle: 'IMAGING CORE',
    coreIcon: '🩻',
    coreColor: '#06B6D4',
    nodes: [
      { id: 'ct-mri', name: 'CT & MRI Modality', code: 'RAD-01', icon: '🌀', color: '#06B6D4' },
      { id: 'dicom-viewer', name: 'Cloud DICOM Viewer', code: 'RAD-02', icon: '🖥️', color: '#3B82F6' },
      { id: 'ai-heatmaps', name: 'AI Lesion Heatmap', code: 'RAD-03', icon: '🧠', color: '#8B5CF6' },
      { id: 'critical-finding', name: 'Panic Radiologist Alert', code: 'RAD-04', icon: '🚨', color: '#EF4444' },
      { id: 'prep-checklist', name: 'Contrast Prep Safety', code: 'RAD-05', icon: '📋', color: '#10B981' },
      { id: 'signed-reports', name: 'Digital Radiologist Sign', code: 'RAD-06', icon: '✍️', color: '#F59E0B' },
      { id: 'pacs-archive', name: 'Nearline PACS Vault', code: 'RAD-07', icon: '💾', color: '#EC4899' }
    ]
  },
  'blood-bank': {
    title: 'BLOOD BANK & TRANSFUSION MEDICINE',
    subtitle: 'DONOR REGISTRY, CROSS-MATCHING & CRYOPRESERVATION',
    coreTitle: 'BLOOD BANK',
    coreSubtitle: 'TRANSFUSION CORE',
    coreIcon: '🩸',
    coreColor: '#EF4444',
    nodes: [
      { id: 'donor-registry', name: 'Voluntary Donor Desk', code: 'BB-01', icon: '👤', color: '#EF4444' },
      { id: 'separation', name: 'Component Separation', code: 'BB-02', icon: '🧪', color: '#3B82F6' },
      { id: 'crossmatch', name: 'Coombs Cross-Matching', code: 'BB-03', icon: '🔬', color: '#10B981' },
      { id: 'cold-chain', name: 'Cold Chain -40°C Monitor', code: 'BB-04', icon: '❄️', color: '#06B6D4' },
      { id: 'stat-transfuse', name: 'Stat Trauma Transfusion', code: 'BB-05', icon: '🚨', color: '#F59E0B' },
      { id: 'plasma-cryo', name: 'FFP & Cryoprecipitate', code: 'BB-06', icon: '🧊', color: '#8B5CF6' },
      { id: 'regulatory-trace', name: 'FDA Batch Traceability', code: 'BB-07', icon: '📜', color: '#EC4899' }
    ]
  },
  ot: {
    title: 'OPERATION THEATRE & SURGICAL SUITE',
    subtitle: 'WHO SAFE SURGERY, ANESTHESIA PAC & RECOVERY PACU',
    coreTitle: 'SURGICAL SUITE',
    coreSubtitle: 'OT COMMAND CORE',
    coreIcon: '🔪',
    coreColor: '#EC4899',
    nodes: [
      { id: 'ot-roster', name: 'Live OT Schedule Grid', code: 'OT-01', icon: '📅', color: '#EC4899' },
      { id: 'pac-clearance', name: 'Pre-Anesthesia PAC', code: 'OT-02', icon: '🩺', color: '#10B981' },
      { id: 'who-checklist', name: 'WHO Surgical Checklist', code: 'OT-03', icon: '📋', color: '#3B82F6' },
      { id: 'intraop-telemetry', name: 'Intraoperative Vitals', code: 'OT-04', icon: '📈', color: '#EF4444' },
      { id: 'pacu-recovery', name: 'Post-Op PACU Recovery', code: 'OT-05', icon: '🛏️', color: '#06B6D4' },
      { id: 'implant-ledger', name: 'Surgical Implant Ledger', code: 'OT-06', icon: '🔩', color: '#F59E0B' },
      { id: 'cssd-sterilization', name: 'CSSD Autoclave Audit', code: 'OT-07', icon: '🧼', color: '#8B5CF6' }
    ]
  },
  mrd: {
    title: 'MEDICAL RECORDS DEPARTMENT & ARCHIVES (MRD)',
    subtitle: 'ICD-10 CODING, ML RECORDS & LEGAL EVIDENCE VAULT',
    coreTitle: 'MRD ARCHIVES',
    coreSubtitle: 'RECORDS CORE',
    coreIcon: '📚',
    coreColor: '#8B5CF6',
    nodes: [
      { id: 'icd-coding', name: 'ICD-10 Dual Coding', code: 'MRD-01', icon: '🏷️', color: '#8B5CF6' },
      { id: 'record-vault', name: 'Physical & Digitized EMR', code: 'MRD-02', icon: '📁', color: '#3B82F6' },
      { id: 'mlc-legal', name: 'Court Subpoena & MLC', code: 'MRD-03', icon: '⚖️', color: '#F59E0B' },
      { id: 'death-audit', name: 'Mortality & Form 4/4A', code: 'MRD-04', icon: '⚰️', color: '#64748B' },
      { id: 'retention-clock', name: '10-Year Retention Rule', code: 'MRD-05', icon: '⏳', color: '#10B981' },
      { id: 'qr-dispatch', name: 'Encrypted Patient Export', code: 'MRD-06', icon: '📲', color: '#06B6D4' },
      { id: 'nabh-sampling', name: 'NABH Clinical Sampling', code: 'MRD-07', icon: '🛡️', color: '#EC4899' }
    ]
  },
  analytics: {
    title: 'EXECUTIVE PLATFORM ANALYTICS & BI',
    subtitle: 'CROSS-FACILITY COHORTS, REVENUE VELOCITY & CLINICAL OUTCOMES',
    coreTitle: 'BI ANALYTICS',
    coreSubtitle: 'INTELLIGENCE CORE',
    coreIcon: '📊',
    coreColor: '#3B82F6',
    nodes: [
      { id: 'revenue-mrr', name: 'Real-Time MRR & ARPU', code: 'BI-01', icon: '📈', color: '#10B981' },
      { id: 'bed-occupancy', name: 'Pan-India Bed Occupancy', code: 'BI-02', icon: '🛏️', color: '#3B82F6' },
      { id: 'clinical-outcomes', name: 'Clinical Recovery Ratios', code: 'BI-03', icon: '🩺', color: '#8B5CF6' },
      { id: 'los-benchmark', name: 'Length of Stay (LOS)', code: 'BI-04', icon: '⏱️', color: '#F59E0B' },
      { id: 'cohort-churn', name: 'Hospital Retention Cohorts', code: 'BI-05', icon: '👥', color: '#EC4899' },
      { id: 'api-throughput', name: 'Platform API Throughput', code: 'BI-06', icon: '⚡', color: '#06B6D4' },
      { id: 'audit-trail', name: 'Executive BI Audit Trail', code: 'BI-07', icon: '🔒', color: '#64748B' }
    ]
  },
  compliance: {
    title: 'REGULATORY COMPLIANCE & LEGAL AUDIT',
    subtitle: 'DISHA, DPDP 2023, HIPAA & NABH 5TH EDITION GOVERNANCE',
    coreTitle: 'COMPLIANCE',
    coreSubtitle: 'GOVERNANCE CORE',
    coreIcon: '⚖️',
    coreColor: '#10B981',
    nodes: [
      { id: 'dpdp-consent', name: 'DPDP 2023 Digital Consent', code: 'CMP-01', icon: '🔒', color: '#10B981' },
      { id: 'hipaa-baa', name: 'HIPAA BAA Contracts', code: 'CMP-02', icon: '📜', color: '#3B82F6' },
      { id: 'nabh-safeguards', name: 'NABH Safety Protocols', code: 'CMP-03', icon: '🛡️', color: '#8B5CF6' },
      { id: 'phi-logs', name: 'Access to PHI Audit Trail', code: 'CMP-04', icon: '👁️', color: '#F59E0B' },
      { id: 'incident-reporting', name: 'Data Breach Notification', code: 'CMP-05', icon: '🚨', color: '#EF4444' },
      { id: 'cert-renewals', name: 'ISO 27001 Renewals', code: 'CMP-06', icon: '✅', color: '#06B6D4' },
      { id: 'forensic-vault', name: 'WORM Forensic Storage', code: 'CMP-07', icon: '🏛️', color: '#EC4899' }
    ]
  },
  security: {
    title: 'ENTERPRISE ZERO-TRUST SECURITY',
    subtitle: 'RBAC, FIDO2 HARDWARE KEYS & BREAK-GLASS CONTROLS',
    coreTitle: 'ZERO TRUST',
    coreSubtitle: 'SECURITY CORE',
    coreIcon: '🛡️',
    coreColor: '#6366F1',
    nodes: [
      { id: 'break-glass', name: 'Break-Glass Emergency Auth', code: 'SEC-01', icon: '🚨', color: '#EF4444' },
      { id: 'mfa-fido', name: 'FIDO2 WebAuthn Keys', code: 'SEC-02', icon: '🔑', color: '#10B981' },
      { id: 'rbac-matrix', name: 'Granular RBAC Enforcer', code: 'SEC-03', icon: '👥', color: '#3B82F6' },
      { id: 'ddos-shield', name: 'WAF & Rate Limiting', code: 'SEC-04', icon: '🛡️', color: '#8B5CF6' },
      { id: 'session-sentinel', name: 'Live Session Killswitch', code: 'SEC-05', icon: '⚡', color: '#F59E0B' },
      { id: 'crypto-vault', name: 'AES-256 Envelope Keys', code: 'SEC-06', icon: '🔒', color: '#06B6D4' },
      { id: 'soc2-telemetry', name: 'SOC2 Continuous Monitor', code: 'SEC-07', icon: '📋', color: '#EC4899' }
    ]
  }
};

export interface DocSearchSpatialCore3DProps {
  preset?: SpatialPresetKey | undefined;
  title?: string | undefined;
  subtitle?: string | undefined;
  coreTitle?: string | undefined;
  coreSubtitle?: string | undefined;
  coreIcon?: string | undefined;
  coreColor?: string | undefined;
  height?: number | undefined;
  showHeader?: boolean | undefined;
  nodes?: SpatialPillarNode[] | undefined;
  activeNodeId?: string | undefined;
  onNodeClick?: ((nodeId: string) => void) | undefined;
  nodeMetrics?: Record<string, NodeMetric> | undefined;
  interactive?: boolean | undefined;
  collapsible?: boolean | undefined;
  defaultExpanded?: boolean | undefined;
  className?: string | undefined;
  style?: React.CSSProperties | undefined;
}

export const DocSearchSpatialCore3D: React.FC<DocSearchSpatialCore3DProps> = () => null;
