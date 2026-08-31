import React from 'react';
import { Card, Badge } from '@docsearch/ui-kit';
import type { EdNedocsHourlyDto } from '@docsearch/api-contracts';

interface Props {
  history: EdNedocsHourlyDto[];
}

export const EdNedocsSurgeRadarView: React.FC<Props> = ({ history }) => {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-bold text-gray-900">National Emergency Department Overcrowding Scale (NEDOCS) Radar</h2>
        <p className="text-xs text-gray-500">Hourly overcrowding index, longest wait times, admission hold bottlenecks, and 4h arrival velocity</p>
      </div>

      <div className="grid grid-cols-4 gap-3">
        {history.map((h, idx) => (
          <Card key={idx} className="p-4 space-y-2">
            <div className="flex justify-between items-center border-b pb-1">
              <span className="text-xs font-bold text-gray-900">Time: {h.hourTimestamp}</span>
              <Badge variant={h.nedocsScore > 100 ? 'warning' : 'success'}>NEDOCS {h.nedocsScore}</Badge>
            </div>
            <div className="text-xs space-y-1">
              <p className="text-gray-500">Total in ED: <strong>{h.totalPatientsInEd}</strong></p>
              <p className="text-gray-500">Admit Holds: <strong className="text-red-700">{h.admittedPatientsWaitingBed}</strong></p>
              <p className="text-gray-500">Longest Wait: <strong>{h.longestWaitTimeMins} mins</strong></p>
              <p className="text-blue-900 font-semibold pt-1 border-t">Predicted Inflow (+4h): +{h.predictedArrivalsNext4Hours}</p>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
