import React from 'react';
import { Card, Badge, TableContainer, Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@docsearch/ui-kit';

export const CampaignAbTestingAnalyticsView: React.FC = () => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: 'var(--ds-color-text-primary)' }}>
            📊 Campaign A/B Testing & Delivery Conversion Analytics
          </h2>
          <Badge variant="primary">Statistical Significance Engine</Badge>
        </div>
        <p style={{ margin: '4px 0 0', fontSize: '0.8125rem', color: 'var(--ds-color-text-muted)' }}>
          Compare Variant A vs Variant B messages across open rates, CTA click-through rates, and appointment bookings
        </p>
      </div>

      {/* A/B Split Test Comparison Card */}
      <Card title="⚡ Active Split Test: Monsoon OPD Follow-Up Broadcast" padding="lg">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          {/* Variant A */}
          <div style={{ backgroundColor: '#0F172A', border: '1.5px solid #334155', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <strong style={{ color: '#94A3B8', fontSize: '0.875rem' }}>VARIANT A (Informational Direct)</strong>
              <Badge variant="neutral">50% Traffic (7,100)</Badge>
            </div>

            <div style={{ backgroundColor: '#1E293B', borderRadius: '8px', padding: '10px', fontSize: '0.75rem', color: '#CBD5E1', fontStyle: 'italic' }}>
              "Your test report is ready for download. Please click here to consult doctor for review: [link]"
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginTop: '4px' }}>
              <div style={{ textAlign: 'center', backgroundColor: '#1E293B', padding: '8px', borderRadius: '6px' }}>
                <span style={{ fontSize: '0.625rem', color: '#94A3B8' }}>READ RATE</span>
                <div style={{ fontWeight: 800, color: '#F8FAFC', fontSize: '1.1rem' }}>82.4%</div>
              </div>

              <div style={{ textAlign: 'center', backgroundColor: '#1E293B', padding: '8px', borderRadius: '6px' }}>
                <span style={{ fontSize: '0.625rem', color: '#94A3B8' }}>CTA CLICKS</span>
                <div style={{ fontWeight: 800, color: '#38BDF8', fontSize: '1.1rem' }}>34.2%</div>
              </div>

              <div style={{ textAlign: 'center', backgroundColor: '#1E293B', padding: '8px', borderRadius: '6px' }}>
                <span style={{ fontSize: '0.625rem', color: '#94A3B8' }}>BOOKINGS</span>
                <div style={{ fontWeight: 800, color: '#10B981', fontSize: '1.1rem' }}>18.6%</div>
              </div>
            </div>
          </div>

          {/* Variant B (Winner) */}
          <div style={{ backgroundColor: '#0F172A', border: '2px solid #10B981', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <strong style={{ color: '#10B981', fontSize: '0.875rem' }}>VARIANT B (Empathetic Care CTA) 🏆</strong>
              <Badge variant="success">Winner (+48% CTR)</Badge>
            </div>

            <div style={{ backgroundColor: '#1E293B', borderRadius: '8px', padding: '10px', fontSize: '0.75rem', color: '#CBD5E1', fontStyle: 'italic' }}>
              "Namaste Rahul, Dr. Vikram has reviewed your lab report. Protect your family with a quick 5-min OPD review: [link]"
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginTop: '4px' }}>
              <div style={{ textAlign: 'center', backgroundColor: '#1E293B', padding: '8px', borderRadius: '6px' }}>
                <span style={{ fontSize: '0.625rem', color: '#94A3B8' }}>READ RATE</span>
                <div style={{ fontWeight: 800, color: '#F8FAFC', fontSize: '1.1rem' }}>94.6%</div>
              </div>

              <div style={{ textAlign: 'center', backgroundColor: '#1E293B', padding: '8px', borderRadius: '6px' }}>
                <span style={{ fontSize: '0.625rem', color: '#94A3B8' }}>CTA CLICKS</span>
                <div style={{ fontWeight: 800, color: '#38BDF8', fontSize: '1.1rem' }}>51.8%</div>
              </div>

              <div style={{ textAlign: 'center', backgroundColor: '#1E293B', padding: '8px', borderRadius: '6px' }}>
                <span style={{ fontSize: '0.625rem', color: '#94A3B8' }}>BOOKINGS</span>
                <div style={{ fontWeight: 800, color: '#10B981', fontSize: '1.1rem' }}>32.4%</div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Historical A/B Test Table */}
      <Card title="📜 Historical Campaign Experiments" padding="none">
        <TableContainer style={{ border: 'none', borderRadius: '0' }}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Experiment Name</TableHead>
                <TableHead>Channel</TableHead>
                <TableHead>Sample Size</TableHead>
                <TableHead>Winning Variant</TableHead>
                <TableHead>CTR Uplift</TableHead>
                <TableHead>Confidence</TableHead>
                <TableHead style={{ textAlign: 'right' }}>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell>
                  <strong>NABL Report Delivery Copy</strong>
                </TableCell>
                <TableCell><Badge variant="primary">WhatsApp</Badge></TableCell>
                <TableCell>14,200 Recipients</TableCell>
                <TableCell style={{ color: '#10B981', fontWeight: 700 }}>Variant B (Doctor Signature Preview)</TableCell>
                <TableCell style={{ color: '#38BDF8', fontWeight: 800 }}>+36.4%</TableCell>
                <TableCell>99.2% (Significant)</TableCell>
                <TableCell style={{ textAlign: 'right' }}><Badge variant="success">Completed</Badge></TableCell>
              </TableRow>
              <TableRow>
                <TableCell>
                  <strong>Cardiac Camp WhatsApp Button Text</strong>
                </TableCell>
                <TableCell><Badge variant="primary">WhatsApp</Badge></TableCell>
                <TableCell>8,500 Recipients</TableCell>
                <TableCell style={{ color: '#10B981', fontWeight: 700 }}>Variant A (📅 Book Free Slot)</TableCell>
                <TableCell style={{ color: '#38BDF8', fontWeight: 800 }}>+42.1%</TableCell>
                <TableCell>98.7% (Significant)</TableCell>
                <TableCell style={{ textAlign: 'right' }}><Badge variant="success">Completed</Badge></TableCell>
              </TableRow>
              <TableRow>
                <TableCell>
                  <strong>ABHA Registration SMS Header</strong>
                </TableCell>
                <TableCell><Badge variant="neutral">SMS</Badge></TableCell>
                <TableCell>22,000 Recipients</TableCell>
                <TableCell style={{ color: '#10B981', fontWeight: 700 }}>Variant B (Govt ABHA Ayushman)</TableCell>
                <TableCell style={{ color: '#38BDF8', fontWeight: 800 }}>+28.5%</TableCell>
                <TableCell>97.5% (Significant)</TableCell>
                <TableCell style={{ textAlign: 'right' }}><Badge variant="success">Completed</Badge></TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
    </div>
  );
};
