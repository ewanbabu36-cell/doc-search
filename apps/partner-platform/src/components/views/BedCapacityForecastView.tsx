import React from 'react';
import { Card, Badge, Button } from '@docsearch/ui-kit';
import type { PredictiveBedForecastDto } from '@docsearch/api-contracts';

interface Props {
  forecasts: PredictiveBedForecastDto[];
  onOverride: (bedId: string) => void;
}

export const BedCapacityForecastView: React.FC<Props> = ({ forecasts, onOverride }) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900">AI Predictive Bed Demand & Capacity Forecasting</h2>
          <p className="text-xs text-gray-500">24-hour and 48-hour forward admissions vs discharges with bottleneck early alerts</p>
        </div>
      </div>

      <div className="space-y-3">
        {forecasts.map((f) => (
          <Card key={f.id} className="p-4 space-y-2">
            <div className="flex justify-between items-center border-b pb-2">
              <div>
                <span className="text-sm font-bold text-gray-900">{f.specialtyName}</span>
                <span className="text-xs text-gray-500 block">Horizon: {f.forecastWindow} | Model Confidence: {f.aiConfidencePct}%</span>
              </div>
              <Badge variant={f.predictedBottleneckLevel === 'CRITICAL_BLOCKER' ? 'danger' : f.predictedBottleneckLevel === 'MODERATE' ? 'warning' : 'success'}>
                {f.predictedBottleneckLevel}
              </Badge>
            </div>
            <div className="grid grid-cols-4 gap-2 text-xs">
              <div className="p-2 bg-gray-50 rounded">
                <span className="text-gray-500 block">Current Occupancy</span>
                <span className="font-bold text-gray-900">{f.currentOccupied} / {f.capacityLimit} beds</span>
              </div>
              <div className="p-2 bg-blue-50 rounded">
                <span className="text-blue-700 block">Predicted Admissions</span>
                <span className="font-bold text-blue-900">+{f.predictedAdmissions} patients</span>
              </div>
              <div className="p-2 bg-green-50 rounded">
                <span className="text-green-700 block">Predicted Discharges</span>
                <span className="font-bold text-green-900">-{f.predictedDischarges} patients</span>
              </div>
              <div className="p-2 bg-purple-50 rounded">
                <span className="text-purple-700 block">Projected Peak</span>
                <span className="font-bold text-purple-900">{f.projectedOccupancyPct}% Occupancy</span>
              </div>
            </div>
            <div className="p-2.5 bg-blue-50 text-blue-950 text-xs rounded border border-blue-200 flex justify-between items-center">
              <span><strong>💡 AI Strategy:</strong> {f.recommendedAction}</span>
              <Button variant="outline" size="sm" onClick={() => onOverride(f.id)}>Override Allocation</Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
