import React, { useState } from 'react';
import { Button, Badge } from '@docsearch/ui-kit';
import type { OTScheduleDto, CompleteSafetyChecklistRequest, SurgicalSafetyStage } from '@docsearch/api-contracts';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  schedule: OTScheduleDto | null;
  onSubmit: (req: CompleteSafetyChecklistRequest) => Promise<void>;
  tenantId: string;
  partnerId: string;
  organizationId: string;
  branchId: string;
}

export const CompleteSafetyChecklistDialog: React.FC<Props> = ({
  isOpen,
  onClose,
  schedule,
  onSubmit,
  tenantId,
  partnerId,
  organizationId,
  branchId
}) => {
  const [stage, setStage] = useState<SurgicalSafetyStage>('SIGN_IN');
  const [conductedBy, setConductedBy] = useState('Sister Priya Singh (RN, Lead Scrub)');
  const [conductedRole, setConductedRole] = useState('CIRCULATING_NURSE');

  // Sign-In Check Items (Before Induction)
  const [patientConfirmed, setPatientConfirmed] = useState(true);
  const [siteMarkingConfirmed, setSiteMarkingConfirmed] = useState(true);
  const [anaesthesiaMachineChecked, setAnaesthesiaMachineChecked] = useState(true);
  const [pulseOximeterFunctioning, setPulseOximeterFunctioning] = useState(true);
  const [knownAllergyConfirmed, setKnownAllergyConfirmed] = useState(true);
  const [difficultAirwayRiskEvaluated, setDifficultAirwayRiskEvaluated] = useState(true);
  const [bloodLossRiskEvaluated, setBloodLossRiskEvaluated] = useState(true);

  // Time-Out Check Items (Before Incision)
  const [teamIntroducedRoles, setTeamIntroducedRoles] = useState(true);
  const [antibioticProphylaxisGiven, setAntibioticProphylaxisGiven] = useState(true);
  const [essentialImagingDisplayed, setEssentialImagingDisplayed] = useState(true);

  // Sign-Out Check Items (Before Leaving OT)
  const [spongeCountCorrect, setSpongeCountCorrect] = useState(true);
  const [needleCountCorrect, setNeedleCountCorrect] = useState(true);
  const [instrumentCountCorrect, setInstrumentCountCorrect] = useState(true);
  const [specimenProperlyLabeled, setSpecimenProperlyLabeled] = useState(true);
  const [equipmentIssuesIdentified, setEquipmentIssuesIdentified] = useState(false);
  const [recoveryConcernsAddressed, setRecoveryConcernsAddressed] = useState(true);

  // Clinical Exception Override
  const [isExceptionOverridden, setIsExceptionOverridden] = useState(false);
  const [overrideReason, setOverrideReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !schedule) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await onSubmit({
        tenantId,
        partnerId,
        organizationId,
        branchId,
        scheduleId: schedule.id,
        patientId: schedule.patientId,
        stage,
        conductedBy: conductedBy.trim(),
        conductedRole,
        patientConfirmed,
        siteMarkingConfirmed,
        anaesthesiaMachineChecked,
        pulseOximeterFunctioning,
        knownAllergyConfirmed,
        difficultAirwayRiskEvaluated,
        bloodLossRiskEvaluated,
        teamIntroducedRoles,
        antibioticProphylaxisGiven,
        essentialImagingDisplayed,
        spongeCountCorrect,
        needleCountCorrect,
        instrumentCountCorrect,
        specimenProperlyLabeled,
        equipmentIssuesIdentified,
        recoveryConcernsAddressed,
        isExceptionOverridden: isExceptionOverridden || undefined,
        overrideReason: isExceptionOverridden ? overrideReason.trim() : undefined
      });
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to commit safety checklist.');
    } finally {
      setLoading(false);
    }
  };

  const getStageHeader = () => {
    switch (stage) {
      case 'SIGN_IN':
        return {
          title: 'PHASE 1: SIGN IN',
          subtitle: 'Before induction of anaesthesia (With nurse & anaesthetist)',
          color: 'bg-amber-500/20 text-amber-300 border-amber-500/40'
        };
      case 'TIME_OUT':
        return {
          title: 'PHASE 2: TIME OUT',
          subtitle: 'Before skin incision (Entire surgical team pause)',
          color: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
        };
      case 'SIGN_OUT':
        return {
          title: 'PHASE 3: SIGN OUT',
          subtitle: 'Before patient leaves operating theatre (With nurse, anaesthetist & surgeon)',
          color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
        };
    }
  };

  const stageMeta = getStageHeader();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-3 sm:p-4 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl max-h-[92vh] flex flex-col rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
        {/* MODAL CONTROL HEADER */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-900 px-6 py-4 text-white">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600/30 text-indigo-400 border border-indigo-500/40 text-xl font-bold">
              🩺
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-wide">
                  WHO Surgical Safety Checklist
                </h2>
                <Badge variant="primary" className="text-[10px] uppercase font-black tracking-wider">
                  NABH • SURGICAL CARE
                </Badge>
              </div>
              <p className="text-xs text-slate-300">
                Patient: <strong className="text-white">{schedule.patientName}</strong> ({schedule.patientMrn || 'OT-PT-01'}) • {schedule.procedureName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        {/* STAGE SELECTOR TABS */}
        <div className="flex border-b border-slate-200 bg-slate-100 p-1.5 text-xs font-bold">
          <button
            type="button"
            onClick={() => setStage('SIGN_IN')}
            className={`flex-1 py-2 rounded-lg transition-all text-center flex items-center justify-center gap-1.5 ${
              stage === 'SIGN_IN'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            <span>🟡</span>
            <span>1. Sign In (Pre-Induction)</span>
          </button>
          <button
            type="button"
            onClick={() => setStage('TIME_OUT')}
            className={`flex-1 py-2 rounded-lg transition-all text-center flex items-center justify-center gap-1.5 ${
              stage === 'TIME_OUT'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            <span>🔵</span>
            <span>2. Time Out (Pre-Incision)</span>
          </button>
          <button
            type="button"
            onClick={() => setStage('SIGN_OUT')}
            className={`flex-1 py-2 rounded-lg transition-all text-center flex items-center justify-center gap-1.5 ${
              stage === 'SIGN_OUT'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            <span>🟢</span>
            <span>3. Sign Out (Pre-Exit)</span>
          </button>
        </div>

        {/* MODAL FORM BODY */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4 text-xs text-slate-800">
          {error && (
            <div className="p-3 bg-red-50 border border-red-300 rounded-lg text-red-700 text-xs font-medium">
              ⚠️ {error}
            </div>
          )}

          {/* ACTIVE PHASE BANNER */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
            <div>
              <span className="font-black text-slate-900 text-sm tracking-wide block">
                {stageMeta.title}
              </span>
              <span className="text-slate-500 text-[11px] font-medium">
                {stageMeta.subtitle}
              </span>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-500 block uppercase font-bold">OT Suite:</span>
              <strong className="text-slate-800 font-mono">{schedule.roomName || 'Main OT-01'}</strong>
            </div>
          </div>

          {/* AUDITORS ROW */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
            <div>
              <label className="block text-slate-700 font-bold mb-1">Checklist Checklist Conductor *</label>
              <input
                type="text"
                value={conductedBy}
                onChange={(e) => setConductedBy(e.target.value)}
                className="w-full rounded border border-slate-300 p-2 text-xs focus:ring-1 focus:ring-indigo-500 bg-white"
                required
              />
            </div>
            <div>
              <label className="block text-slate-700 font-bold mb-1">Conductor Clinical Role *</label>
              <select
                value={conductedRole}
                onChange={(e) => setConductedRole(e.target.value)}
                className="w-full rounded border border-slate-300 p-2 text-xs focus:ring-1 focus:ring-indigo-500 bg-white"
              >
                <option value="CIRCULATING_NURSE">Circulating Staff Nurse</option>
                <option value="SCRUB_NURSE">Scrub Nurse</option>
                <option value="ANAESTHETIST">Consultant Anaesthesiologist</option>
                <option value="PRIMARY_SURGEON">Primary Operating Surgeon</option>
              </select>
            </div>
          </div>

          {/* PHASE 1: SIGN IN ITEMS */}
          {stage === 'SIGN_IN' && (
            <div className="space-y-2.5 p-4 rounded-xl border-2 border-amber-300 bg-amber-50/30">
              <h3 className="font-black text-amber-950 uppercase text-[11px] tracking-wider mb-2 flex items-center gap-1.5">
                <span>🟡</span> Sign In Mandatory Verification Items (Before Induction)
              </h3>
              
              <label className="flex items-start gap-2.5 p-2 rounded bg-white border border-amber-200/80 cursor-pointer hover:bg-amber-50/50">
                <input
                  type="checkbox"
                  checked={patientConfirmed}
                  onChange={(e) => setPatientConfirmed(e.target.checked)}
                  className="mt-0.5 rounded text-amber-600 focus:ring-amber-500 h-4 w-4"
                />
                <div>
                  <strong className="text-slate-900 block">Patient Identity, Surgical Site, Procedure &amp; Consent Confirmed</strong>
                  <span className="text-slate-500 text-[11px]">Patient verbally confirmed identity and informed surgical/anaesthetic consent verified.</span>
                </div>
              </label>

              <label className="flex items-start gap-2.5 p-2 rounded bg-white border border-amber-200/80 cursor-pointer hover:bg-amber-50/50">
                <input
                  type="checkbox"
                  checked={siteMarkingConfirmed}
                  onChange={(e) => setSiteMarkingConfirmed(e.target.checked)}
                  className="mt-0.5 rounded text-amber-600 focus:ring-amber-500 h-4 w-4"
                />
                <div>
                  <strong className="text-slate-900 block">Surgical Site Marked with Surgical Marker</strong>
                  <span className="text-slate-500 text-[11px]">Site marked by primary operating surgeon / verified not applicable for midline/endoscopic.</span>
                </div>
              </label>

              <label className="flex items-start gap-2.5 p-2 rounded bg-white border border-amber-200/80 cursor-pointer hover:bg-amber-50/50">
                <input
                  type="checkbox"
                  checked={anaesthesiaMachineChecked}
                  onChange={(e) => setAnaesthesiaMachineChecked(e.target.checked)}
                  className="mt-0.5 rounded text-amber-600 focus:ring-amber-500 h-4 w-4"
                />
                <div>
                  <strong className="text-slate-900 block">Anaesthesia Machine &amp; Medication Safety Check Complete</strong>
                  <span className="text-slate-500 text-[11px]">Vaporizers, suction, emergency drugs (Atropine, Adrenaline) and gas pipelines verified intact.</span>
                </div>
              </label>

              <label className="flex items-start gap-2.5 p-2 rounded bg-white border border-amber-200/80 cursor-pointer hover:bg-amber-50/50">
                <input
                  type="checkbox"
                  checked={pulseOximeterFunctioning}
                  onChange={(e) => setPulseOximeterFunctioning(e.target.checked)}
                  className="mt-0.5 rounded text-amber-600 focus:ring-amber-500 h-4 w-4"
                />
                <div>
                  <strong className="text-slate-900 block">Pulse Oximeter Placed on Patient &amp; Actively Functioning</strong>
                  <span className="text-slate-500 text-[11px]">SpO2 waveform valid and audible tone enabled.</span>
                </div>
              </label>

              <label className="flex items-start gap-2.5 p-2 rounded bg-white border border-amber-200/80 cursor-pointer hover:bg-amber-50/50">
                <input
                  type="checkbox"
                  checked={knownAllergyConfirmed}
                  onChange={(e) => setKnownAllergyConfirmed(e.target.checked)}
                  className="mt-0.5 rounded text-amber-600 focus:ring-amber-500 h-4 w-4"
                />
                <div>
                  <strong className="text-slate-900 block">Known Drug Allergies Checked &amp; Red Band Confirmed</strong>
                  <span className="text-slate-500 text-[11px]">Patient questioned regarding allergy to Penicillins, NSAIDs, Latex, or Anaesthetic agents.</span>
                </div>
              </label>

              <label className="flex items-start gap-2.5 p-2 rounded bg-white border border-amber-200/80 cursor-pointer hover:bg-amber-50/50">
                <input
                  type="checkbox"
                  checked={difficultAirwayRiskEvaluated}
                  onChange={(e) => setDifficultAirwayRiskEvaluated(e.target.checked)}
                  className="mt-0.5 rounded text-amber-600 focus:ring-amber-500 h-4 w-4"
                />
                <div>
                  <strong className="text-slate-900 block">Difficult Airway / Aspiration Risk Evaluated</strong>
                  <span className="text-slate-500 text-[11px]">Mallampati score assessed, video laryngoscope &amp; backup airway bougies ready in OT.</span>
                </div>
              </label>

              <label className="flex items-start gap-2.5 p-2 rounded bg-white border border-amber-200/80 cursor-pointer hover:bg-amber-50/50">
                <input
                  type="checkbox"
                  checked={bloodLossRiskEvaluated}
                  onChange={(e) => setBloodLossRiskEvaluated(e.target.checked)}
                  className="mt-0.5 rounded text-amber-600 focus:ring-amber-500 h-4 w-4"
                />
                <div>
                  <strong className="text-slate-900 block">Risk of &gt;500 mL Blood Loss Evaluated (7 mL/kg in children)</strong>
                  <span className="text-slate-500 text-[11px]">Adequate IV access (2 large-bore cannula) and crossmatched blood reserve available.</span>
                </div>
              </label>
            </div>
          )}

          {/* PHASE 2: TIME OUT ITEMS */}
          {stage === 'TIME_OUT' && (
            <div className="space-y-2.5 p-4 rounded-xl border-2 border-indigo-300 bg-indigo-50/30">
              <h3 className="font-black text-indigo-950 uppercase text-[11px] tracking-wider mb-2 flex items-center gap-1.5">
                <span>🔵</span> Time Out Mandatory Pause Items (Before Skin Incision)
              </h3>

              <label className="flex items-start gap-2.5 p-2 rounded bg-white border border-indigo-200/80 cursor-pointer hover:bg-indigo-50/50">
                <input
                  type="checkbox"
                  checked={teamIntroducedRoles}
                  onChange={(e) => setTeamIntroducedRoles(e.target.checked)}
                  className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                />
                <div>
                  <strong className="text-slate-900 block">All Team Members Introduced Themselves by Name &amp; Role</strong>
                  <span className="text-slate-500 text-[11px]">Surgeon, Anaesthetist, Scrub Nurse, Circulator, and Perfusionist verbally recognized.</span>
                </div>
              </label>

              <label className="flex items-start gap-2.5 p-2 rounded bg-white border border-indigo-200/80 cursor-pointer hover:bg-indigo-50/50">
                <input
                  type="checkbox"
                  checked={antibioticProphylaxisGiven}
                  onChange={(e) => setAntibioticProphylaxisGiven(e.target.checked)}
                  className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                />
                <div>
                  <strong className="text-slate-900 block">Antibiotic Prophylaxis Administered within 60 Minutes</strong>
                  <span className="text-slate-500 text-[11px]">IV Antibiotic infusion timing confirmed or declared not indicated.</span>
                </div>
              </label>

              <label className="flex items-start gap-2.5 p-2 rounded bg-white border border-indigo-200/80 cursor-pointer hover:bg-indigo-50/50">
                <input
                  type="checkbox"
                  checked={essentialImagingDisplayed}
                  onChange={(e) => setEssentialImagingDisplayed(e.target.checked)}
                  className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                />
                <div>
                  <strong className="text-slate-900 block">Essential Diagnostic Imaging Displayed &amp; Orientation Verified</strong>
                  <span className="text-slate-500 text-[11px]">PACS MRI / CT / Fluoroscopy scans mounted on OT viewer and verified right vs left side.</span>
                </div>
              </label>

              <div className="p-3 bg-white rounded border border-indigo-200 text-xs text-slate-700">
                <strong className="text-indigo-900 block mb-1">Verbal Surgical Team Briefing:</strong>
                <ul className="list-disc pl-4 space-y-1 text-[11px] text-slate-600">
                  <li><strong>Surgeon:</strong> Reviews critical or unexpected steps, operative duration, and anticipated blood loss.</li>
                  <li><strong>Anaesthetist:</strong> Reviews patient-specific issues and hemodynamic stability goals.</li>
                  <li><strong>Nursing Team:</strong> Confirms sterility indicators checked and sterile tray integrity maintained.</li>
                </ul>
              </div>
            </div>
          )}

          {/* PHASE 3: SIGN OUT ITEMS */}
          {stage === 'SIGN_OUT' && (
            <div className="space-y-2.5 p-4 rounded-xl border-2 border-emerald-300 bg-emerald-50/30">
              <h3 className="font-black text-emerald-950 uppercase text-[11px] tracking-wider mb-2 flex items-center gap-1.5">
                <span>🟢</span> Sign Out Reconciliation Items (Before Leaving OT)
              </h3>

              <label className="flex items-start gap-2.5 p-2 rounded bg-white border border-emerald-200/80 cursor-pointer hover:bg-emerald-50/50">
                <input
                  type="checkbox"
                  checked={spongeCountCorrect}
                  onChange={(e) => setSpongeCountCorrect(e.target.checked)}
                  className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                />
                <div>
                  <strong className="text-slate-900 block">Sponge &amp; Gauze Swab Count 100% Correct &amp; Reconciled</strong>
                  <span className="text-slate-500 text-[11px]">Physical count matches pre-incision register count. Zero retained foreign bodies.</span>
                </div>
              </label>

              <label className="flex items-start gap-2.5 p-2 rounded bg-white border border-emerald-200/80 cursor-pointer hover:bg-emerald-50/50">
                <input
                  type="checkbox"
                  checked={needleCountCorrect}
                  onChange={(e) => setNeedleCountCorrect(e.target.checked)}
                  className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                />
                <div>
                  <strong className="text-slate-900 block">Suture Needle &amp; Blade Count 100% Correct</strong>
                  <span className="text-slate-500 text-[11px]">All used needles accounted for in sharps magnetic counter box.</span>
                </div>
              </label>

              <label className="flex items-start gap-2.5 p-2 rounded bg-white border border-emerald-200/80 cursor-pointer hover:bg-emerald-50/50">
                <input
                  type="checkbox"
                  checked={instrumentCountCorrect}
                  onChange={(e) => setInstrumentCountCorrect(e.target.checked)}
                  className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                />
                <div>
                  <strong className="text-slate-900 block">Surgical Instrument Tray Count 100% Correct</strong>
                  <span className="text-slate-500 text-[11px]">Forceps, retractor blades, and artery clamps verified before abdominal/cavity closure.</span>
                </div>
              </label>

              <label className="flex items-start gap-2.5 p-2 rounded bg-white border border-emerald-200/80 cursor-pointer hover:bg-emerald-50/50">
                <input
                  type="checkbox"
                  checked={specimenProperlyLabeled}
                  onChange={(e) => setSpecimenProperlyLabeled(e.target.checked)}
                  className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                />
                <div>
                  <strong className="text-slate-900 block">Histopathology / Biopsy Specimen Correctly Labeled</strong>
                  <span className="text-slate-500 text-[11px]">Specimen read out aloud with patient name, UHID, and anatomical site of origin.</span>
                </div>
              </label>

              <label className="flex items-start gap-2.5 p-2 rounded bg-white border border-emerald-200/80 cursor-pointer hover:bg-emerald-50/50">
                <input
                  type="checkbox"
                  checked={recoveryConcernsAddressed}
                  onChange={(e) => setRecoveryConcernsAddressed(e.target.checked)}
                  className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                />
                <div>
                  <strong className="text-slate-900 block">Post-Operative PACU / ICU Concerns Addressed</strong>
                  <span className="text-slate-500 text-[11px]">Surgeon and anaesthetist discussed extubation plan, analgesia, and drain management.</span>
                </div>
              </label>

              <label className="flex items-start gap-2.5 p-2 rounded bg-white border border-emerald-200/80 cursor-pointer hover:bg-emerald-50/50">
                <input
                  type="checkbox"
                  checked={equipmentIssuesIdentified}
                  onChange={(e) => setEquipmentIssuesIdentified(e.target.checked)}
                  className="mt-0.5 rounded text-red-600 focus:ring-red-500 h-4 w-4"
                />
                <div>
                  <strong className="text-slate-900 block">Equipment Malfunctions / Breakdowns Logged</strong>
                  <span className="text-slate-500 text-[11px]">Check if cautery, laparoscope, or light source experienced failure for biomedical repair.</span>
                </div>
              </label>
            </div>
          )}

          {/* CLINICAL EXCEPTION OVERRIDE ACCORDION */}
          <div className="pt-2 border-t border-slate-200">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700">
                <input
                  type="checkbox"
                  checked={isExceptionOverridden}
                  onChange={(e) => setIsExceptionOverridden(e.target.checked)}
                  className="rounded text-red-600 focus:ring-red-500"
                />
                <span>Clinical Emergency Exception Override (Audited)</span>
              </label>
              {isExceptionOverridden && (
                <Badge variant="danger" className="text-[10px]">
                  OVERRIDE RECORDED
                </Badge>
              )}
            </div>

            {isExceptionOverridden && (
              <div className="mt-2 p-3 bg-red-50 rounded-lg border border-red-200">
                <label className="block text-slate-700 font-bold mb-1">
                  Clinical Rationale for Safety Item Bypass *
                </label>
                <textarea
                  value={overrideReason}
                  onChange={(e) => setOverrideReason(e.target.value)}
                  placeholder="e.g. Ruptured aortic aneurysm, immediate clamp required without team introductions."
                  className="w-full rounded border border-red-300 p-2 text-xs focus:ring-1 focus:ring-red-500"
                  rows={2}
                  required
                />
              </div>
            )}
          </div>

          {/* FOOTER ACTIONS */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-200">
            <div className="flex items-center gap-2 text-slate-500 text-[11px]">
              <span>🔒 Cryptographic Seal:</span>
              <span className="font-mono text-slate-700 font-bold">SHA256:WHO-OT-{schedule.id.slice(0, 8)}</span>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" type="button" onClick={onClose} disabled={loading}>
                Cancel
              </Button>
              <Button
                variant="primary"
                type="submit"
                disabled={loading}
                className={`font-bold ${
                  stage === 'SIGN_IN'
                    ? 'bg-amber-600 hover:bg-amber-700 text-white'
                    : stage === 'TIME_OUT'
                    ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                }`}
              >
                {loading ? 'Executing...' : `✓ Complete & Seal ${stage}`}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
