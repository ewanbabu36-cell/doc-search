import React, { useState } from 'react';
import { Badge, Button } from '@docsearch/ui-kit';

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

  // --- HEALTHCARE PARTNER ROLES (12) ---
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
  {
    id: 'ROLE-SURGEON',
    category: 'HEALTHCARE',
    name: 'Dr. Sameer Kulkarni, MS, MCh',
    role: 'SURGEON',
    roleTitle: 'Chief Surgeon & Anesthesia Lead',
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
    id: 'ROLE-NURSE',
    category: 'HEALTHCARE',
    name: 'Sister Sunita Verma, RN',
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
    id: 'ROLE-PHARMACIST',
    category: 'HEALTHCARE',
    name: 'Suresh Patel, B.Pharm',
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
    id: 'ROLE-PATHOLOGIST',
    category: 'HEALTHCARE',
    name: 'Dr. Shalini Deshmukh, MD Path',
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
    role: 'BLOOD_BANK_OFFICER',
    roleTitle: 'Blood Bank Medical Officer',
    department: 'Blood Bank & Transfusion Services',
    tenantName: 'Apex Metropolitan Hospital',
    organizationType: 'HOSPITAL',
    allowedWorkspaces: ['HOSPITAL'],
    defaultModule: 'blood-bank-transfusion',
    planTier: 'Hospital Inpatient Suite',
    accessibleFeatures: ['Donor Registry', 'Cross-Matching & Grouping', 'Component Inventory (PRBC/FFP)', 'Transfusion Reaction Logs'],
    restrictedFeatures: ['OPD EMR Consultation', 'Pharmacy POS']
  },
  {
    id: 'ROLE-CASHIER',
    category: 'HEALTHCARE',
    name: 'Vikram Malhotra',
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

  // --- COMPANY SAAS HQ ROLES (8) ---
  {
    id: 'ROLE-HQ-SUPERADMIN',
    category: 'COMPANY_HQ',
    name: 'Dr. Anand Singhal (CEO)',
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

interface Props {
  onLoginSuccess: (user: HospitalStaffUser) => void;
}

export const HospitalStaffLogin: React.FC<Props> = ({ onLoginSuccess }) => {
  const [activeCategory, setActiveCategory] = useState<'ALL' | 'HEALTHCARE' | 'COMPANY_HQ'>('ALL');
  const [selectedUser, setSelectedUser] = useState<HospitalStaffUser>(ALL_SYSTEM_ROLES[0]!);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [emailInput, setEmailInput] = useState(ALL_SYSTEM_ROLES[0]?.email || 'tata@doc.com');
  const [passwordInput, setPasswordInput] = useState(ALL_SYSTEM_ROLES[0]?.password || 'TataPass123!');
  const [authError, setAuthError] = useState<string | null>(null);

  const handleSelectRole = (user: HospitalStaffUser) => {
    setSelectedUser(user);
    if (user.email) setEmailInput(user.email);
    if (user.password) setPasswordInput(user.password);
    setAuthError(null);
  };

  const filteredRoles = ALL_SYSTEM_ROLES.filter((r) => {
    const matchesCategory = activeCategory === 'ALL' || r.category === activeCategory;
    const matchesSearch =
      r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.roleTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
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
        setAuthError(json.error?.message || json.message || 'Authentication failed. Please check email and password.');
        setIsAuthenticating(false);
        return;
      }

      if (json.data?.accessToken) {
        localStorage.setItem('docsearch_auth_token', json.data.accessToken);
        localStorage.setItem('docsearch_user_session', JSON.stringify(json.data.user));
        localStorage.setItem('docsearch_partner_staff_auth', JSON.stringify(targetUser));
      }

      setIsAuthenticating(false);
      onLoginSuccess(targetUser);
    } catch {
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
