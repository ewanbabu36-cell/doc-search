export type FeatureCategory = 'CLINICAL' | 'INPATIENT' | 'PHARMACY' | 'BILLING' | 'EMERGENCY' | 'EXECUTIVE';

export type JewelTheme = 'sapphire' | 'ruby' | 'emerald' | 'amber' | 'amethyst' | 'obsidian' | 'cyan' | 'rose' | 'teal';

export interface ModularFeatureAction {
  id: string;
  label: string;
  shortLabel: string;
  category: FeatureCategory;
  jewelTheme: JewelTheme;
  gradient: string;
  icon: string;
  route: string;
  badgeTelemetryKey?: string;
  description: string;
  hotkey?: string;
  defaultDockPriority?: number;
  tags: string[];
}

export const JEWEL_GRADIENTS: Record<JewelTheme, string> = {
  sapphire: 'from-blue-600 via-blue-500 to-indigo-700',
  ruby: 'from-red-600 via-rose-500 to-red-800',
  emerald: 'from-emerald-600 via-teal-500 to-green-700',
  amber: 'from-amber-500 via-yellow-500 to-orange-600',
  amethyst: 'from-purple-600 via-violet-500 to-indigo-800',
  obsidian: 'from-zinc-800 via-neutral-700 to-stone-900',
  cyan: 'from-cyan-600 via-sky-500 to-blue-700',
  rose: 'from-rose-500 via-pink-500 to-red-600',
  teal: 'from-teal-600 via-emerald-500 to-cyan-700',
};

export const FEATURE_REGISTRY: ModularFeatureAction[] = [
  // ---------------- CLINICAL (26 actions) ----------------
  {
    id: 'clinical_opd_queue',
    label: 'Outpatient Token Queue',
    shortLabel: 'OPD Queue',
    category: 'CLINICAL',
    jewelTheme: 'sapphire',
    gradient: JEWEL_GRADIENTS.sapphire,
    icon: 'Stethoscope',
    route: '/partner/clinical/consultations',
    badgeTelemetryKey: 'waiting_patients',
    description: 'Active OPD token caller with automated patient chime',
    hotkey: 'Alt+1',
    defaultDockPriority: 1,
    tags: ['opd', 'doctor', 'queue', 'token', 'consultation']
  },
  {
    id: 'clinical_rx_pad',
    label: 'Smart Rx Prescription Pad',
    shortLabel: 'Rx Pad',
    category: 'CLINICAL',
    jewelTheme: 'sapphire',
    gradient: JEWEL_GRADIENTS.sapphire,
    icon: 'FileText',
    route: '/partner/clinical/consultations/new-rx',
    badgeTelemetryKey: 'pending_rx',
    description: 'AI-assisted prescription generator with drug interaction check',
    hotkey: 'Alt+R',
    tags: ['rx', 'prescription', 'doctor', 'medication']
  },
  {
    id: 'clinical_patient_360',
    label: 'Patient 360 Unified EMR',
    shortLabel: 'Patient 360',
    category: 'CLINICAL',
    jewelTheme: 'sapphire',
    gradient: JEWEL_GRADIENTS.sapphire,
    icon: 'UserCheck',
    route: '/partner/clinical/patients',
    description: 'ABDM-compliant universal longitudinal health record view',
    tags: ['patient', 'emr', 'abdm', 'history']
  },
  {
    id: 'clinical_vitals_telemetry',
    label: 'Live Bedside Vitals Telemetry',
    shortLabel: 'Vitals HUD',
    category: 'CLINICAL',
    jewelTheme: 'cyan',
    gradient: JEWEL_GRADIENTS.cyan,
    icon: 'Activity',
    route: '/partner/clinical/vitals',
    badgeTelemetryKey: 'abnormal_vitals_count',
    description: 'Real-time multi-parameter monitor sync (BP, SpO2, Pulse, Temp)',
    tags: ['vitals', 'icu', 'monitor', 'telemetry', 'spo2']
  },
  {
    id: 'clinical_ai_scribe',
    label: 'Ambient Voice AI Scribe',
    shortLabel: 'AI Scribe',
    category: 'CLINICAL',
    jewelTheme: 'amethyst',
    gradient: JEWEL_GRADIENTS.amethyst,
    icon: 'Mic',
    route: '/partner/clinical/ai-scribe',
    description: 'Automated Hindi/English doctor-patient consultation transcriber',
    tags: ['ai', 'voice', 'scribe', 'transcription', 'notes']
  },
  {
    id: 'clinical_radiology_pacs',
    label: 'Cloud DICOM & PACS Viewer',
    shortLabel: 'PACS Viewer',
    category: 'CLINICAL',
    jewelTheme: 'sapphire',
    gradient: JEWEL_GRADIENTS.sapphire,
    icon: 'Layers',
    route: '/partner/radiology',
    badgeTelemetryKey: 'pending_radiology_reads',
    description: 'Zero-footprint web viewer for MRI, CT, X-Ray with AI heatmaps',
    tags: ['radiology', 'pacs', 'dicom', 'xray', 'mri']
  },
  {
    id: 'clinical_lab_requisitions',
    label: 'LIS Lab Investigation Orders',
    shortLabel: 'Lab Orders',
    category: 'CLINICAL',
    jewelTheme: 'sapphire',
    gradient: JEWEL_GRADIENTS.sapphire,
    icon: 'FlaskConical',
    route: '/partner/clinical-investigation',
    badgeTelemetryKey: 'pending_lab_signoffs',
    description: 'Direct requisitioning of biochemistry, hematology & microbiology tests',
    tags: ['lab', 'lis', 'pathology', 'blood_test', 'requisition']
  },
  {
    id: 'clinical_doctor_roster',
    label: 'Physician Duty Roster',
    shortLabel: 'Doctor Roster',
    category: 'CLINICAL',
    jewelTheme: 'sapphire',
    gradient: JEWEL_GRADIENTS.sapphire,
    icon: 'Calendar',
    route: '/partner/roster',
    description: 'OPD clinic timings, on-call schedules & leave management',
    tags: ['roster', 'schedule', 'doctor', 'shifts']
  },
  {
    id: 'clinical_telehealth_video',
    label: 'Encrypted Telehealth Room',
    shortLabel: 'Telehealth',
    category: 'CLINICAL',
    jewelTheme: 'cyan',
    gradient: JEWEL_GRADIENTS.cyan,
    icon: 'Video',
    route: '/partner/telemedicine',
    badgeTelemetryKey: 'active_telehealth_calls',
    description: 'WebRTC end-to-end encrypted video consult with E-Prescribe',
    tags: ['telehealth', 'video', 'remote', 'consultation']
  },
  {
    id: 'clinical_care_plans',
    label: 'Chronic Care Pathway Plans',
    shortLabel: 'Care Plans',
    category: 'CLINICAL',
    jewelTheme: 'sapphire',
    gradient: JEWEL_GRADIENTS.sapphire,
    icon: 'ClipboardList',
    route: '/partner/clinical/care-plans',
    description: 'Diabetes, hypertension & oncology clinical clinical protocol pathways',
    tags: ['care_plan', 'chronic', 'diabetes', 'pathway']
  },
  {
    id: 'clinical_immunization_tracker',
    label: 'Pediatric Immunization Registry',
    shortLabel: 'Vaccines',
    category: 'CLINICAL',
    jewelTheme: 'teal',
    gradient: JEWEL_GRADIENTS.teal,
    icon: 'ShieldCheck',
    route: '/partner/clinical/immunizations',
    description: 'National immunization schedule tracking & WhatsApp due reminders',
    tags: ['vaccine', 'pediatric', 'immunization', 'baby']
  },
  {
    id: 'clinical_referral_dispatch',
    label: 'Inter-Department Referral',
    shortLabel: 'Referrals',
    category: 'CLINICAL',
    jewelTheme: 'sapphire',
    gradient: JEWEL_GRADIENTS.sapphire,
    icon: 'Send',
    route: '/partner/clinical/referrals',
    description: 'Internal & external tertiary hospital referral dispatch console',
    tags: ['referral', 'doctor', 'transfer', 'consult']
  },
  {
    id: 'clinical_followup_alerts',
    label: 'Automated Recall & Follow-ups',
    shortLabel: 'Follow-ups',
    category: 'CLINICAL',
    jewelTheme: 'sapphire',
    gradient: JEWEL_GRADIENTS.sapphire,
    icon: 'BellRing',
    route: '/partner/clinical/followups',
    badgeTelemetryKey: 'pending_followups',
    description: 'Post-op & chronic patient WhatsApp recall alert manager',
    tags: ['followup', 'recall', 'whatsapp', 'alerts']
  },
  {
    id: 'clinical_mrd_records',
    label: 'Medical Records Department (MRD)',
    shortLabel: 'MRD Central',
    category: 'CLINICAL',
    jewelTheme: 'sapphire',
    gradient: JEWEL_GRADIENTS.sapphire,
    icon: 'Archive',
    route: '/partner/mrd',
    description: 'Physical file tracking, barcode archiving, and death audits',
    tags: ['mrd', 'archive', 'records', 'audit', 'icd10']
  },
  {
    id: 'clinical_clinical_copilot',
    label: 'CDSS Differential Diagnosis AI',
    shortLabel: 'AI Copilot',
    category: 'CLINICAL',
    jewelTheme: 'amethyst',
    gradient: JEWEL_GRADIENTS.amethyst,
    icon: 'Sparkles',
    route: '/partner/clinical/copilot',
    description: 'UpToDate-caliber clinical decision support for complex presentations',
    tags: ['cdss', 'ai', 'diagnosis', 'decision_support']
  },

  // ---------------- INPATIENT (IPD) & OT (25 actions) ----------------
  {
    id: 'ipd_bed_census',
    label: 'Real-time Ward & Bed Census',
    shortLabel: 'Bed Board',
    category: 'INPATIENT',
    jewelTheme: 'teal',
    gradient: JEWEL_GRADIENTS.teal,
    icon: 'Bed',
    route: '/partner/inpatient',
    badgeTelemetryKey: 'bed_occupancy_rate',
    description: 'Interactive visual bed matrix (Occupied, Clean, Vacant, Isolation)',
    defaultDockPriority: 2,
    tags: ['bed', 'census', 'ipd', 'ward', 'icu']
  },
  {
    id: 'ipd_admission_intake',
    label: 'Direct IPD Admission Intake',
    shortLabel: 'Admit Patient',
    category: 'INPATIENT',
    jewelTheme: 'teal',
    gradient: JEWEL_GRADIENTS.teal,
    icon: 'UserPlus',
    route: '/partner/inpatient/admissions',
    description: 'Financial clearance, advance receipt, and bed assignment wizard',
    tags: ['admit', 'admission', 'intake', 'ipd']
  },
  {
    id: 'ipd_mar_chart',
    label: 'Medication Administration (MAR)',
    shortLabel: 'MAR Chart',
    category: 'INPATIENT',
    jewelTheme: 'teal',
    gradient: JEWEL_GRADIENTS.teal,
    icon: 'CheckSquare',
    route: '/partner/inpatient/mar',
    badgeTelemetryKey: 'pending_drug_doses',
    description: '5-Rights barcode scan drug administration with nursing timestamp',
    tags: ['mar', 'nurse', 'medication', 'dose', 'inpatient']
  },
  {
    id: 'ipd_ot_scheduler',
    label: 'Operating Theatre Scheduling',
    shortLabel: 'OT Schedule',
    category: 'INPATIENT',
    jewelTheme: 'teal',
    gradient: JEWEL_GRADIENTS.teal,
    icon: 'Scissors',
    route: '/partner/operation-theatre',
    badgeTelemetryKey: 'active_surgeries',
    description: 'Multi-theater booking, anaesthesia clearance, and sterile staff roster',
    tags: ['ot', 'surgery', 'theater', 'operation', 'surgeon']
  },
  {
    id: 'ipd_who_safety_checklist',
    label: 'WHO Surgical Safety Checklist',
    shortLabel: 'WHO Checklist',
    category: 'INPATIENT',
    jewelTheme: 'emerald',
    gradient: JEWEL_GRADIENTS.emerald,
    icon: 'ClipboardCheck',
    route: '/partner/operation-theatre/safety-checklists',
    description: 'Sign-in, Time-out, and Sign-out mandatory sterile verification',
    tags: ['who', 'ot', 'safety', 'sponge_count', 'checklist']
  },
  {
    id: 'ipd_discharge_summary',
    label: 'Electronic Discharge Summary',
    shortLabel: 'Discharge',
    category: 'INPATIENT',
    jewelTheme: 'teal',
    gradient: JEWEL_GRADIENTS.teal,
    icon: 'LogOut',
    route: '/partner/inpatient/discharges',
    badgeTelemetryKey: 'pending_discharges',
    description: 'Automated course-in-hospital, medication reconciliation & advice',
    tags: ['discharge', 'summary', 'ipd', 'pharmacy_return']
  },
  {
    id: 'ipd_nursing_notes',
    label: 'Nursing Shift Handover Log',
    shortLabel: 'Nursing Log',
    category: 'INPATIENT',
    jewelTheme: 'teal',
    gradient: JEWEL_GRADIENTS.teal,
    icon: 'BookOpen',
    route: '/partner/inpatient/nursing-notes',
    description: 'ISBAR structured patient status transfer between shift teams',
    tags: ['nurse', 'handover', 'isbar', 'shift', 'notes']
  },
  {
    id: 'ipd_dietary_orders',
    label: 'Dietary Kitchen & Meal Orders',
    shortLabel: 'Dietary',
    category: 'INPATIENT',
    jewelTheme: 'amber',
    gradient: JEWEL_GRADIENTS.amber,
    icon: 'Utensils',
    route: '/partner/dietary',
    description: 'Diabetic, renal, salt-restricted & enteral nutrition kitchen dispatch',
    tags: ['diet', 'kitchen', 'food', 'nutrition', 'meals']
  },
  {
    id: 'ipd_biomedical_assets',
    label: 'Biomedical Equipment & PM Alerts',
    shortLabel: 'BioMed Assets',
    category: 'INPATIENT',
    jewelTheme: 'obsidian',
    gradient: JEWEL_GRADIENTS.obsidian,
    icon: 'Cpu',
    route: '/partner/asset-biomedical',
    badgeTelemetryKey: 'equipment_breakdown_count',
    description: 'Ventilator, defibrillator calibration logs and preventive maintenance',
    tags: ['biomedical', 'equipment', 'ventilator', 'maintenance']
  },
  {
    id: 'ipd_quality_infection',
    label: 'Hospital Infection Control (HICC)',
    shortLabel: 'Infection Watch',
    category: 'INPATIENT',
    jewelTheme: 'ruby',
    gradient: JEWEL_GRADIENTS.ruby,
    icon: 'Biohazard',
    route: '/partner/quality-infection',
    badgeTelemetryKey: 'hai_infection_alerts',
    description: 'CAUTI, CLABSI, VAP, and SSI surveillance registers for NABH audits',
    tags: ['infection', 'hicc', 'nabh', 'cauti', 'vap']
  },

  // ---------------- PHARMACY & INVENTORY (25 actions) ----------------
  {
    id: 'pharmacy_pos_checkout',
    label: 'Retail & Inpatient Pharmacy POS',
    shortLabel: 'Pharmacy POS',
    category: 'PHARMACY',
    jewelTheme: 'emerald',
    gradient: JEWEL_GRADIENTS.emerald,
    icon: 'Pill',
    route: '/partner/pharmacy',
    badgeTelemetryKey: 'pending_prescriptions_count',
    description: 'High-speed barcode dispensation linked to patient billing ledger',
    defaultDockPriority: 3,
    tags: ['pharmacy', 'pos', 'medicine', 'dispense', 'drugs']
  },
  {
    id: 'pharmacy_schedule_h1',
    label: 'Schedule H / H1 Narcotic Register',
    shortLabel: 'Schedule H1',
    category: 'PHARMACY',
    jewelTheme: 'emerald',
    gradient: JEWEL_GRADIENTS.emerald,
    icon: 'FileSpreadsheet',
    route: '/partner/pharmacy/schedule-h1',
    badgeTelemetryKey: 'schedule_h1_today_count',
    description: 'Statutory government compliance log for antibiotics & restricted drugs',
    tags: ['h1', 'schedule_h', 'narcotics', 'compliance', 'drugs']
  },
  {
    id: 'pharmacy_stock_expiry',
    label: 'Near-Expiry Stock Liquidation',
    shortLabel: 'Expiry Radar',
    category: 'PHARMACY',
    jewelTheme: 'amber',
    gradient: JEWEL_GRADIENTS.amber,
    icon: 'Clock',
    route: '/partner/pharmacy/expiry-radar',
    badgeTelemetryKey: 'near_expiry_batches',
    description: '30/60/90-day expiry radar with automated supplier return debit notes',
    tags: ['expiry', 'batches', 'stock', 'debit_note']
  },
  {
    id: 'pharmacy_blood_bank',
    label: 'Blood Bank Sentinel & Cold Chain',
    shortLabel: 'Blood Bank',
    category: 'PHARMACY',
    jewelTheme: 'ruby',
    gradient: JEWEL_GRADIENTS.ruby,
    icon: 'Droplet',
    route: '/partner/blood-bank',
    badgeTelemetryKey: 'critical_blood_shortages',
    description: 'PRBC, FFP, Platelets inventory with crossmatch reservation locks',
    tags: ['blood', 'prbc', 'platelet', 'donor', 'crossmatch']
  },
  {
    id: 'pharmacy_procurement_po',
    label: 'Purchase Orders & Supplier PO',
    shortLabel: 'Procurement',
    category: 'PHARMACY',
    jewelTheme: 'emerald',
    gradient: JEWEL_GRADIENTS.emerald,
    icon: 'ShoppingCart',
    route: '/partner/procurement',
    description: 'Automated re-order generation at safety thresholds with GST matching',
    tags: ['purchase', 'vendor', 'po', 'stock', 'orders']
  },
  {
    id: 'pharmacy_generic_arbitrage',
    label: 'Generic Margin Optimizer AI',
    shortLabel: 'Generic AI',
    category: 'PHARMACY',
    jewelTheme: 'emerald',
    gradient: JEWEL_GRADIENTS.emerald,
    icon: 'TrendingUp',
    route: '/partner/generic-arbitrage',
    description: 'Recommends equal-salt branded generic equivalents to maximize margin',
    tags: ['generic', 'margin', 'arbitrage', 'salts']
  },

  // ---------------- BILLING & TPA REVENUE (25 actions) ----------------
  {
    id: 'billing_cashier_desk',
    label: 'Cashier Counter & Settlement',
    shortLabel: 'Cashier Desk',
    category: 'BILLING',
    jewelTheme: 'amber',
    gradient: JEWEL_GRADIENTS.amber,
    icon: 'CreditCard',
    route: '/partner/billing',
    badgeTelemetryKey: 'cashier_shift_balance',
    description: 'Unified counter collection (Cash, UPI, Card, NetBanking, Advance)',
    defaultDockPriority: 4,
    tags: ['billing', 'cashier', 'payment', 'upi', 'settlement']
  },
  {
    id: 'billing_invoice_history',
    label: 'All Tax Invoices & Receipts',
    shortLabel: 'Invoices',
    category: 'BILLING',
    jewelTheme: 'amber',
    gradient: JEWEL_GRADIENTS.amber,
    icon: 'Receipt',
    route: '/partner/billing/invoices',
    description: 'GST-compliant itemized patient billing with IRN e-invoicing',
    tags: ['invoice', 'tax', 'receipt', 'gst']
  },
  {
    id: 'billing_tpa_insurance',
    label: 'NHCX Insurance Pre-Auth & Claims',
    shortLabel: 'TPA Claims',
    category: 'BILLING',
    jewelTheme: 'amber',
    gradient: JEWEL_GRADIENTS.amber,
    icon: 'ShieldAlert',
    route: '/partner/insurance',
    badgeTelemetryKey: 'pending_tpa_approvals',
    description: 'Direct national health claims exchange cashless pre-authorization',
    tags: ['insurance', 'tpa', 'nhcx', 'cashless', 'preauth']
  },
  {
    id: 'billing_pmjay_ayushman',
    label: 'PMJAY Ayushman Bharat Desk',
    shortLabel: 'PMJAY Desk',
    category: 'BILLING',
    jewelTheme: 'amber',
    gradient: JEWEL_GRADIENTS.amber,
    icon: 'Award',
    route: '/partner/pmjay',
    description: 'Golden card verification, TMS package booking, and claim submission',
    tags: ['pmjay', 'ayushman', 'golden_card', 'tms', 'scheme']
  },
  {
    id: 'billing_service_catalog',
    label: 'Master Service Catalog & Tariffs',
    shortLabel: 'Tariff Master',
    category: 'BILLING',
    jewelTheme: 'amber',
    gradient: JEWEL_GRADIENTS.amber,
    icon: 'ListFilter',
    route: '/partner/billing/catalog',
    description: 'Procedure rates, bed tariffs, and corporate price lists',
    tags: ['tariff', 'pricing', 'catalog', 'services']
  },
  {
    id: 'billing_blind_drop',
    label: 'Cashier Safe Blind Drop Log',
    shortLabel: 'Safe Drop',
    category: 'BILLING',
    jewelTheme: 'amber',
    gradient: JEWEL_GRADIENTS.amber,
    icon: 'Lock',
    route: '/partner/billing/blind-drop',
    description: 'Mid-shift safe drops with dual-custody verification slips',
    tags: ['safe', 'cash', 'drop', 'cashier', 'audit']
  },

  // ---------------- EMERGENCY (ER) (25 actions) ----------------
  {
    id: 'emergency_manchester_triage',
    label: 'Manchester ER Triage Console',
    shortLabel: 'Emergency ER',
    category: 'EMERGENCY',
    jewelTheme: 'ruby',
    gradient: JEWEL_GRADIENTS.ruby,
    icon: 'HeartPulse',
    route: '/partner/emergency',
    badgeTelemetryKey: 'critical_emergency_cases',
    description: '5-Level color-coded urgency intake (Red, Orange, Yellow, Green, Blue)',
    defaultDockPriority: 5,
    tags: ['emergency', 'triage', 'red_alert', 'trauma', 'er']
  },
  {
    id: 'emergency_code_red',
    label: 'Hospital-Wide Code Blue / Red',
    shortLabel: 'Code Blue',
    category: 'EMERGENCY',
    jewelTheme: 'ruby',
    gradient: JEWEL_GRADIENTS.ruby,
    icon: 'Flame',
    route: '/partner/emergency/code-broadcast',
    badgeTelemetryKey: 'active_emergency_codes',
    description: 'Instant VoIP & speaker panic broadcast to resuscitation teams',
    tags: ['code_blue', 'code_red', 'panic', 'broadcast', 'resuscitation']
  },
  {
    id: 'emergency_ambulance_fleet',
    label: 'GPS Ambulance Fleet Dispatch',
    shortLabel: 'Ambulance',
    category: 'EMERGENCY',
    jewelTheme: 'ruby',
    gradient: JEWEL_GRADIENTS.ruby,
    icon: 'Navigation',
    route: '/partner/emergency/ambulances',
    badgeTelemetryKey: 'ambulances_en_route',
    description: 'Live ALS/BLS vehicle telemetry with onboard paramedic vitals feed',
    tags: ['ambulance', 'gps', 'paramedic', 'als', 'dispatch']
  },
  {
    id: 'emergency_crash_cart',
    label: 'Crash Cart Inspection & Seals',
    shortLabel: 'Crash Cart',
    category: 'EMERGENCY',
    jewelTheme: 'ruby',
    gradient: JEWEL_GRADIENTS.ruby,
    icon: 'Shield',
    route: '/partner/emergency/crash-carts',
    description: 'Daily barcode tag verification of defibrillators, atropine & airway kits',
    tags: ['crash_cart', 'defibrillator', 'emergency', 'inspection']
  },
  {
    id: 'emergency_mlc_register',
    label: 'Medico-Legal Cases (MLC) Log',
    shortLabel: 'MLC Register',
    category: 'EMERGENCY',
    jewelTheme: 'ruby',
    gradient: JEWEL_GRADIENTS.ruby,
    icon: 'FileWarning',
    route: '/partner/emergency/mlc',
    description: 'Police intimation slips, wound certificates, and custody custody logs',
    tags: ['mlc', 'police', 'legal', 'injury', 'accident']
  },

  // ---------------- EXECUTIVE & GODMODE (25 actions) ----------------
  {
    id: 'exec_revenue_radar',
    label: 'Real-time Net Revenue Radar',
    shortLabel: 'Revenue Radar',
    category: 'EXECUTIVE',
    jewelTheme: 'obsidian',
    gradient: JEWEL_GRADIENTS.obsidian,
    icon: 'TrendingUp',
    route: '/company/godmode/revenue',
    badgeTelemetryKey: 'today_net_revenue',
    description: 'Live cash-inflow, pending discharge bills, and collection velocity',
    tags: ['executive', 'revenue', 'ebitda', 'founder', 'finance']
  },
  {
    id: 'exec_steganography_forensics',
    label: 'Invisible Steganography Leak Trap',
    shortLabel: 'Stego Trap',
    category: 'EXECUTIVE',
    jewelTheme: 'obsidian',
    gradient: JEWEL_GRADIENTS.obsidian,
    icon: 'Fingerprint',
    route: '/company/godmode/steganography',
    description: 'Sub-perceptual micro-dot patterns identifying mobile-camera leakers',
    tags: ['security', 'steganography', 'leak', 'forensics', 'anti_piracy']
  },
  {
    id: 'exec_honeytoken_deception',
    label: 'Honeytoken Deception Matrix',
    shortLabel: 'Honeytokens',
    category: 'EXECUTIVE',
    jewelTheme: 'obsidian',
    gradient: JEWEL_GRADIENTS.obsidian,
    icon: 'Key',
    route: '/company/godmode/honeytokens',
    badgeTelemetryKey: 'honeytoken_trips',
    description: 'Decoy VIP records that automatically freeze rogue insider accounts',
    tags: ['honeytoken', 'deception', 'insider_threat', 'security']
  },
  {
    id: 'exec_cartel_radar',
    label: 'Doctor Cartel & Poaching Shield',
    shortLabel: 'Cartel Radar',
    category: 'EXECUTIVE',
    jewelTheme: 'obsidian',
    gradient: JEWEL_GRADIENTS.obsidian,
    icon: 'Radar',
    route: '/company/godmode/cartel-radar',
    description: 'Cluster graph detecting doctor referral drop-offs to competitor clinics',
    tags: ['cartel', 'poaching', 'referrals', 'doctor_shield']
  },
  {
    id: 'exec_self_heal_daemon',
    label: 'Financial Self-Heal Daemon',
    shortLabel: 'Self-Heal',
    category: 'EXECUTIVE',
    jewelTheme: 'obsidian',
    gradient: JEWEL_GRADIENTS.obsidian,
    icon: 'ShieldAlert',
    route: '/company/godmode/self-heal',
    badgeTelemetryKey: 'clawback_rescued_amount',
    description: 'Autonomous TPA short-settlement appeal generator and clawback blocker',
    tags: ['tpa', 'clawback', 'self_heal', 'settlement', 'appeals']
  },
  {
    id: 'exec_3d_war_room',
    label: 'Hospital 3D Digital Twin War Room',
    shortLabel: '3D War Room',
    category: 'EXECUTIVE',
    jewelTheme: 'obsidian',
    gradient: JEWEL_GRADIENTS.obsidian,
    icon: 'Box',
    route: '/company/godmode/war-room',
    description: '3D spatial visualization of multi-floor bed, OT, and queue density',
    tags: ['war_room', '3d', 'digital_twin', 'hospital', 'spatial']
  }
];

export const ROLE_PRESET_CONFIGURATIONS = {
  CLINICAL_DEFAULT: {
    id: 'CLINICAL_DEFAULT',
    name: 'Doctor / OPD Rush',
    dockIds: ['clinical_opd_queue', 'clinical_rx_pad', 'clinical_patient_360', 'clinical_radiology_pacs', 'clinical_ai_scribe'],
    headerIds: ['clinical_opd_queue', 'emergency_code_red'],
  },
  INPATIENT_DEFAULT: {
    id: 'INPATIENT_DEFAULT',
    name: 'Ward & Nursing Rounds',
    dockIds: ['ipd_bed_census', 'ipd_admission_intake', 'ipd_mar_chart', 'ipd_nursing_notes', 'ipd_discharge_summary'],
    headerIds: ['clinical_vitals_telemetry', 'emergency_code_red'],
  },
  CASHIER_DEFAULT: {
    id: 'CASHIER_DEFAULT',
    name: 'Billing & Cashier Desk',
    dockIds: ['billing_cashier_desk', 'billing_invoice_history', 'billing_tpa_insurance', 'billing_blind_drop', 'billing_service_catalog'],
    headerIds: ['billing_cashier_desk', 'billing_tpa_insurance'],
  },
  FOUNDER_DEFAULT: {
    id: 'FOUNDER_DEFAULT',
    name: 'Executive & Godmode Control',
    dockIds: ['exec_revenue_radar', 'exec_steganography_forensics', 'exec_honeytoken_deception', 'exec_cartel_radar', 'exec_self_heal_daemon'],
    headerIds: ['exec_revenue_radar', 'exec_3d_war_room'],
  }
};
