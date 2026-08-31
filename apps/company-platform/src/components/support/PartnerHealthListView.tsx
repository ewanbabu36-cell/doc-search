import React from 'react';
import type { PartnerHealthDto } from '@docsearch/api-contracts';
import {
  Card,
  Badge,
  TableContainer,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell
} from '@docsearch/ui-kit';

export interface PartnerHealthListViewProps {
  healthProfiles: PartnerHealthDto[];
}

export const PartnerHealthListView: React.FC<PartnerHealthListViewProps> = ({
  healthProfiles
}) => {
  return (
    <Card
      title="Partner Health Score Matrix"
      subtitle="Operational health scores, unresolved case counts, and retention risk factors for healthcare networks"
      padding="none"
    >
      <TableContainer style={{ border: 'none', borderRadius: '0' }}>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Partner Account</TableHead>
              <TableHead>Health Classification</TableHead>
              <TableHead>Health Score</TableHead>
              <TableHead>Active Tickets</TableHead>
              <TableHead>SLA Breaches</TableHead>
              <TableHead>Risk Factors & Alerts</TableHead>
              <TableHead>Assigned CSM Lead</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {healthProfiles.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} style={{ textAlign: 'center', color: 'var(--ds-color-text-muted)', padding: '24px' }}>
                  No partner health profiles registered.
                </TableCell>
              </TableRow>
            ) : (
              healthProfiles.map((h) => (
                <TableRow key={h.id}>
                  <TableCell>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <strong style={{ color: 'var(--ds-color-text-primary)' }}>{h.partnerTradeName}</strong>
                      <span style={{ fontFamily: 'var(--ds-font-mono)', fontSize: '0.75rem', color: 'var(--ds-color-text-muted)' }}>
                        {h.partnerTenantSlug}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        h.healthStatus === 'HEALTHY'
                          ? 'success'
                          : h.healthStatus === 'AT_RISK'
                          ? 'warning'
                          : h.healthStatus === 'CRITICAL'
                          ? 'danger'
                          : 'neutral'
                      }
                    >
                      {h.healthStatus}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontWeight: '700', fontSize: '1rem' }}>{h.healthScore}</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-muted)' }}>/ 100</span>
                    </div>
                  </TableCell>
                  <TableCell style={{ fontWeight: '500' }}>{h.activeTicketsCount}</TableCell>
                  <TableCell>
                    {h.slaBreachCount > 0 ? (
                      <Badge variant="danger">{h.slaBreachCount} Breached</Badge>
                    ) : (
                      <span style={{ color: 'var(--ds-color-success)', fontSize: '0.8125rem' }}>0 Breaches</span>
                    )}
                  </TableCell>
                  <TableCell style={{ fontSize: '0.8125rem' }}>
                    {h.riskFactors.length === 0 ? (
                      <span style={{ color: 'var(--ds-color-text-muted)' }}>None identified</span>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        {h.riskFactors.map((rf, idx) => (
                          <span key={idx} style={{ color: 'var(--ds-color-warning)', fontWeight: '500' }}>
                            ⚠ {rf}
                          </span>
                        ))}
                      </div>
                    )}
                  </TableCell>
                  <TableCell style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-secondary)' }}>
                    {h.assignedSuccessLeadEmail}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Card>
  );
};
