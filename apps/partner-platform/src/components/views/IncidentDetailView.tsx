import React from 'react';
import { Card, Badge, Button } from '@docsearch/ui-kit';
import type { HospitalIncidentDto, IncidentRcaDto, QualityCapaDto } from '@docsearch/api-contracts';

interface Props {
  incident: HospitalIncidentDto;
  rcas: IncidentRcaDto[];
  capas: QualityCapaDto[];
  onBack: () => void;
  onTriage: () => void;
  onConductRca: () => void;
  onCreateCapa: () => void;
  onCloseIncident: () => void;
}

export const IncidentDetailView: React.FC<Props> = ({
  incident,
  rcas,
  capas,
  onBack,
  onTriage,
  onConductRca,
  onCreateCapa,
  onCloseIncident
}) => {
  const incRca = rcas.find((r) => r.incidentId === incident.id);
  const incCapas = capas.filter((c) => c.incidentId === incident.id);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={onBack}>← Back to Incident Register</Button>
          <div>
            <h2 className="text-xl font-bold text-gray-900">{incident.incidentNumber} — Incident Dossier</h2>
            <p className="text-xs text-gray-500">{incident.category} | Logged: {incident.createdAt.replace('T', ' ').substring(0, 16)}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {incident.status === 'REPORTED' && <Button variant="primary" onClick={onTriage}>Triage & Assign</Button>}
          {incident.status === 'RCA_IN_PROGRESS' && <Button variant="danger" onClick={onConductRca}>Conduct RCA (5-Whys)</Button>}
          {incident.status !== 'CLOSED' && <Button variant="outline" onClick={onCreateCapa}>+ Formulate CAPA</Button>}
          {incident.status !== 'CLOSED' && <Button variant="primary" onClick={onCloseIncident}>Close Incident</Button>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card className="p-4 space-y-3">
          <h3 className="text-sm font-bold text-gray-900 border-b pb-2">Incident Narrative & Triage</h3>
          <div className="space-y-2 text-xs">
            <div><span className="text-gray-500">Summary:</span> <p className="font-bold text-gray-800">{incident.briefSummary}</p></div>
            <div><span className="text-gray-500">Detailed Narrative:</span> <p className="p-2 bg-gray-50 rounded mt-1 text-gray-700">{incident.detailedDescription}</p></div>
            <div><span className="text-gray-500">Immediate Clinical Action:</span> <p className="p-2 bg-green-50 rounded mt-1 text-green-900 font-medium">{incident.immediateActionTaken}</p></div>
            <div className="grid grid-cols-2 gap-2 pt-2">
              <div><span className="text-gray-500">SAC Matrix:</span> <Badge variant="danger">{incident.sacScore}</Badge></div>
              <div><span className="text-gray-500">Harm Level:</span> <strong>{incident.patientHarmLevel}</strong></div>
            </div>
            {incident.patientInvolved && (
              <div className="p-2 bg-blue-50 text-blue-900 rounded border border-blue-200">
                Patient: <strong>{incident.patientName}</strong> (MRN: {incident.patientMrn})
              </div>
            )}
          </div>
        </Card>

        <Card className="p-4 space-y-3">
          <h3 className="text-sm font-bold text-gray-900 border-b pb-2">Investigation & Quality Oversight</h3>
          <div className="space-y-2 text-xs">
            <div><span className="text-gray-500">Reported By:</span> {incident.reportedByStaff} ({incident.reportedByRole})</div>
            <div><span className="text-gray-500">Location:</span> {incident.departmentName} - {incident.locationDetail}</div>
            <div><span className="text-gray-500">Assigned Officer:</span> {incident.investigatingQualityOfficer || 'Unassigned'}</div>
            <div><span className="text-gray-500">RCA Status:</span> {incRca ? <Badge variant="success">Completed ({incRca.rcaCode})</Badge> : <Badge variant="warning">Pending RCA</Badge>}</div>
            <div><span className="text-gray-500">Associated CAPA Items:</span> <strong>{incCapas.length} Actions Formulated</strong></div>
          </div>
        </Card>
      </div>

      {/* RCA Findings Section */}
      {incRca && (
        <Card className="p-4 space-y-3">
          <h3 className="text-sm font-bold text-gray-900 border-b pb-2">Root Cause Analysis Findings ({incRca.rcaCode})</h3>
          <div className="space-y-2 text-xs">
            <p className="p-3 bg-red-50 text-red-900 rounded border border-red-200">
              <strong>Root Cause Statement:</strong> {incRca.rootCauseStatement}
            </p>
            <div className="p-3 bg-gray-50 rounded">
              <h4 className="font-bold text-gray-800 mb-1">5-Whys Chain:</h4>
              <ol className="list-decimal pl-4 space-y-1">
                {incRca.fiveWhysAnalysis.map((w) => (
                  <li key={w.step}>
                    <strong>{w.whyQuestion}</strong> — {w.becauseAnswer}
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};
