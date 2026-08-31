import React, { useState } from 'react';
import { Card, Table, Badge, Input } from '@docsearch/ui-kit';
import type { OTAuditTraceDto } from '@docsearch/api-contracts';

interface Props {
  traces: OTAuditTraceDto[];
}

export const OTAuditVaultView: React.FC<Props> = ({ traces }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = traces.filter(
    (t) =>
      t.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.actorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.traceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.entityCode.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">OT Immutable Audit Vault</h1>
        <p className="text-sm text-gray-500">Cryptographically hashed, append-only ledger for all surgical operations and safety overrides</p>
      </div>

      <Card className="p-4">
        <div className="mb-4">
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search action, actor, trace ID or surgical code..."
          />
        </div>
        <Table>
          <thead>
            <tr className="text-left text-xs font-semibold text-gray-500 border-b">
              <th className="py-2">Trace #</th>
              <th className="py-2">Action</th>
              <th className="py-2">Actor</th>
              <th className="py-2">Entity</th>
              <th className="py-2">Justification</th>
              <th className="py-2">Integrity Hash</th>
              <th className="py-2">Timestamp</th>
            </tr>
          </thead>
          <tbody className="divide-y text-xs font-mono">
            {filtered.map((t) => (
              <tr key={t.id}>
                <td className="py-2 font-bold text-indigo-700">{t.traceNumber}</td>
                <td className="py-2 font-semibold text-gray-900"><Badge variant="neutral">{t.action}</Badge></td>
                <td className="py-2 font-sans">{t.actorName} ({t.actorRole})</td>
                <td className="py-2">{t.entityType} [{t.entityCode}]</td>
                <td className="py-2 font-sans text-gray-600">{t.justification}</td>
                <td className="py-2 text-gray-400 truncate max-w-[120px]">{t.integrityHash}</td>
                <td className="py-2 text-gray-500 font-sans">{new Date(t.timestamp).toLocaleTimeString()}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Card>
    </div>
  );
};
