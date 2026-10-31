import React, { useState } from 'react';
import { type Language } from '../i18n.js';
import { type PatientProfile } from '../services/patient-api.js';

export interface Tata1mgQuickOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
  patient: PatientProfile;
  initialTab?: 'MEDICINE' | 'LAB_TEST' | 'ABHA_CARD';
}

export const Tata1mgQuickOrderModal: React.FC<Tata1mgQuickOrderModalProps> = ({
  isOpen,
  onClose,
  language,
  patient,
  initialTab = 'MEDICINE'
}) => {
  const [activeTab, setActiveTab] = useState<'MEDICINE' | 'LAB_TEST' | 'ABHA_CARD'>(initialTab);

  // Pharmacy Order State
  const [useGenericSubstitution, setUseGenericSubstitution] = useState(true);
  const [selectedParchiSource, setSelectedParchiSource] = useState<'RECENT_VISIT' | 'UPLOAD_NEW'>('RECENT_VISIT');
  const [deliveryAddress, setDeliveryAddress] = useState('Flat 402, Green Valley Apartments, Sector 14, Near City Park');
  const [orderConfirmed, setOrderConfirmed] = useState(false);

  // Lab Test Booking State
  const [selectedPackageId, setSelectedPackageId] = useState<string>('pkg-fullbody');
  const [selectedSlot, setSelectedSlot] = useState<string>('Tomorrow 07:30 AM - 08:30 AM (Fasting)');
  const [bookingConfirmed, setBookingConfirmed] = useState(false);

  if (!isOpen) return null;

  const isHindi = language === 'hi';

  const medicineCart = {
    brandTotal: 840,
    genericTotal: 210,
    items: [
      {
        brandName: 'Augmentin 625 Duo (10 Tabs)',
        genericName: 'Jan Aushadhi Amoxycillin + Pot Clav 625mg',
        brandPrice: 220,
        genericPrice: 55
      },
      {
        brandName: 'Pan 40 (Pantoprazole 40mg - 15 Tabs)',
        genericName: 'Jan Aushadhi Pantoprazole 40mg',
        brandPrice: 155,
        genericPrice: 32
      },
      {
        brandName: 'Montair LC (10 Tabs)',
        genericName: 'Jan Aushadhi Montelukast + Levocetirizine',
        brandPrice: 195,
        genericPrice: 42
      },
      {
        brandName: 'Dolo 650 (15 Tabs)',
        genericName: 'Jan Aushadhi Paracetamol 650mg',
        brandPrice: 35,
        genericPrice: 12
      },
      {
        brandName: 'Telma 40 (Telmisartan 40mg - 15 Tabs)',
        genericName: 'Jan Aushadhi Telmisartan 40mg',
        brandPrice: 235,
        genericPrice: 69
      }
    ]
  };

  const labPackages = [
    {
      id: 'pkg-fullbody',
      name: isHindi ? 'संपूर्ण शरीर जांच (64 पैरामीटर)' : 'Comprehensive Full Body Health Checkup (64 Parameters)',
      tests: ['CBC (24 Parameters)', 'Lipid Profile (7 Tests)', 'Liver Function Test (LFT - 11 Tests)', 'Kidney Function (KFT - 8 Tests)', 'Fasting Blood Sugar', 'HbA1c', 'Thyroid Profile (T3, T4, TSH)'],
      mrp: 1800,
      price: 499,
      badge: '🔥 BESTSELLER (Save 72%)',
      fasting: '10-12 Hours Fasting Required',
      tat: 'NABL Certified Report in 6 Hours'
    },
    {
      id: 'pkg-diabetes',
      name: isHindi ? 'डायबिटीज केयर व मॉनिटरिंग पैक' : 'Advanced Diabetes Care & Monitoring Pack',
      tests: ['HbA1c Glycated Hemoglobin', 'Fasting Plasma Glucose', 'Post-Prandial Blood Sugar', 'Urine Microalbumin / Creatinine Ratio'],
      mrp: 850,
      price: 249,
      badge: '🩺 ESSENTIAL',
      fasting: '8 Hours Fasting Required',
      tat: 'NABL Report in 4 Hours'
    },
    {
      id: 'pkg-vitamin',
      name: isHindi ? 'विटामिन डी3 व बी12 इम्यूनिटी कॉम्बो' : 'Vitamin D3 & B-12 Longevity & Immunity Combo',
      tests: ['Vitamin D-3 (25-OH Cholecalciferol)', 'Vitamin B-12 (Cyanocobalamin)', 'Serum Calcium', 'Total Iron Binding Capacity (TIBC)'],
      mrp: 1400,
      price: 399,
      badge: '⚡ POPULAR',
      fasting: 'No Fasting Required',
      tat: 'Same Day Digital Report'
    }
  ];

  const savings = medicineCart.brandTotal - medicineCart.genericTotal;
  const currentTotal = useGenericSubstitution ? medicineCart.genericTotal : medicineCart.brandTotal;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(5, 10, 20, 0.88)',
        backdropFilter: 'blur(10px)',
        zIndex: 250,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px'
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '540px',
          maxHeight: '92vh',
          backgroundColor: '#0F172A',
          border: '1.5px solid rgba(56, 189, 248, 0.25)',
          borderRadius: '24px',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.8)',
          overflow: 'hidden'
        }}
      >
        {/* Top Header */}
        <div
          style={{
            padding: '16px 20px',
            backgroundColor: '#1E293B',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '1.5rem' }}>
              {activeTab === 'MEDICINE' ? '💊' : activeTab === 'LAB_TEST' ? '🧪' : '🛡️'}
            </span>
            <div>
              <div style={{ fontSize: '1rem', fontWeight: 900, color: '#F8FAFC' }}>
                {activeTab === 'MEDICINE'
                  ? isHindi ? 'टाटा 1mg-स्टाइल 1-टैप दवा ऑर्डर' : 'Tata 1mg-Style 1-Tap Pharmacy Express'
                  : activeTab === 'LAB_TEST'
                  ? isHindi ? 'घर बैठे लैब टेस्ट बुकिंग (NABL मान्यता प्राप्त)' : 'Book Home Lab Tests (NABL Accredited)'
                  : isHindi ? 'आयुष्मान भारत डिजिटल हेल्थ कार्ड (ABDM)' : 'Official ABDM ABHA Digital Health Card'}
              </div>
              <div style={{ fontSize: '0.6875rem', color: '#38BDF8', fontWeight: 700 }}>
                {activeTab === 'MEDICINE'
                  ? isHindi ? '2 घंटे में फ्री होम डिलीवरी • पीएमबीजेपी जन औषधि बचत' : '2-Hour Home Delivery • 75% Jan Aushadhi Savings'
                  : activeTab === 'LAB_TEST'
                  ? isHindi ? 'प्रमाणित फ्लेबोटोमिस्ट द्वारा फ्री होम सैंपल कलेक्शन' : 'Free Home Sample Pickup • 100% Barcoded Safety'
                  : isHindi ? 'स्वास्थ्य मंत्रालय, भारत सरकार • 100% सुरक्षित PHR' : 'Ministry of Health & Family Welfare, Govt of India'}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              border: 'none',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              color: '#94A3B8',
              fontSize: '1.125rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            ✕
          </button>
        </div>

        {/* 3 Benchmark Tabs */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', backgroundColor: '#0B0F19', padding: '6px' }}>
          <button
            type="button"
            onClick={() => { setActiveTab('MEDICINE'); setOrderConfirmed(false); }}
            style={{
              padding: '10px 4px',
              borderRadius: '12px',
              border: 'none',
              backgroundColor: activeTab === 'MEDICINE' ? '#0284C7' : 'transparent',
              color: activeTab === 'MEDICINE' ? '#FFFFFF' : '#94A3B8',
              fontSize: '0.75rem',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '2px'
            }}
          >
            <span>💊 {isHindi ? 'दवा ऑर्डर' : 'Order Dawa'}</span>
            <span style={{ fontSize: '0.625rem', color: activeTab === 'MEDICINE' ? '#BAE6FD' : '#64748B' }}>
              {isHindi ? '2 घंटे डिलीवरी' : '2-Hr Delivery'}
            </span>
          </button>

          <button
            type="button"
            onClick={() => { setActiveTab('LAB_TEST'); setBookingConfirmed(false); }}
            style={{
              padding: '10px 4px',
              borderRadius: '12px',
              border: 'none',
              backgroundColor: activeTab === 'LAB_TEST' ? '#0284C7' : 'transparent',
              color: activeTab === 'LAB_TEST' ? '#FFFFFF' : '#94A3B8',
              fontSize: '0.75rem',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '2px'
            }}
          >
            <span>🧪 {isHindi ? 'घर पर टेस्ट' : 'Home Lab Tests'}</span>
            <span style={{ fontSize: '0.625rem', color: activeTab === 'LAB_TEST' ? '#BAE6FD' : '#64748B' }}>
              {isHindi ? 'फ्री सैंपल पिकअप' : 'Free Sample Pickup'}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('ABHA_CARD')}
            style={{
              padding: '10px 4px',
              borderRadius: '12px',
              border: 'none',
              backgroundColor: activeTab === 'ABHA_CARD' ? '#0284C7' : 'transparent',
              color: activeTab === 'ABHA_CARD' ? '#FFFFFF' : '#94A3B8',
              fontSize: '0.75rem',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '2px'
            }}
          >
            <span>🛡️ {isHindi ? 'आभा कार्ड' : 'ABHA Card'}</span>
            <span style={{ fontSize: '0.625rem', color: activeTab === 'ABHA_CARD' ? '#BAE6FD' : '#64748B' }}>
              {isHindi ? 'सरकारी हेल्थ ID' : 'Govt Health ID'}
            </span>
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          
          {/* TAB 1: MEDICINE ORDER WITH PRESCRIPTION & JAN AUSHADHI SUBSTITUTION */}
          {activeTab === 'MEDICINE' && (
            <>
              {orderConfirmed ? (
                <div style={{ padding: '30px 16px', textAlign: 'center' }}>
                  <div style={{ fontSize: '3rem', marginBottom: '8px' }}>🎉</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#34D399', marginBottom: '6px' }}>
                    {isHindi ? 'दवा ऑर्डर सफलतापूर्वक बुक हो गया!' : 'Medicine Order Placed Successfully!'}
                  </div>
                  <div style={{ fontSize: '0.8125rem', color: '#94A3B8', marginBottom: '16px' }}>
                    {isHindi
                      ? `ऑर्डर #ORD-MED-9281 • हमारे नजदीकी प्रमाणित केमिस्ट द्वारा तैयार किया जा रहा है। 2 घंटे में डिलीवरी।`
                      : `Order #ORD-MED-9281 • Partner Chemist is packing your verified medicines. Express 2-hour doorstep delivery.`}
                  </div>

                  <div style={{ backgroundColor: '#1E293B', borderRadius: '16px', padding: '14px', border: '1px solid rgba(255,255,255,0.1)', textAlign: 'left', marginBottom: '16px' }}>
                    <div style={{ fontSize: '0.75rem', color: '#38BDF8', fontWeight: 800, textTransform: 'uppercase', marginBottom: '6px' }}>
                      ⚡ {isHindi ? 'लाइव डिलीवरी ट्रैकर' : 'Live Order Journey'}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8125rem', color: '#F8FAFC', marginBottom: '4px' }}>
                      <span style={{ color: '#10B981' }}>✓</span> {isHindi ? 'पर्ची फार्मासिस्ट द्वारा जांची गई' : 'Prescription Verified by Registered Pharmacist'}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8125rem', color: '#F8FAFC', marginBottom: '4px' }}>
                      <span style={{ color: '#10B981' }}>✓</span> {isHindi ? 'जन औषधि बचत लागू: ₹630 बचाए' : 'Jan Aushadhi Substitution Applied: ₹630 Saved'}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8125rem', color: '#FBBF24' }}>
                      <span>●</span> {isHindi ? 'डिलीवरी पार्टनर को सौंपा जा रहा है' : 'Handing over to Fast Delivery Rider'}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setOrderConfirmed(false)}
                    style={{
                      backgroundColor: '#0284C7',
                      color: '#FFFFFF',
                      border: 'none',
                      padding: '10px 20px',
                      borderRadius: '12px',
                      fontWeight: 800,
                      cursor: 'pointer'
                    }}
                  >
                    {isHindi ? 'नया ऑर्डर करें' : 'Done'}
                  </button>
                </div>
              ) : (
                <>
                  {/* Prescription Source Selector */}
                  <div style={{ backgroundColor: '#1E293B', borderRadius: '14px', padding: '12px 14px', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', marginBottom: '8px' }}>
                      {isHindi ? '1. डॉक्टर की पर्ची चुनें' : '1. Select Prescription Source'}
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                      <button
                        type="button"
                        onClick={() => setSelectedParchiSource('RECENT_VISIT')}
                        style={{
                          padding: '8px 10px',
                          borderRadius: '10px',
                          border: selectedParchiSource === 'RECENT_VISIT' ? '2px solid #0284C7' : '1px solid rgba(255,255,255,0.1)',
                          backgroundColor: selectedParchiSource === 'RECENT_VISIT' ? 'rgba(2, 132, 199, 0.2)' : 'transparent',
                          color: '#F8FAFC',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          textAlign: 'left'
                        }}
                      >
                        📄 {isHindi ? 'ताज़ा ओपीडी पर्ची (Dr. Vikram)' : 'Recent Visit Rx (Dr. Vikram)'}
                      </button>

                      <button
                        type="button"
                        onClick={() => setSelectedParchiSource('UPLOAD_NEW')}
                        style={{
                          padding: '8px 10px',
                          borderRadius: '10px',
                          border: selectedParchiSource === 'UPLOAD_NEW' ? '2px solid #0284C7' : '1px solid rgba(255,255,255,0.1)',
                          backgroundColor: selectedParchiSource === 'UPLOAD_NEW' ? 'rgba(2, 132, 199, 0.2)' : 'transparent',
                          color: '#F8FAFC',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          textAlign: 'left'
                        }}
                      >
                        📷 {isHindi ? 'कागज़ पर्ची की फोटो खींचें' : 'Upload Rx Photo'}
                      </button>
                    </div>
                  </div>

                  {/* Jan Aushadhi Savings Gold Standard Banner (Tata 1mg / Vyapar Killer) */}
                  <div
                    onClick={() => setUseGenericSubstitution(!useGenericSubstitution)}
                    style={{
                      background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(5, 150, 105, 0.15) 100%)',
                      border: '1.5px solid #10B981',
                      borderRadius: '16px',
                      padding: '12px 14px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <input
                        type="checkbox"
                        checked={useGenericSubstitution}
                        onChange={(e) => setUseGenericSubstitution(e.target.checked)}
                        style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#10B981' }}
                      />
                      <div>
                        <div style={{ fontSize: '0.875rem', fontWeight: 900, color: '#34D399' }}>
                          💰 {isHindi ? 'पीएम जन औषधि जेनेरिक विकल्प (₹630 की बचत)' : 'PMBJP Jan Aushadhi Generic Swap (Save ₹630)'}
                        </div>
                        <div style={{ fontSize: '0.6875rem', color: '#A7F3D0' }}>
                          {isHindi
                            ? '100% समान सॉल्ट व बायो-इक्विवैलेंस, WHO-GMP प्रमाणित'
                            : '100% Identical Salt & Therapeutic Bio-equivalence • WHO-GMP Lab Tested'}
                        </div>
                      </div>
                    </div>

                    <span style={{ backgroundColor: '#10B981', color: '#070C16', padding: '4px 8px', borderRadius: '8px', fontSize: '0.6875rem', fontWeight: 900 }}>
                      75% OFF
                    </span>
                  </div>

                  {/* Prescription Medicines List */}
                  <div style={{ backgroundColor: '#1E293B', borderRadius: '14px', padding: '12px 14px', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase' }}>
                        {isHindi ? 'पर्ची में लिखी दवाएं (5 Items)' : 'Prescription Medicines (5 Items)'}
                      </span>
                      <span style={{ fontSize: '0.6875rem', color: '#38BDF8', fontWeight: 700 }}>
                        {useGenericSubstitution ? '🟢 Jan Aushadhi Swapped' : '⚪ Branded Medicines'}
                      </span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {medicineCart.items.map((med, idx) => (
                        <div
                          key={idx}
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '6px 0',
                            borderBottom: idx < medicineCart.items.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none'
                          }}
                        >
                          <div>
                            <div style={{ fontSize: '0.8125rem', fontWeight: 800, color: '#F8FAFC' }}>
                              {useGenericSubstitution ? med.genericName : med.brandName}
                            </div>
                            <div style={{ fontSize: '0.6875rem', color: '#94A3B8' }}>
                              {useGenericSubstitution ? `Branded equiv: ${med.brandName}` : 'Standard Brand'}
                            </div>
                          </div>

                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '0.875rem', fontWeight: 900, color: useGenericSubstitution ? '#34D399' : '#F8FAFC' }}>
                              ₹{useGenericSubstitution ? med.genericPrice : med.brandPrice}
                            </div>
                            {useGenericSubstitution && (
                              <div style={{ fontSize: '0.625rem', color: '#64748B', textDecoration: 'line-through' }}>
                                ₹{med.brandPrice}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Delivery Address */}
                  <div style={{ backgroundColor: '#1E293B', borderRadius: '14px', padding: '12px 14px', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', marginBottom: '6px' }}>
                      📍 {isHindi ? 'डिलीवरी का पता (2 घंटे एक्सप्रेस)' : 'Delivery Address (2-Hr Express)'}
                    </div>
                    <input
                      type="text"
                      value={deliveryAddress}
                      onChange={(e) => setDeliveryAddress(e.target.value)}
                      style={{
                        width: '100%',
                        backgroundColor: '#0B0F19',
                        border: '1px solid rgba(255,255,255,0.15)',
                        borderRadius: '8px',
                        padding: '8px 10px',
                        color: '#F8FAFC',
                        fontSize: '0.8125rem'
                      }}
                    />
                  </div>

                  {/* Pricing Total & Place Order Button */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '4px' }}>
                    <div>
                      <div style={{ fontSize: '0.6875rem', color: '#94A3B8' }}>{isHindi ? 'कुल राशि' : 'Total Amount'}</div>
                      <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#38BDF8', lineHeight: 1 }}>
                        ₹{currentTotal}
                      </div>
                      {useGenericSubstitution && (
                        <div style={{ fontSize: '0.6875rem', color: '#10B981', fontWeight: 800 }}>
                          {isHindi ? `₹${savings} की बचत!` : `You Save ₹${savings}!`}
                        </div>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => setOrderConfirmed(true)}
                      style={{
                        backgroundColor: '#0284C7',
                        color: '#FFFFFF',
                        border: 'none',
                        borderRadius: '14px',
                        padding: '12px 24px',
                        fontSize: '0.9375rem',
                        fontWeight: 900,
                        cursor: 'pointer',
                        boxShadow: '0 4px 14px rgba(2, 132, 199, 0.4)'
                      }}
                    >
                      {isHindi ? 'ऑर्डर कन्फर्म करें ➔' : 'Place Order ➔'}
                    </button>
                  </div>
                </>
              )}
            </>
          )}

          {/* TAB 2: BOOK HOME LAB TESTS (TATA 1MG / DR LAL / METROPOLIS STANDARD) */}
          {activeTab === 'LAB_TEST' && (
            <>
              {bookingConfirmed ? (
                <div style={{ padding: '30px 16px', textAlign: 'center' }}>
                  <div style={{ fontSize: '3rem', marginBottom: '8px' }}>🩺</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#34D399', marginBottom: '6px' }}>
                    {isHindi ? 'होम सैंपल कलेक्शन स्लॉट बुक हो गया!' : 'Home Phlebotomy Slot Confirmed!'}
                  </div>
                  <div style={{ fontSize: '0.8125rem', color: '#94A3B8', marginBottom: '16px' }}>
                    {isHindi
                      ? `स्लॉट: ${selectedSlot} • NABL प्रमाणित फ्लेबोटोमिस्ट टेम्परेचर-कंट्रोल्ड किट के साथ आपके घर पहुंचेंगे।`
                      : `Slot: ${selectedSlot} • Certified Phlebotomist dispatched with temperature-controlled cold-chain vacutainer kit.`}
                  </div>

                  <div style={{ backgroundColor: '#1E293B', borderRadius: '16px', padding: '14px', border: '1px solid rgba(255,255,255,0.1)', textAlign: 'left', marginBottom: '16px' }}>
                    <div style={{ fontSize: '0.75rem', color: '#38BDF8', fontWeight: 800, textTransform: 'uppercase', marginBottom: '6px' }}>
                      🛡️ NABL ISO 15189 {isHindi ? 'क्वालिटी गारंटी' : 'Quality Seal'}
                    </div>
                    <div style={{ fontSize: '0.8125rem', color: '#F8FAFC', marginBottom: '4px' }}>
                      • <strong>100% Barcoded Vacutainer Tubes</strong> (Pre-printed labels matched to your UHID)
                    </div>
                    <div style={{ fontSize: '0.8125rem', color: '#F8FAFC', marginBottom: '4px' }}>
                      • <strong>Cold Chain Sentinel</strong> (2°C - 8°C biological specimen preservation)
                    </div>
                    <div style={{ fontSize: '0.8125rem', color: '#F8FAFC' }}>
                      • <strong>6-Hour Turnaround Time</strong> (Direct WhatsApp & In-App Smart PDF with Delta Check)
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setBookingConfirmed(false)}
                    style={{
                      backgroundColor: '#0284C7',
                      color: '#FFFFFF',
                      border: 'none',
                      padding: '10px 20px',
                      borderRadius: '12px',
                      fontWeight: 800,
                      cursor: 'pointer'
                    }}
                  >
                    {isHindi ? 'पूरा हुआ' : 'Done'}
                  </button>
                </div>
              ) : (
                <>
                  <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase' }}>
                    {isHindi ? 'लोकप्रिय हेल्थ चेकअप पैकेज चुनें:' : 'Select Diagnostic Health Package:'}
                  </div>

                  {labPackages.map((pkg) => {
                    const isSelected = selectedPackageId === pkg.id;
                    return (
                      <div
                        key={pkg.id}
                        onClick={() => setSelectedPackageId(pkg.id)}
                        style={{
                          backgroundColor: isSelected ? 'rgba(2, 132, 199, 0.15)' : '#1E293B',
                          border: isSelected ? '2px solid #0284C7' : '1px solid rgba(255,255,255,0.08)',
                          borderRadius: '16px',
                          padding: '14px',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                          <div>
                            <span style={{ fontSize: '0.6875rem', fontWeight: 900, backgroundColor: 'rgba(245, 158, 11, 0.2)', color: '#FBBF24', padding: '2px 8px', borderRadius: '6px' }}>
                              {pkg.badge}
                            </span>
                            <div style={{ fontSize: '0.9375rem', fontWeight: 900, color: '#F8FAFC', marginTop: '4px' }}>
                              {pkg.name}
                            </div>
                          </div>

                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '1.125rem', fontWeight: 900, color: '#38BDF8' }}>
                              ₹{pkg.price}
                            </div>
                            <div style={{ fontSize: '0.6875rem', color: '#64748B', textDecoration: 'line-through' }}>
                              ₹{pkg.mrp}
                            </div>
                          </div>
                        </div>

                        <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginBottom: '8px' }}>
                          {pkg.tests.join(' • ')}
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.6875rem', color: '#34D399', fontWeight: 700 }}>
                          <span>⏱️ {pkg.tat}</span>
                          <span>🍽️ {pkg.fasting}</span>
                        </div>
                      </div>
                    );
                  })}

                  {/* Slot Selector */}
                  <div style={{ backgroundColor: '#1E293B', borderRadius: '14px', padding: '12px 14px', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', marginBottom: '6px' }}>
                      ⏰ {isHindi ? 'सैंपल पिकअप स्लॉट (फ्री होम विजिट)' : 'Sample Collection Slot (Free Home Visit)'}
                    </div>
                    <select
                      value={selectedSlot}
                      onChange={(e) => setSelectedSlot(e.target.value)}
                      style={{
                        width: '100%',
                        backgroundColor: '#0B0F19',
                        border: '1px solid rgba(255,255,255,0.15)',
                        borderRadius: '8px',
                        padding: '8px 10px',
                        color: '#F8FAFC',
                        fontSize: '0.8125rem'
                      }}
                    >
                      <option value="Tomorrow 07:00 AM - 08:00 AM (Fasting)">Tomorrow 07:00 AM - 08:00 AM (Fasting)</option>
                      <option value="Tomorrow 08:00 AM - 09:00 AM (Fasting)">Tomorrow 08:00 AM - 09:00 AM (Fasting)</option>
                      <option value="Tomorrow 09:00 AM - 10:00 AM (Fasting)">Tomorrow 09:00 AM - 10:00 AM (Fasting)</option>
                      <option value="Today Evening 05:00 PM - 06:00 PM (Non-Fasting)">Today Evening 05:00 PM - 06:00 PM (Non-Fasting)</option>
                    </select>
                  </div>

                  <button
                    type="button"
                    onClick={() => setBookingConfirmed(true)}
                    style={{
                      backgroundColor: '#0284C7',
                      color: '#FFFFFF',
                      border: 'none',
                      borderRadius: '14px',
                      padding: '12px',
                      fontSize: '0.9375rem',
                      fontWeight: 900,
                      cursor: 'pointer',
                      boxShadow: '0 4px 14px rgba(2, 132, 199, 0.4)'
                    }}
                  >
                    {isHindi ? 'फ्री होम कलेक्शन बुक करें ➔' : 'Book Free Home Collection ➔'}
                  </button>
                </>
              )}
            </>
          )}

          {/* TAB 3: OFFICIAL ABDM ABHA DIGITAL HEALTH CARD */}
          {activeTab === 'ABHA_CARD' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* National Health Authority Official Card Layout */}
              <div
                style={{
                  background: 'linear-gradient(135deg, #1E3A8A 0%, #0F172A 100%)',
                  borderRadius: '20px',
                  border: '1.5px solid rgba(56, 189, 248, 0.4)',
                  padding: '18px 20px',
                  boxShadow: '0 12px 30px rgba(2, 132, 199, 0.25)',
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                {/* Tricolor Header Bar */}
                <div style={{ display: 'flex', height: '4px', width: '100%', marginBottom: '14px', borderRadius: '2px', overflow: 'hidden' }}>
                  <div style={{ flex: 1, backgroundColor: '#FF9933' }} />
                  <div style={{ flex: 1, backgroundColor: '#FFFFFF' }} />
                  <div style={{ flex: 1, backgroundColor: '#138808' }} />
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                  <div>
                    <div style={{ fontSize: '0.6875rem', color: '#93C5FD', fontWeight: 800, letterSpacing: '0.05em' }}>
                      GOVERNMENT OF INDIA • NATIONAL HEALTH AUTHORITY
                    </div>
                    <div style={{ fontSize: '1rem', fontWeight: 900, color: '#FFFFFF', marginTop: '2px' }}>
                      Ayushman Bharat Health Account (ABHA)
                    </div>
                  </div>
                  <span style={{ fontSize: '1.5rem' }}>🛡️</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                  <div>
                    <div style={{ fontSize: '0.6875rem', color: '#94A3B8' }}>Patient Full Name</div>
                    <div style={{ fontSize: '1.125rem', fontWeight: 900, color: '#F8FAFC' }}>
                      {patient.fullName}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#93C5FD', fontFamily: 'monospace', marginTop: '4px' }}>
                      ABHA ID: 91-8472-9018-2831
                    </div>
                    <div style={{ fontSize: '0.6875rem', color: '#34D399', fontWeight: 700, marginTop: '2px' }}>
                      suresh.rao@abdm • {patient.gender} • Age: {patient.age}Y
                    </div>
                  </div>

                  {/* QR Code Placeholder */}
                  <div
                    style={{
                      width: '74px',
                      height: '74px',
                      backgroundColor: '#FFFFFF',
                      borderRadius: '10px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#0F172A',
                      fontSize: '0.625rem',
                      fontWeight: 900,
                      textAlign: 'center',
                      padding: '4px'
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '1.5rem' }}>📱</div>
                      ABDM QR
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '10px', fontSize: '0.6875rem', color: '#38BDF8' }}>
                  <span>✓ 100% Consent Controlled</span>
                  <span>M1, M2, M3 Compliant</span>
                </div>
              </div>

              {/* Linked Facilities & Records */}
              <div style={{ backgroundColor: '#1E293B', borderRadius: '14px', padding: '14px', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', marginBottom: '8px' }}>
                  {isHindi ? 'संबद्ध अस्पताल व डिजिटल रिकॉर्ड्स' : 'Linked Hospitals & PHR Records'}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8125rem' }}>
                    <span style={{ color: '#F8FAFC', fontWeight: 700 }}>AIIMS / City Polyclinic</span>
                    <span style={{ color: '#34D399', fontSize: '0.75rem', fontWeight: 800 }}>✓ 4 Records Linked</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8125rem' }}>
                    <span style={{ color: '#F8FAFC', fontWeight: 700 }}>Metropolis Pathology Centre</span>
                    <span style={{ color: '#34D399', fontSize: '0.75rem', fontWeight: 800 }}>✓ 2 Lab Reports Linked</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8125rem' }}>
                    <span style={{ color: '#F8FAFC', fontWeight: 700 }}>MedPlus Retail Pharmacy</span>
                    <span style={{ color: '#34D399', fontSize: '0.75rem', fontWeight: 800 }}>✓ 3 Invoices Linked</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => alert('Official ABDM ABHA Card downloaded to storage.')}
                  style={{
                    backgroundColor: '#1E293B',
                    border: '1px solid rgba(255,255,255,0.15)',
                    color: '#F8FAFC',
                    padding: '10px',
                    borderRadius: '12px',
                    fontSize: '0.8125rem',
                    fontWeight: 800,
                    cursor: 'pointer'
                  }}
                >
                  📥 Download Card PDF
                </button>

                <button
                  type="button"
                  onClick={() => alert('Consent manager permissions updated.')}
                  style={{
                    backgroundColor: '#0284C7',
                    border: 'none',
                    color: '#FFFFFF',
                    padding: '10px',
                    borderRadius: '12px',
                    fontSize: '0.8125rem',
                    fontWeight: 800,
                    cursor: 'pointer'
                  }}
                >
                  ⚙️ Manage Consent
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
