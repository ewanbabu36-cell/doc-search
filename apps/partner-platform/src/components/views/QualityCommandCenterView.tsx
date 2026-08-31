import React from 'react';
import { Card, Badge, Button } from '@docsearch/ui-kit';
import type { QualityStandardDto } from '@docsearch/api-contracts';

interface Props {
  standards: QualityStandardDto[];
  onAuditStandard: (std: QualityStandardDto) => void;
}

export const QualityCommandCenterView: React.FC<Props> = ({ standards, onAuditStandard }) => {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-bold text-gray-900">NABH (5th Ed) & JCI (7th Ed) Accreditation Standards Master</h2>
        <p className="text-xs text-gray-500">Continuous chapter self-assessment, measurable elements, and compliance scoring</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {standards.map((std) => (
          <Card key={std.id} className="p-4 space-y-3">
            <div className="flex items-center justify-between border-b pb-2">
              <div>
                <span className="text-xs font-bold text-gray-900">{std.standardCode}</span>
                <span className="text-xs text-blue-700 block">{std.chapter}</span>
              </div>
              <Badge variant={std.status === 'FULLY_COMPLIANT' ? 'success' : 'warning'}>
                {std.complianceScorePct}% Compliant
              </Badge>
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900">{std.standardTitle}</p>
              <p className="text-xs text-gray-600 mt-1">{std.description}</p>
            </div>
            <div className="p-2 bg-gray-50 rounded-lg text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-gray-500">Measurable Elements:</span>
                <span className="font-semibold text-gray-700">{std.measurableElementsCount} Criteria</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Chapter Lead:</span>
                <span className="font-semibold text-gray-800">{std.assignedLead}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Last Internal Audit:</span>
                <span className="text-gray-700">{std.lastAuditDate}</span>
              </div>
            </div>
            <div className="pt-2 border-t flex justify-end">
              <Button variant="outline" size="sm" onClick={() => onAuditStandard(std)}>Audit Chapter Criteria</Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
