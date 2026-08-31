import React from 'react';
import { Card, Badge } from '@docsearch/ui-kit';
import type { EmergencyAnalyticsDto } from '@docsearch/api-contracts';

interface Props {
  analytics: EmergencyAnalyticsDto;
}

export const EmergencyAnalyticsView: React.FC<Props> = ({ analytics }) => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Emergency BI & Operational Analytics</h1>
        <p className="text-sm text-gray-500">Acuity breakdowns, arrival modes, hourly admission spikes, and disposition trends</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-5 space-y-3">
          <h2 className="text-lg font-bold text-gray-900">ESI Acuity Distribution</h2>
          <div className="space-y-2">
            {analytics.esiDistribution.map(e => (
              <div key={e.esiLevel} className="flex justify-between items-center p-2 rounded bg-gray-50 text-sm">
                <span className="font-medium text-gray-900">{e.esiLevel}</span>
                <Badge variant="primary">{e.count} Patients</Badge>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5 space-y-3">
          <h2 className="text-lg font-bold text-gray-900">Arrival Mode Trends</h2>
          <div className="space-y-2">
            {analytics.arrivalModes.map(m => (
              <div key={m.mode} className="flex justify-between items-center p-2 rounded bg-gray-50 text-sm">
                <span className="font-medium text-gray-900">{m.mode}</span>
                <span className="font-bold text-gray-700">{m.count} Cases</span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5 space-y-3">
          <h2 className="text-lg font-bold text-gray-900">Hourly Patient Volume</h2>
          <div className="space-y-2">
            {analytics.hourlyVolume.map(h => (
              <div key={h.hourLabel} className="flex justify-between items-center p-2 rounded bg-gray-50 text-sm">
                <span className="font-medium text-gray-900">{h.hourLabel}</span>
                <span className="font-bold text-indigo-600">{h.count} Arrivals</span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5 space-y-3">
          <h2 className="text-lg font-bold text-gray-900">Disposition Outcomes</h2>
          <div className="space-y-2">
            {analytics.dispositionBreakdown.map(d => (
              <div key={d.outcome} className="flex justify-between items-center p-2 rounded bg-gray-50 text-sm">
                <span className="font-medium text-gray-900">{d.outcome}</span>
                <span className="font-bold text-emerald-600">{d.count} Cases</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};
