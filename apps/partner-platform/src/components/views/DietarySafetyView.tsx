import React from 'react';
import { Card, Button, Badge } from '@docsearch/ui-kit';
import type { DietarySafetyAlertDto } from '@docsearch/api-contracts';

interface Props {
  safetyAlerts: DietarySafetyAlertDto[];
  onResolveAlert: (alert: DietarySafetyAlertDto) => void;
}

export const DietarySafetyView: React.FC<Props> = ({ safetyAlerts, onResolveAlert }) => {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Food Allergies & Dietary Safety Alerts</h1>
        <p className="text-xs text-gray-500">Real-time allergen conflict detection, NPO order violations, texture mismatch hazard alerts</p>
      </div>

      <div className="space-y-3">
        {safetyAlerts.map((al) => (
          <Card key={al.id} className="p-5 space-y-3 border-l-4 border-l-red-500">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-gray-900">{al.alertCode} — {al.patientName} ({al.patientMrn})</h3>
                <p className="text-xs text-gray-500">{al.wardBed} | Alert Type: <strong>{al.alertType}</strong></p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="danger">{al.severity}</Badge>
                <Badge variant={al.isResolved ? 'primary' : 'neutral'}>{al.isResolved ? 'RESOLVED' : 'ACTIVE'}</Badge>
              </div>
            </div>
            <p className="text-xs text-red-700 font-medium">{al.description}</p>
            {al.isResolved ? (
              <div className="p-2.5 bg-green-50 rounded-lg text-xs text-green-800">
                <p>Resolved by <strong>{al.resolvedBy}</strong>: {al.resolutionNotes}</p>
              </div>
            ) : (
              <div className="flex justify-end pt-2">
                <Button variant="primary" size="sm" onClick={() => onResolveAlert(al)}>Resolve Alert</Button>
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
};
