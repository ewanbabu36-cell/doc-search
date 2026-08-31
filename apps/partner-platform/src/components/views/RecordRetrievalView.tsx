import React from 'react';
import { Card, Badge } from '@docsearch/ui-kit';
import type { MedicalRecordIndexDto } from '@docsearch/api-contracts';

interface Props {
  records: MedicalRecordIndexDto[];
}

export const RecordRetrievalView: React.FC<Props> = ({ records }) => {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-bold text-gray-900">Physical Chart Movement & Tracking</h2>
        <p className="text-xs text-gray-500">Real-time custody tracking of physical medical record charts</p>
      </div>

      <Card className="p-5">
        <div className="space-y-3">
          {records.map((r) => (
            <div key={r.id} className="p-3 bg-slate-50 border rounded-lg flex items-center justify-between text-xs">
              <div>
                <span className="font-bold text-blue-600">{r.recordNumber}</span>
                <span className="font-semibold text-gray-900 ml-2">{r.patientName}</span>
                <div className="text-[10px] text-gray-500 mt-1">Location: {r.physicalShelfNumber || 'Central Vault'}</div>
              </div>
              <Badge variant="success">IN VAULT</Badge>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};
