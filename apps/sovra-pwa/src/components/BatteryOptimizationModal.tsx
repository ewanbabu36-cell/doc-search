// Sovra Android Battery Optimization Whitelist Guard
// Solves Weakness #2 (Aggressive OEM Task Killing on MIUI, Vivo, Oppo, Samsung)
// Guides patients to whitelist Sovra so live OPD token vibrations and doctor messages are never delayed.

import React, { useState, useEffect } from 'react';

interface BatteryOptimizationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type AndroidBrand = 'XIAOMI' | 'VIVO' | 'OPPO_REALME' | 'SAMSUNG' | 'ONEPLUS' | 'GENERAL';

export const BatteryOptimizationModal: React.FC<BatteryOptimizationModalProps> = ({ isOpen, onClose }) => {
  const [detectedBrand, setDetectedBrand] = useState<AndroidBrand>('GENERAL');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const ua = navigator.userAgent.toLowerCase();
      if (ua.includes('xiaomi') || ua.includes('redmi') || ua.includes('miui') || ua.includes('poco')) {
        setDetectedBrand('XIAOMI');
      } else if (ua.includes('vivo') || ua.includes('iqoo')) {
        setDetectedBrand('VIVO');
      } else if (ua.includes('oppo') || ua.includes('realme')) {
        setDetectedBrand('OPPO_REALME');
      } else if (ua.includes('samsung')) {
        setDetectedBrand('SAMSUNG');
      } else if (ua.includes('oneplus')) {
        setDetectedBrand('ONEPLUS');
      } else {
        setDetectedBrand('GENERAL');
      }
    }
  }, []);

  const [selectedBrand, setSelectedBrand] = useState<AndroidBrand>(detectedBrand);

  useEffect(() => {
    setSelectedBrand(detectedBrand);
  }, [detectedBrand]);

  if (!isOpen) return null;

  const handleMarkResolved = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('sovra_battery_opt_dismissed', 'true');
    }
    onClose();
  };

  const getBrandInstructions = (brand: AndroidBrand) => {
    switch (brand) {
      case 'XIAOMI':
        return {
          title: 'Xiaomi / Redmi / POCO (MIUI / HyperOS)',
          steps: [
            'Open Settings ⚙️ on your phone.',
            'Go to Apps ➔ Manage Apps ➔ Select "Sovra".',
            'Tap Battery Saver ➔ Select "No Restrictions".',
            'Enable Autostart toggle so token alerts ring immediately.'
          ],
          badgeColor: '#FF6900'
        };
      case 'VIVO':
        return {
          title: 'Vivo / iQOO (Funtouch OS / OriginOS)',
          steps: [
            'Open Settings ⚙️ on your phone.',
            'Go to Battery ➔ Background Power Consumption.',
            'Find "Sovra" ➔ Select "High Background Power Consumption".',
            'Lock Sovra in Recent Apps view (swipe down & tap padlock).'
          ],
          badgeColor: '#415FFF'
        };
      case 'OPPO_REALME':
        return {
          title: 'OPPO / Realme (ColorOS / Realme UI)',
          steps: [
            'Open Settings ⚙️ on your phone.',
            'Go to Battery ➔ App Battery Management ➔ "Sovra".',
            'Turn ON "Allow Background Activity".',
            'Turn ON "Allow Auto-launch".'
          ],
          badgeColor: '#008B45'
        };
      case 'SAMSUNG':
        return {
          title: 'Samsung Galaxy (One UI)',
          steps: [
            'Open Settings ⚙️ ➔ Apps ➔ Select "Sovra".',
            'Tap Battery ➔ Choose "Unrestricted" (Never sleep).',
            'Ensure "Remove permissions if app is unused" is turned OFF.'
          ],
          badgeColor: '#034EA2'
        };
      case 'ONEPLUS':
        return {
          title: 'OnePlus (OxygenOS)',
          steps: [
            'Open Settings ⚙️ ➔ Battery ➔ Battery Usage.',
            'Select "Sovra" ➔ Turn ON "Allow Background Activity".',
            'Set Battery Optimization to "Don\'t Optimize".'
          ],
          badgeColor: '#F50514'
        };
      default:
        return {
          title: 'Stock Android / Motorola / Pixel',
          steps: [
            'Open Settings ⚙️ ➔ Apps ➔ Select "Sovra".',
            'Tap App Battery Usage or Battery.',
            'Change setting from "Optimized" to "Unrestricted".',
            'Allow Background Data access.'
          ],
          badgeColor: '#10B981'
        };
    }
  };

  const currentInfo = getBrandInstructions(selectedBrand);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        animation: 'fadeInMsg 0.2s ease'
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#0F172A',
          border: '1px solid #1E293B',
          borderRadius: '20px',
          width: '100%',
          maxWidth: '480px',
          padding: '24px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
          color: '#F8FAFC'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                background: 'rgba(234, 179, 8, 0.15)',
                border: '1px solid rgba(234, 179, 8, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '20px'
              }}
            >
              ⚡
            </div>
            <div>
              <h3 style={{ fontSize: '17px', fontWeight: 800, color: '#F1F5F9', margin: 0 }}>
                Keep Doctor Alerts Active
              </h3>
              <p style={{ fontSize: '11px', color: '#94A3B8', margin: '3px 0 0 0' }}>
                Exempt Sovra from phone battery cleaner for 100% reliable alerts
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94A3B8',
              fontSize: '18px',
              cursor: 'pointer',
              padding: '4px'
            }}
          >
            ✕
          </button>
        </div>

        {/* Why this is necessary notice */}
        <div
          style={{
            background: 'rgba(15, 118, 110, 0.2)',
            border: '1px solid rgba(20, 184, 166, 0.3)',
            borderRadius: '12px',
            padding: '12px',
            fontSize: '12px',
            color: '#CCFBF1',
            lineHeight: 1.4,
            marginBottom: '16px'
          }}
        >
          <strong>Why this matters:</strong> Budget Android phones put apps to sleep after 10 minutes of screen off. Whitelisting Sovra guarantees you receive <strong>Live OPD Token calls</strong>, <strong>Doctor Prescriptions</strong>, and <strong>Critical Lab alerts</strong> instantly without opening the app.
        </div>

        {/* Brand Selector Tabs */}
        <div style={{ fontSize: '11px', color: '#94A3B8', marginBottom: '6px', fontWeight: 600 }}>
          SELECT YOUR PHONE BRAND:
        </div>
        <div
          style={{
            display: 'flex',
            gap: '6px',
            overflowX: 'auto',
            paddingBottom: '8px',
            marginBottom: '14px',
            scrollbarWidth: 'none'
          }}
        >
          {(
            [
              ['XIAOMI', 'Xiaomi/Redmi'],
              ['VIVO', 'Vivo/iQOO'],
              ['OPPO_REALME', 'Oppo/Realme'],
              ['SAMSUNG', 'Samsung'],
              ['ONEPLUS', 'OnePlus'],
              ['GENERAL', 'Other']
            ] as [AndroidBrand, string][]
          ).map(([brandKey, brandLabel]) => (
            <button
              key={brandKey}
              onClick={() => setSelectedBrand(brandKey)}
              style={{
                background: selectedBrand === brandKey ? '#0F766E' : '#1E293B',
                color: selectedBrand === brandKey ? '#FFFFFF' : '#94A3B8',
                border: `1px solid ${selectedBrand === brandKey ? '#14B8A6' : '#334155'}`,
                padding: '6px 12px',
                borderRadius: '8px',
                fontSize: '11px',
                fontWeight: selectedBrand === brandKey ? 700 : 500,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease'
              }}
            >
              {brandLabel}
            </button>
          ))}
        </div>

        {/* Brand Step-by-Step Instructions */}
        <div
          style={{
            background: '#1E293B',
            borderRadius: '14px',
            padding: '16px',
            border: '1px solid #334155',
            marginBottom: '18px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <span
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: currentInfo.badgeColor
              }}
            />
            <span style={{ fontSize: '13px', fontWeight: 700, color: '#F8FAFC' }}>
              {currentInfo.title}
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {currentInfo.steps.map((step, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                <span
                  style={{
                    background: '#0F766E',
                    color: '#FFFFFF',
                    width: '18px',
                    height: '18px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '10px',
                    fontWeight: 800,
                    flexShrink: 0,
                    marginTop: '2px'
                  }}
                >
                  {idx + 1}
                </span>
                <span style={{ fontSize: '12px', color: '#CBD5E1', lineHeight: 1.4 }}>
                  {step}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => {
              // Attempt to launch Android battery optimization intent (works in native TWA / Chrome)
              if (typeof window !== 'undefined') {
                window.location.href = 'intent:#Intent;action=android.settings.IGNORE_BATTERY_OPTIMIZATION_SETTINGS;end';
              }
            }}
            style={{
              flex: 1,
              background: '#1E293B',
              border: '1px solid #334155',
              color: '#38BDF8',
              padding: '10px 14px',
              borderRadius: '10px',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              textAlign: 'center'
            }}
          >
            ⚙️ Open App Settings
          </button>

          <button
            onClick={handleMarkResolved}
            style={{
              flex: 1,
              background: '#0F766E',
              border: 'none',
              color: '#FFFFFF',
              padding: '10px 14px',
              borderRadius: '10px',
              fontSize: '12px',
              fontWeight: 800,
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(15, 118, 110, 0.4)',
              textAlign: 'center'
            }}
          >
            ✓ Done / Whitelisted
          </button>
        </div>
      </div>
    </div>
  );
};
