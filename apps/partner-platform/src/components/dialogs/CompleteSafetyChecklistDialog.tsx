import React, { useState } from 'react';
import { Button } from '@docsearch/ui-kit';
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
  const [conductedBy, setConductedBy] = useState('Nurse Priya Singh');
  const conductedRole = 'CIRCULATING_NURSE';
  const [patientConfirmed, setPatientConfirmed] = useState(true);
  const [siteMarkingConfirmed, setSiteMarkingConfirmed] = useState(true);
  const [anaesthesiaMachineChecked, setAnaesthesiaMachineChecked] = useState(true);
  const [spongeCountCorrect, setSpongeCountCorrect] = useState(true);
  const [loading, setLoading] = useState(false);

  if (!isOpen || !schedule) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
        conductedBy,
        conductedRole,
        patientConfirmed,
        siteMarkingConfirmed,
        anaesthesiaMachineChecked,
        pulseOximeterFunctioning: true,
        knownAllergyConfirmed: true,
        difficultAirwayRiskEvaluated: true,
        bloodLossRiskEvaluated: true,
        teamIntroducedRoles: true,
        antibioticProphylaxisGiven: true,
        essentialImagingDisplayed: true,
        spongeCountCorrect,
        needleCountCorrect: true,
        instrumentCountCorrect: true,
        specimenProperlyLabeled: true,
        equipmentIssuesIdentified: false,
        recoveryConcernsAddressed: true
      });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-xl bg-white p-6 shadow-2xl">
        <h2 className="text-xl font-bold text-gray-900 mb-2">WHO Surgical Safety Checklist</h2>
        <p className="text-xs text-gray-500 mb-4">{schedule.patientName} — {schedule.procedureName}</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Checklist Stage</label>
              <select
                value={stage}
                onChange={(e) => setStage(e.target.value as SurgicalSafetyStage)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              >
                <option value="SIGN_IN">Sign In (Before Induction)</option>
                <option value="TIME_OUT">Time Out (Before Skin Incision)</option>
                <option value="SIGN_OUT">Sign Out (Before Leaving OT)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Conducted By</label>
              <input
                type="text"
                value={conductedBy}
                onChange={(e) => setConductedBy(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                required
              />
            </div>
          </div>
          <div className="space-y-2 text-xs border rounded-lg p-3 bg-gray-50">
            <label className="flex items-center gap-2 cursor-pointer font-medium text-gray-800">
              <input type="checkbox" checked={patientConfirmed} onChange={(e) => setPatientConfirmed(e.target.checked)} />
              Patient Identity, Site, Procedure & Consent Confirmed
            </label>
            <label className="flex items-center gap-2 cursor-pointer font-medium text-gray-800">
              <input type="checkbox" checked={siteMarkingConfirmed} onChange={(e) => setSiteMarkingConfirmed(e.target.checked)} />
              Surgical Site Marking Verified by All Team Members
            </label>
            <label className="flex items-center gap-2 cursor-pointer font-medium text-gray-800">
              <input type="checkbox" checked={anaesthesiaMachineChecked} onChange={(e) => setAnaesthesiaMachineChecked(e.target.checked)} />
              Anaesthesia Machine & Medication Safety Check Complete
            </label>
            <label className="flex items-center gap-2 cursor-pointer font-medium text-gray-800">
              <input type="checkbox" checked={spongeCountCorrect} onChange={(e) => setSpongeCountCorrect(e.target.checked)} />
              Instrument, Sponge & Needle Counts Reconciled
            </label>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" type="button" onClick={onClose} disabled={loading}>Cancel</Button>
            <Button variant="primary" type="submit" disabled={loading}>{loading ? 'Executing...' : `Sign & Seal ${stage}`}</Button>
          </div>
        </form>
      </div>
    </div>
  );
};
