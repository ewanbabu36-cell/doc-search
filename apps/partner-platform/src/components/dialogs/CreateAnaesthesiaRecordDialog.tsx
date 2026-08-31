import React, { useState } from 'react';
import { Button, Input } from '@docsearch/ui-kit';
import type { OTScheduleDto, CreateAnaesthesiaRecordRequest, AnaesthesiaType } from '@docsearch/api-contracts';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  schedule: OTScheduleDto | null;
  onSubmit: (req: CreateAnaesthesiaRecordRequest) => Promise<void>;
  tenantId: string;
  partnerId: string;
  organizationId: string;
  branchId: string;
}

export const CreateAnaesthesiaRecordDialog: React.FC<Props> = ({
  isOpen,
  onClose,
  schedule,
  onSubmit,
  tenantId,
  partnerId,
  organizationId,
  branchId
}) => {
  const [leadAnaesthetist, setLeadAnaesthetist] = useState(schedule?.leadAnaesthetistName || 'Dr. Christopher Nolan');
  const [anaesthesiaType, setAnaesthesiaType] = useState<AnaesthesiaType>('GENERAL_ANAESTHESIA');
  const [airwayDevice, setAirwayDevice] = useState('ENDOTRACHEAL_TUBE');
  const [agents, setAgents] = useState('Propofol, Fentanyl, Rocuronium, Sevoflurane');
  const [ivFluids, setIvFluids] = useState('1000');
  const [estimatedLoss, setEstimatedLoss] = useState('50');
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
        leadAnaesthetist,
        anaesthesiaType,
        airwayDeviceUsed: airwayDevice,
        administeredAgentsSummary: agents,
        ivFluidsAdministeredMl: parseInt(ivFluids) || 1000,
        bloodTransfusedUnits: 0,
        estimatedIntraopBloodLossMl: parseInt(estimatedLoss) || 50,
        intraopVitalsStability: 'HEMODYNAMICALLY_STABLE',
        postAnaesthesiaAldreteScore: 9
      });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl">
        <h2 className="text-xl font-bold text-gray-900 mb-2">Record Anaesthesia Induction & Notes</h2>
        <p className="text-xs text-gray-500 mb-4">{schedule.patientName} — {schedule.procedureName}</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Lead Anaesthetist</label>
              <Input value={leadAnaesthetist} onChange={(e) => setLeadAnaesthetist(e.target.value)} required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Anaesthesia Type</label>
              <select
                value={anaesthesiaType}
                onChange={(e) => setAnaesthesiaType(e.target.value as AnaesthesiaType)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              >
                <option value="GENERAL_ANAESTHESIA">General Anaesthesia</option>
                <option value="SPINAL_ANAESTHESIA">Spinal Anaesthesia</option>
                <option value="EPIDURAL_ANAESTHESIA">Epidural Anaesthesia</option>
                <option value="LOCAL_ANAESTHESIA">Local Anaesthesia</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Airway Device</label>
            <Input value={airwayDevice} onChange={(e) => setAirwayDevice(e.target.value)} required />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Administered Agents & Gases</label>
            <Input value={agents} onChange={(e) => setAgents(e.target.value)} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">IV Fluids (ml)</label>
              <Input type="number" value={ivFluids} onChange={(e) => setIvFluids(e.target.value)} required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Estimated Blood Loss (ml)</label>
              <Input type="number" value={estimatedLoss} onChange={(e) => setEstimatedLoss(e.target.value)} required />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" type="button" onClick={onClose} disabled={loading}>Cancel</Button>
            <Button variant="primary" type="submit" disabled={loading}>{loading ? 'Recording...' : 'Save Anaesthesia Record'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
};
