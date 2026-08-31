import React, { useState } from 'react';
import { Button, Input } from '@docsearch/ui-kit';
import type { EmergencyEncounterDto, CreateDispositionRequest, DispositionOutcome } from '@docsearch/api-contracts';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  encounter: EmergencyEncounterDto | null;
  onSubmit: (req: CreateDispositionRequest) => Promise<void>;
  tenantId: string;
  partnerId: string;
  organizationId: string;
  branchId: string;
}

export const CreateDispositionDialog: React.FC<Props> = ({
  isOpen,
  onClose,
  encounter,
  onSubmit,
  tenantId,
  partnerId,
  organizationId,
  branchId
}) => {
  const [outcome, setOutcome] = useState<DispositionOutcome>('IPD_ADMISSION_WARD');
  const [physician, setPhysician] = useState('Dr. Evelyn Reed, MD');
  const [destination, setDestination] = useState('Ward 3 (General Medical / Bed 12)');
  const [summary, setSummary] = useState('Patient stabilized post-emergency intervention; transferred to IPD for inpatient management.');
  const [followUp, setFollowUp] = useState('Routine vitals q4h, broad spectrum antibiotics');
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
        patientName: encounter.patientName,
        outcome,
        authorizingPhysician: physician,
        destinationWardOrFacility: destination,
        clinicalSummary: summary,
        followUpInstructions: followUp
      });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl">
        <h2 className="text-xl font-bold text-gray-900 mb-2">Emergency Disposition Decision</h2>
        <p className="text-xs text-gray-500 mb-4">{encounter.patientName} — {encounter.chiefComplaint}</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Disposition Pathway</label>
            <select value={outcome} onChange={(e) => setOutcome(e.target.value as DispositionOutcome)} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm font-bold">
              <option value="DISCHARGE_HOME">Discharge Home (Outpatient Follow-up)</option>
              <option value="IPD_ADMISSION_WARD">Admit to Inpatient Ward (IPD)</option>
              <option value="IPD_ADMISSION_ICU">Admit to Intensive Care Unit (ICU)</option>
              <option value="OPERATION_THEATRE_STAT">Stat Emergency Surgery (OT)</option>
              <option value="INTER_HOSPITAL_TRANSFER">Inter-Hospital Tertiary Transfer</option>
              <option value="LEFT_AGAINST_MEDICAL_ADVICE">Left Against Medical Advice (LAMA)</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Authorizing Physician</label>
              <Input value={physician} onChange={(e) => setPhysician(e.target.value)} required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Target Ward / Unit</label>
              <Input value={destination} onChange={(e) => setDestination(e.target.value)} />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Clinical Handover Summary</label>
            <Input value={summary} onChange={(e) => setSummary(e.target.value)} required />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Follow-up / Discharge Orders</label>
            <Input value={followUp} onChange={(e) => setFollowUp(e.target.value)} />
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" type="button" onClick={onClose} disabled={loading}>Cancel</Button>
            <Button variant="primary" type="submit" disabled={loading}>{loading ? 'Executing...' : 'Authorize Disposition'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
};
