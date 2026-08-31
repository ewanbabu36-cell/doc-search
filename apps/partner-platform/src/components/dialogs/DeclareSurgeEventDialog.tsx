import React, { useState } from 'react';
import { Button, Input, Select } from '@docsearch/ui-kit';
import type { DeclareSurgeEventRequest, HospitalSurgeLevel, EmergencyCodeType } from '@docsearch/api-contracts';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: DeclareSurgeEventRequest) => Promise<void>;
}

export const DeclareSurgeEventDialog: React.FC<Props> = ({ isOpen, onClose, onSubmit }) => {
  const [surgeLevel, setSurgeLevel] = useState<HospitalSurgeLevel>('CRITICAL_SURGE_RED');
  const [codeType, setCodeType] = useState<EmergencyCodeType>('CODE_BLACK_MASS_CASUALTY');
  const [location, setLocation] = useState('Hospital Wide / Trauma Emergency');
  const [justification, setJustification] = useState('Multi-vehicle highway accident incoming with 25+ trauma casualties; ICU and ER surge protocol active.');
  const [declaredBy, setDeclaredBy] = useState('Dr. Alok Verma (Chief Medical Officer)');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit({
        surgeLevel,
        codeType,
        location,
        justification,
        declaredBy
      });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 space-y-4">
        <h2 className="text-lg font-bold text-red-700">🚨 Executive Command: Declare Emergency Surge / Red Alert</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Hospital Surge Level</label>
              <Select
                value={surgeLevel}
                onChange={(e) => setSurgeLevel(e.target.value as HospitalSurgeLevel)}
                options={[
                  { value: 'NORMAL_GREEN', label: '🟢 Normal (Green)' },
                  { value: 'BUSY_YELLOW', label: '🟡 Busy (Yellow)' },
                  { value: 'OVERCROWDED_AMBER', label: '🟠 Overcrowded (Amber)' },
                  { value: 'CRITICAL_SURGE_RED', label: '🔴 Critical Surge (Red)' },
                  { value: 'DISASTER_BLACK', label: '⚫ Disaster Mode (Black)' }
                ]}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Emergency Code</label>
              <Select
                value={codeType}
                onChange={(e) => setCodeType(e.target.value as EmergencyCodeType)}
                options={[
                  { value: 'CODE_BLACK_MASS_CASUALTY', label: 'Code Black: Mass Casualty' },
                  { value: 'CODE_BLUE_CARDIAC_ARREST', label: 'Code Blue: Cardiac Arrest' },
                  { value: 'CODE_RED_FIRE_HAZARD', label: 'Code Red: Fire / Evac' },
                  { value: 'CODE_YELLOW_INFRASTRUCTURE_FAILURE', label: 'Code Yellow: Infrastructure' },
                  { value: 'CODE_ORANGE_HAZMAT_DECONTAMINATION', label: 'Code Orange: Hazmat' }
                ]}
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Location / Scope of Activation</label>
            <Input value={location} onChange={(e) => setLocation(e.target.value)} required />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Clinical / Operational Justification</label>
            <Input value={justification} onChange={(e) => setJustification(e.target.value)} required />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Authorizing Executive / Officer</label>
            <Input value={declaredBy} onChange={(e) => setDeclaredBy(e.target.value)} required />
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" type="button" onClick={onClose} disabled={loading}>Cancel</Button>
            <Button variant="danger" type="submit" disabled={loading}>{loading ? 'Transmitting...' : 'Broadcast Surge Alert'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
};
