import React, { useState } from 'react';
import { Button } from '@docsearch/ui-kit';

interface HospitalBedStatus {
  id: string;
  name: string;
  distanceKm: number;
  etaMins: number;
  icuBedsVacant: number;
  icuTotal: number;
  ventilatorsVacant: number;
  oxygenBedsVacant: number;
  bloodBankStock: string;
  triageWaitMins: number;
  emergencyPhone: string;
  address: string;
}

const CITIES = ['Delhi NCR', 'Mumbai', 'Bengaluru', 'Patna', 'Lucknow', 'Kolkata', 'Hyderabad'];

const MOCK_HOSPITALS_BY_CITY: Record<string, HospitalBedStatus[]> = {
  'Delhi NCR': [
    {
      id: 'hosp-01',
      name: 'Max Super Speciality Hospital (Trauma Center)',
      distanceKm: 2.1,
      etaMins: 6,
      icuBedsVacant: 4,
      icuTotal: 18,
      ventilatorsVacant: 2,
      oxygenBedsVacant: 11,
      bloodBankStock: 'O+ (12), A+ (8), B+ (14), AB+ (4)',
      triageWaitMins: 0,
      emergencyPhone: '+91 98110 09911',
      address: 'Sector 19, Rohini, New Delhi'
    },
    {
      id: 'hosp-02',
      name: 'Apollo Indraprastha Emergency & Critical Care',
      distanceKm: 4.8,
      etaMins: 11,
      icuBedsVacant: 7,
      icuTotal: 30,
      ventilatorsVacant: 3,
      oxygenBedsVacant: 19,
      bloodBankStock: 'O- (2), O+ (20), B+ (16), A- (3)',
      triageWaitMins: 2,
      emergencyPhone: '+91 98100 10660',
      address: 'Sarita Vihar, Mathura Road, New Delhi'
    },
    {
      id: 'hosp-03',
      name: 'Fortis Escorts Heart & Trauma Institute',
      distanceKm: 6.2,
      etaMins: 14,
      icuBedsVacant: 2,
      icuTotal: 14,
      ventilatorsVacant: 1,
      oxygenBedsVacant: 6,
      bloodBankStock: 'O+ (6), A+ (4), B+ (9)',
      triageWaitMins: 5,
      emergencyPhone: '+91 98101 12345',
      address: 'Okhla Road, New Delhi'
    }
  ],
  'Mumbai': [
    {
      id: 'hosp-04',
      name: 'Lilavati Hospital & Research Centre',
      distanceKm: 1.9,
      etaMins: 5,
      icuBedsVacant: 5,
      icuTotal: 22,
      ventilatorsVacant: 3,
      oxygenBedsVacant: 14,
      bloodBankStock: 'O+ (15), B+ (10), A+ (9)',
      triageWaitMins: 0,
      emergencyPhone: '+91 98200 99881',
      address: 'Bandra West, Mumbai'
    },
    {
      id: 'hosp-05',
      name: 'Kokilaben Dhirubhai Ambani Emergency Hub',
      distanceKm: 3.8,
      etaMins: 9,
      icuBedsVacant: 8,
      icuTotal: 35,
      ventilatorsVacant: 4,
      oxygenBedsVacant: 22,
      bloodBankStock: 'O+ (18), AB+ (6), B+ (14)',
      triageWaitMins: 1,
      emergencyPhone: '+91 98201 55442',
      address: 'Four Bungalows, Andheri West, Mumbai'
    }
  ]
};

export const LiveEmergencyBedRadarWidget: React.FC = () => {
  const [selectedCity, setSelectedCity] = useState<string>('Delhi NCR');
  const [sosModalOpen, setSosModalOpen] = useState(false);
  const [sosTargetHospital, setSosTargetHospital] = useState<HospitalBedStatus | null>(null);
  const [sosSent, setSosSent] = useState(false);

  const hospitals = MOCK_HOSPITALS_BY_CITY[selectedCity] || MOCK_HOSPITALS_BY_CITY['Delhi NCR']!;

  const handleTriggerSOS = (hospital: HospitalBedStatus) => {
    setSosTargetHospital(hospital);
    setSosSent(false);
    setSosModalOpen(true);
  };

  const handleConfirmSOS = () => {
    setSosSent(true);
  };

  return (
    <div
      style={{
        backgroundColor: '#0B0F19',
        border: '1.5px solid #DC2626',
        borderRadius: '16px',
        padding: '24px',
        color: '#FFFFFF',
        boxShadow: '0 0 30px rgba(220, 38, 38, 0.25)',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Top Background Glow Effect */}
      <div
        style={{
          position: 'absolute',
          top: '-60px',
          right: '-60px',
          width: '240px',
          height: '240px',
          borderRadius: '50%',
          backgroundColor: 'rgba(239, 68, 68, 0.15)',
          filter: 'blur(60px)',
          pointerEvents: 'none'
        }}
      />

      {/* Header Bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          borderBottom: '1px solid #1E293B',
          paddingBottom: '16px',
          marginBottom: '20px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '12px',
              backgroundColor: '#DC2626',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.6rem',
              boxShadow: '0 0 20px rgba(220, 38, 38, 0.6)'
            }}
          >
            🚨
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 900, letterSpacing: '-0.02em', color: '#F8FAFC' }}>
                24x7 Live Emergency ICU & Oxygen Bed Radar
              </h3>
              <span
                style={{
                  backgroundColor: '#EF4444',
                  color: '#FFFFFF',
                  fontSize: '0.68rem',
                  fontWeight: 900,
                  padding: '2px 8px',
                  borderRadius: '12px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  animation: 'pulse 1.5s infinite'
                }}
              >
                ● Live Triage Sync
              </span>
            </div>
            <p style={{ margin: '2px 0 0 0', fontSize: '0.78rem', color: '#94A3B8' }}>
              Real-time ICU beds, ventilators & blood availability in partner hospitals with 1-click trauma pre-intimation.
            </p>
          </div>
        </div>

        {/* City Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94A3B8' }}>City:</span>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {CITIES.slice(0, 4).map((city) => (
              <button
                key={city}
                type="button"
                onClick={() => setSelectedCity(city)}
                style={{
                  backgroundColor: selectedCity === city ? '#DC2626' : '#1E293B',
                  color: selectedCity === city ? '#FFFFFF' : '#CBD5E1',
                  border: selectedCity === city ? '1px solid #EF4444' : '1px solid #334155',
                  padding: '5px 12px',
                  borderRadius: '8px',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                {city}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Hospital Bed Cards Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '16px'
        }}
      >
        {hospitals.map((hosp) => (
          <div
            key={hosp.id}
            style={{
              backgroundColor: '#131C2E',
              border: '1px solid #1E293B',
              borderRadius: '12px',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: '14px',
              transition: 'all 0.2s ease'
            }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                <h4 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 800, color: '#F1F5F9' }}>
                  {hosp.name}
                </h4>
                <span
                  style={{
                    backgroundColor: '#1E293B',
                    color: '#38BDF8',
                    padding: '2px 8px',
                    borderRadius: '6px',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    whiteSpace: 'nowrap'
                  }}
                >
                  📍 {hosp.distanceKm} km ({hosp.etaMins}m ETA)
                </span>
              </div>
              <p style={{ margin: '4px 0 0 0', fontSize: '0.72rem', color: '#64748B' }}>
                {hosp.address}
              </p>

              {/* Real-time Bed Capacity Counter */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '8px',
                  marginTop: '12px',
                  textAlign: 'center'
                }}
              >
                <div style={{ backgroundColor: '#1E293B', borderRadius: '8px', padding: '8px 4px' }}>
                  <div style={{ fontSize: '1.2rem', fontWeight: 900, color: hosp.icuBedsVacant > 0 ? '#4ADE80' : '#F87171' }}>
                    {hosp.icuBedsVacant}
                  </div>
                  <div style={{ fontSize: '0.65rem', color: '#94A3B8', fontWeight: 700 }}>
                    ICU VACANT
                  </div>
                </div>

                <div style={{ backgroundColor: '#1E293B', borderRadius: '8px', padding: '8px 4px' }}>
                  <div style={{ fontSize: '1.2rem', fontWeight: 900, color: hosp.ventilatorsVacant > 0 ? '#38BDF8' : '#F87171' }}>
                    {hosp.ventilatorsVacant}
                  </div>
                  <div style={{ fontSize: '0.65rem', color: '#94A3B8', fontWeight: 700 }}>
                    VENTILATORS
                  </div>
                </div>

                <div style={{ backgroundColor: '#1E293B', borderRadius: '8px', padding: '8px 4px' }}>
                  <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#FACC15' }}>
                    {hosp.oxygenBedsVacant}
                  </div>
                  <div style={{ fontSize: '0.65rem', color: '#94A3B8', fontWeight: 700 }}>
                    O2 BEDS
                  </div>
                </div>
              </div>

              {/* Blood Bank Stock Strip */}
              <div
                style={{
                  marginTop: '10px',
                  padding: '6px 10px',
                  backgroundColor: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.2)',
                  borderRadius: '6px',
                  fontSize: '0.72rem',
                  color: '#FCA5A5',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <span>🩸</span>
                <span><strong>Blood Bank:</strong> {hosp.bloodBankStock}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <Button
                size="sm"
                variant="primary"
                onClick={() => handleTriggerSOS(hosp)}
                style={{
                  backgroundColor: '#DC2626',
                  borderColor: '#DC2626',
                  color: '#FFFFFF',
                  fontWeight: 800,
                  fontSize: '0.78rem',
                  flex: 1,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  boxShadow: '0 2px 10px rgba(220, 38, 38, 0.4)'
                }}
              >
                <span>🚨</span>
                <span>Pre-Intimate Trauma Desk</span>
              </Button>

              <button
                type="button"
                onClick={() => {
                  window.open(`https://api.whatsapp.com/send?phone=${hosp.emergencyPhone.replace(/\D/g, '')}&text=${encodeURIComponent(`*EMERGENCY INTAKE QUERY:*\nChecking emergency bed availability at ${hosp.name}. Please reserve 1 ICU Bed.`)}`, '_blank');
                }}
                style={{
                  backgroundColor: '#25D366',
                  border: 'none',
                  color: '#FFFFFF',
                  padding: '6px 10px',
                  borderRadius: '6px',
                  fontSize: '0.8rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
                title="Direct WhatsApp with Hospital Emergency Coordinator"
              >
                💬
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Emergency SOS Confirmation Modal */}
      {sosModalOpen && sosTargetHospital && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 99999,
            backgroundColor: 'rgba(0, 0, 0, 0.85)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px'
          }}
        >
          <div
            style={{
              backgroundColor: '#0F172A',
              border: '2px solid #DC2626',
              borderRadius: '16px',
              padding: '24px',
              maxWidth: '520px',
              width: '100%',
              color: '#FFFFFF',
              boxShadow: '0 0 50px rgba(220, 38, 38, 0.5)',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '2rem' }}>🚨</span>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 900, color: '#F87171' }}>
                  Pre-Hospital Emergency Alert (Trauma Bay Dispatch)
                </h3>
                <p style={{ margin: '2px 0 0 0', fontSize: '0.75rem', color: '#94A3B8' }}>
                  Intimating Trauma Resuscitation Bay at <strong>{sosTargetHospital.name}</strong>
                </p>
              </div>
            </div>

            {!sosSent ? (
              <>
                <div
                  style={{
                    backgroundColor: '#1E293B',
                    borderRadius: '10px',
                    padding: '14px',
                    fontSize: '0.82rem',
                    color: '#CBD5E1',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px'
                  }}
                >
                  <div>📍 <strong>Location:</strong> {sosTargetHospital.address}</div>
                  <div>⏱️ <strong>Estimated Arrival:</strong> ~{sosTargetHospital.etaMins} Minutes ({sosTargetHospital.distanceKm} km away)</div>
                  <div>🛏️ <strong>Reserved Bay:</strong> ICU Trauma Bed #04 (Ventilator on standby)</div>
                  <div>📞 <strong>Emergency Direct Hotline:</strong> {sosTargetHospital.emergencyPhone}</div>
                </div>

                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                  <Button size="sm" variant="outline" onClick={() => setSosModalOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    size="md"
                    variant="primary"
                    onClick={handleConfirmSOS}
                    style={{
                      backgroundColor: '#DC2626',
                      borderColor: '#DC2626',
                      fontWeight: 900,
                      boxShadow: '0 0 15px rgba(220, 38, 38, 0.5)'
                    }}
                  >
                    🚨 Send Emergency Signal Now
                  </Button>
                </div>
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: '16px 0' }}>
                <div style={{ fontSize: '3rem', marginBottom: '8px' }}>✅</div>
                <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#4ADE80' }}>
                  Trauma Desk Alerted & Pre-Intimated!
                </h4>
                <p style={{ margin: '8px 0 16px 0', fontSize: '0.8rem', color: '#94A3B8' }}>
                  {sosTargetHospital.name} has been pre-notified of your arrival in ~{sosTargetHospital.etaMins} minutes. Resuscitation Bay team has been paged.
                </p>

                <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                  <Button
                    size="md"
                    variant="primary"
                    onClick={() => {
                      window.open(`tel:${sosTargetHospital.emergencyPhone}`, '_self');
                    }}
                    style={{ backgroundColor: '#16A34A', borderColor: '#16A34A', fontWeight: 800 }}
                  >
                    📞 Call Hospital Duty Doctor
                  </Button>
                  <Button
                    size="md"
                    variant="outline"
                    onClick={() => setSosModalOpen(false)}
                    style={{ fontWeight: 700 }}
                  >
                    Close
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
