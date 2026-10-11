import React, { useState } from 'react';
import { type Language } from '../i18n.js';
import { patientApiService, type PatientProfile } from '../services/patient-api.js';

interface Props {
  language: Language;
  patient: PatientProfile;
  onClose: () => void;
  onSuccess: (updatedPatient: PatientProfile) => void;
}

const DEPARTMENTS = [
  { id: 'gen-med', name: 'General Medicine (सामान्य रोग)', icon: '🩺', doctors: ['Dr. Vivek Sharma (MD)', 'Dr. Ananya Roy (MD)'] },
  { id: 'ortho', name: 'Orthopedics (हड्डी एवं जोड़ रोग)', icon: '🦴', doctors: ['Dr. Rajesh Gupta (MS Ortho)'] },
  { id: 'pedia', name: 'Pediatrics (शिशु एवं बाल रोग)', icon: '👶', doctors: ['Dr. Meera Sen (MD Pediatrics)'] },
  { id: 'cardio', name: 'Cardiology (हृदय रोग)', icon: '❤️', doctors: ['Dr. Vikram Malhotra (DM Cardio)'] }
];

const COMPLAINT_TAGS = ['बुखार & बदन दर्द (Fever)', 'खाँसी & ज़ुकाम (Cough/Cold)', 'पेट दर्द & गैस (Acidity)', 'ब्लड प्रेशर चेकअप (BP)', 'रूटीन फॉलो-अप (Follow-up)'];

export const BookOpdModal: React.FC<Props> = ({ language, patient, onClose, onSuccess }) => {
  const [selectedDept, setSelectedDept] = useState(DEPARTMENTS[0]!);
  const [selectedDoctor, setSelectedDoctor] = useState(DEPARTMENTS[0]!.doctors[0]!);
  const [complaint, setComplaint] = useState(COMPLAINT_TAGS[0]!);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleBook = async () => {
    setIsSubmitting(true);
    await patientApiService.bookAppointment(patient.phone, selectedDept.name, complaint);

    // Update active token locally & poll
    const newToken = `#${Math.floor(15 + Math.random() * 20)}`;
    const updated: PatientProfile = {
      ...patient,
      activeToken: {
        tokenNumber: newToken,
        doctorName: selectedDoctor,
        chamberRoom: `${selectedDept.name.split(' ')[0]} - Room 104`,
        patientsAhead: 3,
        estimatedWaitMins: 12,
        isCalled: false
      }
    };
    patientApiService.setPatient(updated);
    setIsSubmitting(false);
    onSuccess(updated);
    onClose();
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(8px)',
        zIndex: 200,
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center'
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '480px',
          backgroundColor: '#0F172A',
          borderTopLeftRadius: '24px',
          borderTopRightRadius: '24px',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          padding: '24px 20px 32px 20px',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 -10px 40px rgba(0, 0, 0, 0.8)'
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#F8FAFC' }}>
              {language === 'hi' ? '📅 नया टोकन / अपॉइंटमेंट' : '📅 Book OPD Token'}
            </div>
            <div style={{ fontSize: '0.8125rem', color: '#94A3B8' }}>
              {language === 'hi' ? 'मरीज़: ' : 'Patient: '}<strong>{patient.fullName}</strong> ({patient.uhid})
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              border: 'none',
              color: '#94A3B8',
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              fontSize: '1rem',
              cursor: 'pointer'
            }}
          >
            ✕
          </button>
        </div>

        {/* 1. Select Department */}
        <div style={{ marginBottom: '18px' }}>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '8px' }}>
            {language === 'hi' ? '१. विभाग चुनें (Department)' : '1. Select Department'}
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            {DEPARTMENTS.map((dept) => {
              const active = selectedDept.id === dept.id;
              return (
                <button
                  key={dept.id}
                  type="button"
                  onClick={() => {
                    setSelectedDept(dept);
                    setSelectedDoctor(dept.doctors[0]!);
                  }}
                  style={{
                    backgroundColor: active ? 'rgba(2, 132, 199, 0.25)' : '#1E293B',
                    border: active ? '2px solid #38BDF8' : '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '14px',
                    padding: '12px 10px',
                    textAlign: 'left',
                    color: '#F8FAFC',
                    cursor: 'pointer'
                  }}
                >
                  <div style={{ fontSize: '1.25rem', marginBottom: '4px' }}>{dept.icon}</div>
                  <div style={{ fontSize: '0.8125rem', fontWeight: 800 }}>{dept.name.split('(')[0]}</div>
                  <div style={{ fontSize: '0.6875rem', color: '#94A3B8' }}>{dept.name.split('(')[1]?.replace(')', '') || ''}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. Select Doctor */}
        <div style={{ marginBottom: '18px' }}>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '8px' }}>
            {language === 'hi' ? '२. डॉक्टर चुनें (Doctor)' : '2. Select Doctor'}
          </label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {selectedDept.doctors.map((doc) => {
              const active = selectedDoctor === doc;
              return (
                <button
                  key={doc}
                  type="button"
                  onClick={() => setSelectedDoctor(doc)}
                  style={{
                    backgroundColor: active ? 'rgba(16, 185, 129, 0.15)' : '#1E293B',
                    border: active ? '2px solid #10B981' : '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '12px',
                    padding: '12px 14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    color: '#F8FAFC',
                    cursor: 'pointer'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '1.25rem' }}>👨‍⚕️</span>
                    <span style={{ fontSize: '0.875rem', fontWeight: 700 }}>{doc}</span>
                  </div>
                  {active && <span style={{ color: '#10B981', fontWeight: 900 }}>✓</span>}
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. Chief Complaint Quick Tags */}
        <div style={{ marginBottom: '24px' }}>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '8px' }}>
            {language === 'hi' ? '३. मुख्य समस्या (Chief Complaint)' : '3. Chief Complaint'}
          </label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {COMPLAINT_TAGS.map((tag) => {
              const active = complaint === tag;
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => setComplaint(tag)}
                  style={{
                    backgroundColor: active ? '#0284C7' : '#1E293B',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '20px',
                    padding: '6px 12px',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    color: active ? '#F8FAFC' : '#CBD5E1',
                    cursor: 'pointer'
                  }}
                >
                  {tag}
                </button>
              );
            })}
          </div>
        </div>

        {/* Confirm Button */}
        <button
          type="button"
          onClick={handleBook}
          disabled={isSubmitting}
          style={{
            width: '100%',
            backgroundColor: '#10B981',
            color: '#F8FAFC',
            border: 'none',
            borderRadius: '16px',
            padding: '16px',
            fontSize: '1.0625rem',
            fontWeight: 800,
            cursor: 'pointer',
            boxShadow: '0 4px 20px rgba(16, 185, 129, 0.4)',
            transition: 'all 0.2s ease'
          }}
        >
          {isSubmitting
            ? '...'
            : language === 'hi'
            ? '🎫 तुरंत टोकन जनरेट करें (Generate Token)'
            : '🎫 Generate Instant Token'}
        </button>
      </div>
    </div>
  );
};
