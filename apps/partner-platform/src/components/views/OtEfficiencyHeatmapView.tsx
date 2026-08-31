import React from 'react';
import { Card, Badge } from '@docsearch/ui-kit';
import type { OtSuiteEfficiencyDto } from '@docsearch/api-contracts';

interface Props {
  suites: OtSuiteEfficiencyDto[];
}

export const OtEfficiencyHeatmapView: React.FC<Props> = ({ suites }) => {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-bold text-gray-900">Operation Theatre (OT) Suite Utilization & Efficiency Heatmap</h2>
        <p className="text-xs text-gray-500">On-time first case start, room turnaround times (TAT), and case overrun risk radar</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {suites.map((suite) => (
          <Card key={suite.otRoomId} className="p-4 space-y-3">
            <div className="flex justify-between items-center border-b pb-2">
              <div>
                <span className="text-xs font-bold text-gray-900">{suite.otRoomName}</span>
                <span className="text-xs text-gray-500 block">{suite.suiteType}</span>
              </div>
              <Badge variant="success">{suite.scheduleStatus}</Badge>
            </div>
            <div className="grid grid-cols-3 gap-2 text-xs text-center">
              <div className="p-2 bg-purple-50 rounded">
                <span className="text-purple-700 block">Utilization</span>
                <span className="font-bold text-purple-900">{suite.utilizationRatePct}%</span>
              </div>
              <div className="p-2 bg-blue-50 rounded">
                <span className="text-blue-700 block">On-Time Start</span>
                <span className="font-bold text-blue-900">{suite.onTimeStartRatePct}%</span>
              </div>
              <div className="p-2 bg-green-50 rounded">
                <span className="text-green-700 block">Avg Turnaround</span>
                <span className="font-bold text-green-900">{suite.averageTurnaroundTimeMins} mins</span>
              </div>
            </div>
            <div className="text-xs text-gray-600 space-y-1">
              <p>Cases Today: {suite.casesCompletedToday} Done / {suite.casesInProgress} Active / {suite.casesScheduledToday} Total</p>
              <p className="text-gray-800 font-semibold">Next: {suite.nextScheduledSpecialty}</p>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
