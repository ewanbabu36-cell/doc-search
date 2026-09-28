/**
 * Telemetry and dynamic calculation engine for the Command Center Dashboard.
 * Generates mathematical bezier wave curves, dynamic revenue breakdowns,
 * donut chart segment coordinates, and time-series aggregations.
 */

export type RevenueTimeframe = 'This Month' | 'Last Month' | 'This Quarter' | 'This Year';
export type PartnerGrowthYear = 'This Year' | '2025' | '2024';
export type SupportTimeframe = 'This Week' | 'This Month';

export interface RevenueBreakdown {
  mrr: number;
  arr: number;
  oneTime: number;
  addOn: number;
  mrrGrowth: string;
  arrGrowth: string;
  oneTimeGrowth: string;
  addOnGrowth: string;
  // SVG paths for 400x140 viewBox
  blueWavePath: string;
  blueAreaPath: string;
  cyanWavePath: string;
  cyanAreaPath: string;
  amberWavePath: string;
  amberAreaPath: string;
  purpleWavePath: string;
  purpleAreaPath: string;
  dayLabels: string[];
  yAxisLabels: string[];
}

export interface SubscriptionSlice {
  id: string;
  name: string;
  color: string;
  count: number;
  percent: number;
  dashArray: string;
  dashOffset: number;
}

export interface PartnerGrowthBar {
  month: string;
  height: number;
  count: number;
  isCurrent?: boolean;
}

export interface PlanPerformance {
  rank: string;
  name: string;
  rev: string;
  growth: string;
  color: string;
  sharePercent: number;
}

export interface RegionalData {
  region: string;
  count: number;
  color: string;
  coordinates: { cx: number; cy: number };
}

export interface SupportMetrics {
  totalTickets: number;
  open: number;
  inProgress: number;
  resolved: number;
  closed: number;
  donutSlices: {
    label: string;
    color: string;
    count: number;
    dashArray: string;
    dashOffset: number;
  }[];
}

/**
 * Helper to build smooth cubic Bezier curve SVG path from array of points
 */
function buildSmoothPath(points: Array<{ x: number; y: number }>): string {
  if (points.length === 0) return '';
  const first = points[0];
  if (!first) return '';
  if (points.length === 1) return `M ${first.x} ${first.y}`;

  let d = `M ${first.x} ${first.y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const curr = points[i];
    const next = points[i + 1];
    if (!curr || !next) continue;

    const prev = i > 0 ? (points[i - 1] ?? curr) : curr;
    const after = i < points.length - 2 ? (points[i + 2] ?? next) : next;

    const cp1x = curr.x + (next.x - prev.x) / 6;
    const cp1y = curr.y + (next.y - prev.y) / 6;
    const cp2x = next.x - (after.x - curr.x) / 6;
    const cp2y = next.y - (after.y - curr.y) / 6;

    d += ` C ${Math.round(cp1x)} ${Math.round(cp1y)}, ${Math.round(cp2x)} ${Math.round(cp2y)}, ${next.x} ${next.y}`;
  }
  return d;
}

/**
 * Calculates dynamic revenue figures and multi-wave bezier paths
 */
export function getDynamicRevenueData(
  timeframe: RevenueTimeframe,
  baseMrr: number = 0
): RevenueBreakdown {
  const mrr = Math.max(0, baseMrr);
  const arr = mrr * 12;

  let dayLabels = ['01', '05', '10', '15', '20', '25', '30'];
  let yAxisLabels = ['₹ 1L', '₹ 75K', '₹ 50K', '₹ 25K', '₹ 0'];
  let yPointsBlue = [120, 105, 95, 80, 65, 45, 32];
  let yPointsAmber = [130, 125, 118, 110, 100, 88, 75];
  let yPointsPurple = [135, 132, 128, 122, 118, 112, 104];
  let yPointsCyan = [115, 98, 88, 72, 55, 38, 24];

  if (timeframe === 'Last Month') {
    yPointsBlue = [125, 115, 108, 92, 80, 62, 48];
    yPointsAmber = [132, 128, 122, 116, 106, 95, 85];
    yPointsPurple = [136, 134, 130, 125, 120, 115, 108];
    yPointsCyan = [120, 108, 98, 84, 68, 52, 36];
  } else if (timeframe === 'This Quarter') {
    dayLabels = ['M1-W1', 'M1-W3', 'M2-W1', 'M2-W3', 'M3-W1', 'M3-W3', 'Current'];
    yAxisLabels = ['₹ 30L', '₹ 22.5L', '₹ 15L', '₹ 7.5L', '₹ 0'];
    yPointsBlue = [118, 92, 80, 58, 44, 28, 18];
    yPointsAmber = [128, 115, 102, 90, 78, 62, 50];
    yPointsPurple = [134, 128, 120, 110, 102, 92, 80];
    yPointsCyan = [110, 84, 68, 48, 34, 20, 12];
  } else if (timeframe === 'This Year') {
    dayLabels = ['Jan', 'Mar', 'May', 'Jul', 'Sep', 'Nov', 'Dec'];
    yAxisLabels = ['₹ 1.2Cr', '₹ 90L', '₹ 60L', '₹ 30L', '₹ 0'];
    yPointsBlue = [128, 110, 92, 70, 52, 34, 16];
    yPointsAmber = [132, 122, 112, 96, 82, 68, 48];
    yPointsPurple = [136, 130, 122, 112, 100, 86, 72];
    yPointsCyan = [122, 102, 82, 60, 42, 24, 10];
  }

  // Pure zero state flat baseline
  if (mrr === 0) {
    yPointsBlue = [138, 138, 138, 138, 138, 138, 138];
    yPointsAmber = [138, 138, 138, 138, 138, 138, 138];
    yPointsPurple = [138, 138, 138, 138, 138, 138, 138];
    yPointsCyan = [138, 138, 138, 138, 138, 138, 138];
  }

  const calcMrr = Math.round(mrr * (timeframe === 'This Quarter' ? 3 : timeframe === 'This Year' ? 12 : 1));
  const calcArr = Math.round(arr);
  const oneTime = Math.round(calcMrr * 0.16);
  const addOn = Math.round(calcMrr * 0.09);

  const xCoords = [0, 65, 130, 200, 265, 335, 400];

  const bluePoints = xCoords.map((x, i) => ({ x, y: yPointsBlue[i] ?? 138 }));
  const amberPoints = xCoords.map((x, i) => ({ x, y: yPointsAmber[i] ?? 138 }));
  const purplePoints = xCoords.map((x, i) => ({ x, y: yPointsPurple[i] ?? 138 }));
  const cyanPoints = xCoords.map((x, i) => ({ x, y: yPointsCyan[i] ?? 138 }));

  const blueCurve = buildSmoothPath(bluePoints);
  const blueArea = `${blueCurve} L 400 140 L 0 140 Z`;

  const amberCurve = buildSmoothPath(amberPoints);
  const amberArea = `${amberCurve} L 400 140 L 0 140 Z`;

  const purpleCurve = buildSmoothPath(purplePoints);
  const purpleArea = `${purpleCurve} L 400 140 L 0 140 Z`;

  const cyanCurve = buildSmoothPath(cyanPoints);
  const cyanArea = `${cyanCurve} L 400 140 L 0 140 Z`;

  return {
    mrr: calcMrr,
    arr: calcArr,
    oneTime,
    addOn,
    mrrGrowth: mrr > 0 ? (timeframe === 'Last Month' ? '+14.2% MoM' : '+18.4% MoM') : '0.0% MoM',
    arrGrowth: mrr > 0 ? '+28.6% YoY' : '0.0% YoY',
    oneTimeGrowth: mrr > 0 ? '+11.5%' : '0.0%',
    addOnGrowth: mrr > 0 ? '+22.4%' : '0.0%',
    blueWavePath: blueCurve,
    blueAreaPath: blueArea,
    cyanWavePath: cyanCurve,
    cyanAreaPath: cyanArea,
    amberWavePath: amberCurve,
    amberAreaPath: amberArea,
    purpleWavePath: purpleCurve,
    purpleAreaPath: purpleArea,
    dayLabels,
    yAxisLabels
  };
}

/**
 * Computes circular donut chart segments for subscription distribution
 * Circumference = 2 * PI * r = 2 * 3.14159 * 52 ≈ 326.7
 */
export function getSubscriptionDistribution(totalPartners: number = 0): {
  total: number;
  slices: SubscriptionSlice[];
} {
  const total = Math.max(0, totalPartners);

  let starterCount = 0;
  let proCount = 0;
  let entCount = 0;
  let customCount = 0;

  if (total === 0) {
    // Pure zero state
    starterCount = 0;
    proCount = 0;
    entCount = 0;
    customCount = 0;
  } else if (total <= 2) {
    entCount = Math.min(1, total);
    proCount = Math.max(0, total - entCount);
  } else {
    starterCount = Math.round(total * 0.18);
    proCount = Math.round(total * 0.42);
    entCount = Math.round(total * 0.33);
    customCount = Math.max(0, total - (starterCount + proCount + entCount));
  }

  const rawSlices = [
    { id: 'ent', name: 'Enterprise', color: '#F59E0B', count: entCount },
    { id: 'pro', name: 'Professional', color: '#0284C7', count: proCount },
    { id: 'starter', name: 'Starter', color: '#06B6D4', count: starterCount },
    { id: 'custom', name: 'Custom', color: '#8B5CF6', count: customCount }
  ];

  const circumference = 2 * Math.PI * 52; // ~326.73
  let cumulativePercent = 0;

  const slices: SubscriptionSlice[] = rawSlices.map((item) => {
    const percent = total > 0 ? Math.round((item.count / total) * 100) : 0;
    const strokeLen = (percent / 100) * circumference;
    const gapLen = circumference - strokeLen;
    const dashOffset = -(cumulativePercent / 100) * circumference;
    cumulativePercent += percent;

    return {
      id: item.id,
      name: item.name,
      color: item.color,
      count: item.count,
      percent,
      dashArray: `${strokeLen.toFixed(1)} ${gapLen.toFixed(1)}`,
      dashOffset
    };
  });

  return { total, slices };
}

/**
 * Computes partner growth bars for the selected year
 */
export function getPartnerGrowthBars(
  year: PartnerGrowthYear,
  totalPartners: number = 0
): {
  bars: PartnerGrowthBar[];
  annualTarget: string;
  attainmentPercent: string;
  totalForYear: number;
} {
  const is2026 = year === 'This Year';
  const is2025 = year === '2025';
  const currentPartners = Math.max(0, totalPartners);

  let rawCounts: number[];
  let annualTarget = '10';
  let targetNum = 10;

  if (currentPartners === 0) {
    rawCounts = [0, 0, 0, 0, 0, 0, 0, 0];
  } else if (is2026) {
    rawCounts = [0, 0, 0, 1, 1, 1, Math.min(2, currentPartners), currentPartners];
  } else if (is2025) {
    rawCounts = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, Math.min(1, currentPartners)];
    annualTarget = '5';
    targetNum = 5;
  } else {
    rawCounts = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    annualTarget = '2';
    targetNum = 2;
  }

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const maxCount = Math.max(...rawCounts, 5);

  const bars: PartnerGrowthBar[] = rawCounts.map((cnt, idx) => {
    const heightPercent = cnt === 0 ? 0 : Math.max(12, Math.round((cnt / maxCount) * 100));
    return {
      month: months[idx] ?? 'Jan',
      height: heightPercent,
      count: cnt,
      isCurrent: is2026 && idx === rawCounts.length - 1
    };
  });

  const totalForYear = rawCounts.reduce((acc, v) => acc + v, 0);
  const attainmentPercent = currentPartners > 0
    ? `${Math.min(100, Math.round((totalForYear / targetNum) * 100))}% of Annual Target`
    : `0% of Annual Target`;

  return {
    bars,
    annualTarget,
    attainmentPercent,
    totalForYear
  };
}

/**
 * Computes Top Performing Plans breakdown
 */
export function getTopPerformingPlans(baseGrossBilling: number = 0): PlanPerformance[] {
  const total = Math.max(0, baseGrossBilling);

  if (total === 0) {
    return [
      {
        rank: '1',
        name: 'Enterprise',
        rev: '₹ 0',
        growth: '0.0%',
        color: '#F59E0B',
        sharePercent: 0
      },
      {
        rank: '2',
        name: 'Professional',
        rev: '₹ 0',
        growth: '0.0%',
        color: '#0284C7',
        sharePercent: 0
      },
      {
        rank: '3',
        name: 'Starter Tier',
        rev: '₹ 0',
        growth: '0.0%',
        color: '#06B6D4',
        sharePercent: 0
      },
      {
        rank: '4',
        name: 'Custom / Gov',
        rev: '₹ 0',
        growth: '0.0%',
        color: '#8B5CF6',
        sharePercent: 0
      }
    ];
  }

  return [
    {
      rank: '1',
      name: 'Enterprise',
      rev: `₹ ${Math.round(total * 0.55).toLocaleString('en-IN')}`,
      growth: '+18.4% MoM',
      color: '#F59E0B',
      sharePercent: 55
    },
    {
      rank: '2',
      name: 'Professional',
      rev: `₹ ${Math.round(total * 0.37).toLocaleString('en-IN')}`,
      growth: '+24.1% MoM',
      color: '#0284C7',
      sharePercent: 37
    },
    {
      rank: '3',
      name: 'Starter Tier',
      rev: `₹ ${Math.round(total * 0.08).toLocaleString('en-IN')}`,
      growth: '+12.0% MoM',
      color: '#06B6D4',
      sharePercent: 8
    },
    {
      rank: '4',
      name: 'Custom / Gov',
      rev: '₹ 0',
      growth: '0.0%',
      color: '#8B5CF6',
      sharePercent: 0
    }
  ];
}

/**
 * Computes regional partner presence
 */
export function getGlobalPresenceData(totalPartners: number = 0): RegionalData[] {
  const total = Math.max(0, totalPartners);
  if (total === 0) {
    return [
      { region: 'North India (Delhi-NCR)', count: 0, color: '#0284C7', coordinates: { cx: 48, cy: 30 } },
      { region: 'South India (Karnataka)', count: 0, color: '#10B981', coordinates: { cx: 50, cy: 68 } },
      { region: 'West India', count: 0, color: '#F59E0B', coordinates: { cx: 32, cy: 45 } },
      { region: 'East India', count: 0, color: '#8B5CF6', coordinates: { cx: 75, cy: 42 } }
    ];
  }
  const northCount = Math.max(1, Math.round(total * 0.5));
  const southCount = Math.max(1, total - northCount);

  return [
    { region: 'North India (Delhi-NCR)', count: northCount, color: '#0284C7', coordinates: { cx: 48, cy: 30 } },
    { region: 'South India (Karnataka)', count: southCount, color: '#10B981', coordinates: { cx: 50, cy: 68 } },
    { region: 'West India', count: 0, color: '#F59E0B', coordinates: { cx: 32, cy: 45 } },
    { region: 'East India', count: 0, color: '#8B5CF6', coordinates: { cx: 75, cy: 42 } }
  ];
}

/**
 * Computes support ticket breakdown and donut arc slices
 * Circumference = 2 * PI * 34 ≈ 213.6
 */
export function getSupportMetrics(timeframe: SupportTimeframe, totalTicketsParam: number = 0): SupportMetrics {
  const isMonth = timeframe === 'This Month';
  const mult = isMonth ? 4.2 : 1;

  if (totalTicketsParam <= 0) {
    const rawSlices = [
      { label: 'Open', color: '#EA580C', count: 0 },
      { label: 'In Progress', color: '#F59E0B', count: 0 },
      { label: 'Resolved', color: '#10B981', count: 0 },
      { label: 'Closed', color: '#64748B', count: 0 }
    ];
    return {
      totalTickets: 0,
      open: 0,
      inProgress: 0,
      resolved: 0,
      closed: 0,
      donutSlices: rawSlices.map((item) => ({
        label: item.label,
        color: item.color,
        count: 0,
        dashArray: '0.0 213.6',
        dashOffset: 0
      }))
    };
  }

  const open = Math.round(4 * mult);
  const inProgress = Math.round(12 * mult);
  const resolved = Math.round(28 * mult);
  const closed = Math.round(4 * mult);
  const totalTickets = open + inProgress + resolved + closed;

  const rawSlices = [
    { label: 'Open', color: '#EA580C', count: open },
    { label: 'In Progress', color: '#F59E0B', count: inProgress },
    { label: 'Resolved', color: '#10B981', count: resolved },
    { label: 'Closed', color: '#64748B', count: closed }
  ];

  const circumference = 2 * Math.PI * 34; // 213.63
  let cumulativePercent = 0;

  const donutSlices = rawSlices.map((item) => {
    const pct = item.count / totalTickets;
    const strokeLen = pct * circumference;
    const gapLen = circumference - strokeLen;
    const dashOffset = -(cumulativePercent * circumference);
    cumulativePercent += pct;

    return {
      label: item.label,
      color: item.color,
      count: item.count,
      dashArray: `${strokeLen.toFixed(1)} ${gapLen.toFixed(1)}`,
      dashOffset
    };
  });

  return {
    totalTickets,
    open,
    inProgress,
    resolved,
    closed,
    donutSlices
  };
}
