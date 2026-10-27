import React, { useState, useEffect } from 'react';
import type { OperationalSubscriptionDto } from '@docsearch/api-contracts';
import { Card, Badge, TableContainer, Table, TableHeader, TableBody, TableRow, TableHead, TableCell, Button } from '@docsearch/ui-kit';
import { apiRequest } from '../../services/api-client.js';

export interface SubscriptionEntitlementViewProps {
  subscriptions: OperationalSubscriptionDto[];
  onNavigateToAccount?: () => void;
}

export const SubscriptionEntitlementView: React.FC<SubscriptionEntitlementViewProps> = ({
  subscriptions,
  onNavigateToAccount
}) => {
  const [activeTab, setActiveTab] = useState<'B2B_PLANS' | 'CARE_PASS'>('CARE_PASS');
  const [carePasses, setCarePasses] = useState<any[]>([]);
  const [walletPhone, setWalletPhone] = useState('+91 98118 77665');
  const [walletAmount, setWalletAmount] = useState('5000');
  const [walletStatus, setWalletStatus] = useState<string | null>(null);
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [newSubName, setNewSubName] = useState('');
  const [newSubPhone, setNewSubPhone] = useState('');
  const [newSubTier, setNewSubTier] = useState<'ANNUAL_FAMILY' | 'MONTHLY_CHRONIC'>('ANNUAL_FAMILY');

  useEffect(() => {
    async function loadCarePasses() {
      try {
        const res = await apiRequest<any[]>('/api/v1/partner/billing/care-passes/active');
        if (res.success && Array.isArray(res.data)) {
          setCarePasses(res.data);
        }
      } catch (err) {
        console.warn('Care pass fetch notice:', err);
      }
    }
    loadCarePasses();
  }, []);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubName || !newSubPhone) return;
    setIsSubscribing(true);
    try {
      const res = await apiRequest<any>('/api/v1/partner/billing/care-passes/subscribe', {
        method: 'POST',
        body: JSON.stringify({
          patientName: newSubName,
          patientPhone: newSubPhone,
          passTier: newSubTier
        })
      });
      if (res.success && res.data) {
        setCarePasses((prev) => [res.data, ...prev]);
        setNewSubName('');
        setNewSubPhone('');
        alert(`✅ Enrolled ${res.data.patientName} into ${res.data.passCode}!`);
      }
    } catch (err: any) {
      alert('Subscription failed: ' + err?.message);
    } finally {
      setIsSubscribing(false);
    }
  };

  const handleTopupWallet = async () => {
    const amt = Number(walletAmount);
    if (!amt || isNaN(amt)) return;
    try {
      const res = await apiRequest<any>('/api/v1/partner/billing/care-passes/wallet-topup', {
        method: 'POST',
        body: JSON.stringify({
          patientPhone: walletPhone,
          amount: amt
        })
      });
      if (res.success && res.data) {
        setWalletStatus(`✅ Wallet credited with ₹${res.data.walletBalance} + ₹${res.data.bonusCreditBalance} promotional bonus!`);
        setTimeout(() => setWalletStatus(null), 5000);
      }
    } catch (err: any) {
      alert('Wallet topup failed: ' + err?.message);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Tab Switcher */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            type="button"
            onClick={() => setActiveTab('CARE_PASS')}
            style={{
              backgroundColor: activeTab === 'CARE_PASS' ? '#0284C7' : 'rgba(255,255,255,0.06)',
              color: activeTab === 'CARE_PASS' ? '#FFF' : '#CBD5E1',
              border: `1.5px solid ${activeTab === 'CARE_PASS' ? '#38BDF8' : 'rgba(255,255,255,0.1)'}`,
              borderRadius: '10px',
              padding: '10px 18px',
              fontWeight: 800,
              fontSize: '0.85rem',
              cursor: 'pointer'
            }}
          >
            🛡️ DocSearch Care Pass™ & Chronic Subscriptions ({carePasses.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('B2B_PLANS')}
            style={{
              backgroundColor: activeTab === 'B2B_PLANS' ? '#0284C7' : 'rgba(255,255,255,0.06)',
              color: activeTab === 'B2B_PLANS' ? '#FFF' : '#CBD5E1',
              border: `1.5px solid ${activeTab === 'B2B_PLANS' ? '#38BDF8' : 'rgba(255,255,255,0.1)'}`,
              borderRadius: '10px',
              padding: '10px 18px',
              fontWeight: 800,
              fontSize: '0.85rem',
              cursor: 'pointer'
            }}
          >
            🏢 B2B Hospital Operational SaaS Subscriptions ({subscriptions.length})
          </button>
        </div>

        {onNavigateToAccount && (
          <Button variant="primary" size="sm" onClick={onNavigateToAccount}>
            💳 Open Full Plan & Features Breakdown
          </Button>
        )}
      </div>

      {/* TAB 1: DOCSEARCH CARE PASS & CHRONIC CARE PASS */}
      {activeTab === 'CARE_PASS' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Plan Comparison Grid (vs Apollo Circle & Tata 1mg) */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
            <div style={{
              background: 'linear-gradient(135deg, rgba(30, 27, 75, 0.95) 0%, rgba(15, 23, 42, 0.95) 100%)',
              border: '1.5px solid #818CF8',
              borderRadius: '18px',
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: '14px',
              boxShadow: '0 8px 30px rgba(0, 0, 0, 0.4)'
            }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Badge variant="primary">ANNUAL FAMILY PLAN</Badge>
                  <span style={{ fontSize: '0.75rem', color: '#A7F3D0', fontWeight: 700 }}>Benchmark: Apollo Circle</span>
                </div>
                <h3 style={{ margin: '8px 0 4px', fontSize: '1.25rem', color: '#F8FAFC', fontWeight: 900 }}>
                  DocSearch Family Health Shield
                </h3>
                <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#38BDF8' }}>
                  ₹999<span style={{ fontSize: '0.9rem', color: '#94A3B8' }}>/year</span>
                </div>
                <ul style={{ margin: '12px 0 0', paddingLeft: '18px', fontSize: '0.82rem', color: '#CBD5E1', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <li>✓ <strong>Unlimited Free OPD Follow-ups</strong> for up to 4 family members</li>
                  <li>✓ <strong>Flat 15% Savings</strong> on in-house pharmacy dispensing</li>
                  <li>✓ <strong>12 Free Home Blood Collections</strong> (Save ₹1,800/yr)</li>
                  <li>✓ Priority bed booking & emergency admission concierge</li>
                </ul>
              </div>
              <div style={{ fontSize: '0.75rem', color: '#94A3B8', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '10px' }}>
                Auto-Renewal: <strong style={{ color: '#34D399' }}>Active via Dynamic UPI</strong> | Churn Risk: <strong>&lt; 5%</strong>
              </div>
            </div>

            <div style={{
              background: 'linear-gradient(135deg, rgba(6, 78, 59, 0.4) 0%, rgba(15, 23, 42, 0.95) 100%)',
              border: '1.5px solid #10B981',
              borderRadius: '18px',
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: '14px',
              boxShadow: '0 8px 30px rgba(0, 0, 0, 0.4)'
            }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Badge variant="success">MONTHLY CHRONIC PASS</Badge>
                  <span style={{ fontSize: '0.75rem', color: '#FDE68A', fontWeight: 700 }}>Benchmark: Tata 1mg Care</span>
                </div>
                <h3 style={{ margin: '8px 0 4px', fontSize: '1.25rem', color: '#F8FAFC', fontWeight: 900 }}>
                  Diabetes & Cardiac Care Pass
                </h3>
                <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#34D399' }}>
                  ₹199<span style={{ fontSize: '0.9rem', color: '#94A3B8' }}>/month</span>
                </div>
                <ul style={{ margin: '12px 0 0', paddingLeft: '18px', fontSize: '0.82rem', color: '#CBD5E1', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <li>✓ <strong>Free Monthly Doorstep Blood Draw</strong> (HbA1c & Lipid Profile)</li>
                  <li>✓ <strong>3-Day Medication Refill Radar</strong> with automatic WhatsApp reminder</li>
                  <li>✓ <strong>Flat 15% Jan Aushadhi & Generic Savings</strong></li>
                  <li>✓ Monthly tele-consult review with attending consultant</li>
                </ul>
              </div>
              <div style={{ fontSize: '0.75rem', color: '#94A3B8', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '10px' }}>
                Recurring Mandate: <strong style={{ color: '#34D399' }}>Razorpay / UPI AutoPay</strong> | Churn Risk: <strong>&lt; 8%</strong>
              </div>
            </div>
          </div>

          {/* Stored-Value Prepaid Health Wallet Topup */}
          <div style={{
            backgroundColor: '#0F172A',
            border: '1.5px solid rgba(245, 158, 11, 0.4)',
            borderRadius: '16px',
            padding: '20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '16px'
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '1.3rem' }}>💳</span>
                <h4 style={{ margin: 0, color: '#FCD34D', fontWeight: 900, fontSize: '1.05rem' }}>
                  Prepaid Health Wallet Recharge (+10% Bonus Promotional Credits)
                </h4>
              </div>
              <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: '#CBD5E1' }}>
                Top up ₹2,000 or more to instantly credit 10% extra bonus balance for outpatient medicines and lab tests.
              </p>
            </div>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <input
                type="text"
                placeholder="Patient Phone"
                value={walletPhone}
                onChange={(e) => setWalletPhone(e.target.value)}
                style={{ padding: '8px 12px', borderRadius: '8px', backgroundColor: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', color: '#FFF', fontSize: '0.85rem' }}
              />
              <input
                type="number"
                placeholder="Amount (₹)"
                value={walletAmount}
                onChange={(e) => setWalletAmount(e.target.value)}
                style={{ width: '110px', padding: '8px 12px', borderRadius: '8px', backgroundColor: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', color: '#FFF', fontSize: '0.85rem', fontWeight: 700 }}
              />
              <button
                type="button"
                onClick={handleTopupWallet}
                style={{ backgroundColor: '#F59E0B', color: '#000', border: 'none', borderRadius: '8px', padding: '8px 16px', fontWeight: 800, fontSize: '0.85rem', cursor: 'pointer' }}
              >
                ⚡ Top-Up (+10% Bonus)
              </button>
            </div>
            {walletStatus && (
              <div style={{ width: '100%', color: '#34D399', fontSize: '0.85rem', fontWeight: 700 }}>
                {walletStatus}
              </div>
            )}
          </div>

          {/* 1-Click Quick Patient Care Pass Enrollment Form */}
          <form
            onSubmit={handleSubscribe}
            style={{
              backgroundColor: '#0F172A',
              border: '1.5px solid rgba(56, 189, 248, 0.3)',
              borderRadius: '16px',
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '1.25rem' }}>⚡</span>
                <h4 style={{ margin: 0, color: '#38BDF8', fontWeight: 900, fontSize: '1.05rem' }}>
                  Quick Patient Care Pass Enrollment
                </h4>
              </div>
              <span style={{ fontSize: '0.78rem', color: '#94A3B8' }}>
                Instant Activation • WhatsApp Digital Card Dispatched
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', alignItems: 'end' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: '#94A3B8', marginBottom: '4px', fontWeight: 700 }}>
                  PATIENT FULL NAME
                </label>
                <input
                  type="text"
                  placeholder="e.g. Rahul Sharma"
                  value={newSubName}
                  onChange={(e) => setNewSubName(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.15)',
                    color: '#FFF',
                    fontSize: '0.85rem'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: '#94A3B8', marginBottom: '4px', fontWeight: 700 }}>
                  WHATSAPP / MOBILE NO
                </label>
                <input
                  type="text"
                  placeholder="+91 98765 43210"
                  value={newSubPhone}
                  onChange={(e) => setNewSubPhone(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.15)',
                    color: '#FFF',
                    fontSize: '0.85rem'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: '#94A3B8', marginBottom: '4px', fontWeight: 700 }}>
                  MEMBERSHIP PLAN
                </label>
                <select
                  value={newSubTier}
                  onChange={(e) => setNewSubTier(e.target.value as any)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    backgroundColor: '#1E293B',
                    border: '1px solid rgba(255,255,255,0.15)',
                    color: '#38BDF8',
                    fontWeight: 700,
                    fontSize: '0.85rem'
                  }}
                >
                  <option value="ANNUAL_FAMILY">Family Health Shield (₹999 / year)</option>
                  <option value="MONTHLY_CHRONIC">Diabetes & Cardiac Pass (₹199 / month)</option>
                </select>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={isSubscribing}
                  style={{
                    width: '100%',
                    backgroundColor: '#0284C7',
                    color: '#FFF',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '9px 16px',
                    fontWeight: 800,
                    fontSize: '0.85rem',
                    cursor: isSubscribing ? 'not-allowed' : 'pointer',
                    opacity: isSubscribing ? 0.7 : 1
                  }}
                >
                  {isSubscribing ? 'Activating Pass...' : '🛡️ Enroll & Activate Pass'}
                </button>
              </div>
            </div>
          </form>

          {/* Real Subscriber Directory */}
          <Card title="Active Care Pass Subscriptions Directory" padding="none">
            <TableContainer style={{ border: 'none', borderRadius: '0' }}>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Subscriber Name</TableHead>
                    <TableHead>Pass Plan Tier</TableHead>
                    <TableHead>Annual / Monthly Fee</TableHead>
                    <TableHead>Pharmacy Discount</TableHead>
                    <TableHead>Home Blood Draws</TableHead>
                    <TableHead>Auto-Debit Webhook</TableHead>
                    <TableHead>Valid Until</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {carePasses.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell>
                        <strong style={{ color: '#F8FAFC', fontSize: '0.85rem' }}>{p.patientName}</strong>
                        <div style={{ fontSize: '0.72rem', color: '#94A3B8' }}>📞 {p.patientPhone}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="primary">{p.passCode}</Badge>
                      </TableCell>
                      <TableCell>
                        <strong style={{ color: '#34D399' }}>₹{Number(p.annualFee).toLocaleString('en-IN')}</strong>
                      </TableCell>
                      <TableCell>
                        <Badge variant="success">-{p.pharmacyDiscountPct}%</Badge>
                      </TableCell>
                      <TableCell>
                        <span>{p.freeHomeCollectionUsed} / {p.freeHomeCollectionAllowance} visits used</span>
                      </TableCell>
                      <TableCell>
                        <Badge variant={p.autoDebitWebhookActive ? 'success' : 'neutral'}>
                          {p.autoDebitWebhookActive ? '⚡ UPI AutoPay Active' : 'Manual'}
                        </Badge>
                      </TableCell>
                      <TableCell style={{ fontSize: '0.75rem', color: '#CBD5E1' }}>
                        {new Date(p.expiryDate).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Badge variant={p.status === 'ACTIVE' ? 'success' : 'danger'}>{p.status}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>
        </div>
      )}

      {/* TAB 2: B2B HOSPITAL OPERATIONAL SUBSCRIPTIONS */}
      {activeTab === 'B2B_PLANS' && (
        <Card
          title="Organization Subscription & Module Entitlements"
          subtitle="Active plans, enabled clinical modules, and contract coverage dates"
          padding="none"
        >
          <TableContainer style={{ border: 'none', borderRadius: '0' }}>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Organization</TableHead>
                  <TableHead>Plan Reference</TableHead>
                  <TableHead>Enabled Operational Modules</TableHead>
                  <TableHead>Effective Date</TableHead>
                  <TableHead>Expiry Date</TableHead>
                  <TableHead>Entitlement Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {subscriptions.map((sub) => (
                  <TableRow key={sub.id}>
                    <TableCell>
                      <strong style={{ color: 'var(--ds-color-text-primary)' }}>
                        {sub.organizationName ?? 'Organization'}
                      </strong>
                    </TableCell>
                    <TableCell style={{ fontFamily: 'var(--ds-font-mono)', fontSize: '0.8125rem' }}>
                      <Badge variant="primary">{sub.planReference}</Badge>
                    </TableCell>
                    <TableCell>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                        {sub.enabledModules.map((m) => (
                          <Badge key={m} variant="neutral">
                            {m}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-secondary)' }}>
                      {new Date(sub.effectiveDate).toLocaleDateString()}
                    </TableCell>
                    <TableCell style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-secondary)' }}>
                      {sub.expiryDate ? new Date(sub.expiryDate).toLocaleDateString() : 'Auto-Renew'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={sub.entitlementStatus === 'ACTIVE' ? 'success' : 'danger'}>
                        {sub.entitlementStatus}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      )}
    </div>
  );
};
