import React from 'react';
import { Card, Button, Badge } from '@docsearch/ui-kit';
import type { ClinicalDocumentationQueryDto } from '@docsearch/api-contracts';

interface Props {
  queries: ClinicalDocumentationQueryDto[];
  onOpenResolveDialog: (query: ClinicalDocumentationQueryDto) => void;
}

export const ClinicalQueryWorkbenchView: React.FC<Props> = ({ queries, onOpenResolveDialog }) => {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-bold text-gray-900">Clinical Documentation Queries (CDI)</h2>
        <p className="text-xs text-gray-500">Coder-to-physician clarification communication for diagnosis specificity</p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {queries.map((q) => (
          <Card key={q.id} className="p-4 border-l-4 border-blue-500 bg-white space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-bold text-blue-700">{q.queryNumber}</span>
                <span className="font-bold text-gray-900 ml-2">{q.queryTitle}</span>
              </div>
              <Badge variant={q.status === 'RESOLVED' ? 'success' : 'warning'}>{q.status}</Badge>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-slate-50 rounded border">
                <div className="font-semibold text-gray-700 mb-1">Coder Query Details:</div>
                <p className="text-gray-600">{q.clinicalReason}</p>
                <div className="text-[10px] text-gray-400 mt-2">Initiated by: {q.initiatedByCoder} → To: {q.assignedDoctorName}</div>
              </div>
              <div className="p-3 bg-blue-50 rounded border border-blue-200">
                <div className="font-semibold text-blue-900 mb-1">Physician Clarification:</div>
                <p className="text-blue-800">{q.clinicianClarificationResponse || 'Awaiting physician clarification...'}</p>
                {q.status !== 'RESOLVED' && (
                  <div className="mt-3 text-right">
                    <Button size="sm" variant="primary" onClick={() => onOpenResolveDialog(q)}>Respond as Doctor</Button>
                  </div>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
