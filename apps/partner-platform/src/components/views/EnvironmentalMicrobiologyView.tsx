import React from 'react';
import { Card, Badge, Button } from '@docsearch/ui-kit';
import type { EnvironmentalMicroSwabDto } from '@docsearch/api-contracts';

interface Props {
  swabs: EnvironmentalMicroSwabDto[];
  onRecordSwab: () => void;
}

export const EnvironmentalMicrobiologyView: React.FC<Props> = ({ swabs, onRecordSwab }) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Hospital Environmental Microbiology & Sterility Vault</h2>
          <p className="text-xs text-gray-500">Operation theatre air settle plates, dialysis RO water endotoxin, and CSSD spore indicators</p>
        </div>
        <Button variant="primary" onClick={onRecordSwab}>+ Record Micro Swab</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {swabs.map((swab) => (
          <Card key={swab.id} className="p-4 space-y-3">
            <div className="flex items-center justify-between border-b pb-2">
              <span className="text-xs font-bold text-gray-900">{swab.sampleNumber}</span>
              <Badge variant={swab.resultStatus === 'SATISFACTORY_PASS' ? 'success' : 'danger'}>
                {swab.resultStatus}
              </Badge>
            </div>
            <div>
              <p className="text-sm font-bold text-gray-800">{swab.locationDescription}</p>
              <p className="text-xs text-gray-500">{swab.sampleType}</p>
            </div>
            <div className="p-2 bg-gray-50 rounded-lg text-xs space-y-1">
              <p><strong>CFU Count:</strong> {swab.cfuCountPerPlateOrMl} (Threshold: {swab.permissibleThreshold})</p>
              <p><strong>Pathogens:</strong> {swab.pathogensFound}</p>
              <p className="text-gray-500">Collected by {swab.collectedBy} on {swab.collectionDate}</p>
            </div>
            <div className="flex justify-between text-xs text-gray-500 pt-2 border-t">
              <span>Sign-off: {swab.microbiologistSignOff}</span>
              {swab.correctiveFoggingDone && <Badge variant="warning">Fogging Done</Badge>}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
