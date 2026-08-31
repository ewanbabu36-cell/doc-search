import React from 'react';
import { Card } from '@docsearch/ui-kit';
import type { QualityAuditTraceDto } from '@docsearch/api-contracts';

interface Props {
  traces: QualityAuditTraceDto[];
}

export const QualityAuditVaultView: React.FC<Props> = ({ traces }) => {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-bold text-gray-900">Hospital Quality & Infection Control Cryptographic Audit Vault</h2>
        <p className="text-xs text-gray-500">Immutable append-only ledger with SHA-256 integrity signatures for all quality transactions</p>
      </div>

      <Card className="overflow-hidden">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="bg-gray-100 border-b font-semibold text-gray-700">
            <tr>
              <th className="p-3">Trace #</th>
              <th className="p-3">Action</th>
              <th className="p-3">Entity</th>
              <th className="p-3">Actor & Role</th>
              <th className="p-3">Justification</th>
              <th className="p-3">Integrity Hash</th>
              <th className="p-3">Timestamp</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {traces.map((t) => (
              <tr key={t.id} className="hover:bg-gray-50 font-mono text-[11px]">
                <td className="p-3 font-bold text-blue-700">{t.traceNumber}</td>
                <td className="p-3 font-semibold text-gray-800">{t.action}</td>
                <td className="p-3 text-gray-600">{t.entityType} ({t.entityCode})</td>
                <td className="p-3 text-gray-800 font-medium">{t.actorName} ({t.actorRole})</td>
                <td className="p-3 text-gray-600 font-sans">{t.justification}</td>
                <td className="p-3 text-gray-400 truncate max-w-[120px]" title={t.integrityHash}>{t.integrityHash.substring(0, 16)}...</td>
                <td className="p-3 text-gray-500">{t.timestamp.replace('T', ' ').substring(0, 19)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
};
