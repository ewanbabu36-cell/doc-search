import React, { useState } from 'react';
import { HospitalStaffLogin, type HospitalStaffUser } from '../auth/HospitalStaffLogin.js';
import { PartnerCampaignShowcasePanel } from '@docsearch/ui-kit';
import './hospital-portal-landing.css';

export interface HospitalPortalLandingPageProps {
  onLoginSuccess: (user: HospitalStaffUser) => void;
}

export const HospitalPortalLandingPage: React.FC<HospitalPortalLandingPageProps> = ({
  onLoginSuccess,
}) => {
  const [activeModal, setActiveModal] = useState<'LOGIN' | 'REGISTER' | null>(null);

  const handleOpenLogin = () => {
    setActiveModal('LOGIN');
  };

  const handleOpenRegister = () => {
    setActiveModal('REGISTER');
  };

  const handleCloseModal = () => {
    setActiveModal(null);
  };

  return (
    <div className="ds-landing-container">
      {/* Background Ambient Glow */}
      <div className="ds-ambient-glow" />

      {/* 1. Header & Navigation Bar */}
      <header className="ds-landing-header">
        <div className="ds-brand-block">
          <div className="ds-brand-badge">
            <span className="ds-brand-badge-icon">🏥</span>
            <span>DOC SEARCH</span>
          </div>

          <div className="ds-brand-subtitle-block">
            <span className="ds-brand-title">Clinical Hospital Management System</span>
            <div className="ds-brand-status-pill">
              <span className="ds-pulse-dot" />
              <span>PostgreSQL 18.4 Engine • ABDM & FHIR Ready</span>
            </div>
          </div>
        </div>

        {/* Center Quick Navigation Links */}
        <nav className="ds-nav-links">
          <a href="#specialties" className="ds-nav-link">Specialties</a>
          <a href="#opd-status" className="ds-nav-link">OPD Live Desk</a>
          <a href="#bed-census" className="ds-nav-link">Bed Availability</a>
          <a href="#free-enterprise" className="ds-nav-link" style={{ color: '#34d399', fontWeight: 700 }}>100% Free Lifetime</a>
          <a href="#emergency" className="ds-nav-link">24x7 Emergency</a>
        </nav>

        {/* Right CTA Action Buttons */}
        <div className="ds-header-actions">
          <button onClick={handleOpenLogin} className="ds-btn-login">
            <span>🔐</span>
            <span>Staff Login</span>
          </button>

          <button onClick={handleOpenRegister} className="ds-btn-register">
            <span>🏥</span>
            <span>Register Facility</span>
          </button>
        </div>
      </header>

      {/* 2. Hero Section: Hospital Management Core */}
      <main className="ds-hero-section">
        <div className="ds-hero-center">
          <div className="ds-hero-pill-badge">
            <span className="ds-pulse-dot" />
            <span>🎁 100% Full Enterprise Free for Lifetime • Zero Software Fees Forever</span>
          </div>

          <h1 className="ds-hero-headline">
            Enterprise Hospital <br />
            <span className="ds-hero-gradient-text">Operating Software</span>
          </h1>

          <p className="ds-hero-subtext">
            Complete Hospital Clinical Operating System — ₹0 / Year Subscription. Autonomous OPD Queue Voice Caller, Smart Prescription Pad, Inpatient Ward Census, Bedside ICU Telemetry, Pharmacy POS, and Integrated TPA Invoicing. Powered sustainably by factory-direct medicine & surgical sourcing economics.
          </p>

          {/* Action CTAs */}
          <div className="ds-hero-ctas">
            <button onClick={handleOpenLogin} className="ds-hero-primary-btn">
              <span>👨‍⚕️ Clinician & Staff Login</span>
              <span>➔</span>
            </button>

            <button onClick={handleOpenRegister} className="ds-hero-secondary-btn">
              <span>🏢 Register New Hospital / Clinic (100% Free)</span>
            </button>
          </div>
        </div>

        {/* 3. Live Hospital Operational Pulse Cards */}
        <div className="ds-telemetry-grid" id="opd-status">
          {/* Card 1: OPD Live Queue */}
          <div className="ds-telemetry-card">
            <div className="ds-card-header">
              <div className="ds-card-title-wrap">
                <span className="ds-pulse-dot" />
                <span className="ds-card-title">OPD Live Queue</span>
              </div>
              <span className="ds-card-badge">Room 4 Active</span>
            </div>

            <div className="ds-card-body">
              <div className="ds-card-caption">Now Calling</div>
              <div className="ds-card-number">Token #42</div>
              <div className="ds-card-subinfo">Amit Verma (34M) • Dr. Apollo</div>
            </div>

            <div className="ds-card-footer">
              <span>18 in line</span>
              <span>Avg wait: 8m</span>
              <span className="ds-card-link">Active Sync</span>
            </div>
          </div>

          {/* Card 2: Bed Census & ICU Telemetry */}
          <div className="ds-telemetry-card" id="bed-census">
            <div className="ds-card-header">
              <div className="ds-card-title-wrap">
                <span>🛏️</span>
                <span className="ds-card-title">Bed Availability</span>
              </div>
              <span className="ds-card-badge">180/200 Occupied</span>
            </div>

            <div className="ds-card-body">
              <div className="ds-bed-row">
                <span className="ds-bed-label"><span className="ds-bed-dot-red" /> ICU Ward</span>
                <span className="ds-bed-val-red">18/20 (2 Vacant)</span>
              </div>
              <div className="ds-bed-row">
                <span className="ds-bed-label"><span className="ds-bed-dot-amber" /> HDU Ward</span>
                <span className="ds-bed-val-amber">24/30 (6 Vacant)</span>
              </div>
              <div className="ds-bed-row">
                <span className="ds-bed-label"><span className="ds-bed-dot-cyan" /> General Ward</span>
                <span className="ds-bed-val-cyan">138/150 (12 Vacant)</span>
              </div>
            </div>

            <div className="ds-card-footer">
              <span className="ds-card-link">Rapid Emergency Admission</span>
              <span>Available ➔</span>
            </div>
          </div>

          {/* Card 3: 24x7 Emergency Helpline */}
          <div className="ds-telemetry-card" id="emergency">
            <div className="ds-card-header">
              <div className="ds-card-title-wrap">
                <span>🚨</span>
                <span className="ds-card-title">24x7 Emergency Trauma</span>
              </div>
              <span className="ds-card-badge-red">Code Red Ready</span>
            </div>

            <div className="ds-card-body">
              <div className="ds-card-caption">Trauma & Ambulance Hotline</div>
              <div className="ds-card-number" style={{ color: '#f87171' }}>+91 1800-DOC-SEARCH</div>
              <div className="ds-card-subinfo">Manchester Level 1 Acuity Triage Station</div>
            </div>

            <div className="ds-card-footer">
              <span>GPS Fleet Live</span>
              <span style={{ color: '#34d399', fontWeight: 700 }}>3 Ambulances On-Call</span>
            </div>
          </div>
        </div>

        {/* 4. 100% Full Enterprise Free for Lifetime & Factory-Direct Sourcing Depot */}
        <section className="ds-showcase-section" id="free-enterprise">
          <div className="ds-section-heading">
            <div className="ds-hero-pill-badge" style={{ marginBottom: '12px' }}>
              <span className="ds-pulse-dot" />
              <span>🎁 100% Full Enterprise Free for Lifetime • Zero Software Fees Forever</span>
            </div>
            <h2 className="ds-section-title">
              Complete Hospital OS is 100% Free Forever
            </h2>
            <p className="ds-section-subtitle">
              Unlimited Beds, OPD/IPD, OT, ICU, NABL LIMS, Cloud PACS, and Ambient Voice AI. Completely free forever — sustainably funded by direct factory-rate medicine & pathology chemical supply (saving hospitals 40%–70% on procurement).
            </p>
          </div>

          {/* Sourcing & Savings Showcase Container */}
          <div className="ds-showcase-container">
            <PartnerCampaignShowcasePanel
              onClaimOffer={handleOpenRegister}
              compact={false}
            />
          </div>

          {/* Trust Telemetry Highlights Bar */}
          <div className="ds-trust-telemetry-bar">
            <div className="ds-trust-item">
              <span className="ds-trust-icon">🏛️</span>
              <div>
                <strong>681+ Facilities Live</strong>
                <span>National Sourcing Network</span>
              </div>
            </div>
            <div className="ds-trust-item">
              <span className="ds-trust-icon">⚡</span>
              <div>
                <strong>₹0 / Year Forever</strong>
                <span>Zero Subscription Bills</span>
              </div>
            </div>
            <div className="ds-trust-item">
              <span className="ds-trust-icon">📦</span>
              <div>
                <strong>40%–70% Wholesale</strong>
                <span>Factory-Direct Depot</span>
              </div>
            </div>
            <div className="ds-trust-item">
              <span className="ds-trust-icon">🇮🇳</span>
              <div>
                <strong>ABDM & NHCX Ready</strong>
                <span>Govt M1/M2/M3 Certified</span>
              </div>
            </div>
            <div className="ds-trust-item">
              <span className="ds-trust-icon">🛡️</span>
              <div>
                <strong>PostgreSQL 18.4</strong>
                <span>100% Sovereign & Fail-Closed</span>
              </div>
            </div>
          </div>
        </section>

        {/* 5. Respected Role Capabilities Grid */}
        <div className="ds-operations-section" id="specialties">
          <div className="ds-section-heading">
            <h2 className="ds-section-title">Hospital Operations Architecture</h2>
            <p className="ds-section-subtitle">
              Role-segregated environments designed for speed, safety, and clinical governance.
            </p>
          </div>

          <div className="ds-operations-grid">
            {/* Role 1: Clinician */}
            <div className="ds-operation-card">
              <div className="ds-op-icon">🩺</div>
              <div className="ds-op-title">Doctor / OPD</div>
              <div className="ds-op-desc">Smart Rx, ICD-11, Patient 360</div>
            </div>

            {/* Role 2: Nurse */}
            <div className="ds-operation-card">
              <div className="ds-op-icon">👩‍⚕️</div>
              <div className="ds-op-title">Nursing / IPD</div>
              <div className="ds-op-desc">Bed Board, MAR, ICU Vitals</div>
            </div>

            {/* Role 3: Cashier */}
            <div className="ds-operation-card">
              <div className="ds-op-icon">💳</div>
              <div className="ds-op-title">Cashier Desk</div>
              <div className="ds-op-desc">UPI Till, GST Invoicing, TPA</div>
            </div>

            {/* Role 4: Pharmacist */}
            <div className="ds-operation-card">
              <div className="ds-op-icon">💊</div>
              <div className="ds-op-title">Pharmacy POS</div>
              <div className="ds-op-desc">Barcode Dispense, Expiry Alert</div>
            </div>

            {/* Role 5: Pathologist */}
            <div className="ds-operation-card">
              <div className="ds-op-icon">🔬</div>
              <div className="ds-op-title">LIS Pathology</div>
              <div className="ds-op-desc">Specimen Tracking, QR Reports</div>
            </div>

            {/* Role 6: Administrator */}
            <div className="ds-operation-card">
              <div className="ds-op-icon">🏛️</div>
              <div className="ds-op-title">Executive Admin</div>
              <div className="ds-op-desc">Duty Roster, Revenue Audits</div>
            </div>
          </div>
        </div>
      </main>

      {/* 6. Footer */}
      <footer className="ds-landing-footer">
        <p>DocSearch Apollo Enterprise Healthcare Suite • Live PostgreSQL 18.4 Sovereign Database • Fail-Closed Architecture</p>
      </footer>

      {/* 7. Active Login / Registration Modal Overlay */}
      {activeModal && (
        <div className="ds-modal-overlay" onClick={handleCloseModal}>
          <div className="ds-modal-window" onClick={(e) => e.stopPropagation()}>
            <button onClick={handleCloseModal} className="ds-modal-close-btn" title="Close">
              ✕
            </button>

            {/* Clean Minimalist Hospital Staff Login & Registration Component */}
            <HospitalStaffLogin
              initialMode={activeModal}
              onLoginSuccess={(user) => {
                handleCloseModal();
                onLoginSuccess(user);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};
