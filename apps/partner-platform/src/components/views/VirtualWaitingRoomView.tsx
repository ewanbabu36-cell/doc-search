import React from 'react';
import { Card, Badge, Button } from '@docsearch/ui-kit';
import type { WaitingRoomQueueItemDto } from '@docsearch/api-contracts';

interface Props {
  queue: WaitingRoomQueueItemDto[];
  onAdmit: (queueId: string) => void;
}

export const VirtualWaitingRoomView: React.FC<Props> = ({ queue, onAdmit }) => {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-bold text-gray-900">Virtual Clinic Waiting Room & Patient Queue</h2>
        <p className="text-xs text-gray-500">Live patient queue with automated hardware audio/video diagnostics and pre-consultation vitals check</p>
      </div>

      <div className="space-y-3">
        {queue.map((q) => (
          <Card key={q.id} className="p-4 space-y-2 text-xs">
            <div className="flex justify-between items-center border-b pb-2">
              <div className="flex items-center gap-2">
                <span className="font-bold text-gray-900 text-sm">{q.patientName} (MRN: {q.patientMrn})</span>
                <Badge variant="primary">Queue Position: #{q.queuePosition}</Badge>
                <Badge variant="success">A/V Test: {q.audioVideoTestStatus}</Badge>
              </div>
              <span className="text-gray-500 font-medium">Est. Wait: ~{q.estimatedWaitTimeMins} mins</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Doctor: <strong>{q.doctorName}</strong></span>
              <span>Joined Waiting Room: {q.joinedAt.replace('T', ' ').substring(11, 16)}</span>
              <span>Pre-Check: {q.vitalsPreCheckCompleted ? '✓ Completed' : 'Pending'}</span>
            </div>
            <div className="flex justify-end pt-2 border-t">
              <Button variant="primary" size="sm" onClick={() => onAdmit(q.id)}>Admit to Video Call Room</Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
