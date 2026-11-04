import React, { useState } from 'react';
import { Card, Button, Badge, Select } from '@docsearch/ui-kit';
import type { MicroAddonCatalogItem, PartnerAddonEntitlement } from '../../services/monetization-godmode-service.js';

const MOCK_CATALOG: MicroAddonCatalogItem[] = [
  {
    id: 'ADDON_AI_SCRIBE',
    name: 'Clinical AI Ambient Scribe',
    code: 'FEAT_AI_SCRIBE',
    category: 'AI_CLINICAL',
    monthlyPriceInr: 199,
    yearlyPriceInr: 1999,
    marketPriceMonthlyInr: 2999,
    description: 'Real-time multi-lingual doctor-patient consultation transcription, auto SOAP note drafting, and SNOMED-CT extraction.',
    status: 'GA'
  },
  {
    id: 'ADDON_WHATSAPP_BOT',
    name: 'Smart 2-Way WhatsApp OPD Bot',
    code: 'FEAT_WHATSAPP_BOT',
    category: 'COMMUNICATION',
    monthlyPriceInr: 99,
    yearlyPriceInr: 999,
    marketPriceMonthlyInr: 1499,
    description: 'Instant token slips, live queue tracking, automated lab report PDF delivery, and e-prescription dispatches.',
    status: 'GA'
  },
  {
    id: 'ADDON_SMART_KIOSK',
    name: 'Waiting Room TV & Kiosk Display',
    code: 'FEAT_SMART_KIOSK',
    category: 'HOSPITAL_HARDWARE',
    monthlyPriceInr: 99,
    yearlyPriceInr: 999,
    marketPriceMonthlyInr: 1200,
    description: 'Turn any Smart TV into a digital patient call queue token display with multilingual audio voice calling.',
    status: 'GA'
  },
  {
    id: 'ADDON_OT_SURGERY',
    name: 'Advanced OT & Surgical Suite',
    code: 'FEAT_OT_SURGERY',
    category: 'SPECIALTY_CARE',
    monthlyPriceInr: 499,
    yearlyPriceInr: 4999,
    marketPriceMonthlyInr: 6500,
    description: 'Surgical scheduling, pre-anesthesia clearance, WHO surgical safety checklist, and OT implant tracking.',
    status: 'GA'
  },
  {
    id: 'ADDON_BLOOD_BANK',
    name: 'Blood Bank & Donor Cross-Matching',
    code: 'FEAT_BLOOD_BANK',
    category: 'SPECIALTY_CARE',
    monthlyPriceInr: 499,
    yearlyPriceInr: 4999,
    marketPriceMonthlyInr: 5000,
    description: 'Apheresis batch management, cross-matching ledger, transfusion reaction audits, and NACO compliance.',
    status: 'GA'
  },
  {
    id: 'ADDON_TELE_CONSULT',
    name: 'HD Tele-Consult & E-Chamber',
    code: 'FEAT_TELE_CONSULT',
    category: 'COMMUNICATION',
    monthlyPriceInr: 149,
    yearlyPriceInr: 1499,
    marketPriceMonthlyInr: 2500,
    description: 'Zero-latency WebRTC encrypted video consults, patient screen-sharing, and UPI in-call fee collection.',
    status: 'GA'
  }
];

const INITIAL_ENTITLEMENTS: PartnerAddonEntitlement[] = [
  {
    id: 'ENT-001',
    partnerId: 'PARTNER-001',
    addonId: 'ADDON_AI_SCRIBE',
    addonCode: 'FEAT_AI_SCRIBE',
    addonName: 'Clinical AI Ambient Scribe',
    billingCycle: 'LIFETIME_FREE',
    status: 'ACTIVE',
    currentMonthlyInr: 0,
    subscribedAt: '2026-01-15T00:00:00.000Z',
    autoRenew: true
  },
  {
    id: 'ENT-002',
    partnerId: 'PARTNER-001',
    addonId: 'ADDON_OT_SURGERY',
    addonCode: 'FEAT_OT_SURGERY',
    addonName: 'Advanced OT & Surgical Suite',
    billingCycle: 'LIFETIME_FREE',
    status: 'ACTIVE',
    currentMonthlyInr: 0,
    subscribedAt: '2026-02-01T00:00:00.000Z',
    autoRenew: true
  },
  {
    id: 'ENT-003',
    partnerId: 'PARTNER-002',
    addonId: 'ADDON_WHATSAPP_BOT',
    addonCode: 'FEAT_WHATSAPP_BOT',
    addonName: 'Smart 2-Way WhatsApp OPD Bot',
    billingCycle: 'MONTHLY',
    status: 'ACTIVE',
    currentMonthlyInr: 99,
    subscribedAt: '2026-10-01T00:00:00.000Z',
    autoRenew: true
  }
];

const PARTNER_OPTIONS = [
  { value: 'PARTNER-001', label: 'Metropolitan Multispecialty Hospital (PARTNER-001)' },
  { value: 'PARTNER-002', label: 'Dr. Amitabh Verma Cardiology Clinic (PARTNER-002)' },
  { value: 'PARTNER-003', label: 'Dubai Marina Polyclinic (PARTNER-003)' },
  { value: 'PARTNER-004', label: 'City Heart Diagnostics Center (PARTNER-004)' }
];

export const MicroAddonsMarketplacePanel: React.FC = () => {
  const [selectedPartnerId, setSelectedPartnerId] = useState<string>('PARTNER-001');
  const [entitlements, setEntitlements] = useState<PartnerAddonEntitlement[]>(INITIAL_ENTITLEMENTS);
  const [notification, setNotification] = useState<string | null>(null);

  const activeEntitlementAddonIds = new Set(
    entitlements
      .filter((e) => e.partnerId === selectedPartnerId && e.status === 'ACTIVE')
      .map((e) => e.addonId)
  );

  const handleToggleAddon = (addon: MicroAddonCatalogItem) => {
    const isCurrentlyActive = activeEntitlementAddonIds.has(addon.id);

    if (isCurrentlyActive) {
      setEntitlements((prev) =>
        prev.map((e) =>
          e.partnerId === selectedPartnerId && e.addonId === addon.id
            ? { ...e, status: 'CANCELLED' }
            : e
        )
      );
      setNotification(`✓ Add-on "${addon.name}" deactivated for ${selectedPartnerId}. Monthly billing halted.`);
    } else {
      const existing = entitlements.find((e) => e.partnerId === selectedPartnerId && e.addonId === addon.id);
      if (existing) {
        setEntitlements((prev) =>
          prev.map((e) =>
            e.partnerId === selectedPartnerId && e.addonId === addon.id
              ? { ...e, status: 'ACTIVE', currentMonthlyInr: addon.monthlyPriceInr }
              : e
          )
        );
      } else {
        const newEntitlement: PartnerAddonEntitlement = {
          id: `ENT-${Date.now()}`,
          partnerId: selectedPartnerId,
          addonId: addon.id,
          addonCode: addon.code,
          addonName: addon.name,
          billingCycle: 'MONTHLY',
          status: 'ACTIVE',
          currentMonthlyInr: addon.monthlyPriceInr,
          subscribedAt: new Date().toISOString(),
          autoRenew: true
        };
        setEntitlements((prev) => [newEntitlement, ...prev]);
      }
      setNotification(`⚡ Add-on "${addon.name}" activated for ${selectedPartnerId}! Instant entitlement dispatched.`);
    }

    setTimeout(() => setNotification(null), 4000);
  };

  const handleGrantCompleteBundle = () => {
    MOCK_CATALOG.forEach((addon) => {
      const isAlreadyActive = activeEntitlementAddonIds.has(addon.id);
      if (!isAlreadyActive) {
        handleToggleAddon(addon);
      }
    });
    setNotification(`👑 "All-In-One Clinical Power Bundle" granted to ${selectedPartnerId} with 25% bundled discount!`);
    setTimeout(() => setNotification(null), 4500);
  };

  const activeCountForSelected = entitlements.filter(
    (e) => e.partnerId === selectedPartnerId && e.status === 'ACTIVE'
  ).length;

  const totalMonthlySpendForSelected = entitlements
    .filter((e) => e.partnerId === selectedPartnerId && e.status === 'ACTIVE')
    .reduce((sum, e) => sum + e.currentMonthlyInr, 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Banner & Partner Selector */}
      <div
        style={{
          backgroundColor: '#0F172A',
          border: '1px solid #1E293B',
          borderRadius: '16px',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.4)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '1.5rem' }}>🧩</span>
              <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 900, color: '#F8FAFC' }}>
                Modular Micro-Addons & Specialty App Store
              </h2>
              <Badge variant="success">0ms Entitlement Sync</Badge>
            </div>
            <p style={{ margin: '4px 0 0', fontSize: '0.8125rem', color: '#94A3B8' }}>
              Enable specialty clinical modules, AI engines, and hardware display endpoints with 1-click tenant provisioning.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleGrantCompleteBundle}
              style={{ fontWeight: 800, backgroundColor: 'rgba(234, 179, 8, 0.15)', borderColor: '#EAB308', color: '#FDE047' }}
            >
              👑 Grant All-In-One Pro Bundle (₹799/mo)
            </Button>
          </div>
        </div>

        {/* Partner Selector and Active Stats */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(280px, 1fr) auto auto',
            gap: '16px',
            alignItems: 'center',
            backgroundColor: '#1E293B',
            borderRadius: '12px',
            padding: '16px',
            border: '1px solid rgba(255,255,255,0.06)'
          }}
        >
          <div>
            <label style={{ display: 'block', fontSize: '0.6875rem', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', marginBottom: '6px' }}>
              Select Healthcare Partner Facility:
            </label>
            <Select
              value={selectedPartnerId}
              onChange={(e) => setSelectedPartnerId(e.target.value)}
              options={PARTNER_OPTIONS}
            />
          </div>

          <div style={{ padding: '0 16px', borderLeft: '1px solid rgba(255,255,255,0.1)', textAlign: 'center' }}>
            <span style={{ fontSize: '0.6875rem', color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase' }}>Active Addons</span>
            <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#38BDF8', fontFamily: 'monospace' }}>
              {activeCountForSelected} / {MOCK_CATALOG.length} Active
            </div>
          </div>

          <div style={{ padding: '0 16px', borderLeft: '1px solid rgba(255,255,255,0.1)', textAlign: 'center' }}>
            <span style={{ fontSize: '0.6875rem', color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase' }}>Add-on Monthly MRR</span>
            <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#10B981', fontFamily: 'monospace' }}>
              ₹ {totalMonthlySpendForSelected.toLocaleString('en-IN')}/mo
            </div>
          </div>
        </div>
      </div>

      {notification && (
        <div
          style={{
            backgroundColor: 'rgba(16, 185, 129, 0.15)',
            border: '1px solid #10B981',
            borderRadius: '10px',
            padding: '12px 16px',
            color: '#A7F3D0',
            fontSize: '0.875rem',
            fontWeight: 700,
            animation: 'fadeIn 0.2s ease-in'
          }}
        >
          {notification}
        </div>
      )}

      {/* Addon Catalog Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '16px' }}>
        {MOCK_CATALOG.map((addon) => {
          const isActive = activeEntitlementAddonIds.has(addon.id);
          const marketSavings = addon.marketPriceMonthlyInr - addon.monthlyPriceInr;
          const savingsPercent = Math.round((marketSavings / addon.marketPriceMonthlyInr) * 100);

          return (
            <Card key={addon.id} title={addon.name}>
              <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between', gap: '16px' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <code style={{ fontSize: '0.6875rem', backgroundColor: '#020617', color: '#38BDF8', padding: '2px 6px', borderRadius: '4px' }}>
                      {addon.code}
                    </code>
                    {isActive ? (
                      <span
                        style={{
                          fontSize: '0.6875rem',
                          fontWeight: 800,
                          backgroundColor: 'rgba(16, 185, 129, 0.2)',
                          color: '#34D399',
                          padding: '2px 8px',
                          borderRadius: '6px',
                          border: '1px solid rgba(16, 185, 129, 0.5)'
                        }}
                      >
                        ✓ INSTALLED & ACTIVE
                      </span>
                    ) : (
                      <span
                        style={{
                          fontSize: '0.6875rem',
                          fontWeight: 700,
                          backgroundColor: 'rgba(148, 163, 184, 0.1)',
                          color: '#94A3B8',
                          padding: '2px 8px',
                          borderRadius: '6px',
                          border: '1px solid rgba(148, 163, 184, 0.2)'
                        }}
                      >
                        AVAILABLE
                      </span>
                    )}
                  </div>

                  <p style={{ fontSize: '0.8125rem', color: '#CBD5E1', lineHeight: '1.5', margin: '0 0 16px 0', minHeight: '48px' }}>
                    {addon.description}
                  </p>

                  <div
                    style={{
                      backgroundColor: '#0B1120',
                      border: '1px solid rgba(255,255,255,0.06)',
                      borderRadius: '8px',
                      padding: '10px 12px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '0.625rem', color: '#94A3B8', textTransform: 'uppercase', fontWeight: 700 }}>
                        DocSearch Pricing
                      </div>
                      <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#F8FAFC' }}>
                        ₹ {addon.monthlyPriceInr}
                        <span style={{ fontSize: '0.6875rem', fontWeight: 600, color: '#94A3B8' }}>/month</span>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.625rem', color: '#EF4444', textDecoration: 'line-through' }}>
                        Market: ₹{addon.marketPriceMonthlyInr}/mo
                      </div>
                      <div style={{ fontSize: '0.6875rem', color: '#10B981', fontWeight: 800 }}>
                        Save {savingsPercent}% vs Rivals
                      </div>
                    </div>
                  </div>
                </div>

                <Button
                  variant={isActive ? 'outline' : 'primary'}
                  size="md"
                  onClick={() => handleToggleAddon(addon)}
                  style={{
                    fontWeight: 800,
                    width: '100%',
                    borderColor: isActive ? '#EF4444' : undefined,
                    color: isActive ? '#F87171' : undefined
                  }}
                >
                  {isActive ? '✕ Revoke Addon Entitlement' : '⚡ 1-Click Activate for Tenant'}
                </Button>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
