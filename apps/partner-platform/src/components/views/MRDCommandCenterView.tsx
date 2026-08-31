import React from 'react';
import { Card, Button, Badge } from '@docsearch/ui-kit';
import type { MRDOverviewMetricsDto, MRDepartmentDto } from '@docsearch/api-contracts';

interface Props {
  metrics: MRDOverviewMetricsDto | null;
  department: MRDepartmentDto | null;
  onNavigateTab: (tab: string) => void;
  onOpenBirthDialog: () => void;
  onOpenDeathDialog: () => void;
}

export const MRDCommandCenterView: React.FC<Props> = ({
  metrics,
  department,
  onNavigateTab,
  onOpenBirthDialog,
  onOpenDeathDialog
}) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between bg-slate-900 text-white p-6 rounded-xl shadow-lg">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <span className="text-2xl">📁</span>
            <h1 className="text-xl font-black tracking-tight">{department?.departmentName || 'Medical Records & Health Information Management'}</h1>
            <Badge variant="primary">HIM / MRD Hub</Badge>
          </div>
          <p className="text-xs text-slate-300">
            Director: <span className="font-semibold text-white">{department?.headOfMrdName}</span> | Lead Auditor: <span className="font-semibold text-white">{department?.leadCodingAuditorName}</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="primary" size="sm" onClick={onOpenBirthDialog}>+ Certify Birth</Button>
          <Button variant="danger" size="sm" onClick={onOpenDeathDialog}>+ Certify Death</Button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <Card className="p-4 bg-white border-l-4 border-blue-500 shadow-sm cursor-pointer hover:shadow-md transition" onClick={() => onNavigateTab('records')}>
          <div className="text-xs font-bold text-gray-500 uppercase">Active Indexed Records</div>
          <div className="text-2xl font-black text-gray-900 mt-1">{metrics?.totalActiveRecords ?? 0}</div>
          <div className="text-xs text-blue-600 mt-1">Total Patient Charts</div>
        </Card>
        <Card className="p-4 bg-white border-l-4 border-amber-500 shadow-sm cursor-pointer hover:shadow-md transition" onClick={() => onNavigateTab('completion')}>
          <div className="text-xs font-bold text-gray-500 uppercase">Deficient / Incomplete Charts</div>
          <div className="text-2xl font-black text-amber-600 mt-1">{metrics?.incompleteChartsCount ?? 0}</div>
          <div className="text-xs text-amber-700 mt-1">Pending Physician Signatures / Reports</div>
        </Card>
        <Card className="p-4 bg-white border-l-4 border-emerald-500 shadow-sm cursor-pointer hover:shadow-md transition" onClick={() => onNavigateTab('coding')}>
          <div className="text-xs font-bold text-gray-500 uppercase">ICD-10 Coding Queue</div>
          <div className="text-2xl font-black text-emerald-600 mt-1">{metrics?.pendingCodingQueueCount ?? 0}</div>
          <div className="text-xs text-emerald-700 mt-1">Accuracy: {metrics?.codingAccuracyRatePercent ?? 100}%</div>
        </Card>
        <Card className="p-4 bg-white border-l-4 border-purple-500 shadow-sm cursor-pointer hover:shadow-md transition" onClick={() => onNavigateTab('roi')}>
          <div className="text-xs font-bold text-gray-500 uppercase">ROI Disclosure Requests</div>
          <div className="text-2xl font-black text-purple-600 mt-1">{metrics?.pendingROIRequestsCount ?? 0}</div>
          <div className="text-xs text-purple-700 mt-1">Legal Holds Active: {metrics?.activeLegalHoldsCount ?? 0}</div>
        </Card>
      </div>
    </div>
  );
};
