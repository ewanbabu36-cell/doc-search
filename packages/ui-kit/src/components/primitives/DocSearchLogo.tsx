import React, { useState, useRef, useEffect } from 'react';

export type DocSearchLogoVariant = 'full' | 'compact' | 'hero' | 'icon-only' | 'app-icon' | 'mark-only';
export type DocSearchLogoSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

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
  xs: {
    iconSize: 22,
    docFontSize: '0.75rem',
    searchFontSize: '0.75rem',
    badgeFontSize: '0.5rem',
    gap: '6px',
    padding: '2px 4px'
  },
  sm: {
    iconSize: 28,
    docFontSize: '0.9rem',
    searchFontSize: '0.9rem',
    badgeFontSize: '0.55rem',
    gap: '8px',
    padding: '4px 6px'
  },
  md: {
    iconSize: 36,
    docFontSize: '1.1rem',
    searchFontSize: '1.1rem',
    badgeFontSize: '0.625rem',
    gap: '10px',
    padding: '6px 8px'
  },
  lg: {
    iconSize: 48,
    docFontSize: '1.45rem',
    searchFontSize: '1.45rem',
    badgeFontSize: '0.7rem',
    gap: '12px',
    padding: '8px 12px'
  },
  xl: {
    iconSize: 64,
    docFontSize: '1.95rem',
    searchFontSize: '1.95rem',
    badgeFontSize: '0.75rem',
    gap: '16px',
    padding: '12px 18px'
  },
  '2xl': {
    iconSize: 84,
    docFontSize: '2.5rem',
    searchFontSize: '2.5rem',
    badgeFontSize: '0.85rem',
    gap: '20px',
    padding: '16px 24px'
  }
};

export const DocSearchLogo: React.FC<DocSearchLogoProps> = ({
  variant = 'full',
  size = 'md',
  clickable = true,
  redirectUrl = '/',
  badgeText = 'INTELLIGENT OS',
  subtitle,
  showTelemetry = true,
  accentColor,
  className = '',
  style,
  onClick
}) => {
  const cfg = SIZE_CONFIGS[size] || SIZE_CONFIGS.md;
  const isCompact = variant === 'compact';
  const isIconOnly = variant === 'icon-only' || variant === 'app-icon' || variant === 'mark-only';
  const isAppIcon = variant === 'app-icon';
  const isMarkOnly = variant === 'mark-only';
  const isHero = variant === 'hero';
  const actualIconSize = isHero ? Math.max(cfg.iconSize, 56) : cfg.iconSize;

  const emblemRef = useRef<HTMLDivElement>(null);

  // 1. Subtle Magnetic Tilt on desktop
  const [tilt, setTilt] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [glassReflection, setGlassReflection] = useState<{ x: number; y: number } | null>(null);

  // 2. Living Vital Heartbeat State
  const [isPulsing, setIsPulsing] = useState(false);

  // 3. Telemetry HUD
  const [isHudOpen, setIsHudOpen] = useState(false);
  const [latencyMs, setLatencyMs] = useState(12);

  // 4. Online/Offline Sentinel
  const [isOnline, setIsOnline] = useState<boolean>(() => {
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const handleClinicalPulse = () => {
      setIsPulsing(true);
      setTimeout(() => setIsPulsing(false), 1200);
    };
    window.addEventListener('docsearch:clinical_pulse', handleClinicalPulse);

    const latencyTimer = setInterval(() => {
      if (typeof document !== 'undefined' && document.hidden) return;
      setLatencyMs(Math.floor(Math.random() * 8) + 10);
    }, 5000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('docsearch:clinical_pulse', handleClinicalPulse);
      clearInterval(latencyTimer);
    };
  }, []);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = emblemRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    const rotX = -(y / (rect.height / 2)) * 12;
    const rotY = (x / (rect.width / 2)) * 12;
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

  const primarySky = accentColor || '#38BDF8';
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
      title={clickable ? 'DocSearch • Intelligent Healthcare OS (Double-click for Command HUD)' : undefined}
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
        @keyframes dsLivingGlow {
          0%, 100% {
            box-shadow: 0 4px 18px rgba(2, 132, 199, 0.24), inset 0 0 12px rgba(56, 189, 248, 0.15);
            border-color: rgba(56, 189, 248, 0.4);
          }
          50% {
            box-shadow: 0 6px 26px rgba(14, 165, 233, 0.45), inset 0 0 16px rgba(45, 212, 191, 0.3);
            border-color: rgba(45, 212, 191, 0.7);
          }
        }
        @keyframes dsSonarPulse {
          0% { transform: scale(0.95); opacity: 0.85; border-width: 2px; }
          100% { transform: scale(2.2); opacity: 0; border-width: 0.5px; }
        }
        @keyframes dsEcgStream {
          0% { stroke-dashoffset: 140; opacity: 0.4; }
          40% { opacity: 1; filter: drop-shadow(0 0 6px #38BDF8); }
          70% { stroke-dashoffset: 0; opacity: 1; filter: drop-shadow(0 0 6px #10B981); }
          100% { stroke-dashoffset: -140; opacity: 0.4; }
        }
      `}</style>

      {/* 1. Master Sophisticated & Smart Healthcare Emblem */}
      <div
        ref={emblemRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className="docsearch-logo-emblem-core"
        style={{
          width: `${actualIconSize}px`,
          height: `${actualIconSize}px`,
          minWidth: `${actualIconSize}px`,
          borderRadius: isMarkOnly ? '0px' : isAppIcon ? `${Math.round(actualIconSize * 0.25)}px` : `${Math.round(actualIconSize * 0.28)}px`,
          background: isMarkOnly
            ? 'transparent'
            : 'radial-gradient(circle at 35% 30%, #0D1B33 0%, #060B16 100%)',
          border: isMarkOnly
            ? 'none'
            : `1.5px solid ${isOnline ? 'rgba(56, 189, 248, 0.45)' : 'rgba(245, 158, 11, 0.6)'}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: isMarkOnly
            ? 'none'
            : isOnline
            ? `0 4px 20px rgba(2, 132, 199, 0.28), inset 0 0 12px rgba(56, 189, 248, 0.2)`
            : '0 4px 20px rgba(245, 158, 11, 0.35), inset 0 0 12px rgba(245, 158, 11, 0.2)',
          position: 'relative',
          overflow: 'visible',
          flexShrink: 0,
          animation: isMarkOnly ? 'none' : 'dsLivingGlow 3.6s ease-in-out infinite',
          transform: isMarkOnly ? 'none' : `perspective(600px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
          transition: tilt.x === 0 && tilt.y === 0 ? 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)' : 'none'
        }}
      >
        {/* Living Sonar Pulse wave */}
        {isPulsing && !isMarkOnly && (
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              borderRadius: `${Math.round(actualIconSize * 0.28)}px`,
              border: `2px solid ${primaryEmerald}`,
              pointerEvents: 'none',
              animation: 'dsSonarPulse 1.1s cubic-bezier(0.1, 0.8, 0.3, 1) forwards'
            }}
          />
        )}

        {/* Specular Glass highlight */}
        {glassReflection && !isMarkOnly && (
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              borderRadius: `${Math.round(actualIconSize * 0.28)}px`,
              background: `radial-gradient(circle at ${glassReflection.x}% ${glassReflection.y}%, rgba(255, 255, 255, 0.28) 0%, transparent 60%)`,
              pointerEvents: 'none',
              zIndex: 4
            }}
          />
        )}

        {/* Precision Smart Emblem SVG: Medical Cross + Diagnostic Focus Lens + ECG */}
        <svg
          width={Math.round(actualIconSize * 0.74)}
          height={Math.round(actualIconSize * 0.74)}
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{ position: 'relative', zIndex: 2 }}
        >
          <defs>
            <linearGradient id="dsVGrad" x1="50" y1="12" x2="50" y2="88" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#38BDF8" />
              <stop offset="50%" stopColor="#0284C7" />
              <stop offset="100%" stopColor="#0369A1" />
            </linearGradient>

            <linearGradient id="dsHGrad" x1="12" y1="50" x2="88" y2="50" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#0284C7" />
              <stop offset="50%" stopColor="#06B6D4" />
              <stop offset="100%" stopColor={isOnline ? "#10B981" : "#F59E0B"} />
            </linearGradient>

            <linearGradient id="dsApertureRing" x1="32" y1="32" x2="68" y2="68" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#38BDF8" />
              <stop offset="50%" stopColor="#A855F7" />
              <stop offset="100%" stopColor={isOnline ? "#10B981" : "#F59E0B"} />
            </linearGradient>

            <filter id="dsEcgBloom" x="-20%" y="-40%" width="140%" height="180%">
              <feGaussianBlur stdDeviation="1.5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Medical Cross - Vertical Pillar */}
          <rect x="42" y="14" width="16" height="72" rx="8" fill="url(#dsVGrad)" />

          {/* Medical Cross - Horizontal Pillar */}
          <rect x="14" y="42" width="72" height="16" rx="8" fill="url(#dsHGrad)" />

          {/* Diagnostic Search Aperture (Seamlessly Embedded Lens at Center) */}
          <circle cx="50" cy="50" r="13" fill="#070D1A" stroke="url(#dsApertureRing)" strokeWidth="2.8" />

          {/* 45-degree Diagnostic Search Beam Ray (Lens handle accent) */}
          <path d="M 59 59 L 71 71" stroke="#38BDF8" strokeWidth="4" strokeLinecap="round" opacity="0.9" />
          <path d="M 59 59 L 71 71" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" />

          {/* Core Quantum Dot */}
          <circle cx="50" cy="50" r="3" fill="#38BDF8" />

          {/* Living ECG Pulse Waveform traversing the cross */}
          <path
            d="M 20 50 L 38 50 L 44 42 L 50 58 L 56 46 L 62 50 L 80 50"
            stroke="#FFFFFF"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
            filter="url(#dsEcgBloom)"
          />
        </svg>
      </div>

      {/* 2. Sophisticated Typography Wordmark */}
      {!isIconOnly && (
        <div
          className="docsearch-logo-typography-root"
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            lineHeight: 1.15
          }}
        >
          {/* Main Title Row: DOC SEARCH + Status Pill */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span
              style={{
                fontSize: isHero ? '1.65rem' : cfg.docFontSize,
                fontWeight: 800,
                color: '#F8FAFC',
                letterSpacing: '-0.03em',
                fontFamily: "-apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', Roboto, sans-serif"
              }}
            >
              DOC
            </span>
            <span
              style={{
                fontSize: isHero ? '1.65rem' : cfg.searchFontSize,
                fontWeight: 700,
                background: `linear-gradient(135deg, ${primarySky} 0%, #2DD4BF 60%, #818CF8 100%)`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                letterSpacing: '-0.03em',
                filter: 'drop-shadow(0 0 12px rgba(56, 189, 248, 0.35))',
                fontFamily: "-apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', Roboto, sans-serif"
              }}
            >
              SEARCH
            </span>

            {/* Micro Sophisticated Badge */}
            {badgeText && !isCompact && (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  backgroundColor: isOnline ? 'rgba(6, 182, 212, 0.12)' : 'rgba(245, 158, 11, 0.15)',
                  border: `1px solid ${isOnline ? 'rgba(56, 189, 248, 0.3)' : 'rgba(245, 158, 11, 0.35)'}`,
                  color: isOnline ? primarySky : '#FBBF24',
                  padding: '2px 7px',
                  borderRadius: '6px',
                  fontSize: cfg.badgeFontSize,
                  fontWeight: 700,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  marginLeft: '2px'
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
                <span>{isOnline ? badgeText : 'OFFLINE'}</span>
              </span>
            )}

            {/* Live Telemetry Ping Button */}
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
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '6px',
                  padding: '1px 5px',
                  fontSize: '0.62rem',
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

          {/* Elegant Tagline / Subtitle */}
          {(subtitle || (!isCompact && variant === 'full')) && (
            <div
              style={{
                fontSize: '0.625rem',
                color: '#94A3B8',
                letterSpacing: '0.14em',
                marginTop: '3px',
                fontWeight: 700,
                textTransform: 'uppercase',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                maxWidth: '240px'
              }}
            >
              {isOnline
                ? subtitle || 'Intelligent Healthcare OS'
                : 'Offline Cache Active • Safe to Consult'}
            </div>
          )}
        </div>
      )}

      {/* 3. Floating System Health HUD Modal */}
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
            <span style={{ fontWeight: 800, color: '#F8FAFC', letterSpacing: '0.5px' }}>DOCSEARCH TELEMETRY</span>
            <span style={{ color: isOnline ? primaryEmerald : '#F59E0B', fontWeight: 700 }}>
              {isOnline ? '🟢 ONLINE' : '🟠 OFFLINE'}
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#CBD5E1' }}>
            <span>API Gateway Ping</span>
            <span style={{ fontFamily: 'monospace', color: primarySky }}>{isOnline ? `${latencyMs} ms` : 'Disconnected'}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#CBD5E1' }}>
            <span>ABDM 2.0 FHIR Node</span>
            <span style={{ color: primaryEmerald }}>Nominal (M1-M3)</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#CBD5E1' }}>
            <span>PostgreSQL Engine</span>
            <span style={{ color: primaryEmerald }}>Active (v18.4)</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#CBD5E1' }}>
            <span>Clinical Offline Cache</span>
            <span style={{ color: primarySky }}>Synchronized</span>
          </div>

          <div style={{ marginTop: '4px', paddingTop: '6px', borderTop: '1px solid rgba(255,255,255,0.08)', fontSize: '0.65rem', color: '#64748B' }}>
            Tip: Double-click logo or press <code>Ctrl+Space</code> for Quick Command HUD.
          </div>
        </div>
      )}
    </div>
  );
};
