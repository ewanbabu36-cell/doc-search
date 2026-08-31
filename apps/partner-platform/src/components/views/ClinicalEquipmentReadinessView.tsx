import React from 'react';
import { Card, Badge } from '@docsearch/ui-kit';
import type { BiomedicalAssetDto } from '@docsearch/api-contracts';

interface Props {
  assets: BiomedicalAssetDto[];
}

export const ClinicalEquipmentReadinessView: React.FC<Props> = ({ assets }) => {
  const departments = ['Intensive Care Unit (ICU-A)', 'Emergency Department (ED)', 'Operation Theatre Complex (OT-1)', 'Operation Theatre Complex (OT-2)', 'Dialysis Unit'];

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-bold text-gray-900">Clinical Department Equipment Readiness Matrix</h2>
        <p className="text-xs text-gray-500">Real-time availability of critical life-support, surgical, and diagnostic assets per unit</p>
      </div>

      <div className="space-y-4">
        {departments.map((dept) => {
          const deptAssets = assets.filter((a) => a.departmentName.includes(dept.split(' ')[0] || ''));
          const readyCount = deptAssets.filter((a) => a.operationalStatus === 'IN_SERVICE').length;

          return (
            <Card key={dept} className="p-4 space-y-3">
              <div className="flex items-center justify-between border-b pb-2">
                <h3 className="text-sm font-bold text-gray-900">{dept}</h3>
                <Badge variant={readyCount === deptAssets.length ? 'success' : 'warning'}>
                  {readyCount} / {deptAssets.length} Assets Ready
                </Badge>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {deptAssets.map((a) => (
                  <div key={a.id} className="p-2 bg-gray-50 rounded-lg flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-gray-800">{a.assetCode}</span> - {a.assetName}
                      <p className="text-gray-500">{a.physicalLocation}</p>
                    </div>
                    <Badge variant={a.operationalStatus === 'IN_SERVICE' ? 'success' : 'danger'}>
                      {a.operationalStatus}
                    </Badge>
                  </div>
                ))}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
