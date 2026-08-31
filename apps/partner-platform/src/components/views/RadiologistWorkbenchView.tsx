import React from 'react';
import { Card, Button, Badge } from '@docsearch/ui-kit';
import type { RadiologyStudyDto, RadiologyReportDto } from '@docsearch/api-contracts';

interface Props {
  studies: RadiologyStudyDto[];
  reports: RadiologyReportDto[];
  onOpenDraftReport: (study: RadiologyStudyDto) => void;
  onFinalizeReport: (report: RadiologyReportDto) => void;
  onFlagCritical: (report: RadiologyReportDto) => void;
}

export const RadiologistWorkbenchView: React.FC<Props> = ({
  studies,
  reports,
  onOpenDraftReport,
  onFinalizeReport,
  onFlagCritical
}) => {
  const unreadStudies = studies.filter((s) => s.status === 'ACQUIRED' || s.status === 'REPORTING_IN_PROGRESS');
  const draftReports = reports.filter((r) => r.status === 'DRAFT' || r.status === 'DICTATED');

  return (
    <div className="space-y-6">
      <Card className="p-5 bg-white border border-gray-200 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-gray-900">Radiologist Diagnostic Reading Queue</h3>
            <p className="text-xs text-gray-500">Unread studies awaiting interpretation and dictation</p>
          </div>
          <Badge variant="danger">{unreadStudies.length} Awaiting Reading</Badge>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b bg-gray-50 text-gray-600 font-bold">
                <th className="py-2.5 px-3">Accession</th>
                <th className="py-2.5 px-3">Patient Name</th>
                <th className="py-2.5 px-3">Study Description</th>
                <th className="py-2.5 px-3">Modality</th>
                <th className="py-2.5 px-3">Scan Time</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {unreadStudies.map((study) => (
                <tr key={study.id} className="hover:bg-gray-50/70 transition">
                  <td className="py-2.5 px-3 font-mono font-bold text-blue-700">{study.accessionNumber}</td>
                  <td className="py-2.5 px-3 font-semibold text-gray-900">{study.patientName}</td>
                  <td className="py-2.5 px-3 text-gray-800">{study.studyDescription}</td>
                  <td className="py-2.5 px-3 font-semibold">{study.modalityType.split('_')[0]}</td>
                  <td className="py-2.5 px-3 text-gray-500">{new Date(study.studyDateTime).toLocaleTimeString()}</td>
                  <td className="py-2.5 px-3 text-right space-x-2">
                    <a
                      href={study.pacsViewerUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded font-semibold text-xs transition"
                    >
                      View DICOM ↗
                    </a>
                    <Button variant="primary" size="sm" onClick={() => onOpenDraftReport(study)}>Open Reporting Studio</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card className="p-5 bg-white border border-gray-200 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-gray-900">Draft / Dictated Reports Awaiting Sign-Off</h3>
            <p className="text-xs text-gray-500">Peer verification & electronic signature queue</p>
          </div>
          <Badge variant="warning">{draftReports.length} Draft Reports</Badge>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b bg-gray-50 text-gray-600 font-bold">
                <th className="py-2.5 px-3">Report #</th>
                <th className="py-2.5 px-3">Patient</th>
                <th className="py-2.5 px-3">Impression</th>
                <th className="py-2.5 px-3">Radiologist</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {draftReports.map((report) => (
                <tr key={report.id} className="hover:bg-gray-50/70 transition">
                  <td className="py-2.5 px-3 font-mono font-bold text-purple-700">{report.reportNumber}</td>
                  <td className="py-2.5 px-3 font-semibold text-gray-900">{report.patientName}</td>
                  <td className="py-2.5 px-3 text-gray-700 truncate max-w-xs">{report.impression}</td>
                  <td className="py-2.5 px-3 text-gray-600">{report.reportingRadiologistName}</td>
                  <td className="py-2.5 px-3 text-right space-x-2">
                    <Button variant="danger" size="sm" onClick={() => onFlagCritical(report)}>Flag Critical</Button>
                    <Button variant="primary" size="sm" onClick={() => onFinalizeReport(report)}>Sign &amp; Finalize</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
