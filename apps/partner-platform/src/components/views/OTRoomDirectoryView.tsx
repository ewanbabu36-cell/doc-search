import React, { useState } from 'react';
import { Card, Table, Badge, Button, Input } from '@docsearch/ui-kit';
import type { OperationTheatreRoomDto } from '@docsearch/api-contracts';

interface Props {
  rooms: OperationTheatreRoomDto[];
  onAddRoom: () => void;
  onSelectRoom: (room: OperationTheatreRoomDto) => void;
}

export const OTRoomDirectoryView: React.FC<Props> = ({
  rooms,
  onAddRoom,
  onSelectRoom
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = rooms.filter(
    (r) =>
      r.roomName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.roomNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.primarySpecialty.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">OT Room Master Directory</h1>
          <p className="text-sm text-gray-500">Operating room profiles, equipment readiness, and availability statuses</p>
        </div>
        <Button variant="primary" onClick={onAddRoom}>+ Commission OT Room</Button>
      </div>

      <Card className="p-4">
        <div className="mb-4">
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search room number, specialty or status..."
          />
        </div>
        <Table>
          <thead>
            <tr className="text-left text-xs font-semibold text-gray-500 border-b">
              <th className="py-2">Room #</th>
              <th className="py-2">Name</th>
              <th className="py-2">Type</th>
              <th className="py-2">Specialty</th>
              <th className="py-2">Hourly Rate</th>
              <th className="py-2">Status</th>
              <th className="py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y text-sm">
            {filtered.map((r) => (
              <tr key={r.id}>
                <td className="py-2 font-bold text-gray-900">{r.roomNumber}</td>
                <td className="py-2">{r.roomName}</td>
                <td className="py-2 text-gray-600">{r.otType}</td>
                <td className="py-2">{r.primarySpecialty}</td>
                <td className="py-2 font-medium">₹{r.hourlyRate}</td>
                <td className="py-2">
                  <Badge variant={r.status === 'AVAILABLE' ? 'success' : r.status === 'OCCUPIED' ? 'danger' : 'warning'}>
                    {r.status}
                  </Badge>
                </td>
                <td className="py-2 text-right">
                  <Button variant="outline" onClick={() => onSelectRoom(r)}>Details</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Card>
    </div>
  );
};
