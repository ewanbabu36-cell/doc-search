import React from 'react';
import { Card, Badge, Button } from '@docsearch/ui-kit';
import type { AarogyaPatientProfileDto } from '@docsearch/api-contracts';

interface Props {
  profile: AarogyaPatientProfileDto;
}

export const Aarogya360PatientPortalView: React.FC<Props> = ({ profile }) => {
  return (
    <div className="space-y-4">
      {/* Patient Portal Card */}
      <div className="p-4 bg-gradient-to-r from-blue-900 to-indigo-950 text-white rounded-xl shadow-lg flex justify-between items-center">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">📱</span>
            <h2 className="text-lg font-bold">Aarogya 360 Patient Self-Service Portal</h2>
            <Badge variant="success">Verified ABHA Linked</Badge>
          </div>
          <p className="text-xs text-blue-200 mt-1">Patient: <strong>{profile.fullName}</strong> | MRN: {profile.patientMrn} | ABHA: <span className="font-mono">{profile.abhaAddress}</span></p>
        </div>
        <div className="flex gap-2">
          <Button variant="primary" size="sm">Download Health Passport PDF</Button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 text-xs">
        <Card className="p-4 space-y-2">
          <span className="font-bold text-gray-900 block border-b pb-1">Digital Health Locker & Records</span>
          <p className="text-2xl font-bold text-blue-900">{profile.totalHealthRecordsCount} Documents</p>
          <p className="text-gray-600">Prescriptions, Lab Reports, DICOM Imaging, Discharge Summaries.</p>
        </Card>

        <Card className="p-4 space-y-2">
          <span className="font-bold text-gray-900 block border-b pb-1">Active Prescriptions</span>
          <p className="text-2xl font-bold text-emerald-900">{profile.activePrescriptionsCount} Active</p>
          <p className="text-gray-600">Automated refill reminders synced with Hospital Pharmacy.</p>
        </Card>

        <Card className="p-4 space-y-2">
          <span className="font-bold text-gray-900 block border-b pb-1">Upcoming Appointments</span>
          <p className="text-2xl font-bold text-purple-900">{profile.upcomingAppointmentsCount} Scheduled</p>
          <p className="text-gray-600">1-click virtual teleconsultation entry & live lobby token tracker.</p>
        </Card>
      </div>
    </div>
  );
};
