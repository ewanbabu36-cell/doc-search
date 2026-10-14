import React, { useState } from 'react';
import { type Language } from '../i18n.js';
import { type PatientProfile, patientApiService } from '../services/patient-api.js';

interface Props {
  language: Language;
  patient: PatientProfile;
  isOpen: boolean;
  onClose: () => void;
  onPlanActivated: (updated: PatientProfile) => void;
}

interface PlanTier {
  id: string;
  nameHi: string;
  nameEn: string;
  pricePerYear: number;
  monthlyEquivalent: number;
  popular?: boolean;
  featuresHi: string[];
  featuresEn: string[];
  color: string;
  accentBg: string;
}

const PLANS: PlanTier[] = [
  {
    id: 'silver',
    nameHi: 'सिल्वर इंडिविजुअल पास',
    nameEn: 'Silver Individual Pass',
    pricePerYear: 499,
    monthlyEquivalent: 41,
    color: '#94A3B8',
    accentBg: 'rgba(148, 163, 184, 0.12)',
    featuresHi: [
      '2 फ्री ऑनलाइन वीडियो कंसल्टेशन',
      'दवाइयों पर 10% की सीधी छूट',
      'फ्री ब्लड प्रेशर एवं शुगर जाँच',
      'डिजिटल पर्ची लाइफटाइम क्लाउड लॉकर'
    ],
    featuresEn: [
      '2 Free Teleconsultations/year',
      'Flat 10% Discount on all medicines',
      'Free OPD BP & Sugar Checkup',
      'Lifetime Digital Health Locker'
    ]
  },
  {
    id: 'gold',
    nameHi: 'गोल्ड फैमिली शील्ड (4 सदस्य)',
    nameEn: 'Gold Family Health Shield (4 Members)',
    pricePerYear: 1499,
    monthlyEquivalent: 125,
    popular: true,
    color: '#F59E0B',
    accentBg: 'rgba(245, 158, 11, 0.15)',
    featuresHi: [
      'असीमित 24x7 फ्री डॉक्टर वीडियो कंसल्टेशन (पूरे परिवार हेतु)',
      'दवाइयों पर 15% की छूट + 1-घंटे में होम डिलीवरी',
      'अस्पताल ओपीडी रजिस्ट्रेशन पर्ची शुल्क पूर्णतया ₹0',
      'घर से फ्री लैब सैंपल कलेक्शन (शून्य विज़िट चार्ज)',
      'ओपीडी में प्रायोरिटी फास्ट-ट्रैक टोकन लाइन'
    ],
    featuresEn: [
      'Unlimited 24x7 Video Consultations for up to 4 members',
      'Flat 15% off on Pharmacy + 1-Hour Home Delivery',
      'Zero OPD Registration Charges forever',
      'Free Home Blood Sample Collection',
      'Priority Fast-Track Token Queue at Hospital'
    ]
  },
  {
    id: 'platinum',
    nameHi: 'प्लैटिनम सीनियर सिटीज़न केयर',
    nameEn: 'Platinum Senior & Chronic Care Pass',
    pricePerYear: 2499,
    monthlyEquivalent: 208,
    color: '#818CF8',
    accentBg: 'rgba(129, 140, 248, 0.15)',
    featuresHi: [
      'गोल्ड के सभी फायदे + 2 सीनियर माता-पिता हेतु विशेष केयर',
      'साल में 2 बार डॉक्टर/नर्स का फ्री होम विज़िट',
      'दवाइयों पर 20% की अधिकतम छूट',
      'हर 3 महीने में फ्री HbA1c व लिपिड प्रोफाइल टेस्ट',
      'समर्पित व्हाट्सएप पर्सनल केयर मैनेजर'
    ],
    featuresEn: [
      'All Gold Benefits + Dedicated Elderly Care for 2 Seniors',
      '2 Free Home Doctor/Nurse Visits per year',
      'Flat 20% off on Chronic Care Pharmacy',
      'Quarterly Free HbA1c & Lipid Profile Labs',
      'Dedicated WhatsApp Personal Care Manager'
    ]
  }
];

export const DocSearchPlusSubscriptionModal: React.FC<Props> = ({
  language,
  patient,
  isOpen,
  onClose,
  onPlanActivated
}) => {
  const [selectedPlanId, setSelectedPlanId] = useState('gold');
  const [isProcessing, setIsProcessing] = useState(false);
  const [activatedSuccess, setActivatedSuccess] = useState(false);

  if (!isOpen) return null;

  const currentPlan = PLANS.find((p) => p.id === selectedPlanId) || PLANS[1]!;

  const handleActivate = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setActivatedSuccess(true);
      const updated: PatientProfile = {
        ...patient,
        bloodGroup: patient.bloodGroup || 'B+'
      };
      patientApiService.setPatient(updated);
      onPlanActivated(updated);
      setTimeout(() => {
        setActivatedSuccess(false);
        onClose();
      }, 2000);
    }, 1200);
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(5, 10, 24, 0.9)',
        backdropFilter: 'blur(10px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px'
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '520px',
          maxHeight: '92vh',
          backgroundColor: '#0F172A',
          borderRadius: '24px',
          border: '1px solid rgba(245, 158, 11, 0.4)',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.9), 0 0 40px rgba(245, 158, 11, 0.15)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            background: 'linear-gradient(135deg, rgba(30, 27, 75, 0.9), rgba(15, 23, 42, 0.95))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '1.75rem' }}>💎</span>
            <div>
              <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#FCD34D' }}>
                DocSearch Plus™
              </div>
              <div style={{ fontSize: '0.75rem', color: '#CBD5E1' }}>
                {language === 'hi' ? 'परिवार स्वास्थ्य सुरक्षा सदस्यता (Better than Practo Plus)' : 'Family Healthcare Pass (100% Zero-Downtime)'}
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
              cursor: 'pointer'
            }}
          >
            ✕
          </button>
        </div>

        {/* Content Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Estimated Annual Savings Banner */}
          <div
            style={{
              backgroundColor: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid #10B981',
              borderRadius: '12px',
              padding: '10px 14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '0.8rem',
              color: '#A7F3D0'
            }}
          >
            <span>💰 {language === 'hi' ? 'औसत परिवार की वार्षिक बचत:' : 'Average Family Annual Savings:'}</span>
            <span style={{ fontWeight: 900, color: '#34D399', fontSize: '0.95rem' }}>₹8,400+ / Year</span>
          </div>

          {/* Plan Selector Radio Cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {PLANS.map((plan) => {
              const isSelected = selectedPlanId === plan.id;
              return (
                <div
                  key={plan.id}
                  onClick={() => setSelectedPlanId(plan.id)}
                  style={{
                    backgroundColor: isSelected ? plan.accentBg : '#1E293B',
                    border: `1.5px solid ${isSelected ? plan.color : 'rgba(255, 255, 255, 0.08)'}`,
                    borderRadius: '16px',
                    padding: '14px 16px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    position: 'relative'
                  }}
                >
                  {plan.popular && (
                    <div
                      style={{
                        position: 'absolute',
                        top: '-9px',
                        right: '16px',
                        backgroundColor: '#F59E0B',
                        color: '#070B14',
                        fontSize: '0.625rem',
                        fontWeight: 900,
                        padding: '2px 8px',
                        borderRadius: '8px',
                        letterSpacing: '0.04em'
                      }}
                    >
                      ★ MOST POPULAR
                    </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div
                        style={{
                          width: '18px',
                          height: '18px',
                          borderRadius: '50%',
                          border: `2px solid ${isSelected ? plan.color : '#64748B'}`,
                          backgroundColor: isSelected ? plan.color : 'transparent',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        {isSelected && <span style={{ color: '#070B14', fontSize: '0.65rem', fontWeight: 900 }}>✓</span>}
                      </div>

                      <div>
                        <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#F8FAFC' }}>
                          {language === 'hi' ? plan.nameHi : plan.nameEn}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: '#94A3B8' }}>
                          ₹{plan.monthlyEquivalent}/month ({language === 'hi' ? 'सालाना बिल' : 'Billed Annually'})
                        </div>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '1.25rem', fontWeight: 900, color: plan.color }}>
                        ₹{plan.pricePerYear}
                      </div>
                      <div style={{ fontSize: '0.65rem', color: '#64748B' }}>/ year</div>
                    </div>
                  </div>

                  {/* Features list if selected */}
                  {isSelected && (
                    <div style={{ marginTop: '12px', borderTop: '1px solid rgba(255, 255, 255, 0.1)', paddingTop: '10px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {(language === 'hi' ? plan.featuresHi : plan.featuresEn).map((feat, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem', color: '#E2E8F0' }}>
                          <span style={{ color: '#34D399', fontWeight: 900 }}>✓</span>
                          <span>{feat}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Member Linked Info */}
          <div style={{ backgroundColor: '#1E293B', borderRadius: '12px', padding: '10px 14px', fontSize: '0.75rem', color: '#94A3B8' }}>
            👤 {language === 'hi' ? 'सदस्यता प्राथमिक खाता:' : 'Primary Member Account:'}{' '}
            <strong style={{ color: '#F8FAFC' }}>{patient.fullName}</strong> ({patient.uhid})
          </div>

          {activatedSuccess && (
            <div
              style={{
                backgroundColor: 'rgba(16, 185, 129, 0.25)',
                border: '1px solid #10B981',
                borderRadius: '12px',
                padding: '12px',
                color: '#34D399',
                fontSize: '0.875rem',
                fontWeight: 800,
                textAlign: 'center'
              }}
            >
              🎉 {currentPlan.nameEn} Activated Successfully! Welcome to DocSearch Plus.
            </div>
          )}
        </div>

        {/* Footer CTA */}
        <div
          style={{
            padding: '16px 20px',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            backgroundColor: '#0F172A',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px'
          }}
        >
          <div>
            <div style={{ fontSize: '0.7rem', color: '#94A3B8' }}>Total Payable Today:</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 900, color: currentPlan.color }}>
              ₹{currentPlan.pricePerYear}
            </div>
          </div>

          <button
            type="button"
            disabled={isProcessing || activatedSuccess}
            onClick={handleActivate}
            style={{
              flex: 1,
              maxWidth: '260px',
              backgroundColor: '#F59E0B',
              color: '#070B14',
              border: 'none',
              borderRadius: '12px',
              padding: '12px',
              fontSize: '0.875rem',
              fontWeight: 900,
              cursor: isProcessing ? 'wait' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              boxShadow: '0 4px 15px rgba(245, 158, 11, 0.4)'
            }}
          >
            <span>{isProcessing ? '⚡ Verifying UPI AutoPay...' : '🚀 1-Click Activate Pass'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
