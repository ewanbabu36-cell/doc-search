import React, { useState } from 'react';

export type SmartNudgeType = 'FASTING_ADVISORY' | 'MEDICINE_REFILL' | 'POST_OP_FOLLOWUP' | 'VACCINE_DUE';

export interface SmartNudgeItem {
  id: string;
  type: SmartNudgeType;
  title: string;
  description: string;
  icon: string;
  deadlineOrTime?: string;
  primaryCtaLabel: string;
  primaryCtaAction: () => void;
  urgencyLevel?: 'CRITICAL' | 'WARNING' | 'INFO';
}

export interface SmartNudgeBannerProps {
  nudges?: SmartNudgeItem[];
  isDarkMode?: boolean;
}

export const SmartNudgeBanner: React.FC<SmartNudgeBannerProps> = ({
  nudges = [
    {
      id: 'NUDGE-001',
      type: 'FASTING_ADVISORY',
      title: 'Fasting Advisory for Tomorrow Morning (07:30 AM)',
      description: 'Your Fasting Blood Sugar & Lipid Profile sample collection requires strict 10-12 hours fasting. Avoid food or tea after 09:30 PM tonight.',
      icon: '⚠️',
      deadlineOrTime: 'Starts Tonight 09:30 PM',
      primaryCtaLabel: 'Read Fasting Guide',
      primaryCtaAction: () => alert('Fasting Guide: Drink plain water only. Do not take diabetic tablets before sample draw.'),
      urgencyLevel: 'WARNING'
    },
    {
      id: 'NUDGE-002',
      type: 'MEDICINE_REFILL',
      title: 'Chronic Prescription Refill Due (<3 Days Left)',
      description: 'Metformin 500mg SR & Telmisartan 40mg stock ending soon. 1-click Jan Aushadhi generic refill saves you 76%.',
      icon: '💊',
      deadlineOrTime: '2 Days Remaining',
      primaryCtaLabel: '1-Click Jan Aushadhi Refill (₹48)',
      primaryCtaAction: () => alert('Initiating Jan Aushadhi generic refill dispatch to home doorstep!'),
      urgencyLevel: 'CRITICAL'
    }
  ],
  isDarkMode = true
}) => {
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);
  const [activeNudgeIndex, setActiveNudgeIndex] = useState(0);

  const activeNudges = nudges.filter((n) => !dismissedIds.includes(n.id));

  if (activeNudges.length === 0) {
    return null; // Zero clutter when no actionable nudges exist!
  }

  const currentNudge = activeNudges[Math.min(activeNudgeIndex, activeNudges.length - 1)];
  if (!currentNudge) {
    return null;
  }

  const getUrgencyStyles = (urgency: SmartNudgeItem['urgencyLevel']) => {
    switch (urgency) {
      case 'CRITICAL':
        return {
          bg: isDarkMode
            ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.2) 0%, rgba(15, 23, 42, 0.95) 100%)'
            : 'linear-gradient(135deg, #FEF2F2 0%, #FFFFFF 100%)',
          border: isDarkMode ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid rgba(239, 68, 68, 0.3)',
          badgeBg: '#EF4444',
          badgeText: '#FFFFFF',
          btnBg: '#DC2626'
        };
      case 'WARNING':
        return {
          bg: isDarkMode
            ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.2) 0%, rgba(15, 23, 42, 0.95) 100%)'
            : 'linear-gradient(135deg, #FFFBEB 0%, #FFFFFF 100%)',
          border: isDarkMode ? '1px solid rgba(245, 158, 11, 0.4)' : '1px solid rgba(245, 158, 11, 0.3)',
          badgeBg: '#F59E0B',
          badgeText: '#000000',
          btnBg: '#D97706'
        };
      default:
        return {
          bg: isDarkMode
            ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(15, 23, 42, 0.95) 100%)'
            : 'linear-gradient(135deg, #EEF2FF 0%, #FFFFFF 100%)',
          border: isDarkMode ? '1px solid rgba(99, 102, 241, 0.4)' : '1px solid rgba(99, 102, 241, 0.3)',
          badgeBg: '#6366F1',
          badgeText: '#FFFFFF',
          btnBg: '#4F46E5'
        };
    }
  };

  const styles = getUrgencyStyles(currentNudge.urgencyLevel);
  const textColor = isDarkMode ? '#F8FAFC' : '#0F172A';
  const subTextColor = isDarkMode ? '#94A3B8' : '#475569';

  const handleDismiss = (id: string) => {
    setDismissedIds((prev) => [...prev, id]);
    if (activeNudgeIndex > 0) {
      setActiveNudgeIndex((prev) => prev - 1);
    }
  };

  return (
    <div
      role="alert"
      aria-live="polite"
      style={{
        background: styles.bg,
        border: styles.border,
        borderRadius: '20px',
        padding: '16px',
        color: textColor,
        boxShadow: isDarkMode ? '0 8px 24px rgba(0, 0, 0, 0.25)' : '0 6px 18px rgba(0, 0, 0, 0.05)',
        margin: '8px 0',
        position: 'relative'
      }}
    >
      {/* Top Banner Row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '1.25rem' }}>{currentNudge.icon}</span>
          <span
            style={{
              backgroundColor: styles.badgeBg,
              color: styles.badgeText,
              padding: '2px 8px',
              borderRadius: '6px',
              fontSize: '0.625rem',
              fontWeight: 900,
              letterSpacing: '0.04em'
            }}
          >
            ACTION REQUIRED
          </span>
          {currentNudge.deadlineOrTime && (
            <span style={{ fontSize: '0.6875rem', color: '#F59E0B', fontWeight: 700 }}>
              • {currentNudge.deadlineOrTime}
            </span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {activeNudges.length > 1 && (
            <div style={{ fontSize: '0.6875rem', color: subTextColor, marginRight: '4px' }}>
              {activeNudgeIndex + 1}/{activeNudges.length}
            </div>
          )}
          <button
            type="button"
            onClick={() => handleDismiss(currentNudge.id)}
            aria-label="Dismiss alert"
            style={{
              background: 'transparent',
              border: 'none',
              color: subTextColor,
              fontSize: '1rem',
              cursor: 'pointer',
              padding: '2px'
            }}
          >
            ✕
          </button>
        </div>
      </div>

      {/* Nudge Content */}
      <div style={{ fontSize: '0.9375rem', fontWeight: 800, color: textColor, marginBottom: '4px' }}>
        {currentNudge.title}
      </div>
      <div style={{ fontSize: '0.75rem', color: subTextColor, lineHeight: 1.4, marginBottom: '14px' }}>
        {currentNudge.description}
      </div>

      {/* Action Row */}
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        <button
          type="button"
          onClick={currentNudge.primaryCtaAction}
          style={{
            flex: 1,
            backgroundColor: styles.btnBg,
            color: '#FFFFFF',
            border: 'none',
            borderRadius: '12px',
            padding: '9px 14px',
            fontSize: '0.8125rem',
            fontWeight: 800,
            cursor: 'pointer',
            textAlign: 'center',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)'
          }}
        >
          {currentNudge.primaryCtaLabel}
        </button>

        <button
          type="button"
          onClick={() => handleDismiss(currentNudge.id)}
          style={{
            backgroundColor: isDarkMode ? '#1E293B' : '#F1F5F9',
            color: subTextColor,
            border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid #CBD5E1',
            borderRadius: '12px',
            padding: '9px 14px',
            fontSize: '0.8125rem',
            fontWeight: 700,
            cursor: 'pointer'
          }}
        >
          Snooze 4h
        </button>

        {activeNudges.length > 1 && (
          <button
            type="button"
            onClick={() => setActiveNudgeIndex((prev) => (prev + 1) % activeNudges.length)}
            style={{
              backgroundColor: isDarkMode ? '#1E293B' : '#F1F5F9',
              color: textColor,
              border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid #CBD5E1',
              borderRadius: '12px',
              padding: '9px 12px',
              fontSize: '0.8125rem',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            Next ➔
          </button>
        )}
      </div>
    </div>
  );
};
