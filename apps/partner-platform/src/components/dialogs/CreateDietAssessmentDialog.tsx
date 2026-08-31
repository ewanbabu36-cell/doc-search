import React, { useState } from 'react';
import { Button, Input, Select } from '@docsearch/ui-kit';
import type { CreateDietAssessmentRequest } from '@docsearch/api-contracts';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateDietAssessmentRequest) => Promise<void>;
}

export const CreateDietAssessmentDialog: React.FC<Props> = ({ isOpen, onClose, onSubmit }) => {
  const [patientName, setPatientName] = useState('');
  const [patientMrn, setPatientMrn] = useState('');
  const [wardName, setWardName] = useState('Male Medical (3W)');
  const [roomBedNumber, setRoomBedNumber] = useState('Bed 301');
  const [attendingDoctor, setAttendingDoctor] = useState('Dr. Alok Verma, MD');
  const [dietitianName, setDietitianName] = useState('Dietitian Suman Rao');
  const [weightKg, setWeightKg] = useState(70);
  const [heightCm, setHeightCm] = useState(170);
  const [nutritionalRiskScore, setNutritionalRiskScore] = useState('LOW_RISK');
  const [clinicalCondition, setClinicalCondition] = useState('');
  const [allergyInput, setAllergyInput] = useState('');
  const [swallowingDifficulty, setSwallowingDifficulty] = useState(false);
  const [feedingRoute, setFeedingRoute] = useState<'ORAL' | 'NASOGASTRIC_TUBE' | 'PEG_TUBE' | 'JEJUNOSTOMY_TUBE' | 'PARENTERAL'>('ORAL');
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit({
        patientId: crypto.randomUUID(),
        patientName,
        patientMrn,
        wardName,
        roomBedNumber,
        attendingDoctor,
        dietitianName,
        weightKg,
        heightCm,
        nutritionalRiskScore,
        clinicalCondition,
        foodAllergies: allergyInput ? allergyInput.split(',').map((s) => s.trim().toUpperCase()) : [],
        foodIntolerances: [],
        swallowingDifficulty,
        feedingRoute,
        specialInstructions
      });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
        <h2 className="text-lg font-bold text-gray-900">Conduct Patient Nutritional Assessment</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Patient Full Name</label>
              <Input value={patientName} onChange={(e) => setPatientName(e.target.value)} required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Patient MRN</label>
              <Input value={patientMrn} onChange={(e) => setPatientMrn(e.target.value)} placeholder="e.g. MRN-2026-9901" required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Ward / Unit</label>
              <Input value={wardName} onChange={(e) => setWardName(e.target.value)} required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Room & Bed Number</label>
              <Input value={roomBedNumber} onChange={(e) => setRoomBedNumber(e.target.value)} required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Attending Physician</label>
              <Input value={attendingDoctor} onChange={(e) => setAttendingDoctor(e.target.value)} required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Assessing Clinical Dietitian</label>
              <Input value={dietitianName} onChange={(e) => setDietitianName(e.target.value)} required />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Weight (kg)</label>
              <Input type="number" value={String(weightKg)} onChange={(e) => setWeightKg(Number(e.target.value))} required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Height (cm)</label>
              <Input type="number" value={String(heightCm)} onChange={(e) => setHeightCm(Number(e.target.value))} required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Nutritional Risk</label>
              <Select
                value={nutritionalRiskScore}
                onChange={(e) => setNutritionalRiskScore(e.target.value)}
                options={[
                  { value: 'LOW_RISK', label: 'Low Risk' },
                  { value: 'MODERATE_RISK', label: 'Moderate Risk' },
                  { value: 'HIGH_RISK', label: 'High Risk' },
                  { value: 'SEVERE_MALNUTRITION', label: 'Severe Malnutrition' }
                ]}
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Clinical Condition / Diagnosis</label>
            <Input value={clinicalCondition} onChange={(e) => setClinicalCondition(e.target.value)} placeholder="e.g. Acute exacerbation of COPD with steroid-induced hyperglycemia" required />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Food Allergies (comma separated)</label>
            <Input value={allergyInput} onChange={(e) => setAllergyInput(e.target.value)} placeholder="e.g. PEANUTS, SOY, EGGS" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Feeding Route</label>
              <Select
                value={feedingRoute}
                onChange={(e) => setFeedingRoute(e.target.value as 'ORAL' | 'NASOGASTRIC_TUBE' | 'PEG_TUBE' | 'JEJUNOSTOMY_TUBE' | 'PARENTERAL')}
                options={[
                  { value: 'ORAL', label: 'Oral Feeding' },
                  { value: 'NASOGASTRIC_TUBE', label: 'Nasogastric Tube (NG)' },
                  { value: 'PEG_TUBE', label: 'PEG Tube' },
                  { value: 'JEJUNOSTOMY_TUBE', label: 'Jejunostomy Tube' },
                  { value: 'PARENTERAL', label: 'Total Parenteral Nutrition' }
                ]}
              />
            </div>
            <div className="flex items-center gap-2 pt-6">
              <input type="checkbox" id="swallow" checked={swallowingDifficulty} onChange={(e) => setSwallowingDifficulty(e.target.checked)} className="rounded" />
              <label htmlFor="swallow" className="text-xs font-semibold text-gray-700">Dysphagia / Swallowing Difficulty</label>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Special Instructions</label>
            <Input value={specialInstructions} onChange={(e) => setSpecialInstructions(e.target.value)} />
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" type="button" onClick={onClose} disabled={loading}>Cancel</Button>
            <Button variant="primary" type="submit" disabled={loading}>{loading ? 'Finalizing...' : 'Save Assessment'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
};
