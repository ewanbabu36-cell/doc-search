import React from 'react';
import { Card, Badge } from '@docsearch/ui-kit';

export const ClinicalPathwaysView: React.FC = () => {
  const pathways = [
    { name: 'Acute STEMI Door-to-Balloon Pathway', target: '< 90 mins', current: '58 mins', compliance: '98%' },
    { name: 'Acute Ischemic Stroke Thrombolysis (Door-to-Needle)', target: '< 60 mins', current: '42 mins', compliance: '95%' },
    { name: 'Severe Sepsis 1-Hour Bundle Protocol', target: '100% adherence', current: '94%', compliance: '94%' },
    { name: 'Surgical Antibiotic Prophylaxis (within 60m pre-incision)', target: '100% adherence', current: '99%', compliance: '99%' }
  ];

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-bold text-gray-900">Clinical Practice Guidelines (CPG) & Pathway Audits</h2>
        <p className="text-xs text-gray-500">Standardized clinical pathway adherence metrics and door-to-treatment golden times</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {pathways.map((p) => (
          <Card key={p.name} className="p-4 space-y-2">
            <div className="flex justify-between items-center border-b pb-2">
              <span className="text-xs font-bold text-gray-900">{p.name}</span>
              <Badge variant="success">{p.compliance} Adherent</Badge>
            </div>
            <div className="text-xs space-y-1">
              <p className="text-gray-500">Golden Target: <strong>{p.target}</strong></p>
              <p className="text-gray-700 font-semibold">Hospital Performance: {p.current}</p>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
