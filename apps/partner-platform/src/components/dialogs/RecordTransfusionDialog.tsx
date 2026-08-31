import React, { useState } from 'react';
import { Button, Input } from '@docsearch/ui-kit';
import type { RecordTransfusionRequest, BloodComponentType, TransfusionBloodGroup } from '@docsearch/api-contracts';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (req: RecordTransfusionRequest) => Promise<void>;
  tenantId: string;
  partnerId: string;
  organizationId: string;
  branchId: string;
}

export const RecordTransfusionDialog: React.FC<Props> = ({
  isOpen,
  onClose,
  onSubmit,
  tenantId,
  partnerId,
  organizationId,
  branchId
}) => {
  const [patient, setPatient] = useState('David K. Miller');
  const [mrn, setMrn] = useState('MRN-772101');
  const [compCode, setCompCode] = useState('PRBC-2026-08-001');
  const [compType, setCompType] = useState<BloodComponentType>('PACKED_RED_BLOOD_CELLS_PRBC');
  const [bloodGroup, setBloodGroup] = useState<TransfusionBloodGroup>('O_NEGATIVE');
  const [nurse, setNurse] = useState('Nurse Mark Hopkins, RN');
  const [doc, setDoc] = useState('Dr. Evelyn Reed, MD');
  const [pulse, setPulse] = useState('118');
  const [bp, setBp] = useState('90/60');
  const [temp, setTemp] = useState('98.2');
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
        patientName: patient,
        patientMrn: mrn,
        encounterId: 'ee-001',
        componentCode: compCode,
        componentType: compType,
        bloodGroup,
        administeredByNurse: nurse,
        supervisingDoctorName: doc,
        startTime: new Date().toISOString(),
        preTransfusionPulse: parseInt(pulse) || 80,
        preTransfusionBp: bp,
        preTransfusionTempF: parseFloat(temp) || 98.6
      });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl">
        <h2 className="text-xl font-bold text-gray-900 mb-2">Initiate Bedside Blood Transfusion</h2>
        <p className="text-xs text-gray-500 mb-4">Dual-nurse identity verification & pre-transfusion vitals baseline</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Patient Name</label>
              <Input value={patient} onChange={(e) => setPatient(e.target.value)} required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Patient MRN</label>
              <Input value={mrn} onChange={(e) => setMrn(e.target.value)} required />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Unit Barcode</label>
              <Input value={compCode} onChange={(e) => setCompCode(e.target.value)} required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Component</label>
              <select value={compType} onChange={(e) => setCompType(e.target.value as BloodComponentType)} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm font-semibold">
                <option value="PACKED_RED_BLOOD_CELLS_PRBC">PRBC</option>
                <option value="RANDOM_DONOR_PLATELETS_RDP">Platelets</option>
                <option value="FRESH_FROZEN_PLASMA_FFP">FFP</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Blood Group</label>
              <select value={bloodGroup} onChange={(e) => setBloodGroup(e.target.value as TransfusionBloodGroup)} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm font-semibold">
                <option value="O_NEGATIVE">O Negative</option>
                <option value="O_POSITIVE">O Positive</option>
                <option value="A_POSITIVE">A Positive</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Pre-Pulse (bpm)</label>
              <Input type="number" value={pulse} onChange={(e) => setPulse(e.target.value)} required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Pre-BP (mmHg)</label>
              <Input value={bp} onChange={(e) => setBp(e.target.value)} required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Pre-Temp (°F)</label>
              <Input type="number" step="0.1" value={temp} onChange={(e) => setTemp(e.target.value)} required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Administering Nurse</label>
              <Input value={nurse} onChange={(e) => setNurse(e.target.value)} required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Supervising Doctor</label>
              <Input value={doc} onChange={(e) => setDoc(e.target.value)} required />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" type="button" onClick={onClose} disabled={loading}>Cancel</Button>
            <Button variant="primary" type="submit" disabled={loading}>{loading ? 'Starting...' : 'Start Transfusion'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
};
