import React from 'react';
import { Card, Badge, Button } from '@docsearch/ui-kit';
import type { HandHygieneAuditDto } from '@docsearch/api-contracts';

interface Props {
  audits: HandHygieneAuditDto[];
  onRecordAudit: () => void;
}

export const HandHygieneComplianceView: React.FC<Props> = ({ audits, onRecordAudit }) => {
  const compliantCount = audits.filter((a) => a.isCompliant).length;
  const compliancePct = audits.length > 0 ? ((compliantCount / audits.length) * 100).toFixed(1) : '100.0';

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900">WHO 5-Moments Hand Hygiene Observational Audits</h2>
          <p className="text-xs text-gray-500">Real-time departmental surveillance across clinical and support staff cohorts</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="success" >Fleet Compliance: {compliancePct}%</Badge>
          <Button variant="primary" onClick={onRecordAudit}>+ Log Observation</Button>
        </div>
      </div>

      <div className="space-y-3">
        {audits.map((a) => (
          <Card key={a.id} className="p-3 flex items-center justify-between text-xs">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-bold text-gray-900">{a.auditCode}</span>
                <Badge variant={a.isCompliant ? 'success' : 'danger'}>
                  {a.isCompliant ? 'COMPLIANT' : 'MISSED OPPORTUNITY'}
                </Badge>
                <span className="text-gray-500">{a.staffCategory}</span>
              </div>
              <p className="font-semibold text-gray-800">{a.whoMoment}</p>
              <p className="text-gray-500">{a.departmentName} | Audited by: {a.auditedByOfficer} ({a.auditDate})</p>
              {a.notes && <p className="text-gray-600 italic">Notes: {a.notes}</p>}
            </div>
            <div className="text-right">
              <span className="font-bold text-gray-700">{a.actionTaken}</span>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
