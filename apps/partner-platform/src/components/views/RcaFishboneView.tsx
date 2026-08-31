import React from 'react';
import { Card, Badge } from '@docsearch/ui-kit';
import type { IncidentRcaDto } from '@docsearch/api-contracts';

interface Props {
  rcas: IncidentRcaDto[];
}

export const RcaFishboneView: React.FC<Props> = ({ rcas }) => {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-bold text-gray-900">Root Cause Analysis (RCA) & Ishikawa Fishbone Repository</h2>
        <p className="text-xs text-gray-500">Multidisciplinary RCA investigations, 5-Whys causal chains, and contributing factor matrices</p>
      </div>

      <div className="space-y-4">
        {rcas.map((rca) => (
          <Card key={rca.id} className="p-4 space-y-4">
            <div className="flex items-center justify-between border-b pb-2">
              <div>
                <span className="text-xs font-bold text-gray-900">{rca.rcaCode}</span>
                <span className="text-xs text-red-700 block">Incident: {rca.incidentNumber}</span>
              </div>
              <Badge variant="success">{rca.status}</Badge>
            </div>

            <div className="p-3 bg-red-50 text-red-900 text-xs rounded border border-red-200">
              <strong>Root Cause Statement:</strong> {rca.rootCauseStatement}
            </div>

            {/* Ishikawa 5M Categories */}
            <div className="grid grid-cols-5 gap-2 text-xs">
              <div className="p-2 bg-gray-50 rounded border">
                <p className="font-bold text-gray-700 mb-1">👥 People</p>
                <ul className="list-disc pl-3 text-[11px] text-gray-600">
                  {rca.fishboneCategories.people.map((p, idx) => <li key={idx}>{p}</li>)}
                </ul>
              </div>
              <div className="p-2 bg-gray-50 rounded border">
                <p className="font-bold text-gray-700 mb-1">⚙️ Process</p>
                <ul className="list-disc pl-3 text-[11px] text-gray-600">
                  {rca.fishboneCategories.process.map((p, idx) => <li key={idx}>{p}</li>)}
                </ul>
              </div>
              <div className="p-2 bg-gray-50 rounded border">
                <p className="font-bold text-gray-700 mb-1">🩺 Equipment</p>
                <ul className="list-disc pl-3 text-[11px] text-gray-600">
                  {rca.fishboneCategories.equipment.map((p, idx) => <li key={idx}>{p}</li>)}
                </ul>
              </div>
              <div className="p-2 bg-gray-50 rounded border">
                <p className="font-bold text-gray-700 mb-1">🏥 Environment</p>
                <ul className="list-disc pl-3 text-[11px] text-gray-600">
                  {rca.fishboneCategories.environment.map((p, idx) => <li key={idx}>{p}</li>)}
                </ul>
              </div>
              <div className="p-2 bg-gray-50 rounded border">
                <p className="font-bold text-gray-700 mb-1">📋 Management</p>
                <ul className="list-disc pl-3 text-[11px] text-gray-600">
                  {rca.fishboneCategories.management.map((p, idx) => <li key={idx}>{p}</li>)}
                </ul>
              </div>
            </div>

            <div className="text-xs text-gray-500 flex justify-between pt-2 border-t">
              <span>Lead: {rca.leadInvestigator}</span>
              <span>Completed: {rca.completedDate}</span>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
