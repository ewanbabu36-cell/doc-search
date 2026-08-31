import React from 'react';
import { Card, Badge, Button } from '@docsearch/ui-kit';
import type { OperationTheatreRoomDto } from '@docsearch/api-contracts';

interface Props {
  room: OperationTheatreRoomDto | null;
  onBack: () => void;
  onBook: (room: OperationTheatreRoomDto) => void;
}

export const OTRoomDetailView: React.FC<Props> = ({ room, onBack, onBook }) => {
  if (!room) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Button variant="outline" onClick={onBack}>← Back to Room Directory</Button>
          <h1 className="text-2xl font-bold text-gray-900 mt-2">{room.roomNumber} — {room.roomName}</h1>
        </div>
        <Button variant="primary" onClick={() => onBook(room)}>Schedule Case in this Room</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-5 space-y-3">
          <h2 className="text-lg font-bold text-gray-900">Room Specifications</h2>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <span className="text-gray-500">OT Type:</span>
            <span className="font-semibold text-gray-800">{room.otType}</span>
            <span className="text-gray-500">Primary Specialty:</span>
            <span className="font-semibold text-gray-800">{room.primarySpecialty}</span>
            <span className="text-gray-500">Current Status:</span>
            <span><Badge variant={room.status === 'AVAILABLE' ? 'success' : 'danger'}>{room.status}</Badge></span>
            <span className="text-gray-500">Hourly Rate:</span>
            <span className="font-semibold text-gray-800">₹{room.hourlyRate}/hour</span>
          </div>
        </Card>

        <Card className="p-5 space-y-3">
          <h2 className="text-lg font-bold text-gray-900">Equipment & Airflow</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span>Laminar Flow:</span> <Badge variant="success">Active</Badge></div>
            <div className="flex justify-between"><span>HEPA Filtration:</span> <Badge variant="success">Certified</Badge></div>
            <div className="flex justify-between"><span>Pendant System:</span> <Badge variant="success">Connected</Badge></div>
            <div className="flex justify-between"><span>Anaesthesia Workstation:</span> <Badge variant="success">Online</Badge></div>
            <div className="flex justify-between"><span>C-Arm Fluoroscopy:</span> <Badge variant="primary">Available</Badge></div>
          </div>
        </Card>
      </div>
    </div>
  );
};
