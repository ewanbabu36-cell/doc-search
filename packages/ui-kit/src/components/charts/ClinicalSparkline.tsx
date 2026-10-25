import React, { useId, useState } from 'react';

export interface ClinicalSparklineProps {
  /** Array of numeric values across encounters/time (chronological order) */
  data: number[];
  /** Optional array of date/visit labels corresponding to data points */
  labels?: string[];
  /** Measurement unit e.g. 'mmHg', 'mg/dL', 'kg', '%' */
  unit?: string;
  /** Clinical normal range [min, max] */
  normalRange?: [number, number];
  /** SVG render width in pixels (default: 110) */
  width?: number;
  /** SVG render height in pixels (default: 28) */
  height?: number;
  /** Descriptive metric title for accessibility / tooltip */
  title?: string;
  /** Whether to render trend direction arrow & diff pill (default: true) */
  showDirection?: boolean;
  /** Custom stroke color override */
  strokeColor?: string;
  /** Custom area fill gradient color override */
  fillColor?: string;
  /**
   * Directional polarity:
   * When false (default for BP, Sugar, Weight), a downward trend towards normal is positive (emerald).
   * When true (e.g. SpO2, eGFR), an upward trend is positive.
   */
  higherIsBetter?: boolean;
  /** Optional container class name */
  className?: string;
  /** Optional inline styles */
  style?: React.CSSProperties;
  /** Callback when user hovers a data point */
  onPointHover?: (index: number | null) => void;
}

interface Point2D {
  x: number;
  y: number;
  val: number;
  label: string;
}

/**
 * Generate a smooth cubic bezier SVG path string from an array of coordinates.
 */
function generateSmoothPath(points: Point2D[]): string {
  if (points.length === 0) return '';
  const first = points[0];
  if (!first) return '';
  if (points.length === 1) return `M ${first.x} ${first.y}`;
  const second = points[1];
  if (points.length === 2 && second) {
    return `M ${first.x} ${first.y} L ${second.x} ${second.y}`;
  }

  let d = `M ${first.x} ${first.y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i === 0 ? 0 : i - 1] ?? first;
    const p1 = points[i] ?? first;
    const p2 = points[i + 1] ?? p1;
    const p3 = points[i + 2 < points.length ? i + 2 : i + 1] ?? p2;

    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;

    d += ` C ${cp1x.toFixed(2)} ${cp1y.toFixed(2)}, ${cp2x.toFixed(2)} ${cp2y.toFixed(2)}, ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`;
  }
  return d;
}

export const ClinicalSparkline: React.FC<ClinicalSparklineProps> = ({
  data,
  labels = [],
  unit = '',
  normalRange,
  width = 110,
  height = 28,
  title,
  showDirection = true,
  strokeColor,
  fillColor,
  higherIsBetter = false,
  className = '',
  style,
  onPointHover
}) => {
  const gradientId = useId().replace(/:/g, '_');
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  if (!data || data.length === 0) {
    return (
      <div
        className={`ds-clinical-sparkline-empty ${className}`}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width,
          height,
          color: '#64748B',
          fontSize: '0.65rem',
          ...style
        }}
      >
        —
      </div>
    );
  }

  const latestVal = data[data.length - 1] ?? 0;
  const firstVal = data[0] ?? latestVal;
  const diff = latestVal - firstVal;

  // Determine health color tier
  let resolvedColor = strokeColor;
  if (!resolvedColor) {
    if (normalRange) {
      const [minNorm, maxNorm] = normalRange;
      if (latestVal >= minNorm && latestVal <= maxNorm) {
        resolvedColor = '#10B981'; // Emerald (normal)
      } else if (
        latestVal > maxNorm * 1.3 ||
        latestVal < minNorm * 0.7
      ) {
        resolvedColor = '#EF4444'; // Red (critical out-of-range)
      } else {
        resolvedColor = '#F59E0B'; // Amber (borderline / elevated)
      }
    } else {
      resolvedColor = '#38BDF8'; // Sky blue default
    }
  }

  // Direction badge styling
  const isImproving = higherIsBetter ? diff > 0 : diff < 0;
  const isStable = Math.abs(diff) < 0.01;
  const trendArrow = isStable ? '→' : diff > 0 ? '↗' : '↘';
  const trendEmoji = isStable ? '🟢' : isImproving ? '📉' : '📈';

  // SVG coordinate mapping
  const padX = 6;
  const padY = 5;
  const plotWidth = Math.max(10, width - padX * 2);
  const plotHeight = Math.max(10, height - padY * 2);

  const minVal = Math.min(...data);
  const maxVal = Math.max(...data);
  const valSpan = maxVal - minVal === 0 ? 1 : maxVal - minVal;

  const points: Point2D[] = data.map((val, idx) => {
    const x =
      data.length === 1
        ? width / 2
        : padX + (idx / (data.length - 1)) * plotWidth;
    const y = padY + (1 - (val - minVal) / valSpan) * plotHeight;
    return { x, y, val, label: labels[idx] || `Visit ${idx + 1}` };
  });

  const firstPt = points[0];
  const lastPt = points[points.length - 1];

  const linePath = generateSmoothPath(points);
  const areaPath =
    points.length > 1 && firstPt && lastPt
      ? `${linePath} L ${lastPt.x} ${height - 1} L ${firstPt.x} ${height - 1} Z`
      : '';

  const activePoint = hoveredIdx !== null && hoveredIdx < points.length ? (points[hoveredIdx] ?? null) : null;

  return (
    <div
      className={`ds-clinical-sparkline-container ${className}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        position: 'relative',
        verticalAlign: 'middle',
        ...style
      }}
      title={
        title ||
        `${latestVal}${unit ? ` ${unit}` : ''} (${diff >= 0 ? '+' : ''}${diff.toFixed(1)}${unit})`
      }
    >
      {/* SVG Micro Chart */}
      <div style={{ position: 'relative', width, height }}>
        <svg
          width={width}
          height={height}
          viewBox={`0 0 ${width} ${height}`}
          style={{ overflow: 'visible', display: 'block' }}
          onMouseLeave={() => {
            setHoveredIdx(null);
            onPointHover?.(null);
          }}
        >
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={fillColor || resolvedColor} stopOpacity="0.32" />
              <stop offset="100%" stopColor={fillColor || resolvedColor} stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Area fill */}
          {areaPath && (
            <path
              d={areaPath}
              fill={`url(#${gradientId})`}
              pointerEvents="none"
            />
          )}

          {/* Sparkline curve */}
          <path
            d={linePath}
            fill="none"
            stroke={resolvedColor}
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Data Points */}
          {points.map((p, i) => {
            const isLast = i === points.length - 1;
            const isHovered = hoveredIdx === i;
            return (
              <g
                key={i}
                onMouseEnter={() => {
                  setHoveredIdx(i);
                  onPointHover?.(i);
                }}
                style={{ cursor: 'pointer' }}
              >
                {/* Hit area for easier hover on small touch targets */}
                <circle cx={p.x} cy={p.y} r={8} fill="transparent" />

                {/* Visible dot */}
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={isHovered ? 4 : isLast ? 3.2 : 2.2}
                  fill={isLast || isHovered ? resolvedColor : '#0F172A'}
                  stroke={resolvedColor}
                  strokeWidth={isHovered ? 2 : 1.5}
                />
                {isLast && (
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r={5.5}
                    fill="none"
                    stroke={resolvedColor}
                    strokeWidth="0.8"
                    opacity="0.6"
                  />
                )}
              </g>
            );
          })}
        </svg>

        {/* Micro Hover Tooltip */}
        {activePoint && (
          <div
            style={{
              position: 'absolute',
              bottom: '100%',
              left: `${Math.min(Math.max(activePoint.x - 40, 0), width - 70)}px`,
              marginBottom: '4px',
              backgroundColor: '#0F172A',
              border: `1px solid ${resolvedColor}`,
              borderRadius: '4px',
              padding: '2px 6px',
              fontSize: '0.65rem',
              fontWeight: 700,
              color: '#F8FAFC',
              whiteSpace: 'nowrap',
              boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
              pointerEvents: 'none',
              zIndex: 30
            }}
          >
            <span style={{ color: '#94A3B8' }}>{activePoint.label}: </span>
            <span style={{ color: resolvedColor }}>
              {activePoint.val}
              {unit ? ` ${unit}` : ''}
            </span>
          </div>
        )}
      </div>

      {/* Direction & Trend Diff Indicator */}
      {showDirection && data.length >= 2 && (
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '3px',
            fontSize: '0.6875rem',
            fontWeight: 800,
            color: resolvedColor,
            lineHeight: 1
          }}
          title={`${diff >= 0 ? '+' : ''}${diff.toFixed(1)}${unit} change across ${data.length} visits`}
        >
          <span>{trendArrow}</span>
          <span style={{ fontSize: '0.625rem' }}>
            {diff >= 0 ? '+' : ''}
            {Math.abs(diff) < 1 ? diff.toFixed(1) : diff.toFixed(0)}
          </span>
          <span style={{ fontSize: '0.65rem' }}>{trendEmoji}</span>
        </div>
      )}
    </div>
  );
};
