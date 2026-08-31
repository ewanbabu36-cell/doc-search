import React from 'react';
import { Card, Badge, Button } from '@docsearch/ui-kit';
import type { SafetyTestRecordDto } from '@docsearch/api-contracts';

interface Props {
  records: SafetyTestRecordDto[];
  onRecordSafetyTest: () => void;
}

export const ElectricalSafetyTestingView: React.FC<Props> = ({ records, onRecordSafetyTest }) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Electrical & Radiation Safety Compliance (IEC 62353 / AERB)</h2>
          <p className="text-xs text-gray-500">Earth ground continuity, chassis leakage, patient applied parts leakage testing</p>
        </div>
        <Button variant="primary" onClick={onRecordSafetyTest}>+ Log Safety Test</Button>
      </div>

      <div className="space-y-3">
        {records.map((rec) => (
          <Card key={rec.id} className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-gray-900">{rec.testCode}</span>
                <Badge variant={rec.testPassed ? 'success' : 'danger'}>
                  {rec.testPassed ? 'PASSED & CERTIFIED' : 'FAILED SAFETY'}
                </Badge>
                <span className="text-xs text-gray-500">{rec.testStandard}</span>
              </div>
              <p className="text-sm font-bold text-gray-800">{rec.assetName} ({rec.assetCode})</p>
              <div className="flex items-center gap-4 text-xs text-gray-600">
                <span>Earth: <strong>{rec.earthResistanceOhms} Ω</strong></span>
                <span>Chassis Leakage: <strong>{rec.chassisLeakageMicroAmps} µA</strong></span>
                <span>Patient Leakage: <strong>{rec.patientLeakageMicroAmps} µA</strong></span>
                <span>Insulation: <strong>{rec.insulationResistanceMOhm} MΩ</strong></span>
              </div>
              <p className="text-xs text-gray-500">Tested by {rec.testedByEngineer} on {rec.testDate}</p>
            </div>
            <div className="text-right text-xs">
              <p className="text-gray-500 italic max-w-xs">{rec.remarks}</p>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
