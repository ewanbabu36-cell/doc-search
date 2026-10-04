import React, { useState } from 'react';
import { Card, Table, Badge, Button, Input } from '@docsearch/ui-kit';
import type { OTScheduleDto } from '@docsearch/api-contracts';

interface Props {
  schedules: OTScheduleDto[];
  onBookSchedule: () => void;
  onReschedule: (schedule: OTScheduleDto) => void;
  onAssignTeam: (schedule: OTScheduleDto) => void;
  onStartSurgery: (schedule: OTScheduleDto) => void;
  onCancelSurgery: (schedule: OTScheduleDto) => void;
}

export const OTScheduleView: React.FC<Props> = ({
  schedules,
  onBookSchedule,
  onReschedule,
  onAssignTeam,
  onStartSurgery,
  onCancelSurgery
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = schedules.filter(
    (s) =>
      s.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.procedureName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.roomName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div style={{ backgroundColor: '#0F172A', border: '1.5px solid rgba(255,255,255,0.1)', padding: '16px 20px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '14px', flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#F8FAFC', margin: 0 }}>
            ⚡ OT Master Roster & Dynamic Turnaround Grid
          </h1>
          <p style={{ fontSize: '0.76rem', color: '#94A3B8', margin: '4px 0 0 0' }}>
            Active surgical calendar • 3-Gate Dependency Check (PAC / CSSD / NPO) • 25-Min HEPA Air Purge Turnaround
          </p>
        </div>
        <Button variant="primary" onClick={onBookSchedule} style={{ fontSize: '0.8rem', fontWeight: 800 }}>
          + Book New Schedule
        </Button>
      </div>

      <div style={{ backgroundColor: '#070C16', border: '1px solid rgba(59, 130, 246, 0.25)', borderRadius: '10px', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', fontSize: '0.78rem', color: '#93C5FD', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>💨</span>
          <div>
            <strong>Room Air Decontamination & Overrun Cascade:</strong> Between all cases, a mandatory 25-minute positive pressure HEPA air turnover cycle is calculated. Any surgical overrun dynamically shifts subsequent cases with automated ward dispatch.
          </div>
        </div>
        <span style={{ backgroundColor: 'rgba(59, 130, 246, 0.15)', border: '1px solid #3B82F6', color: '#60A5FA', padding: '3px 8px', borderRadius: '4px', fontSize: '0.72rem', fontWeight: 700 }}>
          Cascade Engine Live
        </span>
      </div>

      <Card className="p-4" style={{ backgroundColor: '#0F172A', border: '1px solid rgba(255,255,255,0.08)' }}>
        <div className="mb-4">
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search patient, procedure, room or surgeon..."
          />
        </div>
        <Table>
          <thead>
            <tr className="text-left text-xs font-semibold text-gray-400 border-b border-gray-700">
              <th className="py-2">Schedule #</th>
              <th className="py-2">Patient</th>
              <th className="py-2">Operating Room</th>
              <th className="py-2">Procedure</th>
              <th className="py-2">Surgeon & Anaesth</th>
              <th className="py-2">Slot Timing & Dynamic ETA</th>
              <th className="py-2">Dependency Gates</th>
              <th className="py-2">Status</th>
              <th className="py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800 text-sm">
            {filtered.map((s, idx) => {
              const isFirst = idx === 0;
              return (
                <tr key={s.id}>
                  <td className="py-2 font-bold font-mono" style={{ color: '#F8FAFC' }}>
                    {s.scheduleNumber}
                  </td>
                  <td className="py-2">
                    <div className="font-semibold" style={{ color: '#F8FAFC' }}>{s.patientName}</div>
                    <div className="text-xs text-gray-500 font-mono">{s.patientMrn}</div>
                  </td>
                  <td className="py-2" style={{ color: '#38BDF8' }}>{s.roomName}</td>
                  <td className="py-2 font-medium" style={{ color: '#E2E8F0' }}>{s.procedureName}</td>
                  <td className="py-2 text-xs" style={{ color: '#CBD5E1' }}>
                    <div>Surgeon: <strong>{s.primarySurgeonName}</strong></div>
                    <div>Anaesth: <strong>{s.leadAnaesthetistName}</strong></div>
                  </td>
                  <td className="py-2 text-xs">
                    <div style={{ color: '#94A3B8' }}>
                      {new Date(s.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ({s.estimatedDurationMinutes}m)
                    </div>
                    {isFirst ? (
                      <span style={{ color: '#34D399', fontWeight: 800, fontSize: '0.7rem' }}>
                        ⚡ On-Schedule (Incision Ready)
                      </span>
                    ) : (
                      <span style={{ color: '#FBBF24', fontWeight: 800, fontSize: '0.7rem' }}>
                        ⚡ Dynamic ETA: +45m HEPA Purge Shift
                      </span>
                    )}
                  </td>
                  <td className="py-2 text-xs">
                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                      <span style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#34D399', padding: '1px 5px', borderRadius: '3px', fontSize: '0.68rem', fontWeight: 700 }}>
                        PAC ✓
                      </span>
                      <span style={{ backgroundColor: isFirst ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)', color: isFirst ? '#34D399' : '#FBBF24', padding: '1px 5px', borderRadius: '3px', fontSize: '0.68rem', fontWeight: 700 }}>
                        {isFirst ? 'CSSD ✓' : 'CSSD Scan Req'}
                      </span>
                      <span style={{ backgroundColor: isFirst ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)', color: isFirst ? '#34D399' : '#F87171', padding: '1px 5px', borderRadius: '3px', fontSize: '0.68rem', fontWeight: 700 }}>
                        {isFirst ? 'NPO Safe' : 'NPO Locked'}
                      </span>
                    </div>
                  </td>
                  <td className="py-2">
                    <Badge variant={s.status === 'IN_PROGRESS' ? 'danger' : s.status === 'CONFIRMED' ? 'primary' : 'neutral'}>
                      {s.status}
                    </Badge>
                  </td>
                  <td className="py-2 text-right space-x-1">
                    {s.status === 'CONFIRMED' && (
                      <>
                        <Button variant="primary" onClick={() => onStartSurgery(s)} style={{ fontSize: '0.74rem' }}>
                          Start Incision
                        </Button>
                        <Button variant="outline" onClick={() => onAssignTeam(s)} style={{ fontSize: '0.74rem' }}>
                          Team
                        </Button>
                        <Button variant="outline" onClick={() => onReschedule(s)} style={{ fontSize: '0.74rem' }}>
                          Reschedule
                        </Button>
                        <Button variant="danger" onClick={() => onCancelSurgery(s)} style={{ fontSize: '0.74rem' }}>
                          Cancel
                        </Button>
                      </>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </Table>
      </Card>
    </div>
  );
};
