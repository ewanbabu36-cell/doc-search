import React from 'react';
import { Card, Badge } from '@docsearch/ui-kit';
import type { BloodTestRecordDto } from '@docsearch/api-contracts';

interface Props {
  tests: BloodTestRecordDto[];
}

export const BloodTestingView: React.FC<Props> = ({ tests }) => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Immunohematology & Serological Testing Laboratory</h2>
        <p className="text-xs text-gray-500">ABO/Rh validation, antibody screens & mandatory 5-panel infectious disease markers</p>
      </div>

      <Card className="overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-600 border-b border-gray-200">
            <tr>
              <th className="p-3">Test Code</th>
              <th className="p-3">Unit Barcode</th>
              <th className="p-3">ABO / Rh</th>
              <th className="p-3">Antibody Screen</th>
              <th className="p-3">TTI Screen (HIV/HBV/HCV/VDRL)</th>
              <th className="p-3">Pathologist Sign-off</th>
              <th className="p-3">Release Decision</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {tests.map((t) => (
              <tr key={t.id} className="hover:bg-slate-50 transition">
                <td className="p-3 font-bold text-slate-800">{t.testCode}</td>
                <td className="p-3 font-mono text-xs text-gray-700">{t.unitBarcode}</td>
                <td className="p-3 font-bold text-red-600">{t.aboGroupingResult} {t.rhFactorResult}</td>
                <td className="p-3 text-xs">{t.antibodyScreen}</td>
                <td className="p-3 text-xs text-gray-600">
                  HIV: {t.hivResult} • HBsAg: {t.hBsAgResult} • HCV: {t.hcvResult} • VDRL: {t.syphilisVDRLResult}
                </td>
                <td className="p-3 text-xs font-medium text-gray-800">{t.pathologistSignOffName}</td>
                <td className="p-3">
                  <Badge variant={t.isPassedForRelease ? 'success' : 'danger'}>
                    {t.isPassedForRelease ? 'PASSED FOR RELEASE' : 'FAILED / DISCARD'}
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
