import React from 'react';
import { Card, Badge, TableContainer, Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@docsearch/ui-kit';

export const AiHallucinationBenchmarkView: React.FC = () => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: 'var(--ds-color-text-primary)' }}>
            ⚖️ AI Clinical Hallucination & Doctor-in-the-Loop Audit Matrix
          </h2>
          <Badge variant="primary">Benchmark: 100,000+ Interactions</Badge>
        </div>
        <p style={{ margin: '4px 0 0', fontSize: '0.8125rem', color: 'var(--ds-color-text-muted)' }}>
          Continuous medical accuracy evaluation, prompt drift monitoring, and Chief Medical Officer (CMO) sign-off audits
        </p>
      </div>

      {/* Benchmark Metric Strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
        <div style={{ backgroundColor: '#0F172A', border: '1.5px solid #10B981', borderRadius: '12px', padding: '16px' }}>
          <span style={{ fontSize: '0.6875rem', color: '#86EFAC', fontWeight: 800, textTransform: 'uppercase' }}>CLINICAL HALLUCINATION RATE</span>
          <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#10B981', marginTop: '2px' }}>0.038% (Ultra-Low)</div>
          <span style={{ fontSize: '0.75rem', color: '#CBD5E1', marginTop: '4px', display: 'block' }}>Zero critical drug errors logged</span>
        </div>

        <div style={{ backgroundColor: '#0F172A', border: '1px solid #334155', borderRadius: '12px', padding: '16px' }}>
          <span style={{ fontSize: '0.6875rem', color: '#94A3B8', fontWeight: 800, textTransform: 'uppercase' }}>DOCTOR ACCEPTANCE RATE</span>
          <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#38BDF8', marginTop: '2px' }}>97.4% Accepted</div>
          <span style={{ fontSize: '0.75rem', color: '#CBD5E1', marginTop: '4px', display: 'block' }}>Doctors sign AI suggested Rx</span>
        </div>

        <div style={{ backgroundColor: '#0F172A', border: '1px solid #334155', borderRadius: '12px', padding: '16px' }}>
          <span style={{ fontSize: '0.6875rem', color: '#94A3B8', fontWeight: 800, textTransform: 'uppercase' }}>CMO CLINICAL AUDIT REVIEWS</span>
          <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#F8FAFC', marginTop: '2px' }}>1,420 Prompts</div>
          <span style={{ fontSize: '0.75rem', color: '#10B981', marginTop: '4px', display: 'block' }}>100% CMO Approved</span>
        </div>

        <div style={{ backgroundColor: '#0F172A', border: '1px solid #334155', borderRadius: '12px', padding: '16px' }}>
          <span style={{ fontSize: '0.6875rem', color: '#94A3B8', fontWeight: 800, textTransform: 'uppercase' }}>ADVERSARIAL JAILBREAK RESISTANCE</span>
          <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#A855F7', marginTop: '2px' }}>99.99% Blocked</div>
          <span style={{ fontSize: '0.75rem', color: '#CBD5E1', marginTop: '4px', display: 'block' }}>Strict clinical prompt boundary</span>
        </div>
      </div>

      {/* Benchmark Category Table */}
      <Card title="📜 Medical Specialization Precision Benchmarks" padding="none">
        <TableContainer style={{ border: 'none', borderRadius: '0' }}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Clinical Domain / Specialty</TableHead>
                <TableHead>Evaluated Prompts</TableHead>
                <TableHead>Diagnostic Precision</TableHead>
                <TableHead>Drug Interaction Recall</TableHead>
                <TableHead>Hallucination Rate</TableHead>
                <TableHead style={{ textAlign: 'right' }}>Safety Certification</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell><strong>Internal Medicine & Diabetology</strong></TableCell>
                <TableCell>38,400</TableCell>
                <TableCell style={{ color: '#10B981', fontWeight: 700 }}>99.2%</TableCell>
                <TableCell style={{ color: '#38BDF8', fontWeight: 700 }}>99.8%</TableCell>
                <TableCell style={{ color: '#10B981', fontWeight: 700 }}>0.021%</TableCell>
                <TableCell style={{ textAlign: 'right' }}><Badge variant="success">CMO Certified</Badge></TableCell>
              </TableRow>
              <TableRow>
                <TableCell><strong>Cardiology & Hypertension Triage</strong></TableCell>
                <TableCell>24,600</TableCell>
                <TableCell style={{ color: '#10B981', fontWeight: 700 }}>98.9%</TableCell>
                <TableCell style={{ color: '#38BDF8', fontWeight: 700 }}>100.0%</TableCell>
                <TableCell style={{ color: '#10B981', fontWeight: 700 }}>0.015%</TableCell>
                <TableCell style={{ textAlign: 'right' }}><Badge variant="success">CMO Certified</Badge></TableCell>
              </TableRow>
              <TableRow>
                <TableCell><strong>Pediatrics & Neonatal Care</strong></TableCell>
                <TableCell>19,800</TableCell>
                <TableCell style={{ color: '#10B981', fontWeight: 700 }}>99.5%</TableCell>
                <TableCell style={{ color: '#38BDF8', fontWeight: 700 }}>99.9%</TableCell>
                <TableCell style={{ color: '#10B981', fontWeight: 700 }}>0.018%</TableCell>
                <TableCell style={{ textAlign: 'right' }}><Badge variant="success">CMO Certified</Badge></TableCell>
              </TableRow>
              <TableRow>
                <TableCell><strong>Pathology & NABL Report Interpretation</strong></TableCell>
                <TableCell>42,100</TableCell>
                <TableCell style={{ color: '#10B981', fontWeight: 700 }}>99.8%</TableCell>
                <TableCell style={{ color: '#38BDF8', fontWeight: 700 }}>99.7%</TableCell>
                <TableCell style={{ color: '#10B981', fontWeight: 700 }}>0.012%</TableCell>
                <TableCell style={{ textAlign: 'right' }}><Badge variant="success">CMO Certified</Badge></TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
    </div>
  );
};
