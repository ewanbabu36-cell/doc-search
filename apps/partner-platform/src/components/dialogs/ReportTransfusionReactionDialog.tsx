import React, { useState } from 'react';
import { Button, Input } from '@docsearch/ui-kit';
import type { TransfusionRecordDto, ReportTransfusionReactionRequest, TransfusionReactionSeverity } from '@docsearch/api-contracts';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  transfusion: TransfusionRecordDto | null;
  onSubmit: (req: ReportTransfusionReactionRequest) => Promise<void>;
  tenantId: string;
  partnerId: string;
  organizationId: string;
  branchId: string;
}

export const ReportTransfusionReactionDialog: React.FC<Props> = ({
  isOpen,
  onClose,
  transfusion,
  onSubmit,
  tenantId,
  partnerId,
  organizationId,
  branchId
}) => {
  const [severity, setSeverity] = useState<TransfusionReactionSeverity>('MILD_ALLERGIC_FEBRILE');
  const [symptoms, setSymptoms] = useState('Urticaria, chills, shivering and temperature spike of 2.1°F.');
  const [interventions, setInterventions] = useState('Infusion stopped immediately; IV access maintained with normal saline; Diphenhydramine 25mg IV administered.');
  const [doc, setDoc] = useState('Dr. Arthur Pendelton, MD');
  const [clerical, setClerical] = useState(true);
  const [loading, setLoading] = useState(false);

  if (!isOpen || !transfusion) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit({
        tenantId,
        partnerId,
        organizationId,
        branchId,
        transfusionId: transfusion.id,
        patientName: transfusion.patientName,
        patientMrn: transfusion.patientMrn,
        componentCode: transfusion.componentCode,
        severity,
        symptomsObserved: symptoms,
        immediateInterventions: interventions,
        notifiedPhysicianName: doc,
        clericalCheckConfirmedMatching: clerical
      });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl">
        <h2 className="text-xl font-bold text-red-900 mb-2">Report Transfusion Adverse Reaction</h2>
        <p className="text-xs text-gray-500 mb-4">{transfusion.transfusionCode} — Patient: {transfusion.patientName}</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Reaction Severity</label>
            <select value={severity} onChange={(e) => setSeverity(e.target.value as TransfusionReactionSeverity)} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm font-bold text-red-800">
              <option value="MILD_ALLERGIC_FEBRILE">Mild Allergic / Febrile Non-Hemolytic</option>
              <option value="MODERATE_ANAPHYLACTIC">Moderate Anaphylactic Reaction</option>
              <option value="SEVERE_LIFE_THREATENING_TRALI_TACO">Severe TRALI / TACO / Septic Shock</option>
              <option value="HEMOLYTIC_TRANSFUSION_REACTION">Acute Hemolytic Transfusion Reaction</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Symptoms Observed</label>
            <Input value={symptoms} onChange={(e) => setSymptoms(e.target.value)} required />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Immediate Clinical Interventions</label>
            <Input value={interventions} onChange={(e) => setInterventions(e.target.value)} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Notified Physician</label>
              <Input value={doc} onChange={(e) => setDoc(e.target.value)} required />
            </div>
            <div className="flex items-center">
              <label className="flex items-center gap-2 text-xs font-semibold text-gray-700">
                <input type="checkbox" checked={clerical} onChange={(e) => setClerical(e.target.checked)} className="rounded" />
                Bedside clerical tag match re-verified
              </label>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" type="button" onClick={onClose} disabled={loading}>Cancel</Button>
            <Button variant="danger" type="submit" disabled={loading}>{loading ? 'Reporting...' : 'Submit Reaction Report'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
};
