import React from 'react';
import { Card, Button, Badge } from '@docsearch/ui-kit';
import type { RadiologyReportDto } from '@docsearch/api-contracts';

interface Props {
  reports: RadiologyReportDto[];
  onAmend: (report: RadiologyReportDto) => void;
}

export const RadiologyReportingView: React.FC<Props> = ({ reports, onAmend }) => {
  return (
    <Card className="p-5 bg-white border border-gray-200 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-gray-900">Radiology Diagnostic Reports Registry</h3>
          <p className="text-xs text-gray-500">Immutable finalized reports, versions & clinical addenda</p>
        </div>
        <Badge variant="primary">{reports.length} Total Reports</Badge>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b bg-gray-50 text-gray-600 font-bold">
              <th className="py-2.5 px-3">Report #</th>
              <th className="py-2.5 px-3">Patient & MRN</th>
              <th className="py-2.5 px-3">Procedure</th>
              <th className="py-2.5 px-3">Impression</th>
              <th className="py-2.5 px-3">Verifying Radiologist</th>
              <th className="py-2.5 px-3">Status</th>
              <th className="py-2.5 px-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {reports.map((report) => (
              <tr key={report.id} className="hover:bg-gray-50/70 transition">
                <td className="py-2.5 px-3 font-mono font-bold text-purple-700">
                  {report.reportNumber}
                  {report.version > 1 && <span className="text-[10px] text-amber-600 block">v{report.version}</span>}
                </td>
                <td className="py-2.5 px-3 font-semibold text-gray-900">{report.patientName}</td>
                <td className="py-2.5 px-3 text-gray-800">{report.procedureName}</td>
                <td className="py-2.5 px-3 text-gray-700 truncate max-w-sm">{report.impression}</td>
                <td className="py-2.5 px-3 text-gray-600">{report.verifyingRadiologistName || report.reportingRadiologistName}</td>
                <td className="py-2.5 px-3">
                  <Badge variant={report.status === 'FINALIZED' ? 'success' : report.status === 'AMENDED' ? 'warning' : 'primary'}>
                    {report.status}
                  </Badge>
                </td>
                <td className="py-2.5 px-3 text-right">
                  {report.status === 'FINALIZED' && (
                    <Button variant="outline" size="sm" onClick={() => onAmend(report)}>Amend Report</Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
};
