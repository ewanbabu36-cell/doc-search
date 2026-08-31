import React from 'react';
import { Card, Badge, Button } from '@docsearch/ui-kit';
import type { RpmVitalBreachAlertDto } from '@docsearch/api-contracts';

interface Props {
  alerts: RpmVitalBreachAlertDto[];
  onAcknowledge: (alert: RpmVitalBreachAlertDto) => void;
}

export const VitalBreachEscalationView: React.FC<Props> = ({ alerts, onAcknowledge }) => {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-bold text-gray-900">Out-of-Range Vital Breach Escalation Matrix</h2>
        <p className="text-xs text-gray-500">Real-time alert dispatch to on-call triage nurses and primary consulting physicians</p>
      </div>

      <div className="space-y-3">
        {alerts.map((a) => (
          <Card key={a.id} className="p-4 space-y-2 text-xs">
            <div className="flex justify-between items-center border-b pb-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-red-700">{a.patientName} (MRN: {a.patientMrn})</span>
                <Badge variant={a.severity === 'CRITICAL_RED_ALERT' ? 'danger' : 'warning'}>{a.vitalParameter}: {a.measuredValue}</Badge>
                <Badge variant="neutral">{a.careProgram}</Badge>
              </div>
              <span className="text-gray-500">{a.alertTimestamp.replace('T', ' ').substring(11, 16)}</span>
            </div>
            <p className="text-gray-800 font-semibold">⚠️ Threshold Rule: {a.thresholdRule}</p>
            <div className="flex justify-between items-center pt-2 border-t">
              <span className="text-gray-600">Assigned Clinician: <strong>{a.assignedClinician}</strong> | Status: {a.status}</span>
              {a.status === 'UNACKNOWLEDGED_URGENT' ? (
                <Button variant="danger" size="sm" onClick={() => onAcknowledge(a)}>Acknowledge & Escalate</Button>
              ) : (
                <span className="text-emerald-700 font-semibold">✓ Action Recorded: {a.resolutionNotes}</span>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
