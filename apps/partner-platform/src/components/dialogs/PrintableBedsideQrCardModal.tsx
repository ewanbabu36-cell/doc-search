import React, { useState } from 'react';
import { Button, Badge } from '@docsearch/ui-kit';
import type { InpatientBedDto } from '@docsearch/api-contracts';
import { hospitalEventBus } from '../../services/hospital-event-bus.js';

export interface PrintableBedsideQrCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  bed: InpatientBedDto | null;
  facilityName?: string | undefined;
  attendingDoctor?: string | undefined;
  admissionDate?: string | undefined;
}

export const PrintableBedsideQrCardModal: React.FC<PrintableBedsideQrCardModalProps> = ({
  isOpen,
  onClose,
  bed,
  facilityName = 'Apex Medicity Multi-Speciality Hospital & Trauma Centre',
  attendingDoctor = 'Dr. Vikram Malhotra, MS (Gen Surg)',
  admissionDate = new Date().toLocaleDateString('en-IN')
}) => {
  const [activeTab, setActiveTab] = useState<'standee' | 'patient_preview'>('standee');
  const [nurseCallSent, setNurseCallSent] = useState(false);
  const [nurseCallReason, setNurseCallReason] = useState('IV Infusion Beeping');
  const [dietPlan] = useState('Diabetic Soft Diet • Low Sodium • NPO after 10 PM');

  if (!isOpen || !bed) return null;

  const patientName = bed.currentPatientName || 'Kailash Chand Verma';
  const patientMrn = bed.currentPatientMrn || 'UHID-2026-8910';
  const qrPortalUrl = `https://docsearch.health/bedside/${bed.id}?mrn=${encodeURIComponent(patientMrn)}&bed=${encodeURIComponent(bed.bedCode)}`;

  const handleTriggerNurseCall = () => {
    hospitalEventBus.publish(
      'NURSE_CALL_REQUESTED',
      'BedsidePatientConcierge',
      {
        bedId: bed.id,
        bedCode: bed.bedCode,
        wardName: bed.wardName || 'General Ward',
        patientName,
        patientMrn,
        reason: nurseCallReason,
        calledAt: new Date().toLocaleTimeString('en-IN')
      },
      `🔔 NURSE CALL BELL: Bed ${bed.bedCode} (${patientName}) requests assistance: ${nurseCallReason}`
    );

    setNurseCallSent(true);
    setTimeout(() => setNurseCallSent(false), 4000);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(
      `*BEDSIDE PATIENT CONCIERGE LINK*\n` +
      `*Hospital:* ${facilityName}\n` +
      `*Patient:* ${patientName} (${patientMrn})\n` +
      `*Bed / Ward:* ${bed.bedCode} (${bed.wardName || 'Ward'})\n\n` +
      `Scan or open this link on your phone to view running bills, doctor diet plan, and nurse call bell:\n${qrPortalUrl}`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-2 sm:p-4 backdrop-blur-sm overflow-y-auto print:p-0 print:bg-white print:static">
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #bedside-qr-standee-print, #bedside-qr-standee-print * {
            visibility: visible !important;
          }
          #bedside-qr-standee-print {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 10mm !important;
            box-shadow: none !important;
            border: 2px solid #000 !important;
            background: #fff !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <div className="relative w-full max-w-3xl max-h-[92vh] flex flex-col rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden print:max-w-none print:max-h-none print:shadow-none print:border-none">
        {/* MODAL CONTROL HEADER (NO PRINT) */}
        <div className="no-print flex items-center justify-between border-b border-slate-200 bg-slate-900 px-6 py-4 text-white">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600/30 text-indigo-400 border border-indigo-500/40 text-xl font-bold">
              🛏️
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-wide">
                  Bedside Patient Concierge QR Standee
                </h2>
                <Badge variant="primary" className="text-[10px] uppercase font-black tracking-wider">
                  BED {bed.bedCode}
                </Badge>
              </div>
              <p className="text-xs text-slate-300">
                Patient: <strong className="text-white">{patientName}</strong> ({patientMrn}) • {bed.wardName || 'Ward'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleShareWhatsApp}
              className="bg-emerald-800/50 text-emerald-200 border-emerald-700/60 hover:bg-emerald-700/60 text-xs"
            >
              💬 WhatsApp Link
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handlePrint}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs"
            >
              🖨️ Print Bedside Card
            </Button>
            <button
              onClick={onClose}
              className="ml-2 rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        {/* TABS: Standee Card vs Patient Phone Preview */}
        <div className="no-print flex border-b border-slate-200 bg-slate-100 p-1.5 text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('standee')}
            className={`flex-1 py-2 rounded-lg transition-all text-center flex items-center justify-center gap-1.5 ${
              activeTab === 'standee'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            <span>🖨️</span>
            <span>Printable Table-Top QR Standee</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('patient_preview')}
            className={`flex-1 py-2 rounded-lg transition-all text-center flex items-center justify-center gap-1.5 ${
              activeTab === 'patient_preview'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            <span>📱</span>
            <span>Live Patient Mobile Experience Preview</span>
          </button>
        </div>

        {/* MODAL CONTENT */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-100 print:bg-white print:p-0">
          {activeTab === 'standee' ? (
            /* STANDEE CARD VIEW */
            <div
              id="bedside-qr-standee-print"
              className="mx-auto w-full max-w-md bg-white p-6 sm:p-8 rounded-2xl border-2 border-slate-900 shadow-lg text-slate-900 text-center relative print:shadow-none"
            >
              {/* TOP HOSPITAL RIBBON */}
              <div className="border-b-2 border-slate-900 pb-3">
                <span className="text-[10px] font-black uppercase tracking-widest text-indigo-700 block">
                  INPATIENT MEDICAL CARE CONCIERGE
                </span>
                <h1 className="text-base sm:text-lg font-black uppercase text-slate-900 font-serif leading-tight">
                  {facilityName}
                </h1>
                <p className="text-[10px] text-slate-500 font-semibold mt-0.5">
                  24x7 Ward Nursing Station • Extn: 104 • Code Blue: Extn 222
                </p>
              </div>

              {/* BED BADGE */}
              <div className="my-4 inline-flex items-center gap-2 bg-slate-900 text-white px-5 py-1.5 rounded-full shadow">
                <span className="text-base">🛏️</span>
                <span className="font-mono text-sm sm:text-base font-black tracking-wider">
                  BED {bed.bedCode}
                </span>
                <span className="text-slate-400 text-xs">•</span>
                <span className="text-xs font-semibold text-slate-200">
                  {bed.wardName || 'Ward'}
                </span>
              </div>

              {/* PATIENT DEMOGRAPHICS PILL */}
              <div className="bg-slate-50 border border-slate-300 rounded-xl p-3 text-left text-xs mb-4">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="block text-[10px] font-bold text-slate-500 uppercase">Patient:</span>
                    <strong className="text-slate-900 text-sm">{patientName}</strong>
                  </div>
                  <div>
                    <span className="block text-[10px] font-bold text-slate-500 uppercase">UHID / MRN:</span>
                    <span className="font-mono font-bold text-indigo-700">{patientMrn}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] font-bold text-slate-500 uppercase">Admitting Consultant:</span>
                    <span className="font-semibold text-slate-800">{attendingDoctor}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] font-bold text-slate-500 uppercase">Admission Date:</span>
                    <span className="text-slate-800 font-medium">{admissionDate}</span>
                  </div>
                </div>
              </div>

              {/* VECTOR QR CODE BLOCK */}
              <div className="p-4 bg-white rounded-2xl border-2 border-indigo-600 inline-block shadow-inner mb-3">
                <svg
                  className="w-44 h-44 mx-auto"
                  viewBox="0 0 160 160"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <rect width="160" height="160" fill="white" />
                  {/* Top-Left Finder */}
                  <rect x="10" y="10" width="40" height="40" rx="4" fill="#0F172A" />
                  <rect x="18" y="18" width="24" height="24" rx="2" fill="white" />
                  <rect x="24" y="24" width="12" height="12" rx="1" fill="#4F46E5" />
                  {/* Top-Right Finder */}
                  <rect x="110" y="10" width="40" height="40" rx="4" fill="#0F172A" />
                  <rect x="118" y="18" width="24" height="24" rx="2" fill="white" />
                  <rect x="124" y="24" width="12" height="12" rx="1" fill="#4F46E5" />
                  {/* Bottom-Left Finder */}
                  <rect x="10" y="110" width="40" height="40" rx="4" fill="#0F172A" />
                  <rect x="18" y="118" width="24" height="24" rx="2" fill="white" />
                  <rect x="24" y="124" width="12" height="12" rx="1" fill="#4F46E5" />
                  {/* Decorative High-Density Data Matrix Dots */}
                  <rect x="60" y="14" width="8" height="8" fill="#0F172A" />
                  <rect x="76" y="14" width="8" height="8" fill="#4F46E5" />
                  <rect x="92" y="14" width="8" height="8" fill="#0F172A" />
                  <rect x="60" y="30" width="8" height="8" fill="#4F46E5" />
                  <rect x="76" y="30" width="8" height="8" fill="#0F172A" />
                  <rect x="92" y="30" width="8" height="8" fill="#4F46E5" />
                  <rect x="14" y="60" width="8" height="8" fill="#0F172A" />
                  <rect x="30" y="60" width="8" height="8" fill="#4F46E5" />
                  <rect x="46" y="60" width="8" height="8" fill="#0F172A" />
                  <rect x="62" y="60" width="8" height="8" fill="#4F46E5" />
                  <rect x="78" y="60" width="8" height="8" fill="#0F172A" />
                  <rect x="94" y="60" width="8" height="8" fill="#4F46E5" />
                  <rect x="110" y="60" width="8" height="8" fill="#0F172A" />
                  <rect x="126" y="60" width="8" height="8" fill="#4F46E5" />
                  <rect x="142" y="60" width="8" height="8" fill="#0F172A" />
                  {/* Center Biometric Emblem */}
                  <circle cx="80" cy="80" r="14" fill="#4F46E5" />
                  <text x="80" y="85" textAnchor="middle" fill="white" fontSize="11" fontWeight="bold">
                    DS
                  </text>
                  <rect x="60" y="100" width="8" height="8" fill="#0F172A" />
                  <rect x="76" y="100" width="8" height="8" fill="#4F46E5" />
                  <rect x="92" y="100" width="8" height="8" fill="#0F172A" />
                  <rect x="60" y="116" width="8" height="8" fill="#4F46E5" />
                  <rect x="76" y="116" width="8" height="8" fill="#0F172A" />
                  <rect x="92" y="116" width="8" height="8" fill="#4F46E5" />
                  <rect x="60" y="132" width="8" height="8" fill="#0F172A" />
                  <rect x="76" y="132" width="8" height="8" fill="#4F46E5" />
                  <rect x="92" y="132" width="8" height="8" fill="#0F172A" />
                  <rect x="110" y="116" width="8" height="8" fill="#0F172A" />
                  <rect x="126" y="132" width="8" height="8" fill="#4F46E5" />
                </svg>
              </div>

              {/* SCAN CALLOUT */}
              <div className="space-y-1">
                <span className="text-xs font-black uppercase text-indigo-900 tracking-wider block">
                  Scan With Any Mobile Camera • No App Needed
                </span>
                <p className="text-[11px] text-slate-600 leading-snug max-w-xs mx-auto">
                  Instant Patient Care Portal: Live Running Bill, Digital Nurse Call Bell, Diet Chart &amp; Doctor Advice.
                </p>
              </div>

              {/* FOOTER VERIFICATION */}
              <div className="mt-4 pt-3 border-t border-slate-200 flex justify-between items-center text-[10px] text-slate-500 font-mono">
                <span>NABH INPATIENT COMPLIANT</span>
                <span>DOCSEARCH HEALTHCARE OS</span>
              </div>
            </div>
          ) : (
            /* PATIENT MOBILE EXPERIENCE PREVIEW */
            <div className="mx-auto w-full max-w-sm bg-slate-900 text-white rounded-3xl p-5 shadow-2xl border-4 border-slate-800 space-y-4">
              {/* PHONE MOCK HEADER */}
              <div className="flex justify-between items-center pb-2 border-b border-slate-800 text-xs">
                <span className="font-bold text-slate-400">9:41 AM</span>
                <div className="flex items-center gap-1.5 text-slate-400">
                  <span>5G</span>
                  <span>100% 🔋</span>
                </div>
              </div>

              {/* PATIENT GREETING */}
              <div className="bg-gradient-to-r from-indigo-900 to-slate-800 p-4 rounded-2xl border border-indigo-700/50">
                <span className="text-[10px] uppercase font-bold text-indigo-400 block tracking-wider">
                  Patient Bedside Portal
                </span>
                <h3 className="text-base font-bold text-white mt-0.5">{patientName}</h3>
                <div className="flex items-center gap-2 mt-1 text-xs text-slate-300">
                  <span className="bg-indigo-600/40 px-2 py-0.5 rounded font-mono text-[11px] text-indigo-300">
                    Bed {bed.bedCode}
                  </span>
                  <span>•</span>
                  <span>{bed.wardName || 'Ward 3B'}</span>
                </div>
              </div>

              {/* 1-CLICK DIGITAL NURSE CALL BELL */}
              <div className="p-4 rounded-2xl bg-red-950/40 border border-red-500/50 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-black uppercase text-red-400 tracking-wider flex items-center gap-1.5">
                    <span>🔔</span> Digital Nurse Call Bell
                  </span>
                  <Badge variant="danger" className="text-[10px]">
                    24x7 DESK
                  </Badge>
                </div>

                <div>
                  <label className="block text-[11px] text-slate-300 font-semibold mb-1">
                    Select Assistance Reason:
                  </label>
                  <select
                    value={nurseCallReason}
                    onChange={(e) => setNurseCallReason(e.target.value)}
                    className="w-full rounded bg-slate-800 border border-slate-700 p-1.5 text-xs text-white"
                  >
                    <option value="IV Infusion Beeping / Finished">IV Infusion Beeping / Finished</option>
                    <option value="Severe Pain / Medication Request">Severe Pain / Medication Request</option>
                    <option value="Linen / Bed Sheet Change Required">Linen / Bed Sheet Change</option>
                    <option value="Assistance for Washroom / Walking">Assistance for Washroom / Walking</option>
                    <option value="Urgent Doctor / Nurse Attention">Urgent Doctor / Nurse Attention</option>
                  </select>
                </div>

                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleTriggerNurseCall}
                  className="w-full bg-red-600 hover:bg-red-700 text-white font-bold text-xs py-2"
                >
                  {nurseCallSent ? '✓ Nurse Station Alerted!' : '🔔 Ring Nurse Call Bell (Send Alert)'}
                </Button>

                {nurseCallSent && (
                  <p className="text-[11px] text-emerald-400 text-center font-bold animate-pulse">
                    ✓ Sister on duty at Ward Station alerted for Bed {bed.bedCode}
                  </p>
                )}
              </div>

              {/* RUNNING BILL WIDGET */}
              <div className="p-4 rounded-2xl bg-slate-800 border border-slate-700 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-300">Live Running Bill Summary</span>
                  <span className="text-xs text-emerald-400 font-mono font-bold">Updated Just Now</span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-slate-900/60 p-2 rounded">
                    <span className="text-[10px] text-slate-400 block">Total Incurred:</span>
                    <strong className="text-white text-sm">₹28,450</strong>
                  </div>
                  <div className="bg-slate-900/60 p-2 rounded">
                    <span className="text-[10px] text-slate-400 block">Advance Deposited:</span>
                    <strong className="text-emerald-400 text-sm">₹20,000</strong>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-1 text-xs">
                  <span className="text-slate-400">Estimated Due Balance:</span>
                  <strong className="text-amber-400 text-sm">₹8,450</strong>
                </div>
              </div>

              {/* DIET & CARE PLAN */}
              <div className="p-4 rounded-2xl bg-slate-800 border border-slate-700 text-xs space-y-1.5">
                <span className="text-xs font-bold text-slate-300 block">Active Diet &amp; Routine Plan</span>
                <p className="text-[11px] text-slate-400 bg-slate-900/60 p-2 rounded">
                  {dietPlan}
                </p>
                <div className="text-[11px] text-slate-400 pt-1 flex justify-between">
                  <span>Next Doctor Round: <strong>07:30 PM</strong></span>
                  <span>Vitals Check: <strong>Every 4 Hrs</strong></span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* MODAL FOOTER */}
        <div className="no-print flex items-center justify-between border-t border-slate-200 bg-white px-6 py-3">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span>🔒 Cryptographic Bed Token:</span>
            <span className="font-mono text-[11px] text-slate-700">SHA256:BEDSIDE-{bed.bedCode}</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onClose}>
              Close
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handlePrint}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold"
            >
              🖨️ Print Bedside Standee
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
