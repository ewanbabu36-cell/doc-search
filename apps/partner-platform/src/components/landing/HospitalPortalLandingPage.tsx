import React, { useState } from 'react';
import { HospitalStaffLogin, type HospitalStaffUser } from '../auth/HospitalStaffLogin.js';

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
    <div className="min-h-screen bg-[#070913] text-slate-100 flex flex-col font-sans select-none relative overflow-x-hidden">
      {/* 1. Hospital Navigation Bar */}
      <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-2xl border-b border-white/10 px-6 py-3.5 flex items-center justify-between shadow-lg">
        {/* Hospital Brand & Trust Badges */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-blue-600/30 border border-blue-400/40 text-blue-300 font-bold shadow-sm">
            <span className="text-xl leading-none">🏥</span>
            <span className="text-sm font-black tracking-wide text-white">DOC SEARCH</span>
          </div>

          <div className="hidden sm:flex flex-col text-left border-l border-white/15 pl-3">
            <span className="text-xs font-bold text-white tracking-tight leading-tight">
              Clinical Hospital Management System
            </span>
            <span className="text-[10px] font-medium text-emerald-400 flex items-center gap-1 leading-none mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              PostgreSQL 18.4 Engine • ABDM & FHIR Ready
            </span>
          </div>
        </div>

        {/* Center Quick Navigation Links */}
        <nav className="hidden lg:flex items-center gap-6 text-xs font-semibold text-slate-300">
          <a href="#services" className="hover:text-white transition-colors">Specialties</a>
          <a href="#opd-status" className="hover:text-white transition-colors">OPD Live Desk</a>
          <a href="#bed-census" className="hover:text-white transition-colors">Bed Availability</a>
          <a href="#emergency" className="hover:text-white transition-colors">24x7 Emergency</a>
        </nav>

        {/* Right CTA Action Buttons */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={handleOpenLogin}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-bold text-xs shadow-md border border-blue-400/40 transition-all cursor-pointer"
          >
            <span>🔐</span>
            <span>Staff Login</span>
          </button>

          <button
            onClick={handleOpenRegister}
            className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 text-slate-200 hover:text-white font-semibold text-xs border border-white/15 transition-all cursor-pointer"
          >
            <span>🏥</span>
            <span>Register Facility</span>
          </button>
        </div>
      </header>

      {/* 2. Hero Section: Hospital Management Core */}
      <main className="flex-1 flex flex-col justify-center max-w-7xl mx-auto w-full px-6 py-12 md:py-20 relative z-10">
        {/* Subtle Ambient Glowing Backdrops */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gradient-to-tr from-blue-600/15 via-indigo-600/10 to-teal-500/10 rounded-full blur-3xl pointer-events-none -z-10" />

        {/* Hero Header */}
        <div className="text-center max-w-3xl mx-auto space-y-5">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-500/10 border border-blue-400/20 text-blue-300 text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Next-Generation Healthcare Clinical Platform</span>
          </div>

          <h1 className="text-3xl sm:text-5xl md:text-6xl font-black text-white tracking-tight leading-tight">
            Enterprise Hospital <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-blue-400 via-cyan-300 to-teal-300 bg-clip-text text-transparent">
              Operating Software
            </span>
          </h1>

          <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto font-normal leading-relaxed">
            Autonomous OPD Queue Caller, Smart Prescription Pad, Inpatient Ward Census, Bedside ICU Telemetry, Pharmacy POS, and Integrated TPA Invoicing.
          </p>

          {/* Action CTAs */}
          <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={handleOpenLogin}
              className="flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 active:scale-95 text-white font-bold text-sm shadow-[0_10px_25px_rgba(37,99,235,0.4)] transition-all cursor-pointer"
            >
              <span>👨‍⚕️ Clinician & Staff Login</span>
              <span>➔</span>
            </button>

            <button
              onClick={handleOpenRegister}
              className="flex items-center gap-2 px-5 py-3.5 rounded-2xl bg-white/10 hover:bg-white/15 active:scale-95 text-slate-200 hover:text-white font-semibold text-sm border border-white/15 backdrop-blur-md transition-all cursor-pointer"
            >
              <span>🏢 Register New Hospital / Clinic</span>
            </button>
          </div>
        </div>

        {/* 3. Live Hospital Operational Pulse Cards */}
        <div className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-5" id="opd-status">
          {/* Card 1: OPD Live Queue */}
          <div className="rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10 p-5 flex flex-col justify-between shadow-xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs font-bold uppercase tracking-wider text-white">OPD Live Queue</span>
              </div>
              <span className="text-[10px] font-mono text-emerald-300 px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/30">
                Room 4 Active
              </span>
            </div>

            <div className="my-4">
              <div className="text-[11px] text-slate-400">Now Calling</div>
              <div className="text-2xl font-black text-white font-mono">Token #42</div>
              <div className="text-xs text-slate-300 mt-1">Amit Verma (34M) • Dr. Apollo</div>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-400 border-t border-white/10 pt-2 font-mono">
              <span>18 in line</span>
              <span>Avg wait: 8m</span>
              <span className="text-blue-400 font-sans font-semibold">Active Sync</span>
            </div>
          </div>

          {/* Card 2: Bed Census & ICU Telemetry */}
          <div className="rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10 p-5 flex flex-col justify-between shadow-xl" id="bed-census">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-base leading-none">🛏️</span>
                <span className="text-xs font-bold uppercase tracking-wider text-white">Bed Availability</span>
              </div>
              <span className="text-[10px] font-mono text-emerald-300 px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/30">
                180/200 Occupied
              </span>
            </div>

            <div className="space-y-1.5 my-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-300 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-rose-500" /> ICU Ward
                </span>
                <span className="font-mono font-bold text-rose-400">18/20 (2 Vacant)</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-300 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-500" /> HDU Ward
                </span>
                <span className="font-mono font-bold text-amber-400">24/30 (6 Vacant)</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-300 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-cyan-500" /> General Ward
                </span>
                <span className="font-mono font-bold text-cyan-400">138/150 (12 Vacant)</span>
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] text-blue-400 font-semibold border-t border-white/10 pt-2">
              <span>Rapid Emergency Admission</span>
              <span>Available ➔</span>
            </div>
          </div>

          {/* Card 3: 24x7 Emergency Helpline */}
          <div className="rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10 p-5 flex flex-col justify-between shadow-xl" id="emergency">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-base leading-none">🚨</span>
                <span className="text-xs font-bold uppercase tracking-wider text-white">24x7 Emergency Trauma</span>
              </div>
              <span className="text-[10px] font-mono text-rose-400 px-2 py-0.5 rounded-full bg-rose-500/20 border border-rose-400/30">
                Code Red Ready
              </span>
            </div>

            <div className="my-4">
              <div className="text-[11px] text-slate-400">Trauma & Ambulance Hotline</div>
              <div className="text-xl font-black text-rose-400 font-mono tracking-tight mt-1">
                +91 1800-DOC-SEARCH
              </div>
              <div className="text-xs text-slate-300 mt-1">Manchester Level 1 Acuity Triage Station</div>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-400 border-t border-white/10 pt-2">
              <span>GPS Fleet Live</span>
              <span className="text-emerald-400 font-semibold">3 Ambulances On-Call</span>
            </div>
          </div>
        </div>

        {/* 4. Respected Role Capabilities Grid */}
        <div className="mt-16" id="services">
          <div className="text-center mb-8">
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Hospital Operations Architecture
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Role-segregated environments designed for speed, safety, and clinical governance.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
            {/* Role 1: Clinician */}
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-center hover:bg-white/10 transition-colors">
              <div className="text-2xl mb-1.5">🩺</div>
              <div className="text-xs font-bold text-white">Doctor / OPD</div>
              <div className="text-[10px] text-slate-400 mt-0.5 leading-snug">Smart Rx, ICD-11, Patient 360</div>
            </div>

            {/* Role 2: Nurse */}
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-center hover:bg-white/10 transition-colors">
              <div className="text-2xl mb-1.5">👩‍⚕️</div>
              <div className="text-xs font-bold text-white">Nursing / IPD</div>
              <div className="text-[10px] text-slate-400 mt-0.5 leading-snug">Bed Board, MAR, ICU Vitals</div>
            </div>

            {/* Role 3: Cashier */}
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-center hover:bg-white/10 transition-colors">
              <div className="text-2xl mb-1.5">💳</div>
              <div className="text-xs font-bold text-white">Cashier Desk</div>
              <div className="text-[10px] text-slate-400 mt-0.5 leading-snug">UPI Till, GST Invoicing, TPA</div>
            </div>

            {/* Role 4: Pharmacist */}
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-center hover:bg-white/10 transition-colors">
              <div className="text-2xl mb-1.5">💊</div>
              <div className="text-xs font-bold text-white">Pharmacy POS</div>
              <div className="text-[10px] text-slate-400 mt-0.5 leading-snug">Barcode Dispense, Expiry Alert</div>
            </div>

            {/* Role 5: Pathologist */}
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-center hover:bg-white/10 transition-colors">
              <div className="text-2xl mb-1.5">🔬</div>
              <div className="text-xs font-bold text-white">LIS Pathology</div>
              <div className="text-[10px] text-slate-400 mt-0.5 leading-snug">Specimen Tracking, QR Reports</div>
            </div>

            {/* Role 6: Administrator */}
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-center hover:bg-white/10 transition-colors">
              <div className="text-2xl mb-1.5">🏛️</div>
              <div className="text-xs font-bold text-white">Executive Admin</div>
              <div className="text-[10px] text-slate-400 mt-0.5 leading-snug">Duty Roster, Revenue Audits</div>
            </div>
          </div>
        </div>
      </main>

      {/* 5. Footer */}
      <footer className="border-t border-white/10 py-6 px-6 text-center text-xs text-slate-500">
        <p>DocSearch Apollo Enterprise Healthcare Suite • Live PostgreSQL 18.4 Sovereign Database • Fail-Closed Architecture</p>
      </footer>

      {/* 6. Active Login / Registration Modal Overlay */}
      {activeModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-2xl animate-in fade-in duration-200"
          onClick={handleCloseModal}
        >
          <div
            className="relative w-full max-w-4xl max-h-[92vh] overflow-y-auto rounded-3xl bg-slate-950 border border-white/20 shadow-[0_25px_80px_rgba(0,0,0,0.9)] p-4 sm:p-6 animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={handleCloseModal}
              className="absolute top-4 right-4 z-50 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white/80 hover:text-white flex items-center justify-center text-sm transition-colors cursor-pointer"
              title="Close"
            >
              ✕
            </button>

            {/* Hospital Staff Login & Registration Component */}
            <HospitalStaffLogin
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
