import React from 'react';
import { Card, Table, Badge, Button } from '@docsearch/ui-kit';
import type { SurgicalConsentDto, SurgeryRequestDto } from '@docsearch/api-contracts';

interface Props {
  consents: SurgicalConsentDto[];
  requests: SurgeryRequestDto[];
  onExecuteConsent: (request: SurgeryRequestDto) => void;
}

export const SurgicalConsentView: React.FC<Props> = ({
  consents,
  requests,
  onExecuteConsent
}) => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Surgical & Informed Consents</h1>
          <p className="text-sm text-gray-500">Legal consent verification, procedure authorizations, and high-risk disclosures</p>
        </div>
      </div>

      <Card className="p-4">
        <h2 className="text-base font-bold text-gray-900 mb-3">Pending Consent Sign-offs</h2>
        <div className="space-y-2">
          {requests.map(r => (
            <div key={r.id} className="flex justify-between items-center p-3 rounded-lg border bg-gray-50">
              <div>
                <p className="font-bold text-gray-900">{r.patientName} ({r.patientMrn})</p>
                <p className="text-xs text-gray-500">{r.procedureName} • {r.primarySurgeonName}</p>
              </div>
              <Button variant="outline" onClick={() => onExecuteConsent(r)}>Sign Informed Consent</Button>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-4">
        <h2 className="text-base font-bold text-gray-900 mb-3">Executed Consents Vault</h2>
        <Table>
          <thead>
            <tr className="text-left text-xs font-semibold text-gray-500 border-b">
              <th className="py-2">Consent #</th>
              <th className="py-2">Patient</th>
              <th className="py-2">Signee</th>
              <th className="py-2">Counselled By</th>
              <th className="py-2">Witness</th>
              <th className="py-2">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y text-sm">
            {consents.map(c => (
              <tr key={c.id}>
                <td className="py-2 font-bold text-gray-900">{c.consentNumber}</td>
                <td className="py-2">{c.patientName}</td>
                <td className="py-2">{c.consentingPersonName} ({c.relationshipToPatient})</td>
                <td className="py-2">{c.counselledByDoctor}</td>
                <td className="py-2 text-gray-500">{c.witnessName}</td>
                <td className="py-2"><Badge variant="success">{c.status}</Badge></td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Card>
    </div>
  );
};
