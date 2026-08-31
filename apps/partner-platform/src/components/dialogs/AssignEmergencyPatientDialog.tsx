import React, { useState } from 'react';
import { Button, Input } from '@docsearch/ui-kit';
import type { EmergencyEncounterDto, AssignEmergencyPatientRequest, EmergencyZoneDto } from '@docsearch/api-contracts';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  encounter: EmergencyEncounterDto | null;
  zones: EmergencyZoneDto[];
  onSubmit: (req: AssignEmergencyPatientRequest) => Promise<void>;
  tenantId: string;
}

export const AssignEmergencyPatientDialog: React.FC<Props> = ({
  isOpen,
  onClose,
  encounter,
  zones,
  onSubmit,
  tenantId
}) => {
  const [zoneId, setZoneId] = useState(zones[0]?.id || '');
  const [bedNumber, setBedNumber] = useState('ACUTE-BED-01');
  const [physician, setPhysician] = useState('Dr. Evelyn Reed, MD');
  const [nurse, setNurse] = useState('Nurse Mark Hopkins, RN');
  const [loading, setLoading] = useState(false);

  if (!isOpen || !encounter) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit({
        tenantId,
        encounterId: encounter.id,
        zoneId: zoneId || zones[0]?.id || '',
        bedNumber,
        assignedPhysicianName: physician,
        assignedNurseName: nurse,
        assignedBy: 'ED Lead Coordinator'
      });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl">
        <h2 className="text-xl font-bold text-gray-900 mb-2">Assign Bed & Clinical Team</h2>
        <p className="text-xs text-gray-500 mb-4">{encounter.patientName} ({encounter.triageEsiLevel})</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Emergency Treatment Zone</label>
            <select value={zoneId} onChange={(e) => setZoneId(e.target.value)} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" required>
              {zones.map((z) => (
                <option key={z.id} value={z.id}>{z.zoneName} ({z.occupiedCount}/{z.capacity})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Assigned Bed / Bay Number</label>
            <Input value={bedNumber} onChange={(e) => setBedNumber(e.target.value)} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Attending Physician</label>
              <Input value={physician} onChange={(e) => setPhysician(e.target.value)} required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Primary Staff Nurse</label>
              <Input value={nurse} onChange={(e) => setNurse(e.target.value)} required />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" type="button" onClick={onClose} disabled={loading}>Cancel</Button>
            <Button variant="primary" type="submit" disabled={loading}>{loading ? 'Assigning...' : 'Confirm Assignment'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
};
