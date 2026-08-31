import React from 'react';
import { Card, Badge } from '@docsearch/ui-kit';
import type { BloodBankAuditTraceDto } from '@docsearch/api-contracts';

interface Props {
  auditTraces: BloodBankAuditTraceDto[];
}

export const BloodBankAuditVaultView: React.FC<Props> = ({ auditTraces }) => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Blood Bank Regulatory Audit Vault</h2>
        <p className="text-xs text-gray-500">Immutable SHA-256 cryptographic chain-of-custody for every blood donation, test, issue & transfusion</p>
      </div>

      <Card className="overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-600 border-b border-gray-200">
            <tr>
              <th className="p-3">Trace No.</th>
              <th className="p-3">Timestamp</th>
              <th className="p-3">Staff Actor & Role</th>
              <th className="p-3">Action</th>
              <th className="p-3">Entity Reference</th>
              <th className="p-3">Clinical Justification</th>
              <th className="p-3">Integrity Hash</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {auditTraces.map((t) => (
              <tr key={t.id} className="hover:bg-slate-50 transition">
                <td className="p-3 font-mono font-bold text-slate-800">{t.traceNumber}</td>
                <td className="p-3 text-xs text-gray-600">{new Date(t.timestamp).toLocaleString()}</td>
                <td className="p-3">
                  <div className="font-semibold text-gray-900">{t.actorName}</div>
                  <div className="text-xs text-gray-400">{t.actorRole}</div>
                </td>
                <td className="p-3">
                  <Badge variant="primary">{t.action.replace(/_/g, ' ')}</Badge>
                </td>
                <td className="p-3 font-mono text-xs text-gray-700">{t.entityCode}</td>
                <td className="p-3 text-xs text-gray-700 max-w-xs truncate">{t.justification}</td>
                <td className="p-3 font-mono text-xs text-slate-500">{t.integrityHash.slice(0, 16)}...</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
};
