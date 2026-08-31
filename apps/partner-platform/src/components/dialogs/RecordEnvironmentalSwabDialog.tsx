import React, { useState } from 'react';
import { Button, Input, Select } from '@docsearch/ui-kit';
import type { RecordEnvironmentalSwabRequest, SwabSampleType } from '@docsearch/api-contracts';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: RecordEnvironmentalSwabRequest) => Promise<void>;
}

export const RecordEnvironmentalSwabDialog: React.FC<Props> = ({ isOpen, onClose, onSubmit }) => {
  const [sampleType, setSampleType] = useState<SwabSampleType>('OT_AIR_SETTLE_PLATE');
  const [locationDescription, setLocationDescription] = useState('Modular Operation Theatre 01 — Center Settle Plate');
  const [collectionDate, setCollectionDate] = useState(new Date().toISOString().split('T')[0] || '2026-08-30');
  const [collectedBy] = useState('Lab Tech Deepali Patil');
  const [cfuCountPerPlateOrMl, setCfuCountPerPlateOrMl] = useState(2);
  const [pathogensFound, setPathogensFound] = useState('Coagulase-Negative Staphylococci (Skin commensal)');
  const [permissibleThreshold, setPermissibleThreshold] = useState('< 10 CFU/plate in ultraclean OT');
  const [resultStatus, setResultStatus] = useState<'SATISFACTORY_PASS' | 'ALERT_THRESHOLD_EXCEEDED' | 'UNSATISFACTORY_ACTION_REQUIRED'>('SATISFACTORY_PASS');
  const [correctiveFoggingDone, setCorrectiveFoggingDone] = useState(false);
  const [microbiologistSignOff, setMicrobiologistSignOff] = useState('Dr. Anil Saxena (Senior Microbiologist)');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit({
        sampleType,
        locationDescription,
        collectionDate,
        collectedBy,
        cfuCountPerPlateOrMl,
        pathogensFound,
        permissibleThreshold,
        resultStatus,
        correctiveFoggingDone,
        microbiologistSignOff
      });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
        <h2 className="text-lg font-bold text-gray-900">Record Environmental Microbiology Swab / Culture</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Sample Protocol Type</label>
              <Select
                value={sampleType}
                onChange={(e) => setSampleType(e.target.value as SwabSampleType)}
                options={[
                  { value: 'OT_AIR_SETTLE_PLATE', label: 'OT Air Settle Plate' },
                  { value: 'OT_SURFACE_SWAB', label: 'OT Surface Swab' },
                  { value: 'ENDOSCOPE_CHANNEL_FLUSH', label: 'Endoscope Channel Flush' },
                  { value: 'DIALYSIS_WATER_ENDOTOXIN', label: 'Dialysis RO Water & Endotoxin' },
                  { value: 'AUTOCLAVE_BIOLOGICAL_INDICATOR', label: 'Autoclave Biological Spore Test' },
                  { value: 'CSSD_STERILITY_SWAB', label: 'CSSD Sterility Swab' }
                ]}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Collection Date</label>
              <Input type="date" value={collectionDate} onChange={(e) => setCollectionDate(e.target.value)} required />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Sampling Location Description</label>
            <Input value={locationDescription} onChange={(e) => setLocationDescription(e.target.value)} required />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">CFU Count</label>
              <Input type="number" value={String(cfuCountPerPlateOrMl)} onChange={(e) => setCfuCountPerPlateOrMl(Number(e.target.value))} required />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-gray-700 mb-1">Permissible Threshold</label>
              <Input value={permissibleThreshold} onChange={(e) => setPermissibleThreshold(e.target.value)} required />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Pathogens Isolated</label>
            <Input value={pathogensFound} onChange={(e) => setPathogensFound(e.target.value)} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Result Evaluation</label>
              <Select
                value={resultStatus}
                onChange={(e) => setResultStatus(e.target.value as 'SATISFACTORY_PASS' | 'ALERT_THRESHOLD_EXCEEDED' | 'UNSATISFACTORY_ACTION_REQUIRED')}
                options={[
                  { value: 'SATISFACTORY_PASS', label: '✅ SATISFACTORY (Within Limit)' },
                  { value: 'ALERT_THRESHOLD_EXCEEDED', label: '⚠️ Alert Threshold Exceeded' },
                  { value: 'UNSATISFACTORY_ACTION_REQUIRED', label: '❌ UNSATISFACTORY (Immediate Fogging)' }
                ]}
              />
            </div>
            <div className="flex items-center gap-2 pt-6">
              <input type="checkbox" id="fog-chk" checked={correctiveFoggingDone} onChange={(e) => setCorrectiveFoggingDone(e.target.checked)} className="rounded" />
              <label htmlFor="fog-chk" className="text-xs font-semibold text-gray-700">Corrective Fogging Performed</label>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Microbiologist Sign-Off</label>
            <Input value={microbiologistSignOff} onChange={(e) => setMicrobiologistSignOff(e.target.value)} required />
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" type="button" onClick={onClose} disabled={loading}>Cancel</Button>
            <Button variant="primary" type="submit" disabled={loading}>{loading ? 'Recording...' : 'Certify Microbiology Swab'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
};
