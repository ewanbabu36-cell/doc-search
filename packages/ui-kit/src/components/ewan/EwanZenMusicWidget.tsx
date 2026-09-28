import React, { useState, useEffect, useRef } from 'react';
import {
  ewanZenAudio,
  ZEN_SOUNDSCAPE_TRACKS,
  type ZenSoundscapeTrack
} from './EwanZenAudioEngine.js';

export interface EwanZenMusicWidgetProps {
  /** Optional custom position style or class */
  className?: string;
  style?: React.CSSProperties;
  /** Whether to render as docked icon or expanded inline bar */
  variant?: 'floating-dock' | 'header-button' | 'compact-bar';
}

export const EwanZenMusicWidget: React.FC<EwanZenMusicWidgetProps> = ({
  className,
  style,
  variant = 'floating-dock'
}) => {
  const [isPlaying, setIsPlaying] = useState<boolean>(() => ewanZenAudio.getIsPlaying());
  const [volume, setVolume] = useState<number>(() => ewanZenAudio.getVolume());
  const [currentTrack, setCurrentTrack] = useState<ZenSoundscapeTrack>(() => ewanZenAudio.getTrack());
  const [showHud, setShowHud] = useState(false);
  const hudRef = useRef<HTMLDivElement>(null);

  // Sync state with global audio engine broadcasts
  useEffect(() => {
    const handleSync = (e: any) => {
      if (e.detail) {
        setIsPlaying(e.detail.isPlaying);
        setVolume(e.detail.volume);
        if (e.detail.track) {
          setCurrentTrack(e.detail.track);
        }
      }
    };

    window.addEventListener('docsearch:ewan_zen_music_state', handleSync);
    return () => window.removeEventListener('docsearch:ewan_zen_music_state', handleSync);
  }, []);

  // Close HUD on outside click
  useEffect(() => {
    if (!showHud) return;
    const handleOutside = (e: MouseEvent) => {
      if (hudRef.current && !hudRef.current.contains(e.target as Node)) {
        setShowHud(false);
      }
    };
    window.addEventListener('mousedown', handleOutside);
    return () => window.removeEventListener('mousedown', handleOutside);
  }, [showHud]);

  const handleTogglePlay = async (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (isPlaying) {
      ewanZenAudio.pause();
      setIsPlaying(false);
    } else {
      const started = await ewanZenAudio.play();
      setIsPlaying(started);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    ewanZenAudio.setVolume(val);
  };

  const handleSelectTrack = (trackId: string) => {
    ewanZenAudio.setTrack(trackId);
    setCurrentTrack(ewanZenAudio.getTrack());
    if (!isPlaying) {
      ewanZenAudio.play().then((ok) => setIsPlaying(ok));
    }
  };

  // Header button variant (for EWAN Chat Window Header)
  if (variant === 'header-button') {
    return (
      <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
        <button
          type="button"
          onClick={() => setShowHud((prev) => !prev)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            backgroundColor: isPlaying ? 'rgba(16, 185, 129, 0.18)' : 'rgba(255, 255, 255, 0.06)',
            border: isPlaying ? '1px solid rgba(16, 185, 129, 0.6)' : '1px solid rgba(255, 255, 255, 0.15)',
            color: isPlaying ? '#34D399' : '#94A3B8',
            borderRadius: '20px',
            padding: '4px 10px',
            fontSize: '0.72rem',
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            boxShadow: isPlaying ? '0 0 12px rgba(16, 185, 129, 0.3)' : 'none'
          }}
          title="EWAN Zen Calm Music • Click to toggle HUD"
        >
          <span style={{ fontSize: '0.85rem' }}>{isPlaying ? '🎵' : '🎼'}</span>
          <span>{isPlaying ? 'Zen: Playing' : 'Calm Music'}</span>
          {isPlaying && (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '2px',
                height: '10px'
              }}
            >
              <span className="ds-zen-wave-bar" style={{ width: '2px', height: '8px', backgroundColor: '#34D399', borderRadius: '1px', animation: 'dsZenBounce 0.8s infinite ease-in-out' }} />
              <span className="ds-zen-wave-bar" style={{ width: '2px', height: '12px', backgroundColor: '#34D399', borderRadius: '1px', animation: 'dsZenBounce 0.8s infinite ease-in-out 0.2s' }} />
              <span className="ds-zen-wave-bar" style={{ width: '2px', height: '6px', backgroundColor: '#34D399', borderRadius: '1px', animation: 'dsZenBounce 0.8s infinite ease-in-out 0.4s' }} />
            </span>
          )}
        </button>

        {showHud && renderHud()}
      </div>
    );
  }

  // Floating dock variant (docked right next to EWAN)
  return (
    <div
      className={className}
      style={{
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        userSelect: 'none',
        ...style
      }}
    >
      <style>{`
        @keyframes dsZenPulse {
          0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.6); }
          70% { box-shadow: 0 0 0 10px rgba(16, 185, 129, 0); }
          100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
        }
        @keyframes dsZenBounce {
          0%, 100% { transform: scaleY(0.4); }
          50% { transform: scaleY(1.2); }
        }
      `}</style>

      {/* Floating Zen Orb Button */}
      <button
        type="button"
        data-ewan-ignore-drag
        onClick={(e) => {
          e.stopPropagation();
          setShowHud((prev) => !prev);
        }}
        style={{
          position: 'relative',
          width: '38px',
          height: '38px',
          borderRadius: '50%',
          backgroundColor: isPlaying ? 'var(--ds-color-success-subtle, #064E3B)' : 'var(--ds-color-surface, #0F172A)',
          backgroundImage: isPlaying
            ? 'radial-gradient(circle at 35% 35%, var(--ds-color-success, #10B981), #065F46 70%, #022C22 100%)'
            : 'radial-gradient(circle at 35% 35%, var(--ds-color-surface-hover, #1E293B), var(--ds-color-surface, #0F172A) 70%, rgba(0,0,0,0.5) 100%)',
          border: isPlaying ? '2px solid var(--ds-color-success, #34D399)' : '1.5px solid var(--ds-color-border-strong, rgba(56, 189, 248, 0.4))',
          boxShadow: isPlaying
            ? '0 0 16px rgba(16, 185, 129, 0.7), inset 0 0 8px rgba(52, 211, 153, 0.5)'
            : 'var(--ds-shadow-base)',
          color: '#FFFFFF',
          fontSize: '1rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
          animation: isPlaying ? 'dsZenPulse 2.5s infinite' : 'none'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.12)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
        }}
        title={`EWAN Zen Music (${isPlaying ? 'Playing Slowly: ' + currentTrack.name : 'Click to Play Calmness Music'})`}
      >
        <span>{isPlaying ? '🎵' : '🎼'}</span>

        {/* Small live playing beacon */}
        {isPlaying && (
          <span
            style={{
              position: 'absolute',
              top: '-2px',
              right: '-2px',
              width: '9px',
              height: '9px',
              borderRadius: '50%',
              backgroundColor: 'var(--ds-color-success, #34D399)',
              border: '2px solid var(--ds-color-surface, #0F172A)',
              boxShadow: '0 0 6px var(--ds-color-success, #10B981)'
            }}
          />
        )}
      </button>

      {/* Futuristic Floating Zen HUD */}
      {showHud && renderHud()}
    </div>
  );

  function renderHud() {
    return (
      <div
        ref={hudRef}
        data-ewan-ignore-drag
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'absolute',
          bottom: variant === 'header-button' ? 'auto' : '48px',
          top: variant === 'header-button' ? '32px' : 'auto',
          right: '0',
          width: '320px',
          backgroundColor: 'var(--ds-color-surface, #090D16)',
          border: '1px solid var(--ds-color-border-strong, rgba(56, 189, 248, 0.35))',
          borderRadius: '16px',
          padding: '16px',
          boxShadow: 'var(--ds-shadow-xl)',
          backdropFilter: 'blur(20px)',
          zIndex: 99999,
          color: 'var(--ds-color-text-primary, #F8FAFC)',
          fontFamily: 'system-ui, -apple-system, sans-serif'
        }}
      >
        {/* HUD Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '1.25rem' }}>🧘</span>
            <div>
              <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#F8FAFC', letterSpacing: '0.02em' }}>
                EWAN Zen Audio Studio
              </div>
              <div style={{ fontSize: '0.6875rem', color: '#38BDF8' }}>
                HQ Calmness Ambient Soundscape
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowHud(false)}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94A3B8',
              fontSize: '1rem',
              cursor: 'pointer',
              padding: '2px 6px'
            }}
          >
            ✕
          </button>
        </div>

        {/* Master Play / Pause Hero Strip */}
        <div
          style={{
            backgroundColor: 'rgba(15, 23, 42, 0.8)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '12px',
            padding: '12px',
            marginBottom: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              type="button"
              onClick={handleTogglePlay}
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '50%',
                backgroundColor: isPlaying ? '#10B981' : '#0284C7',
                border: 'none',
                color: '#FFFFFF',
                fontSize: '1.1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: isPlaying ? '0 0 16px rgba(16, 185, 129, 0.6)' : '0 0 12px rgba(2, 132, 199, 0.4)',
                transition: 'all 0.2s ease'
              }}
            >
              {isPlaying ? '⏸' : '▶'}
            </button>
            <div>
              <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#FFFFFF' }}>
                {currentTrack.name}
              </div>
              <div style={{ fontSize: '0.6875rem', color: isPlaying ? '#34D399' : '#94A3B8' }}>
                {isPlaying ? '● Playing Slowly in Background' : '○ Paused • Click to Play'}
              </div>
            </div>
          </div>
        </div>

        {/* Volume Slider ("Slowly Baje" Control) */}
        <div style={{ marginBottom: '14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <span style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 600 }}>
              🔊 HQ Background Volume:
            </span>
            <span style={{ fontSize: '0.72rem', color: '#38BDF8', fontWeight: 800 }}>
              {Math.round(volume * 100)}% {volume <= 0.25 ? '(Calm & Soft)' : volume <= 0.6 ? '(Moderate)' : '(Loud)'}
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.02"
            value={volume}
            onChange={handleVolumeChange}
            style={{
              width: '100%',
              accentColor: '#10B981',
              cursor: 'pointer'
            }}
          />
        </div>

        {/* Track Selector List */}
        <div>
          <div style={{ fontSize: '0.7rem', color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase', marginBottom: '6px', letterSpacing: '0.05em' }}>
            Choose Soundscape:
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {ZEN_SOUNDSCAPE_TRACKS.map((t) => {
              const active = currentTrack.id === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => handleSelectTrack(t.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '8px 10px',
                    borderRadius: '8px',
                    border: active ? '1.5px solid #10B981' : '1px solid rgba(255, 255, 255, 0.08)',
                    backgroundColor: active ? 'rgba(16, 185, 129, 0.16)' : 'rgba(255, 255, 255, 0.03)',
                    color: active ? '#FFFFFF' : '#CBD5E1',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <span style={{ fontSize: '1.1rem' }}>{t.icon}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: active ? '#34D399' : '#F1F5F9' }}>
                      {t.name}
                    </div>
                    <div style={{ fontSize: '0.625rem', color: '#94A3B8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {t.description}
                    </div>
                  </div>
                  {active && isPlaying && (
                    <span style={{ fontSize: '0.65rem', color: '#34D399', fontWeight: 800 }}>
                      LIVE
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer Note */}
        <div style={{ marginTop: '12px', paddingTop: '8px', borderTop: '1px solid rgba(255, 255, 255, 0.08)', fontSize: '0.625rem', color: '#64748B', textAlign: 'center' }}>
          ⚡ 100% Offline Procedural Synth • Zero lag • Safe for Executive HQ
        </div>
      </div>
    );
  }
};
