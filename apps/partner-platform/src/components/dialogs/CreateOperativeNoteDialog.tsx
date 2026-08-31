import React, { useState } from 'react';
import { Button, Input } from '@docsearch/ui-kit';
import type { OTScheduleDto, CreateOperativeNoteRequest } from '@docsearch/api-contracts';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  schedule: OTScheduleDto | null;
  onSubmit: (req: CreateOperativeNoteRequest) => Promise<void>;
  tenantId: string;
  partnerId: string;
  organizationId: string;
  branchId: string;
}

export const CreateOperativeNoteDialog: React.FC<Props> = ({
  isOpen,
  onClose,
  schedule,
  onSubmit,
  tenantId,
  partnerId,
  organizationId,
  branchId
}) => {
  const [preOpDiag, setPreOpDiag] = useState('Severe Coronary Artery Disease');
  const [postOpDiag, setPostOpDiag] = useState('Status post CABG x3 on CPB');
  const [findings, setFindings] = useState('Triple vessel disease. Excellent graft flow post anastomosis.');
  const [technique, setTechnique] = useState('1. Median sternotomy. 2. Vessel harvesting. 3. Systemic heparinization & CPB. 4. Grafting. 5. Sternal closure.');
  const [instructions, setInstructions] = useState('Transfer intubated to CTVS ICU. Monitor hemodynamics q1h.');
  const [bloodLoss, setBloodLoss] = useState('150');
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
        patientName: schedule.patientName,
        patientMrn: schedule.patientMrn,
        primarySurgeonName: schedule.primarySurgeonName,
        preOperativeDiagnosis: preOpDiag,
        postOperativeDiagnosis: postOpDiag,
        procedurePerformedTitle: schedule.procedureName,
        detailedOperativeFindings: findings,
        operativeTechniqueStepByStep: technique,
        estimatedBloodLossMl: parseInt(bloodLoss) || 150,
        postOperativeInstructions: instructions
      });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-xl bg-white p-6 shadow-2xl">
        <h2 className="text-xl font-bold text-gray-900 mb-2">Draft Operative Note</h2>
        <p className="text-xs text-gray-500 mb-4">{schedule.patientName} — {schedule.procedureName}</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Pre-Op Diagnosis</label>
              <Input value={preOpDiag} onChange={(e) => setPreOpDiag(e.target.value)} required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Post-Op Diagnosis</label>
              <Input value={postOpDiag} onChange={(e) => setPostOpDiag(e.target.value)} required />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Operative Findings</label>
            <Input value={findings} onChange={(e) => setFindings(e.target.value)} required />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Step-by-Step Surgical Technique</label>
            <Input value={technique} onChange={(e) => setTechnique(e.target.value)} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Estimated Blood Loss (ml)</label>
              <Input type="number" value={bloodLoss} onChange={(e) => setBloodLoss(e.target.value)} required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Post-Op Orders / Instructions</label>
              <Input value={instructions} onChange={(e) => setInstructions(e.target.value)} required />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" type="button" onClick={onClose} disabled={loading}>Cancel</Button>
            <Button variant="primary" type="submit" disabled={loading}>{loading ? 'Drafting...' : 'Save Draft Operative Note'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
};
