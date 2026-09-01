import React, { useState } from 'react';
import {
  useGlobalLocale,
  CURRENCY_REGISTRY,
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
            {Object.entries(CURRENCY_REGISTRY).map(([code, item]) => (
              <option key={code} value={code}>
                {item.flag} {code} ({item.symbol}) - {item.name}
              </option>
            ))}
          </select>
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

        {/* Accessibility Modal Toggle Button */}
        <button
          type="button"
          onClick={() => setIsA11yOpen(!isA11yOpen)}
          style={{
            backgroundColor: isA11yOpen ? '#06B6D4' : '#1E293B',
            color: isA11yOpen ? '#070C16' : '#E2E8F0',
            border: '1px solid #06B6D4',
            borderRadius: '6px',
            padding: '3px 10px',
            fontWeight: 800,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <span>♿</span> WCAG 2.2 Accessibility Suite
        </button>
      </div>

      {/* Popover / Drawer for WCAG 2.2 Options */}
      {isA11yOpen && (
        <div
          style={{
            position: 'absolute',
            top: '42px',
            right: '16px',
            backgroundColor: '#0F172A',
            border: '1.5px solid #06B6D4',
            borderRadius: '12px',
            padding: '16px',
            width: '340px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.8)',
            zIndex: 10050,
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #334155', paddingBottom: '8px' }}>
            <strong style={{ color: '#06B6D4', fontSize: '0.875rem' }}>♿ WCAG 2.2 AAA Accessibility Console</strong>
            <button type="button" onClick={() => setIsA11yOpen(false)} style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer' }}>✕</button>
          </div>

          {/* Vision Filters */}
          <div>
            <label style={{ display: 'block', color: '#94A3B8', marginBottom: '4px', fontSize: '0.6875rem', fontWeight: 800 }}>
              COLOR-BLIND VISION CORRECTION
            </label>
            <select
              value={visionMode}
              onChange={(e) => setVisionMode(e.target.value as VisionMode)}
              style={{ width: '100%', backgroundColor: '#1E293B', color: '#FFF', border: '1px solid #475569', borderRadius: '6px', padding: '4px 8px', fontSize: '0.75rem' }}
            >
              <option value="NORMAL">Normal Trichromacy Vision</option>
              <option value="PROTANOPIA">Protanopia (Red-Blind Safe)</option>
              <option value="DEUTERANOPIA">Deuteranopia (Green-Blind Safe)</option>
              <option value="TRITANOPIA">Tritanopia (Blue-Blind Safe)</option>
            </select>
          </div>

          {/* Typography Mode */}
          <div>
            <label style={{ display: 'block', color: '#94A3B8', marginBottom: '4px', fontSize: '0.6875rem', fontWeight: 800 }}>
              DYSLEXIA-FRIENDLY TYPOGRAPHY
            </label>
            <select
              value={typographyMode}
              onChange={(e) => setTypographyMode(e.target.value as TypographyMode)}
              style={{ width: '100%', backgroundColor: '#1E293B', color: '#FFF', border: '1px solid #475569', borderRadius: '6px', padding: '4px 8px', fontSize: '0.75rem' }}
            >
              <option value="STANDARD">Standard Inter (Clinical Default)</option>
              <option value="DYSLEXIC">OpenDyslexic Heavy Baseline Font</option>
            </select>
          </div>

          {/* High Contrast Medical Mode */}
          <div>
            <label style={{ display: 'block', color: '#94A3B8', marginBottom: '4px', fontSize: '0.6875rem', fontWeight: 800 }}>
              SURGICAL HIGH-CONTRAST LIGHTING
            </label>
            <select
              value={highContrastMode}
              onChange={(e) => setHighContrastMode(e.target.value as HighContrastMode)}
              style={{ width: '100%', backgroundColor: '#1E293B', color: '#FFF', border: '1px solid #475569', borderRadius: '6px', padding: '4px 8px', fontSize: '0.75rem' }}
            >
              <option value="OFF">Standard Theme</option>
              <option value="BLACK_WHITE_HIGH_CONTRAST">Black & White (100% Contrast)</option>
              <option value="YELLOW_BLACK_SURGICAL">Yellow on Black (Surgical OT Mode)</option>
            </select>
          </div>

          {/* Reduced Motion & Screen Reader */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderTop: '1px solid #334155', paddingTop: '8px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: '#E2E8F0' }}>
              <input
                type="checkbox"
                checked={reducedMotion}
                onChange={(e) => setReducedMotion(e.target.checked)}
              />
              <span>🚫 Reduce Animations & Motion</span>
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: '#E2E8F0' }}>
              <input
                type="checkbox"
                checked={screenReaderActive}
                onChange={(e) => setScreenReaderActive(e.target.checked)}
              />
              <span>🔊 Screen Reader ARIA Live Telemetry</span>
            </label>
          </div>
        </div>
      )}
    </div>
  );
};
