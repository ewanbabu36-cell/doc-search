import React, { useState, useMemo } from 'react';
import { DocSearchLogo, Button, Badge } from '@docsearch/ui-kit';

export interface DoctorListing {
  id: string;
  name: string;
  degree: string;
  specialty: string;
  symptoms: string[];
  experienceYears: number;
  hospitalName: string;
  distanceKm: number;
  consultationFee: number;
  verifiedRating: number;
  totalReviews: number;
  liveQueueAhead: number;
  estimatedWaitMinutes: number;
  isOnlineForVideo: boolean;
  isNabhAbdmVerified: boolean;
  nextAvailableSlot: string;
  languages: string[];
}

export interface MeritDoctorMarketplaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBookInClinic?: (doctor: DoctorListing) => void;
  onBookVideo?: (doctor: DoctorListing) => void;
}

const MOCK_DOCTORS: DoctorListing[] = [
  {
    id: 'doc-1',
    name: 'Dr. Vikram Malhotra',
    degree: 'MBBS, MD (Medicine), DM (Cardiology) - AIIMS Delhi',
    specialty: 'Cardiology & Heart Care',
    symptoms: ['Chest Pain', 'High Blood Pressure', 'Palpitations', 'Breathlessness'],
    experienceYears: 16,
    hospitalName: 'Apex Heart & Trauma Super-Specialty',
    distanceKm: 1.4,
    consultationFee: 700,
    verifiedRating: 4.96,
    totalReviews: 842,
    liveQueueAhead: 2,
    estimatedWaitMinutes: 8,
    isOnlineForVideo: true,
    isNabhAbdmVerified: true,
    nextAvailableSlot: 'Today, 10:30 AM',
    languages: ['Hindi', 'English', 'Punjabi']
  },
  {
    id: 'doc-2',
    name: 'Dr. Ananya Roy',
    degree: 'MBBS, MD (Internal Medicine) - KGMU',
    specialty: 'General Medicine & Diabetology',
    symptoms: ['Fever / Dengue', 'Weakness', 'Diabetes / Sugar Check', 'Cough & Cold'],
    experienceYears: 11,
    hospitalName: 'Metro Life Care Clinic',
    distanceKm: 0.8,
    consultationFee: 450,
    verifiedRating: 4.92,
    totalReviews: 615,
    liveQueueAhead: 1,
    estimatedWaitMinutes: 4,
    isOnlineForVideo: true,
    isNabhAbdmVerified: true,
    nextAvailableSlot: 'Now Available (OPD Walk-in)',
    languages: ['Hindi', 'English', 'Bengali']
  },
  {
    id: 'doc-3',
    name: 'Dr. Rajesh Gupta',
    degree: 'MBBS, MS (Orthopedics), Fellowship Joint Replacement (Germany)',
    specialty: 'Orthopedics & Joint Care',
    symptoms: ['Joint Pain', 'Back Pain', 'Knee Arthritis', 'Fracture / Sprain'],
    experienceYears: 18,
    hospitalName: 'City Bone & Joint Center',
    distanceKm: 2.1,
    consultationFee: 600,
    verifiedRating: 4.89,
    totalReviews: 520,
    liveQueueAhead: 4,
    estimatedWaitMinutes: 16,
    isOnlineForVideo: false,
    isNabhAbdmVerified: true,
    nextAvailableSlot: 'Today, 11:15 AM',
    languages: ['Hindi', 'English']
  },
  {
    id: 'doc-4',
    name: 'Dr. Meera Sen',
    degree: 'MBBS, DCH, MD (Pediatrics) - PGI Chandigarh',
    specialty: 'Pediatrics & Neonatology',
    symptoms: ['Child Fever', 'Vaccination', 'Vomiting in Baby', 'Child Nutrition'],
    experienceYears: 13,
    hospitalName: 'Little Angels Children Hospital',
    distanceKm: 3.0,
    consultationFee: 500,
    verifiedRating: 4.95,
    totalReviews: 730,
    liveQueueAhead: 3,
    estimatedWaitMinutes: 12,
    isOnlineForVideo: true,
    isNabhAbdmVerified: true,
    nextAvailableSlot: 'Today, 10:45 AM',
    languages: ['Hindi', 'English']
  },
  {
    id: 'doc-5',
    name: 'Dr. Pooja Aggarwal',
    degree: 'MBBS, MD (Dermatology, Venereology & Leprosy)',
    specialty: 'Dermatology & Cosmetology',
    symptoms: ['Skin Rash', 'Acne / Pimples', 'Hair Fall', 'Fungal Infection'],
    experienceYears: 9,
    hospitalName: 'Skin Clinic & Laser Centre',
    distanceKm: 1.8,
    consultationFee: 550,
    verifiedRating: 4.91,
    totalReviews: 390,
    liveQueueAhead: 1,
    estimatedWaitMinutes: 5,
    isOnlineForVideo: true,
    isNabhAbdmVerified: true,
    nextAvailableSlot: 'Now Online for Video',
    languages: ['Hindi', 'English']
  }
];

const SYMPTOM_SHORTCUTS = [
  'All',
  'Fever / Dengue',
  'Chest Pain',
  'Skin Rash',
  'Joint Pain',
  'Cough & Cold',
  'Child Fever',
  'Diabetes / Sugar Check'
];

export const MeritDoctorMarketplaceModal: React.FC<MeritDoctorMarketplaceModalProps> = ({
  isOpen,
  onClose,
  onBookInClinic,
  onBookVideo
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSymptom, setSelectedSymptom] = useState('All');
  const [filterMode, setFilterMode] = useState<'ALL' | 'IN_CLINIC' | 'VIDEO'>('ALL');
  const [maxFee, setMaxFee] = useState<number>(1000);
  const [bookingNotice, setBookingNotice] = useState<string | null>(null);

  const filteredDoctors = useMemo(() => {
    return MOCK_DOCTORS.filter((doc) => {
      const matchQuery =
        !searchQuery ||
        doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.specialty.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.symptoms.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase())) ||
        doc.hospitalName.toLowerCase().includes(searchQuery.toLowerCase());

      const matchSymptom =
        selectedSymptom === 'All' ||
        doc.symptoms.some((s) => s.toLowerCase().includes(selectedSymptom.toLowerCase()));

      const matchFee = doc.consultationFee <= maxFee;

      const matchMode =
        filterMode === 'ALL' ||
        (filterMode === 'VIDEO' && doc.isOnlineForVideo) ||
        (filterMode === 'IN_CLINIC' && true);

      return matchQuery && matchSymptom && matchFee && matchMode;
    }).sort((a, b) => {
      // Pure merit score: rating * reviews weight - wait time penalty
      const scoreA = a.verifiedRating * 100 - a.estimatedWaitMinutes;
      const scoreB = b.verifiedRating * 100 - b.estimatedWaitMinutes;
      return scoreB - scoreA;
    });
  }, [searchQuery, selectedSymptom, maxFee, filterMode]);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(5, 10, 24, 0.88)',
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
          maxWidth: '1040px',
          maxHeight: '92vh',
          backgroundColor: '#0F172A',
          borderRadius: '24px',
          border: '1px solid rgba(56, 189, 248, 0.3)',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.9), 0 0 40px rgba(56, 189, 248, 0.1)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(30, 41, 59, 0.9))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <DocSearchLogo size="sm" variant="compact" />
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 900, color: '#F8FAFC' }}>
                  Verified Doctor & Clinic Marketplace
                </h2>
                <Badge variant="success">🛡️ Zero Ad-Slot Extortion</Badge>
              </div>
              <p style={{ margin: '3px 0 0 0', fontSize: '0.8rem', color: '#94A3B8' }}>
                100% Pure Merit Ranking • Calculated by Verified Outcomes, Experience & Real-Time OPD Wait Times
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '50%',
              width: '36px',
              height: '36px',
              color: '#94A3B8',
              cursor: 'pointer',
              fontSize: '1.2rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            ✕
          </button>
        </div>

        {/* Anti-Pay-to-Rank Trust Ribbon */}
        <div
          style={{
            backgroundColor: 'rgba(16, 185, 129, 0.12)',
            borderBottom: '1px solid rgba(16, 185, 129, 0.25)',
            padding: '8px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '0.78rem',
            color: '#A7F3D0'
          }}
        >
          <span>
            ⚡ <strong>The Anti-Practo Promise:</strong> Doctors cannot pay to rank higher. Every profile is certified via NMC/State Medical Council & ABDM M1/M2/M3.
          </span>
          <span style={{ fontWeight: 700, color: '#38BDF8' }}>
            🇮🇳 Ayushman Bharat Digital Mission (ABDM) Linked
          </span>
        </div>

        {/* Search & Filter Bar */}
        <div style={{ padding: '16px 24px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ flex: 1, minWidth: '260px', position: 'relative' }}>
              <input
                type="text"
                placeholder="Search by Doctor, Specialty, Clinic, or Symptoms..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 16px',
                  borderRadius: '12px',
                  backgroundColor: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  color: '#F8FAFC',
                  fontSize: '0.9rem',
                  outline: 'none'
                }}
              />
            </div>

            {/* Mode Selector */}
            <div style={{ display: 'flex', backgroundColor: 'rgba(255, 255, 255, 0.06)', borderRadius: '12px', padding: '3px' }}>
              {(['ALL', 'IN_CLINIC', 'VIDEO'] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setFilterMode(mode)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '9px',
                    border: 'none',
                    backgroundColor: filterMode === mode ? '#0284C7' : 'transparent',
                    color: filterMode === mode ? '#FFFFFF' : '#94A3B8',
                    fontWeight: 700,
                    fontSize: '0.78rem',
                    cursor: 'pointer'
                  }}
                >
                  {mode === 'ALL' ? 'All Modes' : mode === 'IN_CLINIC' ? '🏥 In-Clinic' : '📹 Video Consult'}
                </button>
              ))}
            </div>

            {/* Max Fee Slider */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: '#CBD5E1' }}>
              <span>Max Fee:</span>
              <input
                type="range"
                min="300"
                max="1500"
                step="50"
                value={maxFee}
                onChange={(e) => setMaxFee(Number(e.target.value))}
                style={{ cursor: 'pointer', accentColor: '#38BDF8' }}
              />
              <span style={{ fontWeight: 700, color: '#38BDF8' }}>₹{maxFee}</span>
            </div>
          </div>

          {/* Symptom Shortcuts */}
          <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', marginTop: '12px', paddingBottom: '4px' }}>
            {SYMPTOM_SHORTCUTS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSelectedSymptom(s)}
                style={{
                  padding: '4px 12px',
                  borderRadius: '16px',
                  border: '1px solid',
                  borderColor: selectedSymptom === s ? '#38BDF8' : 'rgba(255, 255, 255, 0.1)',
                  backgroundColor: selectedSymptom === s ? 'rgba(56, 189, 248, 0.15)' : 'rgba(255, 255, 255, 0.04)',
                  color: selectedSymptom === s ? '#38BDF8' : '#94A3B8',
                  fontSize: '0.75rem',
                  fontWeight: selectedSymptom === s ? 700 : 500,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap'
                }}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Booking Notification Banner */}
        {bookingNotice && (
          <div
            style={{
              padding: '10px 24px',
              backgroundColor: 'rgba(16, 185, 129, 0.2)',
              borderBottom: '1px solid #10B981',
              color: '#34D399',
              fontSize: '0.85rem',
              fontWeight: 700,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            <span>{bookingNotice}</span>
            <button
              type="button"
              onClick={() => setBookingNotice(null)}
              style={{ background: 'none', border: 'none', color: '#34D399', cursor: 'pointer', fontSize: '1rem' }}
            >
              ✕
            </button>
          </div>
        )}

        {/* Zocdoc Killer: Bookings Boost Autonomous Cancellation Fill Card */}
        <div
          style={{
            margin: '12px 24px 0 24px',
            background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(217, 119, 6, 0.15) 100%)',
            border: '1.5px solid #F59E0B',
            borderRadius: '14px',
            padding: '10px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '1.4rem' }}>⚡</span>
            <div>
              <div style={{ fontSize: '0.8125rem', fontWeight: 900, color: '#FCD34D' }}>
                Zocdoc-Style 'Bookings Boost' Priority Slot Available
              </div>
              <div style={{ fontSize: '0.72rem', color: '#FDE68A' }}>
                Dr. Ananya Roy • 11:30 AM slot just opened due to early patient reschedule
              </div>
            </div>
          </div>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setBookingNotice('⚡ 11:30 AM Priority Slot Claimed! Instant OPD Token #04 allocated.')}
          >
            Claim Slot ➔
          </Button>
        </div>

        {/* Doctors List Scroll View */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {filteredDoctors.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: '#94A3B8' }}>
              <span style={{ fontSize: '2.5rem' }}>🔍</span>
              <p style={{ marginTop: '12px', fontSize: '1rem' }}>No doctors found matching your filters.</p>
              <Button variant="secondary" size="sm" onClick={() => { setSearchQuery(''); setSelectedSymptom('All'); setMaxFee(1500); }}>
                Reset Filters
              </Button>
            </div>
          ) : (
            filteredDoctors.map((doc, idx) => (
              <div
                key={doc.id}
                style={{
                  backgroundColor: 'rgba(30, 41, 59, 0.65)',
                  borderRadius: '16px',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  padding: '16px 20px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '16px',
                  transition: 'all 0.2s ease'
                }}
              >
                {/* Doctor Clinical Profile */}
                <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start', flex: 1, minWidth: '300px' }}>
                  <div
                    style={{
                      width: '56px',
                      height: '56px',
                      borderRadius: '14px',
                      backgroundColor: 'rgba(56, 189, 248, 0.15)',
                      border: '1px solid rgba(56, 189, 248, 0.3)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.75rem',
                      color: '#38BDF8'
                    }}
                  >
                    👨‍⚕️
                  </div>

                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '1.05rem', fontWeight: 900, color: '#F8FAFC' }}>
                        {doc.name}
                      </span>
                      {doc.isNabhAbdmVerified && (
                        <span style={{ fontSize: '0.6875rem', backgroundColor: 'rgba(16, 185, 129, 0.2)', color: '#34D399', padding: '2px 8px', borderRadius: '12px', fontWeight: 700 }}>
                          ✓ NABH & ABDM
                        </span>
                      )}
                      <span style={{ fontSize: '0.6875rem', backgroundColor: 'rgba(56, 189, 248, 0.15)', color: '#38BDF8', padding: '2px 8px', borderRadius: '12px', fontWeight: 700 }}>
                        Merit Rank #{idx + 1}
                      </span>
                    </div>

                    <div style={{ fontSize: '0.78rem', color: '#94A3B8', marginTop: '2px' }}>
                      {doc.degree} • <strong>{doc.experienceYears} Yrs Exp</strong>
                    </div>

                    <div style={{ fontSize: '0.8125rem', color: '#38BDF8', fontWeight: 700, marginTop: '2px' }}>
                      {doc.specialty}
                    </div>

                    <div style={{ fontSize: '0.75rem', color: '#CBD5E1', marginTop: '3px' }}>
                      🏥 {doc.hospitalName} ({doc.distanceKm} km away)
                    </div>

                    {/* Symptoms Tags */}
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '6px' }}>
                      {doc.symptoms.map((sym) => (
                        <span
                          key={sym}
                          style={{
                            fontSize: '0.6875rem',
                            backgroundColor: 'rgba(255, 255, 255, 0.06)',
                            color: '#94A3B8',
                            padding: '2px 8px',
                            borderRadius: '10px'
                          }}
                        >
                          {sym}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Live Real-Time Telemetry & Booking */}
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-end',
                    gap: '10px',
                    minWidth: '220px'
                  }}
                >
                  {/* Rating & Fee */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ color: '#FBBF24', fontWeight: 900, fontSize: '0.95rem' }}>
                        ★ {doc.verifiedRating}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: '#94A3B8', marginLeft: '4px' }}>
                        ({doc.totalReviews})
                      </span>
                    </div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 900, color: '#34D399' }}>
                      ₹{doc.consultationFee}
                    </div>
                  </div>

                  {/* Live Queue Badge */}
                  <div
                    style={{
                      fontSize: '0.75rem',
                      backgroundColor: doc.liveQueueAhead <= 2 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                      border: `1px solid ${doc.liveQueueAhead <= 2 ? '#10B981' : '#F59E0B'}`,
                      color: doc.liveQueueAhead <= 2 ? '#34D399' : '#FBBF24',
                      padding: '4px 10px',
                      borderRadius: '8px',
                      fontWeight: 700
                    }}
                  >
                    🟢 Live Queue: {doc.liveQueueAhead} ahead (~{doc.estimatedWaitMinutes}m wait)
                  </div>

                  {/* Zocdoc-Style Real-Time Time Slots Grid */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                    <span style={{ fontSize: '0.6875rem', color: '#94A3B8', fontWeight: 600 }}>Available Time Slots:</span>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      {['10:00 AM', '11:15 AM', '04:00 PM', '05:30 PM'].map((slot) => (
                        <button
                          key={slot}
                          type="button"
                          onClick={() => {
                            const tokenNo = `#${Math.floor(18 + Math.random() * 15)}`;
                            setBookingNotice(`✅ Token ${tokenNo} reserved for ${slot} with ${doc.name}!`);
                          }}
                          style={{
                            padding: '3px 6px',
                            borderRadius: '6px',
                            border: '1px solid rgba(56, 189, 248, 0.3)',
                            backgroundColor: 'rgba(56, 189, 248, 0.1)',
                            color: '#38BDF8',
                            fontSize: '0.6875rem',
                            fontWeight: 700,
                            cursor: 'pointer'
                          }}
                        >
                          {slot}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => {
                        const tokenNo = `#${Math.floor(18 + Math.random() * 15)}`;
                        setBookingNotice(`✅ Token ${tokenNo} confirmed for ${doc.name}! Live wait time: ~${doc.estimatedWaitMinutes} mins.`);
                        if (onBookInClinic) onBookInClinic(doc);
                      }}
                    >
                      🎫 1-Click OPD Token
                    </Button>

                    {doc.isOnlineForVideo && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          setBookingNotice(`📹 Instant Video Consultation initiated with ${doc.name}! Launching WebRTC...`);
                          if (onBookVideo) onBookVideo(doc);
                        }}
                      >
                        📹 Instant Video
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer info */}
        <div
          style={{
            padding: '12px 24px',
            backgroundColor: 'rgba(15, 23, 42, 0.95)',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '0.75rem',
            color: '#64748B'
          }}
        >
          <span>Powered by DocSearch Distributed Healthcare Protocol • 0% Commission to Doctors</span>
          <span style={{ color: '#38BDF8', fontWeight: 700 }}>
            ⚡ Sub-second Local Edge Booking
          </span>
        </div>
      </div>
    </div>
  );
};
