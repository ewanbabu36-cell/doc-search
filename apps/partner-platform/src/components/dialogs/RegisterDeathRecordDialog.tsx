import React, { useState } from 'react';
import { Button, Input } from '@docsearch/ui-kit';
import type { RegisterDeathRecordRequest } from '@docsearch/api-contracts';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (req: RegisterDeathRecordRequest) => Promise<void>;
  tenantId: string;
  partnerId: string;
  organizationId: string;
  branchId: string;
}

export const RegisterDeathRecordDialog: React.FC<Props> = ({
  isOpen,
  onClose,
  onSubmit,
  tenantId,
  partnerId,
  organizationId,
  branchId
}) => {
  const [patientName, setPatientName] = useState('David K. Miller');
  const [patientMrn, setPatientMrn] = useState('MRN-772101');
  const [timestamp, setTimestamp] = useState(new Date().toISOString());
  const [doctor, setDoctor] = useState('Dr. Evelyn Reed, MD');
  const [primaryCause, setPrimaryCause] = useState('Refractory septic shock secondary to severe multi-organ failure');
  const [secondaryCauses, setSecondaryCauses] = useState('Complicated intra-abdominal sepsis');
  const [certNum, setCertNum] = useState(`DTH-MRD-${Date.now().toString().slice(-6)}`);
  const [police, setPolice] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit({
        tenantId,
        partnerId,
        organizationId,
        branchId,
        encounterId: 'enc-dth-' + Math.random().toString(36).substring(2, 7),
        patientName,
        patientMrn,
        declaredDeadTimestamp: timestamp,
        declaringPhysician: doctor,
        primaryCauseOfDeath: primaryCause,
        secondaryCauses: secondaryCauses || undefined,
        deathCertificateNumber: certNum,
        coronerPoliceInformed: police
      });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl border-4 border-slate-700">
        <h2 className="text-xl font-bold text-slate-900 mb-2">⚰ Statutory Death Registry & Certificate</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Deceased Patient Name</label>
              <Input value={patientName} onChange={(e) => setPatientName(e.target.value)} required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Patient MRN</label>
              <Input value={patientMrn} onChange={(e) => setPatientMrn(e.target.value)} required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Death Certificate #</label>
              <Input value={certNum} onChange={(e) => setCertNum(e.target.value)} required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Date & Time Declared</label>
              <Input type="datetime-local" value={timestamp.slice(0, 16)} onChange={(e) => setTimestamp(new Date(e.target.value).toISOString())} required />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Declaring Physician</label>
            <Input value={doctor} onChange={(e) => setDoctor(e.target.value)} required />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Primary Cause of Death (Immediate)</label>
            <Input value={primaryCause} onChange={(e) => setPrimaryCause(e.target.value)} required />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Secondary / Antecedent Causes</label>
            <Input value={secondaryCauses} onChange={(e) => setSecondaryCauses(e.target.value)} />
          </div>
          <div className="flex items-center pt-2">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-gray-700">
              <input type="checkbox" checked={police} onChange={(e) => setPolice(e.target.checked)} />
              Coroner / Police Informed (MLC Death)
            </label>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" type="button" onClick={onClose} disabled={loading}>Cancel</Button>
            <Button variant="danger" type="submit" disabled={loading}>{loading ? 'Registering...' : 'Certify Death & File in Registry'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
};
