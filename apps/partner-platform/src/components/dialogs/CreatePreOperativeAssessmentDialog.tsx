import React, { useState } from 'react';
import { Button, Input } from '@docsearch/ui-kit';
import type { CreatePreOperativeAssessmentRequest, ASAClass, PreOpFitnessStatus, SurgeryRequestDto } from '@docsearch/api-contracts';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  request: SurgeryRequestDto | null;
  onSubmit: (req: CreatePreOperativeAssessmentRequest) => Promise<void>;
  tenantId: string;
  partnerId: string;
  organizationId: string;
  branchId: string;
}

export const CreatePreOperativeAssessmentDialog: React.FC<Props> = ({
  isOpen,
  onClose,
  request,
  onSubmit,
  tenantId,
  partnerId,
  organizationId,
  branchId
}) => {
  const [assessedByAnaesthetist, setAssessedByAnaesthetist] = useState('Dr. Christopher Nolan, MD');
  const [asaClassification, setAsaClassification] = useState<ASAClass>('ASA_II_MILD_SYSTEMIC_DISEASE');
  const [airwayScore, setAirwayScore] = useState('2');
  const [npoHours, setNpoHours] = useState('8');
  const [allergiesNoted, setAllergiesNoted] = useState('NKDA (No known drug allergies)');
  const [fitnessStatus, setFitnessStatus] = useState<PreOpFitnessStatus>('CLEARED');
  const [anaesthesiaPlanNotes, setAnaesthesiaPlanNotes] = useState('Standard induction with ET tube; arterial line monitoring');
  const [loading, setLoading] = useState(false);

  if (!isOpen || !request) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit({
        tenantId,
        partnerId,
        organizationId,
        branchId,
        surgeryRequestId: request.id,
        patientId: request.patientId,
        patientName: request.patientName,
        assessedByAnaesthetist,
        asaClassification,
        airwayMallampatiScore: parseInt(airwayScore) || 2,
        npoStatusHours: parseInt(npoHours) || 8,
        cardiacClearanceGiven: true,
        respiratoryClearanceGiven: true,
        allergiesNoted,
        bloodArrangementUnits: 2,
        fitnessStatus,
        anaesthesiaPlanNotes,
        riskFactorsSummary: `ASA ${asaClassification}, Mallampati Class ${airwayScore}`
      });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-xl bg-white p-6 shadow-2xl">
        <h2 className="text-xl font-bold text-gray-900 mb-2">Pre-Anaesthesia Checkup (PAC)</h2>
        <p className="text-xs text-gray-500 mb-4">{request.patientName} — {request.procedureName}</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Assessing Anaesthetist</label>
            <Input value={assessedByAnaesthetist} onChange={(e) => setAssessedByAnaesthetist(e.target.value)} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">ASA Classification</label>
              <select
                value={asaClassification}
                onChange={(e) => setAsaClassification(e.target.value as ASAClass)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              >
                <option value="ASA_I_NORMAL_HEALTHY">ASA I - Normal Healthy</option>
                <option value="ASA_II_MILD_SYSTEMIC_DISEASE">ASA II - Mild Systemic Disease</option>
                <option value="ASA_III_SEVERE_SYSTEMIC_DISEASE">ASA III - Severe Systemic Disease</option>
                <option value="ASA_IV_LIFE_THREATENING_DISEASE">ASA IV - Life Threatening</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Mallampati Score (1-4)</label>
              <Input type="number" min="1" max="4" value={airwayScore} onChange={(e) => setAirwayScore(e.target.value)} required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">NPO Duration (Hours)</label>
              <Input type="number" value={npoHours} onChange={(e) => setNpoHours(e.target.value)} required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Fitness Clearance</label>
              <select
                value={fitnessStatus}
                onChange={(e) => setFitnessStatus(e.target.value as PreOpFitnessStatus)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              >
                <option value="CLEARED">Cleared for Surgery</option>
                <option value="CONDITIONALLY_CLEARED">Conditionally Cleared</option>
                <option value="NOT_CLEARED">High Risk / Not Cleared</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Allergies / Previous Anaesthesia Adverse Events</label>
            <Input value={allergiesNoted} onChange={(e) => setAllergiesNoted(e.target.value)} required />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Anaesthesia Plan & Airway Strategy</label>
            <Input value={anaesthesiaPlanNotes} onChange={(e) => setAnaesthesiaPlanNotes(e.target.value)} required />
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" type="button" onClick={onClose} disabled={loading}>Cancel</Button>
            <Button variant="primary" type="submit" disabled={loading}>{loading ? 'Saving...' : 'Certify PAC Clearance'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
};
