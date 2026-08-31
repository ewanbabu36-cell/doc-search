import React from 'react';
import { Card } from '@docsearch/ui-kit';
import type { MedicalRecordAuditTraceDto } from '@docsearch/api-contracts';

interface Props {
  traces: MedicalRecordAuditTraceDto[];
}

export const MRDAuditVaultView: React.FC<Props> = ({ traces }) => {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-bold text-gray-900">Medical Record Cryptographic Audit Vault</h2>
        <p className="text-xs text-gray-500">Append-only SHA-256 integrity chained audit trail for chart accesses, coding, and disclosures</p>
      </div>

      <Card className="overflow-hidden border border-gray-200">
        <table className="w-full text-left text-xs">
          <thead className="bg-gray-50 border-b text-gray-600 uppercase font-semibold">
            <tr>
              <th className="p-3">Trace #</th>
              <th className="p-3">Actor & Role</th>
              <th className="p-3">Action</th>
              <th className="p-3">Target Entity</th>
              <th className="p-3">Justification</th>
              <th className="p-3">Integrity Hash</th>
              <th className="p-3">Timestamp</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {traces.map((t) => (
              <tr key={t.id} className="hover:bg-slate-50 transition">
                <td className="p-3 font-bold text-blue-700">{t.traceNumber}</td>
                <td className="p-3">
                  <div className="font-semibold text-gray-900">{t.actorName}</div>
                  <div className="text-[10px] text-gray-500">{t.actorRole}</div>
                </td>
                <td className="p-3 font-bold text-gray-800">{t.action}</td>
                <td className="p-3 text-gray-600">{t.entityType}: {t.entityCode}</td>
                <td className="p-3 text-gray-600">{t.justification}</td>
                <td className="p-3 font-mono text-[10px] text-gray-400">{t.integrityHash.slice(0, 16)}...</td>
                <td className="p-3 text-gray-500">{new Date(t.timestamp).toLocaleTimeString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
};
