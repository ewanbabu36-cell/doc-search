import React from 'react';
import { Card, Badge, Button } from '@docsearch/ui-kit';
import type { QualityCapaDto } from '@docsearch/api-contracts';

interface Props {
  capas: QualityCapaDto[];
  onCreateCapa: () => void;
  onVerifyCapa: (capa: QualityCapaDto) => void;
}

export const CapaEngineView: React.FC<Props> = ({ capas, onCreateCapa, onVerifyCapa }) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Corrective & Preventive Action (CAPA) Workflow Engine</h2>
          <p className="text-xs text-gray-500">Action formulation, target milestones, owner assignment & effectiveness validation</p>
        </div>
        <Button variant="primary" onClick={onCreateCapa}>+ Formulate New CAPA</Button>
      </div>

      <div className="space-y-3">
        {capas.map((capa) => (
          <Card key={capa.id} className="p-4 flex items-center justify-between">
            <div className="space-y-1 max-w-2xl">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-gray-900">{capa.capaCode}</span>
                <Badge variant="neutral">{capa.actionType}</Badge>
                <Badge variant={capa.status === 'VERIFIED_EFFECTIVE' ? 'success' : 'warning'}>{capa.status}</Badge>
                {capa.incidentNumber && <span className="text-xs text-red-700">Ref: {capa.incidentNumber}</span>}
              </div>
              <p className="text-sm font-bold text-gray-800">{capa.title}</p>
              <p className="text-xs text-gray-600">{capa.actionDescription}</p>
              <p className="text-xs text-emerald-800 font-medium">🎯 Success Metric: {capa.verificationMetric}</p>
              <p className="text-xs text-gray-500">Owner: {capa.assignedOwner} | Target: {capa.targetCompletionDate}</p>
            </div>
            <div className="text-right">
              {capa.status !== 'VERIFIED_EFFECTIVE' ? (
                <Button variant="primary" size="sm" onClick={() => onVerifyCapa(capa)}>Verify Effectiveness</Button>
              ) : (
                <div className="text-xs text-emerald-700 font-semibold">
                  ✓ Verified by {capa.verifiedBy} ({capa.verifiedDate})
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
