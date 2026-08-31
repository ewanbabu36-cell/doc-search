import React from 'react';
import { Card, Badge } from '@docsearch/ui-kit';
import type { PatientAcuityHeatmapItemDto } from '@docsearch/api-contracts';

interface Props {
  heatmap: PatientAcuityHeatmapItemDto[];
}

export const ClinicalAcuityRiskHeatmapView: React.FC<Props> = ({ heatmap }) => {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-bold text-gray-900">Hospital-Wide Clinical Acuity & Deterioration Risk Radar</h2>
        <p className="text-xs text-gray-500">Early Warning Score (MEWS / NEWS2) telemetry and AI ICU transfer probability</p>
      </div>

      <div className="space-y-3">
        {heatmap.map((item) => (
          <Card key={item.bedId} className="p-4 flex items-center justify-between text-xs">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-bold text-gray-900">{item.bedNumber} — {item.wardName}</span>
                <Badge variant={item.acuityLevel === 'CRITICAL_DETERIORATING_RED' ? 'danger' : item.acuityLevel === 'HIGH_RISK_AMBER' ? 'warning' : 'success'}>
                  {item.acuityLevel}
                </Badge>
                <span className="text-gray-500">MEWS Score: {item.deteriorationScore}/10</span>
              </div>
              <p className="text-sm font-semibold text-gray-800">{item.patientName} (MRN: {item.patientMrn})</p>
              <p className="text-red-700 font-medium">⚠️ Risk Trigger: {item.primaryRiskTrigger}</p>
              <p className="text-gray-500">Consultant: {item.attendingPhysician} | Last Sync: {item.lastVitalsSync}</p>
            </div>
            <div className="text-right">
              <span className="text-base font-bold text-red-900 block">{item.icuTransferProbabilityPct}%</span>
              <span className="text-gray-500 text-[11px]">ICU Escalation Risk</span>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
