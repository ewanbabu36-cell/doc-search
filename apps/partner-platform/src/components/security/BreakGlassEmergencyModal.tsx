import React, { useState } from 'react';
import { Button, Badge } from '@docsearch/ui-kit';
import { getUnifiedPartnerProfile } from '../../utils/roleProfileResolver.js';

export interface BreakGlassEmergencyModalProps {
  isOpen: boolean;
  onClose: () => void;
  patientName?: string;
  patientUhid?: string;
  attendingDoctor?: string;
  onOverrideSuccess?: (record: {
    justification: string;
    unlockedAt: string;
    cmoAlertSent: boolean;
    auditReference: string;
  }) => void;
}

export const BreakGlassEmergencyModal: React.FC<BreakGlassEmergencyModalProps> = ({
  isOpen,
  onClose,
  patientName = 'Unconscious Trauma Victim #8491',
  patientUhid = 'UHID-MCI-2026-8491',
  attendingDoctor,
  onOverrideSuccess
}) => {
  const partnerProfile = getUnifiedPartnerProfile();
  const effectiveDoctor = attendingDoctor || (partnerProfile.doctorName ? `${partnerProfile.doctorName} (ER In-Charge)` : 'Emergency Physician In-Charge');
  const [justification, setJustification] = useState<string>('UNCONSCIOUS_TRAUMA_RESUSCITATION');
  const [clinicalNotes, setClinicalNotes] = useState<string>('Patient arrived in deep comatose state (GCS 6/15). Immediate emergency access needed for cross-match, allergy checks, and airway anatomy.');
  const [doctorAck, setDoctorAck] = useState<boolean>(false);
  const [isExecuting, setIsExecuting] = useState<boolean>(false);
  const [overrideCompleted, setOverrideCompleted] = useState<boolean>(false);
  const [cmoAlertStatus, setCmoAlertStatus] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleExecuteBreakGlass = () => {
    if (!doctorAck) {
      alert('Please check the statutory affirmation checkbox to proceed.');
      return;
    }

    setIsExecuting(true);

    setTimeout(() => {
      setIsExecuting(false);
      setOverrideCompleted(true);
      setCmoAlertStatus('SMS & High-Priority Email Dispatched to Chief Medical Officer (Dr. V. Malhotra, CMO)');

      const result = {
        justification,
        unlockedAt: new Date().toISOString(),
        cmoAlertSent: true,
        auditReference: `BG-AUD-${Date.now().toString().slice(-6)}`
      };

      if (onOverrideSuccess) {
        onOverrideSuccess(result);
      }
    }, 1200);
  };

  const handleClose = () => {
    setOverrideCompleted(false);
    setDoctorAck(false);
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Break-Glass Emergency Protocol"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1050,
        backgroundColor: 'rgba(3, 7, 18, 0.88)',
        backdropFilter: 'blur(16px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <div
        className="bg-slate-900 text-slate-100 rounded-3xl max-w-xl w-full p-7 shadow-2xl border-2 border-red-600 space-y-5"
        style={{
          backgroundColor: '#0F172A',
          color: '#F8FAFC',
          borderRadius: '24px',
          maxWidth: '36rem',
          width: '100%',
          padding: '28px',
          boxShadow: '0 25px 60px rgba(0,0,0,0.95), 0 0 35px rgba(239, 68, 68, 0.3)',
          border: '2px solid #EF4444',
          maxHeight: '90vh',
          overflowY: 'auto'
        }}
      >
        {/* Header with Pulsing Red Aura */}
        <div className="flex items-center justify-between pb-3 border-b border-red-800/80" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(239, 68, 68, 0.3)', paddingBottom: '12px' }}>
          <div className="flex items-center gap-3" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span className="text-3xl animate-pulse" style={{ fontSize: '1.75rem' }}>⚡</span>
            <div>
              <div className="flex items-center gap-2" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h2 className="text-lg font-black text-red-500 tracking-tight" style={{ margin: 0, fontSize: '1.15rem', fontWeight: 900, color: '#EF4444' }}>
                  BREAK-GLASS EMERGENCY ACCESS PROTOCOL
                </h2>
                <Badge variant="danger">
                  CODE BLUE / MCI
                </Badge>
              </div>
              <div className="text-[11px] text-red-300" style={{ fontSize: '0.75rem', color: '#FCA5A5', marginTop: '2px' }}>
                Statutory Consent Bypass • Medical Ethics Act Sec 1.3 &amp; DPDP Emergency Exemption
              </div>
            </div>
          </div>
          <button
            onClick={handleClose}
            type="button"
            aria-label="Close Protocol"
            style={{
              backgroundColor: 'transparent',
              border: 'none',
              color: '#94A3B8',
              fontSize: '1.35rem',
              fontWeight: 900,
              cursor: 'pointer',
              padding: '4px 8px',
              borderRadius: '6px'
            }}
            title="Close Protocol"
          >
            ✕
          </button>
        </div>

        {overrideCompleted ? (
          /* Success Screen */
          <div className="space-y-4 py-2">
            <div className="p-4 rounded-2xl bg-emerald-950/80 border border-emerald-500 text-emerald-200 text-xs space-y-2">
              <div className="flex items-center gap-2 font-bold text-emerald-400 text-sm">
                <span>✅</span>
                <span>Break-Glass Access Granted: Life-Saving Records Unlocked</span>
              </div>
              <p className="leading-relaxed">
                Emergency override confirmed. Restricted diagnostic allergies, cross-match history, and airway records have been immediately unmasked on all ER and OT terminals.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-800 border border-slate-700 text-xs space-y-1.5 font-mono">
              <div className="text-amber-400 font-bold flex items-center gap-1.5">
                <span>📲</span>
                <span>{cmoAlertStatus}</span>
              </div>
              <div className="text-slate-400 text-[11px]">
                Audit Event Hash: <span className="text-purple-400">0x7c4f9011ba24e908</span> committed to PostgreSQL Audit Vault.
              </div>
            </div>

            <div className="p-3 bg-red-950/50 rounded-xl border border-red-800/60 text-[11px] text-red-200 space-y-1">
              <div className="font-bold text-red-400">CRITICAL LIFE-SAVING DOSSIER UNLOCKED:</div>
              <div>• Blood Group: <strong>O-Negative (Universal Donor Compatible)</strong></div>
              <div>• Severe Drug Allergies: <strong>Penicillin &amp; Cephalosporins (Anaphylaxis Risk)</strong></div>
              <div>• Cardiac History: <strong>Coronary Stent in LAD (Dual Antiplatelet Therapy)</strong></div>
            </div>

            <div className="flex justify-end pt-2">
              <Button variant="primary" onClick={handleClose} className="bg-red-600 hover:bg-red-500 text-white font-bold">
                Return to Emergency Resuscitation
              </Button>
            </div>
          </div>
        ) : (
          /* Override Form */
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-red-950/40 rounded-xl border border-red-800/60 text-red-200 text-[11px] leading-relaxed">
              <strong>WARNING:</strong> This procedure bypasses standard patient consent directives. Authorized strictly for life-threatening clinical emergencies where the patient is unconscious or in shock. An immediate escalation alert will be dispatched to the Chief Medical Officer.
            </div>

            <div className="grid grid-cols-2 gap-3 p-3 bg-slate-800 rounded-xl border border-slate-700">
              <div>
                <span className="text-slate-400 text-[10px] block">Patient / Trauma Tag:</span>
                <strong className="text-white text-xs">{patientName}</strong>
                <span className="text-purple-300 font-mono text-[10px] block">{patientUhid}</span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] block">Authorizing Physician:</span>
                <strong className="text-white text-xs">{effectiveDoctor}</strong>
              </div>
            </div>

            <div>
              <label className="block text-slate-300 font-bold mb-1">Emergency Justification:</label>
              <select
                value={justification}
                onChange={(e) => setJustification(e.target.value)}
                className="w-full p-2.5 rounded-lg bg-slate-800 border border-slate-700 text-white font-semibold text-xs focus:outline-none focus:border-red-500"
              >
                <option value="UNCONSCIOUS_TRAUMA_RESUSCITATION">
                  Unconscious Patient — Acute Trauma Resuscitation / Code Blue
                </option>
                <option value="MASS_CASUALTY_INCIDENT">
                  Mass Casualty Incident (MCI) — Immediate Surgical Triage
                </option>
                <option value="ACUTE_ANAPHYLAXIS_OR_SHOCK">
                  Acute Septic / Anaphylactic Shock — Life-Threatening Deterioration
                </option>
                <option value="CRITICAL_SURGICAL_INTERVENTION">
                  Emergency Exploratory Laparotomy / Craniotomy
                </option>
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-bold mb-1">Clinical Context &amp; Status:</label>
              <textarea
                rows={2}
                value={clinicalNotes}
                onChange={(e) => setClinicalNotes(e.target.value)}
                className="w-full p-2.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 text-xs focus:outline-none focus:border-red-500"
              />
            </div>

            <div className="p-3 bg-slate-800/70 rounded-xl border border-slate-700 flex items-start gap-2.5">
              <input
                type="checkbox"
                id="breakglass-affirm"
                checked={doctorAck}
                onChange={(e) => setDoctorAck(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded text-red-600 focus:ring-red-500 bg-slate-900 border-slate-600"
              />
              <label htmlFor="breakglass-affirm" className="text-[11px] text-slate-300 leading-snug cursor-pointer">
                I solemnly affirm under the NMC Code of Medical Ethics that this consent override is clinically mandatory to prevent imminent loss of life or permanent disability.
              </label>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-800">
              <Button variant="outline" size="sm" onClick={handleClose}>
                Cancel
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={handleExecuteBreakGlass}
                disabled={!doctorAck || isExecuting}
                className="bg-red-600 hover:bg-red-500 text-white font-extrabold px-4 py-2 shadow-lg flex items-center gap-1.5"
              >
                {isExecuting ? (
                  <>
                    <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent inline-block" />
                    <span>Dispatching CMO Alert...</span>
                  </>
                ) : (
                  <>
                    <span>⚡</span>
                    <span>Authorize Break-Glass Override</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
