import React, { useEffect, useRef, useState } from 'react';

export interface HealthcareNode {
  id: string;
  name: string;
  category: string;
  color: string;
  pulseSpeed: number;
  orbitRadius: number;
  initialAngle: number;
  speed: number;
  icon: string;
}

export interface HealthcareNetworkCore3DProps {
  width?: string | number;
  height?: string | number;
  mode?: 'full' | 'ambient' | 'mini';
  interactive?: boolean;
  activeNodeId?: string;
  onNodeClick?: (nodeId: string) => void;
  className?: string;
  style?: React.CSSProperties;
}

const NETWORK_NODES: HealthcareNode[] = [
  { id: 'patient', name: 'Patient', category: 'EMR & Vitals', color: '#10B981', pulseSpeed: 1.2, orbitRadius: 130, initialAngle: 0, speed: 0.0035, icon: '👤' },
  { id: 'doctor', name: 'Doctor', category: 'Clinical Scribe', color: '#38BDF8', pulseSpeed: 1.5, orbitRadius: 130, initialAngle: 1.05, speed: 0.0035, icon: '🩺' },
  { id: 'hospital', name: 'Hospital', category: 'Inpatient & OT', color: '#6366F1', pulseSpeed: 1.1, orbitRadius: 130, initialAngle: 2.1, speed: 0.0035, icon: '🏥' },
  { id: 'lab', name: 'Pathology Lab', category: 'LIMS & IoT', color: '#06B6D4', pulseSpeed: 1.4, orbitRadius: 190, initialAngle: 3.14, speed: -0.0025, icon: '🔬' },
  { id: 'pharmacy', name: 'Pharmacy', category: 'POS & Inventory', color: '#EC4899', pulseSpeed: 1.3, orbitRadius: 190, initialAngle: 4.2, speed: -0.0025, icon: '💊' },
  { id: 'finance', name: 'Finance Ledger', category: 'GST & Escrow', color: '#EAB308', pulseSpeed: 1.0, orbitRadius: 190, initialAngle: 5.2, speed: -0.0025, icon: '💰' },
  { id: 'ai', name: 'AI Intelligence', category: 'Autonomous Bot', color: '#A855F7', pulseSpeed: 1.8, orbitRadius: 160, initialAngle: 2.6, speed: 0.004, icon: '⚡' }
];

export const HealthcareNetworkCore3D: React.FC<HealthcareNetworkCore3DProps> = ({
  width = '100%',
  height = 360,
  mode = 'full',
  interactive = true,
  activeNodeId,
  onNodeClick,
  className = '',
  style
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hoveredNode, setHoveredNode] = useState<HealthcareNode | null>(null);
  const [isReducedMotion, setIsReducedMotion] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setIsReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsReducedMotion(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let angleOffset = 0;
    let mouseX = 0;
    let mouseY = 0;
    let targetRotX = 0.35; // 3D pitch tilt
    let targetRotY = 0;
    let rotX = 0.35;
    let rotY = 0;
    let currentRenderedNodes: { id: string; x: number; y: number; r: number }[] = [];

    // Handle high DPI retina displays
    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const handleMouseMove = (e: MouseEvent) => {
      if (!interactive) return;
      const rect = canvas.getBoundingClientRect();
      const rawX = e.clientX - rect.left;
      const rawY = e.clientY - rect.top;
      mouseX = rawX - rect.width / 2;
      mouseY = rawY - rect.height / 2;
      targetRotY = (mouseX / (rect.width / 2)) * 0.45;
      targetRotX = 0.35 - (mouseY / (rect.height / 2)) * 0.35;

      const hit = currentRenderedNodes.find((n) => {
        const dx = n.x - rawX;
        const dy = n.y - rawY;
        return Math.sqrt(dx * dx + dy * dy) <= n.r + 6;
      });
      const nodeObj = hit ? NETWORK_NODES.find((n) => n.id === hit.id) || null : null;
      setHoveredNode(nodeObj);
    };

    const handleClick = (e: MouseEvent) => {
      if (!interactive || !onNodeClick) return;
      const rect = canvas.getBoundingClientRect();
      const rawX = e.clientX - rect.left;
      const rawY = e.clientY - rect.top;
      const hit = currentRenderedNodes.find((n) => {
        const dx = n.x - rawX;
        const dy = n.y - rawY;
        return Math.sqrt(dx * dx + dy * dy) <= n.r + 8;
      });
      if (hit) {
        onNodeClick(hit.id);
      }
    };

    const handleMouseLeave = () => {
      targetRotX = 0.35;
      targetRotY = 0;
      setHoveredNode(null);
    };

    if (interactive) {
      canvas.addEventListener('mousemove', handleMouseMove);
      canvas.addEventListener('mouseleave', handleMouseLeave);
      if (onNodeClick) {
        canvas.addEventListener('click', handleClick);
      }
    }

    // Packet transmission state
    const packets: { nodeIndex: number; progress: number; speed: number }[] = NETWORK_NODES.map((_, i) => ({
      nodeIndex: i,
      progress: Math.random(),
      speed: 0.008 + Math.random() * 0.006
    }));

    const render = () => {
      const rect = canvas.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;
      const centerX = w / 2;
      const centerY = h / 2;

      ctx.clearRect(0, 0, w, h);

      // Smooth camera interpolation
      rotX += (targetRotX - rotX) * 0.05;
      rotY += (targetRotY - rotY) * 0.05;

      if (!isReducedMotion) {
        angleOffset += 0.005;
      }

      // 3D Projection Helper
      const project3D = (x: number, y: number, z: number) => {
        // Rotate around Y axis
        const cosY = Math.cos(rotY);
        const sinY = Math.sin(rotY);
        const x1 = x * cosY + z * sinY;
        const z1 = -x * sinY + z * cosY;

        // Rotate around X axis (tilt)
        const cosX = Math.cos(rotX);
        const sinX = Math.sin(rotX);
        const y2 = y * cosX - z1 * sinX;
        const z2 = y * sinX + z1 * cosX;

        // Perspective division
        const fov = 380;
        const scale = fov / (fov + z2);
        return {
          x: centerX + x1 * scale,
          y: centerY + y2 * scale,
          scale,
          depth: z2
        };
      };

      // 1. Draw 3D Orbital Guides
      const drawOrbitRing = (radius: number, color: string, alpha: number) => {
        ctx.beginPath();
        const steps = 64;
        for (let i = 0; i <= steps; i++) {
          const theta = (i / steps) * Math.PI * 2;
          const px = Math.cos(theta) * radius;
          const pz = Math.sin(theta) * radius;
          const pt = project3D(px, 0, pz);
          if (i === 0) ctx.moveTo(pt.x, pt.y);
          else ctx.lineTo(pt.x, pt.y);
        }
        ctx.strokeStyle = color;
        ctx.lineWidth = 1;
        ctx.globalAlpha = alpha;
        ctx.stroke();
        ctx.globalAlpha = 1;
      };

      drawOrbitRing(130, '#38BDF8', 0.15);
      drawOrbitRing(160, '#A855F7', 0.12);
      drawOrbitRing(190, '#10B981', 0.10);

      // 2. Central DOC SEARCH Core Node
      const corePos = project3D(0, 0, 0);

      // Core Ambient Aura Glow
      const coreGlow = ctx.createRadialGradient(corePos.x, corePos.y, 4, corePos.x, corePos.y, 42 * corePos.scale);
      coreGlow.addColorStop(0, 'rgba(6, 182, 212, 0.45)');
      coreGlow.addColorStop(0.5, 'rgba(56, 189, 248, 0.18)');
      coreGlow.addColorStop(1, 'transparent');
      ctx.fillStyle = coreGlow;
      ctx.beginPath();
      ctx.arc(corePos.x, corePos.y, 42 * corePos.scale, 0, Math.PI * 2);
      ctx.fill();

      // Core Solid Orb
      ctx.beginPath();
      ctx.arc(corePos.x, corePos.y, 14 * corePos.scale, 0, Math.PI * 2);
      ctx.fillStyle = '#06B6D4';
      ctx.shadowColor = '#06B6D4';
      ctx.shadowBlur = 16 * corePos.scale;
      ctx.fill();
      ctx.shadowBlur = 0;

      // Core Outer Pulsing Ring
      const pulseRingSize = (18 + Math.sin(angleOffset * 3) * 3) * corePos.scale;
      ctx.beginPath();
      ctx.arc(corePos.x, corePos.y, pulseRingSize, 0, Math.PI * 2);
      ctx.strokeStyle = '#38BDF8';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Core Core Label
      if (mode !== 'mini') {
        ctx.fillStyle = '#FFFFFF';
        ctx.font = `bold ${Math.round(11 * corePos.scale)}px Inter, sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText('DOC SEARCH', corePos.x, corePos.y + 28 * corePos.scale);
        ctx.fillStyle = '#38BDF8';
        ctx.font = `${Math.round(8 * corePos.scale)}px Inter, sans-serif`;
        ctx.fillText('HEALTHCARE OS CORE', corePos.x, corePos.y + 39 * corePos.scale);
      }

      // 3. Compute 3D Positions for Satellites
      const satellitePositions = NETWORK_NODES.map((node, index) => {
        const currentAngle = node.initialAngle + angleOffset * (node.speed / 0.0035);
        const px = Math.cos(currentAngle) * node.orbitRadius;
        const py = Math.sin(currentAngle * 2) * 14; // gentle undulating vertical wave
        const pz = Math.sin(currentAngle) * node.orbitRadius;
        const proj = project3D(px, py, pz);
        return { node, proj, index };
      });

      currentRenderedNodes = satellitePositions.map(({ node, proj }) => ({
        id: node.id,
        x: proj.x,
        y: proj.y,
        r: (hoveredNode?.id === node.id || activeNodeId === node.id ? 14 : 10) * proj.scale
      }));

      // Sort by depth (painter's algorithm)
      satellitePositions.sort((a, b) => a.proj.depth - b.proj.depth);

      // 4. Draw Connection Beams & Flowing Data Packets
      satellitePositions.forEach(({ node, proj, index }) => {
        // Draw 3D Connection Line
        ctx.beginPath();
        ctx.moveTo(corePos.x, corePos.y);
        ctx.lineTo(proj.x, proj.y);
        ctx.strokeStyle = node.color;
        ctx.lineWidth = (hoveredNode?.id === node.id || activeNodeId === node.id) ? 2 : 1;
        ctx.globalAlpha = (hoveredNode?.id === node.id || activeNodeId === node.id) ? 0.6 : 0.22;
        ctx.stroke();
        ctx.globalAlpha = 1;

        // Draw Flowing Data Photon Packet
        if (!isReducedMotion) {
          const packet = packets[index];
          if (packet) {
            packet.progress = (packet.progress + packet.speed) % 1;
            const packetX = corePos.x + (proj.x - corePos.x) * packet.progress;
            const packetY = corePos.y + (proj.y - corePos.y) * packet.progress;
            ctx.beginPath();
            ctx.arc(packetX, packetY, 2.5 * proj.scale, 0, Math.PI * 2);
            ctx.fillStyle = '#FFFFFF';
            ctx.shadowColor = node.color;
            ctx.shadowBlur = 8;
            ctx.fill();
            ctx.shadowBlur = 0;
          }
        }
      });

      // 5. Draw Satellite Nodes
      satellitePositions.forEach(({ node, proj }) => {
        const isHovered = hoveredNode?.id === node.id;
        const isActive = activeNodeId === node.id;
        const radius = (isHovered || isActive ? 12 : 9) * proj.scale;

        // Ambient Aura
        const nodeGlow = ctx.createRadialGradient(proj.x, proj.y, 2, proj.x, proj.y, radius * 3);
        nodeGlow.addColorStop(0, `${node.color}60`);
        nodeGlow.addColorStop(1, 'transparent');
        ctx.fillStyle = nodeGlow;
        ctx.beginPath();
        ctx.arc(proj.x, proj.y, radius * 3, 0, Math.PI * 2);
        ctx.fill();

        // Node Circle
        ctx.beginPath();
        ctx.arc(proj.x, proj.y, radius, 0, Math.PI * 2);
        ctx.fillStyle = isHovered || isActive ? '#FFFFFF' : node.color;
        ctx.shadowColor = node.color;
        ctx.shadowBlur = isHovered || isActive ? 18 : 10;
        ctx.fill();
        ctx.shadowBlur = 0;

        // Node Ring
        ctx.beginPath();
        ctx.arc(proj.x, proj.y, radius + 3 * proj.scale, 0, Math.PI * 2);
        ctx.strokeStyle = node.color;
        ctx.lineWidth = 1;
        ctx.stroke();

        // Node Label
        if (mode === 'full') {
          ctx.fillStyle = isHovered || isActive ? '#FFFFFF' : '#CBD5E1';
          ctx.font = `${isHovered ? 'bold ' : ''}${Math.round(10 * proj.scale)}px Inter, sans-serif`;
          ctx.textAlign = 'center';
          ctx.fillText(node.name, proj.x, proj.y + radius + 14 * proj.scale);

          ctx.fillStyle = node.color;
          ctx.font = `${Math.round(7.5 * proj.scale)}px Inter, sans-serif`;
          ctx.fillText(node.category.toUpperCase(), proj.x, proj.y + radius + 23 * proj.scale);
        }
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', resizeCanvas);
      if (interactive) {
        canvas.removeEventListener('mousemove', handleMouseMove);
        canvas.removeEventListener('mouseleave', handleMouseLeave);
        if (onNodeClick) {
          canvas.removeEventListener('click', handleClick);
        }
      }
    };
  }, [interactive, mode, activeNodeId, isReducedMotion, onNodeClick]);

  return (
    <div
      className={`ds-3d-network-container ds-card ${className}`}
      style={{
        width,
        height,
        position: 'relative',
        borderRadius: '16px',
        overflow: 'hidden',
        backgroundColor: '#070C18',
        border: '1px solid rgba(56, 189, 248, 0.25)',
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6), inset 0 1px 1px rgba(255, 255, 255, 0.1)',
        ...style
      }}
    >
      {/* Background Spatial Grid */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: 'radial-gradient(rgba(56, 189, 248, 0.08) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
          opacity: 0.6,
          pointerEvents: 'none'
        }}
      />

      {/* Top HUD Telemetry Status */}
      <div
        style={{
          position: 'absolute',
          top: '12px',
          left: '16px',
          right: '16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          pointerEvents: 'none',
          zIndex: 10
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span
            className="ds-pulse-indicator"
            style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10B981', boxShadow: '0 0 10px #10B981' }}
          />
          <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#E2E8F0', letterSpacing: '0.04em' }}>
            3D HEALTHCARE ECOSYSTEM MESH
          </span>
          <span
            style={{
              fontSize: '0.65rem',
              backgroundColor: 'rgba(6, 182, 212, 0.15)',
              border: '1px solid rgba(6, 182, 212, 0.35)',
              color: '#38BDF8',
              padding: '1px 6px',
              borderRadius: '6px',
              fontWeight: 700
            }}
          >
            REAL-TIME SYNCHRONIZED
          </span>
        </div>

        <div style={{ fontSize: '0.7rem', color: '#94A3B8', display: 'flex', gap: '10px' }}>
          <span>LATENCY: <strong>12ms</strong></span>
          <span>SATELLITES: <strong>7 CONNECTED</strong></span>
        </div>
      </div>

      <canvas
        ref={canvasRef}
        style={{
          width: '100%',
          height: '100%',
          display: 'block',
          cursor: interactive ? 'grab' : 'default'
        }}
      />

      {/* Bottom Hint */}
      {interactive && (
        <div
          style={{
            position: 'absolute',
            bottom: '10px',
            right: '16px',
            fontSize: '0.6875rem',
            color: '#64748B',
            pointerEvents: 'none',
            zIndex: 10
          }}
        >
          <span>✦ Move pointer to tilt 3D perspective</span>
        </div>
      )}
    </div>
  );
};
