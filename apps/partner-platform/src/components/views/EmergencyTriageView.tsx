import React from 'react';
import { Card, Table, Badge, Button } from '@docsearch/ui-kit';
import type { EmergencyTriageAssessmentDto, EmergencyEncounterDto } from '@docsearch/api-contracts';

interface Props {
  assessments: EmergencyTriageAssessmentDto[];
  encounters: EmergencyEncounterDto[];
  onTriageEncounter: (enc: EmergencyEncounterDto) => void;
}

export const EmergencyTriageView: React.FC<Props> = ({ assessments, encounters, onTriageEncounter }) => {
  const pending = encounters.filter(e => !e.triageEsiLevel);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Emergency Triage Desk</h1>
        <p className="text-sm text-gray-500">Rapid assessment, ESI 1–5 classification, vital telemetry, and sepsis/STEMI alerts</p>
      </div>

      <Card className="p-4">
        <h2 className="text-base font-bold text-gray-900 mb-3">Pending Initial Triage ({pending.length})</h2>
        <div className="space-y-2">
          {pending.map(p => (
            <div key={p.id} className="flex justify-between items-center p-3 rounded-lg border bg-amber-50/50">
              <div>
                <p className="font-bold text-gray-900">{p.patientName} ({p.patientMrn})</p>
                <p className="text-xs text-gray-600">{p.arrivalMode} • {p.chiefComplaint}</p>
              </div>
              <Button variant="primary" onClick={() => onTriageEncounter(p)}>Conduct Triage</Button>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-4">
        <h2 className="text-base font-bold text-gray-900 mb-3">Triage Assessments Registry</h2>
        <Table>
          <thead>
            <tr className="text-left text-xs font-semibold text-gray-500 border-b">
              <th className="py-2">Patient</th>
              <th className="py-2">ESI Acuity</th>
              <th className="py-2">Vitals (BP/HR/SpO2)</th>
              <th className="py-2">GCS / Pain</th>
              <th className="py-2">Critical Alerts</th>
              <th className="py-2">Triage Nurse</th>
            </tr>
          </thead>
          <tbody className="divide-y text-sm">
            {assessments.map(a => (
              <tr key={a.id}>
                <td className="py-2 font-semibold">{a.patientName}</td>
                <td className="py-2"><Badge variant={a.esiLevel.includes('ESI_1') ? 'danger' : 'warning'}>{a.esiLevel}</Badge></td>
                <td className="py-2 text-xs">{a.systolicBp}/{a.diastolicBp} • {a.pulseRate} bpm • {a.spo2Percentage}%</td>
                <td className="py-2 text-xs">GCS: {a.gcsScore} • Pain: {a.painScore}/10</td>
                <td className="py-2 text-xs">
                  {a.stemiScreenPositive && <Badge variant="danger">STEMI</Badge>}
                  {a.strokeScreenPositive && <Badge variant="danger">STROKE</Badge>}
                  {a.sepsisScreenPositive && <Badge variant="danger">SEPSIS</Badge>}
                </td>
                <td className="py-2 text-xs text-gray-600">{a.triageNurseName}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Card>
    </div>
  );
};
