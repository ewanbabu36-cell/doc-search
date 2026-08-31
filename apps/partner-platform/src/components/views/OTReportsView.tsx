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
            <div className="flex justify-end">
              <Button variant="outline">Generate Export (PDF/CSV)</Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
