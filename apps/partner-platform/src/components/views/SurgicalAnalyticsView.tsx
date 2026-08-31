import React from 'react';
import { Card, Badge } from '@docsearch/ui-kit';
import type { OTAnalyticsDto } from '@docsearch/api-contracts';

interface Props {
  analytics: OTAnalyticsDto;
}

export const SurgicalAnalyticsView: React.FC<Props> = ({ analytics }) => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Surgical Analytics & Intelligence</h1>
        <p className="text-sm text-gray-500">Caseload volume by specialty, elective vs emergency trends, and performance metrics</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-5 space-y-3">
          <h2 className="text-lg font-bold text-gray-900">Specialty Distribution</h2>
          <div className="space-y-2">
            {analytics.specialtyDistribution.map(s => (
              <div key={s.specialty} className="flex justify-between items-center p-2 rounded bg-gray-50 text-sm">
                <span className="font-medium text-gray-900">{s.specialty}</span>
                <div className="flex gap-3">
                  <Badge variant="primary">{s.caseCount} Cases</Badge>
                  <span className="font-bold text-gray-700">{s.utilizationPercentage}%</span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5 space-y-3">
          <h2 className="text-lg font-bold text-gray-900">Monthly Surgery Trends</h2>
          <div className="space-y-2">
            {analytics.monthlySurgeryTrends.map(m => (
              <div key={m.month} className="flex justify-between items-center p-2 rounded bg-gray-50 text-sm">
                <span className="font-bold text-gray-900">{m.month}</span>
                <div className="flex gap-2">
                  <Badge variant="success">Elective: {m.electiveCount}</Badge>
                  <Badge variant="danger">Emergency: {m.emergencyCount}</Badge>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};
