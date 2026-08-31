import React from 'react';
import { Card, Badge, Button } from '@docsearch/ui-kit';
import type { CondemnationRecordDto } from '@docsearch/api-contracts';

interface Props {
  condemnations: CondemnationRecordDto[];
  onApproveCondemnation: (cond: CondemnationRecordDto) => void;
}

export const CondemnationDisposalView: React.FC<Props> = ({ condemnations, onApproveCondemnation }) => {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-bold text-gray-900">Equipment Condemnation & Decommissioning Board</h2>
        <p className="text-xs text-gray-500">Beyond economical repair (BER) review, salvage valuation & biohazard scrap certificates</p>
      </div>

      <div className="space-y-3">
        {condemnations.map((cond) => (
          <Card key={cond.id} className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-gray-900">{cond.condemnationCode}</span>
                <Badge variant={cond.status === 'APPROVED_FOR_SCRAP' ? 'danger' : 'warning'}>
                  {cond.status}
                </Badge>
              </div>
              <p className="text-sm font-bold text-gray-800">{cond.assetName} ({cond.assetCode})</p>
              <p className="text-xs text-gray-600"><strong>Reason:</strong> {cond.reasonForCondemnation}</p>
              <p className="text-xs text-gray-500">
                Purchase Year: {cond.purchaseYear} | Cumulative Maint: ₹{cond.cumulativeMaintenanceCost.toLocaleString()} | Scrap Value: ₹{cond.estimatedScrapValue.toLocaleString()}
              </p>
            </div>
            <div className="text-right">
              {cond.status === 'PROPOSED' ? (
                <Button variant="danger" size="sm" onClick={() => onApproveCondemnation(cond)}>Authorize Scrap</Button>
              ) : (
                <Badge variant="success">Approved on {cond.approvedDate}</Badge>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
