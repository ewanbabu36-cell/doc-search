import React from 'react';
import { Card, Badge, Button } from '@docsearch/ui-kit';
import type { AbdmCareContextDto } from '@docsearch/api-contracts';

interface Props {
  contexts: AbdmCareContextDto[];
  onLinkContext: () => void;
}

export const CareContextLinkageView: React.FC<Props> = ({ contexts, onLinkContext }) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Health Information Provider (HIP) Care-Context Registry</h2>
          <p className="text-xs text-gray-500">Discoverable patient clinical episodes mapped to national ABHA addresses</p>
        </div>
        <Button variant="primary" onClick={onLinkContext}>🔗 Link New Care Context</Button>
      </div>

      <div className="space-y-3">
        {contexts.map((c) => (
          <Card key={c.id} className="p-4 space-y-2 text-xs">
            <div className="flex justify-between items-center border-b pb-2">
              <div className="flex items-center gap-2">
                <span className="font-bold text-gray-900">{c.displayTitle}</span>
                <Badge variant="primary">{c.careContextType}</Badge>
              </div>
              <span className="font-mono text-indigo-700 font-bold">{c.careContextReference}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Patient: <strong>{c.patientName}</strong> ({c.patientMrn}) | ABHA: <strong>{c.abhaAddress}</strong></span>
              <span>Encounter Date: {c.encounterDate}</span>
            </div>
            <div className="flex justify-between text-gray-500 pt-1">
              <span>Attending: {c.doctorName} ({c.departmentName})</span>
              <span className="text-emerald-700 font-semibold">✓ ABDM Gateway Linked</span>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
