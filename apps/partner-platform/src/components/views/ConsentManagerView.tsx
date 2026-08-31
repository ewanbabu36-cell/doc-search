import React from 'react';
import { Card, Badge, Button } from '@docsearch/ui-kit';
import type { AbdmConsentArtefactDto } from '@docsearch/api-contracts';

interface Props {
  consents: AbdmConsentArtefactDto[];
  onCreateConsent: () => void;
}

export const ConsentManagerView: React.FC<Props> = ({ consents, onCreateConsent }) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900">ABDM Consent Manager & Artefacts (HIU / HIP Gateway)</h2>
          <p className="text-xs text-gray-500">Time-bound patient electronic consent permissions for health data sharing</p>
        </div>
        <Button variant="primary" onClick={onCreateConsent}>🛡️ Request HIU Consent</Button>
      </div>

      <div className="space-y-3">
        {consents.map((cs) => (
          <Card key={cs.id} className="p-4 space-y-2 text-xs">
            <div className="flex justify-between items-center border-b pb-2">
              <div>
                <span className="font-bold text-gray-900">{cs.requesterHipOrHiu}</span>
                <span className="text-xs text-gray-500 block font-mono">Artefact ID: {cs.artefactId}</span>
              </div>
              <Badge variant="success">{cs.status}</Badge>
            </div>
            <div className="text-gray-700 space-y-1">
              <p>Patient ABHA: <strong className="text-indigo-900">{cs.patientAbhaAddress}</strong> | Purpose: <Badge variant="neutral">{cs.purposeCode}</Badge> {cs.purposeDescription}</p>
              <p className="text-gray-500">Validity: {cs.dateFrom} to {cs.dateTo} | Auto-Erase Date: {cs.dataEraseDate}</p>
              <p className="text-blue-900 font-medium">Linked Contexts: {cs.linkedCareContextRefs.join(', ')}</p>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
