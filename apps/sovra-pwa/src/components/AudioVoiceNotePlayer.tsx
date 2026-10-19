// Sovra Audio Voice Note Player Component
// Sleek WhatsApp-style voice note bubble with playback waveform and 1x/1.5x/2x speed controls.

import React, { useState, useRef, useEffect } from 'react';
import { AudioVoiceNote } from '../types.js';

interface AudioVoiceNotePlayerProps {
  voiceNote: AudioVoiceNote;
  isOutgoing: boolean;
}

export const AudioVoiceNotePlayer: React.FC<AudioVoiceNotePlayerProps> = ({ voiceNote, isOutgoing }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = new Audio(voiceNote.audioBase64);
    audioRef.current = audio;

    audio.onended = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.ontimeupdate = () => {
      setCurrentTime(audio.currentTime);
    };

    return () => {
      audio.pause();
      audio.src = '';
    };
  }, [voiceNote.audioBase64]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.playbackRate = playbackSpeed;
      audio.play().catch((err) => console.warn('[Sovra Audio] Playback failed:', err));
      setIsPlaying(true);
    }
  };

  const handleSpeedToggle = () => {
    const nextSpeed = playbackSpeed === 1.0 ? 1.5 : playbackSpeed === 1.5 ? 2.0 : 1.0;
    setPlaybackSpeed(nextSpeed);
    if (audioRef.current) {
      audioRef.current.playbackRate = nextSpeed;
    }
  };

  const formatSec = (sec: number) => {
    const s = Math.floor(sec);
    const m = Math.floor(s / 60);
    const rem = s % 60;
    return `${m}:${rem < 10 ? '0' : ''}${rem}`;
  };

  const duration = voiceNote.durationSeconds || 5;
  const progressPercent = Math.min(100, Math.round((currentTime / duration) * 100));

  // Generate synthetic waveform bars if not provided
  const waveformBars = [40, 65, 85, 30, 95, 70, 50, 90, 60, 45, 80, 55, 75, 35, 90, 65, 50, 80];

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '6px 2px',
        minWidth: '220px',
        maxWidth: '280px'
      }}
    >
      {/* Play / Pause Toggle Button */}
      <button
        onClick={togglePlay}
        title={isPlaying ? 'Pause Voice Note' : 'Play Voice Note'}
        style={{
          background: isOutgoing ? '#0F766E' : '#334155',
          border: 'none',
          color: '#FFFFFF',
          borderRadius: '50%',
          width: '36px',
          height: '36px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          fontSize: '14px',
          flexShrink: 0,
          boxShadow: '0 2px 6px rgba(0,0,0,0.2)'
        }}
      >
        {isPlaying ? '⏸' : '▶'}
      </button>

      {/* Center Waveform & Progress */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {/* Waveform Bar Graphic */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '3px', height: '22px' }}>
          {waveformBars.map((heightPercent, idx) => {
            const barProgress = (idx / waveformBars.length) * 100;
            const isPlayed = barProgress <= progressPercent;
            return (
              <div
                key={idx}
                style={{
                  flex: 1,
                  height: `${heightPercent}%`,
                  background: isPlayed ? '#5EEAD4' : '#64748B',
                  borderRadius: '2px',
                  transition: 'background 0.1s ease'
                }}
              />
            );
          })}
        </div>

        {/* Time Stamp & Speed Pill */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '10px', color: '#CBD5E1' }}>
          <span>{isPlaying ? formatSec(currentTime) : formatSec(duration)}</span>
          <span style={{ fontSize: '9px', opacity: 0.8 }}>🎙️ Voice Note</span>
        </div>
      </div>

      {/* Speed multiplier pill */}
      <button
        onClick={handleSpeedToggle}
        title="Toggle playback speed"
        style={{
          background: 'rgba(255, 255, 255, 0.12)',
          border: '1px solid rgba(255, 255, 255, 0.25)',
          color: '#F8FAFC',
          borderRadius: '10px',
          padding: '2px 6px',
          fontSize: '10px',
          fontWeight: 800,
          cursor: 'pointer',
          flexShrink: 0
        }}
      >
        {playbackSpeed}x
      </button>
    </div>
  );
};
