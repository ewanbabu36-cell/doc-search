import React from 'react';
import { Card, Badge, Button } from '@docsearch/ui-kit';
import type { BloodQualityCheckDto } from '@docsearch/api-contracts';

interface Props {
  checks: BloodQualityCheckDto[];
  onOpenNewQC: () => void;
}

export const BloodQualityControlView: React.FC<Props> = ({ checks, onOpenNewQC }) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Blood Bank Quality Control (QC) & Calibration</h2>
          <p className="text-xs text-gray-500">Equipment maintenance, centrifuge RPM checks & reagent control logs</p>
        </div>
        <Button variant="primary" onClick={onOpenNewQC}>+ Log QC Calibration</Button>
      </div>

      <Card className="overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-600 border-b border-gray-200">
            <tr>
              <th className="p-3">QC Code</th>
              <th className="p-3">Equipment Name</th>
              <th className="p-3">Check Type</th>
              <th className="p-3">Parameter Measured</th>
              <th className="p-3">Standard vs Actual</th>
              <th className="p-3">Technologist</th>
              <th className="p-3">Outcome</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {checks.map((c) => (
              <tr key={c.id} className="hover:bg-slate-50 transition">
                <td className="p-3 font-bold text-slate-800">{c.qcCode}</td>
                <td className="p-3 font-semibold text-gray-900">{c.equipmentName}</td>
                <td className="p-3 text-xs text-gray-600">{c.checkType.replace(/_/g, ' ')}</td>
                <td className="p-3 text-xs text-gray-700">{c.parameterMeasured}</td>
                <td className="p-3 text-xs font-mono">{c.expectedStandard} / {c.actualReading}</td>
                <td className="p-3 text-xs text-gray-700">{c.technicianName}</td>
                <td className="p-3">
                  <Badge variant={c.isPassed ? 'success' : 'danger'}>
                    {c.isPassed ? 'PASSED QC' : 'FAILED'}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
};
