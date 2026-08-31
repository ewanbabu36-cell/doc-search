import React from 'react';
import { Card, Badge } from '@docsearch/ui-kit';
import type { RadiologyPreparationRecordDto } from '@docsearch/api-contracts';

interface Props {
  records: RadiologyPreparationRecordDto[];
}

export const RadiologyPreparationView: React.FC<Props> = ({ records }) => {
  return (
    <Card className="p-5 bg-white border border-gray-200 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-gray-900">Pre-Procedure Safety & Screening Registry</h3>
          <p className="text-xs text-gray-500">MRI metal clearance, pregnancy confirmation, and eGFR adequacy checks</p>
        </div>
        <Badge variant="primary">{records.length} Checklists</Badge>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b bg-gray-50 text-gray-600 font-bold">
              <th className="py-2.5 px-3">Prep Code</th>
              <th className="py-2.5 px-3">Patient Name</th>
              <th className="py-2.5 px-3">Fasting</th>
              <th className="py-2.5 px-3">MRI Clearance</th>
              <th className="py-2.5 px-3">Pregnancy</th>
              <th className="py-2.5 px-3">eGFR</th>
              <th className="py-2.5 px-3">Nurse</th>
              <th className="py-2.5 px-3 text-right">Result</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {records.map((prep) => (
              <tr key={prep.id} className="hover:bg-gray-50/70 transition">
                <td className="py-2.5 px-3 font-mono font-bold text-blue-700">{prep.preparationCode}</td>
                <td className="py-2.5 px-3 font-semibold text-gray-900">{prep.patientName}</td>
                <td className="py-2.5 px-3">{prep.fastingConfirmed ? '✓' : '✗'}</td>
                <td className="py-2.5 px-3">{prep.mriMetalScreeningCleared ? '✓' : '✗'}</td>
                <td className="py-2.5 px-3">{prep.pregnancyStatusConfirmedNegative ? '✓' : '✗'}</td>
                <td className="py-2.5 px-3">{prep.renalEgfrAdequate ? '✓' : '✗'}</td>
                <td className="py-2.5 px-3 text-gray-700">{prep.preparationNurseName}</td>
                <td className="py-2.5 px-3 text-right">
                  <Badge variant={prep.isReadyForScan ? 'success' : 'danger'}>
                    {prep.isReadyForScan ? 'CLEARED' : 'DEFERRED'}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
};
