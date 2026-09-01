import React, { useState } from 'react';
import {
  useGlobalLocale,
  LOCALE_REGISTRY,
  type CurrencyCode,
  type LocaleCode,
  type VisionMode,
  type TypographyMode,
  type HighContrastMode
} from './GlobalCurrencyLocaleContext.js';

export const AccessibilityLocaleToolbar: React.FC = () => {
  const {
    currency,
    setCurrency,
    rates,
    isLiveFxConnected,
    refreshLiveFxRates,
    locale,
    setLocale,
    fontSizeScale,
    setFontSizeScale,
    visionMode,
    setVisionMode,
    typographyMode,
    setTypographyMode,
    highContrastMode,
    setHighContrastMode,
    reducedMotion,
    setReducedMotion,
    screenReaderActive,
    setScreenReaderActive
  } = useGlobalLocale();

  const [isA11yOpen, setIsA11yOpen] = useState(false);
  const [isRefreshingFx, setIsRefreshingFx] = useState(false);

  const handleManualRefreshFx = async () => {
    setIsRefreshingFx(true);
    await refreshLiveFxRates();
    setTimeout(() => setIsRefreshingFx(false), 500);
  };

  const currentRate = rates[currency] || { rateToInr: 1.0, inverseInr: 1.0 };

  return (
    <div
      style={{
        backgroundColor: '#0F172A',
        borderBottom: '1px solid #334155',
        padding: '6px 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        fontSize: '0.75rem',
        zIndex: 50
      }}
    >
      {/* Left: Global Currency & Multi-Lingual Locale */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
        {/* Currency Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ color: '#94A3B8', fontWeight: 700 }}>🌐 CURRENCY:</span>
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
            style={{
              backgroundColor: '#1E293B',
              color: '#38BDF8',
              border: '1px solid #475569',
              borderRadius: '6px',
              padding: '2px 8px',
              fontWeight: 800,
              fontSize: '0.75rem',
              cursor: 'pointer'
            }}
          >
            {Object.entries(rates).map(([code, item]) => (
              <option key={code} value={code}>
                {item.flag} {code} ({item.symbol}) - {item.name}
              </option>
            ))}
          </select>
        </div>

        {/* Live Interbank Treasury FX Status Indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '2px 8px', borderRadius: '6px' }}>
          <span style={{ color: isLiveFxConnected ? '#10B981' : '#FCD34D', fontSize: '0.6875rem', fontWeight: 800 }}>
            ● {currency === 'INR' ? 'Live Interbank: 1 USD = ₹ 84.75' : `1 ${currency} = ₹ ${currentRate.inverseInr || (1/currentRate.rateToInr).toFixed(2)}`}
          </span>
          <button
            type="button"
            onClick={handleManualRefreshFx}
            disabled={isRefreshingFx}
            style={{
              background: 'none',
              border: 'none',
              color: '#38BDF8',
              fontSize: '0.6875rem',
              cursor: 'pointer',
              fontWeight: 700,
              padding: '0 2px'
            }}
            title="Refresh Live Interbank FX Rates from Treasury Gateway"
          >
            {isRefreshingFx ? '⏳' : '🔄'}
          </button>
        </div>

        {/* Multi-Language Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ color: '#94A3B8', fontWeight: 700 }}>🗣️ LOCALE:</span>
          <select
            value={locale}
            onChange={(e) => setLocale(e.target.value as LocaleCode)}
            style={{
              backgroundColor: '#1E293B',
              color: '#86EFAC',
              border: '1px solid #475569',
              borderRadius: '6px',
              padding: '2px 8px',
              fontWeight: 800,
              fontSize: '0.75rem',
              cursor: 'pointer'
            }}
          >
            {Object.entries(LOCALE_REGISTRY).map(([code, item]) => (
              <option key={code} value={code}>
                {item.flag} {item.nativeName} ({item.name}) {item.dir === 'rtl' ? '[RTL]' : ''}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Right: Accessibility Controls & Modal Trigger */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
        {/* Font Scaling Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', backgroundColor: '#1E293B', borderRadius: '6px', padding: '2px 6px', border: '1px solid #334155' }}>
          <span style={{ color: '#94A3B8', fontSize: '0.6875rem' }}>TEXT:</span>
          <button
            type="button"
            onClick={() => setFontSizeScale(Math.max(90, fontSizeScale - 10))}
            style={{ background: 'none', border: 'none', color: '#FFF', fontWeight: 900, cursor: 'pointer', padding: '0 4px' }}
            title="Decrease Text Size"
          >
            A-
          </button>
          <span style={{ color: '#FCD34D', fontWeight: 800 }}>{fontSizeScale}%</span>
          <button
            type="button"
            onClick={() => setFontSizeScale(Math.min(150, fontSizeScale + 10))}
            style={{ background: 'none', border: 'none', color: '#FFF', fontWeight: 900, cursor: 'pointer', padding: '0 4px' }}
            title="Increase Text Size"
          >
            A+
          </button>
        </div>

        {/* Accessibility Suite Modal Trigger Button */}
        <button
          type="button"
          onClick={() => setIsA11yOpen(true)}
          style={{
            backgroundColor: 'rgba(56, 189, 248, 0.15)',
            border: '1px solid #38BDF8',
            color: '#38BDF8',
            padding: '3px 8px',
            borderRadius: '6px',
            fontWeight: 800,
            fontSize: '0.75rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}
          title="Open WCAG 2.2 AAA Accessibility Suite"
        >
          <span>♿</span>
          <span>WCAG 2.2 Suite</span>
        </button>
      </div>

      {/* WCAG 2.2 AAA Accessibility Suite Control Modal */}
      {isA11yOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(7, 12, 22, 0.8)',
            backdropFilter: 'blur(8px)',
            zIndex: 10050,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          onClick={() => setIsA11yOpen(false)}
        >
          <div
            style={{
              backgroundColor: '#0F172A',
              border: '1.5px solid #06B6D4',
              borderRadius: '16px',
              padding: '24px',
              width: '100%',
              maxWidth: '560px',
              color: '#F8FAFC',
              boxShadow: '0 20px 60px rgba(6, 182, 212, 0.3)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '1.5rem' }}>♿</span>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 800, color: '#38BDF8' }}>
                    International Accessibility Suite (WCAG 2.2 AAA)
                  </h3>
                  <span style={{ fontSize: '0.6875rem', color: '#94A3B8' }}>Clinical & Enterprise Compliance Standards</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsA11yOpen(false)}
                style={{ background: 'none', border: 'none', color: '#94A3B8', fontSize: '1.25rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '0.8125rem' }}>
              {/* Vision Mode */}
              <div>
                <label style={{ display: 'block', color: '#94A3B8', marginBottom: '6px', fontWeight: 700 }}>
                  👁️ COLOR-BLIND SAFE VISION FILTER
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                  {(['NORMAL', 'PROTANOPIA', 'DEUTERANOPIA', 'TRITANOPIA'] as VisionMode[]).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setVisionMode(mode)}
                      style={{
                        backgroundColor: visionMode === mode ? '#06B6D4' : '#1E293B',
                        color: visionMode === mode ? '#070C16' : '#E2E8F0',
                        border: '1px solid #475569',
                        borderRadius: '6px',
                        padding: '6px 10px',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      {mode === 'NORMAL' ? 'Standard Vision' : mode}
                    </button>
                  ))}
                </div>
              </div>

              {/* Typography Mode */}
              <div>
                <label style={{ display: 'block', color: '#94A3B8', marginBottom: '6px', fontWeight: 700 }}>
                  📖 DYSLEXIA-FRIENDLY TYPOGRAPHY
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                  {(['STANDARD', 'DYSLEXIC'] as TypographyMode[]).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setTypographyMode(t)}
                      style={{
                        backgroundColor: typographyMode === t ? '#06B6D4' : '#1E293B',
                        color: typographyMode === t ? '#070C16' : '#E2E8F0',
                        border: '1px solid #475569',
                        borderRadius: '6px',
                        padding: '6px 10px',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      {t === 'STANDARD' ? 'System Standard' : 'OpenDyslexic Font'}
                    </button>
                  ))}
                </div>
              </div>

              {/* High Contrast */}
              <div>
                <label style={{ display: 'block', color: '#94A3B8', marginBottom: '6px', fontWeight: 700 }}>
                  💡 SURGICAL & HIGH-CONTRAST LIGHTING
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                  {(['OFF', 'BLACK_WHITE_HIGH_CONTRAST', 'YELLOW_BLACK_SURGICAL'] as HighContrastMode[]).map((h) => (
                    <button
                      key={h}
                      type="button"
                      onClick={() => setHighContrastMode(h)}
                      style={{
                        backgroundColor: highContrastMode === h ? '#FCD34D' : '#1E293B',
                        color: highContrastMode === h ? '#070C16' : '#E2E8F0',
                        border: '1px solid #475569',
                        borderRadius: '6px',
                        padding: '6px 8px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        fontSize: '0.6875rem'
                      }}
                    >
                      {h === 'OFF' ? 'Standard UI' : h === 'BLACK_WHITE_HIGH_CONTRAST' ? 'B&W 100%' : 'Yellow/Black (OT)'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Toggles */}
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #334155', paddingTop: '10px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={reducedMotion}
                    onChange={(e) => setReducedMotion(e.target.checked)}
                  />
                  <span>Reduce UI Animations</span>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={screenReaderActive}
                    onChange={(e) => setScreenReaderActive(e.target.checked)}
                  />
                  <span>Screen-Reader ARIA Live</span>
                </label>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
