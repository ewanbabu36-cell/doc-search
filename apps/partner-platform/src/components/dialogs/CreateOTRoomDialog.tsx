import React, { useState } from 'react';
import { Button, Input } from '@docsearch/ui-kit';
import type { CreateOTRoomRequest, OTType, SurgicalSpecialty, OperationTheatreComplexDto } from '@docsearch/api-contracts';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  complexes: OperationTheatreComplexDto[];
  onSubmit: (req: CreateOTRoomRequest) => Promise<void>;
  tenantId: string;
  partnerId: string;
  organizationId: string;
  branchId: string;
}

export const CreateOTRoomDialog: React.FC<Props> = ({
  isOpen,
  onClose,
  complexes,
  onSubmit,
  tenantId,
  partnerId,
  organizationId,
  branchId
}) => {
  const [complexId, setComplexId] = useState(complexes[0]?.id || '');
  const [roomNumber, setRoomNumber] = useState('');
  const [roomName, setRoomName] = useState('');
  const [otType, setOtType] = useState<OTType>('MAJOR_OT');
  const [primarySpecialty, setPrimarySpecialty] = useState<SurgicalSpecialty>('GENERAL_SURGERY');
  const [hourlyRate, setHourlyRate] = useState('3500');
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
        complexId: complexId || complexes[0]?.id || '',
        roomNumber,
        roomName,
        otType,
        primarySpecialty,
        supportedSpecialties: [primarySpecialty],
        hasPendantSystem: true,
        hasCardiacMonitor: true,
        hasAnaesthesiaWorkstation: true,
        hasLaminarFlow: true,
        hasHepaFilter: true,
        hourlyRate: parseFloat(hourlyRate) || 3500
      });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Commission OT Suite</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">OT Complex</label>
            <select
              value={complexId}
              onChange={(e) => setComplexId(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              required
            >
              {complexes.map((c) => (
                <option key={c.id} value={c.id}>{c.complexName} ({c.complexCode})</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Room Code / Number</label>
              <Input value={roomNumber} onChange={(e) => setRoomNumber(e.target.value)} placeholder="e.g. OT-06" required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Room Name</label>
              <Input value={roomName} onChange={(e) => setRoomName(e.target.value)} placeholder="e.g. Ophthalmic Suite" required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">OT Type</label>
              <select
                value={otType}
                onChange={(e) => setOtType(e.target.value as OTType)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              >
                <option value="MAJOR_OT">Major OT</option>
                <option value="MINOR_OT">Minor OT</option>
                <option value="EMERGENCY_OT">Emergency OT</option>
                <option value="CARDIAC_OT">Cardiac OT</option>
                <option value="ORTHOPAEDIC_OT">Orthopaedic OT</option>
                <option value="NEUROSURGERY_OT">Neurosurgery OT</option>
                <option value="DAYCARE_OT">Daycare OT</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Primary Specialty</label>
              <select
                value={primarySpecialty}
                onChange={(e) => setPrimarySpecialty(e.target.value as SurgicalSpecialty)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              >
                <option value="GENERAL_SURGERY">General Surgery</option>
                <option value="ORTHOPAEDICS">Orthopaedics</option>
                <option value="CARDIOTHORACIC">Cardiothoracic</option>
                <option value="NEUROSURGERY">Neurosurgery</option>
                <option value="OBSTETRICS_GYNECOLOGY">Obstetrics & Gynaecology</option>
                <option value="OPHTHALMOLOGY">Ophthalmology</option>
                <option value="ENT_HEAD_NECK">ENT / Head & Neck</option>
                <option value="UROLOGY">Urology</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Base Hourly Rate (₹)</label>
            <Input type="number" value={hourlyRate} onChange={(e) => setHourlyRate(e.target.value)} required />
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" type="button" onClick={onClose} disabled={loading}>Cancel</Button>
            <Button variant="primary" type="submit" disabled={loading}>{loading ? 'Commissioning...' : 'Commission Suite'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
};
