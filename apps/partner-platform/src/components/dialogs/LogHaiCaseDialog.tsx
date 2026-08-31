import React, { useState } from 'react';
import { Button, Input, Select } from '@docsearch/ui-kit';
import type { LogHaiCaseRequest, HaiType } from '@docsearch/api-contracts';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: LogHaiCaseRequest) => Promise<void>;
}

export const LogHaiCaseDialog: React.FC<Props> = ({ isOpen, onClose, onSubmit }) => {
  const [patientId] = useState(crypto.randomUUID());
  const [patientMrn, setPatientMrn] = useState('');
  const [patientName, setPatientName] = useState('');
  const [departmentName, setDepartmentName] = useState('Intensive Care Unit (ICU-A)');
  const [haiType, setHaiType] = useState<HaiType>('CLABSI');
  const [diagnosisDate, setDiagnosisDate] = useState(new Date().toISOString().split('T')[0] || '2026-08-30');
  const [pathogenIsolated, setPathogenIsolated] = useState('Klebsiella pneumoniae (ESBL producing)');
  const [antibioticSensitivity, setAntibioticSensitivity] = useState('Sensitive: Meropenem, Colistin; Resistant: Ceftriaxone');
  const [invasiveDeviceName, setInvasiveDeviceName] = useState('Triple Lumen Central Venous Catheter (CVC)');
  const [deviceInsertionDate, setDeviceInsertionDate] = useState(new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0] || '2026-08-23');
  const [deviceDaysAtInfection, setDeviceDaysAtInfection] = useState(7);
  const [hicInterventionTaken, setHicInterventionTaken] = useState('Line removed; contact isolation initiated; Meropenem IV started.');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit({
        patientId,
        patientMrn,
        patientName,
        departmentName,
        haiType,
        diagnosisDate,
        pathogenIsolated,
        antibioticSensitivity,
        invasiveDeviceName,
        deviceInsertionDate,
        deviceDaysAtInfection,
        hicInterventionTaken
      });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
        <h2 className="text-lg font-bold text-gray-900">Log Healthcare-Associated Infection (HAI Surveillance)</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">HAI Infection Type</label>
              <Select
                value={haiType}
                onChange={(e) => setHaiType(e.target.value as HaiType)}
                options={[
                  { value: 'CLABSI', label: 'CLABSI (Central Line Bloodstream)' },
                  { value: 'CAUTI', label: 'CAUTI (Catheter Urinary Tract)' },
                  { value: 'VAP', label: 'VAP (Ventilator-Associated Pneumonia)' },
                  { value: 'SSI', label: 'SSI (Surgical Site Infection)' },
                  { value: 'MDRO_COLONIZATION_INFECTION', label: 'MDRO (MRSA/VRE/CRE/ESBL)' }
                ]}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Diagnosis Date</label>
              <Input type="date" value={diagnosisDate} onChange={(e) => setDiagnosisDate(e.target.value)} required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Patient MRN</label>
              <Input value={patientMrn} onChange={(e) => setPatientMrn(e.target.value)} placeholder="e.g. MRN-2026-3391" required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Patient Name</label>
              <Input value={patientName} onChange={(e) => setPatientName(e.target.value)} placeholder="e.g. Harish Chandra" required />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Clinical Department</label>
            <Input value={departmentName} onChange={(e) => setDepartmentName(e.target.value)} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Pathogen Isolated</label>
              <Input value={pathogenIsolated} onChange={(e) => setPathogenIsolated(e.target.value)} required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Antibiotic Sensitivity / Antibiogram</label>
              <Input value={antibioticSensitivity} onChange={(e) => setAntibioticSensitivity(e.target.value)} required />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Invasive Device</label>
              <Input value={invasiveDeviceName} onChange={(e) => setInvasiveDeviceName(e.target.value)} required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Insertion Date</label>
              <Input type="date" value={deviceInsertionDate} onChange={(e) => setDeviceInsertionDate(e.target.value)} required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Device Days</label>
              <Input type="number" value={String(deviceDaysAtInfection)} onChange={(e) => setDeviceDaysAtInfection(Number(e.target.value))} required />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Infection Control Intervention Taken</label>
            <Input value={hicInterventionTaken} onChange={(e) => setHicInterventionTaken(e.target.value)} required />
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" type="button" onClick={onClose} disabled={loading}>Cancel</Button>
            <Button variant="danger" type="submit" disabled={loading}>{loading ? 'Logging...' : 'Register HAI Surveillance Case'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
};
