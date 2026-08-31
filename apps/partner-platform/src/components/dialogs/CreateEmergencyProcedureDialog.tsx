import React, { useState } from 'react';
import { Button, Input } from '@docsearch/ui-kit';
import type { EmergencyEncounterDto, CreateEmergencyProcedureRequest } from '@docsearch/api-contracts';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  encounter: EmergencyEncounterDto | null;
  onSubmit: (req: CreateEmergencyProcedureRequest) => Promise<void>;
  tenantId: string;
  partnerId: string;
  organizationId: string;
  branchId: string;
}

export const CreateEmergencyProcedureDialog: React.FC<Props> = ({
  isOpen,
  onClose,
  encounter,
  onSubmit,
  tenantId,
  partnerId,
  organizationId,
  branchId
}) => {
  const [procedureName, setProcedureName] = useState('Endotracheal Intubation & Central Line Insertion');
  const [performedBy, setPerformedBy] = useState('Dr. Marcus Webb, MD');
  const [assisting, setAssisting] = useState('Nurse Mark Hopkins, RN');
  const [indication, setIndication] = useState('Severe respiratory distress and hemodynamic resuscitation');
  const [technique, setTechnique] = useState('Direct laryngoscopy 8.0 ETT placed on 1st attempt; right internal jugular triple lumen CV line inserted under sterile ultrasound guidance.');
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
        procedureName,
        performedByDoctor: performedBy,
        assistingStaff: assisting,
        indication,
        techniqueNotes: technique,
        complications: 'None'
      });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl">
        <h2 className="text-xl font-bold text-gray-900 mb-2">Log Emergency Bedside Procedure</h2>
        <p className="text-xs text-gray-500 mb-4">{encounter.patientName} ({encounter.patientMrn})</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Procedure Name</label>
            <Input value={procedureName} onChange={(e) => setProcedureName(e.target.value)} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Performed By</label>
              <Input value={performedBy} onChange={(e) => setPerformedBy(e.target.value)} required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Assisting Nurse</label>
              <Input value={assisting} onChange={(e) => setAssisting(e.target.value)} required />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Clinical Indication</label>
            <Input value={indication} onChange={(e) => setIndication(e.target.value)} required />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Technique & Post-Procedure Verification</label>
            <Input value={technique} onChange={(e) => setTechnique(e.target.value)} required />
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" type="button" onClick={onClose} disabled={loading}>Cancel</Button>
            <Button variant="primary" type="submit" disabled={loading}>{loading ? 'Logging...' : 'Log Procedure Record'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
};
