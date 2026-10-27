import React, { useState } from 'react';

export interface FinancialHealthStripProps {
  walletBalance?: number;
  walletBonusRatePct?: number;
  monthlyBudgetRemaining?: number;
  monthlyTotalBudget?: number;
  preApprovedEmiAmount?: number;
  onTopUpWallet?: (amount: number) => void;
  onViewWalletLedger?: () => void;
  onApplyEmiFinancing?: (packageAmount: number, tenureMonths: number) => void;
  isDarkMode?: boolean;
}

export const FinancialHealthStrip: React.FC<FinancialHealthStripProps> = ({
  walletBalance = 4250,
  walletBonusRatePct = 10,
  monthlyBudgetRemaining = 8500,
  monthlyTotalBudget = 15000,
  preApprovedEmiAmount = 250000,
  onTopUpWallet,
  onViewWalletLedger,
  onApplyEmiFinancing,
  isDarkMode = true
}) => {
  const [showEmiModal, setShowEmiModal] = useState(false);
  const [selectedSurgeryPackage, setSelectedSurgeryPackage] = useState<'CATARACT' | 'GALLBLADDER' | 'KNEE_REPLACEMENT' | 'HERNIA'>('GALLBLADDER');
  const [selectedTenure, setSelectedTenure] = useState<3 | 6 | 12>(6);

  const surgeryPackages = {
    CATARACT: { label: 'Advanced Phaco Cataract (Both Eyes)', amount: 45000 },
    GALLBLADDER: { label: 'Laparoscopic Cholecystectomy (Gallbladder)', amount: 65000 },
    HERNIA: { label: 'Mesh Repair Inguinal Hernia Surgery', amount: 55000 },
    KNEE_REPLACEMENT: { label: 'Robotic Total Knee Replacement (Unilateral)', amount: 165000 }
  };

  const currentPkg = surgeryPackages[selectedSurgeryPackage];
  const monthlyEmi = Math.round(currentPkg.amount / selectedTenure);

  const textColor = isDarkMode ? '#F8FAFC' : '#0F172A';
  const subTextColor = isDarkMode ? '#94A3B8' : '#64748B';

  return (
    <div role="region" aria-label="Health Financing and Wallet" style={{ margin: '6px 0' }}>
      <div
        style={{
          display: 'flex',
          gap: '12px',
          overflowX: 'auto',
          paddingBottom: '8px',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none'
        }}
      >
        {/* Card A: Family Health Wallet */}
        <div
          style={{
            minWidth: '280px',
            flex: '1 0 280px',
            background: isDarkMode
              ? 'linear-gradient(135deg, #1E1B4B 0%, #0F172A 100%)'
              : 'linear-gradient(135deg, #EEF2FF 0%, #FFFFFF 100%)',
            border: isDarkMode ? '1px solid rgba(99, 102, 241, 0.3)' : '1px solid rgba(99, 102, 241, 0.2)',
            borderRadius: '20px',
            padding: '16px',
            color: textColor,
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12)',
            position: 'relative'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '1.25rem' }}>💰</span>
              <span style={{ fontSize: '0.8125rem', fontWeight: 800, color: '#818CF8' }}>
                FAMILY HEALTH WALLET
              </span>
            </div>
            {onViewWalletLedger && (
              <button
                type="button"
                onClick={onViewWalletLedger}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#818CF8',
                  fontSize: '0.6875rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                Passbook ➔
              </button>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
            <span style={{ fontSize: '1.5rem', fontWeight: 900 }}>
              ₹{walletBalance.toLocaleString('en-IN')}
            </span>
            <span
              style={{
                fontSize: '0.625rem',
                backgroundColor: 'rgba(16, 185, 129, 0.15)',
                color: '#10B981',
                padding: '2px 6px',
                borderRadius: '6px',
                fontWeight: 800
              }}
            >
              +{walletBonusRatePct}% Cash Bonus Active
            </span>
          </div>

          <div style={{ fontSize: '0.6875rem', color: subTextColor, marginTop: '4px' }}>
            Shared Family Limit: ₹{monthlyBudgetRemaining.toLocaleString('en-IN')} left of ₹{monthlyTotalBudget.toLocaleString('en-IN')}
          </div>

          {/* Quick Top-up Chips */}
          <div style={{ display: 'flex', gap: '6px', marginTop: '12px' }}>
            {[500, 1000, 2000].map((amt) => (
              <button
                key={amt}
                type="button"
                onClick={() => onTopUpWallet?.(amt)}
                style={{
                  flex: 1,
                  background: isDarkMode ? '#1E293B' : '#FFFFFF',
                  border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.12)' : '1px solid #CBD5E1',
                  color: textColor,
                  borderRadius: '10px',
                  padding: '6px 4px',
                  fontSize: '0.6875rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  textAlign: 'center',
                  transition: 'all 0.15s ease'
                }}
              >
                +₹{amt}
              </button>
            ))}
          </div>
        </div>

        {/* Card B: 0% Surgery Checkout Financing */}
        <div
          style={{
            minWidth: '280px',
            flex: '1 0 280px',
            background: isDarkMode
              ? 'linear-gradient(135deg, #064E3B 0%, #0F172A 100%)'
              : 'linear-gradient(135deg, #ECFDF5 0%, #FFFFFF 100%)',
            border: isDarkMode ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(16, 185, 129, 0.25)',
            borderRadius: '20px',
            padding: '16px',
            color: textColor,
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12)',
            position: 'relative'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '1.25rem' }}>🏥</span>
              <span style={{ fontSize: '0.8125rem', fontWeight: 800, color: '#34D399' }}>
                0% SURGERY FINANCING
              </span>
            </div>
            <span
              style={{
                fontSize: '0.625rem',
                backgroundColor: '#10B981',
                color: '#FFFFFF',
                padding: '2px 6px',
                borderRadius: '6px',
                fontWeight: 900
              }}
            >
              PRE-APPROVED
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
            <span style={{ fontSize: '1.5rem', fontWeight: 900 }}>
              ₹{preApprovedEmiAmount.toLocaleString('en-IN')}
            </span>
            <span style={{ fontSize: '0.6875rem', color: subTextColor }}>
              Zero Down Payment
            </span>
          </div>

          <div style={{ fontSize: '0.6875rem', color: subTextColor, marginTop: '4px' }}>
            Cataract, Laparoscopic, Ortho & Maternity surgeries with 3/6/12 mo split.
          </div>

          <button
            type="button"
            onClick={() => setShowEmiModal(true)}
            style={{
              width: '100%',
              marginTop: '12px',
              backgroundColor: '#10B981',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '10px',
              padding: '7px 10px',
              fontSize: '0.75rem',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)'
            }}
          >
            🧮 Calculate EMI (0% Interest)
          </button>
        </div>
      </div>

      {/* 0% Surgery EMI Calculator Modal */}
      {showEmiModal && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 100,
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px'
          }}
          onClick={() => setShowEmiModal(false)}
        >
          <div
            style={{
              backgroundColor: isDarkMode ? '#0F172A' : '#FFFFFF',
              border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.15)' : '1px solid #E2E8F0',
              borderRadius: '24px',
              padding: '24px',
              maxWidth: '440px',
              width: '100%',
              color: textColor,
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 800 }}>
                  🏥 0% Medical Surgery EMI Calculator
                </h3>
                <p style={{ margin: '2px 0 0 0', fontSize: '0.75rem', color: subTextColor }}>
                  Doctor consultations, OT charges & implants bundled into 0% monthly EMIs.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowEmiModal(false)}
                style={{ background: 'transparent', border: 'none', fontSize: '1.25rem', color: subTextColor, cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            {/* Surgery Package Selector */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: subTextColor, display: 'block', marginBottom: '6px' }}>
                Select Planned Surgery Package:
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {(Object.keys(surgeryPackages) as Array<keyof typeof surgeryPackages>).map((key) => {
                  const pkg = surgeryPackages[key];
                  const isSel = selectedSurgeryPackage === key;
                  return (
                    <div
                      key={key}
                      onClick={() => setSelectedSurgeryPackage(key)}
                      style={{
                        padding: '10px 12px',
                        borderRadius: '12px',
                        background: isSel
                          ? isDarkMode ? 'rgba(16, 185, 129, 0.2)' : '#ECFDF5'
                          : isDarkMode ? '#1E293B' : '#F8FAFC',
                        border: isSel ? '2px solid #10B981' : isDarkMode ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #E2E8F0',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        cursor: 'pointer'
                      }}
                    >
                      <span style={{ fontSize: '0.8125rem', fontWeight: 700 }}>{pkg.label}</span>
                      <span style={{ fontSize: '0.8125rem', fontWeight: 900, color: '#10B981' }}>
                        ₹{pkg.amount.toLocaleString('en-IN')}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Tenure Selector */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: subTextColor, display: 'block', marginBottom: '6px' }}>
                Select EMI Tenure (Zero Extra Charges):
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                {([3, 6, 12] as const).map((tenure) => {
                  const isSel = selectedTenure === tenure;
                  return (
                    <button
                      key={tenure}
                      type="button"
                      onClick={() => setSelectedTenure(tenure)}
                      style={{
                        flex: 1,
                        padding: '10px 6px',
                        borderRadius: '12px',
                        background: isSel ? '#10B981' : isDarkMode ? '#1E293B' : '#F1F5F9',
                        color: isSel ? '#FFFFFF' : textColor,
                        border: 'none',
                        fontWeight: 800,
                        fontSize: '0.8125rem',
                        cursor: 'pointer',
                        textAlign: 'center'
                      }}
                    >
                      {tenure} Months
                    </button>
                  );
                })}
              </div>
            </div>

            {/* EMI Breakdown Result */}
            <div
              style={{
                backgroundColor: isDarkMode ? '#1E293B' : '#F8FAFC',
                borderRadius: '16px',
                padding: '16px',
                marginBottom: '20px',
                border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #E2E8F0'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontSize: '0.75rem', color: subTextColor }}>Monthly 0% EMI:</span>
                <span style={{ fontSize: '1.25rem', fontWeight: 900, color: '#10B981' }}>
                  ₹{monthlyEmi.toLocaleString('en-IN')} / mo
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.6875rem', color: subTextColor }}>
                <span>Interest & Processing Fee:</span>
                <span style={{ fontWeight: 800, color: '#10B981' }}>₹0 (Subvention Covered by Hospital)</span>
              </div>
            </div>

            {/* Apply CTA */}
            <button
              type="button"
              onClick={() => {
                setShowEmiModal(false);
                onApplyEmiFinancing?.(currentPkg.amount, selectedTenure);
              }}
              style={{
                width: '100%',
                backgroundColor: '#10B981',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '14px',
                padding: '12px',
                fontSize: '0.875rem',
                fontWeight: 800,
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(16, 185, 129, 0.4)'
              }}
            >
              🚀 Instant Pre-Approval in 60 Seconds
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
