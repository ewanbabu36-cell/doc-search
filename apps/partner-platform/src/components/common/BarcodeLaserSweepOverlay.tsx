import React, { useState, useEffect } from 'react';

interface LaserSweepEventDetail {
  raw: string;
  symbology: string;
  timestamp: number;
  burstMs?: number;
}

export const BarcodeLaserSweepOverlay: React.FC = () => {
  const [isSweeping, setIsSweeping] = useState(false);
  const [lastScanDetail, setLastScanDetail] = useState<LaserSweepEventDetail | null>(null);

  useEffect(() => {
    const handleSweep = (e: any) => {
      const detail = e.detail as LaserSweepEventDetail;
      setLastScanDetail(detail);
      setIsSweeping(true);

      const timer = setTimeout(() => {
        setIsSweeping(false);
      }, 700);

      return () => clearTimeout(timer);
    };

    window.addEventListener('docsearch:laser_beam_sweep', handleSweep);
    return () => window.removeEventListener('docsearch:laser_beam_sweep', handleSweep);
  }, []);

  if (!isSweeping && !lastScanDetail) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 100000,
        overflow: 'hidden',
        opacity: isSweeping ? 1 : 0,
        transition: 'opacity 0.25s ease-out'
      }}
    >
      {/* 1. Bioluminescent Emerald Laser Beam Line */}
      {isSweeping && (
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            height: '3px',
            background: 'linear-gradient(90deg, rgba(16, 185, 129, 0) 0%, #10B981 15%, #38BDF8 50%, #10B981 85%, rgba(16, 185, 129, 0) 100%)',
            boxShadow: '0 0 16px 4px rgba(16, 185, 129, 0.9), 0 0 32px 8px rgba(56, 189, 248, 0.6)',
            animation: 'dsLaserSweepDown 0.65s cubic-bezier(0.2, 0.8, 0.2, 1) forwards'
          }}
        >
          {/* Subtle Ambient Laser Glow Haze */}
          <div
            style={{
              position: 'absolute',
              top: '-24px',
              left: 0,
              right: 0,
              height: '50px',
              background: 'linear-gradient(180deg, rgba(16, 185, 129, 0.18) 0%, rgba(56, 189, 248, 0.08) 50%, rgba(16, 185, 129, 0) 100%)'
            }}
          />
        </div>
      )}

      {/* 2. Top-Right Floating Laser Telemetry Badge */}
      {lastScanDetail && isSweeping && (
        <div
          style={{
            position: 'absolute',
            top: '20px',
            right: '24px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '8px 16px',
            backgroundColor: 'rgba(15, 23, 42, 0.92)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(16, 185, 129, 0.4)',
            borderRadius: '100px',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5), 0 0 20px rgba(16, 185, 129, 0.3)',
            animation: 'dsBadgePopIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
          }}
        >
          <span
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: '#10B981',
              boxShadow: '0 0 10px #10B981'
            }}
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.78rem', color: '#F1F5F9' }}>
            <span style={{ fontWeight: 800, color: '#34D399' }}>⚡ USB SCANNER:</span>
            <code
              style={{
                fontFamily: 'monospace',
                fontSize: '0.75rem',
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                padding: '2px 6px',
                borderRadius: '4px',
                color: '#38BDF8'
              }}
            >
              {lastScanDetail.raw}
            </code>
            <span style={{ fontSize: '0.7rem', color: '#94A3B8' }}>
              ({lastScanDetail.symbology} • {lastScanDetail.burstMs || 18}ms)
            </span>
          </div>
        </div>
      )}

      <style>{`
        @keyframes dsLaserSweepDown {
          0% {
            top: -5px;
            opacity: 0;
          }
          15% {
            opacity: 1;
          }
          85% {
            opacity: 1;
          }
          100% {
            top: 100vh;
            opacity: 0;
          }
        }
        @keyframes dsBadgePopIn {
          0% {
            transform: translateY(-8px) scale(0.95);
            opacity: 0;
          }
          100% {
            transform: translateY(0) scale(1);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
};
