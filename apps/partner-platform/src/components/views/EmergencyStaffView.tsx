import React from 'react';
import { Card, Badge } from '@docsearch/ui-kit';
import type { EmergencyDepartmentDto } from '@docsearch/api-contracts';

interface Props {
  department: EmergencyDepartmentDto;
}

export const EmergencyStaffView: React.FC<Props> = ({ department }) => {
  const staffList = [
    { name: department.headOfEmergency, role: 'Head of Emergency & Trauma', status: 'On Duty' },
    { name: 'Dr. Marcus Webb, MD', role: 'Attending Emergency Physician', status: 'On Duty' },
    { name: 'Dr. Gregory House, MS (Trauma)', role: 'On-Call Trauma Surgeon', status: 'On Standby' },
    { name: 'Dr. Christopher Nolan, MD', role: 'On-Call Emergency Anaesthetist', status: 'On Standby' },
    { name: 'Nurse Mark Hopkins, RN', role: 'Lead Triage Nurse', status: 'On Duty' },
    { name: 'Nurse Elena Gilbert, RN', role: 'Acute Zone Primary Nurse', status: 'On Duty' },
    { name: 'Staff Nurse Jennifer Adams', role: 'Resuscitation / Crash Cart Specialist', status: 'On Duty' }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Emergency Staff & Clinical Roster</h1>
        <p className="text-sm text-gray-500">Attending physicians, trauma surgeons, triage nurses, and resuscitation teams</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {staffList.map(s => (
          <Card key={s.name} className="p-4 space-y-2">
            <div className="flex justify-between items-center">
              <span className="font-bold text-gray-900">{s.name}</span>
              <Badge variant={s.status === 'On Duty' ? 'success' : 'primary'}>{s.status}</Badge>
            </div>
            <p className="text-xs text-gray-600">{s.role}</p>
          </Card>
        ))}
      </div>
    </div>
  );
};
