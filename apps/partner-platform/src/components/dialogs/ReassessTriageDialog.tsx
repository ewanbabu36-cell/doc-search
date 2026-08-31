import React, { useState } from 'react';
import { Button, Input } from '@docsearch/ui-kit';
import type { EmergencyEncounterDto, ReassessTriageRequest, ESILevel } from '@docsearch/api-contracts';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  encounter: EmergencyEncounterDto | null;
  onSubmit: (req: ReassessTriageRequest) => Promise<void>;
  tenantId: string;
  partnerId: string;
  organizationId: string;
  branchId: string;
}

export const ReassessTriageDialog: React.FC<Props> = ({
  isOpen,
  onClose,
  encounter,
  onSubmit,
  tenantId,
  partnerId,
  organizationId,
  branchId
}) => {
  const [newEsi, setNewEsi] = useState<ESILevel>('ESI_1_IMMEDIATE_RESUSCITATION');
  const [reassessedByNurse, setReassessedByNurse] = useState('Nurse Mark Hopkins, RN');
  const [justification, setJustification] = useState('Clinical deterioration / alteration in consciousness');
  const [vitalsSummary, setVitalsSummary] = useState('BP: 85/50, HR: 130, SpO2: 90%');
  const [loading, setLoading] = useState(false);

  if (!isOpen || !encounter) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit({
        tenantId,
        partnerId,
        organizationId,
        branchId,
        encounterId: encounter.id,
        reassessedByNurse,
        newEsi,
        justification,
        reassessmentVitalsSummary: vitalsSummary
      });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl">
        <h2 className="text-xl font-bold text-amber-600 mb-2">Re-Triage & Acuity Escalation</h2>
        <p className="text-xs text-gray-500 mb-4">{encounter.patientName} — Current ESI: {encounter.triageEsiLevel}</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">New ESI Acuity Level</label>
            <select value={newEsi} onChange={(e) => setNewEsi(e.target.value as ESILevel)} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm font-bold">
              <option value="ESI_1_IMMEDIATE_RESUSCITATION">ESI 1 - Immediate Resuscitation</option>
              <option value="ESI_2_EMERGENT_HIGH_RISK">ESI 2 - Emergent / High Risk</option>
              <option value="ESI_3_URGENT_MULTIPLE_RESOURCES">ESI 3 - Urgent</option>
              <option value="ESI_4_LESS_URGENT_ONE_RESOURCE">ESI 4 - Less Urgent</option>
              <option value="ESI_5_NON_URGENT_NO_RESOURCES">ESI 5 - Non-Urgent</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Reassessment Nurse</label>
            <Input value={reassessedByNurse} onChange={(e) => setReassessedByNurse(e.target.value)} required />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Clinical Justification for Re-Triage</label>
            <Input value={justification} onChange={(e) => setJustification(e.target.value)} required />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Updated Vitals Summary</label>
            <Input value={vitalsSummary} onChange={(e) => setVitalsSummary(e.target.value)} required />
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" type="button" onClick={onClose} disabled={loading}>Cancel</Button>
            <Button variant="primary" type="submit" disabled={loading}>{loading ? 'Applying...' : 'Apply Re-Triage & Audit'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
};
