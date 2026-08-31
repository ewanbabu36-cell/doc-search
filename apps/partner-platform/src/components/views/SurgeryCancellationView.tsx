import React from 'react';
import { Card, Table, Badge } from '@docsearch/ui-kit';
import type { SurgeryCancellationDto } from '@docsearch/api-contracts';

interface Props {
  cancellations: SurgeryCancellationDto[];
}

export const SurgeryCancellationView: React.FC<Props> = ({ cancellations }) => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Surgery Cancellations & Root Cause Audits</h1>
        <p className="text-sm text-gray-500">Track cancellation reasons, authorizers, and rescheduled elective queues</p>
      </div>

      <Card className="p-4">
        <Table>
          <thead>
            <tr className="text-left text-xs font-semibold text-gray-500 border-b">
              <th className="py-2">Cancellation #</th>
              <th className="py-2">Patient</th>
              <th className="py-2">Procedure</th>
              <th className="py-2">Reason</th>
              <th className="py-2">Cancelled By</th>
              <th className="py-2">Rescheduling</th>
            </tr>
          </thead>
          <tbody className="divide-y text-sm">
            {cancellations.map(c => (
              <tr key={c.id}>
                <td className="py-2 font-bold text-gray-900">{c.cancellationNumber}</td>
                <td className="py-2">{c.patientName}</td>
                <td className="py-2 font-medium">{c.procedureName}</td>
                <td className="py-2 text-xs text-red-700">{c.cancellationReason}</td>
                <td className="py-2 text-xs">{c.cancelledBy} ({c.cancelledByRole})</td>
                <td className="py-2"><Badge variant={c.reschedulingRequested ? 'primary' : 'neutral'}>{c.reschedulingRequested ? 'Requested' : 'No'}</Badge></td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Card>
    </div>
  );
};
