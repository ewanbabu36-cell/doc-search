import React from 'react';
import { Badge, Button } from '@docsearch/ui-kit';

export interface AntibiogramRecommendationBannerProps {
  prescribedDrugName: string;
  facilityResistanceRate?: number | undefined;
  alertSeverity?: 'SAFE' | 'CAUTION_MONITOR' | 'CRITICAL_RESISTANCE_WARNING' | undefined;
  recommendedAlternatives?: Array<{
    drugName: string;
    sensitivityRate: number;
    awareCategory: 'ACCESS' | 'WATCH' | 'RESERVE';
    dosageGuidance: string;
  }> | undefined;
  onSelectAlternative?: ((altDrugName: string) => void) | undefined;
}

export const AntibiogramRecommendationBanner: React.FC<AntibiogramRecommendationBannerProps> = ({
  prescribedDrugName,
  facilityResistanceRate = 74,
  alertSeverity = 'CRITICAL_RESISTANCE_WARNING',
  recommendedAlternatives = [
    {
      drugName: 'Amikacin 15 mg/kg IV OD',
      sensitivityRate: 88,
      awareCategory: 'ACCESS',
      dosageGuidance: 'High sensitivity (88%). Renal monitoring recommended.'
    },
    {
      drugName: 'Piperacillin + Tazobactam 4.5g IV Q8H',
      sensitivityRate: 82,
      awareCategory: 'WATCH',
      dosageGuidance: 'Broad spectrum coverage for suspected sepsis.'
    },
    {
      drugName: 'Nitrofurantoin 100mg PO BD (If UTI)',
      sensitivityRate: 91,
      awareCategory: 'ACCESS',
      dosageGuidance: '91% sensitive in urinary isolates. Access group agent.'
    }
  ],
  onSelectAlternative
}) => {
  if (alertSeverity === 'SAFE') return null;

  const isCritical = alertSeverity === 'CRITICAL_RESISTANCE_WARNING';

  return (
    <div
      style={{
        margin: '12px 0',
        padding: '12px 16px',
        borderRadius: '8px',
        backgroundColor: isCritical ? 'rgba(239, 68, 68, 0.08)' : 'rgba(245, 158, 11, 0.08)',
        border: `1.5px solid ${isCritical ? '#EF4444' : '#F59E0B'}`,
        display: 'flex',
        flexDirection: 'column',
        gap: '10px'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '1.25rem' }}>{isCritical ? '🛑' : '⚠️'}</span>
          <div>
            <div style={{ fontSize: '0.88rem', fontWeight: 700, color: isCritical ? '#EF4444' : '#F59E0B' }}>
              Hospital Antibiogram CDSS Warning: High Institutional Resistance
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--ds-color-text-muted)' }}>
              Microbiology Laboratory Sentinel • Evidence-Based Antimicrobial Stewardship (WHO AWaRe)
            </div>
          </div>
        </div>
        <Badge variant={isCritical ? 'danger' : 'warning'}>
          {prescribedDrugName}: {facilityResistanceRate}% RESISTANT
        </Badge>
      </div>

      <div style={{ fontSize: '0.78rem', color: 'var(--ds-color-text-secondary)', lineHeight: 1.4 }}>
        Prescribing <strong>{prescribedDrugName}</strong> carries a high risk of therapeutic failure due to{' '}
        <strong>{facilityResistanceRate}% local pathogen resistance</strong> recorded in this hospital over the last 12 months.
        Consider switching to a high-sensitivity institutional alternative:
      </div>

      {/* Suggested Alternatives list */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '8px' }}>
        {recommendedAlternatives.map((alt) => (
          <div
            key={alt.drugName}
            style={{
              padding: '8px 12px',
              borderRadius: '6px',
              backgroundColor: 'var(--ds-color-surface, #0F172A)',
              border: '1px solid var(--ds-color-border, #334155)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: '6px'
            }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 700, fontSize: '0.82rem', color: 'var(--ds-color-text-primary)' }}>
                  {alt.drugName}
                </span>
                <span
                  style={{
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    color: '#10B981',
                    backgroundColor: 'rgba(16, 185, 129, 0.15)',
                    padding: '2px 6px',
                    borderRadius: '4px'
                  }}
                >
                  {alt.sensitivityRate}% SENSITIVE
                </span>
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--ds-color-text-muted)', marginTop: '2px' }}>
                {alt.dosageGuidance}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
              <span
                style={{
                  fontSize: '0.65rem',
                  fontWeight: 600,
                  color: alt.awareCategory === 'ACCESS' ? '#38BDF8' : '#F59E0B'
                }}
              >
                WHO: {alt.awareCategory}
              </span>
              {onSelectAlternative && (
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => onSelectAlternative(alt.drugName)}
                >
                  Adopt Alternative
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
