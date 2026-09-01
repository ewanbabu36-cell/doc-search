import React from 'react';
import { Card, Badge, TableContainer, Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@docsearch/ui-kit';
import { useGlobalLocale } from '../common/GlobalCurrencyLocaleContext.js';

interface OpexDepartmentItem {
  id: string;
  departmentName: string;
  icon: string;
  category: 'INFRASTRUCTURE' | 'AI_COMPUTE' | 'COMPLIANCE' | 'ENGINEERING' | 'OPERATIONS';
  monthlyCostInr: number;
  shareOfOpexPercent: number;
  costDriver: string;
  efficiencyStatus: string;
  accentColor: string;
}

const OPEX_DEPARTMENTS: OpexDepartmentItem[] = [
  {
    id: 'OPEX-CLOUD',
    departmentName: 'AWS & GCP Cloud Compute + KMS CloudHSM',
    icon: '☁️',
    category: 'INFRASTRUCTURE',
    monthlyCostInr: 420000,
    shareOfOpexPercent: 17.9,
    costDriver: 'Multi-AZ Postgres replicas, Redis cluster, S3 EMR vaults',
    efficiencyStatus: '99.98% High Availability Tier',
    accentColor: '#38BDF8'
  },
  {
    id: 'OPEX-AI',
    departmentName: 'AI Model Inference & Diagnostic Copilot GPUs',
    icon: '🤖',
    category: 'AI_COMPUTE',
    monthlyCostInr: 280000,
    shareOfOpexPercent: 11.9,
    costDriver: 'LIMS ICD-10 Differential Diagnosis & Drug Safety Engine',
    efficiencyStatus: 'Quantized vLLM batch inference',
    accentColor: '#06B6D4'
  },
  {
    id: 'OPEX-COMPLIANCE',
    departmentName: 'SOC2 KMS HSM & ABDM M1-M3 Gateways',
    icon: '🛡️',
    category: 'COMPLIANCE',
    monthlyCostInr: 150000,
    shareOfOpexPercent: 6.4,
    costDriver: 'Continuous CloudTrail audit logging, ABDM HIU/HIP endpoints',
    efficiencyStatus: '100% Certified & Compliant',
    accentColor: '#10B981'
  },
  {
    id: 'OPEX-ENG',
    departmentName: 'Core Platform Engineering & 24/7 War Room Ops',
    icon: '👥',
    category: 'ENGINEERING',
    monthlyCostInr: 890000,
    shareOfOpexPercent: 37.9,
    costDriver: 'Full-stack platform, Fastify Gateway, Site Reliability Engineers',
    efficiencyStatus: 'Zero External Agency Dependency',
    accentColor: '#F59E0B'
  },
  {
    id: 'OPEX-FIELD',
    departmentName: 'Enterprise Hospital Integration & Field Operations',
    icon: '🏢',
    category: 'OPERATIONS',
    monthlyCostInr: 610000,
    shareOfOpexPercent: 26.0,
    costDriver: 'Onsite hospital training, LIMS analyzer hardware calibration',
    efficiencyStatus: 'Rapid 48-Hour Onboarding Flywheel',
    accentColor: '#A78BFA'
  }
];

export const DepartmentOpexMatrixView: React.FC = () => {
  const { formatMoney } = useGlobalLocale();

  const totalMonthlyOpex = OPEX_DEPARTMENTS.reduce((acc, item) => acc + item.monthlyCostInr, 0);
  const netMonthlyRevenue = 23484000; // ₹ 2.35 Cr Net Platform Revenue
  const netMonthlyEbitda = netMonthlyRevenue - totalMonthlyOpex; // ₹ 2.11 Cr
  const ebitdaMarginPercent = ((netMonthlyEbitda / netMonthlyRevenue) * 100).toFixed(1);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 800, color: 'var(--ds-color-text-primary)' }}>
              🏢 Department-Wise OPEX & Cloud Infrastructure Cost Matrix
            </h3>
            <Badge variant="success">● {ebitdaMarginPercent}% Operating Margin</Badge>
          </div>
          <p style={{ margin: '4px 0 0', fontSize: '0.8125rem', color: 'var(--ds-color-text-muted)' }}>
            Transparent operational expenditure allocation: Cloud infrastructure, AI GPU inference, SOC2 security, and field engineering
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', backgroundColor: '#0F172A', padding: '6px 14px', borderRadius: '10px', border: '1px solid #334155' }}>
          <div>
            <span style={{ fontSize: '0.6875rem', color: '#94A3B8', textTransform: 'uppercase' }}>TOTAL MONTHLY OPEX</span>
            <div style={{ fontSize: '1rem', fontWeight: 900, color: '#FCD34D' }}>
              {formatMoney(totalMonthlyOpex)} / mo
            </div>
          </div>
          <div style={{ borderLeft: '1px solid #334155', paddingLeft: '10px' }}>
            <span style={{ fontSize: '0.6875rem', color: '#94A3B8', textTransform: 'uppercase' }}>NET MONTHLY EBITDA</span>
            <div style={{ fontSize: '1rem', fontWeight: 900, color: '#10B981' }}>
              {formatMoney(netMonthlyEbitda)} / mo
            </div>
          </div>
        </div>
      </div>

      {/* OPEX Table */}
      <Card title="📜 Operational Expenditure Breakdown" padding="none">
        <TableContainer style={{ border: 'none', borderRadius: '0' }}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Department / Cost Center</TableHead>
                <TableHead>Monthly Expenditure</TableHead>
                <TableHead>Share of OPEX</TableHead>
                <TableHead>Operational Cost Driver</TableHead>
                <TableHead style={{ textAlign: 'right' }}>Efficiency Health</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {OPEX_DEPARTMENTS.map((dept) => (
                <TableRow key={dept.id}>
                  <TableCell>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '1.25rem' }}>{dept.icon}</span>
                      <strong style={{ color: 'var(--ds-color-text-primary)' }}>{dept.departmentName}</strong>
                    </div>
                  </TableCell>
                  <TableCell style={{ fontWeight: 800, color: '#FCD34D', fontSize: '0.9375rem' }}>
                    {formatMoney(dept.monthlyCostInr)}
                  </TableCell>
                  <TableCell style={{ fontWeight: 700, color: dept.accentColor }}>
                    {dept.shareOfOpexPercent}%
                  </TableCell>
                  <TableCell style={{ fontSize: '0.8125rem', color: '#CBD5E1' }}>
                    {dept.costDriver}
                  </TableCell>
                  <TableCell style={{ textAlign: 'right' }}>
                    <Badge variant="success">
                      ✓ {dept.efficiencyStatus}
                    </Badge>
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
