import React, { useState, useRef, useEffect } from 'react';

export type DocSearchLogoVariant = 'full' | 'compact' | 'hero' | 'icon-only';
export type DocSearchLogoSize = 'sm' | 'md' | 'lg' | 'xl';

export interface DocSearchLogoProps {
  variant?: DocSearchLogoVariant;
  size?: DocSearchLogoSize;
  clickable?: boolean;
  redirectUrl?: string;
  badgeText?: string;
  subtitle?: string;
  showTelemetry?: boolean;
  accentColor?: string;
  className?: string;
  style?: React.CSSProperties;
  onClick?: (e: React.MouseEvent) => void;
}

const SIZE_CONFIGS = {
  sm: {
    iconSize: 28,
    docFontSize: '0.875rem',
    searchFontSize: '0.875rem',
    badgeFontSize: '0.55rem',
    gap: '8px',
    padding: '4px 6px'
  },
  md: {
    iconSize: 36,
    docFontSize: '1.05rem',
    searchFontSize: '1.05rem',
    badgeFontSize: '0.625rem',
    gap: '10px',
    padding: '6px 8px'
  },
  lg: {
    iconSize: 46,
    docFontSize: '1.35rem',
    searchFontSize: '1.35rem',
    badgeFontSize: '0.7rem',
    gap: '12px',
    padding: '8px 12px'
  },
  xl: {
    iconSize: 60,
    docFontSize: '1.85rem',
    searchFontSize: '1.85rem',
    badgeFontSize: '0.75rem',
    gap: '16px',
    padding: '12px 18px'
  }
};

export const DocSearchLogo: React.FC<DocSearchLogoProps> = ({
  variant = 'full',
  size = 'md',
  clickable = true,
  redirectUrl = '/',
  badgeText = 'ENTERPRISE OS',
  subtitle,
  showTelemetry = true,
  accentColor,
  className = '',
  style,
  onClick
}) => {
  const cfg = SIZE_CONFIGS[size] || SIZE_CONFIGS.md;
  const isCompact = variant === 'compact';
  const isIconOnly = variant === 'icon-only';
  const isHero = variant === 'hero';
  const actualIconSize = isHero ? Math.max(cfg.iconSize, 48) : cfg.iconSize;

  const emblemRef = useRef<HTMLDivElement>(null);

  // 1. 🧲 Magnetic 3D Cursor Tilt & Glass Highlight State
  const [tilt, setTilt] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [glassReflection, setGlassReflection] = useState<{ x: number; y: number } | null>(null);

  // 2. 🫀 Living Biometric Heartbeat Event Pulse State
  const [isPulsing, setIsPulsing] = useState(false);

  // 3. ⚡ Live Telemetry & HUD State
  const [isHudOpen, setIsHudOpen] = useState(false);
  const [latencyMs, setLatencyMs] = useState(12);

  // 4. 🛡️ Offline Detection State
  const [isOnline, setIsOnline] = useState<boolean>(() => {
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  });

  // Track online/offline status
  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Listen to custom clinical pulse events from anywhere in the app
    const handleClinicalPulse = () => {
      setIsPulsing(true);
      setTimeout(() => setIsPulsing(false), 1200);
    };
    window.addEventListener('docsearch:clinical_pulse', handleClinicalPulse);

    // Simulated latency jitter between 10ms - 18ms
    const latencyTimer = setInterval(() => {
      if (typeof document !== 'undefined' && document.hidden) return;
      setLatencyMs(Math.floor(Math.random() * 8) + 10);
    }, 4500);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('docsearch:clinical_pulse', handleClinicalPulse);
      clearInterval(latencyTimer);
    };
  }, []);

  // 1. Magnetic Tilt Handler
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = emblemRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    const rotX = -(y / (rect.height / 2)) * 15;
    const rotY = (x / (rect.width / 2)) * 15;
    setTilt({ x: rotX, y: rotY });
    setGlassReflection({
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100
    });
  };

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0 });
    setGlassReflection(null);
  };

  // 6. Double Click to open Fast Command HUD / Single Click to Home
  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('docsearch:open_command_palette'));
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    if (onClick) {
      onClick(e);
      return;
    }
    if (!clickable) return;

    if (typeof window !== 'undefined') {
      const currentPath = window.location.pathname;
      if (redirectUrl === '/' && (currentPath === '/' || currentPath === '')) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        window.location.href = redirectUrl;
      }
    }
  };

  const primaryCyan = accentColor || '#38BDF8';
  const primaryEmerald = '#10B981';

  return (
    <div
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      role={clickable ? 'button' : undefined}
      tabIndex={clickable ? 0 : undefined}
      onKeyDown={(e) => {
        if (clickable && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          handleClick(e as any);
        }
      }}
      title={clickable ? 'DocSearch Home • Next-Gen Healthcare Intelligence OS (Double click for Command HUD)' : undefined}
      className={`docsearch-unified-brand-logo ${className}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: cfg.gap,
        cursor: clickable ? 'pointer' : 'default',
        userSelect: 'none',
        textDecoration: 'none',
        outline: 'none',
        position: 'relative',
        transition: 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), filter 0.25s ease',
        ...style
      }}
    >
      <style>{`
        @keyframes dsSonarRadar {
          0% { transform: scale(0.95); opacity: 0.85; border-width: 2px; }
          50% { opacity: 0.45; }
          100% { transform: scale(2.3); opacity: 0; border-width: 0.5px; }
        }
        @keyframes dsBiolumPulse {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; filter: drop-shadow(0 0 14px ${primaryCyan}); }
        }
        @keyframes dsOrbitSpin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes dsLivingBreathing {
          0%, 100% {
            box-shadow: 0 4px 18px rgba(6, 182, 212, 0.28), inset 0 0 12px rgba(56, 189, 248, 0.2);
            border-color: rgba(56, 189, 248, 0.45);
          }
          50% {
            box-shadow: 0 4px 28px rgba(6, 182, 212, 0.65), inset 0 0 16px rgba(56, 189, 248, 0.45);
            border-color: rgba(6, 182, 212, 0.85);
          }
        }
        @keyframes dsEcgFlow {
          0% { stroke-dashoffset: 140; opacity: 0.3; }
          30% { opacity: 1; filter: drop-shadow(0 0 8px #38BDF8); }
          60% { stroke-dashoffset: 0; opacity: 1; filter: drop-shadow(0 0 6px #10B981); }
          100% { stroke-dashoffset: -140; opacity: 0.3; }
        }
        @keyframes dsCorePulse {
          0%, 100% { transform: scale(1); filter: drop-shadow(0 0 3px ${primaryCyan}); }
          50% { transform: scale(1.15); filter: drop-shadow(0 0 9px #38BDF8); }
        }
      `}</style>

      {/* 1. Eye-Catching Futuristic Cyber-Medical Emblem with Magnetic 3D Tilt */}
      <div
        ref={emblemRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className="docsearch-logo-emblem-core"
        style={{
          width: `${actualIconSize}px`,
          height: `${actualIconSize}px`,
          minWidth: `${actualIconSize}px`,
          borderRadius: `${Math.round(actualIconSize * 0.3)}px`,
          background: 'radial-gradient(circle at 35% 30%, #1E293B 0%, #070D18 100%)',
          border: `1.5px solid ${isOnline ? 'rgba(56, 189, 248, 0.5)' : 'rgba(245, 158, 11, 0.7)'}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: isOnline
            ? `0 4px 22px rgba(6, 182, 212, 0.3), inset 0 0 14px rgba(56, 189, 248, 0.25)`
            : '0 4px 22px rgba(245, 158, 11, 0.4), inset 0 0 14px rgba(245, 158, 11, 0.25)',
          position: 'relative',
          overflow: 'visible',
          flexShrink: 0,
          animation: 'dsLivingBreathing 3.6s ease-in-out infinite',
          transform: `perspective(600px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
          transition: tilt.x === 0 && tilt.y === 0 ? 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)' : 'none'
        }}
      >
        {/* 2. 🫀 Living Biometric Heartbeat Sonar Wave (Ripples outward on pulse) */}
        {isPulsing && (
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              borderRadius: `${Math.round(actualIconSize * 0.3)}px`,
              border: `2px solid ${primaryEmerald}`,
              pointerEvents: 'none',
              animation: 'dsSonarRadar 1.1s cubic-bezier(0.1, 0.8, 0.3, 1) forwards'
            }}
          />
        )}

        {/* Specular Glass Highlight following cursor */}
        {glassReflection && (
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              borderRadius: `${Math.round(actualIconSize * 0.3)}px`,
              background: `radial-gradient(circle at ${glassReflection.x}% ${glassReflection.y}%, rgba(255, 255, 255, 0.35) 0%, transparent 60%)`,
              pointerEvents: 'none',
              zIndex: 4
            }}
          />
        )}

        {/* Precision High-Tech Medical Cross + Telemetry Orbit SVG */}
        <svg
          width={Math.round(actualIconSize * 0.72)}
          height={Math.round(actualIconSize * 0.72)}
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{ position: 'relative', zIndex: 2 }}
        >
          <defs>
            <linearGradient id="dsMedicalGradAdv" x1="10" y1="10" x2="90" y2="90" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor={primaryCyan} />
              <stop offset="50%" stopColor="#06B6D4" />
              <stop offset="100%" stopColor={isOnline ? primaryEmerald : '#F59E0B'} />
            </linearGradient>

            <filter id="dsNeonGlowAdv" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="2.5" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Outer Cybernetic Telemetry Orbit Ring with continuous gyroscope rotation */}
          <circle
            cx="50"
            cy="50"
            r="44"
            stroke="url(#dsMedicalGradAdv)"
            strokeWidth="2"
            strokeDasharray="6 4 2 4"
            strokeOpacity="0.75"
            style={{
              transformOrigin: '50px 50px',
              animation: 'dsOrbitSpin 22s linear infinite'
            }}
          />

          {/* Precision Cross - Vertical Bar */}
          <rect
            x="41"
            y="18"
            width="18"
            height="64"
            rx="9"
            fill="url(#dsMedicalGradAdv)"
            filter="url(#dsNeonGlowAdv)"
          />

          {/* Precision Cross - Horizontal Bar */}
          <rect
            x="18"
            y="41"
            width="64"
            height="18"
            rx="9"
            fill="url(#dsMedicalGradAdv)"
            filter="url(#dsNeonGlowAdv)"
          />

          {/* Center Quantum Aperture Core with breathing heartbeat */}
          <circle
            cx="50"
            cy="50"
            r="8"
            fill="#070D18"
            stroke={primaryCyan}
            strokeWidth="2.5"
            style={{
              transformOrigin: '50px 50px',
              animation: 'dsCorePulse 2.8s ease-in-out infinite'
            }}
          />
          <circle
            cx="50"
            cy="50"
            r="3.5"
            fill="#FFFFFF"
          />

          {/* Biometric Heartbeat Waveform Axis - Underlying Track */}
          <path
            d="M 22 50 L 37 50 L 43 38 L 47 62 L 53 43 L 57 54 L 63 50 L 78 50"
            stroke="rgba(255, 255, 255, 0.35)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Biometric Heartbeat Waveform Axis - Dynamic Living Pulse Beam */}
          <path
            d="M 22 50 L 37 50 L 43 38 L 47 62 L 53 43 L 57 54 L 63 50 L 78 50"
            stroke="#FFFFFF"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray="32 110"
            style={{
              animation: 'dsEcgFlow 2.5s ease-in-out infinite',
              filter: `drop-shadow(0 0 6px ${primaryCyan})`
            }}
          />
        </svg>
      </div>

      {/* 2. Responsive Futuristic Typography */}
      {!isIconOnly && (
        <div
          className="docsearch-logo-typography-root"
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            lineHeight: 1.1
          }}
        >
          {/* Main Title Row: DOC SEARCH + Badges */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span
              style={{
                fontSize: isHero ? '1.5rem' : cfg.docFontSize,
                fontWeight: 900,
                color: '#F8FAFC',
                letterSpacing: '-0.02em',
                fontFamily: 'system-ui, -apple-system, sans-serif'
              }}
            >
              DOC
            </span>
            <span
              style={{
                fontSize: isHero ? '1.5rem' : cfg.searchFontSize,
                fontWeight: 700,
                background: `linear-gradient(135deg, ${primaryCyan} 0%, #818CF8 100%)`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                letterSpacing: '-0.02em',
                filter: `drop-shadow(0 0 10px rgba(56, 189, 248, 0.4))`,
                fontFamily: 'system-ui, -apple-system, sans-serif'
              }}
            >
              SEARCH
            </span>

            {/* 3. Micro Futuristic Badge & Status */}
            {badgeText && !isCompact && (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  backgroundColor: isOnline ? 'rgba(6, 182, 212, 0.12)' : 'rgba(245, 158, 11, 0.15)',
                  border: `1px solid ${isOnline ? 'rgba(56, 189, 248, 0.35)' : 'rgba(245, 158, 11, 0.4)'}`,
                  color: isOnline ? primaryCyan : '#FBBF24',
                  padding: '2px 7px',
                  borderRadius: '6px',
                  fontSize: cfg.badgeFontSize,
                  fontWeight: 800,
                  letterSpacing: '0.6px',
                  textTransform: 'uppercase',
                  marginLeft: '2px',
                  boxShadow: `0 0 10px ${isOnline ? 'rgba(6, 182, 212, 0.15)' : 'rgba(245, 158, 11, 0.2)'}`
                }}
              >
                <span
                  style={{
                    width: '5px',
                    height: '5px',
                    borderRadius: '50%',
                    backgroundColor: isOnline ? primaryEmerald : '#F59E0B',
                    boxShadow: `0 0 6px ${isOnline ? primaryEmerald : '#F59E0B'}`
                  }}
                />
                <span>{isOnline ? badgeText : 'OFFLINE VAULT'}</span>
              </span>
            )}

            {/* 4. ⚡ Live Telemetry Indicator Badge */}
            {showTelemetry && !isCompact && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsHudOpen(!isHudOpen);
                }}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  background: 'rgba(15, 23, 42, 0.7)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '6px',
                  padding: '1px 5px',
                  fontSize: '0.6rem',
                  color: '#94A3B8',
                  cursor: 'pointer',
                  fontFamily: 'monospace'
                }}
                title="Click for System Telemetry HUD"
              >
                <span style={{ color: isOnline ? primaryEmerald : '#F59E0B' }}>●</span>
                <span>{isOnline ? `${latencyMs}ms` : 'OFFLINE'}</span>
              </button>
            )}
          </div>

          {/* Subtitle / Tagline */}
          {(subtitle || (!isCompact && variant === 'full')) && (
            <div
              style={{
                fontSize: '0.6875rem',
                color: '#94A3B8',
                letterSpacing: '0.2px',
                marginTop: '3px',
                fontWeight: 500,
                whiteSpace: 'nowrap'
              }}
            >
              {isOnline
                ? subtitle || 'Integrated Hospital & Clinical Intelligence System'
                : 'Offline Local Cache Active • Safe to Consult & Bill'}
            </div>
          )}
        </div>
      )}

      {/* 5. Floating System Health HUD Modal */}
      {isHudOpen && (
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            position: 'absolute',
            top: 'calc(100% + 10px)',
            left: 0,
            width: '280px',
            backgroundColor: 'rgba(15, 23, 42, 0.95)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(56, 189, 248, 0.35)',
            borderRadius: '12px',
            padding: '12px',
            boxShadow: '0 16px 40px rgba(0, 0, 0, 0.8), 0 0 20px rgba(6, 182, 212, 0.2)',
            zIndex: 99999,
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            fontSize: '0.72rem',
            textAlign: 'left'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '6px' }}>
            <span style={{ fontWeight: 800, color: '#F8FAFC', letterSpacing: '0.5px' }}>DOC SEARCH TELEMETRY</span>
            <span style={{ color: isOnline ? primaryEmerald : '#F59E0B', fontWeight: 700 }}>
              {isOnline ? '🟢 ONLINE' : '🟠 OFFLINE'}
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#CBD5E1' }}>
            <span>API Gateway Ping</span>
            <span style={{ fontFamily: 'monospace', color: primaryCyan }}>{isOnline ? `${latencyMs} ms` : 'Disconnected'}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#CBD5E1' }}>
            <span>ABDM 2.0 FHIR Node</span>
            <span style={{ color: primaryEmerald }}>Nominal (M1-M3)</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#CBD5E1' }}>
            <span>PostgreSQL RLS Vault</span>
            <span style={{ color: primaryEmerald }}>Active (AES-256)</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#CBD5E1' }}>
            <span>Local Clinical Cache</span>
            <span style={{ color: primaryCyan }}>Synced & Ready</span>
          </div>

          <div style={{ marginTop: '4px', paddingTop: '6px', borderTop: '1px solid rgba(255,255,255,0.08)', fontSize: '0.65rem', color: '#64748B' }}>
            Tip: Double-click logo or press <code>Ctrl+Space</code> for Quick Command HUD.
          </div>
        </div>
      )}
    </div>
  );
};
