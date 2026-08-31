import React from 'react';
import { Card, Badge, Button } from '@docsearch/ui-kit';
import type { BiomedicalIncidentDto } from '@docsearch/api-contracts';

interface Props {
  incidents: BiomedicalIncidentDto[];
  onReportIncident: () => void;
  onResolveIncident: (inc: BiomedicalIncidentDto) => void;
}

export const BiomedicalIncidentsView: React.FC<Props> = ({ incidents, onReportIncident, onResolveIncident }) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Biomedical Safety Incidents, Adverse Events & CAPA</h2>
          <p className="text-xs text-gray-500">NABH / JCI safety adverse event reporting, Root Cause Analysis (RCA) and CAPA</p>
        </div>
        <Button variant="danger" onClick={onReportIncident}>🚨 Report Incident / Near Miss</Button>
      </div>

      <div className="space-y-3">
        {incidents.map((inc) => (
          <Card key={inc.id} className="p-4 flex items-center justify-between">
            <div className="space-y-1 max-w-2xl">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-gray-900">{inc.incidentCode}</span>
                <Badge variant={inc.severity === 'CRITICAL_ADVERSE_EVENT' ? 'danger' : 'warning'}>{inc.severity}</Badge>
                <Badge variant={inc.isResolved ? 'success' : 'danger'}>{inc.isResolved ? 'RESOLVED' : 'INVESTIGATION ACTIVE'}</Badge>
              </div>
              <p className="text-sm font-bold text-gray-800">{inc.assetName} ({inc.assetCode}) — {inc.departmentName}</p>
              <p className="text-xs text-gray-600"><strong>Summary:</strong> {inc.incidentSummary}</p>
              <p className="text-xs text-gray-500">Investigating Officer: {inc.investigatingOfficer} | Patient Involved: {inc.patientInvolved ? 'YES' : 'NO'}</p>
              {inc.capaActionPlan && (
                <p className="text-xs text-emerald-700 bg-emerald-50 p-2 rounded mt-1">
                  <strong>CAPA Plan:</strong> {inc.capaActionPlan}
                </p>
              )}
            </div>
            <div>
              {!inc.isResolved ? (
                <Button variant="primary" size="sm" onClick={() => onResolveIncident(inc)}>Finalize RCA & CAPA</Button>
              ) : (
                <Badge variant="success">Closed</Badge>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
