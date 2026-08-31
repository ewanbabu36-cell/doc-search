import React from 'react';
import { Card, Badge, Button } from '@docsearch/ui-kit';
import type { HealthDocumentDispatchDto } from '@docsearch/api-contracts';

interface Props {
  dispatches: HealthDocumentDispatchDto[];
  onDispatchNew: () => void;
}

export const AutomatedDocumentDeliveryView: React.FC<Props> = ({ dispatches, onDispatchNew }) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Automated WhatsApp Health Document Delivery Engine</h2>
          <p className="text-xs text-gray-500">Instant PDF dispatch for prescriptions, diagnostic lab reports, and signed discharge summaries</p>
        </div>
        <Button variant="primary" onClick={onDispatchNew}>📄 Dispatch Document</Button>
      </div>

      <div className="space-y-3">
        {dispatches.map((d) => (
          <Card key={d.id} className="p-4 space-y-2 text-xs">
            <div className="flex justify-between items-center border-b pb-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-gray-900">{d.fileName}</span>
                <Badge variant="success">{d.documentType}</Badge>
                <Badge variant="neutral">{d.dispatchChannel}</Badge>
              </div>
              <span className="text-gray-500 font-mono">{d.documentNumber}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Patient: <strong>{d.patientName}</strong> ({d.phoneNumber})</span>
              <span>File Size: {d.fileSizeKb} KB</span>
              <span>Status: <strong className="text-emerald-700">{d.deliveryStatus}</strong></span>
              <span>Dispatched: {d.dispatchedAt.replace('T', ' ').substring(0, 16)}</span>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
