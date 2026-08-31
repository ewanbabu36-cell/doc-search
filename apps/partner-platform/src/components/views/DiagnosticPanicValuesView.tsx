import React from 'react';
import { Card, Badge, Button } from '@docsearch/ui-kit';
import type { DiagnosticPanicValueAlertDto } from '@docsearch/api-contracts';

interface Props {
  panicValues: DiagnosticPanicValueAlertDto[];
  onAcknowledge: (p: DiagnosticPanicValueAlertDto) => void;
}

export const DiagnosticPanicValuesView: React.FC<Props> = ({ panicValues, onAcknowledge }) => {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-bold text-gray-900">Critical Laboratory & Radiology Diagnostic Panic Values</h2>
        <p className="text-xs text-gray-500">Life-threatening laboratory panic levels and emergency radiology findings requiring immediate escalation</p>
      </div>

      <div className="space-y-3">
        {panicValues.map((p) => (
          <Card key={p.id} className="p-4 space-y-2 text-xs">
            <div className="flex justify-between items-center border-b pb-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-red-700">{p.testName}: {p.measuredValue}</span>
                <Badge variant="danger">{p.urgencyLevel}</Badge>
                <Badge variant="neutral">{p.category}</Badge>
              </div>
              <span className="text-gray-500">{p.location}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Patient: <strong>{p.patientName}</strong> (MRN: {p.patientMrn})</span>
              <span>Normal Range: {p.referenceNormalRange} | Panic Threshold: {p.panicThreshold}</span>
            </div>
            <p className="text-gray-800 font-semibold">⚠️ Clinical Risk: {p.clinicalRiskSummary}</p>
            <div className="flex justify-between items-center pt-2 border-t">
              <span className="text-gray-500">Escalated to: <strong>{p.doctorName}</strong> at {p.alertTimestamp.replace('T', ' ').substring(11, 16)}</span>
              {!p.acknowledgementTimestamp ? (
                <Button variant="danger" size="sm" onClick={() => onAcknowledge(p)}>Acknowledge & Document Action</Button>
              ) : (
                <span className="text-emerald-700 font-semibold">✓ Acknowledged</span>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
