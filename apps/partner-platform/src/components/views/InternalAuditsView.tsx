import React from 'react';
import { Card, Badge, Button } from '@docsearch/ui-kit';

export const InternalAuditsView: React.FC = () => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Internal Quality Audits & Departmental Mock Surveys</h2>
          <p className="text-xs text-gray-500">Peer-review clinical audits, non-conformance reports (NCRs) and corrective tracking</p>
        </div>
        <Button variant="primary">+ Schedule Mock Audit</Button>
      </div>

      <Card className="p-4 space-y-3">
        <div className="flex justify-between items-center border-b pb-2">
          <span className="text-xs font-bold text-gray-900">Audit Cycle Q3-2026</span>
          <Badge variant="success">89% Overall Compliance</Badge>
        </div>
        <div className="divide-y text-xs">
          <div className="py-2 flex justify-between">
            <span>Operation Theatre & PACU Sterility Audit</span>
            <span className="font-semibold text-emerald-700">Passed (Zero Major NCRs)</span>
          </div>
          <div className="py-2 flex justify-between">
            <span>Pharmacy High-Alert & LASA Storage Audit</span>
            <span className="font-semibold text-amber-700">1 Observation (Actioned)</span>
          </div>
          <div className="py-2 flex justify-between">
            <span>Emergency Department Triage Time Compliance</span>
            <span className="font-semibold text-emerald-700">Passed (100%)</span>
          </div>
        </div>
      </Card>
    </div>
  );
};
