import React from 'react';
import { Card, Badge } from '@docsearch/ui-kit';
import type { RadiologyAuditTraceDto } from '@docsearch/api-contracts';

interface Props {
  auditTraces: RadiologyAuditTraceDto[];
}

export const RadiologyAuditVaultView: React.FC<Props> = ({ auditTraces }) => {
  return (
    <Card className="p-5 bg-white border border-gray-200 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-gray-900">Radiology Immutable Cryptographic Audit Vault</h3>
          <p className="text-xs text-gray-500">SHA-256 chained transaction logs for requisitions, scans, report sign-offs & critical alerts</p>
        </div>
        <Badge variant="primary">{auditTraces.length} Cryptographic Traces</Badge>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse font-mono">
          <thead>
            <tr className="border-b bg-gray-50 text-gray-600 font-bold">
              <th className="py-2.5 px-3">Trace #</th>
              <th className="py-2.5 px-3">Action</th>
              <th className="py-2.5 px-3">Actor & Role</th>
              <th className="py-2.5 px-3">Entity Reference</th>
              <th className="py-2.5 px-3">Justification</th>
              <th className="py-2.5 px-3">SHA-256 Hash</th>
              <th className="py-2.5 px-3">Timestamp</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-[11px]">
            {auditTraces.map((trace) => (
              <tr key={trace.id} className="hover:bg-gray-50/70 transition">
                <td className="py-2 px-3 font-bold text-blue-700">{trace.traceNumber}</td>
                <td className="py-2 px-3">
                  <Badge variant="neutral">{trace.action}</Badge>
                </td>
                <td className="py-2 px-3 text-gray-900 font-sans">
                  <div>{trace.actorName}</div>
                  <div className="text-[10px] text-gray-500">{trace.actorRole}</div>
                </td>
                <td className="py-2 px-3 text-purple-700">{trace.entityCode}</td>
                <td className="py-2 px-3 text-gray-700 font-sans truncate max-w-xs">{trace.justification}</td>
                <td className="py-2 px-3 text-gray-400 truncate max-w-[120px]" title={trace.integrityHash}>
                  {trace.integrityHash.slice(0, 16)}...
                </td>
                <td className="py-2 px-3 text-gray-500 font-sans">{new Date(trace.timestamp).toLocaleTimeString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
};
