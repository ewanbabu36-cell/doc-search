import React from 'react';
import { Card, Badge } from '@docsearch/ui-kit';
import type { RenalDoseAdjustmentDto } from '@docsearch/api-contracts';

interface Props {
  adjustments: RenalDoseAdjustmentDto[];
}

export const RenalDosageCalculatorView: React.FC<Props> = ({ adjustments }) => {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-bold text-gray-900">Renal & Hepatic Impairment Dosage Adjuster (eGFR CDSS Guard)</h2>
        <p className="text-xs text-gray-500">Automated Cockcroft-Gault / CKD-EPI clearance calculation and pharmacotherapy dose modifications</p>
      </div>

      <div className="space-y-3">
        {adjustments.map((r) => (
          <Card key={r.id} className="p-4 space-y-2 text-xs">
            <div className="flex justify-between items-center border-b pb-2">
              <div className="flex items-center gap-2">
                <span className="font-bold text-gray-900">{r.drugName}</span>
                <Badge variant={r.severity === 'CRITICAL_TOXICITY_RISK' ? 'danger' : 'warning'}>{r.severity}</Badge>
              </div>
              <span className="font-bold text-red-700">eGFR: {r.estimatedGfrMlMin} mL/min (Cr: {r.serumCreatinineMgDl} mg/dL)</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-2 bg-red-50 rounded">
                <span className="text-red-700 block">Prescribed Standard Dose:</span>
                <span className="font-bold text-red-900">{r.prescribedDose}</span>
              </div>
              <div className="p-2 bg-green-50 rounded">
                <span className="text-green-700 block">Renally Adjusted Recommended Dose:</span>
                <span className="font-bold text-green-900">{r.recommendedRenalDose}</span>
              </div>
            </div>
            <p className="text-gray-700 pt-1">💡 Rationale: {r.adjustmentRationale}</p>
          </Card>
        ))}
      </div>
    </div>
  );
};
