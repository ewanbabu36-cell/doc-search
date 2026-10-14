import React, { useState, useMemo } from 'react';
import { type Language } from '../i18n.js';
import { type PatientProfile, patientApiService } from '../services/patient-api.js';

interface Props {
  language: Language;
  patient: PatientProfile;
  onBack: () => void;
  onBookOpdSuccess: (updated: PatientProfile) => void;
  onLaunchVideoConsult: () => void;
}

interface Doctor {
  id: string;
  name: string;
  degree: string;
  specialtyHi: string;
  specialtyEn: string;
  hospitalName: string;
  fee: number;
  rating: number;
  reviews: number;
  waitMins: number;
  patientsAhead: number;
  isVideoReady: boolean;
  isAbdmVerified: boolean;
  symptoms: string[];
}

const DOCTORS: Doctor[] = [
  {
    id: 'd1',
    name: 'Dr. Vikram Malhotra',
    degree: 'MBBS, MD, DM (Cardiology) - AIIMS',
    specialtyHi: 'हृदय रोग विशेषज्ञ (Cardiology)',
    specialtyEn: 'Cardiologist & Heart Specialist',
    hospitalName: 'Apex Heart Super-Specialty',
    fee: 650,
    rating: 4.96,
    reviews: 640,
    waitMins: 8,
    patientsAhead: 2,
    isVideoReady: true,
    isAbdmVerified: true,
    symptoms: ['Chest Pain', 'High BP', 'Heart Palpitations']
  },
  {
    id: 'd2',
    name: 'Dr. Ananya Roy',
    degree: 'MBBS, MD (Medicine) - KGMU',
    specialtyHi: 'सामान्य चिकित्सा एवं शुगर (Gen Med)',
    specialtyEn: 'General Physician & Diabetologist',
    hospitalName: 'Metro Life Care Hospital',
    fee: 400,
    rating: 4.93,
    reviews: 580,
    waitMins: 5,
    patientsAhead: 1,
    isVideoReady: true,
    isAbdmVerified: true,
    symptoms: ['Fever / Dengue', 'Cough & Cold', 'Sugar / Diabetes']
  },
  {
    id: 'd3',
    name: 'Dr. Rajesh Gupta',
    degree: 'MBBS, MS (Ortho) - PGI',
    specialtyHi: 'हड्डी एवं जोड़ रोग (Orthopedics)',
    specialtyEn: 'Orthopedic & Joint Surgeon',
    hospitalName: 'Bone & Joint Speciality Clinic',
    fee: 550,
    rating: 4.88,
    reviews: 490,
    waitMins: 14,
    patientsAhead: 3,
    isVideoReady: false,
    isAbdmVerified: true,
    symptoms: ['Joint Pain', 'Back Pain', 'Arthritis']
  },
  {
    id: 'd4',
    name: 'Dr. Meera Sen',
    degree: 'MBBS, MD (Pediatrics)',
    specialtyHi: 'शिशु एवं बाल रोग (Pediatrics)',
    specialtyEn: 'Child Specialist & Pediatrician',
    hospitalName: 'Little Care Children Hospital',
    fee: 500,
    rating: 4.95,
    reviews: 710,
    waitMins: 10,
    patientsAhead: 2,
    isVideoReady: true,
    isAbdmVerified: true,
    symptoms: ['Child Fever', 'Baby Nutrition', 'Vaccination']
  }
];

export const MeritDoctorMarketplaceScreen: React.FC<Props> = ({
  language,
  patient,
  onBack,
  onBookOpdSuccess,
  onLaunchVideoConsult
}) => {
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'ALL' | 'IN_CLINIC' | 'VIDEO'>('ALL');
  const [confirmedNotice, setConfirmedNotice] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return DOCTORS.filter((d) => {
      const matchSearch =
        !search ||
        d.name.toLowerCase().includes(search.toLowerCase()) ||
        d.specialtyEn.toLowerCase().includes(search.toLowerCase()) ||
        d.specialtyHi.toLowerCase().includes(search.toLowerCase()) ||
        d.symptoms.some((s) => s.toLowerCase().includes(search.toLowerCase()));

      const matchMode =
        activeTab === 'ALL' ||
        (activeTab === 'VIDEO' && d.isVideoReady) ||
        (activeTab === 'IN_CLINIC' && true);

      return matchSearch && matchMode;
    });
  }, [search, activeTab]);

  const handleBookToken = (doc: Doctor) => {
    const newTokenNumber = `#${Math.floor(16 + Math.random() * 15)}`;
    const updated: PatientProfile = {
      ...patient,
      activeToken: {
        tokenNumber: newTokenNumber,
        doctorName: doc.name,
        chamberRoom: `${doc.specialtyEn.split(' ')[0]} - Room 102`,
        patientsAhead: doc.patientsAhead,
        estimatedWaitMins: doc.waitMins,
        isCalled: false
      }
    };
    patientApiService.setPatient(updated);
    setConfirmedNotice(
      language === 'hi'
        ? `✅ टोकन ${newTokenNumber} बुक हो गया! डॉक्टर ${doc.name} के पास केवल ${doc.patientsAhead} मरीज़ आगे हैं (~${doc.waitMins} मिनट इंतज़ार)।`
        : `✅ Token ${newTokenNumber} Confirmed! Only ${doc.patientsAhead} patients ahead of you for ${doc.name} (~${doc.waitMins}m wait).`
    );
    onBookOpdSuccess(updated);
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0B0F19', color: '#F8FAFC', padding: '16px 16px 90px 16px' }}>
      {/* Top Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <button
          type="button"
          onClick={onBack}
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.08)',
            border: 'none',
            color: '#94A3B8',
            width: '38px',
            height: '38px',
            borderRadius: '12px',
            fontSize: '1.1rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          ←
        </button>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '1.1rem', fontWeight: 900, color: '#F8FAFC' }}>
            {language === 'hi' ? '👨‍⚕️ डॉक्टर खोजें (0% दलाली / ऐड)' : '👨‍⚕️ Find Verified Doctors'}
          </div>
          <div style={{ fontSize: '0.6875rem', color: '#34D399', fontWeight: 700 }}>
            {language === 'hi' ? '🛡️ शुद्ध मेरिट व कम इंतज़ार समय अनुसार रैंकिंग' : '🛡️ 100% Pure Merit & Wait Time Ranking'}
          </div>
        </div>
        <div style={{ width: '38px' }} />
      </div>

      {/* Trust Banner */}
      <div
        style={{
          backgroundColor: 'rgba(16, 185, 129, 0.12)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          borderRadius: '12px',
          padding: '10px 14px',
          marginBottom: '16px',
          fontSize: '0.78rem',
          color: '#A7F3D0',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}
      >
        <span>🛡️</span>
        <span>
          {language === 'hi'
            ? 'प्रैक्टो के विपरीत यहाँ कोई डॉक्टर पैसे देकर टॉप पर नहीं आता। केवल मरीज़ों की संतुष्टि और सही इलाज से रैंकिंग होती है।'
            : 'Unlike Practo, doctors cannot pay to rank higher. Ranks are based on verified clinical outcomes & real wait times.'}
        </span>
      </div>

      {/* Search Input */}
      <div style={{ marginBottom: '14px' }}>
        <input
          type="text"
          placeholder={language === 'hi' ? 'डॉक्टर, लक्षण (बुखार, खाँसी) या बीमारी खोजें...' : 'Search doctor, symptom or specialty...'}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            width: '100%',
            padding: '12px 16px',
            borderRadius: '14px',
            backgroundColor: '#1E293B',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            color: '#F8FAFC',
            fontSize: '0.875rem',
            outline: 'none'
          }}
        />
      </div>

      {/* Mode Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        {[
          { key: 'ALL', labelHi: 'सभी (All)', labelEn: 'All Modes' },
          { key: 'IN_CLINIC', labelHi: '🏥 क्लिनिक ओपीडी', labelEn: '🏥 In-Clinic' },
          { key: 'VIDEO', labelHi: '📹 वीडियो कॉल', labelEn: '📹 Video Consult' }
        ].map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key as any)}
            style={{
              flex: 1,
              padding: '8px 10px',
              borderRadius: '10px',
              border: 'none',
              backgroundColor: activeTab === tab.key ? '#0284C7' : '#1E293B',
              color: activeTab === tab.key ? '#FFFFFF' : '#94A3B8',
              fontSize: '0.75rem',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            {language === 'hi' ? tab.labelHi : tab.labelEn}
          </button>
        ))}
      </div>

      {/* Confirmation Toast */}
      {confirmedNotice && (
        <div
          style={{
            backgroundColor: 'rgba(16, 185, 129, 0.25)',
            border: '1px solid #10B981',
            borderRadius: '12px',
            padding: '12px',
            marginBottom: '16px',
            color: '#34D399',
            fontSize: '0.8125rem',
            fontWeight: 700
          }}
        >
          {confirmedNotice}
        </div>
      )}

      {/* Zocdoc Killer: Bookings Boost Autonomous Cancellation Fill Card */}
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.18) 0%, rgba(217, 119, 6, 0.18) 100%)',
          border: '1.5px solid #F59E0B',
          borderRadius: '14px',
          padding: '12px 14px',
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '10px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '1.5rem' }}>⚡</span>
          <div>
            <div style={{ fontSize: '0.8125rem', fontWeight: 900, color: '#FCD34D' }}>
              {language === 'hi' ? 'कैंसिल हुआ तत्काल स्लॉट खुला! (Bookings Boost)' : 'Instant Cancelled Slot Opened! (Bookings Boost)'}
            </div>
            <div style={{ fontSize: '0.6875rem', color: '#FDE68A' }}>
              {language === 'hi' ? 'डॉ. अनन्या रॉय • 11:30 AM स्लॉट तुरंत उपलब्ध (मरीज़ ने री-शेड्यूल किया)' : 'Dr. Ananya Roy • 11:30 AM slot now open (Patient rescheduled)'}
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            setConfirmedNotice(language === 'hi' ? '⚡ 11:30 AM का वीआईपी स्लॉट आपके लिए कन्फर्म हुआ! ओपीडी टोकन #04 जारी किया गया।' : '⚡ 11:30 AM Priority Slot Confirmed! VIP Token #04 Allocated.');
          }}
          style={{
            backgroundColor: '#F59E0B',
            color: '#070C16',
            border: 'none',
            borderRadius: '8px',
            padding: '6px 10px',
            fontSize: '0.75rem',
            fontWeight: 900,
            cursor: 'pointer',
            whiteSpace: 'nowrap'
          }}
        >
          {language === 'hi' ? 'तुरंत लें ➔' : 'Claim ➔'}
        </button>
      </div>

      {/* Doctor Cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {filtered.map((doc) => (
          <div
            key={doc.id}
            style={{
              backgroundColor: '#1E293B',
              borderRadius: '16px',
              padding: '16px',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '1rem', fontWeight: 900, color: '#F8FAFC' }}>
                    {doc.name}
                  </span>
                  <span style={{ fontSize: '0.625rem', backgroundColor: 'rgba(16, 185, 129, 0.2)', color: '#34D399', padding: '2px 6px', borderRadius: '8px', fontWeight: 700 }}>
                    ABDM ✓
                  </span>
                </div>
                <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>{doc.degree}</div>
                <div style={{ fontSize: '0.8125rem', color: '#38BDF8', fontWeight: 700, marginTop: '2px' }}>
                  {language === 'hi' ? doc.specialtyHi : doc.specialtyEn}
                </div>
                <div style={{ fontSize: '0.7rem', color: '#CBD5E1', marginTop: '2px' }}>
                  🏥 {doc.hospitalName}
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '1.05rem', fontWeight: 900, color: '#34D399' }}>
                  ₹{doc.fee}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#FBBF24', fontWeight: 700 }}>
                  ★ {doc.rating} ({doc.reviews})
                </div>
              </div>
            </div>

            {/* Live Queue Status */}
            <div
              style={{
                backgroundColor: 'rgba(6, 182, 212, 0.12)',
                border: '1px solid rgba(6, 182, 212, 0.3)',
                borderRadius: '8px',
                padding: '6px 10px',
                fontSize: '0.75rem',
                color: '#38BDF8',
                fontWeight: 700,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <span>🟢 {language === 'hi' ? `लाइव कतार: ${doc.patientsAhead} मरीज़ आगे` : `Live Queue: ${doc.patientsAhead} patients ahead`}</span>
              <span>~{doc.waitMins} {language === 'hi' ? 'मिनट इंतज़ार' : 'mins wait'}</span>
            </div>

            {/* Zocdoc-Style Real-Time Time Slots Grid */}
            <div>
              <div style={{ fontSize: '0.6875rem', color: '#94A3B8', fontWeight: 700, marginBottom: '6px' }}>
                {language === 'hi' ? 'उपलब्ध समय स्लॉट (1-क्लिक बुक):' : 'Available Time Slots (1-Click Book):'}
              </div>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {['10:00 AM', '11:15 AM', '03:30 PM', '05:00 PM'].map((slot) => (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => {
                      const tokenNum = `#${Math.floor(10 + Math.random() * 20)}`;
                      setConfirmedNotice(language === 'hi' ? `✓ ${doc.name} के साथ ${slot} का टोकन ${tokenNum} जारी हुआ!` : `✓ Token ${tokenNum} confirmed for ${slot} with ${doc.name}!`);
                    }}
                    style={{
                      padding: '4px 8px',
                      borderRadius: '6px',
                      border: '1px solid rgba(56, 189, 248, 0.3)',
                      backgroundColor: 'rgba(56, 189, 248, 0.1)',
                      color: '#38BDF8',
                      fontSize: '0.72rem',
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
              <button
                type="button"
                onClick={() => handleBookToken(doc)}
                style={{
                  flex: 1,
                  backgroundColor: '#0284C7',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '9px 12px',
                  fontSize: '0.8rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                <span>🎫</span>
                <span>{language === 'hi' ? 'ओपीडी टोकन लें' : 'Get OPD Token'}</span>
              </button>

              {doc.isVideoReady && (
                <button
                  type="button"
                  onClick={onLaunchVideoConsult}
                  style={{
                    backgroundColor: 'rgba(56, 189, 248, 0.15)',
                    border: '1px solid #38BDF8',
                    color: '#38BDF8',
                    borderRadius: '10px',
                    padding: '9px 12px',
                    fontSize: '0.8rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <span>📹</span>
                  <span>{language === 'hi' ? 'वीडियो' : 'Video'}</span>
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
