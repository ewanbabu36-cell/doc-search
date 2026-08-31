import React from 'react';
import { Card, Badge, Button } from '@docsearch/ui-kit';
import type { DdiInteractionAssessmentDto } from '@docsearch/api-contracts';

interface Props {
  assessments: DdiInteractionAssessmentDto[];
  onEvaluate: () => void;
  onOverride: (d: DdiInteractionAssessmentDto) => void;
}

export const DrugInteractionGuardView: React.FC<Props> = ({ assessments, onEvaluate, onOverride }) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Smart Rx Drug-Drug & Drug-Allergy Interaction CDSS Guard</h2>
          <p className="text-xs text-gray-500">Real-time pharmacovigilance screening with clinical risk mechanisms and evidence citations</p>
        </div>
        <Button variant="primary" onClick={onEvaluate}>💊 Run DDI Screen</Button>
      </div>

      <div className="space-y-4">
        {assessments.map((d) => (
          <Card key={d.id} className="p-4 space-y-2 text-xs">
            <div className="flex justify-between items-center border-b pb-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-gray-900">{d.drugA}</span>
                <span className="text-red-600 font-bold">⟷</span>
                <span className="text-sm font-bold text-gray-900">{d.drugB}</span>
                <Badge variant={d.severityLevel === 'CONTRAINDICATED_FATAL' ? 'danger' : 'warning'}>{d.severityLevel}</Badge>
              </div>
              <span className="text-gray-500">{d.evidenceReference}</span>
            </div>
            <p className="text-gray-800 font-semibold">⚠️ Clinical Risk: {d.clinicalConsequence}</p>
            <p className="text-gray-600">Mechanism: {d.mechanism}</p>
            <div className="p-2.5 bg-blue-50 text-blue-950 rounded flex justify-between items-center">
              <span><strong>💡 Recommended Action:</strong> {d.recommendedManagement}</span>
              <Button variant="outline" size="sm" onClick={() => onOverride(d)}>Override Warning</Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
