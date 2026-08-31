import React from 'react';
import { Card, Badge } from '@docsearch/ui-kit';
import type { TransfusionReactionDto } from '@docsearch/api-contracts';

interface Props {
  reactions: TransfusionReactionDto[];
}

export const TransfusionReactionView: React.FC<Props> = ({ reactions }) => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-red-900">Hemovigilance & Adverse Transfusion Reaction Vault</h2>
        <p className="text-xs text-gray-500">Statutory investigation of febrile, anaphylactic, TRALI/TACO & hemolytic transfusion events</p>
      </div>

      <Card className="overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-600 border-b border-gray-200">
            <tr>
              <th className="p-3">Report No.</th>
              <th className="p-3">Patient Name / MRN</th>
              <th className="p-3">Component Unit</th>
              <th className="p-3">Severity</th>
              <th className="p-3">Symptoms & Interventions</th>
              <th className="p-3">Lab Investigation (DAT)</th>
              <th className="p-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {reactions.map((r) => (
              <tr key={r.id} className="hover:bg-slate-50 transition">
                <td className="p-3 font-bold text-slate-800">{r.reactionReportCode}</td>
                <td className="p-3 font-semibold text-gray-900">{r.patientName} ({r.patientMrn})</td>
                <td className="p-3 font-mono text-xs text-gray-700">{r.componentCode}</td>
                <td className="p-3">
                  <Badge variant="danger">{r.severity.replace(/_/g, ' ')}</Badge>
                </td>
                <td className="p-3 text-xs text-gray-700 max-w-xs truncate">{r.symptomsObserved}</td>
                <td className="p-3 text-xs text-gray-600">{r.directAntiglobulinTestDAT || 'DAT Pending'}</td>
                <td className="p-3">
                  <Badge variant={r.status === 'CLOSED_RESOLVED' ? 'success' : 'warning'}>
                    {r.status.replace(/_/g, ' ')}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
};
