import React, { useState } from 'react';
import { Button, Input } from '@docsearch/ui-kit';
import type { OTScheduleDto, CreatePACURecordRequest } from '@docsearch/api-contracts';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  schedule: OTScheduleDto | null;
  onSubmit: (req: CreatePACURecordRequest) => Promise<void>;
  tenantId: string;
  partnerId: string;
  organizationId: string;
  branchId: string;
}

export const CreatePACURecordDialog: React.FC<Props> = ({
  isOpen,
  onClose,
  schedule,
  onSubmit,
  tenantId,
  partnerId,
  organizationId,
  branchId
}) => {
  const [bedNumber, setBedNumber] = useState('PACU-BAY-03');
  const [nurseName, setNurseName] = useState('Nurse David Miller');
  const [aldreteScore, setAldreteScore] = useState('9');
  const [spo2, setSpo2] = useState('99');
  const [systolic, setSystolic] = useState('120');
  const [diastolic, setDiastolic] = useState('80');
  const [pain, setPain] = useState('2');
  const [destination, setDestination] = useState('INPATIENT_POST_OP_WARD');
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
        recoveryBedNumber: bedNumber,
        pacuNurseName: nurseName,
        initialAldreteScore: parseInt(aldreteScore) || 9,
        currentAldreteScore: parseInt(aldreteScore) || 9,
        consciousnessLevel: 'AWAKE_ALERT',
        airwayStatus: 'PATENT_CLEAR',
        oxygenSupportLpm: 2,
        spo2Percentage: parseInt(spo2) || 99,
        systolicBpMmHg: parseInt(systolic) || 120,
        diastolicBpMmHg: parseInt(diastolic) || 80,
        heartRateBpm: 76,
        painScoreNumeric: parseInt(pain) || 2,
        nauseaVomitingStatus: 'NONE',
        authorizedTransferDestination: destination
      });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl">
        <h2 className="text-xl font-bold text-gray-900 mb-2">PACU Recovery Observation</h2>
        <p className="text-xs text-gray-500 mb-4">{schedule.patientName} ({schedule.patientMrn})</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Recovery Bay #</label>
              <Input value={bedNumber} onChange={(e) => setBedNumber(e.target.value)} required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">PACU Nurse</label>
              <Input value={nurseName} onChange={(e) => setNurseName(e.target.value)} required />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Aldrete Score (0-10)</label>
              <Input type="number" min="0" max="10" value={aldreteScore} onChange={(e) => setAldreteScore(e.target.value)} required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">SpO2 (%)</label>
              <Input type="number" value={spo2} onChange={(e) => setSpo2(e.target.value)} required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Pain (0-10)</label>
              <Input type="number" min="0" max="10" value={pain} onChange={(e) => setPain(e.target.value)} required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Systolic BP</label>
              <Input type="number" value={systolic} onChange={(e) => setSystolic(e.target.value)} required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Diastolic BP</label>
              <Input type="number" value={diastolic} onChange={(e) => setDiastolic(e.target.value)} required />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Authorized Stepdown Destination</label>
            <Input value={destination} onChange={(e) => setDestination(e.target.value)} required />
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" type="button" onClick={onClose} disabled={loading}>Cancel</Button>
            <Button variant="primary" type="submit" disabled={loading}>{loading ? 'Recording...' : 'Record PACU Status'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
};
