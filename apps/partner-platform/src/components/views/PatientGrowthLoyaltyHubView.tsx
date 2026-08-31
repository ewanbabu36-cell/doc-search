import React, { useState } from 'react';
import { Badge, Button } from '@docsearch/ui-kit';

export const PatientGrowthLoyaltyHubView: React.FC = () => {
  const [selectedPlan, setSelectedPlan] = useState<'GOLD' | 'SILVER' | 'PLATINUM'>('GOLD');
  const [refillStatus, setRefillStatus] = useState<'PENDING' | 'CONFIRMED' | 'DISPATCHED'>('PENDING');
  const [labBooked, setLabBooked] = useState(false);
  const [walletBalance, setWalletBalance] = useState(340);
  const [coinsRedeemed, setCoinsRedeemed] = useState(false);

  const handleSimulateRefill = () => {
    setRefillStatus('CONFIRMED');
    setTimeout(() => {
      setRefillStatus('DISPATCHED');
      setWalletBalance((prev) => prev + 28); // 10% cashback in coins
    }, 1500);
  };

  const handleBookLab = () => {
    setLabBooked(true);
    setWalletBalance((prev) => prev + 89);
    setTimeout(() => setLabBooked(false), 4000);
  };

  const handleRedeemCoins = () => {
    if (walletBalance >= 100) {
      setCoinsRedeemed(true);
      setWalletBalance((prev) => prev - 100);
      setTimeout(() => setCoinsRedeemed(false), 3000);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Header Banner */}
      <div style={{
        backgroundColor: 'rgba(234, 179, 8, 0.1)',
        border: '1px solid rgba(234, 179, 8, 0.3)',
        borderRadius: '16px',
        padding: '20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span style={{ fontSize: '1.5rem' }}>👑</span>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#F8FAFC', margin: 0 }}>
              DocSearch Patient Care Club & Growth Engine
            </h2>
            <Badge variant="warning">Family Pass & 1-Click Ecosystem</Badge>
          </div>
          <p style={{ color: '#94A3B8', fontSize: '0.8125rem', margin: 0 }}>
            Maximizes patient footfall & 100% lifetime retention across Network Doctors, Diagnostic Labs, and Pharmacies via subscriptions & WhatsApp auto-refills.
          </p>
        </div>

        {/* Network Growth HUD */}
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ backgroundColor: 'rgba(30, 41, 59, 0.8)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '8px 14px', textAlign: 'center' }}>
            <div style={{ fontSize: '0.625rem', color: '#94A3B8', fontWeight: 700 }}>ACTIVE CARE PASS FAMILIES</div>
            <div style={{ fontSize: '1.125rem', fontWeight: 900, color: '#FCD34D' }}>1,420 Active</div>
          </div>
          <div style={{ backgroundColor: 'rgba(30, 41, 59, 0.8)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '8px 14px', textAlign: 'center' }}>
            <div style={{ fontSize: '0.625rem', color: '#94A3B8', fontWeight: 700 }}>PATIENT RETENTION RATE</div>
            <div style={{ fontSize: '1.125rem', fontWeight: 900, color: '#10B981' }}>84.6% (+52%)</div>
          </div>
        </div>
      </div>

      {/* 3 Care Club Subscription Tier Cards */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <span style={{ fontSize: '0.875rem', fontWeight: 800, color: '#F8FAFC', textTransform: 'uppercase' }}>
            🎟️ 1. "DocSearch Family Care Pass" Membership Plans
          </span>
          <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>Select a plan to preview patient perks</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
          
          {/* Silver */}
          <div
            onClick={() => setSelectedPlan('SILVER')}
            style={{
              backgroundColor: selectedPlan === 'SILVER' ? 'rgba(56, 189, 248, 0.12)' : 'rgba(15, 23, 42, 0.7)',
              border: selectedPlan === 'SILVER' ? '2px solid #38BDF8' : '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '16px',
              padding: '20px',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: '12px'
            }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '1rem', fontWeight: 800, color: '#F8FAFC' }}>Silver Pass</span>
                <Badge variant="neutral">Individual (1 Person)</Badge>
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#38BDF8', margin: '8px 0', fontFamily: 'monospace' }}>
                ₹299 <span style={{ fontSize: '0.8125rem', color: '#94A3B8', fontWeight: 500 }}>/ year</span>
              </div>
              <ul style={{ fontSize: '0.75rem', color: '#CBD5E1', paddingLeft: '16px', lineHeight: '1.6', margin: 0 }}>
                <li>1 Free Doctor Consultation (OPD / Video)</li>
                <li>Flat 15% OFF on Network Diagnostic Labs</li>
                <li>Flat 15% OFF on Home Delivery Medicines</li>
                <li>Free Home Blood Sample Collection</li>
              </ul>
            </div>
            <Button variant={selectedPlan === 'SILVER' ? 'primary' : 'outline'} size="sm">
              {selectedPlan === 'SILVER' ? '✓ Plan Selected' : 'Choose Silver'}
            </Button>
          </div>

          {/* Gold (Most Popular) */}
          <div
            onClick={() => setSelectedPlan('GOLD')}
            style={{
              backgroundColor: selectedPlan === 'GOLD' ? 'rgba(234, 179, 8, 0.15)' : 'rgba(15, 23, 42, 0.7)',
              border: selectedPlan === 'GOLD' ? '2px solid #EAB308' : '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '16px',
              padding: '20px',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: '12px',
              boxShadow: selectedPlan === 'GOLD' ? '0 0 30px rgba(234, 179, 8, 0.25)' : 'none',
              position: 'relative'
            }}
          >
            <div style={{ position: 'absolute', top: '-10px', right: '16px', backgroundColor: '#EAB308', color: '#000', fontSize: '0.625rem', fontWeight: 900, padding: '2px 8px', borderRadius: '10px' }}>
              MOST POPULAR (4 FAMILY MEMBERS)
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '1rem', fontWeight: 800, color: '#FCD34D' }}>Gold Family Pass</span>
                <Badge variant="warning">Family of 4</Badge>
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#FCD34D', margin: '8px 0', fontFamily: 'monospace' }}>
                ₹799 <span style={{ fontSize: '0.8125rem', color: '#94A3B8', fontWeight: 500 }}>/ year</span>
              </div>
              <ul style={{ fontSize: '0.75rem', color: '#CBD5E1', paddingLeft: '16px', lineHeight: '1.6', margin: 0 }}>
                <li><strong>3 Free Doctor Consultations</strong> (Any Specialist)</li>
                <li><strong>Flat 25% OFF</strong> on all Blood Tests & X-Rays</li>
                <li><strong>Flat 20% OFF</strong> on Medicines + 60-Min Delivery</li>
                <li>Free Unlimited AI Health Assistant & Diet Chart</li>
              </ul>
            </div>
            <Button variant={selectedPlan === 'GOLD' ? 'primary' : 'outline'} size="sm" style={{ backgroundColor: '#EAB308', borderColor: '#EAB308', color: '#000', fontWeight: 800 }}>
              {selectedPlan === 'GOLD' ? '✓ Plan Selected' : 'Choose Gold Family'}
            </Button>
          </div>

          {/* Platinum Chronic */}
          <div
            onClick={() => setSelectedPlan('PLATINUM')}
            style={{
              backgroundColor: selectedPlan === 'PLATINUM' ? 'rgba(139, 92, 246, 0.12)' : 'rgba(15, 23, 42, 0.7)',
              border: selectedPlan === 'PLATINUM' ? '2px solid #8B5CF6' : '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '16px',
              padding: '20px',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: '12px'
            }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '1rem', fontWeight: 800, color: '#E9D5FF' }}>Platinum Chronic Care</span>
                <Badge variant="primary">Elderly & Chronic</Badge>
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#C084FC', margin: '8px 0', fontFamily: 'monospace' }}>
                ₹1,499 <span style={{ fontSize: '0.8125rem', color: '#94A3B8', fontWeight: 500 }}>/ year</span>
              </div>
              <ul style={{ fontSize: '0.75rem', color: '#CBD5E1', paddingLeft: '16px', lineHeight: '1.6', margin: 0 }}>
                <li><strong>6 Free Doctor Reviews</strong> (Diabetologist/Cardiologist)</li>
                <li><strong>Flat 30% OFF</strong> on Routine Blood Tests (HbA1c/Lipid)</li>
                <li>Automatic Monthly Medicine Home Refill with 22% OFF</li>
                <li>Dedicated WhatsApp Care Manager & SOS Doctor Line</li>
              </ul>
            </div>
            <Button variant={selectedPlan === 'PLATINUM' ? 'primary' : 'outline'} size="sm">
              {selectedPlan === 'PLATINUM' ? '✓ Plan Selected' : 'Choose Platinum'}
            </Button>
          </div>
        </div>
      </div>

      {/* 2-Column: WhatsApp 1-Click Medicine Refill & Health Coins Wallet */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '20px' }}>
        
        {/* Left: WhatsApp 1-Click Monthly Medicine Refill Bot */}
        <div style={{
          backgroundColor: '#0F172A',
          border: '1px solid rgba(34, 197, 94, 0.3)',
          borderRadius: '16px',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
          boxShadow: '0 20px 50px rgba(0,0,0,0.8)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '1.25rem' }}>💬</span>
              <span style={{ fontSize: '0.875rem', fontWeight: 800, color: '#F8FAFC', textTransform: 'uppercase' }}>
                2. 1-Click WhatsApp Medicine Refill
              </span>
            </div>
            <Badge variant="success">Auto-Trigger Day 25</Badge>
          </div>

          {/* WhatsApp Chat Simulation Frame */}
          <div style={{
            backgroundColor: '#0B141A',
            borderRadius: '12px',
            padding: '14px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            border: '1px solid #1E293B'
          }}>
            {/* Outgoing Message from DocSearch Bot */}
            <div style={{
              backgroundColor: '#005C4B',
              color: '#E9EDEF',
              padding: '10px 14px',
              borderRadius: '8px',
              maxWidth: '90%',
              fontSize: '0.75rem',
              lineHeight: '1.5'
            }}>
              <div><strong>Namaste Rahul ji! 🙏</strong></div>
              <div style={{ marginTop: '4px' }}>
                Aapka BP Medicine (<strong>Telmisartan 40mg + Amlodipine 5mg</strong>) agle 5 din me khatam ho raha hai.
              </div>
              <div style={{ marginTop: '6px', color: '#A7F3D0' }}>
                Aapke <strong>Gold Family Pass</strong> par Flat 20% Discount lag kar MRP ₹350 $ightarrow$ <strong>₹280 (Free 60-Min Home Delivery)</strong>.
              </div>
              <div style={{ fontSize: '0.625rem', color: '#8696A0', textAlign: 'right', marginTop: '4px' }}>10:30 AM ✓✓</div>
            </div>

            {/* Quick Action Button for Patient */}
            {refillStatus === 'PENDING' ? (
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleSimulateRefill}
                  style={{ backgroundColor: '#22C55E', borderColor: '#22C55E', color: '#000', fontWeight: 800, fontSize: '0.75rem' }}
                >
                  ⚡ [Tap to Confirm: Deliver to Home ₹280]
                </Button>
              </div>
            ) : (
              <div style={{
                backgroundColor: '#202C33',
                color: '#25D366',
                padding: '8px 12px',
                borderRadius: '8px',
                alignSelf: 'flex-end',
                fontSize: '0.75rem',
                fontWeight: 700
              }}>
                ✓ Confirmed! Order #PHARM-9041 Dispatched via Network Pharmacy Rider (ETA: 45 Mins).
              </div>
            )}
          </div>

          <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
            💡 <em>Result: Pharmacy repeat order rate jumps from 22% to <strong>82% monthly retention</strong>!</em>
          </div>
        </div>

        {/* Right: Health Coins Cashback Wallet & Diagnostic Lab Booking */}
        <div style={{
          backgroundColor: '#0F172A',
          border: '1px solid rgba(234, 179, 8, 0.3)',
          borderRadius: '16px',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
          boxShadow: '0 20px 50px rgba(0,0,0,0.8)'
        }}>
          {/* Wallet Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '1.25rem' }}>🪙</span>
              <span style={{ fontSize: '0.875rem', fontWeight: 800, color: '#F8FAFC', textTransform: 'uppercase' }}>
                3. DocSearch Health Coins Loyalty Wallet
              </span>
            </div>
            <div style={{ fontSize: '1.125rem', fontWeight: 900, color: '#FCD34D', fontFamily: 'monospace' }}>
              ₹{walletBalance} Coins
            </div>
          </div>

          {/* Wallet Balance Card */}
          <div style={{
            backgroundColor: 'rgba(234, 179, 8, 0.1)',
            border: '1px solid rgba(234, 179, 8, 0.3)',
            borderRadius: '10px',
            padding: '12px 16px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div>
              <span style={{ fontSize: '0.75rem', color: '#FCD34D', fontWeight: 700 }}>Available Loyalty Balance:</span>
              <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#FFFFFF', fontFamily: 'monospace' }}>
                {walletBalance} Health Coins <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>(1 Coin = ₹1)</span>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRedeemCoins}
              style={{ fontWeight: 700, borderColor: '#FCD34D', color: '#FCD34D' }}
            >
              {coinsRedeemed ? '✓ ₹100 Redeemed!' : 'Redeem ₹100'}
            </Button>
          </div>

          {/* Instant Network Lab Booking with Home Collection */}
          <div style={{ backgroundColor: 'rgba(30, 41, 59, 0.5)', padding: '12px 14px', borderRadius: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <strong style={{ color: '#38BDF8', fontSize: '0.8125rem' }}>🧪 Full Body Health Checkup (64 Tests)</strong>
                <div style={{ fontSize: '0.6875rem', color: '#94A3B8' }}>Includes CBC, Lipid, Liver, Kidney, Sugar & Free Home Phlebotomist</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ textDecoration: 'line-through', color: '#64748B', fontSize: '0.6875rem' }}>₹1,999</span>
                <div style={{ fontSize: '1rem', fontWeight: 900, color: '#10B981', fontFamily: 'monospace' }}>₹899</div>
              </div>
            </div>

            <Button
              variant="primary"
              size="sm"
              onClick={handleBookLab}
              style={{ width: '100%', fontWeight: 800, backgroundColor: '#06B6D4', borderColor: '#06B6D4', color: '#070C16', marginTop: '4px' }}
            >
              {labBooked ? '✓ Free Home Collection Booked for Tomorrow 7:00 AM!' : '🛵 Book Free Home Collection (₹899 + Earn 89 Coins)'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
