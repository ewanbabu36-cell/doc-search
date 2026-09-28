import React, { useEffect, useState } from 'react';

export type DocSearchLoaderMode = 'download' | 'slow_network' | 'login' | 'inline' | 'generic' | 'offline';

export interface DocSearch3DLogoLoaderProps {
  mode?: DocSearchLoaderMode;
  title?: string;
  subtitle?: string;
  fullScreen?: boolean;
  size?: 'sm' | 'md' | 'lg';
  progress?: number; // 0 to 100
  showProgress?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export const DocSearch3DLogoLoader: React.FC<DocSearch3DLogoLoaderProps> = ({
  mode = 'generic',
  title,
  subtitle,
  fullScreen = false,
  size = 'md',
  progress: externalProgress,
  showProgress = false,
  className = '',
  style
}) => {
  const [isSlowNetworkDetected, setIsSlowNetworkDetected] = useState(false);
  const [isOffline, setIsOffline] = useState(typeof navigator !== 'undefined' ? !navigator.onLine : false);
  const [internalProgress, setInternalProgress] = useState(externalProgress ?? 35);

  // 1. Automatic Offline Detection
  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const handleOn = () => setIsOffline(false);
    const handleOff = () => setIsOffline(true);
    window.addEventListener('online', handleOn);
    window.addEventListener('offline', handleOff);
    return () => {
      window.removeEventListener('online', handleOn);
      window.removeEventListener('offline', handleOff);
    };
  }, []);

  // 2. Automatic Low Bandwidth & Slow Internet Detection
  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const nav = navigator as any;
    const conn = nav.connection || nav.mozConnection || nav.webkitConnection;
    if (conn) {
      const checkSpeed = () => {
        const isSlow =
          conn.effectiveType === 'slow-2g' ||
          conn.effectiveType === '2g' ||
          conn.effectiveType === '3g' ||
          (conn.downlink && conn.downlink < 1.5) ||
          (conn.rtt && conn.rtt > 500);
        setIsSlowNetworkDetected(Boolean(isSlow));
      };
      checkSpeed();
      conn.addEventListener('change', checkSpeed);
      return () => conn.removeEventListener('change', checkSpeed);
    }
    return undefined;
  }, []);

  // 3. Simulated Telemetry Progress if not provided externally
  useEffect(() => {
    if (externalProgress !== undefined) {
      setInternalProgress(externalProgress);
      return undefined;
    }
    const interval = setInterval(() => {
      if (typeof document !== 'undefined' && document.hidden) return;
      setInternalProgress((prev) => {
        if (prev >= 95) return 95;
        const jump = Math.floor(Math.random() * 8) + 2;
        return Math.min(prev + jump, 95);
      });
    }, 450);
    return () => clearInterval(interval);
  }, [externalProgress]);

  // Determine effective mode
  const effectiveMode: DocSearchLoaderMode =
    isOffline || mode === 'offline'
      ? 'offline'
      : mode === 'generic' && isSlowNetworkDetected
      ? 'slow_network'
      : mode;

  // Resolve titles and subtitles based on mode
  const resolvedTitle =
    title ||
    (effectiveMode === 'offline'
      ? 'OFFLINE CLINICAL VAULT ACTIVE'
      : effectiveMode === 'login'
      ? 'AUTHORIZING CLINICAL CREDENTIALS'
      : effectiveMode === 'slow_network'
      ? 'OPTIMIZING STREAM • LOW BANDWIDTH'
      : effectiveMode === 'download'
      ? 'STREAMING DOC SEARCH CORE'
      : 'INITIALIZING HEALTHCARE OS');

  const resolvedSubtitle =
    subtitle ||
    (effectiveMode === 'offline'
      ? 'Local SQLite & IndexedDB active. Consultations & billing are safely cached.'
      : effectiveMode === 'login'
      ? 'Cryptographic Biometric Handshake & Role Token Verification...'
      : effectiveMode === 'slow_network'
      ? 'High Latency / Slow Internet detected. Compressing telemetry payload...'
      : effectiveMode === 'download'
      ? 'Downloading high-speed hospital micro-kernels and UI assets...'
      : 'Synchronizing multi-tenant clinical database pipelines...');

  const scaleMultiplier = size === 'sm' ? 0.75 : size === 'lg' ? 1.3 : 1.0;
  const coreSize = Math.round(76 * scaleMultiplier);
  const ring1Size = Math.round(150 * scaleMultiplier);
  const ring2Size = Math.round(190 * scaleMultiplier);

  const containerContent = (
    <div
      className={`docsearch-3d-loader-container ${className}`}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        textAlign: 'center',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        userSelect: 'none',
        ...style
      }}
    >
      {/* 3D PERSPECTIVE STAGE */}
      <div
        className="docsearch-3d-perspective-stage"
        style={{
          width: `${ring2Size + 40}px`,
          height: `${ring2Size + 40}px`,
          perspective: '1000px',
          perspectiveOrigin: '50% 50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative'
        }}
      >
        <style>{`
          @keyframes dsRotateGyroOuter {
            0% { transform: rotateX(68deg) rotateZ(0deg); }
            100% { transform: rotateX(68deg) rotateZ(360deg); }
          }
          @keyframes dsRotateGyroInner {
            0% { transform: rotateY(60deg) rotateZ(360deg); }
            100% { transform: rotateY(60deg) rotateZ(0deg); }
          }
          @keyframes dsLaserConicSweep {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          @keyframes dsLevitate3D {
            0%, 100% {
              transform: translateZ(45px) translateY(0px) rotateX(10deg);
              box-shadow: 0 25px 50px -10px rgba(6, 182, 212, 0.5), 0 0 35px rgba(16, 185, 129, 0.35);
            }
            50% {
              transform: translateZ(65px) translateY(-14px) rotateX(15deg);
              box-shadow: 0 35px 65px -10px rgba(6, 182, 212, 0.7), 0 0 50px rgba(56, 189, 248, 0.5);
            }
          }
          @keyframes dsFloorShadowPulse {
            0%, 100% { transform: scale(1); opacity: 0.6; }
            50% { transform: scale(0.82); opacity: 0.3; }
          }
          @keyframes dsScanlineVitals {
            0% { transform: translateY(-100%); opacity: 0; }
            50% { opacity: 0.8; }
            100% { transform: translateY(100%); opacity: 0; }
          }
          @keyframes dsEcgBeat {
            0%, 100% { transform: scale(1); opacity: 0.9; }
            14% { transform: scale(1.08); opacity: 1; filter: drop-shadow(0 0 8px #38BDF8); }
            28% { transform: scale(1); opacity: 0.9; }
            42% { transform: scale(1.15); opacity: 1; filter: drop-shadow(0 0 12px #10B981); }
            70% { transform: scale(1); opacity: 0.9; }
          }
        `}</style>

        {/* 1. Ground Holographic Pulsing Shadow */}
        <div
          style={{
            position: 'absolute',
            bottom: '10px',
            width: `${coreSize * 1.3}px`,
            height: '24px',
            borderRadius: '50%',
            background: 'radial-gradient(ellipse at center, rgba(6, 182, 212, 0.45) 0%, rgba(6, 182, 212, 0) 70%)',
            animation: 'dsFloorShadowPulse 2.4s ease-in-out infinite'
          }}
        />

        {/* 2. Outer Holographic Gyro Ring */}
        <div
          style={{
            position: 'absolute',
            width: `${ring2Size}px`,
            height: `${ring2Size}px`,
            borderRadius: '50%',
            border: '1.5px dashed rgba(56, 189, 248, 0.55)',
            boxShadow: '0 0 18px rgba(6, 182, 212, 0.25)',
            transformStyle: 'preserve-3d',
            animation: 'dsRotateGyroOuter 7s linear infinite',
            pointerEvents: 'none'
          }}
        />

        {/* 3. Inner Holographic Gyro Ring */}
        <div
          style={{
            position: 'absolute',
            width: `${ring1Size}px`,
            height: `${ring1Size}px`,
            borderRadius: '50%',
            border: '1.5px solid rgba(16, 185, 129, 0.65)',
            boxShadow: '0 0 20px rgba(16, 185, 129, 0.3)',
            transformStyle: 'preserve-3d',
            animation: 'dsRotateGyroInner 5s linear infinite',
            pointerEvents: 'none'
          }}
        />

        {/* 4. Radial Holographic Laser Conic Sweep */}
        <div
          style={{
            position: 'absolute',
            width: `${ring1Size * 1.15}px`,
            height: `${ring1Size * 1.15}px`,
            borderRadius: '50%',
            background: 'conic-gradient(from 0deg, rgba(6, 182, 212, 0.22) 0deg, rgba(56, 189, 248, 0.05) 60deg, transparent 120deg)',
            animation: 'dsLaserConicSweep 3.5s linear infinite',
            pointerEvents: 'none'
          }}
        />

        {/* 5. Central 3D DocSearch Emblem Levitating & Emerging Outward */}
        <div
          className="docsearch-3d-emblem-core"
          style={{
            width: `${coreSize}px`,
            height: `${coreSize}px`,
            borderRadius: `${Math.round(coreSize * 0.3)}px`,
            background: 'radial-gradient(circle at 35% 30%, #1E293B 0%, #070D18 100%)',
            border: '2px solid rgba(56, 189, 248, 0.75)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            transformStyle: 'preserve-3d',
            animation: 'dsLevitate3D 2.4s ease-in-out infinite',
            zIndex: 10,
            overflow: 'hidden'
          }}
        >
          {/* Biometric Scanning Telemetry Laser Beam */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '3px',
              background: 'linear-gradient(90deg, transparent 0%, #38BDF8 50%, transparent 100%)',
              boxShadow: '0 0 10px #38BDF8, 0 0 20px #06B6D4',
              animation: 'dsScanlineVitals 1.6s ease-in-out infinite',
              zIndex: 5
            }}
          />

          {/* High-Precision Cyber-Medical Cross SVG */}
          <svg
            width={Math.round(coreSize * 0.72)}
            height={Math.round(coreSize * 0.72)}
            viewBox="0 0 100 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            style={{
              position: 'relative',
              zIndex: 3,
              animation: 'dsEcgBeat 2.4s ease-in-out infinite'
            }}
          >
            <defs>
              <linearGradient id="ds3dGrad" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#38BDF8" />
                <stop offset="50%" stopColor="#06B6D4" />
                <stop offset="100%" stopColor="#10B981" />
              </linearGradient>
              <filter id="ds3dGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Orbiting Ticks */}
            <circle
              cx="50"
              cy="50"
              r="44"
              stroke="url(#ds3dGrad)"
              strokeWidth="2"
              strokeDasharray="6 4 2 4"
            />

            {/* Vertical Bar */}
            <rect
              x="41"
              y="18"
              width="18"
              height="64"
              rx="9"
              fill="url(#ds3dGrad)"
              filter="url(#ds3dGlow)"
            />

            {/* Horizontal Bar */}
            <rect
              x="18"
              y="41"
              width="64"
              height="18"
              rx="9"
              fill="url(#ds3dGrad)"
              filter="url(#ds3dGlow)"
            />

            {/* Center Aperture */}
            <circle cx="50" cy="50" r="8" fill="#070D18" stroke="#38BDF8" strokeWidth="2.5" />
            <circle cx="50" cy="50" r="3.5" fill="#FFFFFF" />

            {/* Pulsing ECG Line */}
            <path
              d="M 22 50 L 37 50 L 43 38 L 47 62 L 53 43 L 57 54 L 63 50 L 78 50"
              stroke="#FFFFFF"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ filter: 'drop-shadow(0 0 5px #38BDF8)' }}
            />
          </svg>
        </div>
      </div>

      {/* 6. TELEMETRY STATUS LABELS & PROGRESS */}
      <div style={{ marginTop: '20px', maxWidth: '420px', width: '100%' }}>
        {/* Futuristic Mode Badge */}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
          <span
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: effectiveMode === 'slow_network' ? '#F59E0B' : '#10B981',
              boxShadow: `0 0 8px ${effectiveMode === 'slow_network' ? '#F59E0B' : '#10B981'}`
            }}
          />
          <span
            style={{
              fontSize: '0.75rem',
              fontWeight: 900,
              letterSpacing: '1px',
              color: effectiveMode === 'slow_network' ? '#FBBF24' : '#38BDF8',
              textTransform: 'uppercase'
            }}
          >
            {resolvedTitle}
          </span>
        </div>

        {/* Subtitle / Telemetry Details */}
        <p
          style={{
            fontSize: '0.8125rem',
            color: '#94A3B8',
            margin: '0 0 14px 0',
            lineHeight: 1.5
          }}
        >
          {resolvedSubtitle}
        </p>

        {/* Progress Bar (if requested or in download/slow mode) */}
        {(showProgress || effectiveMode === 'download' || effectiveMode === 'slow_network') && (
          <div style={{ width: '100%', maxWidth: '280px', margin: '0 auto' }}>
            <div
              style={{
                width: '100%',
                height: '5px',
                backgroundColor: 'rgba(30, 41, 59, 0.8)',
                borderRadius: '999px',
                overflow: 'hidden',
                border: '1px solid rgba(255, 255, 255, 0.1)'
              }}
            >
              <div
                style={{
                  width: `${internalProgress}%`,
                  height: '100%',
                  background:
                    effectiveMode === 'slow_network'
                      ? 'linear-gradient(90deg, #F59E0B, #10B981)'
                      : 'linear-gradient(90deg, #06B6D4, #38BDF8, #10B981)',
                  borderRadius: '999px',
                  boxShadow: '0 0 12px rgba(6, 182, 212, 0.8)',
                  transition: 'width 0.3s ease'
                }}
              />
            </div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginTop: '6px',
                fontSize: '0.6875rem',
                color: '#64748B',
                fontFamily: 'monospace'
              }}
            >
              <span>TELEMETRY SYNC</span>
              <span style={{ color: '#38BDF8', fontWeight: 700 }}>{internalProgress}%</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  if (fullScreen) {
    return (
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(7, 13, 24, 0.88)',
          backdropFilter: 'blur(16px)',
          zIndex: 99999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        {containerContent}
      </div>
    );
  }

  return containerContent;
};
