import React, { useRef, useEffect, useState } from 'react';
import { useEffectIntensity } from './EffectIntensityContext';

export interface FacilitySector {
  id: string;
  name: string;
  code: string;
  icon: string;
  color: string;
  x: number;
  z: number;
}

export const FACILITY_SECTORS: FacilitySector[] = [
  { id: 'opd', name: 'OPD Clinics', code: 'SEC-01', icon: '🩺', color: '#06B6D4', x: -120, z: -60 },
  { id: 'ipd', name: 'Inpatient Wards', code: 'SEC-02', icon: '🏥', color: '#3B82F6', x: 0, z: -100 },
  { id: 'icu', name: 'ICU & Critical Care', code: 'SEC-03', icon: '🚨', color: '#EF4444', x: 120, z: -60 },
  { id: 'lab', name: 'Pathology Lab', code: 'SEC-04', icon: '🧪', color: '#F59E0B', x: -140, z: 40 },
  { id: 'pharmacy', name: 'Pharmacy & POS', code: 'SEC-05', icon: '💊', color: '#EC4899', x: -50, z: 80 },
  { id: 'radiology', name: 'Radiology & PACS', code: 'SEC-06', icon: '🔬', color: '#8B5CF6', x: 50, z: 80 },
  { id: 'bloodbank', name: 'Blood Bank', code: 'SEC-07', icon: '🩸', color: '#E11D48', x: 140, z: 40 },
  { id: 'billing', name: 'Billing & Cashier', code: 'SEC-08', icon: '⚡', color: '#10B981', x: 0, z: 0 }
];

export interface DigitalTwinFacility3DProps {
  facilityName?: string;
  height?: number;
  activeSectorId?: string;
  onSectorClick?: (sectorId: string) => void;
  metrics?: Record<string, { count?: number; label?: string; status?: 'NOMINAL' | 'BUSY' | 'ALERT' }>;
  interactive?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export const DigitalTwinFacility3D: React.FC<DigitalTwinFacility3DProps> = ({
  facilityName = 'METROPOLITAN HEALTHCARE COMPLEX',
  height = 340,
  activeSectorId,
  onSectorClick,
  metrics,
  interactive = true,
  className = '',
  style = {}
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameIdRef = useRef<number | null>(null);
  const rotAngleRef = useRef<number>(0.2);
  const isDraggingRef = useRef<boolean>(false);
  const dragStartRef = useRef<{ x: number; angle: number }>({ x: 0, angle: 0 });
  const hoveredSectorRef = useRef<string | null>(null);
  const [hoveredSector, setHoveredSector] = useState<string | null>(null);

  const { prefersReducedMotion } = useEffectIntensity();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = (canvas.width = canvas.parentElement?.clientWidth || 700);
    let h = (canvas.height = height);

    const resizeObserver = new ResizeObserver(() => {
      if (canvas.parentElement) {
        width = canvas.width = canvas.parentElement.clientWidth;
        h = canvas.height = height;
      }
    });
    if (canvas.parentElement) resizeObserver.observe(canvas.parentElement);

    // Hit-testing state
    const screenNodes: Array<{ id: string; x: number; y: number; r: number }> = [];

    const handlePointerDown = (e: PointerEvent) => {
      if (!interactive) return;
      isDraggingRef.current = true;
      dragStartRef.current = { x: e.clientX, angle: rotAngleRef.current };
    };

    const handlePointerMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      const px = e.clientX - rect.left;
      const py = e.clientY - rect.top;

      if (isDraggingRef.current) {
        const dx = e.clientX - dragStartRef.current.x;
        rotAngleRef.current = dragStartRef.current.angle + dx * 0.008;
      } else {
        // Hit-test nodes
        let hit: string | null = null;
        for (const n of screenNodes) {
          const dist = Math.hypot(px - n.x, py - n.y);
          if (dist <= n.r + 10) {
            hit = n.id;
            break;
          }
        }
        hoveredSectorRef.current = hit;
        setHoveredSector(hit);
        canvas.style.cursor = hit ? 'pointer' : 'grab';
      }
    };

    const handlePointerUp = (e: PointerEvent) => {
      if (isDraggingRef.current) {
        const dx = Math.abs(e.clientX - dragStartRef.current.x);
        isDraggingRef.current = false;
        // If minimal drag, treat as click
        if (dx < 6 && hoveredSectorRef.current) {
          onSectorClick?.(hoveredSectorRef.current);
        }
      }
    };

    canvas.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);

    const fov = 420;
    const cameraY = -120;
    const cameraZ = 340;

    const render = () => {
      if (!document.hidden) {
        ctx.clearRect(0, 0, width, h);

        if (!isDraggingRef.current && !prefersReducedMotion) {
          rotAngleRef.current += 0.003;
        }

        const angle = rotAngleRef.current;
        const cosA = Math.cos(angle);
        const sinA = Math.sin(angle);
        const cx = width / 2;
        const cy = h / 2 + 10;

        // Draw Spatial Ground Grid
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.08)';
        ctx.lineWidth = 0.8;
        const gridSize = 160;
        const gridStep = 40;

        for (let gx = -gridSize; gx <= gridSize; gx += gridStep) {
          // Line along Z
          const rx1 = gx * cosA - (-gridSize) * sinA;
          const rz1 = gx * sinA + (-gridSize) * cosA + cameraZ;
          const rx2 = gx * cosA - (gridSize) * sinA;
          const rz2 = gx * sinA + (gridSize) * cosA + cameraZ;

          if (rz1 > 20 && rz2 > 20) {
            const sx1 = cx + (rx1 * fov) / rz1;
            const sy1 = cy + ((cameraY + 30) * fov) / rz1;
            const sx2 = cx + (rx2 * fov) / rz2;
            const sy2 = cy + ((cameraY + 30) * fov) / rz2;
            ctx.beginPath();
            ctx.moveTo(sx1, sy1);
            ctx.lineTo(sx2, sy2);
            ctx.stroke();
          }
        }

        screenNodes.length = 0;

        // Project sectors
        const projectedSectors = FACILITY_SECTORS.map((sec) => {
          const rx = sec.x * cosA - sec.z * sinA;
          const rz = sec.x * sinA + sec.z * cosA + cameraZ;
          const scale = fov / rz;
          const sx = cx + rx * scale;
          const sy = cy + (cameraY * scale);
          return { ...sec, sx, sy, scale, rz };
        }).sort((a, b) => b.rz - a.rz);

        // Draw conduits connecting to central billing hub
        const hub = projectedSectors.find((s) => s.id === 'billing');
        if (hub) {
          for (const s of projectedSectors) {
            if (s.id === 'billing') continue;
            ctx.beginPath();
            ctx.moveTo(hub.sx, hub.sy);
            ctx.lineTo(s.sx, s.sy);
            ctx.strokeStyle = `${s.color}35`;
            ctx.lineWidth = 1.2;
            ctx.setLineDash([4, 4]);
            ctx.stroke();
            ctx.setLineDash([]);
          }
        }

        // Draw Sector Pavilions
        for (const s of projectedSectors) {
          const isHovered = hoveredSectorRef.current === s.id;
          const isSelected = activeSectorId === s.id;
          const nodeRadius = 14 * s.scale * (isHovered || isSelected ? 1.25 : 1);

          screenNodes.push({ id: s.id, x: s.sx, y: s.sy, r: nodeRadius });

          // Sector Halo Bloom
          if (isHovered || isSelected) {
            ctx.beginPath();
            ctx.arc(s.sx, s.sy, nodeRadius * 2, 0, Math.PI * 2);
            ctx.fillStyle = `${s.color}25`;
            ctx.fill();
          }

          // Pavilion Base Block (Isometric Cube)
          ctx.beginPath();
          ctx.arc(s.sx, s.sy, nodeRadius, 0, Math.PI * 2);
          ctx.fillStyle = isSelected ? s.color : 'rgba(15, 23, 42, 0.9)';
          ctx.strokeStyle = s.color;
          ctx.lineWidth = isHovered || isSelected ? 2.5 : 1.5;
          ctx.shadowColor = s.color;
          ctx.shadowBlur = isHovered || isSelected ? 16 : 4;
          ctx.fill();
          ctx.stroke();
          ctx.shadowBlur = 0;

          // Icon
          ctx.font = `${Math.floor(11 * s.scale)}px sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillStyle = '#FFFFFF';
          ctx.fillText(s.icon, s.sx, s.sy);

          // Sector Name Tag
          const metric = metrics?.[s.id];
          const tagY = s.sy + nodeRadius + 12;
          ctx.font = `bold ${Math.max(9, Math.floor(10 * s.scale))}px Inter, sans-serif`;
          ctx.fillStyle = isHovered || isSelected ? '#FFFFFF' : '#CBD5E1';
          ctx.fillText(s.name, s.sx, tagY);

          if (metric) {
            ctx.font = `600 ${Math.max(8, Math.floor(9 * s.scale))}px Inter, sans-serif`;
            ctx.fillStyle = metric.status === 'ALERT' ? '#EF4444' : s.color;
            ctx.fillText(metric.label || `${metric.count ?? 0} Active`, s.sx, tagY + 11);
          }
        }
      }

      animFrameIdRef.current = requestAnimationFrame(render);
    };

    animFrameIdRef.current = requestAnimationFrame(render);

    return () => {
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
      canvas.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      resizeObserver.disconnect();
    };
  }, [height, activeSectorId, onSectorClick, metrics, interactive, prefersReducedMotion]);

  return (
    <div
      className={`ds-digital-twin-facility ${className}`}
      style={{
        position: 'relative',
        width: '100%',
        height: `${height}px`,
        backgroundColor: '#070C18',
        borderRadius: '16px',
        overflow: 'hidden',
        border: '1px solid rgba(56, 189, 248, 0.22)',
        boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.08)',
        ...style
      }}
    >
      {/* Header Bar */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          padding: '12px 18px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: 'rgba(11, 16, 30, 0.75)',
          backdropFilter: 'blur(10px)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
          zIndex: 10,
          pointerEvents: 'none'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '1rem' }}>🏥</span>
          <span style={{ fontSize: '0.8125rem', fontWeight: 900, color: '#F8FAFC', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
            {facilityName}
          </span>
          <span style={{ fontSize: '0.65rem', fontWeight: 800, color: '#06B6D4', backgroundColor: 'rgba(6, 182, 212, 0.15)', padding: '2px 8px', borderRadius: '12px', border: '1px solid rgba(6, 182, 212, 0.3)' }}>
            DIGITAL TWIN 3D
          </span>
        </div>
        <span style={{ fontSize: '0.72rem', color: '#94A3B8' }}>
          {hoveredSector ? `Selected: ${hoveredSector.toUpperCase()}` : 'Drag to rotate • Click sector to inspect'}
        </span>
      </div>

      <canvas
        ref={canvasRef}
        style={{
          width: '100%',
          height: `${height}px`,
          display: 'block'
        }}
      />
    </div>
  );
};
