import React from 'react';
import { Card, Badge, Button } from '@docsearch/ui-kit';
import type { FhirBundleRecordDto } from '@docsearch/api-contracts';

interface Props {
  bundles: FhirBundleRecordDto[];
  onGenerateBundle: () => void;
}

export const FhirR4BundleViewer: React.FC<Props> = ({ bundles, onGenerateBundle }) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900">HL7 FHIR R4 Bundles & Digital Signatures (Milestone 3)</h2>
          <p className="text-xs text-gray-500">Validated NRCeS FHIR JSON profiles for digital prescriptions, diagnostic reports, and discharge summaries</p>
        </div>
        <Button variant="primary" onClick={onGenerateBundle}>📦 Generate & Sign FHIR Bundle</Button>
      </div>

      <div className="space-y-4">
        {bundles.map((b) => (
          <Card key={b.id} className="p-4 space-y-3">
            <div className="flex justify-between items-center border-b pb-2">
              <div>
                <span className="text-sm font-bold text-purple-900">{b.bundleId}</span>
                <span className="text-xs text-gray-500 block">Care Context: {b.careContextRef} | Author: {b.authorPractitionerName} ({b.authorPractitionerHprId})</span>
              </div>
              <Badge variant="success">{b.validationStatus}</Badge>
            </div>
            <div className="bg-slate-950 text-emerald-400 font-mono text-[11px] p-3 rounded-lg overflow-x-auto max-h-48">
              <pre>{b.fhirJsonPayload}</pre>
            </div>
            <div className="flex justify-between items-center text-xs text-gray-500 pt-1">
              <span className="font-mono text-[11px] truncate max-w-sm" title={b.digitalSignatureHash}>e-Sign Hash: {b.digitalSignatureHash.substring(0, 24)}...</span>
              <span>Facility: {b.facilityHfrId} | {b.createdAt.substring(0, 10)}</span>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
