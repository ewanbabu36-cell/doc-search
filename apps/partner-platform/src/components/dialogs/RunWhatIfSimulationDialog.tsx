import React, { useState } from 'react';
import { Button, Input, Select } from '@docsearch/ui-kit';
import type { WhatIfScenarioRequest } from '@docsearch/api-contracts';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: WhatIfScenarioRequest) => Promise<void>;
}

export const RunWhatIfSimulationDialog: React.FC<Props> = ({ isOpen, onClose, onSubmit }) => {
  const [scenarioName, setScenarioName] = useState('MCI Bus Accident Simulation (50 Patients)');
  const [surgeType, setSurgeType] = useState<'MASS_CASUALTY_SURGE_50_PTS' | 'EPIDEMIC_RESPIRATORY_SURGE_30_PCT' | 'OT_COMPLEX_MAINTENANCE_DOWNTIME' | 'ICU_BED_CONVERSION_ISOLATION_15_BEDS'>('MASS_CASUALTY_SURGE_50_PTS');
  const [durationHours, setDurationHours] = useState(48);
  const [divertElectiveSurgeries, setDivertElectiveSurgeries] = useState(true);
  const [fastTrackDischargeBonus, setFastTrackDischargeBonus] = useState(true);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit({
        scenarioName,
        surgeType,
        durationHours,
        divertElectiveSurgeries,
        fastTrackDischargeBonus
      });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 space-y-4">
        <h2 className="text-lg font-bold text-blue-900">🤖 AI Predictive Capacity What-If Simulation Sandbox</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Scenario Title</label>
            <Input value={scenarioName} onChange={(e) => setScenarioName(e.target.value)} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Simulated Crisis Profile</label>
              <Select
                value={surgeType}
                onChange={(e) => setSurgeType(e.target.value as 'MASS_CASUALTY_SURGE_50_PTS' | 'EPIDEMIC_RESPIRATORY_SURGE_30_PCT' | 'OT_COMPLEX_MAINTENANCE_DOWNTIME' | 'ICU_BED_CONVERSION_ISOLATION_15_BEDS')}
                options={[
                  { value: 'MASS_CASUALTY_SURGE_50_PTS', label: 'Mass Casualty (50 Trauma Patients)' },
                  { value: 'EPIDEMIC_RESPIRATORY_SURGE_30_PCT', label: 'Epidemic Viral Surge (+30% Admissions)' },
                  { value: 'OT_COMPLEX_MAINTENANCE_DOWNTIME', label: 'OT Complex Maintenance Shutdown (3 Suites)' },
                  { value: 'ICU_BED_CONVERSION_ISOLATION_15_BEDS', label: 'Convert 15 ICU Beds to Bio-Isolation' }
                ]}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Duration Window (Hours)</label>
              <Input type="number" value={String(durationHours)} onChange={(e) => setDurationHours(Number(e.target.value))} required />
            </div>
          </div>
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg space-y-2 text-xs">
            <label className="flex items-center gap-2 font-semibold text-blue-950 cursor-pointer">
              <input type="checkbox" checked={divertElectiveSurgeries} onChange={(e) => setDivertElectiveSurgeries(e.target.checked)} className="rounded" />
              Auto-divert non-critical elective surgical admissions
            </label>
            <label className="flex items-center gap-2 font-semibold text-blue-950 cursor-pointer">
              <input type="checkbox" checked={fastTrackDischargeBonus} onChange={(e) => setFastTrackDischargeBonus(e.target.checked)} className="rounded" />
              Incentivize fast-track morning discharge rounds (+20% velocity)
            </label>
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" type="button" onClick={onClose} disabled={loading}>Cancel</Button>
            <Button variant="primary" type="submit" disabled={loading}>{loading ? 'Computing AI Neural Model...' : 'Run Simulation Model'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
};
