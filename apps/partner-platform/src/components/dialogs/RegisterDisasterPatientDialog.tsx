import React, { useState } from 'react';
import { Button, Input } from '@docsearch/ui-kit';
import type { RegisterDisasterPatientRequest } from '@docsearch/api-contracts';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (req: RegisterDisasterPatientRequest) => Promise<void>;
  tenantId: string;
  partnerId: string;
  organizationId: string;
  branchId: string;
}

export const RegisterDisasterPatientDialog: React.FC<Props> = ({
  isOpen,
  onClose,
  onSubmit,
  tenantId,
  partnerId,
  organizationId,
  branchId
}) => {
  const [incidentCode, setIncidentCode] = useState('MCI-2026-ACTIVE');
  const [tag, setTag] = useState(`TAG-${Date.now().toString().slice(-4)}`);
  const [color, setColor] = useState<'RED_IMMEDIATE' | 'YELLOW_DELAYED' | 'GREEN_MINOR' | 'BLACK_DECEASED'>('RED_IMMEDIATE');
  const [gender, setGender] = useState('UNKNOWN');
  const [age, setAge] = useState('35');
  const [zone, setZone] = useState('Resuscitation Suite / Bay 1');
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
        disasterIncidentCode: incidentCode,
        temporaryIdentifier: tag,
        gender,
        estimatedAge: parseInt(age) || 30,
        triageTagColor: color,
        primaryZoneAssigned: zone
      });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl">
        <h2 className="text-xl font-bold text-gray-900 mb-2">Fast-Tag Disaster Victim Registration</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">MCI Incident Code</label>
              <Input value={incidentCode} onChange={(e) => setIncidentCode(e.target.value)} required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Wristband / Triage Tag ID</label>
              <Input value={tag} onChange={(e) => setTag(e.target.value)} required />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Disaster Triage Tag Color</label>
            <select value={color} onChange={(e) => setColor(e.target.value as 'RED_IMMEDIATE' | 'YELLOW_DELAYED' | 'GREEN_MINOR' | 'BLACK_DECEASED')} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm font-bold">
              <option value="RED_IMMEDIATE">🔴 RED — Immediate Life-Saving (Resuscitation Bay)</option>
              <option value="YELLOW_DELAYED">🟡 YELLOW — Delayed / Acute (Observation/Treatment)</option>
              <option value="GREEN_MINOR">🟢 GREEN — Minor Walking Wounded (Fast Track)</option>
              <option value="BLACK_DECEASED">⚫ BLACK — Deceased / Expectant</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Estimated Age</label>
              <Input type="number" value={age} onChange={(e) => setAge(e.target.value)} required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Gender</label>
              <select value={gender} onChange={(e) => setGender(e.target.value)} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm">
                <option value="M">Male</option>
                <option value="F">Female</option>
                <option value="UNKNOWN">Unknown</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Assigned Surge Area</label>
            <Input value={zone} onChange={(e) => setZone(e.target.value)} required />
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" type="button" onClick={onClose} disabled={loading}>Cancel</Button>
            <Button variant="primary" type="submit" disabled={loading}>{loading ? 'Registering...' : 'Tag & Ingest Victim'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
};
