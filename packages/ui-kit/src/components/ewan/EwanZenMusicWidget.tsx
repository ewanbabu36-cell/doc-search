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
  /** Render in ultra-compact mode alongside the smaller AI orb */
  compact?: boolean;
}

export const EwanZenMusicWidget: React.FC<EwanZenMusicWidgetProps> = ({
  className,
  style,
  variant = 'floating-dock',
  compact = true
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
      <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
        <button
          type="button"
          onClick={handleTogglePlay}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            backgroundColor: isPlaying ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 255, 255, 0.06)',
            border: isPlaying ? '1px solid rgba(16, 185, 129, 0.5)' : '1px solid rgba(255, 255, 255, 0.12)',
            color: isPlaying ? '#34D399' : '#94A3B8',
            borderRadius: '16px',
            padding: '3px 8px',
            fontSize: '0.6875rem',
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            boxShadow: isPlaying ? '0 0 10px rgba(16, 185, 129, 0.25)' : 'none'
          }}
          title={isPlaying ? 'Pause Calm Music' : 'Play Calm Ambient Music'}
        >
          <span style={{ fontSize: '0.78rem' }}>{isPlaying ? '🎵' : '🎼'}</span>
          <span>{isPlaying ? 'Playing' : 'Music'}</span>
          {isPlaying && (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '2px',
                height: '8px'
              }}
            >
              <span className="ds-zen-wave-bar" style={{ width: '2px', height: '6px', backgroundColor: '#34D399', borderRadius: '1px', animation: 'dsZenBounce 0.8s infinite ease-in-out' }} />
              <span className="ds-zen-wave-bar" style={{ width: '2px', height: '10px', backgroundColor: '#34D399', borderRadius: '1px', animation: 'dsZenBounce 0.8s infinite ease-in-out 0.2s' }} />
              <span className="ds-zen-wave-bar" style={{ width: '2px', height: '5px', backgroundColor: '#34D399', borderRadius: '1px', animation: 'dsZenBounce 0.8s infinite ease-in-out 0.4s' }} />
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setShowHud((prev) => !prev)}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#64748B',
            cursor: 'pointer',
            fontSize: '0.65rem',
            padding: '2px 4px',
            lineHeight: 1
          }}
          title="Sound volume & soundscape"
        >
          ▾
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
          width: compact ? '30px' : '36px',
          height: compact ? '30px' : '36px',
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
          fontSize: compact ? '0.78rem' : '0.95rem',
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
              width: '7px',
              height: '7px',
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
          bottom: variant === 'header-button' ? 'auto' : '44px',
          top: variant === 'header-button' ? '30px' : 'auto',
          right: '0',
          width: '230px',
          backgroundColor: '#090D16',
          border: '1px solid rgba(56, 189, 248, 0.3)',
          borderRadius: '12px',
          padding: '12px',
          boxShadow: '0 12px 32px rgba(0, 0, 0, 0.85), 0 0 16px rgba(6, 182, 212, 0.2)',
          backdropFilter: 'blur(20px)',
          zIndex: 99999,
          color: '#F8FAFC',
          fontFamily: 'system-ui, -apple-system, sans-serif'
        }}
      >
        {/* HUD Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '0.95rem' }}>🧘</span>
            <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#F8FAFC' }}>
              Calm Soundscape
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowHud(false)}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94A3B8',
              fontSize: '0.85rem',
              cursor: 'pointer',
              padding: '2px 4px',
              lineHeight: 1
            }}
          >
            ✕
          </button>
        </div>

        {/* Volume Slider */}
        <div style={{ marginBottom: '10px', backgroundColor: 'rgba(255, 255, 255, 0.04)', padding: '6px 8px', borderRadius: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
            <span style={{ fontSize: '0.65rem', color: '#94A3B8', fontWeight: 600 }}>
              Volume:
            </span>
            <span style={{ fontSize: '0.65rem', color: '#38BDF8', fontWeight: 800 }}>
              {Math.round(volume * 100)}%
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
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
                  gap: '8px',
                  padding: '6px 8px',
                  borderRadius: '6px',
                  border: active ? '1px solid #10B981' : '1px solid rgba(255, 255, 255, 0.06)',
                  backgroundColor: active ? 'rgba(16, 185, 129, 0.16)' : 'transparent',
                  color: active ? '#FFFFFF' : '#CBD5E1',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.12s ease'
                }}
              >
                <span style={{ fontSize: '0.9rem' }}>{t.icon}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, color: active ? '#34D399' : '#F1F5F9', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {t.name}
                  </div>
                </div>
                {active && isPlaying && (
                  <span style={{ fontSize: '0.55rem', color: '#34D399', fontWeight: 800, backgroundColor: 'rgba(16, 185, 129, 0.2)', padding: '1px 4px', borderRadius: '4px' }}>
                    PLAYING
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    );
  }
};
