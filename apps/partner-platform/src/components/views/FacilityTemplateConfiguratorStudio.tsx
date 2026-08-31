import React, { useState } from 'react';
import { Card, Badge } from '@docsearch/ui-kit';

export type FacilityTemplateType =
  | 'HOSPITAL_UNIFIED'
  | 'CLINIC_STANDALONE'
  | 'PHARMACY_STANDALONE'
  | 'PATHOLOGY_LAB'
  | 'DIAGNOSTIC_CENTRE';

export interface FacilityTemplateDefinition {
  id: FacilityTemplateType;
  title: string;
  category: string;
  icon: string;
  badgeColor: string;
  description: string;
  suitableFor: string;
  includedModules: { name: string; icon: string; desc: string }[];
  crossFacilityWorkflow: string;
  pricingPlan: string;
}

interface Props {
  currentTemplate?: FacilityTemplateType;
  onApplyTemplate?: (template: FacilityTemplateType) => void;
}

export const FacilityTemplateConfiguratorStudio: React.FC<Props> = ({
  currentTemplate = 'HOSPITAL_UNIFIED',
  onApplyTemplate
}) => {
  const [selectedTemplate, setSelectedTemplate] = useState<FacilityTemplateType>(currentTemplate);
  const [appliedMsg, setAppliedMsg] = useState<string | null>(null);

  const templates: Record<FacilityTemplateType, FacilityTemplateDefinition> = {
    HOSPITAL_UNIFIED: {
      id: 'HOSPITAL_UNIFIED',
      title: 'Unified Multi-Specialty Hospital (All-in-One Combined Panel)',
      category: 'Inpatient & Tertiary Network',
      icon: '🏥',
      badgeColor: '#3B82F6',
      description: 'Complete centralized HIS/EHR connecting OPD, IPD Bed Census, OT, ER, Pharmacy, Pathology, Radiology, TPA Claims, and Cashier billing in one unified system.',
      suitableFor: '50-1000+ Bed Hospitals, Nursing Homes, Medical Colleges & Hospital Chains',
      includedModules: [
        { name: 'IPD ADT Bed Matrix & Nursing Flowsheets', icon: '🛏️', desc: 'Live ward census, transfers, daily vitals, discharge summaries' },
        { name: 'OPD Consultation & Ambient AI Scribe', icon: '🩺', desc: 'Smart SOAP, ICD-10 coding, specialty EMR copilot' },
        { name: 'Emergency & Trauma Triage (ER)', icon: '🚨', desc: 'Red/Yellow/Green triage, crash cart tracking, rapid admission' },
        { name: 'In-House Pharmacy & Barcode Dispensing', icon: '💊', desc: 'Real-time doctor Rx fulfillment, batch expiry, DDI check' },
        { name: 'In-House Pathology & Radiology LIMS/PACS', icon: '🧪', desc: 'Sample tracking, bi-directional analyzer sync, DICOM viewer' },
        { name: 'TPA Cashless Claims & NHCX Gate', icon: '🩻', desc: 'IRDAI FHIR pre-auth, AI approval predictor, 0-deduction scrub' },
        { name: 'Instant Multi-Party UPI Split Cashier POS', icon: '⚡', desc: 'Auto-splits fees to doctor, hospital, and platform accounts' },
        { name: 'ABDM 2.0 1-Second Scan & Share Kiosk', icon: '🇮🇳', desc: 'Zero-typing fast-track OPD token standee QR with HIE-CM' }
      ],
      crossFacilityWorkflow: 'Unified Internal Flow: Doctor prescribes on OPD desk -> Lab & Pharmacy receive orders automatically -> Nurse administers -> Billing consolidates into a single invoice.',
      pricingPlan: '₹9,999 / mo (Hospital Suite)'
    },
    CLINIC_STANDALONE: {
      id: 'CLINIC_STANDALONE',
      title: 'Doctor Clinic & Polyclinic (Focused OPD Panel)',
      category: 'Outpatient Practice',
      icon: '🩺',
      badgeColor: '#06B6D4',
      description: 'Streamlined doctor consulting desk optimized for lightning-fast 3-minute consultations, acoustic voice prescriptions, and zero-paperwork queue management.',
      suitableFor: 'Individual Doctors, General Physicians, Pediatricians, Specialists & Polyclinics',
      includedModules: [
        { name: 'Specialty-Adaptive Doctor EMR Desk', icon: '🩺', desc: 'Pediatric dosing, Eye refraction, Ortho ROM, Dental FDI chart' },
        { name: 'Ambient AI Voice Scribe (Hinglish/English)', icon: '🎙️', desc: 'Converts doctor-patient speech into structured SOAP notes' },
        { name: 'Patient Queue & Smart Waiting Room IoT', icon: '📡', desc: 'Bluetooth BP/SpO2 streaming straight to doctor queue' },
        { name: 'Real-Time DDI & Jan Aushadhi Generic Finder', icon: '💊', desc: 'Lethal contraindication defense & 90% patient cost savings' },
        { name: 'Dynamic UPI QR Counter POS', icon: '⚡', desc: 'Direct patient QR scan with instant doctor bank credit' },
        { name: 'ABDM Scan & Share Standee Kiosk', icon: '🇮🇳', desc: '1-second patient check-in via Aarogya Setu / ABHA' }
      ],
      crossFacilityWorkflow: 'External Ecosystem Flow: Doctor creates Rx -> Patient gets WhatsApp PDF Rx -> Refers to partner Lab/Chemist via DocSearch Care Pass.',
      pricingPlan: '₹1,999 / mo (Solo Clinic)'
    },
    PHARMACY_STANDALONE: {
      id: 'PHARMACY_STANDALONE',
      title: 'Retail Pharmacy & Chemist Shop (Pharmacy POS Panel)',
      category: 'Retail & Chain Pharmacy',
      icon: '💊',
      badgeColor: '#10B981',
      description: 'Fast-paced retail pharmacy counter system with barcode scanning, batch expiry tracking, Schedule H1 drug register, and Jan Aushadhi generic substitution.',
      suitableFor: 'Retail Chemists, Medical Stores, Hospital Outlets, Pharmacy Chains',
      includedModules: [
        { name: 'Fast Pharmacy POS Billing Counter', icon: '🧾', desc: 'Thermal receipt printing, barcode lookup, GST tax invoicing' },
        { name: 'Inventory, Batch & Near-Expiry Radar', icon: '📦', desc: 'Auto-alerts on expiring batches, dead-stock clearance' },
        { name: 'Drug Interaction (DDI) Counter Shield', icon: '⚠️', desc: 'Alerts chemist if customer buys conflicting OTC medications' },
        { name: 'Pradhan Mantri Jan Aushadhi (PMBJP) Finder', icon: '🇮🇳', desc: 'Offers customers cheaper generic alternatives instantly' },
        { name: 'Supplier Purchase Order & GRN Inwarding', icon: '🚚', desc: 'Wholesaler purchase inwarding with automatic stock replenishment' },
        { name: 'Dynamic UPI QR & WhatsApp Bill Pass', icon: '📲', desc: 'Paperless bill dispatch directly to customer smartphone' }
      ],
      crossFacilityWorkflow: 'Standalone Commerce Flow: Chemist scans digital Rx or enters walk-in customer -> System validates drug safety -> Instant UPI payment -> Automated stock deduction.',
      pricingPlan: '₹1,499 / mo (Retail Pharmacy)'
    },
    PATHOLOGY_LAB: {
      id: 'PATHOLOGY_LAB',
      title: 'Pathology & Diagnostic Laboratory (LIMS Panel)',
      category: 'Diagnostic LIMS',
      icon: '🧪',
      badgeColor: '#8B5CF6',
      description: 'Complete Laboratory Information Management System (LIMS) with phlebotomy sample barcoding, bi-directional analyzer interfacing, and NABL-compliant reporting.',
      suitableFor: 'Independent Pathology Labs, Blood Testing Centres, Hospital Diagnostic Wings',
      includedModules: [
        { name: 'Phlebotomy Sample Collection & Barcode Intake', icon: '🏷️', desc: 'Vacutainer barcode generation, home collection route planning' },
        { name: 'Bi-Directional Machine & Analyzer Interfacing', icon: '🔬', desc: 'ASTM/HL7 auto-sync with Beckman, Roche, Sysmex machines' },
        { name: 'Multi-Parameter Parameter Master (600+ Tests)', icon: '📋', desc: 'CBC, LFT, KFT, Lipid, HbA1c, Thyroid, Urine, Culture' },
        { name: 'Pathologist Digital Sign-Off & Critical Alerts', icon: '✍️', desc: 'Red-alert panic value SMS/Call notifications to consulting doctor' },
        { name: 'Automated WhatsApp PDF Report Delivery', icon: '📲', desc: 'Direct encrypted report dispatch with QR verification' },
        { name: 'B2B Referral Doctor Commission & UPI Settle', icon: '⚡', desc: 'Automated referral partner ledger and instant payouts' }
      ],
      crossFacilityWorkflow: 'Sample-to-Report Flow: Phlebotomist collects blood -> Analyzer tests sample -> Pathologist approves digital report -> Auto-sent to patient on WhatsApp.',
      pricingPlan: '₹2,499 / mo (Pathology LIMS)'
    },
    DIAGNOSTIC_CENTRE: {
      id: 'DIAGNOSTIC_CENTRE',
      title: 'Radiology & Imaging Centre (PACS / Diagnostic Panel)',
      category: 'Imaging & Diagnostics',
      icon: '🩻',
      badgeColor: '#F59E0B',
      description: 'High-performance radiology and diagnostic workflow with DICOM imaging PACS viewer, ultrasound/CT/MRI modality scheduling, and structured reporting.',
      suitableFor: 'Ultrasound Clinics, X-Ray Centres, MRI/CT Diagnostic Networks, Polydiagnostic Hubs',
      includedModules: [
        { name: 'Zero-Footprint Web DICOM Viewer (PACS)', icon: '🖼️', desc: 'Multi-planar reconstruction (MPR), windowing, zoom, pan in browser' },
        { name: 'Modality Scheduler (X-Ray, USG, CT, MRI)', icon: '📅', desc: 'Time slot reservation, preparation guidelines dispatch' },
        { name: 'Radiologist Voice-Driven Structured Reporting', icon: '🎙️', desc: 'BI-RADS, Lung-RADS, and template-based speech reporting' },
        { name: 'DICOM Worklist (MWL) & Modality Sync', icon: '📡', desc: 'Sends patient demographics directly to GE, Siemens, Philips machines' },
        { name: 'Pre-Auth TPA Cashless & Estimation', icon: '💳', desc: 'Direct insurance clearance for high-value MRI/CT scans' },
        { name: 'Cloud Patient Health Record (PHR) Portal', icon: '☁️', desc: 'Patients view high-resolution scans and reports on any device' }
      ],
      crossFacilityWorkflow: 'Imaging Flow: Patient arrives for scan -> Modality receives worklist -> Radiologist dictates report in DICOM viewer -> Patient receives cloud DICOM link.',
      pricingPlan: '₹3,499 / mo (Diagnostic Hub)'
    }
  };

  const active = templates[selectedTemplate];

  const handleApply = (key: FacilityTemplateType) => {
    setSelectedTemplate(key);
    if (onApplyTemplate) {
      onApplyTemplate(key);
    }
    setAppliedMsg(`Facility layout successfully transformed into "${templates[key].title}"!`);
    setTimeout(() => setAppliedMsg(null), 4000);
  };

  return (
    <Card padding="md" style={{ border: '2px solid #06B6D4', backgroundColor: '#0B132B', borderRadius: '16px' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '12px', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '1.75rem' }}>🗂️</span>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 900, color: '#F8FAFC' }}>
                Multi-Facility Architecture & Template Configurator
              </h3>
              <Badge variant="primary">Standalone vs Combined Hub</Badge>
            </div>
            <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
              Select standalone templates for Clinics, Pharmacies, Labs, and Diagnostics OR deploy the Combined Super-Hospital Suite
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <Badge variant="success">⚡ 1-Click UI Restructure</Badge>
          <Badge variant="neutral">Multi-Tenant Dynamic Scope</Badge>
        </div>
      </div>

      {appliedMsg && (
        <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.2)', border: '1.5px solid #10B981', borderRadius: '10px', padding: '10px 14px', color: '#A7F3D0', fontSize: '0.8125rem', fontWeight: 700, marginBottom: '14px' }}>
          ✓ {appliedMsg}
        </div>
      )}

      {/* 5 Template Option Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px', marginBottom: '16px' }}>
        {Object.values(templates).map((t) => {
          const isSelected = selectedTemplate === t.id;
          return (
            <div
              key={t.id}
              onClick={() => handleApply(t.id)}
              style={{
                backgroundColor: isSelected ? 'rgba(6, 182, 212, 0.15)' : 'rgba(30, 41, 59, 0.6)',
                border: isSelected ? '2px solid #06B6D4' : '1px solid rgba(255,255,255,0.08)',
                borderRadius: '12px',
                padding: '12px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <span style={{ fontSize: '1.5rem' }}>{t.icon}</span>
                  {isSelected && <span style={{ fontSize: '0.625rem', backgroundColor: '#06B6D4', color: '#070C16', padding: '2px 6px', borderRadius: '4px', fontWeight: 900 }}>ACTIVE</span>}
                </div>
                <strong style={{ fontSize: '0.8125rem', color: '#F8FAFC', display: 'block' }}>
                  {t.title.split('(')[0]}
                </strong>
                <span style={{ fontSize: '0.6875rem', color: '#94A3B8', marginTop: '2px', display: 'block' }}>
                  {t.category}
                </span>
              </div>

              <div style={{ marginTop: '8px', fontSize: '0.6875rem', color: '#38BDF8', fontWeight: 700 }}>
                {t.pricingPlan}
              </div>
            </div>
          );
        })}
      </div>

      {/* Active Selected Template Deep-Dive */}
      <div style={{ backgroundColor: 'rgba(30, 41, 59, 0.6)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '14px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
        
        {/* Template Title & Suitable For */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '1.5rem' }}>{active.icon}</span>
              <h4 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 800, color: '#F8FAFC' }}>
                {active.title}
              </h4>
            </div>
            <p style={{ margin: '4px 0 0', fontSize: '0.75rem', color: '#CBD5E1' }}>
              {active.description}
            </p>
          </div>

          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '0.6875rem', color: '#94A3B8', display: 'block' }}>Best Suited For:</span>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#A7F3D0' }}>{active.suitableFor}</span>
          </div>
        </div>

        {/* Modules List for this specific template */}
        <div>
          <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#38BDF8', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>
            📦 Included Dedicated Modules ({active.includedModules.length} Active in Panel):
          </span>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '10px' }}>
            {active.includedModules.map((m, i) => (
              <div key={i} style={{ backgroundColor: '#0F172A', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px', padding: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>{m.icon}</span>
                  <strong style={{ fontSize: '0.75rem', color: '#F8FAFC' }}>{m.name}</strong>
                </div>
                <p style={{ margin: '4px 0 0', fontSize: '0.6875rem', color: '#94A3B8', lineHeight: 1.3 }}>
                  {m.desc}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Cross-Facility Workflow Information */}
        <div style={{ backgroundColor: 'rgba(6, 182, 212, 0.1)', border: '1px solid rgba(6, 182, 212, 0.3)', borderRadius: '10px', padding: '10px 14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
            <span style={{ fontSize: '0.875rem' }}>🔄</span>
            <strong style={{ fontSize: '0.75rem', color: '#38BDF8' }}>Inter-Facility Data & Order Routing:</strong>
          </div>
          <p style={{ margin: 0, fontSize: '0.75rem', color: '#E2E8F0', lineHeight: 1.4 }}>
            {active.crossFacilityWorkflow}
          </p>
        </div>

      </div>
    </Card>
  );
};
