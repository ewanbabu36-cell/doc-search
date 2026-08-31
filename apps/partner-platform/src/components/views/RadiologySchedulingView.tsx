import React from 'react';
import { Card, Button, Badge } from '@docsearch/ui-kit';
import type { RadiologyAppointmentDto } from '@docsearch/api-contracts';

interface Props {
  appointments: RadiologyAppointmentDto[];
  onReschedule: (appointment: RadiologyAppointmentDto) => void;
}

export const RadiologySchedulingView: React.FC<Props> = ({ appointments, onReschedule }) => {
  return (
    <Card className="p-5 bg-white border border-gray-200 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-gray-900">Radiology Master Schedule</h3>
          <p className="text-xs text-gray-500">Active modality time-slots, rooms, and assigned technologist rosters</p>
        </div>
        <Badge variant="primary">{appointments.length} Total Bookings</Badge>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b bg-gray-50 text-gray-600 font-bold">
              <th className="py-2.5 px-3">Appt Code</th>
              <th className="py-2.5 px-3">Patient & MRN</th>
              <th className="py-2.5 px-3">Modality & Room</th>
              <th className="py-2.5 px-3">Time Slot</th>
              <th className="py-2.5 px-3">Assigned Tech</th>
              <th className="py-2.5 px-3">Status</th>
              <th className="py-2.5 px-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {appointments.map((app) => (
              <tr key={app.id} className="hover:bg-gray-50/70 transition">
                <td className="py-2.5 px-3 font-mono font-bold text-blue-700">{app.appointmentCode}</td>
                <td className="py-2.5 px-3 font-semibold text-gray-900">{app.patientName}</td>
                <td className="py-2.5 px-3">
                  <div className="font-medium text-gray-800">{app.modalityName}</div>
                  <div className="text-[10px] text-gray-500">{app.roomNumber}</div>
                </td>
                <td className="py-2.5 px-3">
                  <div>{new Date(app.scheduledStart).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(app.scheduledEnd).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                  <div className="text-[10px] text-gray-500">{new Date(app.scheduledStart).toLocaleDateString()}</div>
                </td>
                <td className="py-2.5 px-3 text-gray-700">{app.assignedTechnologistName}</td>
                <td className="py-2.5 px-3">
                  <Badge variant={app.status === 'COMPLETED' ? 'success' : app.status === 'IN_PROGRESS' ? 'warning' : 'primary'}>
                    {app.status}
                  </Badge>
                </td>
                <td className="py-2.5 px-3 text-right">
                  {app.status !== 'COMPLETED' && (
                    <Button variant="outline" size="sm" onClick={() => onReschedule(app)}>Reschedule</Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
};
