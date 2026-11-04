import React, { useState, useMemo } from 'react';
import {
  Card,
  Button,
  Badge,
  Input,
  Select,
  TableContainer,
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell
} from '@docsearch/ui-kit';

export type BillingCycle = 'MONTHLY' | 'YEARLY' | 'LIFETIME_FREE';
export type LicenseStatus = 'ACTIVE' | 'EXPIRING_SOON' | 'GRACE_PERIOD' | 'EXPIRED' | 'LIFETIME_FREE';
export type PlanTier = 'COMMUNITY_FREE' | 'SOLO_CLINIC_PRO' | 'POLYCLINIC_GROWTH' | 'HOSPITAL_ENTERPRISE';

export interface PartnerLicenseItem {
  id: string;
  partnerId: string;
  partnerName: string;
  contactEmail: string;
  contactPhone: string;
  country: string;
  currency: string;
  tier: PlanTier;
  billingCycle: BillingCycle;
  licenseKey: string;
  monthlyRate: number;
  yearlyRate: number;
  marketCompetitorPriceMonthly: number; // Practo: ₹2,499, DocSearch: ₹499
  startDate: string;
  expiryDate: string;
  gracePeriodEnd?: string | undefined;
  status: LicenseStatus;
  autoRenew: boolean;
  earlyAdopterDiscountPercent: number;
  unlimitedFreeGrantedBy?: string | undefined;
  notes?: string | undefined;
}

const DEFAULT_LICENSES: PartnerLicenseItem[] = [
  {
    id: 'LIC-2026-001',
    partnerId: 'PARTNER-001',
    partnerName: 'Metropolitan Multispecialty Hospital',
    contactEmail: 'admin@metrohospital.org',
    contactPhone: '+91 98765 43210',
    country: 'IN',
    currency: 'INR',
    tier: 'HOSPITAL_ENTERPRISE',
    billingCycle: 'LIFETIME_FREE',
    licenseKey: 'DS-METRO-ENT-2026-FREE-001',
    monthlyRate: 0,
    yearlyRate: 0,
    marketCompetitorPriceMonthly: 18000,
    startDate: '2026-01-01',
    expiryDate: '2099-12-31',
    status: 'LIFETIME_FREE',
    autoRenew: true,
    earlyAdopterDiscountPercent: 100,
    unlimitedFreeGrantedBy: 'Founder (Meraj Sharif)',
    notes: 'Global Launch Anchor Hospital Partner'
  },
  {
    id: 'LIC-2026-002',
    partnerId: 'PARTNER-002',
    partnerName: 'Dr. Amitabh Verma Cardiology Clinic',
    contactEmail: 'dr.verma@cardiohealth.in',
    contactPhone: '+91 98111 22334',
    country: 'IN',
    currency: 'INR',
    tier: 'SOLO_CLINIC_PRO',
    billingCycle: 'MONTHLY',
    licenseKey: 'DS-SOLO-2026-VERMA-992',
    monthlyRate: 499,
    yearlyRate: 4999,
    marketCompetitorPriceMonthly: 2499,
    startDate: '2026-10-01',
    expiryDate: '2026-11-15',
    status: 'EXPIRING_SOON',
    autoRenew: false,
    earlyAdopterDiscountPercent: 50,
    notes: 'Solo OPD, RapidRx & Patient WhatsApp'
  },
  {
    id: 'LIC-2026-003',
    partnerId: 'PARTNER-003',
    partnerName: 'Dubai Marina International Polyclinic',
    contactEmail: 'ops@marinaclinic.ae',
    contactPhone: '+971 50 123 4567',
    country: 'AE',
    currency: 'AED',
    tier: 'POLYCLINIC_GROWTH',
    billingCycle: 'YEARLY',
    licenseKey: 'DS-GLOBAL-DXB-POLY-770',
    monthlyRate: 99,
    yearlyRate: 999,
    marketCompetitorPriceMonthly: 750,
    startDate: '2026-06-01',
    expiryDate: '2027-05-31',
    status: 'ACTIVE',
    autoRenew: true,
    earlyAdopterDiscountPercent: 40,
    notes: 'UAE International Health Hub'
  },
  {
    id: 'LIC-2026-004',
    partnerId: 'PARTNER-004',
    partnerName: 'Apex Diagnostics & Lab Network',
    contactEmail: 'lab@apexdiagnostics.com',
    contactPhone: '+91 99000 11223',
    country: 'IN',
    currency: 'INR',
    tier: 'POLYCLINIC_GROWTH',
    billingCycle: 'MONTHLY',
    licenseKey: 'DS-LAB-2026-APEX-441',
    monthlyRate: 499,
    yearlyRate: 4999,
    marketCompetitorPriceMonthly: 3999,
    startDate: '2026-09-15',
    expiryDate: '2026-10-31',
    gracePeriodEnd: '2026-11-15',
    status: 'GRACE_PERIOD',
    autoRenew: true,
    earlyAdopterDiscountPercent: 50,
    notes: '15-Day Soft Grace Period Active (Anti-Lockout Protected)'
  },
  {
    id: 'LIC-2026-005',
    partnerId: 'PARTNER-005',
    partnerName: 'London Harley Street Family Clinic',
    contactEmail: 'practice@harleyhealth.co.uk',
    contactPhone: '+44 20 7946 0991',
    country: 'GB',
    currency: 'GBP',
    tier: 'SOLO_CLINIC_PRO',
    billingCycle: 'LIFETIME_FREE',
    licenseKey: 'DS-UK-HARLEY-FREE-882',
    monthlyRate: 0,
    yearlyRate: 0,
    marketCompetitorPriceMonthly: 120,
    startDate: '2026-03-01',
    expiryDate: '2099-12-31',
    status: 'LIFETIME_FREE',
    autoRenew: true,
    earlyAdopterDiscountPercent: 100,
    unlimitedFreeGrantedBy: 'Global Freemium Growth Campaign',
    notes: 'UK Expansion Free Pioneer Clinic'
  }
];

export const MonetizationEngineView: React.FC = () => {
  const [licenses, setLicenses] = useState<PartnerLicenseItem[]>(DEFAULT_LICENSES);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [tierFilter, setTierFilter] = useState<string>('ALL');

  // Global GTM Strategy State
  const [isGlobalFreeModeActive, setIsGlobalFreeModeActive] = useState(true);
  const [isLowestPriceModeLive, setIsLowestPriceModeLive] = useState(false);

  // Strategy Config Inputs
  const [disruptiveMonthlyInr, setDisruptiveMonthlyInr] = useState(499);
  const [disruptiveYearlyInr, setDisruptiveYearlyInr] = useState(4999);
  const [earlyBirdDiscountPercent, setEarlyBirdDiscountPercent] = useState(50);

  // Modal Dialog States
  const [selectedLicenseForAction, setSelectedLicenseForAction] = useState<PartnerLicenseItem | null>(null);
  const [actionType, setActionType] = useState<'EXTEND_FREE' | 'RENEW' | 'GRACE' | null>(null);
  const [extendDaysCount, setExtendDaysCount] = useState<number>(30);
  const [renewCycle, setRenewCycle] = useState<'MONTHLY' | 'YEARLY'>('YEARLY');
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  // KPI Computations
  const metrics = useMemo(() => {
    const total = licenses.length;
    const freeCount = licenses.filter((l) => l.status === 'LIFETIME_FREE').length;
    const payingCount = licenses.filter((l) => l.status === 'ACTIVE' && l.billingCycle !== 'LIFETIME_FREE').length;
    const expiringCount = licenses.filter((l) => l.status === 'EXPIRING_SOON').length;
    const graceCount = licenses.filter((l) => l.status === 'GRACE_PERIOD').length;

    // Monthly GMV (INR)
    const mrr = licenses.reduce((sum, l) => {
      if (l.status === 'ACTIVE' || l.status === 'EXPIRING_SOON') {
        if (l.billingCycle === 'MONTHLY') return sum + l.monthlyRate;
        if (l.billingCycle === 'YEARLY') return sum + Math.round(l.yearlyRate / 12);
      }
      return sum;
    }, 0);

    const arr = mrr * 12;

    // Doctor savings delivered vs competitors (e.g. Practo/Kareo at ₹20k+/yr)
    const competitorTotalAnnual = licenses.reduce((sum, l) => sum + l.marketCompetitorPriceMonthly * 12, 0);
    const totalDoctorSavings = Math.max(0, competitorTotalAnnual - arr);

    return { total, freeCount, payingCount, expiringCount, graceCount, mrr, arr, totalDoctorSavings };
  }, [licenses]);

  // Filtered List
  const filteredLicenses = useMemo(() => {
    return licenses.filter((lic) => {
      const matchSearch =
        searchTerm === '' ||
        lic.partnerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lic.licenseKey.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lic.contactEmail.toLowerCase().includes(searchTerm.toLowerCase());

      const matchStatus = statusFilter === 'ALL' || lic.status === statusFilter;
      const matchTier = tierFilter === 'ALL' || lic.tier === tierFilter;

      return matchSearch && matchStatus && matchTier;
    });
  }, [licenses, searchTerm, statusFilter, tierFilter]);

  // Actions
  const handleConfirmExtendFree = (isLifetime = false) => {
    if (!selectedLicenseForAction) return;

    setLicenses((prev) =>
      prev.map((l) => {
        if (l.id !== selectedLicenseForAction.id) return l;
        if (isLifetime) {
          return {
            ...l,
            status: 'LIFETIME_FREE',
            billingCycle: 'LIFETIME_FREE',
            monthlyRate: 0,
            yearlyRate: 0,
            expiryDate: '2099-12-31',
            unlimitedFreeGrantedBy: 'Founder Override (Admin)'
          };
        }
        const curr = new Date(l.expiryDate);
        const base = curr.getTime() > Date.now() ? curr : new Date();
        base.setDate(base.getDate() + extendDaysCount);
        return {
          ...l,
          expiryDate: base.toISOString().slice(0, 10),
          status: 'ACTIVE'
        };
      })
    );

    setActionFeedback(
      isLifetime
        ? `✅ Granted Lifetime 100% Free Access to ${selectedLicenseForAction.partnerName}`
        : `✅ Extended Free Access (+${extendDaysCount} Days) for ${selectedLicenseForAction.partnerName}`
    );
    setActionType(null);
    setSelectedLicenseForAction(null);
    setTimeout(() => setActionFeedback(null), 4000);
  };

  const handleConfirmRenew = () => {
    if (!selectedLicenseForAction) return;

    setLicenses((prev) =>
      prev.map((l) => {
        if (l.id !== selectedLicenseForAction.id) return l;
        const rate =
          renewCycle === 'MONTHLY'
            ? Math.round(disruptiveMonthlyInr * (1 - l.earlyAdopterDiscountPercent / 100))
            : Math.round(disruptiveYearlyInr * (1 - l.earlyAdopterDiscountPercent / 100));

        const base = new Date();
        if (renewCycle === 'MONTHLY') base.setMonth(base.getMonth() + 1);
        else base.setFullYear(base.getFullYear() + 1);

        return {
          ...l,
          billingCycle: renewCycle,
          status: 'ACTIVE',
          gracePeriodEnd: undefined,
          monthlyRate: renewCycle === 'MONTHLY' ? rate : Math.round(rate / 12),
          yearlyRate: renewCycle === 'YEARLY' ? rate : rate * 12,
          expiryDate: base.toISOString().slice(0, 10)
        };
      })
    );

    setActionFeedback(`✅ Successfully Renewed ${selectedLicenseForAction.partnerName} (${renewCycle} Lowest-Price Rate)`);
    setActionType(null);
    setSelectedLicenseForAction(null);
    setTimeout(() => setActionFeedback(null), 4000);
  };

  const handleGrantGracePeriod = (lic: PartnerLicenseItem) => {
    const graceEnd = new Date();
    graceEnd.setDate(graceEnd.getDate() + 15);

    setLicenses((prev) =>
      prev.map((l) =>
        l.id === lic.id
          ? {
              ...l,
              status: 'GRACE_PERIOD',
              gracePeriodEnd: graceEnd.toISOString().slice(0, 10)
            }
          : l
      )
    );

    setActionFeedback(`🛡 15-Day Soft Grace Period Activated for ${lic.partnerName}. Clinical Anti-Lockout Protected.`);
    setTimeout(() => setActionFeedback(null), 4000);
  };

  const getStatusBadge = (status: LicenseStatus) => {
    switch (status) {
      case 'LIFETIME_FREE':
        return <Badge variant="success">100% LIFETIME FREE</Badge>;
      case 'ACTIVE':
        return <Badge variant="primary">ACTIVE (COMMERCIAL)</Badge>;
      case 'EXPIRING_SOON':
        return <Badge variant="warning">EXPIRING SOON</Badge>;
      case 'GRACE_PERIOD':
        return <Badge variant="danger">15-DAY GRACE (ACTIVE)</Badge>;
      case 'EXPIRED':
        return <Badge variant="neutral">READ-ONLY ARCHIVE</Badge>;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', padding: '1.5rem', backgroundColor: '#090d16', minHeight: '100%', color: '#f8fafc' }}>
      {/* View Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '2rem' }}>⚡</span>
            <div>
              <h1 style={{ fontSize: '1.75rem', fontWeight: 900, margin: 0, color: '#f8fafc' }}>
                Monetization Engine & Partner License Lifecycle HQ
              </h1>
              <p style={{ margin: '4px 0 0', color: '#94a3b8', fontSize: '0.9rem' }}>
                Global Freemium Onboarding, Disruptive Lowest-Price Transitions, Expiry Shields & Enterprise SLA Governance
              </p>
            </div>
          </div>
        </div>

        {/* Global Strategy Switches */}
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          {/* Phase 1: Global Free Mode Switch */}
          <button
            type="button"
            onClick={() => {
              setIsGlobalFreeModeActive(!isGlobalFreeModeActive);
              setActionFeedback(
                !isGlobalFreeModeActive
                  ? '🌍 Global 100% Free Mode Activated: All newly onboarding partners get zero subscription barriers.'
                  : '⏸ Global Free Mode Paused: Standard tier rules active.'
              );
              setTimeout(() => setActionFeedback(null), 4000);
            }}
            style={{
              padding: '10px 16px',
              borderRadius: '8px',
              border: isGlobalFreeModeActive ? '1.5px solid #10b981' : '1px solid #334155',
              backgroundColor: isGlobalFreeModeActive ? 'rgba(16, 185, 129, 0.2)' : '#1e293b',
              color: isGlobalFreeModeActive ? '#34d399' : '#94a3b8',
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <span>{isGlobalFreeModeActive ? '🟢' : '⚪'}</span>
            <span>100% FREE GLOBAL LAUNCH: {isGlobalFreeModeActive ? 'ACTIVE' : 'PAUSED'}</span>
          </button>

          {/* Phase 2: Disruptive Lowest Price Mode Switch */}
          <button
            type="button"
            onClick={() => {
              setIsLowestPriceModeLive(!isLowestPriceModeLive);
              setActionFeedback(
                !isLowestPriceModeLive
                  ? '🚀 Disruptive Lowest Price Mode Launched: Market-beating ₹499/mo & ₹4,999/yr live!'
                  : 'Lowest-Price Transition Mode Paused.'
              );
              setTimeout(() => setActionFeedback(null), 4000);
            }}
            style={{
              padding: '10px 16px',
              borderRadius: '8px',
              border: isLowestPriceModeLive ? '1.5px solid #38bdf8' : '1px solid #334155',
              backgroundColor: isLowestPriceModeLive ? 'rgba(56, 189, 248, 0.2)' : '#1e293b',
              color: isLowestPriceModeLive ? '#38bdf8' : '#94a3b8',
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <span>{isLowestPriceModeLive ? '🔥' : '💡'}</span>
            <span>DISRUPTIVE LOWEST PRICE: {isLowestPriceModeLive ? 'LIVE' : 'STANDBY'}</span>
          </button>
        </div>
      </div>

      {/* Notification / Feedback Banner */}
      {actionFeedback && (
        <div
          style={{
            backgroundColor: 'rgba(16, 185, 129, 0.15)',
            border: '1px solid #10b981',
            borderRadius: '8px',
            padding: '12px 16px',
            color: '#a7f3d0',
            fontWeight: 600,
            fontSize: '0.9rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <span>{actionFeedback}</span>
          <button
            onClick={() => setActionFeedback(null)}
            style={{ background: 'transparent', border: 'none', color: '#a7f3d0', cursor: 'pointer' }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Strategic Master KPIs Bar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
        <Card style={{ backgroundColor: '#111827', border: '1px solid #1f2937', padding: '1rem', borderRadius: '8px' }}>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600 }}>
            GLOBAL PARTNER NETWORK
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#f8fafc', margin: '4px 0' }}>
            {metrics.total} Partners
          </div>
          <div style={{ fontSize: '0.75rem', color: '#38bdf8' }}>
            {metrics.freeCount} Freemium • {metrics.payingCount} Commercial
          </div>
        </Card>

        <Card style={{ backgroundColor: '#111827', border: '1px solid #1f2937', padding: '1rem', borderRadius: '8px' }}>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600 }}>
            MONTHLY RUN RATE (MRR)
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#10b981', margin: '4px 0' }}>
            ₹{metrics.mrr.toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#6ee7b7' }}>
            ARR: ₹{metrics.arr.toLocaleString('en-IN')} / year
          </div>
        </Card>

        <Card style={{ backgroundColor: '#111827', border: '1px solid #1f2937', padding: '1rem', borderRadius: '8px' }}>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600 }}>
            DOCTOR SAVINGS DELIVERED
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#f59e0b', margin: '4px 0' }}>
            ₹{metrics.totalDoctorSavings.toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#fcd34d' }}>
            vs Practo / Kareo / Tata 1mg Monopoly
          </div>
        </Card>

        <Card style={{ backgroundColor: '#111827', border: '1px solid #1f2937', padding: '1rem', borderRadius: '8px' }}>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600 }}>
            RENEWAL & CLINICAL SHIELD
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#38bdf8', margin: '4px 0' }}>
            {metrics.expiringCount} Due • {metrics.graceCount} Grace
          </div>
          <div style={{ fontSize: '0.75rem', color: '#a78bfa' }}>
            100% Anti-Lockout Protected
          </div>
        </Card>
      </div>

      {/* Strategic Playbook & Disruptive Pricing Banner */}
      <div
        style={{
          backgroundColor: '#1e293b',
          border: '1px solid #334155',
          borderRadius: '12px',
          padding: '1.5rem',
          display: 'grid',
          gridTemplateColumns: '1.5fr 1fr',
          gap: '1.5rem',
          alignItems: 'center'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <span style={{ fontSize: '1.25rem' }}>🎯</span>
            <h2 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 'bold', color: '#f8fafc' }}>
              The 2-Phase Global Growth Strategy (Viral Hook & Lowest-Price Dominance)
            </h2>
          </div>
          <p style={{ margin: '0 0 12px', color: '#cbd5e1', fontSize: '0.85rem', lineHeight: 1.5 }}>
            <strong>Phase 1 (Active Now):</strong> Onboard clinics, pharmacies, labs, and nursing homes globally at 100% zero subscription barrier ($0 / ₹0). Build massive network density, doctor habits, and verified patient reviews.
            <br />
            <strong>Phase 2 (Market Disruption):</strong> Convert active cohorts with the world's most accessible healthcare software price — <strong>₹499/month</strong> or <strong>₹4,999/year</strong> (vs competitors charging ₹18,000 to ₹35,000/year). Early adopters maintain <strong>50% lifetime grandfathered discount</strong>.
          </p>

          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
              Monthly Benchmark: <strong style={{ color: '#10b981' }}>₹{disruptiveMonthlyInr}/mo ($6/mo)</strong>
            </div>
            <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
              Yearly Benchmark: <strong style={{ color: '#38bdf8' }}>₹{disruptiveYearlyInr}/yr ($59/yr)</strong>
            </div>
            <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
              Early-Bird Discount: <strong style={{ color: '#f59e0b' }}>{earlyBirdDiscountPercent}% Lifetime Lock</strong>
            </div>
          </div>
        </div>

        {/* Live Simulator Sliders */}
        <div style={{ backgroundColor: '#0f172a', padding: '1.25rem', borderRadius: '8px', border: '1px solid #334155' }}>
          <div style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#f8fafc', marginBottom: '8px' }}>
            ⚙ Global Pricing Fine-Tuning
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#94a3b8' }}>
                <span>Default Monthly (INR)</span>
                <span>₹{disruptiveMonthlyInr}</span>
              </div>
              <input
                type="range"
                min="199"
                max="1499"
                step="50"
                value={disruptiveMonthlyInr}
                onChange={(e) => setDisruptiveMonthlyInr(Number(e.target.value))}
                style={{ width: '100%' }}
              />
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#94a3b8' }}>
                <span>Default Yearly (INR)</span>
                <span>₹{disruptiveYearlyInr}</span>
              </div>
              <input
                type="range"
                min="1999"
                max="9999"
                step="500"
                value={disruptiveYearlyInr}
                onChange={(e) => setDisruptiveYearlyInr(Number(e.target.value))}
                style={{ width: '100%' }}
              />
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#94a3b8' }}>
                <span>Early-Bird Grandfathering Discount (%)</span>
                <span>{earlyBirdDiscountPercent}%</span>
              </div>
              <input
                type="range"
                min="10"
                max="90"
                step="5"
                value={earlyBirdDiscountPercent}
                onChange={(e) => setEarlyBirdDiscountPercent(Number(e.target.value))}
                style={{ width: '100%' }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Partner License Table Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flex: 1, minWidth: '300px' }}>
          <Input
            placeholder="Search partner, license key, or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: '100%', maxWidth: '360px' }}
          />

          <div style={{ width: '180px' }}>
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              options={[
                { value: 'ALL', label: 'All Statuses' },
                { value: 'LIFETIME_FREE', label: 'Lifetime Free' },
                { value: 'ACTIVE', label: 'Active (Commercial)' },
                { value: 'EXPIRING_SOON', label: 'Expiring Soon' },
                { value: 'GRACE_PERIOD', label: 'Grace Period' },
                { value: 'EXPIRED', label: 'Expired / Archive' }
              ]}
            />
          </div>

          <div style={{ width: '200px' }}>
            <Select
              value={tierFilter}
              onChange={(e) => setTierFilter(e.target.value)}
              options={[
                { value: 'ALL', label: 'All Tiers' },
                { value: 'COMMUNITY_FREE', label: 'Community Free' },
                { value: 'SOLO_CLINIC_PRO', label: 'Solo Clinic Pro' },
                { value: 'POLYCLINIC_GROWTH', label: 'Polyclinic Growth' },
                { value: 'HOSPITAL_ENTERPRISE', label: 'Hospital Enterprise' }
              ]}
            />
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <Button
            variant="secondary"
            onClick={() => {
              // Mass extend all expiring partners by 30 days
              setLicenses((prev) =>
                prev.map((l) => {
                  if (l.status === 'EXPIRING_SOON' || l.status === 'GRACE_PERIOD') {
                    const d = new Date(l.expiryDate);
                    d.setDate(d.getDate() + 30);
                    return { ...l, expiryDate: d.toISOString().slice(0, 10), status: 'ACTIVE' };
                  }
                  return l;
                })
              );
              setActionFeedback('✅ Mass Extended +30 Days Free Access for all expiring partners!');
              setTimeout(() => setActionFeedback(null), 4000);
            }}
          >
            + Mass Extend All Expiring (+30d)
          </Button>
        </div>
      </div>

      {/* Main License Ledger Table */}
      <TableContainer style={{ backgroundColor: '#111827', border: '1px solid #1f2937', borderRadius: '8px' }}>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>PARTNER & REGION</TableHead>
              <TableHead>TIER & LICENSE KEY</TableHead>
              <TableHead>BILLING MODEL</TableHead>
              <TableHead>EFFECTIVE RATE</TableHead>
              <TableHead>EXPIRY & SLA STATUS</TableHead>
              <TableHead>CLINICAL SAFETY</TableHead>
              <TableHead style={{ textAlign: 'right' }}>ACTIONS</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredLicenses.map((lic) => {
              const daysLeft = Math.ceil((new Date(lic.expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
              const isExpired = daysLeft < 0;

              return (
                <TableRow key={lic.id}>
                  {/* Partner Name & Region */}
                  <TableCell>
                    <div style={{ fontWeight: 600, color: '#f8fafc', fontSize: '0.95rem' }}>
                      {lic.partnerName}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                      {lic.contactEmail} • Country: {lic.country} ({lic.currency})
                    </div>
                  </TableCell>

                  {/* Tier & License Key */}
                  <TableCell>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontWeight: 'bold', fontSize: '0.8rem', color: '#38bdf8' }}>
                        {lic.tier.replace('_', ' ')}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.7rem', color: '#64748b', fontFamily: 'monospace', marginTop: '2px' }}>
                      {lic.licenseKey}
                    </div>
                  </TableCell>

                  {/* Billing Model */}
                  <TableCell>
                    <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{lic.billingCycle}</div>
                    {lic.earlyAdopterDiscountPercent > 0 && (
                      <span style={{ fontSize: '0.65rem', color: '#34d399', fontWeight: 'bold' }}>
                        ★ {lic.earlyAdopterDiscountPercent}% Loyalty Locked
                      </span>
                    )}
                  </TableCell>

                  {/* Effective Rate */}
                  <TableCell>
                    <div style={{ fontWeight: 'bold', color: lic.monthlyRate === 0 ? '#10b981' : '#f8fafc' }}>
                      {lic.monthlyRate === 0
                        ? '100% FREE'
                        : `${lic.currency === 'INR' ? '₹' : lic.currency} ${lic.monthlyRate} / mo`}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: '#64748b' }}>
                      Competitor: ₹{lic.marketCompetitorPriceMonthly}/mo
                    </div>
                  </TableCell>

                  {/* Expiry & Days Left */}
                  <TableCell>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {getStatusBadge(lic.status)}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: daysLeft <= 15 ? '#f87171' : '#94a3b8', marginTop: '4px' }}>
                      {lic.status === 'LIFETIME_FREE'
                        ? 'Perpetual Free'
                        : isExpired
                        ? `Expired ${Math.abs(daysLeft)} days ago`
                        : `${daysLeft} days remaining (${lic.expiryDate})`}
                    </div>
                  </TableCell>

                  {/* Clinical Anti-Lockout Safety */}
                  <TableCell>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span style={{ color: '#10b981' }}>🛡</span>
                      <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                        {lic.status === 'GRACE_PERIOD' ? 'Grace Care Active' : 'Anti-Lockout Protected'}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.65rem', color: '#64748b' }}>
                      Zero clinical disruption guarantee
                    </div>
                  </TableCell>

                  {/* Actions */}
                  <TableCell style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => {
                          setSelectedLicenseForAction(lic);
                          setActionType('EXTEND_FREE');
                        }}
                      >
                        + Free
                      </Button>

                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => {
                          setSelectedLicenseForAction(lic);
                          setActionType('RENEW');
                        }}
                      >
                        Renew
                      </Button>

                      {lic.status !== 'GRACE_PERIOD' && lic.status !== 'LIFETIME_FREE' && (
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => handleGrantGracePeriod(lic)}
                        >
                          Grace
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Extend Free Period Modal */}
      {actionType === 'EXTEND_FREE' && selectedLicenseForAction && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 99999
          }}
        >
          <Card style={{ backgroundColor: '#111827', border: '1px solid #334155', borderRadius: '12px', padding: '1.5rem', width: '460px', color: '#f8fafc' }}>
            <h3 style={{ margin: '0 0 8px', fontSize: '1.15rem', fontWeight: 'bold' }}>
              Extend 100% Free Period
            </h3>
            <p style={{ margin: '0 0 1rem', fontSize: '0.85rem', color: '#94a3b8' }}>
              Partner: <strong>{selectedLicenseForAction.partnerName}</strong>
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '4px' }}>
                  ADDITIONAL FREE DAYS
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {[30, 60, 90, 180, 365].map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setExtendDaysCount(d)}
                      style={{
                        flex: 1,
                        padding: '8px',
                        borderRadius: '6px',
                        border: extendDaysCount === d ? '1.5px solid #10b981' : '1px solid #334155',
                        backgroundColor: extendDaysCount === d ? 'rgba(16, 185, 129, 0.2)' : '#1e293b',
                        color: extendDaysCount === d ? '#34d399' : '#94a3b8',
                        cursor: 'pointer',
                        fontWeight: 'bold',
                        fontSize: '0.8rem'
                      }}
                    >
                      +{d}d
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ borderTop: '1px solid #334155', paddingTop: '12px' }}>
                <Button
                  variant="secondary"
                  onClick={() => handleConfirmExtendFree(true)}
                  style={{ width: '100%', borderColor: '#10b981', color: '#34d399' }}
                >
                  ★ Grant 100% Lifetime Free (Perpetual Zero-Cost)
                </Button>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <Button variant="secondary" onClick={() => setActionType(null)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={() => handleConfirmExtendFree(false)}>
                Confirm Extension (+{extendDaysCount} Days)
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Renew License Modal */}
      {actionType === 'RENEW' && selectedLicenseForAction && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 99999
          }}
        >
          <Card style={{ backgroundColor: '#111827', border: '1px solid #334155', borderRadius: '12px', padding: '1.5rem', width: '480px', color: '#f8fafc' }}>
            <h3 style={{ margin: '0 0 8px', fontSize: '1.15rem', fontWeight: 'bold' }}>
              Disruptive Lowest-Price Renewal
            </h3>
            <p style={{ margin: '0 0 1rem', fontSize: '0.85rem', color: '#94a3b8' }}>
              Partner: <strong>{selectedLicenseForAction.partnerName}</strong>
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '4px' }}>
                  BILLING INTERVAL
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => setRenewCycle('MONTHLY')}
                    style={{
                      flex: 1,
                      padding: '10px',
                      borderRadius: '6px',
                      border: renewCycle === 'MONTHLY' ? '1.5px solid #38bdf8' : '1px solid #334155',
                      backgroundColor: renewCycle === 'MONTHLY' ? 'rgba(56, 189, 248, 0.2)' : '#1e293b',
                      color: renewCycle === 'MONTHLY' ? '#38bdf8' : '#94a3b8',
                      cursor: 'pointer',
                      fontWeight: 'bold',
                      fontSize: '0.85rem'
                    }}
                  >
                    MONTHLY (₹{disruptiveMonthlyInr}/mo)
                  </button>
                  <button
                    type="button"
                    onClick={() => setRenewCycle('YEARLY')}
                    style={{
                      flex: 1,
                      padding: '10px',
                      borderRadius: '6px',
                      border: renewCycle === 'YEARLY' ? '1.5px solid #10b981' : '1px solid #334155',
                      backgroundColor: renewCycle === 'YEARLY' ? 'rgba(16, 185, 129, 0.2)' : '#1e293b',
                      color: renewCycle === 'YEARLY' ? '#34d399' : '#94a3b8',
                      cursor: 'pointer',
                      fontWeight: 'bold',
                      fontSize: '0.85rem'
                    }}
                  >
                    YEARLY (₹{disruptiveYearlyInr}/yr)
                    <div style={{ fontSize: '0.65rem', color: '#6ee7b7' }}>2 Months Free Included</div>
                  </button>
                </div>
              </div>

              {selectedLicenseForAction.earlyAdopterDiscountPercent > 0 && (
                <div
                  style={{
                    backgroundColor: 'rgba(52, 211, 153, 0.15)',
                    border: '1px solid #34d399',
                    borderRadius: '6px',
                    padding: '8px 12px',
                    fontSize: '0.8rem',
                    color: '#a7f3d0'
                  }}
                >
                  ★ Early Adopter Discount Applied:{' '}
                  <strong>{selectedLicenseForAction.earlyAdopterDiscountPercent}% OFF</strong> (Final:{' '}
                  ₹
                  {renewCycle === 'MONTHLY'
                    ? Math.round(disruptiveMonthlyInr * (1 - selectedLicenseForAction.earlyAdopterDiscountPercent / 100))
                    : Math.round(disruptiveYearlyInr * (1 - selectedLicenseForAction.earlyAdopterDiscountPercent / 100))}
                  )
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <Button variant="secondary" onClick={() => setActionType(null)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleConfirmRenew}>
                Confirm Renewal & Send Payment Link
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default MonetizationEngineView;
