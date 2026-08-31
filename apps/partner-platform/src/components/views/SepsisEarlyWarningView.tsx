import React from 'react';
import { Card, Badge, Button } from '@docsearch/ui-kit';
import type { SepsisNews2AlertDto } from '@docsearch/api-contracts';

interface Props {
  alerts: SepsisNews2AlertDto[];
  onAcknowledge: (alert: SepsisNews2AlertDto) => void;
}

export const SepsisEarlyWarningView: React.FC<Props> = ({ alerts, onAcknowledge }) => {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-bold text-gray-900">Sepsis Early Warning & Surviving Sepsis 1-Hour Bundle</h2>
        <p className="text-xs text-gray-500">Automated NEWS2 and qSOFA scoring from telemetry monitors and laboratory lactates</p>
      </div>

      <div className="space-y-4">
        {alerts.map((a) => (
          <Card key={a.id} className="p-4 space-y-3">
            <div className="flex justify-between items-center border-b pb-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-gray-900">{a.patientName} (MRN: {a.patientMrn})</span>
                <Badge variant={a.news2Score >= 7 ? 'danger' : 'warning'}>NEWS2 Score: {a.news2Score}</Badge>
                <Badge variant="neutral">qSOFA: {a.qsofaScore}/3</Badge>
              </div>
              <span className="text-xs text-gray-500">{a.bedNumber} — {a.wardName}</span>
            </div>

            <div className="grid grid-cols-6 gap-2 text-xs text-center">
              <div className="p-2 bg-gray-50 rounded">
                <span className="text-gray-500 block">Resp Rate</span>
                <span className="font-bold text-gray-900">{a.respiratoryRate} /min</span>
              </div>
              <div className="p-2 bg-gray-50 rounded">
                <span className="text-gray-500 block">SpO2</span>
                <span className="font-bold text-gray-900">{a.spO2Pct}% {a.requiresSupplementalO2 && '(On O2)'}</span>
              </div>
              <div className="p-2 bg-gray-50 rounded">
                <span className="text-gray-500 block">Systolic BP</span>
                <span className="font-bold text-gray-900">{a.systolicBp} mmHg</span>
              </div>
              <div className="p-2 bg-gray-50 rounded">
                <span className="text-gray-500 block">Pulse Rate</span>
                <span className="font-bold text-gray-900">{a.pulseRate} bpm</span>
              </div>
              <div className="p-2 bg-gray-50 rounded">
                <span className="text-gray-500 block">Temp</span>
                <span className="font-bold text-gray-900">{a.temperatureCelsius}°C</span>
              </div>
              <div className="p-2 bg-red-50 rounded">
                <span className="text-red-700 block">Serum Lactate</span>
                <span className="font-bold text-red-900">{a.serumLactateMmolL} mmol/L</span>
              </div>
            </div>

            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs flex justify-between items-center">
              <div>
                <span className="font-bold text-blue-950 block">1-Hour Sepsis Bundle Execution:</span>
                <span className="text-blue-900">
                  Cultures: {a.bundleChecklist.bloodCulturesOrdered ? '✓ Ordered' : '✗ Pending'} | 
                  Lactate: {a.bundleChecklist.lactateMeasured ? '✓ Measured' : '✗ Pending'} | 
                  IV Antibiotics: {a.bundleChecklist.ivAntibioticsGiven ? '✓ Administered' : '✗ Pending'} | 
                  Fluids: {a.bundleChecklist.ivFluidsAdministered ? '✓ Infusing' : '✗ Pending'}
                </span>
              </div>
              {a.alertStatus === 'TRIGGERED_ACTIVE' && (
                <Button variant="danger" size="sm" onClick={() => onAcknowledge(a)}>Acknowledge & Deploy RRT</Button>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
