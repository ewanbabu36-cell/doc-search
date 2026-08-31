import React from 'react';
import { Card, Button, Badge } from '@docsearch/ui-kit';
import type { RadiologyDepartmentDto, RadiologyOverviewMetricsDto } from '@docsearch/api-contracts';

interface Props {
  department: RadiologyDepartmentDto;
  metrics: RadiologyOverviewMetricsDto;
  onRefresh: () => void;
}

export const RadiologyControlCenterView: React.FC<Props> = ({
  department,
  metrics,
  onRefresh
}) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between bg-white p-5 rounded-xl border border-gray-200">
        <div>
          <h2 className="text-base font-bold text-gray-900">{department.departmentName}</h2>
          <p className="text-xs text-gray-500">
            {department.departmentCode} • {department.locationDescription}
          </p>
          <div className="flex items-center gap-4 mt-2 text-xs text-gray-600">
            <span>HOD: <strong>{department.hodRadiologistName}</strong></span>
            <span>Chief Technologist: <strong>{department.chiefTechnologistName}</strong></span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="success">Domain 2.17 Live</Badge>
          <Button variant="outline" size="sm" onClick={onRefresh}>↻ Sync Status</Button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card className="p-4 bg-white border border-gray-200">
          <div className="text-xs font-bold text-gray-500 uppercase">PACS C-STORE & WADO</div>
          <div className="text-lg font-bold text-green-700 mt-1">ONLINE & SYNCED</div>
          <div className="text-xs text-gray-500 mt-1">DICOM Port 104 • Storage Commit Active</div>
        </Card>
        <Card className="p-4 bg-white border border-gray-200">
          <div className="text-xs font-bold text-gray-500 uppercase">Radiation Hemovigilance</div>
          <div className="text-lg font-bold text-blue-700 mt-1">DOSE MONITOR ACTIVE</div>
          <div className="text-xs text-gray-500 mt-1">DLP Tracking Enforced for CT & X-Ray</div>
        </Card>
        <Card className="p-4 bg-white border border-gray-200">
          <div className="text-xs font-bold text-gray-500 uppercase">Pending Report Queue</div>
          <div className="text-lg font-bold text-amber-600 mt-1">{metrics.pendingReportsCount} Studies</div>
          <div className="text-xs text-gray-500 mt-1">Awaiting Radiologist Verification</div>
        </Card>
      </div>
    </div>
  );
};
