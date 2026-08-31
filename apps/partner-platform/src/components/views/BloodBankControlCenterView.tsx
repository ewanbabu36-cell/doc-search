import React from 'react';
import { Card, Badge, Button } from '@docsearch/ui-kit';
import type { BloodBankFacilityDto } from '@docsearch/api-contracts';

interface Props {
  facility: BloodBankFacilityDto;
  onRefresh: () => void;
}

export const BloodBankControlCenterView: React.FC<Props> = ({ facility, onRefresh }) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Blood Bank System Administration & Control Center</h2>
          <p className="text-xs text-gray-500">Facility regulatory licensing, quality directors, laboratory compliance & branch isolation</p>
        </div>
        <Button variant="outline" onClick={onRefresh}>Refresh Configuration</Button>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <Card className="p-5">
          <h3 className="text-sm font-bold text-gray-900 mb-4">Facility Licensing & Accreditation</h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Facility Name:</span>
              <span className="font-bold text-gray-900">{facility.facilityName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Facility Code:</span>
              <span className="font-mono font-bold text-slate-800">{facility.facilityCode}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Drug & Blood License:</span>
              <span className="font-bold text-green-700">{facility.licenseNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Operating Status:</span>
              <Badge variant={facility.isActive ? 'success' : 'danger'}>{facility.isActive ? 'ACTIVE & LICENSED' : 'SUSPENDED'}</Badge>
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <h3 className="text-sm font-bold text-gray-900 mb-4">Responsible Clinical Officers</h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Medical Director:</span>
              <span className="font-bold text-gray-900">{facility.medicalDirectorName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Head Technologist:</span>
              <span className="font-bold text-gray-900">{facility.headTechnologistName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Main Storage Vault:</span>
              <span className="font-bold text-gray-900">{facility.storageLocationName}</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
