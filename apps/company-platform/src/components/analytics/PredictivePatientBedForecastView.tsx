import React, { useState } from 'react';
import { Card, Badge, TableContainer, Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@docsearch/ui-kit';

interface ForecastDay {
  day: string;
  date: string;
  projectedOpd: number;
  projectedIpdAdmissions: number;
  icuOccupancyPct: number;
  criticalCareSurgeRisk: 'LOW' | 'MODERATE' | 'HIGH';
  recommendedAction: string;
}

const FORECAST_SCHEDULE: ForecastDay[] = [
  {
    day: 'Wednesday (Tomorrow)',
    date: '2026-09-02',
    projectedOpd: 14200,
    projectedIpdAdmissions: 340,
    icuOccupancyPct: 82.4,
    criticalCareSurgeRisk: 'LOW',
    recommendedAction: 'Standard staffing across 14 hospital clusters'
  },
  {
    day: 'Thursday',
    date: '2026-09-03',
    projectedOpd: 15100,
    projectedIpdAdmissions: 395,
    icuOccupancyPct: 87.8,
    criticalCareSurgeRisk: 'MODERATE',
    recommendedAction: 'Keep 2 standby ICU ventilators ready at Apollo Delhi'
  },
  {
    day: 'Friday',
    date: '2026-09-04',
    projectedOpd: 16800,
    projectedIpdAdmissions: 480,
    icuOccupancyPct: 94.2,
    criticalCareSurgeRisk: 'HIGH',
    recommendedAction: 'Activate Monsoon Dengue Rapid-Response Triage wing'
  },
  {
    day: 'Saturday',
    date: '2026-09-05',
    projectedOpd: 18400,
    projectedIpdAdmissions: 520,
    icuOccupancyPct: 96.5,
    criticalCareSurgeRisk: 'HIGH',
    recommendedAction: 'Weekend surge: Deploy 6 locum duty doctors in Trauma'
  },
  {
    day: 'Sunday',
    date: '2026-09-06',
    projectedOpd: 11200,
    projectedIpdAdmissions: 280,
    icuOccupancyPct: 89.1,
    criticalCareSurgeRisk: 'MODERATE',
    recommendedAction: 'Emergency OT duty roster with on-call anesthesiologist'
  }
];

export const PredictivePatientBedForecastView: React.FC = () => {
  const [forecastDays] = useState<ForecastDay[]>(FORECAST_SCHEDULE);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: 'var(--ds-color-text-primary)' }}>
            🔮 Predictive Patient Flow & Bed Capacity Forecaster
          </h2>
          <Badge variant="primary">AI Prophet ML Model (95% Confidence)</Badge>
        </div>
        <p style={{ margin: '4px 0 0', fontSize: '0.8125rem', color: 'var(--ds-color-text-muted)' }}>
          7-Day forward AI forecast of OPD patient footfalls, IPD admissions, and ICU bed saturation based on historical and epidemiological patterns
        </p>
      </div>

      {/* Summary KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
        <div style={{ backgroundColor: '#0F172A', border: '1px solid #334155', borderRadius: '12px', padding: '16px' }}>
          <span style={{ fontSize: '0.6875rem', color: '#94A3B8', fontWeight: 800, textTransform: 'uppercase' }}>7-DAY PROJECTED OPD VOLUME</span>
          <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#38BDF8', marginTop: '2px' }}>104,200 Patients</div>
          <span style={{ fontSize: '0.75rem', color: '#10B981', marginTop: '4px', display: 'block' }}>+12.4% vs Previous Week</span>
        </div>

        <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.15)', border: '1.5px solid #EF4444', borderRadius: '12px', padding: '16px' }}>
          <span style={{ fontSize: '0.6875rem', color: '#FCA5A5', fontWeight: 800, textTransform: 'uppercase' }}>PEAK ICU BED SATURATION</span>
          <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#EF4444', marginTop: '2px' }}>96.5% (Saturday)</div>
          <span style={{ fontSize: '0.75rem', color: '#CBD5E1', marginTop: '4px', display: 'block' }}>Critical Surge Warning at 4 Hubs</span>
        </div>

        <div style={{ backgroundColor: '#0F172A', border: '1px solid #334155', borderRadius: '12px', padding: '16px' }}>
          <span style={{ fontSize: '0.6875rem', color: '#94A3B8', fontWeight: 800, textTransform: 'uppercase' }}>PREDICTED NABL BLOOD SAMPLES</span>
          <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#F8FAFC', marginTop: '2px' }}>42,800 Tests</div>
          <span style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '4px', display: 'block' }}>Platelet & Hematology Heavy</span>
        </div>

        <div style={{ backgroundColor: '#0F172A', border: '1px solid #334155', borderRadius: '12px', padding: '16px' }}>
          <span style={{ fontSize: '0.6875rem', color: '#94A3B8', fontWeight: 800, textTransform: 'uppercase' }}>ESTIMATED BED TURNOVER RATE</span>
          <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#10B981', marginTop: '2px' }}>2.4 Days Average</div>
          <span style={{ fontSize: '0.75rem', color: '#CBD5E1', marginTop: '4px', display: 'block' }}>Optimized discharge protocol</span>
        </div>
      </div>

      {/* Forecast Schedule Table */}
      <Card padding="none">
        <TableContainer style={{ border: 'none', borderRadius: '0' }}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Forecast Window & Date</TableHead>
                <TableHead>Projected OPD Patients</TableHead>
                <TableHead>Est. IPD Admissions</TableHead>
                <TableHead>ICU Bed Occupancy</TableHead>
                <TableHead>Critical Surge Risk</TableHead>
                <TableHead style={{ textAlign: 'right' }}>AI Clinical Operational Directive</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {forecastDays.map((f, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <div>
                      <strong style={{ color: 'var(--ds-color-text-primary)' }}>{f.day}</strong>
                      <span style={{ fontSize: '0.75rem', color: '#94A3B8', display: 'block' }}>{f.date}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <strong style={{ color: '#38BDF8' }}>{f.projectedOpd.toLocaleString()}</strong> patients
                  </TableCell>
                  <TableCell>
                    <strong style={{ color: '#F8FAFC' }}>{f.projectedIpdAdmissions}</strong> admissions
                  </TableCell>
                  <TableCell>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontWeight: 800, color: f.icuOccupancyPct > 90 ? '#EF4444' : '#10B981' }}>
                        {f.icuOccupancyPct}%
                      </span>
                      <div style={{ width: '60px', height: '6px', backgroundColor: '#334155', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ width: `${f.icuOccupancyPct}%`, height: '100%', backgroundColor: f.icuOccupancyPct > 90 ? '#EF4444' : '#10B981' }} />
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={f.criticalCareSurgeRisk === 'HIGH' ? 'danger' : f.criticalCareSurgeRisk === 'MODERATE' ? 'warning' : 'success'}>
                      {f.criticalCareSurgeRisk === 'HIGH' ? '🚨 HIGH SURGE' : f.criticalCareSurgeRisk === 'MODERATE' ? '⚠️ MODERATE' : '🟢 NORMAL'}
                    </Badge>
                  </TableCell>
                  <TableCell style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '0.75rem', color: '#CBD5E1', fontWeight: 600 }}>
                      {f.recommendedAction}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
    </div>
  );
};
