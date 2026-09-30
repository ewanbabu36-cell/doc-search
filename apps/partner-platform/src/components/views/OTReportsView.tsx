import React from 'react';
import { Card, Button } from '@docsearch/ui-kit';

export const OTReportsView: React.FC = () => {
  const reports = [
    { title: 'Daily Operation Theatre Register', desc: 'Complete log of surgeries performed, surgeon teams, and timing timestamps' },
    { title: 'WHO Surgical Safety Compliance Report', desc: '100% audit checklist compliance rates across all surgical departments' },
    { title: 'Implant & Prosthesis Passport Ledger', desc: 'UDI barcode tracking and batch numbers for patient implant tracking' },
    { title: 'OT Utilization & Idle Time Summary', desc: 'Breakdown of booked vs knife-to-skin hours per operating suite' },
    { title: 'PACU Aldrete Recovery & Stepdown Report', desc: 'Average recovery durations and discharge readiness scores' }
  ];

  const handleExport = (reportTitle: string) => {
    const csvContent = 'data:text/csv;charset=utf-8,Report,Timestamp,Department,ComplianceStatus\n' +
      `"${reportTitle}",${new Date().toISOString()},Operating Theatre Suite,Verified (100%)\n`;
    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csvContent));
    link.setAttribute('download', `${reportTitle.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">OT Reports & Clinical Audits</h1>
        <p className="text-sm text-gray-500">Statutory surgical registers, quality assurance summaries, and implant logs</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {reports.map((r) => (
          <Card key={r.title} className="p-5 flex flex-col justify-between space-y-3">
            <div>
              <h2 className="font-bold text-base text-gray-900">{r.title}</h2>
              <p className="text-xs text-gray-500 mt-1">{r.desc}</p>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => window.print()}>🖨️ Print</Button>
              <Button variant="primary" size="sm" onClick={() => handleExport(r.title)}>📥 Export CSV</Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
