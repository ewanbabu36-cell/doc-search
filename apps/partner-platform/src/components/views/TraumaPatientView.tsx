import React from 'react';
import { Card, Badge, Button } from '@docsearch/ui-kit';
import type { TraumaActivationDto } from '@docsearch/api-contracts';

interface Props {
  trauma: TraumaActivationDto | null;
  onBack: () => void;
  onRecordSecondary: (trauma: TraumaActivationDto) => void;
}

export const TraumaPatientView: React.FC<Props> = ({ trauma, onBack, onRecordSecondary }) => {
  if (!trauma) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Button variant="outline" onClick={onBack}>← Back to Trauma Command</Button>
          <h1 className="text-2xl font-bold text-gray-900 mt-2">{trauma.activationNumber} — {trauma.patientName}</h1>
        </div>
        <Button variant="primary" onClick={() => onRecordSecondary(trauma)}>Record Secondary Survey</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-5 space-y-3">
          <h2 className="text-lg font-bold text-gray-900">Primary Survey (ABCDE)</h2>
          <div className="space-y-2 text-sm">
            <div><span className="text-gray-500">Airway:</span> <p className="font-semibold text-gray-900">{trauma.airwayStatus}</p></div>
            <div><span className="text-gray-500">Breathing:</span> <p className="font-semibold text-gray-900">{trauma.breathingStatus}</p></div>
            <div><span className="text-gray-500">Circulation:</span> <p className="font-semibold text-gray-900">{trauma.circulationStatus}</p></div>
            <div><span className="text-gray-500">Disability GCS:</span> <p className="font-bold text-red-600">{trauma.disabilityGcs}/15</p></div>
            <div><span className="text-gray-500">Exposure Findings:</span> <p className="text-gray-900">{trauma.exposureFindings}</p></div>
          </div>
        </Card>

        <Card className="p-5 space-y-3">
          <h2 className="text-lg font-bold text-gray-900">Trauma Team & Resuscitation</h2>
          <div className="space-y-2 text-sm">
            <div><span className="text-gray-500">Team Leader:</span> <p className="font-semibold text-gray-900">{trauma.traumaTeamLeader}</p></div>
            <div><span className="text-gray-500">Mechanism:</span> <p className="text-gray-900">{trauma.mechanismOfInjury}</p></div>
            <div><span className="text-gray-500">MTP Protocol:</span> <Badge variant={trauma.massiveTransfusionActivated ? 'danger' : 'neutral'}>{trauma.massiveTransfusionActivated ? 'Active' : 'No'}</Badge></div>
            <div><span className="text-gray-500">FAST Ultrasound:</span> <Badge variant={trauma.fastScanPositive ? 'warning' : 'success'}>{trauma.fastScanPositive ? 'Positive' : 'Negative'}</Badge></div>
          </div>
        </Card>
      </div>
    </div>
  );
};
