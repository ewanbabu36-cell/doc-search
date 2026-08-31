import React from 'react';
import { Card, Badge } from '@docsearch/ui-kit';
import type { RcmLeakageRiskItemDto } from '@docsearch/api-contracts';

interface Props {
  risks: RcmLeakageRiskItemDto[];
}

export const RcmLeakageDenialRiskView: React.FC<Props> = ({ risks }) => {
  const totalRiskInr = risks.reduce((acc, r) => acc + r.estimatedRiskAmountInr, 0);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Revenue Cycle Management (RCM) Leakage & Pre-Claim Denial AI</h2>
          <p className="text-xs text-gray-500">Automated detection of unbilled consumables, missing pre-auth extensions, and diagnostic gaps</p>
        </div>
        <Badge variant="danger">₹{totalRiskInr.toLocaleString('en-IN')} Total At-Risk</Badge>
      </div>

      <div className="space-y-3">
        {risks.map((r) => (
          <Card key={r.id} className="p-4 space-y-2 text-xs">
            <div className="flex justify-between items-center border-b pb-2">
              <div className="flex items-center gap-2">
                <span className="font-bold text-gray-900">{r.patientName} (MRN: {r.patientMrn})</span>
                <Badge variant="warning">{r.potentialLeakageType}</Badge>
                <span className="text-gray-500">{r.departmentName}</span>
              </div>
              <span className="font-bold text-red-700 text-sm">₹{r.estimatedRiskAmountInr.toLocaleString('en-IN')}</span>
            </div>
            <p className="text-gray-800 font-semibold">💡 Recommended Clinical Action: {r.suggestedCorrection}</p>
            <div className="text-gray-500 flex justify-between pt-1">
              <span>Risk Probability: {r.riskProbabilityPct}%</span>
              <span>Detected: {r.detectedAt.replace('T', ' ').substring(0, 16)}</span>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
