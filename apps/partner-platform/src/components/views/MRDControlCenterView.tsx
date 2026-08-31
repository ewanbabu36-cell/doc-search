import React from 'react';
import { Card, Badge } from '@docsearch/ui-kit';
import type { MRDepartmentDto } from '@docsearch/api-contracts';

interface Props {
  department: MRDepartmentDto | null;
}

export const MRDControlCenterView: React.FC<Props> = ({ department }) => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-gray-900">MRD / HIM Department Control Center</h2>
        <p className="text-xs text-gray-500">Department configuration, archival vault management, and regulatory compliance settings</p>
      </div>

      <Card className="p-6 space-y-4">
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="text-xs font-semibold text-gray-500">Department Name</label>
            <div className="font-bold text-gray-900">{department?.departmentName}</div>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500">Department Code</label>
            <div className="font-bold text-gray-900">{department?.departmentCode}</div>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500">HIM Director</label>
            <div className="font-bold text-gray-900">{department?.headOfMrdName}</div>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500">Lead Coding Auditor</label>
            <div className="font-bold text-gray-900">{department?.leadCodingAuditorName}</div>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500">Archival Vault Location</label>
            <div className="font-bold text-gray-900">{department?.physicalVaultLocation}</div>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500">Operational Status</label>
            <div>
              <Badge variant="success">ACTIVE & COMPLIANT</Badge>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};
