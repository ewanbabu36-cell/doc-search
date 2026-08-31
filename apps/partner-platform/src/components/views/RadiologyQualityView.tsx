import React from 'react';
import { Card, Badge } from '@docsearch/ui-kit';
import type { RadiologyQualityEventDto } from '@docsearch/api-contracts';

interface Props {
  events: RadiologyQualityEventDto[];
}

export const RadiologyQualityView: React.FC<Props> = ({ events }) => {
  return (
    <Card className="p-5 bg-white border border-gray-200 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-gray-900">Radiology Quality Assurance & Dose Governance</h3>
          <p className="text-xs text-gray-500">Repeat exposure tracking, artifact logs & corrective actions</p>
        </div>
        <Badge variant="primary">{events.length} Recorded QA Events</Badge>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b bg-gray-50 text-gray-600 font-bold">
              <th className="py-2.5 px-3">Event Code</th>
              <th className="py-2.5 px-3">Modality</th>
              <th className="py-2.5 px-3">Event Type</th>
              <th className="py-2.5 px-3">Reason Description</th>
              <th className="py-2.5 px-3">Technologist</th>
              <th className="py-2.5 px-3">Corrective Action Taken</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {events.map((ev) => (
              <tr key={ev.id} className="hover:bg-gray-50/70 transition">
                <td className="py-2.5 px-3 font-mono font-bold text-amber-700">{ev.eventCode}</td>
                <td className="py-2.5 px-3 font-semibold">{ev.modalityType.split('_')[0]}</td>
                <td className="py-2.5 px-3">
                  <Badge variant="warning">{ev.eventType}</Badge>
                </td>
                <td className="py-2.5 px-3 text-gray-800">{ev.reasonDescription}</td>
                <td className="py-2.5 px-3 text-gray-600">{ev.technologistName}</td>
                <td className="py-2.5 px-3 text-green-800 font-medium">{ev.correctiveActionTaken}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
};
