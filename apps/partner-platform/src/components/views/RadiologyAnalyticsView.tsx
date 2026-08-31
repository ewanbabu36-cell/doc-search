import React from 'react';
import { Card } from '@docsearch/ui-kit';
import type { RadiologyAnalyticsDto } from '@docsearch/api-contracts';

interface Props {
  analytics: RadiologyAnalyticsDto;
}

export const RadiologyAnalyticsView: React.FC<Props> = ({ analytics }) => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-6">
        <Card className="p-5 bg-white border border-gray-200">
          <h3 className="text-sm font-bold text-gray-900 mb-3">Studies by Modality</h3>
          <div className="space-y-2.5">
            {analytics.studiesByModality.map((item) => (
              <div key={item.modality} className="space-y-1">
                <div className="flex justify-between text-xs font-semibold">
                  <span>{item.modality}</span>
                  <span>{item.count} scans</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-600 rounded-full" style={{ width: `${Math.min(item.count * 2, 100)}%` }} />
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5 bg-white border border-gray-200">
          <h3 className="text-sm font-bold text-gray-900 mb-3">Radiologist Productivity</h3>
          <div className="space-y-2.5">
            {analytics.reportsByRadiologist.map((item) => (
              <div key={item.radiologist} className="space-y-1">
                <div className="flex justify-between text-xs font-semibold">
                  <span>{item.radiologist}</span>
                  <span>{item.count} reports</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-purple-600 rounded-full" style={{ width: `${Math.min(item.count * 3, 100)}%` }} />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <Card className="p-5 bg-white border border-gray-200">
          <h3 className="text-sm font-bold text-gray-900 mb-3">Report Turnaround Time Trend (Hours)</h3>
          <div className="flex items-end justify-between gap-2 h-32 pt-4">
            {analytics.turnaroundTimeTrendHours.map((item) => (
              <div key={item.date} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-[10px] font-bold text-purple-700">{item.avgHours}h</span>
                <div
                  className="w-full bg-purple-200 rounded-t hover:bg-purple-300 transition"
                  style={{ height: `${Math.round(item.avgHours * 100)}px` }}
                />
                <span className="text-[9px] text-gray-500">{item.date.slice(5)}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5 bg-white border border-gray-200">
          <h3 className="text-sm font-bold text-gray-900 mb-3">Quality & Artifact Events</h3>
          <div className="space-y-2">
            {analytics.qualityEventsByType.map((q) => (
              <div key={q.type} className="flex items-center justify-between p-2.5 rounded bg-gray-50 border border-gray-100 text-xs">
                <span className="font-semibold text-gray-800">{q.type}</span>
                <span className="font-bold text-amber-700">{q.count} occurrences</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};
