import React from 'react';
import { Card } from '@docsearch/ui-kit';
import type { MRDAnalyticsDto } from '@docsearch/api-contracts';

interface Props {
  analytics: MRDAnalyticsDto | null;
}

export const MRDAnalyticsView: React.FC<Props> = ({ analytics }) => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-gray-900">Health Information Management & Coding Analytics</h2>
        <p className="text-xs text-gray-500">Disease distribution, coding accuracy, and completion metrics</p>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <Card className="p-5 space-y-3">
          <h3 className="text-sm font-bold text-gray-900 uppercase">Top ICD-10 Hospital Diagnoses</h3>
          <div className="space-y-2">
            {analytics?.topDiagnosesICD.map((d) => (
              <div key={d.code} className="flex items-center justify-between p-2.5 bg-slate-50 rounded text-xs">
                <div>
                  <span className="font-bold text-blue-700">[{d.code}]</span> {d.title}
                </div>
                <span className="font-black text-gray-900">{d.count} cases</span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5 space-y-3">
          <h3 className="text-sm font-bold text-gray-900 uppercase">Chart Completion Rate by Department</h3>
          <div className="space-y-2">
            {analytics?.chartCompletionRates.map((c) => (
              <div key={c.department} className="flex items-center justify-between p-2.5 bg-slate-50 rounded text-xs">
                <span className="font-semibold text-gray-800">{c.department}</span>
                <span className="font-black text-emerald-600">{c.rate}% Completed</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};
