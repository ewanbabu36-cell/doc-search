import React, { useRef, useEffect } from 'react';
import { useEffectIntensity } from './EffectIntensityContext';

export type AICoreState = 'IDLE' | 'LISTENING' | 'PROCESSING' | 'AUTHORIZED' | 'COMPLETED' | 'ERROR';

export interface AICoreProps {
  state?: AICoreState;
  size?: number;
  showWaveform?: boolean;
  showStatusBadge?: boolean;
  statusLabel?: string;
  interactive?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

const STATE_CONFIG: Record<AICoreState, { primaryColor: string; secondaryColor: string; glowColor: string; label: string; ringSpeed: number }> = {
  IDLE: {
    primaryColor: '#0284C7',
    secondaryColor: '#38BDF8',
    glowColor: 'rgba(2, 132, 199, 0.25)',
    label: 'AI Core Standby',
    ringSpeed: 0.005
  },
  LISTENING: {
    primaryColor: '#6366F1',
    secondaryColor: '#818CF8',
    glowColor: 'rgba(99, 102, 241, 0.25)',
    label: 'Listening & Capturing',
    ringSpeed: 0.008
  },
  PROCESSING: {
    primaryColor: '#0EA5E9',
    secondaryColor: '#0284C7',
    glowColor: 'rgba(14, 165, 233, 0.3)',
    label: 'Clinical Synthesis Active',
    ringSpeed: 0.012
  },
  AUTHORIZED: {
    primaryColor: '#10B981',
    secondaryColor: '#34D399',
    glowColor: 'rgba(16, 185, 129, 0.25)',
    label: 'Security & Clinical Cleared',
    ringSpeed: 0.006
  },
  COMPLETED: {
    primaryColor: '#10B981',
    secondaryColor: '#0EA5E9',
    glowColor: 'rgba(16, 185, 129, 0.25)',
    label: 'Response Ready',
    ringSpeed: 0.005
  },
  ERROR: {
    primaryColor: '#EF4444',
    secondaryColor: '#F87171',
    glowColor: 'rgba(239, 68, 68, 0.3)',
    label: 'Subsystem Alert',
    ringSpeed: 0.004
  }
};

export const AICore: React.FC<AICoreProps> = ({
  state = 'IDLE',
  size = 180,
  showWaveform = true,
  showStatusBadge = true,
  statusLabel,
  interactive = true,
  className = '',
  style = {}
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameIdRef = useRef<number | null>(null);
  const isVisibleRef = useRef<boolean>(true);
  const mousePosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const { prefersReducedMotion } = useEffectIntensity();
  const currentConfig = STATE_CONFIG[state] || STATE_CONFIG.IDLE;
  const activeLabel = statusLabel || currentConfig.label;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);

    const centerX = size / 2;
    const centerY = size / 2;
    const baseRadius = size * 0.22;

    let angle1 = 0;
    let angle2 = Math.PI / 4;
    let angle3 = Math.PI / 2;
    let pulsePhase = 0;

    // Neural nodes in 3D sphere coordinate
    const nodeCount = 18;
    const nodes: Array<{ theta: number; phi: number; r: number }> = [];
    for (let i = 0; i < nodeCount; i++) {
      nodes.push({
        theta: Math.random() * Math.PI * 2,
        phi: (Math.random() - 0.5) * Math.PI,
        r: baseRadius * (1.1 + Math.random() * 0.4)
      });
    }

    // Pointer tilt tracking
    const handleMouseMove = (e: MouseEvent) => {
      if (!interactive) return;
      const rect = canvas.getBoundingClientRect();
      const nx = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
      const ny = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
      mousePosRef.current = { x: nx * 0.35, y: ny * 0.35 };
    };

    if (interactive) {
      window.addEventListener('mousemove', handleMouseMove, { passive: true });
    }

    // Visibility Observer
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        isVisibleRef.current = entry.isIntersecting;
      }
    });
    observer.observe(canvas);

    const render = () => {
      if (!document.hidden && isVisibleRef.current) {
        ctx.clearRect(0, 0, size, size);

        const speed = prefersReducedMotion ? 0 : currentConfig.ringSpeed;
        angle1 += speed;
        angle2 -= speed * 1.25;
        angle3 += speed * 0.75;
        pulsePhase += prefersReducedMotion ? 0 : 0.04;

        const pulseScale = 1 + Math.sin(pulsePhase) * (state === 'PROCESSING' ? 0.08 : 0.04);
        const mx = mousePosRef.current.x;
        const my = mousePosRef.current.y;

        // 1. Soft Volumetric Outer Glow
        const glowRad = ctx.createRadialGradient(
          centerX + mx * 10,
          centerY + my * 10,
          baseRadius * 0.4,
          centerX,
          centerY,
          size * 0.48
        );
        glowRad.addColorStop(0, currentConfig.glowColor);
        glowRad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = glowRad;
        ctx.beginPath();
        ctx.arc(centerX, centerY, size * 0.48, 0, Math.PI * 2);
        ctx.fill();

        // 2. Central 3D Core Sphere
        const coreRad = ctx.createRadialGradient(
          centerX - baseRadius * 0.35 + mx * 8,
          centerY - baseRadius * 0.35 + my * 8,
          baseRadius * 0.1,
          centerX,
          centerY,
          baseRadius * pulseScale
        );
        coreRad.addColorStop(0, '#FFFFFF');
        coreRad.addColorStop(0.3, currentConfig.primaryColor);
        coreRad.addColorStop(0.85, currentConfig.secondaryColor);
        coreRad.addColorStop(1, 'rgba(10, 15, 30, 0.95)');

        ctx.fillStyle = coreRad;
        ctx.beginPath();
        ctx.arc(centerX, centerY, baseRadius * pulseScale, 0, Math.PI * 2);
        ctx.fill();

        // 3. Floating Concentric Orbital Rings with 3D Perspective Tilt
        const drawOrbitalRing = (radiusX: number, radiusY: number, rot: number, color: string, width: number) => {
          ctx.save();
          ctx.translate(centerX, centerY);
          ctx.rotate(rot + mx);
          ctx.beginPath();
          ctx.ellipse(0, 0, radiusX, radiusY, 0, 0, Math.PI * 2);
          ctx.strokeStyle = color;
          ctx.lineWidth = width;
          ctx.stroke();

          // Energy photon on ring
          const photonX = Math.cos(rot * 3) * radiusX;
          const photonY = Math.sin(rot * 3) * radiusY;
          ctx.beginPath();
          ctx.arc(photonX, photonY, 2.2, 0, Math.PI * 2);
          ctx.fillStyle = '#FFFFFF';
          ctx.shadowColor = color;
          ctx.shadowBlur = 6;
          ctx.fill();
          ctx.restore();
        };

        drawOrbitalRing(baseRadius * 1.5, baseRadius * 0.55, angle1, currentConfig.primaryColor, 1.2);
        drawOrbitalRing(baseRadius * 1.75, baseRadius * 0.65, angle2, currentConfig.secondaryColor, 0.9);
        drawOrbitalRing(baseRadius * 1.3, baseRadius * 0.45, angle3, `${currentConfig.primaryColor}88`, 0.8);

        // 4. Orbiting Neural Particles
        for (let i = 0; i < nodes.length; i++) {
          const n = nodes[i];
          if (!n) continue;
          n.theta += speed * 0.5;

          // 3D sphere projection
          const cosPhi = Math.cos(n.phi);
          const sinPhi = Math.sin(n.phi);
          const cosTheta = Math.cos(n.theta + mx);
          const sinTheta = Math.sin(n.theta + mx);

          const px = centerX + n.r * cosPhi * sinTheta;
          const py = centerY + n.r * sinPhi + my * 15;
          const depth = (cosPhi * cosTheta + 1) / 2; // 0 to 1

          ctx.beginPath();
          ctx.arc(px, py, 1.2 + depth * 1.2, 0, Math.PI * 2);
          ctx.fillStyle = depth > 0.5 ? '#FFFFFF' : currentConfig.primaryColor;
          ctx.globalAlpha = 0.3 + depth * 0.6;
          ctx.fill();
        }
        ctx.globalAlpha = 1;

        // 5. Multi-Frequency Waveform Equalizer (when LISTENING or PROCESSING)
        if (showWaveform && (state === 'LISTENING' || state === 'PROCESSING')) {
          const waveY = centerY + size * 0.38;
          const waveWidth = size * 0.6;
          const waveStart = centerX - waveWidth / 2;

          ctx.beginPath();
          for (let x = 0; x <= waveWidth; x += 3) {
            const freq = state === 'PROCESSING' ? 0.08 : 0.04;
            const amp = (state === 'PROCESSING' ? 6 : 4) * Math.sin((x / waveWidth) * Math.PI);
            const y = waveY + Math.sin(x * freq + pulsePhase * 3) * amp;
            if (x === 0) ctx.moveTo(waveStart + x, y);
            else ctx.lineTo(waveStart + x, y);
          }
          ctx.strokeStyle = currentConfig.primaryColor;
          ctx.lineWidth = 1.4;
          ctx.shadowColor = currentConfig.primaryColor;
          ctx.shadowBlur = 4;
          ctx.stroke();
          ctx.shadowBlur = 0;
        }
      }

      animFrameIdRef.current = requestAnimationFrame(render);
    };

    animFrameIdRef.current = requestAnimationFrame(render);

    return () => {
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
      if (interactive) window.removeEventListener('mousemove', handleMouseMove);
      observer.disconnect();
    };
  }, [state, size, showWaveform, interactive, currentConfig, prefersReducedMotion]);

  return (
    <div
      className={`ds-ai-core ${className}`}
      style={{
        display: 'inline-flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        width: `${size}px`,
        ...style
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          width: `${size}px`,
          height: `${size}px`,
          display: 'block'
        }}
      />

      {showStatusBadge && (
        <div
          style={{
            marginTop: '-6px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            backgroundColor: 'rgba(15, 23, 42, 0.85)',
            border: `1px solid ${currentConfig.primaryColor}55`,
            borderRadius: '16px',
            padding: '3px 10px',
            fontSize: '0.6875rem',
            fontWeight: 800,
            letterSpacing: '0.04em',
            color: '#F8FAFC',
            boxShadow: `0 4px 14px rgba(0, 0, 0, 0.4), 0 0 10px ${currentConfig.glowColor}`,
            textTransform: 'uppercase',
            zIndex: 2
          }}
        >
          <span
            style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              backgroundColor: currentConfig.primaryColor,
              boxShadow: `0 0 6px ${currentConfig.primaryColor}`,
              animation: 'ds-pulse-dot 2s infinite ease-in-out'
            }}
          />
          <span>{activeLabel}</span>
        </div>
      )}
    </div>
  );
};
