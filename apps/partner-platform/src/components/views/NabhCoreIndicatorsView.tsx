import React from 'react';
import { Card } from '@docsearch/ui-kit';

export const NabhCoreIndicatorsView: React.FC = () => {
  const kpis = [
    { title: 'Inpatient Fall Rate', value: '0.42 per 1,000 patient days', benchmark: '< 1.0', status: 'Optimal' },
    { title: 'Hospital-Acquired Pressure Ulcers', value: '0.18 per 1,000 bed days', benchmark: '< 0.5', status: 'Optimal' },
    { title: 'Medication Error Rate', value: '0.35 per 1,000 doses', benchmark: '< 0.5', status: 'Optimal' },
    { title: 'Unplanned OT Return (48h)', value: '0.24%', benchmark: '< 1.0%', status: 'Optimal' },
    { title: 'Unplanned ICU Readmission (48h)', value: '1.12%', benchmark: '< 2.0%', status: 'Optimal' },
    { title: 'Average Length of Stay (ALOS)', value: '3.8 days', benchmark: '3.5 - 4.2 days', status: 'Optimal' },
    { title: 'Bed Occupancy Rate', value: '88.4%', benchmark: '85 - 90%', status: 'Optimal' },
    { title: 'Discharge Turnaround Time', value: '115 mins', benchmark: '< 120 mins', status: 'Optimal' }
  ];

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-bold text-gray-900">NABH Core Clinical Quality Indicators (PSQ Framework)</h2>
        <p className="text-xs text-gray-500">Mandatory monthly patient safety and clinical quality benchmarks</p>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <Card key={kpi.title} className="p-4 space-y-1">
            <p className="text-xs font-semibold text-gray-500">{kpi.title}</p>
            <p className="text-lg font-bold text-gray-900">{kpi.value}</p>
            <p className="text-[11px] text-emerald-700 font-medium">Benchmark: {kpi.benchmark} ({kpi.status})</p>
          </Card>
        ))}
      </div>
    </div>
  );
};
