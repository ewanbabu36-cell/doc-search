import React, { useState } from 'react';
import { Button, Input } from '@docsearch/ui-kit';
import type { RegisterBirthRecordRequest } from '@docsearch/api-contracts';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (req: RegisterBirthRecordRequest) => Promise<void>;
  tenantId: string;
  partnerId: string;
  organizationId: string;
  branchId: string;
}

export const RegisterBirthRecordDialog: React.FC<Props> = ({
  isOpen,
  onClose,
  onSubmit,
  tenantId,
  partnerId,
  organizationId,
  branchId
}) => {
  const [motherName, setMotherName] = useState('Sarah Jenkins');
  const [motherMrn, setMotherMrn] = useState('MRN-881902');
  const [babyName, setBabyName] = useState('Baby of Sarah Jenkins');
  const [timestamp, setTimestamp] = useState(new Date().toISOString());
  const [deliveryType, setDeliveryType] = useState('Lower Segment Caesarean Section (LSCS)');
  const [gender, setGender] = useState('MALE');
  const [weight, setWeight] = useState('3.20');
  const [obgyn, setObgyn] = useState('Dr. Meera Nambiar, MD (OB-GYN)');
  const [paed, setPaed] = useState('Dr. Anita Desai, MD (Paediatrics)');
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
        motherEncounterId: 'enc-moth-' + Math.random().toString(36).substring(2, 7),
        motherPatientName: motherName,
        motherMrn,
        babyNameOrIdentifier: babyName,
        birthTimestamp: timestamp,
        deliveryType,
        gender,
        birthWeightKg: parseFloat(weight) || 3.0,
        attendingObstetrician: obgyn,
        attendingPaediatrician: paed
      });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-xl bg-white p-6 shadow-2xl border-4 border-pink-400">
        <h2 className="text-xl font-bold text-pink-700 mb-2">👶 Statutory Birth Registry & Certification</h2>
        <p className="text-xs text-gray-500 mb-4">Official institutional birth record with municipal birth portal link</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Mother Full Name</label>
              <Input value={motherName} onChange={(e) => setMotherName(e.target.value)} required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Mother MRN</label>
              <Input value={motherMrn} onChange={(e) => setMotherMrn(e.target.value)} required />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Baby Identifier</label>
              <Input value={babyName} onChange={(e) => setBabyName(e.target.value)} required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Gender</label>
              <select value={gender} onChange={(e) => setGender(e.target.value)} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm">
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="AMBIGUOUS">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Birth Weight (kg)</label>
              <Input type="number" step="0.01" value={weight} onChange={(e) => setWeight(e.target.value)} required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Delivery Method</label>
              <Input value={deliveryType} onChange={(e) => setDeliveryType(e.target.value)} required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Date & Time of Birth</label>
              <Input type="datetime-local" value={timestamp.slice(0, 16)} onChange={(e) => setTimestamp(new Date(e.target.value).toISOString())} required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Attending Obstetrician</label>
              <Input value={obgyn} onChange={(e) => setObgyn(e.target.value)} required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Attending Paediatrician</label>
              <Input value={paed} onChange={(e) => setPaed(e.target.value)} required />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" type="button" onClick={onClose} disabled={loading}>Cancel</Button>
            <Button variant="primary" type="submit" disabled={loading}>{loading ? 'Registering...' : 'Certify & Register Birth'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
};
