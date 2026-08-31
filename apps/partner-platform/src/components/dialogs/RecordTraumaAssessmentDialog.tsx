import React, { useState } from 'react';
import { Button, Input } from '@docsearch/ui-kit';
import type { TraumaActivationDto, RecordTraumaAssessmentRequest } from '@docsearch/api-contracts';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  trauma: TraumaActivationDto | null;
  onSubmit: (req: RecordTraumaAssessmentRequest) => Promise<void>;
  tenantId: string;
}

export const RecordTraumaAssessmentDialog: React.FC<Props> = ({
  isOpen,
  onClose,
  trauma,
  onSubmit,
  tenantId
}) => {
  const [secondarySurvey, setSecondarySurvey] = useState('Head to toe completed; scalp laceration 4cm sutured; abdomen soft');
  const [fractures, setFractures] = useState('Right closed femur fracture, stable pelvis on binder');
  const [updatedGcs, setUpdatedGcs] = useState('14');
  const [consultantNotes, setConsultantNotes] = useState('Orthopaedic surgeon evaluated; scheduled for intramedullary nailing');
  const [loading, setLoading] = useState(false);

  if (!isOpen || !trauma) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit({
        tenantId,
        traumaId: trauma.id,
        secondarySurveyFindings: secondarySurvey,
        fracturesIdentified: fractures,
        updatedGcs: parseInt(updatedGcs) || 15,
        consultantSurgeonFindings: consultantNotes,
        recordedBy: trauma.traumaTeamLeader
      });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl">
        <h2 className="text-xl font-bold text-gray-900 mb-2">Secondary Survey & Specialist Findings</h2>
        <p className="text-xs text-gray-500 mb-4">{trauma.activationNumber} — {trauma.patientName}</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Secondary Survey Findings</label>
            <Input value={secondarySurvey} onChange={(e) => setSecondarySurvey(e.target.value)} required />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Fractures / Orthopaedic Injuries</label>
            <Input value={fractures} onChange={(e) => setFractures(e.target.value)} required />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Updated GCS Score</label>
            <Input type="number" value={updatedGcs} onChange={(e) => setUpdatedGcs(e.target.value)} required />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Specialist Consultant Findings</label>
            <Input value={consultantNotes} onChange={(e) => setConsultantNotes(e.target.value)} required />
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" type="button" onClick={onClose} disabled={loading}>Cancel</Button>
            <Button variant="primary" type="submit" disabled={loading}>{loading ? 'Saving...' : 'Record Secondary Survey'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
};
