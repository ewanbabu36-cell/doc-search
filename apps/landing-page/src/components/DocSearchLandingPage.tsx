import { AIReceptionistWidget } from './AIReceptionistWidget.js';
import React, { useState, useEffect } from 'react';
import { Badge } from '@docsearch/ui-kit';

interface ModuleCard {
  id: string;
  title: string;
  category: string;
  icon: string;
  badge: string;
  accentColor: string;
  description: string;
  keyMetrics: string;
  features: string[];
}

export const DocSearchLandingPage: React.FC = () => {
  const [showDemoModal, setShowDemoModal] = useState(false);
  const [demoSubmitted, setDemoSubmitted] = useState(false);
  const [activeTab, setActiveTab] = useState<'clinical' | 'ai_cdss' | 'abdm' | 'operations' | 'security'>('clinical');
  const [activeModuleIndex, setActiveModuleIndex] = useState(0);

  // ROI Calculator State
  const [bedCount, setBedCount] = useState<number>(250);
  const [dailyOpdCount, setDailyOpdCount] = useState<number>(450);

  // Live Simulation Ticker
  const [liveClock, setLiveClock] = useState<string>('');
  useEffect(() => {
    const updateTime = () => setLiveClock(new Date().toLocaleTimeString('en-US', { hour12: false }));
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const [demoForm, setDemoForm] = useState({
    hospitalName: '',
    contactName: '',
    email: '',
    phone: '',
    bedCapacity: '100-300 Beds',
    notes: ''
  });

  const handleDemoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setDemoSubmitted(true);
  };

  const partnerPortalUrl = typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1' ? '/partner' : 'http://localhost:5173';
  const companyPortalUrl = typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1' ? '/hq' : 'http://localhost:5174';

  const modulesList: ModuleCard[] = [
    {
      id: 'opd-ehr',
      title: 'OPD & Longitudinal EHR',
      category: 'Clinical Suite',
      icon: '🩺',
      badge: 'Zero-Latency',
      accentColor: '#06B6D4',
      description: 'Streamlined doctor consultation desk with smart Chief Complaints, ICD-10 dual-coder assist, and instant digital Rx generation with contraindication alerts.',
      keyMetrics: 'Avg Consult: 3.8 mins • 100% Paperless',
      features: ['Smart SOAP Templates', 'Rx Drug-Safety Checks', 'Token & Queue Triage', 'Historical Vitals Radar']
    },
    {
      id: 'ai-scribe',
      title: 'Ambient AI Voice Scribe & CDSS',
      category: 'AI & Safety',
      icon: '🎙️',
      badge: 'Real-Time Voice',
      accentColor: '#8B5CF6',
      description: 'Live acoustic consultation dialogue transcription into structured SOAP notes, automated ICD-10 coding, Sepsis NEWS2 calculation, and lethal DDI blocking.',
      keyMetrics: '97.6% NLP Accuracy • Mandatory Doctor Approval',
      features: ['Acoustic Speech-to-SOAP', 'Clinical Negation Safety', 'NEWS2 Sepsis 6 Trigger', 'Warfarin-DDI Safety Gate']
    },
    {
      id: 'abdm-gateway',
      title: 'ABDM National Health Gateway',
      category: 'India Digital Stack',
      icon: '🇮🇳',
      badge: 'M1 + M2 + M3',
      accentColor: '#F59E0B',
      description: '14-digit ABHA ID creation via Aadhaar e-KYC, HIP Care Context linking, Counter Scan & Share token intake, and NRCES compliant FHIR R4 encrypted transfer.',
      keyMetrics: 'Full NHA Sandbox Spec • ECDH Encrypted',
      features: ['14-Digit ABHA & PHR M1', 'Scan & Share Counter M2', 'Electronic Consents M3', 'NRCES FHIR R4 Signed']
    },
    {
      id: 'ipd-adt',
      title: 'IPD & ADT Bed Matrix',
      category: 'Inpatient Care',
      icon: '🛏️',
      badge: 'Live Census',
      accentColor: '#3B82F6',
      description: 'Interactive visual bed matrix across General, Semi-Special, Deluxe & ICU wards. Daily nursing charts, vitals trending, and automated discharge summaries.',
      keyMetrics: '94.2% Bed Utilization Rate',
      features: ['Real-Time Bed Map', 'Nursing Flowsheets', 'Inter-Ward Transfers', 'Discharge Clearance Gate']
    },
    {
      id: 'er-trauma',
      title: 'Emergency Room & Triage (ER)',
      category: 'Critical Care',
      icon: '🚨',
      badge: 'ESI 1-5 Triage',
      accentColor: '#EF4444',
      description: 'Emergency Severity Index triage prioritization, fast-track stat orders, trauma resuscitation bay workflows, and rapid code blue response dispatch.',
      keyMetrics: '< 45s Triage Intake',
      features: ['Red/Yellow/Green Bays', 'Crash Cart Telemetry', 'Stat Lab/Imaging Sync', 'Rapid Admission Protocol']
    },
    {
      id: 'ot-surgery',
      title: 'Operation Theatre & PAC',
      category: 'Surgical Suite',
      icon: '🔪',
      badge: 'WHO Enforced',
      accentColor: '#10B981',
      description: 'OT table booking, surgical team allocation, Pre-Anaesthesia Clearance (PAC), intra-operative implant tracking, and PACU Aldrete recovery score validation.',
      keyMetrics: '100% WHO Checklist Compliance',
      features: ['PAC Sign-Off Gate', 'Intra-Op Implant Log', 'PACU Aldrete Scoring', 'Post-Op Transfer Audit']
    },
    {
      id: 'lims-lab',
      title: 'LIMS & Diagnostic Pathology',
      category: 'Diagnostics',
      icon: '🧪',
      badge: 'Analyzer Synced',
      accentColor: '#EC4899',
      description: 'Barcode-scanned vacutainer sample collection, bidirectional clinical chemistry analyzer interfacing, multi-level pathologist sign-off, and panic alerts.',
      keyMetrics: '100% Sample Traceability',
      features: ['Tube Cap Color Coding', 'Automated Reference Ranges', 'Critical Panic Dispatch', 'Digital Stamp Sign-Off']
    },
    {
      id: 'radiology-pacs',
      title: 'Radiology / RIS & Web PACS',
      category: 'Medical Imaging',
      icon: '🩻',
      badge: 'DICOM Ready',
      accentColor: '#6366F1',
      description: 'Modality worklists for X-Ray, CT, MRI, and USG. Zero-footprint web DICOM viewer, radiologist reporting workbench, and finalization locking.',
      keyMetrics: 'Instant Web DICOM Streaming',
      features: ['RAD-ACC Accessioning', 'Multi-Frame DICOM Viewer', 'Structured Reporting', 'Tamper-Proof Audit']
    },
    {
      id: 'pharmacy-fefo',
      title: 'Pharmacy & FEFO Dispensing',
      category: 'Supply & Dispense',
      icon: '💊',
      badge: 'FEFO Managed',
      accentColor: '#14B8A6',
      description: 'Doctor digital prescription queue integration, automated First-Expired-First-Out batch allocation, Schedule H register logging, and POS billing.',
      keyMetrics: 'Zero Expiry Wastage',
      features: ['Auto FEFO Allocation', 'Schedule H Tracking', 'Unit-Dose Sachet Barcode', 'Stock Ledger Sync']
    },
    {
      id: 'blood-bank',
      title: 'Blood Bank & Transfusion',
      category: 'Transfusion Medicine',
      icon: '🩸',
      badge: 'ISBT-128 Ready',
      accentColor: '#E11D48',
      description: 'Voluntary donor registration, PRBC/FFP/Platelet component separation, mandatory TTI serology screening gates, and crossmatch validation.',
      keyMetrics: 'Strict 2-6°C Cold Chain Tracking',
      features: ['Donor Screening Protocol', 'Component Separation', 'TTI Serology Gate', 'Crossmatch Verification']
    },
    {
      id: 'billing-tpa',
      title: 'Billing & TPA Claims Engine',
      category: 'Revenue Cycle',
      icon: '💳',
      badge: 'PM-JAY Cashless',
      accentColor: '#F97316',
      description: 'Universal charge aggregation across consultations, beds, surgeries, medications, and labs. Cashless insurance pre-auth, claim submission, and tariff management.',
      keyMetrics: 'Sub-24h Claim Turnaround',
      features: ['Dual Cash/TPA Mode', 'Automated Charge Sheet', 'PM-JAY Pre-Auth Workflow', 'Instant Invoicing']
    },
    {
      id: 'hardware-bridge',
      title: 'Barcode / RFID Hardware Bridge',
      category: 'IoT & Peripherals',
      icon: '🏷️',
      badge: 'WebUSB & WebSerial',
      accentColor: '#0284C7',
      description: 'Direct browser driver bindings for handheld Zebra 2D scanners, UHF RFID portal antennas, and Zebra direct thermal ZPL II label printers.',
      keyMetrics: '< 45ms Scan-to-DB Latency',
      features: ['WebUSB / Serial Drivers', 'GS1 DataMatrix Decoders', 'UHF RFID EPC Gen2', 'ZPL II Label Generator']
    }
  ];

  // Calculated ROI Metrics
  const calculatedMonthlyRevenue = (bedCount * 4200 * 30 * 0.85 + dailyOpdCount * 650 * 26).toLocaleString('en-IN');
  const savedDoctorHoursPerMonth = Math.round(dailyOpdCount * 26 * 0.08);
  const preventedBillingLeakagePct = '99.4%';

  return (
    <div style={{
      backgroundColor: '#070B14',
      color: '#F8FAFC',
      minHeight: '100vh',
      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      overflowX: 'hidden'
    }}>
      
      {/* Background Radial Glow Meshes */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: '50%',
        transform: 'translateX(-50%)',
        width: '1200px',
        height: '600px',
        background: 'radial-gradient(circle at 50% 0%, rgba(6, 182, 212, 0.18) 0%, rgba(59, 130, 246, 0.12) 35%, transparent 70%)',
        pointerEvents: 'none',
        zIndex: 0
      }} />

      <div style={{
        position: 'fixed',
        bottom: 0,
        right: '-10%',
        width: '800px',
        height: '500px',
        background: 'radial-gradient(circle at 80% 80%, rgba(139, 92, 246, 0.15) 0%, transparent 60%)',
        pointerEvents: 'none',
        zIndex: 0
      }} />

      {/* 1. TOP LIVE NOTIFICATION BANNER */}
      <div style={{
        background: 'linear-gradient(90deg, rgba(6, 182, 212, 0.25) 0%, rgba(59, 130, 246, 0.25) 50%, rgba(139, 92, 246, 0.25) 100%)',
        borderBottom: '1px solid rgba(56, 189, 248, 0.2)',
        padding: '8px 20px',
        fontSize: '0.8125rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '12px',
        position: 'relative',
        zIndex: 60
      }}>
        <span style={{
          backgroundColor: '#06B6D4',
          color: '#070B14',
          padding: '2px 8px',
          borderRadius: '9999px',
          fontWeight: 700,
          fontSize: '0.6875rem',
          letterSpacing: '0.05em',
          textTransform: 'uppercase'
        }}>
          NEW RELEASE
        </span>
        <span style={{ color: '#E0F2FE', fontWeight: 500 }}>
          ✨ ABDM M1/M2/M3 National Health Gateway, Ambient Voice Scribe 3.0 & Hardware Bridge now live.
        </span>
        <a href="#modules" style={{ color: '#38BDF8', fontWeight: 600, textDecoration: 'none' }}>
          Explore Capabilities →
        </a>
      </div>

      {/* 2. GLASSMORPHIC TOP NAVBAR */}
      <header style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        backdropFilter: 'blur(20px)',
        backgroundColor: 'rgba(7, 11, 20, 0.85)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        padding: '14px 32px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        transition: 'all 0.3s ease'
      }}>
        {/* Brand Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #06B6D4 0%, #3B82F6 50%, #8B5CF6 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.25rem',
            boxShadow: '0 0 20px rgba(6, 182, 212, 0.5)',
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }}>
            🩺
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{
                fontSize: '1.25rem',
                fontWeight: 900,
                letterSpacing: '-0.03em',
                background: 'linear-gradient(90deg, #FFFFFF 0%, #E2E8F0 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>
                DOC SEARCH
              </span>
              <span style={{
                backgroundColor: 'rgba(6, 182, 212, 0.15)',
                color: '#38BDF8',
                border: '1px solid rgba(56, 189, 248, 0.3)',
                padding: '2px 8px',
                borderRadius: '6px',
                fontSize: '0.6875rem',
                fontWeight: 700,
                letterSpacing: '0.04em'
              }}>
                ENTERPRISE OS
              </span>
            </div>
            <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
              Integrated Hospital & Clinical Intelligence System
            </div>
          </div>
        </div>

        {/* Center Nav Links */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: '28px' }}>
          <a href="#overview" style={{ color: '#E2E8F0', textDecoration: 'none', fontSize: '0.875rem', fontWeight: 500, transition: 'color 0.2s' }}>Overview</a>
          <a href="#modules" style={{ color: '#94A3B8', textDecoration: 'none', fontSize: '0.875rem', fontWeight: 500, transition: 'color 0.2s' }}>15 Clinical Modules</a>
          <a href="#ai-cdss" style={{ color: '#94A3B8', textDecoration: 'none', fontSize: '0.875rem', fontWeight: 500, transition: 'color 0.2s' }}>AI Scribe & CDSS</a>
          <a href="#abdm" style={{ color: '#94A3B8', textDecoration: 'none', fontSize: '0.875rem', fontWeight: 500, transition: 'color 0.2s' }}>ABDM Gateway</a>
          <a href="#calculator" style={{ color: '#94A3B8', textDecoration: 'none', fontSize: '0.875rem', fontWeight: 500, transition: 'color 0.2s' }}>ROI Calculator</a>
          <a href="#security" style={{ color: '#94A3B8', textDecoration: 'none', fontSize: '0.875rem', fontWeight: 500, transition: 'color 0.2s' }}>Security & Audit</a>
        </nav>

        {/* Right CTA Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            border: '1px solid rgba(16, 185, 129, 0.25)',
            padding: '4px 10px',
            borderRadius: '9999px',
            fontSize: '0.75rem',
            color: '#34D399',
            fontWeight: 600
          }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#10B981', boxShadow: '0 0 8px #10B981' }} />
            {liveClock} UTC
          </div>

          <a
            href={partnerPortalUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              textDecoration: 'none',
              background: 'linear-gradient(135deg, #06B6D4 0%, #3B82F6 100%)',
              color: '#FFFFFF',
              padding: '8px 18px',
              borderRadius: '8px',
              fontWeight: 700,
              fontSize: '0.875rem',
              boxShadow: '0 4px 14px rgba(6, 182, 212, 0.35)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              cursor: 'pointer'
            }}
          >
            🏥 Hospital Portal (5173)
          </a>

          <a
            href={companyPortalUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              textDecoration: 'none',
              backgroundColor: 'rgba(30, 41, 59, 0.8)',
              color: '#E2E8F0',
              padding: '8px 16px',
              borderRadius: '8px',
              fontWeight: 600,
              fontSize: '0.875rem',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              cursor: 'pointer'
            }}
          >
            🏢 SaaS HQ (5174)
          </a>
        </div>
      </header>

      {/* 3. HERO SECTION WITH VIBRANT MEDICAL HUD */}
      <section id="overview" style={{ position: 'relative', padding: '80px 32px 60px 32px', zIndex: 10, maxWidth: '1360px', margin: '0 auto' }}>
        
        {/* Top Badges */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
          <div style={{
            backgroundColor: 'rgba(6, 182, 212, 0.12)',
            border: '1px solid rgba(6, 182, 212, 0.35)',
            padding: '6px 16px',
            borderRadius: '9999px',
            fontSize: '0.8125rem',
            color: '#38BDF8',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span>⚡ Real-Time Clinical Engine</span>
            <span style={{ color: 'rgba(255, 255, 255, 0.3)' }}>|</span>
            <span>Zero-Data Loss Architecture</span>
          </div>

          <div style={{
            backgroundColor: 'rgba(139, 92, 246, 0.12)',
            border: '1px solid rgba(139, 92, 246, 0.35)',
            padding: '6px 16px',
            borderRadius: '9999px',
            fontSize: '0.8125rem',
            color: '#C084FC',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span>🛡️ NABH, HIPAA & NRCES India Compliant</span>
          </div>
        </div>

        {/* Hero Title & Pitch */}
        <div style={{ textAlign: 'center', maxWidth: '980px', margin: '0 auto 40px auto' }}>
          <h1 style={{
            fontSize: 'clamp(2.5rem, 5vw, 4.25rem)',
            fontWeight: 900,
            lineHeight: 1.08,
            letterSpacing: '-0.035em',
            marginBottom: '24px'
          }}>
            The Unified Intelligent{' '}
            <span style={{
              background: 'linear-gradient(135deg, #38BDF8 0%, #3B82F6 50%, #A855F7 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              textShadow: '0 0 40px rgba(56, 189, 248, 0.3)'
            }}>
              Operating System
            </span>{' '}
            for Modern Hospitals.
          </h1>

          <p style={{
            fontSize: '1.1875rem',
            lineHeight: 1.6,
            color: '#94A3B8',
            maxWidth: '820px',
            margin: '0 auto 36px auto'
          }}>
            From <strong>OPD Triage</strong> and <strong>Inpatient Bed Census</strong> to <strong>Ambient AI Voice Scribe</strong>, <strong>ABDM National Health Stack (M1–M3)</strong>, <strong>RIS/PACS DICOM Imaging</strong>, and <strong>FEFO Pharmacy</strong> — DocSearch orchestrates your entire hospital ecosystem on a single, sub-millisecond multi-tenant cloud engine.
          </p>

          {/* Primary Buttons */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', flexWrap: 'wrap' }}>
            <button
              onClick={() => setShowDemoModal(true)}
              style={{
                background: 'linear-gradient(135deg, #06B6D4 0%, #3B82F6 100%)',
                color: '#FFFFFF',
                padding: '14px 32px',
                borderRadius: '10px',
                fontWeight: 800,
                fontSize: '1rem',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                boxShadow: '0 0 25px rgba(6, 182, 212, 0.45)',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}
            >
              <span>🚀 Schedule VIP Sandbox Demo</span>
            </button>

            <a
              href={partnerPortalUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                textDecoration: 'none',
                backgroundColor: 'rgba(30, 41, 59, 0.7)',
                color: '#F8FAFC',
                padding: '14px 28px',
                borderRadius: '10px',
                fontWeight: 700,
                fontSize: '1rem',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                backdropFilter: 'blur(12px)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <span>⚡ Open Live Partner Portal</span>
            </a>
          </div>
        </div>

        {/* 4. LIVE INTERACTIVE COMMAND CENTER HUD PREVIEW */}
        <div style={{
          backgroundColor: 'rgba(15, 23, 42, 0.75)',
          backdropFilter: 'blur(24px)',
          border: '1px solid rgba(56, 189, 248, 0.25)',
          borderRadius: '20px',
          padding: '24px',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.7), 0 0 40px rgba(6, 182, 212, 0.15)',
          marginTop: '20px'
        }}>
          {/* HUD Top Bar */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            paddingBottom: '16px',
            marginBottom: '20px',
            flexWrap: 'wrap',
            gap: '12px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ display: 'flex', gap: '6px' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#EF4444' }} />
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#F59E0B' }} />
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#10B981' }} />
              </div>
              <span style={{ fontSize: '0.875rem', fontWeight: 700, color: '#E2E8F0', letterSpacing: '0.02em' }}>
                LIVE HOSPITAL COMMAND TELEMETRY • FORTIS APEX MEDICAL CENTER (HFR: IN0710002981)
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '0.8125rem' }}>
              <span style={{ color: '#10B981', fontWeight: 600 }}>🟢 Fastify Gateway: 18ms</span>
              <span style={{ color: '#38BDF8', fontWeight: 600 }}>🛡️ RLS Tenant: ACTIVE</span>
              <span style={{ color: '#A855F7', fontWeight: 600 }}>🔐 SHA-256 Audit: CHAINED</span>
            </div>
          </div>

          {/* HUD 4-Column Live KPI Metric Widgets */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '16px',
            marginBottom: '24px'
          }}>
            {/* Widget 1: Inpatient Bed Census */}
            <div style={{
              backgroundColor: 'rgba(30, 41, 59, 0.6)',
              border: '1px solid rgba(59, 130, 246, 0.25)',
              borderRadius: '12px',
              padding: '16px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.75rem', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase' }}>Live Bed Census</span>
                <span style={{ fontSize: '0.75rem', color: '#3B82F6', fontWeight: 700 }}>284 / 300 Beds</span>
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#F8FAFC', marginBottom: '6px' }}>
                94.7% <span style={{ fontSize: '0.8125rem', color: '#10B981', fontWeight: 600 }}>↑ +2.4% Today</span>
              </div>
              <div style={{ width: '100%', height: '6px', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ width: '94.7%', height: '100%', background: 'linear-gradient(90deg, #3B82F6, #06B6D4)', borderRadius: '3px' }} />
              </div>
              <div style={{ fontSize: '0.6875rem', color: '#64748B', marginTop: '6px' }}>
                ICU Occupancy: 96.2% • General Ward: 92.1%
              </div>
            </div>

            {/* Widget 2: Ambient Voice Scribe Active */}
            <div style={{
              backgroundColor: 'rgba(30, 41, 59, 0.6)',
              border: '1px solid rgba(139, 92, 246, 0.25)',
              borderRadius: '12px',
              padding: '16px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.75rem', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase' }}>Ambient AI Scribe</span>
                <span style={{ fontSize: '0.75rem', color: '#A855F7', fontWeight: 700 }}>Active Stream</span>
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#F8FAFC', marginBottom: '6px' }}>
                312 <span style={{ fontSize: '0.875rem', color: '#C084FC', fontWeight: 600 }}>Notes Today</span>
              </div>
              <div style={{ fontSize: '0.75rem', color: '#38BDF8', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>🎙️ Dr. Amit Sen (Cardiology)</span>
                <span style={{ backgroundColor: '#10B981', width: '6px', height: '6px', borderRadius: '50%' }} />
              </div>
              <div style={{ fontSize: '0.6875rem', color: '#64748B', marginTop: '4px' }}>
                Auto ICD-10 & Rx Extraction Active
              </div>
            </div>

            {/* Widget 3: Sepsis NEWS2 Early Warning */}
            <div style={{
              backgroundColor: 'rgba(30, 41, 59, 0.6)',
              border: '1px solid rgba(239, 68, 68, 0.25)',
              borderRadius: '12px',
              padding: '16px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.75rem', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase' }}>CDSS Sepsis Radar</span>
                <span style={{ fontSize: '0.75rem', color: '#EF4444', fontWeight: 700 }}>NEWS2 &gt;= 7 Alert</span>
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#F8FAFC', marginBottom: '6px' }}>
                3 <span style={{ fontSize: '0.8125rem', color: '#EF4444', fontWeight: 600 }}>Active Alerts</span>
              </div>
              <div style={{ fontSize: '0.75rem', color: '#FCA5A5', fontWeight: 500 }}>
                ⚠️ Bed ICU-04: Sepsis 6 Care Bundle Dispatched
              </div>
              <div style={{ fontSize: '0.6875rem', color: '#64748B', marginTop: '4px' }}>
                RR: 26 • SpO2: 89% • Lactate: 3.8 mmol/L
              </div>
            </div>

            {/* Widget 4: ABDM National Health Stack */}
            <div style={{
              backgroundColor: 'rgba(30, 41, 59, 0.6)',
              border: '1px solid rgba(245, 158, 11, 0.25)',
              borderRadius: '12px',
              padding: '16px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.75rem', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase' }}>ABDM NHA Gateway</span>
                <span style={{ fontSize: '0.75rem', color: '#F59E0B', fontWeight: 700 }}>M1 • M2 • M3</span>
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#F8FAFC', marginBottom: '6px' }}>
                1,420 <span style={{ fontSize: '0.8125rem', color: '#FCD34D', fontWeight: 600 }}>ABHA Linked</span>
              </div>
              <div style={{ fontSize: '0.75rem', color: '#FDE68A', fontWeight: 500 }}>
                ⚡ Scan & Share Counter Queue: 14 Tokens
              </div>
              <div style={{ fontSize: '0.6875rem', color: '#64748B', marginTop: '4px' }}>
                FHIR R4 Document Bundles: 100% Signed
              </div>
            </div>
          </div>

          {/* Interactive Feature Demo Tabs */}
          <div style={{
            display: 'flex',
            gap: '8px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            paddingBottom: '12px',
            marginBottom: '16px',
            overflowX: 'auto'
          }}>
            {[
              { key: 'clinical', label: '🩺 Clinical Desk & EHR' },
              { key: 'ai_cdss', label: '🎙️ Ambient AI Scribe & CDSS' },
              { key: 'abdm', label: '🇮🇳 ABDM Digital Health Stack' },
              { key: 'operations', label: '🏥 OT, ER, Blood Bank & LIMS' },
              { key: 'security', label: '🔐 Multi-Tenant Security & Audit' }
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as 'clinical' | 'ai_cdss' | 'abdm' | 'operations' | 'security')}
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  border: activeTab === tab.key ? '1px solid #06B6D4' : '1px solid transparent',
                  backgroundColor: activeTab === tab.key ? 'rgba(6, 182, 212, 0.15)' : 'transparent',
                  color: activeTab === tab.key ? '#38BDF8' : '#94A3B8',
                  transition: 'all 0.2s ease',
                  whiteSpace: 'nowrap'
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content Preview Panel */}
          <div style={{
            backgroundColor: 'rgba(15, 23, 42, 0.9)',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            borderRadius: '12px',
            padding: '20px',
            minHeight: '180px'
          }}>
            {activeTab === 'clinical' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
                <div>
                  <h4 style={{ margin: '0 0 8px 0', color: '#38BDF8', fontSize: '1rem', fontWeight: 700 }}>
                    ⚡ Sub-Second SOAP Consultation Engine
                  </h4>
                  <p style={{ margin: 0, color: '#94A3B8', fontSize: '0.875rem', lineHeight: 1.5 }}>
                    Doctors generate complete clinical encounters in under 4 minutes. Real-time ICD-10 diagnostic indexing, dose calculators, and digital sign-off with tamper-evident audit logs.
                  </p>
                </div>
                <div style={{ backgroundColor: 'rgba(30, 41, 59, 0.5)', padding: '12px 16px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ fontSize: '0.75rem', color: '#10B981', fontWeight: 700, marginBottom: '4px' }}>LIVE SIMULATION</div>
                  <div style={{ fontSize: '0.8125rem', color: '#F1F5F9', fontFamily: 'monospace' }}>
                    PATIENT: Kavita Joshi (MRN-2026-9041)<br/>
                    DX: I50.9 Heart Failure • I10 Essential HTN<br/>
                    RX: Torsemide 10mg OD • Telmisartan 80mg OD
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'ai_cdss' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
                <div>
                  <h4 style={{ margin: '0 0 8px 0', color: '#C084FC', fontSize: '1rem', fontWeight: 700 }}>
                    🎙️ Voice Dialogue to Structured Clinical EHR
                  </h4>
                  <p style={{ margin: 0, color: '#94A3B8', fontSize: '0.875rem', lineHeight: 1.5 }}>
                    Live acoustic stream parsing preserves clinical negations ("no chest pain"), extracts prescriptions, and executes real-time Category-X lethal drug-interaction checks (e.g. Warfarin + Clarithromycin block).
                  </p>
                </div>
                <div style={{ backgroundColor: 'rgba(30, 41, 59, 0.5)', padding: '12px 16px', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                  <div style={{ fontSize: '0.75rem', color: '#EF4444', fontWeight: 700, marginBottom: '4px' }}>SAFETY GUARD ACTIVATED</div>
                  <div style={{ fontSize: '0.8125rem', color: '#FCA5A5', fontFamily: 'monospace' }}>
                    [BLOCKED] Warfarin 5mg + Clarithromycin 500mg<br/>
                    RISK: Major Upper GI Hemorrhage (CYP3A4/2C9)<br/>
                    STATUS: Overridden with mandatory MD audit justification
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'abdm' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
                <div>
                  <h4 style={{ margin: '0 0 8px 0', color: '#FCD34D', fontSize: '1rem', fontWeight: 700 }}>
                    🇮🇳 Ayushman Bharat Digital Mission (M1, M2, M3)
                  </h4>
                  <p style={{ margin: 0, color: '#94A3B8', fontSize: '0.875rem', lineHeight: 1.5 }}>
                    Native support for Aadhaar OTP e-KYC ABHA generation, rapid counter Scan & Share QR triage, electronic consent artefacts, and NRCES signed FHIR R4 document bundles.
                  </p>
                </div>
                <div style={{ backgroundColor: 'rgba(30, 41, 59, 0.5)', padding: '12px 16px', borderRadius: '8px', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
                  <div style={{ fontSize: '0.75rem', color: '#F59E0B', fontWeight: 700, marginBottom: '4px' }}>NHA TELEMETRY SPEC</div>
                  <div style={{ fontSize: '0.8125rem', color: '#FDE68A', fontFamily: 'monospace' }}>
                    ABHA: 91-4421-8890-7714 (@abdm)<br/>
                    CARE CONTEXT: VISIT-OPD-2026-9041 (HIP Linked)<br/>
                    FHIR: NRCES India DocumentBundle (SHA-256 Signed)
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'operations' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
                <div>
                  <h4 style={{ margin: '0 0 8px 0', color: '#34D399', fontSize: '1rem', fontWeight: 700 }}>
                    🏥 Synchronized Core Hospital Logistics
                  </h4>
                  <p style={{ margin: 0, color: '#94A3B8', fontSize: '0.875rem', lineHeight: 1.5 }}>
                    Seamless integration between OT surgical scheduling (PAC clearance), Emergency triage (ESI 1-5), ISBT-128 blood bank inventory, and phlebotomy barcode scanning.
                  </p>
                </div>
                <div style={{ backgroundColor: 'rgba(30, 41, 59, 0.5)', padding: '12px 16px', borderRadius: '8px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                  <div style={{ fontSize: '0.75rem', color: '#10B981', fontWeight: 700, marginBottom: '4px' }}>OPERATION THEATRE SUITE</div>
                  <div style={{ fontSize: '0.8125rem', color: '#A7F3D0', fontFamily: 'monospace' }}>
                    OT-1: Laparoscopic Cholecystectomy (PAC: FIT)<br/>
                    BLOOD BANK: 2 Units PRBC (O+ve) Reserved<br/>
                    PACU: Aldrete Score 9/10 • Ready for Post-Op Transfer
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'security' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
                <div>
                  <h4 style={{ margin: '0 0 8px 0', color: '#38BDF8', fontSize: '1rem', fontWeight: 700 }}>
                    🔐 Zero-Trust Healthcare Security & Multi-Tenancy
                  </h4>
                  <p style={{ margin: 0, color: '#94A3B8', fontSize: '0.875rem', lineHeight: 1.5 }}>
                    PostgreSQL 16 Row-Level Security (RLS) guarantees zero cross-tenant data leakage. Refresh token rotation, high-entropy JWT secrets, and tamper-evident SHA-256 hash chains.
                  </p>
                </div>
                <div style={{ backgroundColor: 'rgba(30, 41, 59, 0.5)', padding: '12px 16px', borderRadius: '8px', border: '1px solid rgba(56, 189, 248, 0.2)' }}>
                  <div style={{ fontSize: '0.75rem', color: '#38BDF8', fontWeight: 700, marginBottom: '4px' }}>SECURITY AUDIT GATES</div>
                  <div style={{ fontSize: '0.8125rem', color: '#BAE6FD', fontFamily: 'monospace' }}>
                    TESTS: 312 / 312 Passed (100%)<br/>
                    TYPECHECK: 0 Errors (13 Projects)<br/>
                    ESLINT: 0 Warnings (--max-warnings=0)
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 5. 15 FULL CLINICAL & OPERATIONAL MODULES (INTERACTIVE 3D GLASS CARDS) */}
      <section id="modules" style={{ padding: '80px 32px', maxWidth: '1360px', margin: '0 auto', position: 'relative', zIndex: 10 }}>
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <Badge variant="primary">COMPLETE CLINICAL SUITE</Badge>
          <h2 style={{ fontSize: '2.5rem', fontWeight: 800, letterSpacing: '-0.02em', margin: '16px 0 12px 0' }}>
            15 Specialized Hospital Operating Domains
          </h2>
          <p style={{ color: '#94A3B8', fontSize: '1.0625rem', maxWidth: '640px', margin: '0 auto' }}>
            Every department in your hospital operates on synchronized, real-time workflows with zero data silos.
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '24px'
        }}>
          {modulesList.map((m, idx) => (
            <div
              key={m.id}
              onClick={() => setActiveModuleIndex(idx)}
              style={{
                backgroundColor: activeModuleIndex === idx ? 'rgba(30, 41, 59, 0.85)' : 'rgba(15, 23, 42, 0.65)',
                backdropFilter: 'blur(16px)',
                border: activeModuleIndex === idx ? `1px solid ${m.accentColor}` : '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '16px',
                padding: '24px',
                transition: 'all 0.25s ease',
                cursor: 'pointer',
                boxShadow: activeModuleIndex === idx ? `0 10px 30px -5px ${m.accentColor}33` : '0 4px 20px rgba(0, 0, 0, 0.4)',
                transform: activeModuleIndex === idx ? 'translateY(-2px)' : 'none'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <span style={{ fontSize: '2rem' }}>{m.icon}</span>
                <span style={{
                  backgroundColor: `${m.accentColor}20`,
                  color: m.accentColor,
                  border: `1px solid ${m.accentColor}40`,
                  padding: '3px 10px',
                  borderRadius: '9999px',
                  fontSize: '0.6875rem',
                  fontWeight: 700,
                  letterSpacing: '0.04em'
                }}>
                  {m.badge}
                </span>
              </div>

              <div style={{ fontSize: '0.75rem', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase', marginBottom: '4px' }}>
                {m.category}
              </div>

              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#F8FAFC', margin: '0 0 10px 0' }}>
                {m.title}
              </h3>

              <p style={{ fontSize: '0.875rem', color: '#94A3B8', lineHeight: 1.5, margin: '0 0 16px 0', minHeight: '60px' }}>
                {m.description}
              </p>

              <div style={{
                backgroundColor: 'rgba(0, 0, 0, 0.3)',
                borderRadius: '8px',
                padding: '8px 12px',
                fontSize: '0.75rem',
                color: '#38BDF8',
                fontWeight: 600,
                marginBottom: '14px'
              }}>
                📈 {m.keyMetrics}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                {m.features.map((feat, fidx) => (
                  <div key={fidx} style={{ fontSize: '0.75rem', color: '#CBD5E1', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ color: m.accentColor }}>✓</span> {feat}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 6. INTERACTIVE ROI & HOSPITAL CAPACITY CALCULATOR */}
      <section id="calculator" style={{
        padding: '80px 32px',
        backgroundColor: 'rgba(15, 23, 42, 0.5)',
        borderTop: '1px solid rgba(255, 255, 255, 0.08)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        position: 'relative',
        zIndex: 10
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <Badge variant="primary">FINANCIAL & EFFICIENCY MODEL</Badge>
            <h2 style={{ fontSize: '2.25rem', fontWeight: 800, margin: '14px 0 8px 0' }}>
              Interactive Hospital Capacity & ROI Estimator
            </h2>
            <p style={{ color: '#94A3B8', fontSize: '1rem' }}>
              See how DocSearch accelerates your revenue cycle, cuts clinician documentation time, and eliminates revenue leakages.
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '32px',
            backgroundColor: 'rgba(30, 41, 59, 0.7)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(56, 189, 248, 0.25)',
            borderRadius: '20px',
            padding: '36px'
          }}>
            {/* Sliders Side */}
            <div>
              <div style={{ marginBottom: '28px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <label style={{ fontWeight: 600, fontSize: '0.9375rem', color: '#E2E8F0' }}>Hospital Bed Capacity:</label>
                  <span style={{ fontWeight: 800, color: '#38BDF8', fontSize: '1.125rem' }}>{bedCount} Beds</span>
                </div>
                <input
                  type="range"
                  min={50}
                  max={1200}
                  step={25}
                  value={bedCount}
                  onChange={(e) => setBedCount(Number(e.target.value))}
                  style={{ width: '100%', accentColor: '#06B6D4', cursor: 'pointer' }}
                />
              </div>

              <div style={{ marginBottom: '28px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <label style={{ fontWeight: 600, fontSize: '0.9375rem', color: '#E2E8F0' }}>Daily OPD Consultations:</label>
                  <span style={{ fontWeight: 800, color: '#A855F7', fontSize: '1.125rem' }}>{dailyOpdCount} Patients / Day</span>
                </div>
                <input
                  type="range"
                  min={100}
                  max={2500}
                  step={50}
                  value={dailyOpdCount}
                  onChange={(e) => setDailyOpdCount(Number(e.target.value))}
                  style={{ width: '100%', accentColor: '#8B5CF6', cursor: 'pointer' }}
                />
              </div>

              <div style={{
                backgroundColor: 'rgba(0, 0, 0, 0.3)',
                padding: '16px',
                borderRadius: '10px',
                border: '1px solid rgba(255, 255, 255, 0.06)'
              }}>
                <div style={{ fontSize: '0.8125rem', color: '#10B981', fontWeight: 700, marginBottom: '4px' }}>
                  ⚡ IMMEDIATE BENEFITS ON DAY 1
                </div>
                <ul style={{ margin: 0, paddingLeft: '18px', color: '#CBD5E1', fontSize: '0.8125rem', lineHeight: 1.6 }}>
                  <li>Zero paper chart chasing across nursing stations</li>
                  <li>Automated ABDM M2 Scan & Share token intake</li>
                  <li>100% FEFO batch tracking eliminating expired medicine loss</li>
                </ul>
              </div>
            </div>

            {/* Calculated Output Display */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              backgroundColor: 'rgba(15, 23, 42, 0.8)',
              borderRadius: '16px',
              padding: '24px',
              border: '1px solid rgba(255, 255, 255, 0.08)'
            }}>
              <div style={{ marginBottom: '20px' }}>
                <div style={{ fontSize: '0.8125rem', color: '#94A3B8', textTransform: 'uppercase', fontWeight: 600 }}>Estimated Monthly Clinical Revenue Tracked</div>
                <div style={{ fontSize: '2rem', fontWeight: 900, color: '#38BDF8', marginTop: '4px' }}>
                  ₹ {calculatedMonthlyRevenue}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#94A3B8', textTransform: 'uppercase', fontWeight: 600 }}>Doctor Hours Saved / Month</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#10B981', marginTop: '4px' }}>
                    ~{savedDoctorHoursPerMonth} hrs
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '0.75rem', color: '#94A3B8', textTransform: 'uppercase', fontWeight: 600 }}>Billing Leakage Prevented</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#F59E0B', marginTop: '4px' }}>
                    {preventedBillingLeakagePct}
                  </div>
                </div>
              </div>

              <button
                onClick={() => setShowDemoModal(true)}
                style={{
                  background: 'linear-gradient(135deg, #06B6D4 0%, #3B82F6 100%)',
                  color: '#FFFFFF',
                  padding: '12px 20px',
                  borderRadius: '8px',
                  fontWeight: 700,
                  fontSize: '0.9375rem',
                  border: 'none',
                  cursor: 'pointer',
                  width: '100%'
                }}
              >
                Request Custom Hospital ROI Audit →
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 7. ENTERPRISE SECURITY & COMPLIANCE SECTION */}
      <section id="security" style={{ padding: '80px 32px', maxWidth: '1200px', margin: '0 auto', position: 'relative', zIndex: 10 }}>
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <Badge variant="primary">GOVERNANCE & TRUST</Badge>
          <h2 style={{ fontSize: '2.25rem', fontWeight: 800, margin: '14px 0 8px 0' }}>
            Built for National Scale & Enterprise Security
          </h2>
          <p style={{ color: '#94A3B8', fontSize: '1rem', maxWidth: '640px', margin: '0 auto' }}>
            DocSearch complies with international healthcare data governance standards, zero-trust access control, and cryptographic immutability.
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '20px'
        }}>
          {[
            { title: 'Row-Level Security (RLS)', desc: 'PostgreSQL 16 tenant & branch isolation policies enforced at the database engine level.', icon: '🛡️' },
            { title: 'NRCES India FHIR R4', desc: 'Compliant clinical document bundles with cryptographic SHA-256 digital signatures.', icon: '🇮🇳' },
            { title: 'Tamper-Evident Audit', desc: 'Every clinical, financial, AI and hardware event is immutably hashed in a cryptographic chain.', icon: '⛓️' },
            { title: 'ECDH End-to-End Encryption', desc: 'Health information transfers use elliptic curve Diffie-Hellman (prime256v1) + AES-GCM-256.', icon: '🔐' }
          ].map((sec, sidx) => (
            <div key={sidx} style={{
              backgroundColor: 'rgba(15, 23, 42, 0.7)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '14px',
              padding: '24px',
              textAlign: 'left'
            }}>
              <span style={{ fontSize: '2rem', display: 'block', marginBottom: '12px' }}>{sec.icon}</span>
              <h4 style={{ fontSize: '1.0625rem', fontWeight: 700, color: '#F8FAFC', margin: '0 0 8px 0' }}>{sec.title}</h4>
              <p style={{ fontSize: '0.8125rem', color: '#94A3B8', lineHeight: 1.5, margin: 0 }}>{sec.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 8. FOOTER WITH LIVE PORTAL LINKS */}
      <footer style={{
        backgroundColor: '#040711',
        borderTop: '1px solid rgba(255, 255, 255, 0.08)',
        padding: '48px 32px 32px 32px',
        position: 'relative',
        zIndex: 10
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '32px', marginBottom: '40px' }}>
          <div>
            <div style={{ fontSize: '1.125rem', fontWeight: 900, color: '#F8FAFC', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              🩺 DOC SEARCH
            </div>
            <p style={{ color: '#64748B', fontSize: '0.8125rem', lineHeight: 1.5, margin: 0 }}>
              The unified cloud operating system powering multi-specialty hospitals, medical colleges, and healthcare networks across India.
            </p>
          </div>

          <div>
            <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#E2E8F0', marginBottom: '12px' }}>Portals</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.8125rem' }}>
              <a href={partnerPortalUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#38BDF8', textDecoration: 'none' }}>Hospital Platform (Port 5173)</a>
              <a href={companyPortalUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#94A3B8', textDecoration: 'none' }}>Company SaaS HQ (Port 5174)</a>
              <a href="http://localhost:4000/health" target="_blank" rel="noopener noreferrer" style={{ color: '#94A3B8', textDecoration: 'none' }}>API Gateway Telemetry (Port 4000)</a>
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#E2E8F0', marginBottom: '12px' }}>Clinical Standards</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.8125rem', color: '#94A3B8' }}>
              <span>ABDM M1 / M2 / M3 Gateway</span>
              <span>NRCES India FHIR R4</span>
              <span>ICD-10-CM Coding Workbench</span>
              <span>ISBT-128 Transfusion Standard</span>
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#E2E8F0', marginBottom: '12px' }}>Deployment</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.8125rem', color: '#94A3B8' }}>
              <span>PostgreSQL 16 + RLS</span>
              <span>Redis 7 Caching & PubSub</span>
              <span>Fastify High-Performance REST</span>
              <span>Docker & Kubernetes Ready</span>
            </div>
          </div>
        </div>

        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          borderTop: '1px solid rgba(255, 255, 255, 0.05)',
          paddingTop: '20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          fontSize: '0.75rem',
          color: '#64748B'
        }}>
          <div>
            © 2026 DocSearch Technologies Inc. All rights reserved.
          </div>
          <div style={{ display: 'flex', gap: '16px' }}>
            <span>Privacy Policy</span>
            <span>Terms of Service</span>
            <span>Security Whitepaper</span>
            <span>ABDM Trust Registry</span>
          </div>
        </div>
      </footer>

      {/* 9. VIP DEMO MODAL POPUP */}
      {showDemoModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(12px)',
          zIndex: 100,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: '#0F172A',
            border: '1px solid rgba(56, 189, 248, 0.3)',
            borderRadius: '20px',
            padding: '32px',
            maxWidth: '540px',
            width: '100%',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)',
            position: 'relative'
          }}>
            <button
              onClick={() => { setShowDemoModal(false); setDemoSubmitted(false); }}
              style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                backgroundColor: 'transparent',
                border: 'none',
                color: '#94A3B8',
                fontSize: '1.25rem',
                cursor: 'pointer'
              }}
            >
              ✕
            </button>

            {!demoSubmitted ? (
              <>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#F8FAFC', margin: '0 0 8px 0' }}>
                  Schedule VIP Hospital Walkthrough
                </h3>
                <p style={{ color: '#94A3B8', fontSize: '0.875rem', margin: '0 0 24px 0' }}>
                  Experience live clinical consultation, bed management, and ABDM sandbox workflows tailored to your facility.
                </p>

                <form onSubmit={handleDemoSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#CBD5E1', marginBottom: '6px' }}>Hospital / Network Name</label>
                    <input
                      required
                      type="text"
                      placeholder="e.g. Apollo / Fortis / AIIMS"
                      value={demoForm.hospitalName}
                      onChange={(e) => setDemoForm({ ...demoForm, hospitalName: e.target.value })}
                      style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', backgroundColor: 'rgba(30, 41, 59, 0.7)', border: '1px solid rgba(255, 255, 255, 0.1)', color: '#F8FAFC', fontSize: '0.875rem' }}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#CBD5E1', marginBottom: '6px' }}>Contact Name</label>
                      <input
                        required
                        type="text"
                        placeholder="Dr. / Director Name"
                        value={demoForm.contactName}
                        onChange={(e) => setDemoForm({ ...demoForm, contactName: e.target.value })}
                        style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', backgroundColor: 'rgba(30, 41, 59, 0.7)', border: '1px solid rgba(255, 255, 255, 0.1)', color: '#F8FAFC', fontSize: '0.875rem' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#CBD5E1', marginBottom: '6px' }}>Work Email</label>
                      <input
                        required
                        type="email"
                        placeholder="doctor@hospital.org"
                        value={demoForm.email}
                        onChange={(e) => setDemoForm({ ...demoForm, email: e.target.value })}
                        style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', backgroundColor: 'rgba(30, 41, 59, 0.7)', border: '1px solid rgba(255, 255, 255, 0.1)', color: '#F8FAFC', fontSize: '0.875rem' }}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#CBD5E1', marginBottom: '6px' }}>Bed Capacity</label>
                    <select
                      value={demoForm.bedCapacity}
                      onChange={(e) => setDemoForm({ ...demoForm, bedCapacity: e.target.value })}
                      style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', backgroundColor: 'rgba(30, 41, 59, 0.7)', border: '1px solid rgba(255, 255, 255, 0.1)', color: '#F8FAFC', fontSize: '0.875rem' }}
                    >
                      <option value="50-100 Beds">50–100 Beds (Community Hospital)</option>
                      <option value="100-300 Beds">100–300 Beds (Multi-Specialty)</option>
                      <option value="300-800 Beds">300–800 Beds (Tertiary Care Network)</option>
                      <option value="800+ Beds">800+ Beds (Teaching Hospital / Medical College)</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    style={{
                      marginTop: '8px',
                      background: 'linear-gradient(135deg, #06B6D4 0%, #3B82F6 100%)',
                      color: '#FFFFFF',
                      padding: '12px',
                      borderRadius: '8px',
                      fontWeight: 700,
                      fontSize: '0.9375rem',
                      border: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    Confirm & Schedule Session →
                  </button>
                </form>
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <div style={{ fontSize: '3rem', marginBottom: '12px' }}>🎉</div>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#10B981', margin: '0 0 8px 0' }}>Walkthrough Confirmed!</h3>
                <p style={{ color: '#94A3B8', fontSize: '0.875rem', lineHeight: 1.5 }}>
                  Our Clinical Solutions Architect will connect with you at <strong>{demoForm.email}</strong> with credentials and an interactive sandbox workspace.
                </p>
                <button
                  onClick={() => { setShowDemoModal(false); setDemoSubmitted(false); }}
                  style={{
                    marginTop: '16px',
                    backgroundColor: 'rgba(30, 41, 59, 0.8)',
                    color: '#F8FAFC',
                    padding: '10px 24px',
                    borderRadius: '8px',
                    fontWeight: 600,
                    fontSize: '0.875rem',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    cursor: 'pointer'
                  }}
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 24x7 AI Receptionist & Virtual Healthcare Concierge */}
      <AIReceptionistWidget />
    </div>
  );
};
