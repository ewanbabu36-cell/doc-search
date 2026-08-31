import React from 'react';
import { Card, Button } from '@docsearch/ui-kit';

export const QualityCommitteeView: React.FC = () => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Patient Safety & Quality Steering Committee Meetings</h2>
          <p className="text-xs text-gray-500">Monthly committee minutes, sentinel event reviews, and strategic action plans</p>
        </div>
        <Button variant="primary">+ Log Committee Meeting</Button>
      </div>

      <Card className="p-4 space-y-3">
        <div className="border-b pb-2 flex justify-between">
          <div>
            <h3 className="text-xs font-bold text-gray-900">Patient Safety Committee — Meeting #8 (August 2026)</h3>
            <p className="text-xs text-gray-500">Chair: Dr. Alok Verma (Medical Director) | Date: 2026-08-25</p>
          </div>
        </div>
        <div className="text-xs text-gray-700 space-y-2">
          <p><strong>Agenda Items:</strong> Review of August medication error incidents, ward fall prevention barrier flooring, and CLABSI surveillance data.</p>
          <p><strong>Decisions & Mandates:</strong> Formulated CAPA-2026-041 for mandatory tall-man lettering across all pharmacy bins.</p>
        </div>
      </Card>
    </div>
  );
};
