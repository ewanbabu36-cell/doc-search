import React from 'react';
import { Card } from '@docsearch/ui-kit';
import type { OTOverviewMetricsDto, OTAnalyticsDto } from '@docsearch/api-contracts';

interface Props {
  metrics: OTOverviewMetricsDto;
  analytics: OTAnalyticsDto;
}

export const OTUtilizationView: React.FC<Props> = ({ metrics, analytics }) => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">OT Room Utilization & Turnaround</h1>
        <p className="text-sm text-gray-500">Suite occupancy rates, cleaning delays, and surgical throughput efficiency</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-5">
          <p className="text-xs font-semibold text-gray-500 uppercase">Average OT Utilization</p>
          <p className="text-3xl font-bold text-indigo-600 mt-2">{metrics.otUtilizationPercentage}%</p>
          <p className="text-xs text-gray-500 mt-1">Across all operating rooms</p>
        </Card>
        <Card className="p-5">
          <p className="text-xs font-semibold text-gray-500 uppercase">Avg Turnaround Time</p>
          <p className="text-3xl font-bold text-emerald-600 mt-2">{metrics.averageTurnaroundTimeMinutes} min</p>
          <p className="text-xs text-gray-500 mt-1">From patient exit to next incision</p>
        </Card>
        <Card className="p-5">
          <p className="text-xs font-semibold text-gray-500 uppercase">Delayed Cases Today</p>
          <p className="text-3xl font-bold text-amber-600 mt-2">{metrics.delayedSurgeriesCount}</p>
          <p className="text-xs text-gray-500 mt-1">On-time start rate: 100%</p>
        </Card>
      </div>

      <Card className="p-5">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Turnaround Time by OT Suite</h2>
        <div className="space-y-3">
          {analytics.turnaroundTimeByRoom.map(t => (
            <div key={t.roomName} className="flex justify-between items-center p-3 rounded bg-gray-50">
              <span className="font-medium text-sm text-gray-900">{t.roomName}</span>
              <span className="font-bold text-indigo-600 text-sm">{t.avgTurnaroundMinutes} minutes</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};
