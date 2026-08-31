import React, { useState } from 'react';
import { Button, Input } from '@docsearch/ui-kit';
import type { OTScheduleDto, CreateSurgicalSpecimenRequest } from '@docsearch/api-contracts';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  schedule: OTScheduleDto | null;
  onSubmit: (req: CreateSurgicalSpecimenRequest) => Promise<void>;
  tenantId: string;
  partnerId: string;
  organizationId: string;
  branchId: string;
}

export const CreateSpecimenDialog: React.FC<Props> = ({
  isOpen,
  onClose,
  schedule,
  onSubmit,
  tenantId,
  partnerId,
  organizationId,
  branchId
}) => {
  const [anatomicSite, setAnatomicSite] = useState('Gallbladder / Tissue margin');
  const [description, setDescription] = useState('Excised specimen measuring 6x3 cm with stones');
  const [investigation, setInvestigation] = useState('Histopathology & Malignancy Screening');
  const [lab, setLab] = useState('HISTOPATHOLOGY_LAB');
  const [surgeon, setSurgeon] = useState(schedule?.primarySurgeonName || 'Dr. Gregory House');
  const [nurse, setNurse] = useState('Nurse Priya Singh');
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
        anatomicOriginSite: anatomicSite,
        specimenDescription: description,
        fixativeUsed: '10% BUFFERED FORMALIN',
        orderedInvestigation: investigation,
        destinationLab: lab,
        collectedBySurgeon: surgeon,
        labelVerifiedByNurse: nurse
      });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl">
        <h2 className="text-xl font-bold text-gray-900 mb-2">Log Surgical Specimen</h2>
        <p className="text-xs text-gray-500 mb-4">{schedule.patientName} — {schedule.procedureName}</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Anatomic Origin Site</label>
            <Input value={anatomicSite} onChange={(e) => setAnatomicSite(e.target.value)} required />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Specimen Description</label>
            <Input value={description} onChange={(e) => setDescription(e.target.value)} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Investigation Order</label>
              <Input value={investigation} onChange={(e) => setInvestigation(e.target.value)} required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Destination Laboratory</label>
              <Input value={lab} onChange={(e) => setLab(e.target.value)} required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Collected By (Surgeon)</label>
              <Input value={surgeon} onChange={(e) => setSurgeon(e.target.value)} required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Label Verified By (Nurse)</label>
              <Input value={nurse} onChange={(e) => setNurse(e.target.value)} required />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" type="button" onClick={onClose} disabled={loading}>Cancel</Button>
            <Button variant="primary" type="submit" disabled={loading}>{loading ? 'Logging...' : 'Log & Route Specimen'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
};
