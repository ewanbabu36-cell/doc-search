import React, { useState } from 'react';
import { Badge, Button } from '@docsearch/ui-kit';
import { getUrlForModule } from '../../utils/urlRouter.js';

export type OrganizationWorkspaceType =
  | 'HOSPITAL'
  | 'CLINIC'
  | 'PHARMACY'
  | 'PATHOLOGY'
  | 'DIAGNOSTIC_CENTRE'
  | 'ENTERPRISE_COMMAND';

export interface HospitalStaffUser {
  id: string;
  category: 'HEALTHCARE' | 'COMPANY_HQ';
  name: string;
  email?: string;
  password?: string;
  role: string;
  roleTitle: string;
  department: string;
  tenantName: string;
  organizationType: OrganizationWorkspaceType;
  allowedWorkspaces: OrganizationWorkspaceType[];
  defaultModule: string;
  planTier: string;
  planExpiryDate?: string;
  accessibleFeatures: string[];
  restrictedFeatures: string[];
}

export const ALL_SYSTEM_ROLES: HospitalStaffUser[] = [
  // --- TATA PATHOLOGY LAB (STANDALONE) ---
  {
    id: 'ROLE-TATA-LAB',
    category: 'HEALTHCARE',
    name: 'Dr. R. K. Tata, MD Path',
    email: 'tata@doc.com',
    password: 'TataPass123!',
    role: 'PATHOLOGIST',
    roleTitle: 'Tata Pathology Lab (Head & Pathologist)',
    department: 'Pathology & Diagnostic Laboratory',
    tenantName: 'Tata Pathology Lab (Standalone Unit)',
    organizationType: 'PATHOLOGY',
    allowedWorkspaces: ['PATHOLOGY'],
    defaultModule: 'clinical-investigation',
    planTier: 'Independent Pathology LIMS Pro',
    accessibleFeatures: ['Phlebotomy Barcode Intake', 'Result Verification', 'Direct NABL Print', 'WhatsApp PDF Delivery', 'Daily Cash Accounts'],
    restrictedFeatures: ['Hospital IPD Wards', 'OT Surgery Logs']
  },

  // --- HEALTHCARE PARTNER ROLES (42 Comprehensive Profiles) ---
  // 1. HOSPITAL DIRECTORS & CLINICAL GOVERNANCE
  {
    id: 'ROLE-HOSP-DIR',
    category: 'HEALTHCARE',
    name: 'Dr. Priya Nair, MS, MHA',
    email: 'director.priya@docsearch.health',
    password: 'DirectorPass123!',
    role: 'HOSPITAL_DIRECTOR',
    roleTitle: 'Medical Superintendent & Director',
    department: 'Hospital Administration & Governance',
    tenantName: 'Apex Metropolitan Hospital (250 Beds)',
    organizationType: 'HOSPITAL',
    allowedWorkspaces: ['HOSPITAL', 'CLINIC', 'PHARMACY', 'PATHOLOGY', 'DIAGNOSTIC_CENTRE', 'ENTERPRISE_COMMAND'],
    defaultModule: 'executive-command-center',
    planTier: 'Multi-Specialty Hospital Suite',
    accessibleFeatures: ['Command Wall', 'Bed Capacity', 'OT Efficiency', 'Incident Control', 'Full Hospital HIS'],
    restrictedFeatures: ['None (Full Hospital Scope)']
  },
  {
    id: 'ROLE-CMO',
    category: 'HEALTHCARE',
    name: 'Dr. Vikramaditya Rathore, MD',
    email: 'cmo.vikram@docsearch.health',
    password: 'CmoPass123!',
    role: 'CHIEF_MEDICAL_OFFICER',
    roleTitle: 'Chief Medical Officer & Clinical Auditor',
    department: 'Clinical Quality & Medical Affairs',
    tenantName: 'Apex Metropolitan Hospital',
    organizationType: 'HOSPITAL',
    allowedWorkspaces: ['HOSPITAL', 'CLINIC'],
    defaultModule: 'executive-command-center',
    planTier: 'Multi-Specialty Hospital Suite',
    accessibleFeatures: ['Clinical Governance', 'Mortality & Morbidity Audits', 'NABH Protocols', 'Doctor Credentialing'],
    restrictedFeatures: ['Live Cashier Collection']
  },

  // 2. SURGICAL & SPECIALIST MEDICAL CONSULTANTS
  {
    id: 'ROLE-SURGEON',
    category: 'HEALTHCARE',
    name: 'Dr. Sameer Kulkarni, MS, MCh',
    email: 'surgeon.sameer@docsearch.health',
    password: 'SurgeonPass123!',
    role: 'SURGEON',
    roleTitle: 'Chief Laparoscopic & General Surgeon',
    department: 'Operation Theatres & General Surgery',
    tenantName: 'Apex Metropolitan Hospital',
    organizationType: 'HOSPITAL',
    allowedWorkspaces: ['HOSPITAL'],
    defaultModule: 'operation-theatre-management',
    planTier: 'Hospital Surgical Suite',
    accessibleFeatures: ['OT Rostering', 'Pre-Anesthesia Check (PAC)', 'Surgical Notes', 'Intra-Op Vitals', 'Crash Cart'],
    restrictedFeatures: ['Pharmacy Inwarding', 'Hospital Finance Billing']
  },
  {
    id: 'ROLE-CARDIOLOGIST',
    category: 'HEALTHCARE',
    name: 'Dr. Ananya Sen, MD, DM Cardio',
    email: 'cardio.ananya@docsearch.health',
    password: 'CardioPass123!',
    role: 'CARDIOLOGIST',
    roleTitle: 'Interventional Cardiologist & Cath Lab Lead',
    department: 'Cardiology & Intensive Coronary Care (ICCU)',
    tenantName: 'Apex Heart & Vascular Super Specialty',
    organizationType: 'HOSPITAL',
    allowedWorkspaces: ['HOSPITAL', 'CLINIC'],
    defaultModule: 'clinical-consultation',
    planTier: 'Cardiac Specialty Suite',
    accessibleFeatures: ['ECG/Echo DICOM Viewer', 'Cath Lab Roster', 'Troponin Critical Alerts', 'Cardiac EMR Scribe'],
    restrictedFeatures: ['Pharmacy POS Billing']
  },
  {
    id: 'ROLE-PEDIATRICIAN',
    category: 'HEALTHCARE',
    name: 'Dr. Rohit Malhotra, MD Pediatrics',
    email: 'pediatric.rohit@docsearch.health',
    password: 'PediatricPass123!',
    role: 'PEDIATRICIAN',
    roleTitle: 'Head of Pediatrics & Neonatology (NICU)',
    department: 'Pediatrics, Child Health & NICU',
    tenantName: 'Apex Mother & Child Health Centre',
    organizationType: 'HOSPITAL',
    allowedWorkspaces: ['HOSPITAL', 'CLINIC'],
    defaultModule: 'clinical-consultation',
    planTier: 'Mother & Child Care Suite',
    accessibleFeatures: ['WHO Growth Charts', 'National Immunization Scheduler', 'Pediatric Dosage Calculator', 'NICU Bed Matrix'],
    restrictedFeatures: ['Adult Chemotherapy']
  },
  {
    id: 'ROLE-GYNECOLOGIST',
    category: 'HEALTHCARE',
    name: 'Dr. Sunita Deshmukh, MD, DGO',
    email: 'gynae.sunita@docsearch.health',
    password: 'GynaePass123!',
    role: 'GYNECOLOGIST',
    roleTitle: 'Senior Obstetrician & Gynecologist',
    department: 'Labour Room, Maternity & Gynaecology',
    tenantName: 'Apex Mother & Child Health Centre',
    organizationType: 'HOSPITAL',
    allowedWorkspaces: ['HOSPITAL', 'CLINIC'],
    defaultModule: 'clinical-consultation',
    planTier: 'Mother & Child Care Suite',
    accessibleFeatures: ['Partogram Delivery Chart', 'Antenatal Care (ANC) Tracker', 'Ultrasound Fetal Doppler', 'Post-Op Rounds'],
    restrictedFeatures: ['Cashier Settlement']
  },
  {
    id: 'ROLE-ORTHOPEDIC',
    category: 'HEALTHCARE',
    name: 'Dr. Harish Patel, MS Ortho',
    email: 'ortho.harish@docsearch.health',
    password: 'OrthoPass123!',
    role: 'ORTHOPEDIC_SURGEON',
    roleTitle: 'Joint Replacement & Trauma Surgeon',
    department: 'Orthopedics & Spine Surgery',
    tenantName: 'Apex Metropolitan Hospital',
    organizationType: 'HOSPITAL',
    allowedWorkspaces: ['HOSPITAL', 'CLINIC'],
    defaultModule: 'operation-theatre-management',
    planTier: 'Orthopedic Surgical Suite',
    accessibleFeatures: ['Implant Master Register', 'Pre-Op X-Ray Templating', 'Physiotherapy Referral Bridge', 'Post-Op Mobility Score'],
    restrictedFeatures: ['Pharmacy Inwarding']
  },
  {
    id: 'ROLE-NEPHROLOGIST',
    category: 'HEALTHCARE',
    name: 'Dr. Arvind Shenoy, MD, DM Nephro',
    email: 'nephro.arvind@docsearch.health',
    password: 'NephroPass123!',
    role: 'NEPHROLOGIST',
    roleTitle: 'Consultant Nephrologist & Renal Lead',
    department: 'Nephrology & Hemodialysis Unit',
    tenantName: 'Apex Renal & Dialysis Care Hub',
    organizationType: 'HOSPITAL',
    allowedWorkspaces: ['HOSPITAL', 'CLINIC'],
    defaultModule: 'inpatient-management',
    planTier: 'Nephrology & Dialysis Suite',
    accessibleFeatures: ['Dialysis Station Monitoring', 'Kt/V Urea Clearance', 'Dry Weight Profiler', 'Arteriovenous Fistula Care'],
    restrictedFeatures: ['OT Laparoscopy Schedule']
  },
  {
    id: 'ROLE-ONCOLOGIST',
    category: 'HEALTHCARE',
    name: 'Dr. Tanvi Varma, MD, DM Oncology',
    email: 'onco.tanvi@docsearch.health',
    password: 'OncoPass123!',
    role: 'ONCOLOGIST',
    roleTitle: 'Chief Medical Oncologist & Tumour Lead',
    department: 'Day Care Chemotherapy & Oncology',
    tenantName: 'Apex Cancer Care & Research Institute',
    organizationType: 'HOSPITAL',
    allowedWorkspaces: ['HOSPITAL', 'CLINIC'],
    defaultModule: 'clinical-consultation',
    planTier: 'Comprehensive Oncology Suite',
    accessibleFeatures: ['Chemotherapy Regimen Builder', 'BSA Dose Calculator', 'Tumour Board Multidisciplinary EMR', 'Palliative Protocols'],
    restrictedFeatures: ['General OPD Queue']
  },
  {
    id: 'ROLE-NEUROLOGIST',
    category: 'HEALTHCARE',
    name: 'Dr. Siddharth Kaul, DM Neuro',
    email: 'neuro.siddharth@docsearch.health',
    password: 'NeuroPass123!',
    role: 'NEUROLOGIST',
    roleTitle: 'Consultant Neurologist & Stroke Lead',
    department: 'Neurology & Comprehensive Stroke Unit',
    tenantName: 'Apex Brain & Spine Centre',
    organizationType: 'HOSPITAL',
    allowedWorkspaces: ['HOSPITAL', 'CLINIC'],
    defaultModule: 'clinical-consultation',
    planTier: 'Neurosciences Suite',
    accessibleFeatures: ['NIHSS Stroke Scale', 'EEG/EMG Diagnostic Portal', 'Thrombolysis Time-to-Needle Clock', 'GCS Scoring'],
    restrictedFeatures: ['Retail Chemist Inventory']
  },
  {
    id: 'ROLE-OPHTHALMOLOGIST',
    category: 'HEALTHCARE',
    name: 'Dr. Radhika Iyer, MS Ophthalmology',
    email: 'eye.radhika@docsearch.health',
    password: 'EyePass123!',
    role: 'OPHTHALMOLOGIST',
    roleTitle: 'Senior Eye Surgeon & Cataract Specialist',
    department: 'Ophthalmology & Refractive Surgery',
    tenantName: 'Apex Vision & Eye Laser Centre',
    organizationType: 'CLINIC',
    allowedWorkspaces: ['CLINIC', 'HOSPITAL'],
    defaultModule: 'clinical-consultation',
    planTier: 'Eye & Ophthalmology Care Suite',
    accessibleFeatures: ['Slit Lamp Digital Capture', 'Snellen Auto-Refraction', 'IOL Power Biometry', 'Cataract Package Billing'],
    restrictedFeatures: ['ICU Bed Management']
  },
  {
    id: 'ROLE-DENTIST',
    category: 'HEALTHCARE',
    name: 'Dr. Karan Grover, MDS',
    email: 'dental.karan@docsearch.health',
    password: 'DentalPass123!',
    role: 'DENTIST',
    roleTitle: 'Chief Dental Surgeon & Orthodontist',
    department: 'Dental Surgery & Maxillofacial Care',
    tenantName: 'Apex 32 Smiles Dental Clinic',
    organizationType: 'CLINIC',
    allowedWorkspaces: ['CLINIC'],
    defaultModule: 'clinical-consultation',
    planTier: 'Dental Clinic Pro Suite',
    accessibleFeatures: ['Odontogram 32-Tooth Chart', 'Intraoral X-Ray Capture', 'Dental Chair Time Rostering', 'Procedure Step Pricing'],
    restrictedFeatures: ['General Surgery OT']
  },
  {
    id: 'ROLE-AYUSH',
    category: 'HEALTHCARE',
    name: 'Dr. Acharya Shrinivas, BAMS, MD Ayur',
    email: 'ayush.shrinivas@docsearch.health',
    password: 'AyushPass123!',
    role: 'AYURVEDIC_VAIDYA',
    roleTitle: 'Senior Ayurvedic Vaidya & Panchakarma Acharya',
    department: 'Ayush, Panchakarma & Holistic Wellness',
    tenantName: 'AyurVeda Wellness & Rejuvenation Centre',
    organizationType: 'CLINIC',
    allowedWorkspaces: ['CLINIC'],
    defaultModule: 'clinical-consultation',
    planTier: 'Ayush & Panchakarma Suite',
    accessibleFeatures: ['Nadi Pariksha & Prakriti Assessment', 'Panchakarma Therapy Scheduling', 'Classical Herbal Formulations', 'Dietary Pathya-Apathya'],
    restrictedFeatures: ['Allopathic Schedule H Drugs']
  },
  {
    id: 'ROLE-EMERGENCY-PHYSICIAN',
    category: 'HEALTHCARE',
    name: 'Dr. Neeraj Chopra, MD Emergency',
    email: 'er.neeraj@docsearch.health',
    password: 'ErPass123!',
    role: 'EMERGENCY_PHYSICIAN',
    roleTitle: 'Emergency Department (ED) Consultant',
    department: 'Emergency & Acute Trauma Care',
    tenantName: 'Apex Metropolitan Hospital',
    organizationType: 'HOSPITAL',
    allowedWorkspaces: ['HOSPITAL'],
    defaultModule: 'emergency-trauma',
    planTier: 'Emergency & Trauma Care Suite',
    accessibleFeatures: ['Red/Yellow/Green Triage Priority', 'Code Blue & STEMI Activations', 'Poisoning/Toxicology Protocols', 'Immediate ER Bed Allotment'],
    restrictedFeatures: ['Outpatient Telemedicine']
  },
  {
    id: 'ROLE-PULMONOLOGIST',
    category: 'HEALTHCARE',
    name: 'Dr. Meera Nambiar, MD Pulmo',
    email: 'chest.meera@docsearch.health',
    password: 'PulmoPass123!',
    role: 'PULMONOLOGIST',
    roleTitle: 'Consultant Pulmonologist & Sleep Medicine Lead',
    department: 'Pulmonology, Respiratory & Sleep Lab',
    tenantName: 'Apex Chest & Allergy Institute',
    organizationType: 'HOSPITAL',
    allowedWorkspaces: ['HOSPITAL', 'CLINIC'],
    defaultModule: 'clinical-consultation',
    planTier: 'Pulmonology & Respiratory Suite',
    accessibleFeatures: ['Spirometry PFT Reports', 'Sleep Apnea Polysomnography', 'Oxygen Saturation Trend', 'Nebulization Rostering'],
    restrictedFeatures: ['Orthopedic Implants']
  },
  {
    id: 'ROLE-PSYCHIATRIST',
    category: 'HEALTHCARE',
    name: 'Dr. Farhan Qureshi, MD Psychiatry',
    email: 'mental.farhan@docsearch.health',
    password: 'PsychoPass123!',
    role: 'PSYCHIATRIST',
    roleTitle: 'Consultant Psychiatrist & De-addiction Lead',
    department: 'Psychiatry & Behavioral Health',
    tenantName: 'Apex Mind Care Clinic',
    organizationType: 'CLINIC',
    allowedWorkspaces: ['CLINIC'],
    defaultModule: 'clinical-consultation',
    planTier: 'Behavioral & Mind Health Suite',
    accessibleFeatures: ['Masked Psychiatric Privacy Vault', 'DSM-5 / ICD-10 Diagnostic Tools', 'Psychotherapy Counseling Logs', 'Controlled Substance Rx Tracker'],
    restrictedFeatures: ['General Staff Clinical View (Encrypted)']
  },
  {
    id: 'ROLE-DERMATOLOGIST',
    category: 'HEALTHCARE',
    name: 'Dr. Tanya Singhania, MD DVL',
    email: 'derma.tanya@docsearch.health',
    password: 'DermaPass123!',
    role: 'DERMATOLOGIST',
    roleTitle: 'Consultant Dermatologist & Cosmetologist',
    department: 'Dermatology, Trichology & Laser Surgery',
    tenantName: 'Apex Skin & Laser Polyclinic',
    organizationType: 'CLINIC',
    allowedWorkspaces: ['CLINIC'],
    defaultModule: 'clinical-consultation',
    planTier: 'Dermatology & Aesthetics Suite',
    accessibleFeatures: ['High-Res Dermatoscope Capture', 'Cosmetic Procedure Packages', 'Acne & Psoriasis Scoring', 'Laser Session Scheduling'],
    restrictedFeatures: ['Inpatient Bed Management']
  },
  {
    id: 'ROLE-CLINIC-DOC',
    category: 'HEALTHCARE',
    name: 'Dr. Rajesh Sharma, MD',
    email: 'doctor.rajesh@docsearch.health',
    password: 'DoctorPass123!',
    role: 'CLINIC_DOCTOR',
    roleTitle: 'Consultant Physician & Clinic Head',
    department: 'Outpatient Clinic & Cardiology',
    tenantName: 'Sharma Heart & Child Care Clinic',
    organizationType: 'CLINIC',
    allowedWorkspaces: ['CLINIC'],
    defaultModule: 'clinical-consultation',
    planTier: 'Solo Clinic Pro',
    accessibleFeatures: ['Specialty EMR', 'Ambient AI Voice Scribe', 'Prescription Pad', 'Jan Aushadhi PMBJP', 'Queue Triage'],
    restrictedFeatures: ['IPD Bed Census', 'OT Surgery Logs', 'TPA Claim Approval']
  },

  // 3. NURSING & ALLIED HEALTHCARE PROFESSIONALS
  {
    id: 'ROLE-NURSE',
    category: 'HEALTHCARE',
    name: 'Sister Sunita Verma, RN',
    email: 'nurse.sunita@docsearch.health',
    password: 'NursePass123!',
    role: 'ICU_NURSE',
    roleTitle: 'ICU & Ward Nursing In-Charge',
    department: 'Inpatient & Critical Care (ICU)',
    tenantName: 'Apex Metropolitan Hospital',
    organizationType: 'HOSPITAL',
    allowedWorkspaces: ['HOSPITAL'],
    defaultModule: 'inpatient-management',
    planTier: 'Hospital Inpatient Suite',
    accessibleFeatures: ['IPD ADT Bed Matrix', 'Nursing Flowsheets', 'Daily Vitals Tracking', 'Medication Administration', 'Dietary Sync'],
    restrictedFeatures: ['Doctor Prescription Sign-off', 'Cashier POS Billing']
  },
  {
    id: 'ROLE-TRIAGE-NURSE',
    category: 'HEALTHCARE',
    name: 'Sister Mary Joseph, GNM',
    email: 'triage.mary@docsearch.health',
    password: 'TriagePass123!',
    role: 'TRIAGE_NURSE',
    roleTitle: 'Emergency Room Triage In-Charge',
    department: 'Emergency & Rapid Triage',
    tenantName: 'Apex Metropolitan Hospital',
    organizationType: 'HOSPITAL',
    allowedWorkspaces: ['HOSPITAL'],
    defaultModule: 'emergency-trauma',
    planTier: 'Emergency & Trauma Care Suite',
    accessibleFeatures: ['Rapid Triage Assessment', 'Vital Breach Alerts', 'Token Priority Escalation', 'Stretcher/Wheelchair Allocation'],
    restrictedFeatures: ['Doctor Diagnosis Notes']
  },
  {
    id: 'ROLE-OT-SCRUB',
    category: 'HEALTHCARE',
    name: 'Brother Alex Mathew, BSc Nursing',
    email: 'ot.alex@docsearch.health',
    password: 'OtPass123!',
    role: 'OT_SCRUB_NURSE',
    roleTitle: 'Senior OT Scrub & Sterile Count Lead',
    department: 'Operation Theatres (OT)',
    tenantName: 'Apex Metropolitan Hospital',
    organizationType: 'HOSPITAL',
    allowedWorkspaces: ['HOSPITAL'],
    defaultModule: 'operation-theatre-management',
    planTier: 'Hospital Surgical Suite',
    accessibleFeatures: ['Surgical Instrument Checklist', 'Swab & Gauge Count Counter', 'WHO Surgical Safety Checklist', 'Sterile CSSD Traceability'],
    restrictedFeatures: ['Billing Collection']
  },
  {
    id: 'ROLE-DIALYSIS-TECH',
    category: 'HEALTHCARE',
    name: 'Rajesh Namboodiri, CHT',
    email: 'dialysis.rajesh@docsearch.health',
    password: 'DialysisPass123!',
    role: 'DIALYSIS_TECHNICIAN',
    roleTitle: 'Chief Hemodialysis Technician',
    department: 'Hemodialysis Unit',
    tenantName: 'Apex Renal & Dialysis Care Hub',
    organizationType: 'HOSPITAL',
    allowedWorkspaces: ['HOSPITAL'],
    defaultModule: 'inpatient-management',
    planTier: 'Nephrology & Dialysis Suite',
    accessibleFeatures: ['Dialysis Machine Priming', 'Heparin Infusion Log', 'Pre/Post Weight Calculator', 'Dialyzer Reuse Barcoding'],
    restrictedFeatures: ['Doctor Drug Prescription']
  },
  {
    id: 'ROLE-PHLEBOTOMIST',
    category: 'HEALTHCARE',
    name: 'Deepak Yadav, DMLT',
    email: 'phlebo.deepak@docsearch.health',
    password: 'PhleboPass123!',
    role: 'PHLEBOTOMIST',
    roleTitle: 'Senior Phlebotomist & Sample Intake Lead',
    department: 'Phlebotomy, Specimen Collection & Home Visits',
    tenantName: 'BioCore Diagnostic Laboratory',
    organizationType: 'PATHOLOGY',
    allowedWorkspaces: ['PATHOLOGY'],
    defaultModule: 'patient-registration',
    planTier: 'Pathology LIMS Enterprise',
    accessibleFeatures: ['Vacutainer Barcode Printing', 'Home Sample Collection GPS', 'Sample Handover to Lab', 'Patient Rejection Logs'],
    restrictedFeatures: ['Result Verification & Sign-off']
  },
  {
    id: 'ROLE-LAB-TECH',
    category: 'HEALTHCARE',
    name: 'Kavita Soni, BSc MLT',
    email: 'labtech.kavita@docsearch.health',
    password: 'LabTechPass123!',
    role: 'LAB_TECHNICIAN',
    roleTitle: 'Medical Laboratory Technician (Biochemistry)',
    department: 'Automated Analyzers & Hematology',
    tenantName: 'BioCore Diagnostic Laboratory',
    organizationType: 'PATHOLOGY',
    allowedWorkspaces: ['PATHOLOGY'],
    defaultModule: 'clinical-investigation',
    planTier: 'Pathology LIMS Enterprise',
    accessibleFeatures: ['Analyzer Machine Interfacing', 'Quality Control (QC) Levey-Jennings', 'Result Data Entry', 'Panic Value Flagging'],
    restrictedFeatures: ['Medical Doctor e-Signature']
  },
  {
    id: 'ROLE-RADIOGRAPHER',
    category: 'HEALTHCARE',
    name: 'Ravi Chandran, BSc Radiography',
    email: 'rad.ravi@docsearch.health',
    password: 'RadPass123!',
    role: 'RADIOGRAPHER_CT_MRI',
    roleTitle: 'Senior CT & MRI Radiographer',
    department: 'Diagnostic Imaging & Modalities',
    tenantName: 'Apex Imaging & Diagnostic Centre',
    organizationType: 'DIAGNOSTIC_CENTRE',
    allowedWorkspaces: ['DIAGNOSTIC_CENTRE'],
    defaultModule: 'radiology-imaging',
    planTier: 'Diagnostic PACS & Modality Hub',
    accessibleFeatures: ['Modality Worklist (MWL)', 'DICOM Image Quality Check', 'Contrast Media Administration Log', 'Radiation Dose Registry'],
    restrictedFeatures: ['Radiological Diagnostic Reporting']
  },
  {
    id: 'ROLE-PHYSIOTHERAPIST',
    category: 'HEALTHCARE',
    name: 'Dr. Pooja Mishra, BPT, MPT',
    email: 'physio.pooja@docsearch.health',
    password: 'PhysioPass123!',
    role: 'PHYSIOTHERAPIST',
    roleTitle: 'Consultant Physiotherapist & Rehabilitation Lead',
    department: 'Physiotherapy, Ergonomics & Sports Rehab',
    tenantName: 'Apex Motion Physiotherapy & Rehab Centre',
    organizationType: 'CLINIC',
    allowedWorkspaces: ['CLINIC'],
    defaultModule: 'clinical-consultation',
    planTier: 'Physiotherapy & Sports Rehab Suite',
    accessibleFeatures: ['Muscle Strength Grading', 'Gait & Range of Motion (ROM)', 'Exercise Prescription Protocol', 'Session Package Billing'],
    restrictedFeatures: ['Surgical Procedures']
  },
  {
    id: 'ROLE-DIETITIAN',
    category: 'HEALTHCARE',
    name: 'Ritu Chawla, MSc Clinical Nutrition',
    email: 'diet.ritu@docsearch.health',
    password: 'DietPass123!',
    role: 'DIETITIAN_NUTRITIONIST',
    roleTitle: 'Chief Clinical Dietitian & Nutritionist',
    department: 'Clinical Nutrition, Dietary & Inpatient Kitchen',
    tenantName: 'Apex Metropolitan Hospital',
    organizationType: 'HOSPITAL',
    allowedWorkspaces: ['HOSPITAL'],
    defaultModule: 'dietary-kitchen-management',
    planTier: 'Hospital Inpatient Suite',
    accessibleFeatures: ['Calorie & Protein Requirements', 'Diabetic/Renal Diet Matrices', 'Kitchen Meal Dispatch Slips', 'Ryle Tube Feed Schedules'],
    restrictedFeatures: ['Medication Prescribing']
  },
  {
    id: 'ROLE-PARAMEDIC',
    category: 'HEALTHCARE',
    name: 'Sanjay Rawat, EMT-P',
    email: 'ems.sanjay@docsearch.health',
    password: 'EmsPass123!',
    role: 'EMERGENCY_PARAMEDIC',
    roleTitle: 'Advance Life Support (ALS) Flight Paramedic',
    department: 'Ambulance Services & Emergency Fleet',
    tenantName: 'Apex Metropolitan Hospital',
    organizationType: 'HOSPITAL',
    allowedWorkspaces: ['HOSPITAL'],
    defaultModule: 'emergency-trauma',
    planTier: 'Emergency & Trauma Care Suite',
    accessibleFeatures: ['Ambulance GPS Live Dispatch', 'Pre-Hospital Telemetry Sync', 'Oxygen & Defibrillator Log', 'Hospital Notification Clock'],
    restrictedFeatures: ['Inpatient Discharge Billing']
  },

  // 4. DIAGNOSTICS & PHARMACY LEADERSHIP
  {
    id: 'ROLE-PATHOLOGIST',
    category: 'HEALTHCARE',
    name: 'Dr. Shalini Deshmukh, MD Path',
    email: 'path.shalini@docsearch.health',
    password: 'PathPass123!',
    role: 'PATHOLOGIST',
    roleTitle: 'Head of Pathology & LIMS Lab',
    department: 'Hematology, Biochemistry & LIMS',
    tenantName: 'BioCore Diagnostic Laboratory',
    organizationType: 'PATHOLOGY',
    allowedWorkspaces: ['PATHOLOGY'],
    defaultModule: 'clinical-investigation',
    planTier: 'Pathology LIMS Enterprise',
    accessibleFeatures: ['Phlebotomy Barcode Intake', 'Analyzer HL7/ASTM Sync', 'Result Verification', 'Critical Panic Alerts', 'NABL WhatsApp PDF'],
    restrictedFeatures: ['IPD Nursing Notes', 'Pharmacy Inventory', 'OT Scheduling']
  },
  {
    id: 'ROLE-RADIOLOGIST',
    category: 'HEALTHCARE',
    name: 'Dr. Arvind Mehta, DMRD',
    email: 'rad.arvind@docsearch.health',
    password: 'RadioPass123!',
    role: 'RADIOLOGIST',
    roleTitle: 'Chief Radiologist & PACS Director',
    department: 'MRI, CT & Ultrasound Imaging',
    tenantName: 'Apex Imaging & Diagnostic Centre',
    organizationType: 'DIAGNOSTIC_CENTRE',
    allowedWorkspaces: ['DIAGNOSTIC_CENTRE'],
    defaultModule: 'radiology-imaging',
    planTier: 'Diagnostic PACS & Modality Hub',
    accessibleFeatures: ['Web DICOM Viewer', 'Modality Scheduler', 'Structured Speech Reporting', 'PACS Image Sync', 'TPA Pre-Auth'],
    restrictedFeatures: ['Pharmacy POS', 'Pathology Phlebotomy Intake', 'Inpatient Beds']
  },
  {
    id: 'ROLE-BLOOD-BANK',
    category: 'HEALTHCARE',
    name: 'Dr. Neha Kapoor, MD',
    email: 'blood.neha@docsearch.health',
    password: 'BloodPass123!',
    role: 'BLOOD_BANK_OFFICER',
    roleTitle: 'Blood Bank Medical Officer & Transfusion Lead',
    department: 'Blood Bank & Component Separation Unit',
    tenantName: 'Apex Regional Blood Centre & Component Unit',
    organizationType: 'HOSPITAL',
    allowedWorkspaces: ['HOSPITAL'],
    defaultModule: 'blood-bank-transfusion',
    planTier: 'Blood Bank & Component Suite',
    accessibleFeatures: ['Voluntary Donor Registry', 'Component Fractionation (PRBC/FFP/Platelets)', 'Cross-Matching & Coombs Test', 'Cold Chain Temperature Logs'],
    restrictedFeatures: ['OPD EMR Consultation', 'Pharmacy POS']
  },
  {
    id: 'ROLE-PHARMACIST',
    category: 'HEALTHCARE',
    name: 'Suresh Patel, B.Pharm',
    email: 'pharma.suresh@docsearch.health',
    password: 'PharmaPass123!',
    role: 'PHARMACIST',
    roleTitle: 'Chief Pharmacist & Retail Chemist Lead',
    department: 'Pharmacy POS & Stock Inwarding',
    tenantName: 'MetroCare Chemist & Druggist',
    organizationType: 'PHARMACY',
    allowedWorkspaces: ['PHARMACY'],
    defaultModule: 'pharmacy-medication',
    planTier: 'Retail Pharmacy POS Suite',
    accessibleFeatures: ['Fast POS Billing', 'Barcode Dispensing', 'Batch/Expiry Radar', 'DDI Conflict Shield', 'Jan Aushadhi Generic Finder'],
    restrictedFeatures: ['Inpatient Wards', 'OT Management', 'Psychiatric/HIV Notes (Masked)']
  },
  {
    id: 'ROLE-JAN-AUSHADHI',
    category: 'HEALTHCARE',
    name: 'Mohan Das, D.Pharm',
    email: 'janaushadhi.mohan@docsearch.health',
    password: 'JanPass123!',
    role: 'JAN_AUSHADHI_OPERATOR',
    roleTitle: 'Jan Aushadhi Kendra Chemist In-Charge',
    department: 'PMBJP Generic Pharmacy Counter',
    tenantName: 'Pradhan Mantri Bhartiya Janaushadhi Kendra',
    organizationType: 'PHARMACY',
    allowedWorkspaces: ['PHARMACY'],
    defaultModule: 'pharmacy-medication',
    planTier: 'Jan Aushadhi PMBJP POS Suite',
    accessibleFeatures: ['PMBJP Standard Price Catalog', 'Generic Drug Switcher', 'Daily Sales Report to Govt', 'Low-Income Subsidy Counter'],
    restrictedFeatures: ['Proprietary Brand Inwarding']
  },

  // 5. HOSPITAL ADMINISTRATION & HEALTHCARE OPERATIONS
  {
    id: 'ROLE-CASHIER',
    category: 'HEALTHCARE',
    name: 'Vikram Malhotra',
    email: 'cashier.vikram@docsearch.health',
    password: 'CashierPass123!',
    role: 'CASHIER_POS',
    roleTitle: 'Chief Cashier & Finance Officer',
    department: 'Finance, Billing & Counter Receipts',
    tenantName: 'Apex Metropolitan Hospital',
    organizationType: 'HOSPITAL',
    allowedWorkspaces: ['HOSPITAL', 'CLINIC', 'PHARMACY'],
    defaultModule: 'billing-revenue-cycle',
    planTier: 'Enterprise Fintech Suite',
    accessibleFeatures: ['Instant Multi-Party UPI Split', 'Cashier POS Counter', 'Tax Invoicing', 'Discharge Billing', 'Bank UTR Settlement'],
    restrictedFeatures: ['Clinical Consultation Notes (Masked)', 'Lab/Radiology Test Entry']
  },
  {
    id: 'ROLE-TPA',
    category: 'HEALTHCARE',
    name: 'Amitabh Sen',
    email: 'tpa.amitabh@docsearch.health',
    password: 'TpaPass123!',
    role: 'TPA_OFFICER',
    roleTitle: 'Insurance & TPA Claims Head',
    department: 'Insurance Desk & Cashless Clearance',
    tenantName: 'Apex Metropolitan Hospital',
    organizationType: 'HOSPITAL',
    allowedWorkspaces: ['HOSPITAL'],
    defaultModule: 'insurance-claims',
    planTier: 'Hospital Claims Suite',
    accessibleFeatures: ['TPA Cashless Pre-Auth', 'AI Claim Approval Predictor (98%)', '0-Deduction Scrubber', 'IRDAI NHCX FHIR Gateway'],
    restrictedFeatures: ['Doctor Prescription Writing', 'Pharmacy Inventory Stock Inwarding']
  },
  {
    id: 'ROLE-MRD',
    category: 'HEALTHCARE',
    name: 'Rameshwar Roy',
    email: 'mrd.rameshwar@docsearch.health',
    password: 'MrdPass123!',
    role: 'MRD_OFFICER',
    roleTitle: 'Medical Records Officer',
    department: 'Medical Records Department (MRD)',
    tenantName: 'Apex Metropolitan Hospital',
    organizationType: 'HOSPITAL',
    allowedWorkspaces: ['HOSPITAL'],
    defaultModule: 'medical-records',
    planTier: 'Hospital Compliance Suite',
    accessibleFeatures: ['ICD-10 Clinical Coding', 'Birth & Death Registries', 'Longitudinal Record Archive', 'MLC Forensic Records'],
    restrictedFeatures: ['Live Cashier POS', 'Medicine Stock Purchasing']
  },
  {
    id: 'ROLE-RECEPTIONIST',
    category: 'HEALTHCARE',
    name: 'Pooja Bhatt',
    email: 'reception.pooja@docsearch.health',
    password: 'ReceptionPass123!',
    role: 'RECEPTIONIST',
    roleTitle: 'Front-Desk & OPD Coordinator',
    department: 'Reception & Patient Relations',
    tenantName: 'Apex Metropolitan Hospital',
    organizationType: 'HOSPITAL',
    allowedWorkspaces: ['HOSPITAL', 'CLINIC'],
    defaultModule: 'patient-registration',
    planTier: 'Hospital Outpatient Suite',
    accessibleFeatures: ['Patient Registration (MPI)', 'ABDM 2.0 1-Sec Scan & Share Kiosk', 'OPD Token Queue Pass', 'WhatsApp Appointments'],
    restrictedFeatures: ['Doctor EMR Clinical Notes', 'Pharmacy POS Dispensing']
  },
  {
    id: 'ROLE-BIOMEDICAL',
    category: 'HEALTHCARE',
    name: 'Eng. Vinay Hegde, B.Tech',
    email: 'biomed.vinay@docsearch.health',
    password: 'BioPass123!',
    role: 'BIOMEDICAL_ENGINEER',
    roleTitle: 'Biomedical Equipment & Safety Engineer',
    department: 'Biomedical Engineering & Asset Maintenance',
    tenantName: 'Apex Metropolitan Hospital',
    organizationType: 'HOSPITAL',
    allowedWorkspaces: ['HOSPITAL'],
    defaultModule: 'asset-biomedical-maintenance',
    planTier: 'Hospital Engineering Suite',
    accessibleFeatures: ['Ventilator/Defibrillator Preventive Maintenance', 'AERB Radiation Safety Logs', 'Equipment Calibration Registry', 'Breakdown Incident Escalation'],
    restrictedFeatures: ['Clinical Notes']
  },
  {
    id: 'ROLE-QUALITY-NABH',
    category: 'HEALTHCARE',
    name: 'Dr. Shilpa Kulkarni, CPHQ',
    email: 'nabh.shilpa@docsearch.health',
    password: 'NabhPass123!',
    role: 'NABH_QUALITY_MANAGER',
    roleTitle: 'NABH Accreditation & Patient Safety Lead',
    department: 'Quality Assurance & Clinical Safety',
    tenantName: 'Apex Metropolitan Hospital',
    organizationType: 'HOSPITAL',
    allowedWorkspaces: ['HOSPITAL'],
    defaultModule: 'quality-incident-infection-control',
    planTier: 'Quality & Accreditation Suite',
    accessibleFeatures: ['NABH Key Performance Indicators (KPIs)', 'Sentinel Event Incident Reporting', 'Medication Error Audits', 'Patient Feedback Net Promoter'],
    restrictedFeatures: ['Direct Medication Prescribing']
  },
  {
    id: 'ROLE-INFECTION-CONTROL',
    category: 'HEALTHCARE',
    name: 'Sister Preeti Nair, CIC',
    email: 'infection.preeti@docsearch.health',
    password: 'InfectPass123!',
    role: 'INFECTION_CONTROL_OFFICER',
    roleTitle: 'Hospital Infection Control & Bio-Waste Lead',
    department: 'Infection Prevention & Bio-Medical Waste',
    tenantName: 'Apex Metropolitan Hospital',
    organizationType: 'HOSPITAL',
    allowedWorkspaces: ['HOSPITAL'],
    defaultModule: 'quality-incident-infection-control',
    planTier: 'Hospital Infection Suite',
    accessibleFeatures: ['HAI Surveillance (CLABSI/CAUTI/SSI)', 'Bio-Medical Waste (BMW) Barcode Logs', 'Hand Hygiene Compliance Tracker', 'Antimicrobial Stewardship'],
    restrictedFeatures: ['Cashier Payments']
  },
  {
    id: 'ROLE-PROCUREMENT',
    category: 'HEALTHCARE',
    name: 'Gaurav Saxena, SCM Pro',
    email: 'procure.gaurav@docsearch.health',
    password: 'ProcurePass123!',
    role: 'PROCUREMENT_SUPPLY_MANAGER',
    roleTitle: 'Central Procurement & Supply Chain Lead',
    department: 'Central Stores, Materials & Supply Chain',
    tenantName: 'Apex Metropolitan Hospital',
    organizationType: 'HOSPITAL',
    allowedWorkspaces: ['HOSPITAL'],
    defaultModule: 'procurement-supply-chain',
    planTier: 'Hospital Supply Chain Suite',
    accessibleFeatures: ['Hospital PO Purchase Orders', 'Vendor GRN Inwarding', 'Central Surgical Stock Ledger', 'Near-Expiry Auto Return to Vendor'],
    restrictedFeatures: ['Patient Medical Records']
  },

  // --- COMPANY SAAS HQ ROLES (8) ---
  {
    id: 'ROLE-HQ-SUPERADMIN',
    category: 'COMPANY_HQ',
    name: 'Dr. Anand Singhal (CEO)',
    email: 'ceo.anand@docsearch.health',
    password: 'CeoPass123!',
    role: 'SUPER_ADMIN',
    roleTitle: 'Founder & SaaS Platform Director',
    department: 'Executive HQ Governance',
    tenantName: 'DocSearch Headquarters Platform',
    organizationType: 'ENTERPRISE_COMMAND',
    allowedWorkspaces: ['ENTERPRISE_COMMAND', 'HOSPITAL', 'CLINIC', 'PHARMACY', 'PATHOLOGY', 'DIAGNOSTIC_CENTRE'],
    defaultModule: 'executive-command-center',
    planTier: 'Master SaaS Super-Admin',
    accessibleFeatures: ['All 25 Modules', 'Tenant Onboarding', 'Database Schema Control', 'Global Price Plans', 'System Overrides'],
    restrictedFeatures: ['None (Root Authority)']
  },
  {
    id: 'ROLE-HQ-PRODUCT',
    category: 'COMPANY_HQ',
    name: 'Kavita Menon',
    email: 'product.kavita@docsearch.health',
    password: 'ProductPass123!',
    role: 'PRODUCT_MANAGER',
    roleTitle: 'Chief Product & Packaging Lead',
    department: 'Product Strategy & Entitlements',
    tenantName: 'DocSearch Headquarters Platform',
    organizationType: 'ENTERPRISE_COMMAND',
    allowedWorkspaces: ['ENTERPRISE_COMMAND'],
    defaultModule: 'organization-foundation',
    planTier: 'HQ Product Administration',
    accessibleFeatures: ['Plan Pricing Customizer', 'Feature Flag Catalogs', 'Module Entitlement Sets', 'Hospital Tier Builder'],
    restrictedFeatures: ['Live Patient EMR Notes', 'Direct Hospital Cashier Payments']
  },
  {
    id: 'ROLE-HQ-FINANCE',
    category: 'COMPANY_HQ',
    name: 'Rohan Deshmukh, CA',
    email: 'finance.rohan@docsearch.health',
    password: 'FinancePass123!',
    role: 'FINANCE_ADMIN',
    roleTitle: 'SaaS Finance & Revenue Lead',
    department: 'Finance & SaaS Subscriptions',
    tenantName: 'DocSearch Headquarters Platform',
    organizationType: 'ENTERPRISE_COMMAND',
    allowedWorkspaces: ['ENTERPRISE_COMMAND'],
    defaultModule: 'billing-revenue-cycle',
    planTier: 'HQ Finance Governance',
    accessibleFeatures: ['Hospital SaaS Subscriptions', 'Platform Escrow Settlement', 'Commission Splits', 'GST Invoicing Audit'],
    restrictedFeatures: ['Clinical Diagnosis Notes', 'Radiology Scans']
  },
  {
    id: 'ROLE-HQ-GROWTH',
    category: 'COMPANY_HQ',
    name: 'Deepak Varma',
    email: 'growth.deepak@docsearch.health',
    password: 'GrowthPass123!',
    role: 'GROWTH_SALES',
    roleTitle: 'Head of Enterprise Healthcare Sales',
    department: 'Sales, Growth & Onboarding',
    tenantName: 'DocSearch Headquarters Platform',
    organizationType: 'ENTERPRISE_COMMAND',
    allowedWorkspaces: ['ENTERPRISE_COMMAND'],
    defaultModule: 'organization-foundation',
    planTier: 'HQ Sales CRM Suite',
    accessibleFeatures: ['Hospital Lead Pipeline', '1-Click Facility Deployment', 'Sales Campaign Builder', 'Partner Verification'],
    restrictedFeatures: ['Hospital Inpatient Wards', 'Pharmacy POS']
  },
  {
    id: 'ROLE-HQ-SECURITY',
    category: 'COMPANY_HQ',
    name: 'Aditya Mathur, CISSP',
    email: 'ciso.aditya@docsearch.health',
    password: 'CisoPass123!',
    role: 'SECURITY_CISO',
    roleTitle: 'Chief Information Security Officer (CISO)',
    department: 'Information Security & Threat Defense',
    tenantName: 'DocSearch Headquarters Platform',
    organizationType: 'ENTERPRISE_COMMAND',
    allowedWorkspaces: ['ENTERPRISE_COMMAND', 'HOSPITAL', 'CLINIC'],
    defaultModule: 'quality-incident-infection-control',
    planTier: 'HQ Zero-Trust Security Suite',
    accessibleFeatures: ['Zero-Trust Threat Radar', 'Emergency Break-Glass Audit', 'SHA-256 WORM Ledger', 'Session Quarantine', 'Token Revocation'],
    restrictedFeatures: ['Doctor EMR Prescription Writing']
  },
  {
    id: 'ROLE-HQ-COMPLIANCE',
    category: 'COMPANY_HQ',
    name: 'Advocate Sneha Bose',
    email: 'legal.sneha@docsearch.health',
    password: 'LegalPass123!',
    role: 'COMPLIANCE_OFFICER',
    roleTitle: 'Head of Legal & Healthcare Compliance',
    department: 'Regulatory, HIPAA & DPDPA 2023',
    tenantName: 'DocSearch Headquarters Platform',
    organizationType: 'ENTERPRISE_COMMAND',
    allowedWorkspaces: ['ENTERPRISE_COMMAND'],
    defaultModule: 'abdm-fhir-gateway',
    planTier: 'HQ Compliance Governance',
    accessibleFeatures: ['ABDM 2.0 Health Data Vault', 'DPDPA 2023 Consent Logs', 'HIPAA Privacy Audit', 'NABH Quality Checklists'],
    restrictedFeatures: ['Live Cashier Transactions']
  },
  {
    id: 'ROLE-HQ-SUPPORT',
    category: 'COMPANY_HQ',
    name: 'Manish Pandey',
    email: 'support.manish@docsearch.health',
    password: 'SupportPass123!',
    role: 'CUSTOMER_SUCCESS',
    roleTitle: 'Customer Success & Partner SLA Lead',
    department: 'Hospital Support & SLA Helpdesk',
    tenantName: 'DocSearch Headquarters Platform',
    organizationType: 'ENTERPRISE_COMMAND',
    allowedWorkspaces: ['ENTERPRISE_COMMAND'],
    defaultModule: 'whatsapp-patient-portal',
    planTier: 'HQ Support Helpdesk',
    accessibleFeatures: ['Partner Ticket Helpdesk', 'System Uptime Monitoring', 'WhatsApp Chatbot Support', 'Onboarding Assistance'],
    restrictedFeatures: ['Hospital Financial Records', 'Patient Medical Records']
  },
  {
    id: 'ROLE-HQ-DEVOPS',
    category: 'COMPANY_HQ',
    name: 'Karan Mehra',
    email: 'devops.karan@docsearch.health',
    password: 'DevopsPass123!',
    role: 'DEVOPS_ENGINEER',
    roleTitle: 'Platform Engineering & DevOps Lead',
    department: 'Infrastructure & Cloud Gateways',
    tenantName: 'DocSearch Headquarters Platform',
    organizationType: 'ENTERPRISE_COMMAND',
    allowedWorkspaces: ['ENTERPRISE_COMMAND'],
    defaultModule: 'asset-biomedical-maintenance',
    planTier: 'HQ Infrastructure Engine',
    accessibleFeatures: ['Fastify API Gateway Health', 'Redis Session Clusters', 'Hardware Bluetooth Bridges', 'Database RLS Migration'],
    restrictedFeatures: ['Patient Clinical Charts']
  }
];

export const DEMO_ORGANIZATION_USERS = ALL_SYSTEM_ROLES;
export const DEMO_STAFF_USERS = ALL_SYSTEM_ROLES;

export const getHealthcareOrgDetails = (orgType: OrganizationWorkspaceType, tenantName: string, roleName?: string) => {
  switch (orgType) {
    case 'HOSPITAL':
      return {
        role: roleName || 'HOSPITAL_DIRECTOR',
        roleTitle: `${tenantName} (Medical Superintendent & Director)`,
        department: 'Hospital Administration & Inpatient Governance',
        defaultModule: 'inpatient-management',
        allowedWorkspaces: ['HOSPITAL', 'CLINIC', 'PHARMACY', 'PATHOLOGY', 'DIAGNOSTIC_CENTRE', 'ENTERPRISE_COMMAND'] as OrganizationWorkspaceType[],
        planTier: 'Multi-Specialty Hospital Suite',
        restrictedFeatures: ['None (Full Hospital Scope)']
      };
    case 'PHARMACY':
      return {
        role: roleName || 'PHARMACIST',
        roleTitle: `${tenantName} (Chief Pharmacist & Chemist In-Charge)`,
        department: 'Pharmacy POS & Stock Inwarding',
        defaultModule: 'pharmacy-medication',
        allowedWorkspaces: ['PHARMACY'] as OrganizationWorkspaceType[],
        planTier: 'Retail Pharmacy POS Suite',
        restrictedFeatures: ['Hospital Inpatient Wards', 'OT Surgery Logs']
      };
    case 'CLINIC':
      return {
        role: roleName || 'CLINIC_DOCTOR',
        roleTitle: `${tenantName} (Lead Consultant Doctor)`,
        department: 'Outpatient Clinic & Consultation',
        defaultModule: 'clinical-consultation',
        allowedWorkspaces: ['CLINIC'] as OrganizationWorkspaceType[],
        planTier: 'Doctor OPD Clinic Pro',
        restrictedFeatures: ['IPD Bed Census', 'OT Surgery Logs']
      };
    case 'DIAGNOSTIC_CENTRE':
      return {
        role: roleName || 'RADIOLOGIST',
        roleTitle: `${tenantName} (Chief Radiologist & PACS Lead)`,
        department: 'Radiology, MRI, CT & Imaging',
        defaultModule: 'radiology-imaging',
        allowedWorkspaces: ['DIAGNOSTIC_CENTRE'] as OrganizationWorkspaceType[],
        planTier: 'Diagnostic PACS & Modality Hub',
        restrictedFeatures: ['Pharmacy POS', 'Hospital Inpatient Beds']
      };
    case 'PATHOLOGY':
    default:
      return {
        role: roleName || 'PATHOLOGIST',
        roleTitle: `${tenantName} (Head Pathologist)`,
        department: 'Pathology & Diagnostic Laboratory',
        defaultModule: 'clinical-investigation',
        allowedWorkspaces: ['PATHOLOGY'] as OrganizationWorkspaceType[],
        planTier: 'Pathology Pro & Barcode LIMS',
        restrictedFeatures: ['Hospital IPD Wards', 'OT Surgery Logs']
      };
  }
};

interface Props {
  onLoginSuccess: (user: HospitalStaffUser) => void;
}

export const HospitalStaffLogin: React.FC<Props> = ({ onLoginSuccess }) => {
  const [activeCategory, setActiveCategory] = useState<'ALL' | 'HEALTHCARE' | 'COMPANY_HQ'>('ALL');
  const [customRoles, setCustomRoles] = useState<HospitalStaffUser[]>([]);
  const [selectedUser, setSelectedUser] = useState<HospitalStaffUser>(ALL_SYSTEM_ROLES[0]!);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [emailInput, setEmailInput] = useState(ALL_SYSTEM_ROLES[0]?.email || 'tata@doc.com');
  const [passwordInput, setPasswordInput] = useState(ALL_SYSTEM_ROLES[0]?.password || 'TataPass123!');
  const [authError, setAuthError] = useState<string | null>(null);

  React.useEffect(() => {
    const loadLivePartners = async () => {
      try {
        const localCustom: HospitalStaffUser[] = JSON.parse(localStorage.getItem('docsearch_custom_partner_users') || '[]');
        
        let apiPartners: any[] = [];
        try {
          const res = await fetch('/api/v1/auth/live-partners');
          if (res.ok) {
            const j = await res.json();
            if (j.data) apiPartners = j.data;
          }
        } catch {
          // ignore if backend offline
        }

        const mappedApiRoles: HospitalStaffUser[] = apiPartners.map((p) => {
          const orgType = (p.organizationType as OrganizationWorkspaceType) || 'PATHOLOGY';
          const details = getHealthcareOrgDetails(orgType, p.tenantName, p.role);
          return {
            id: p.id,
            category: 'HEALTHCARE' as const,
            name: p.name,
            email: p.email,
            role: details.role,
            roleTitle: details.roleTitle,
            department: details.department,
            tenantName: p.tenantName,
            organizationType: orgType,
            allowedWorkspaces: details.allowedWorkspaces,
            defaultModule: details.defaultModule,
            planTier: p.planTier || details.planTier,
            planExpiryDate: p.planExpiryDate || '30 Days Validity',
            accessibleFeatures: p.accessibleFeatures || ['Standard Partner Workbench'],
            restrictedFeatures: details.restrictedFeatures
          };
        });

        const combined = [...localCustom, ...mappedApiRoles];
        const unique: HospitalStaffUser[] = [];
        const seen = new Set<string>();

        for (const u of combined) {
          if (u.email && !seen.has(u.email.toLowerCase())) {
            seen.add(u.email.toLowerCase());
            unique.push(u);
          }
        }

        if (unique.length > 0) {
          setCustomRoles(unique);
          const firstNew = unique[0]!;
          setSelectedUser(firstNew);
          if (firstNew.email) setEmailInput(firstNew.email);
          if (firstNew.password) setPasswordInput(firstNew.password);
        }
      } catch (err) {
        console.error('Failed to load custom partners:', err);
      }
    };
    void loadLivePartners();
  }, []);

  const handleSelectRole = (user: HospitalStaffUser) => {
    setSelectedUser(user);
    if (user.email) setEmailInput(user.email);
    if (user.password) setPasswordInput(user.password);
    setAuthError(null);
  };

  const allAvailableRoles = [...customRoles, ...ALL_SYSTEM_ROLES];

  const filteredRoles = allAvailableRoles.filter((r) => {
    const matchesCategory = activeCategory === 'ALL' || r.category === activeCategory;
    const matchesSearch =
      r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.roleTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.tenantName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.department.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleLogin = async (userToLogin?: HospitalStaffUser) => {
    const targetUser = userToLogin || selectedUser;
    const emailToUse = (userToLogin?.email || emailInput || '').trim();
    const passToUse = (userToLogin?.password || passwordInput || '').trim();
    setIsAuthenticating(true);
    setAuthError(null);

    try {
      const res = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: emailToUse,
          password: passToUse
        })
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        // Fallback: If matching a registered custom role
        const matchingCustom = customRoles.find(
          (c) => c.email?.toLowerCase() === emailToUse.toLowerCase() && (!c.password || c.password === passToUse)
        );
        if (matchingCustom) {
          localStorage.setItem('docsearch_partner_staff_auth', JSON.stringify(matchingCustom));
          setIsAuthenticating(false);
          onLoginSuccess(matchingCustom);
          return;
        }

        setAuthError(json.error?.message || json.message || 'Authentication failed. Please check email and password.');
        setIsAuthenticating(false);
        return;
      }

      const returnedUser = json.data?.user;
      const effectiveOrg = (returnedUser?.organizationType as OrganizationWorkspaceType) || (targetUser.organizationType as OrganizationWorkspaceType) || 'PATHOLOGY';
      const effectiveTenant = returnedUser?.tenantName || targetUser.tenantName || 'Healthcare Facility';
      const orgDetails = getHealthcareOrgDetails(effectiveOrg, effectiveTenant, returnedUser?.roles?.[0]);

      const resolvedUser: HospitalStaffUser = {
        id: returnedUser?.id || targetUser.id,
        category: 'HEALTHCARE',
        name: `${returnedUser?.firstName || ''} ${returnedUser?.lastName || ''}`.trim() || targetUser.name,
        email: emailToUse,
        password: passToUse,
        role: returnedUser?.roles?.[0] || targetUser.role || orgDetails.role,
        roleTitle: orgDetails.roleTitle,
        department: orgDetails.department,
        tenantName: effectiveTenant,
        organizationType: effectiveOrg,
        allowedWorkspaces: orgDetails.allowedWorkspaces,
        defaultModule: orgDetails.defaultModule,
        planTier: returnedUser?.planTier || targetUser.planTier || orgDetails.planTier,
        planExpiryDate: returnedUser?.planExpiryDate || targetUser.planExpiryDate || '30 Days Validity',
        accessibleFeatures: returnedUser?.accessibleFeatures || targetUser.accessibleFeatures || ['Standard Partner Access'],
        restrictedFeatures: orgDetails.restrictedFeatures
      };

      if (json.data?.accessToken) {
        localStorage.setItem('docsearch_auth_token', json.data.accessToken);
        localStorage.setItem('docsearch_user_session', JSON.stringify(returnedUser));
        localStorage.setItem('docsearch_partner_staff_auth', JSON.stringify(resolvedUser));
      }

      if (typeof window !== 'undefined' && (window.location.pathname === '/' || window.location.pathname === '/login')) {
        const targetPath = getUrlForModule(resolvedUser.organizationType, resolvedUser.defaultModule as any);
        window.history.replaceState({ path: targetPath }, '', targetPath);
      }

      setIsAuthenticating(false);
      onLoginSuccess(resolvedUser);
    } catch {
      if (typeof window !== 'undefined' && (window.location.pathname === '/' || window.location.pathname === '/login')) {
        const targetPath = getUrlForModule(targetUser.organizationType, targetUser.defaultModule as any);
        window.history.replaceState({ path: targetPath }, '', targetPath);
      }
      setIsAuthenticating(false);
      onLoginSuccess(targetUser);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#070C16',
      backgroundImage: 'radial-gradient(ellipse at 50% 15%, rgba(6, 182, 212, 0.18), transparent 75%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px 16px',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '1180px',
        backgroundColor: '#0B132B',
        border: '1.5px solid rgba(6, 182, 212, 0.35)',
        borderRadius: '24px',
        boxShadow: '0 25px 80px rgba(0,0,0,0.9), 0 0 50px rgba(6, 182, 212, 0.2)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }}>
        
        {/* Header Bar */}
        <div style={{ backgroundColor: '#0F172A', padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '1.75rem' }}>🏥</span>
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#F8FAFC', margin: 0 }}>
                  DOC SEARCH — MULTI-ROLE ACCESS & RBAC TEST WORKBENCH
                </h2>
                <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
                  20 Dedicated Roles: 12 Healthcare Clinical/Partner Roles + 8 Company SaaS HQ Governance Roles
                </span>
              </div>
            </div>
          </div>

          {/* Category Filter Tabs */}
          <div style={{ display: 'flex', gap: '6px', backgroundColor: 'rgba(30, 41, 59, 0.7)', padding: '4px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.1)' }}>
            {[
              { id: 'ALL', label: 'All 20 Roles', count: 20 },
              { id: 'HEALTHCARE', label: '🏥 Healthcare Roles', count: 12 },
              { id: 'COMPANY_HQ', label: '🏢 Company HQ Roles', count: 8 }
            ].map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategory(cat.id as any)}
                style={{
                  backgroundColor: activeCategory === cat.id ? '#06B6D4' : 'transparent',
                  color: activeCategory === cat.id ? '#070C16' : '#94A3B8',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '6px 12px',
                  fontSize: '0.75rem',
                  fontWeight: activeCategory === cat.id ? 900 : 600,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                {cat.label} ({cat.count})
              </button>
            ))}
          </div>
        </div>

        {/* Main Grid: Left Roles List (Scrollable) & Right Live Access Inspector */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', minHeight: '560px' }}>
          
          {/* Left Column: Role Selector List */}
          <div style={{ backgroundColor: '#0B132B', borderRight: '1px solid rgba(255,255,255,0.08)', padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {/* Search Input */}
            <input
              type="text"
              placeholder="🔍 Search by Role name, Title, Doctor, Nurse, Chemist, CISO..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '8px',
                backgroundColor: 'rgba(30, 41, 59, 0.7)',
                border: '1px solid rgba(255,255,255,0.12)',
                color: '#FFF',
                fontSize: '0.8125rem',
                outline: 'none'
              }}
            />

            {/* Roles List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '460px', overflowY: 'auto', paddingRight: '4px' }}>
              {filteredRoles.map((r) => {
                const isSelected = selectedUser.id === r.id;
                const isHQ = r.category === 'COMPANY_HQ';
                return (
                  <div
                    key={r.id}
                    onClick={() => handleSelectRole(r)}
                    style={{
                      backgroundColor: isSelected ? 'rgba(6, 182, 212, 0.18)' : 'rgba(15, 23, 42, 0.6)',
                      border: isSelected ? '1.5px solid #06B6D4' : '1px solid rgba(255,255,255,0.06)',
                      borderRadius: '12px',
                      padding: '10px 12px',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{
                        width: '34px',
                        height: '34px',
                        borderRadius: '8px',
                        backgroundColor: isHQ ? '#8B5CF6' : isSelected ? '#06B6D4' : '#1E293B',
                        color: '#FFF',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1.1rem'
                      }}>
                        {r.role.includes('DOC') || r.role.includes('SURGEON') ? '🩺' :
                         r.role.includes('PHARM') ? '💊' :
                         r.role.includes('PATH') ? '🧪' :
                         r.role.includes('RAD') ? '🔬' :
                         r.role.includes('NURSE') ? '👩‍⚕️' :
                         r.role.includes('CASHIER') ? '💳' :
                         r.role.includes('SUPER_ADMIN') ? '👑' :
                         r.role.includes('SECURITY') ? '🛡️' :
                         r.role.includes('COMPLIANCE') ? '📜' :
                         r.role.includes('DIRECTOR') ? '🏥' : '💼'}
                      </div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <strong style={{ fontSize: '0.8125rem', color: isSelected ? '#38BDF8' : '#F8FAFC' }}>
                            {r.roleTitle}
                          </strong>
                          <span style={{ fontSize: '0.625rem', backgroundColor: isHQ ? 'rgba(139, 92, 246, 0.2)' : 'rgba(6, 182, 212, 0.2)', color: isHQ ? '#C4B5FD' : '#38BDF8', padding: '1px 5px', borderRadius: '4px', fontFamily: 'monospace' }}>
                            {r.role}
                          </span>
                        </div>
                        <span style={{ fontSize: '0.6875rem', color: '#94A3B8', display: 'block', marginTop: '2px' }}>
                          {r.name} • {r.department}
                        </span>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleLogin(r);
                        }}
                        style={{
                          backgroundColor: isSelected ? '#06B6D4' : 'rgba(255,255,255,0.08)',
                          color: isSelected ? '#070C16' : '#CBD5E1',
                          border: 'none',
                          borderRadius: '6px',
                          padding: '4px 8px',
                          fontSize: '0.6875rem',
                          fontWeight: 800,
                          cursor: 'pointer'
                        }}
                      >
                        ⚡ Login
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Live Access Matrix & Permissions Inspector */}
          <div style={{ backgroundColor: '#0F172A', padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '16px' }}>
            <div>
              {/* Selected Role Profile Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '14px', marginBottom: '14px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 900, color: '#F8FAFC' }}>
                      {selectedUser.roleTitle}
                    </h3>
                    <Badge variant="primary">{selectedUser.role}</Badge>
                  </div>
                  <span style={{ fontSize: '0.8125rem', color: '#38BDF8', marginTop: '3px', display: 'block' }}>
                    {selectedUser.name} — {selectedUser.department}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '2px', display: 'block' }}>
                    🏢 {selectedUser.tenantName}
                  </span>
                </div>

                <Badge variant={selectedUser.category === 'COMPANY_HQ' ? 'danger' : 'success'}>
                  {selectedUser.category === 'COMPANY_HQ' ? '🏢 HQ SaaS Role' : '🏥 Partner Role'}
                </Badge>
              </div>

              {/* Resolved Scope Details */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
                <div style={{ backgroundColor: 'rgba(30, 41, 59, 0.6)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '10px', padding: '10px' }}>
                  <span style={{ fontSize: '0.6875rem', color: '#94A3B8', textTransform: 'uppercase', display: 'block' }}>Subscribed Plan</span>
                  <strong style={{ fontSize: '0.8125rem', color: '#10B981' }}>{selectedUser.planTier}</strong>
                </div>
                <div style={{ backgroundColor: 'rgba(30, 41, 59, 0.6)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '10px', padding: '10px' }}>
                  <span style={{ fontSize: '0.6875rem', color: '#94A3B8', textTransform: 'uppercase', display: 'block' }}>Primary Default Workspace</span>
                  <strong style={{ fontSize: '0.8125rem', color: '#38BDF8' }}>{selectedUser.organizationType}</strong>
                </div>
              </div>

              {/* Accessible Features vs Restricted Features */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#10B981', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                    <span>✓</span> Authorized Features & Active Modules:
                  </span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {selectedUser.accessibleFeatures.map((f, i) => (
                      <span key={i} style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', color: '#A7F3D0', padding: '4px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700 }}>
                        {f}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#EF4444', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                    <span>🚫</span> Restricted / Masked Features:
                  </span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {selectedUser.restrictedFeatures.map((r, i) => (
                      <span key={i} style={{ backgroundColor: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#FCA5A5', padding: '4px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700 }}>
                        {r}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Newly Activated Live Partners Banner */}
            {customRoles.length > 0 && (
              <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.12)', border: '1.5px solid #10B981', borderRadius: '12px', padding: '12px 16px', marginBottom: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 900, color: '#86EFAC', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>🟢</span> Newly Activated Live Partners ({customRoles.length})
                  </span>
                  <Badge variant="success">HQ Onboarded</Badge>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {customRoles.map((cr) => (
                    <div
                      key={cr.id}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        backgroundColor: '#0B132B',
                        padding: '8px 12px',
                        borderRadius: '8px',
                        border: '1px solid ' + (selectedUser.id === cr.id ? '#06B6D4' : '#10B981')
                      }}
                    >
                      <div>
                        <strong style={{ color: '#F8FAFC', fontSize: '0.8125rem' }}>{cr.tenantName}</strong>
                        <div style={{ fontSize: '0.6875rem', color: '#94A3B8' }}>
                          ID: <span style={{ color: '#38BDF8', fontWeight: 700 }}>{cr.email}</span> • Plan: <span style={{ color: '#10B981' }}>{cr.planTier}</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleSelectRole(cr)}
                        style={{
                          backgroundColor: '#10B981',
                          color: '#064E3B',
                          fontWeight: 900,
                          fontSize: '0.6875rem',
                          padding: '5px 12px',
                          borderRadius: '6px',
                          border: 'none',
                          cursor: 'pointer'
                        }}
                      >
                        ⚡ Use Credentials
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Real Database Credential Form */}
            <div style={{ backgroundColor: 'rgba(15, 23, 42, 0.8)', border: '1.5px solid rgba(6, 182, 212, 0.3)', borderRadius: '12px', padding: '14px', marginBottom: '16px' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#38BDF8', textTransform: 'uppercase', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>🔐</span> Real Database Authentication Credentials
              </div>
              
              {authError && (
                <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.2)', border: '1px solid #EF4444', color: '#FCA5A5', padding: '8px 12px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700, marginBottom: '10px' }}>
                  ✗ {authError}
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div>
                  <label style={{ fontSize: '0.6875rem', color: '#94A3B8', display: 'block', marginBottom: '2px' }}>Staff Email Address</label>
                  <input
                    type="email"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', backgroundColor: '#0B132B', border: '1px solid rgba(255,255,255,0.15)', color: '#FFF', fontSize: '0.75rem' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.6875rem', color: '#94A3B8', display: 'block', marginBottom: '2px' }}>Password (scrypt verified)</label>
                  <input
                    type="password"
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', backgroundColor: '#0B132B', border: '1px solid rgba(255,255,255,0.15)', color: '#FFF', fontSize: '0.75rem' }}
                  />
                </div>
              </div>
            </div>

            {/* Instant Login Button for this Role */}
            <div>
              <Button
                type="button"
                variant="primary"
                size="lg"
                disabled={isAuthenticating}
                onClick={() => handleLogin(selectedUser)}
                style={{
                  width: '100%',
                  backgroundColor: '#06B6D4',
                  borderColor: '#06B6D4',
                  color: '#070C16',
                  fontWeight: 900,
                  fontSize: '0.9375rem',
                  padding: '12px'
                }}
              >
                {isAuthenticating ? '⚡ Resolving RBAC & Booting Workspace...' : `🚀 Login as ${selectedUser.roleTitle} (${selectedUser.role})`}
              </Button>
              <div style={{ textAlign: 'center', fontSize: '0.6875rem', color: '#64748B', marginTop: '8px' }}>
                Clicking login will automatically adapt the entire UI, sidebar, and permissions to this role.
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};
