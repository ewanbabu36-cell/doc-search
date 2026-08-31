import React, { useState } from 'react';
import { Card, Badge, Input } from '@docsearch/ui-kit';
import type { DietaryAuditTraceDto } from '@docsearch/api-contracts';

interface Props {
  auditTraces: DietaryAuditTraceDto[];
}

export const DietaryAuditVaultView: React.FC<Props> = ({ auditTraces }) => {
  const [search, setSearch] = useState('');

  const filtered = auditTraces.filter(
    (t) =>
      t.action.toLowerCase().includes(search.toLowerCase()) ||
      t.actorName.toLowerCase().includes(search.toLowerCase()) ||
      t.traceNumber.toLowerCase().includes(search.toLowerCase()) ||
      t.entityCode.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Dietary & Kitchen Cryptographic Audit Vault</h1>
        <p className="text-xs text-gray-500">Immutable append-only ledger for all diet orders, NPO declarations, meal releases, and HACCP checks</p>
      </div>

      <Card className="p-4">
        <Input placeholder="Search audit logs by action, actor, entity code, trace #..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </Card>

      <div className="space-y-3">
        {filtered.map((t) => (
          <Card key={t.id} className="p-4 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-blue-600">{t.traceNumber}</span>
              <Badge variant="primary">{t.action}</Badge>
            </div>
            <p className="text-gray-900 font-medium"><strong>Actor:</strong> {t.actorName} ({t.actorRole})</p>
            <p className="text-gray-700"><strong>Entity:</strong> {t.entityType} ({t.entityCode})</p>
            <p className="text-gray-600"><strong>Justification:</strong> {t.justification}</p>
            <div className="flex items-center justify-between pt-2 border-t text-[10px] text-gray-400 font-mono">
              <span>SHA-256: {t.integrityHash}</span>
              <span>{t.timestamp}</span>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
