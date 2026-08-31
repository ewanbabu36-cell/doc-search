import React, { useState } from 'react';
import { Card, Button, Badge, Input } from '@docsearch/ui-kit';
import type { DietaryAssessmentDto } from '@docsearch/api-contracts';

interface Props {
  assessments: DietaryAssessmentDto[];
  onNewAssessment: () => void;
}

export const DietAssessmentView: React.FC<Props> = ({ assessments, onNewAssessment }) => {
  const [search, setSearch] = useState('');

  const filtered = assessments.filter(
    (a) =>
      a.patientName.toLowerCase().includes(search.toLowerCase()) ||
      a.patientMrn.toLowerCase().includes(search.toLowerCase()) ||
      a.assessmentNumber.toLowerCase().includes(search.toLowerCase()) ||
      a.wardName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Patient Nutritional Assessments</h1>
          <p className="text-xs text-gray-500">Anthropometric measurements, BMI, clinical conditions, dysphagia screening, and allergy profiles</p>
        </div>
        <Button variant="primary" size="sm" onClick={onNewAssessment}>+ Conduct Assessment</Button>
      </div>

      <Card className="p-4">
        <Input placeholder="Search assessments by patient name, MRN, ward..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </Card>

      <div className="space-y-3">
        {filtered.map((a) => (
          <Card key={a.id} className="p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-gray-900">{a.patientName} ({a.patientMrn})</h3>
                <p className="text-xs text-blue-600 font-semibold">{a.assessmentNumber} | {a.wardName} - {a.roomBedNumber}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={a.nutritionalRiskScore === 'HIGH_RISK' ? 'danger' : 'primary'}>{a.nutritionalRiskScore}</Badge>
                <Badge variant="primary">{a.feedingRoute}</Badge>
              </div>
            </div>
            <p className="text-xs text-gray-700"><strong>Clinical Condition:</strong> {a.clinicalCondition}</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs bg-gray-50 p-2.5 rounded-lg">
              <p><strong>Weight:</strong> {a.weightKg} kg</p>
              <p><strong>Height:</strong> {a.heightCm} cm</p>
              <p><strong>BMI:</strong> {a.bmi} kg/m²</p>
              <p><strong>Dysphagia:</strong> {a.swallowingDifficulty ? '⚠️ Yes' : 'No'}</p>
            </div>
            {a.foodAllergies.length > 0 && (
              <p className="text-xs text-red-700 font-semibold">🚨 Food Allergies: {a.foodAllergies.join(', ')}</p>
            )}
            <div className="flex items-center justify-between pt-2 border-t text-xs text-gray-500">
              <span>Assessing Dietitian: <strong>{a.dietitianName}</strong></span>
              <span>Attending Doctor: <strong>{a.attendingDoctor}</strong></span>
              <span>Date: <strong>{a.assessmentDate}</strong></span>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
