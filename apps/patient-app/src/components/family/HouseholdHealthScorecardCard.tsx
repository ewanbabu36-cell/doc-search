import React, { useState } from 'react';
import { Card, Badge, Button } from '@docsearch/ui-kit';

export interface HouseholdMember {
  name: string;
  relationship: string;
  compliancePercent: number;
  condition: string;
}

export interface HouseholdHealthScorecardProps {
  householdName?: string | undefined;
  overallScore?: number | undefined; // 0-100
  daysToRefillExhaustion?: number | undefined; // e.g. 3 days left
  onOrderRefill?: (() => void) | undefined;
  onBookCheckup?: (() => void) | undefined;
}

export const HouseholdHealthScorecardCard: React.FC<HouseholdHealthScorecardProps> = ({
  householdName = 'Sharma Family Circle',
  overallScore = 88,
  daysToRefillExhaustion = 3,
  onOrderRefill,
  onBookCheckup
}) => {
  const [refillOrdered, setRefillOrdered] = useState(false);

  const handleRefillClick = () => {
    setRefillOrdered(true);
    if (onOrderRefill) onOrderRefill();
  };

  const getScoreColor = (score: number) => {
    if (score >= 85) return '#10B981';
    if (score >= 70) return '#F59E0B';
    return '#EF4444';
  };

  const scoreColor = getScoreColor(overallScore);

  return (
    <Card
      variant="elevated"
      className="ds-household-scorecard"
      style={{
        background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
        border: '1.5px solid rgba(56, 189, 248, 0.25)',
        borderRadius: '16px',
        padding: '20px',
        color: '#F8FAFC',
        margin: '16px 0',
        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)'
      }}
    >
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '1.25rem' }}>🛡️</span>
            <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#F8FAFC' }}>
              Household Health Scorecard
            </span>
            <Badge variant="success">Tier: Elite Care</Badge>
          </div>
          <div style={{ fontSize: '0.78rem', color: '#94A3B8', marginTop: '4px' }}>
            {householdName} • 3 Active Family Members Protected
          </div>
        </div>

        {/* Circular Health Score Badge */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            backgroundColor: 'rgba(15, 23, 42, 0.8)',
            padding: '8px 16px',
            borderRadius: '12px',
            border: `1.5px solid ${scoreColor}`
          }}
        >
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.68rem', textTransform: 'uppercase', color: '#94A3B8', fontWeight: 700 }}>
              Wellness Index
            </div>
            <div style={{ fontSize: '0.72rem', color: '#E2E8F0' }}>Top 5% in Community</div>
          </div>
          <div
            style={{
              fontSize: '1.65rem',
              fontWeight: 900,
              color: scoreColor,
              minWidth: '48px',
              textAlign: 'center'
            }}
          >
            {overallScore}
            <span style={{ fontSize: '0.75rem', fontWeight: 400, color: '#94A3B8' }}>/100</span>
          </div>
        </div>
      </div>

      {/* 4 Health Pillars Breakdown */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
          gap: '10px',
          marginTop: '16px'
        }}
      >
        <div style={{ backgroundColor: 'rgba(30, 41, 59, 0.7)', padding: '10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ fontSize: '0.7rem', color: '#94A3B8' }}>💊 Med Adherence</div>
          <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#38BDF8', marginTop: '4px' }}>28 / 30 pts</div>
          <div style={{ fontSize: '0.65rem', color: '#10B981', marginTop: '2px' }}>93% dose regularity</div>
        </div>

        <div style={{ backgroundColor: 'rgba(30, 41, 59, 0.7)', padding: '10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ fontSize: '0.7rem', color: '#94A3B8' }}>🧪 Lab Diagnostics</div>
          <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#38BDF8', marginTop: '4px' }}>26 / 30 pts</div>
          <div style={{ fontSize: '0.65rem', color: '#F59E0B', marginTop: '2px' }}>1 Test Due in 14d</div>
        </div>

        <div style={{ backgroundColor: 'rgba(30, 41, 59, 0.7)', padding: '10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ fontSize: '0.7rem', color: '#94A3B8' }}>💉 Immunizations</div>
          <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#38BDF8', marginTop: '4px' }}>18 / 20 pts</div>
          <div style={{ fontSize: '0.65rem', color: '#10B981', marginTop: '2px' }}>All Vaccinated</div>
        </div>

        <div style={{ backgroundColor: 'rgba(30, 41, 59, 0.7)', padding: '10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ fontSize: '0.7rem', color: '#94A3B8' }}>🩺 Health Screenings</div>
          <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#38BDF8', marginTop: '4px' }}>16 / 20 pts</div>
          <div style={{ fontSize: '0.65rem', color: '#38BDF8', marginTop: '2px' }}>Annual check on track</div>
        </div>
      </div>

      {/* 🚀 1-Tap Chronic Dawa Smart-Refill Flywheel Callout */}
      <div
        style={{
          marginTop: '16px',
          padding: '14px 16px',
          borderRadius: '12px',
          background: 'linear-gradient(90deg, rgba(239, 68, 68, 0.15) 0%, rgba(245, 158, 11, 0.15) 100%)',
          border: '1px solid rgba(239, 68, 68, 0.4)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              backgroundColor: 'rgba(239, 68, 68, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.25rem',
              color: '#F87171'
            }}
          >
            ⏰
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '0.9rem', color: '#FEF2F2' }}>
              Chronic Dawa Exhaustion Alert: {daysToRefillExhaustion} Days Left!
            </div>
            <div style={{ fontSize: '0.74rem', color: '#FECACA' }}>
              Telmisartan 40mg + Metformin 500mg running out for Ramesh Sharma.
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          {refillOrdered ? (
            <Badge variant="success">✓ Refill Dispatched (Arriving Tomorrow)</Badge>
          ) : (
            <Button
              variant="primary"
              size="sm"
              onClick={handleRefillClick}
              style={{
                backgroundColor: '#EF4444',
                borderColor: '#DC2626',
                color: '#FFFFFF',
                fontWeight: 700,
                boxShadow: '0 4px 14px rgba(239, 68, 68, 0.4)'
              }}
            >
              🚀 1-Tap Smart Refill (₹624 • 20% OFF)
            </Button>
          )}
          {onBookCheckup && (
            <Button variant="secondary" size="sm" onClick={onBookCheckup}>
              Book HbA1c Lab
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
};
