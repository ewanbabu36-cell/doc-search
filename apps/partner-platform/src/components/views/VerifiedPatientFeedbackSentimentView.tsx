import React, { useState } from 'react';
import { Button, Badge } from '@docsearch/ui-kit';

export interface PatientFeedback {
  id: string;
  uhid: string;
  patientName: string;
  doctorName: string;
  department: string;
  visitType: 'OPD' | 'IPD';
  starRating: number;
  sentiment: 'POSITIVE' | 'NEUTRAL' | 'CRITICAL_ALERT';
  reviewText: string;
  voiceNoteUrl?: string;
  surveyTimestamp: string;
  waitAccuracyScore: number;
  doctorAttentivenessScore: number;
  cleanlinessScore: number;
  status: 'PUBLISHED' | 'ESCALATED_TO_RMO' | 'RESOLVED';
}

const INITIAL_FEEDBACKS: PatientFeedback[] = [
  {
    id: 'FB-901',
    uhid: 'UHID-8821',
    patientName: 'Rameshwar Dayal',
    doctorName: 'Dr. Vikram Malhotra',
    department: 'Cardiology',
    visitType: 'OPD',
    starRating: 5,
    sentiment: 'POSITIVE',
    reviewText: 'Doctor explained the heart ECG report very patiently in Hindi. Wait time was only 6 minutes, exactly as shown on the WhatsApp token tracker!',
    surveyTimestamp: '10 Mins Ago',
    waitAccuracyScore: 98,
    doctorAttentivenessScore: 100,
    cleanlinessScore: 95,
    status: 'PUBLISHED'
  },
  {
    id: 'FB-902',
    uhid: 'UHID-7742',
    patientName: 'Kamla Devi',
    doctorName: 'Dr. Ananya Roy',
    department: 'General Medicine',
    visitType: 'OPD',
    starRating: 1,
    sentiment: 'CRITICAL_ALERT',
    reviewText: 'ALERT: Patient reported severe shivering and itching 30 mins after taking the prescribed antibiotic injection. Requires urgent review!',
    surveyTimestamp: '25 Mins Ago',
    waitAccuracyScore: 80,
    doctorAttentivenessScore: 60,
    cleanlinessScore: 90,
    status: 'ESCALATED_TO_RMO'
  },
  {
    id: 'FB-903',
    uhid: 'UHID-9934',
    patientName: 'Sanjay Rawat',
    doctorName: 'Dr. Rajesh Gupta',
    department: 'Orthopedics',
    visitType: 'IPD',
    starRating: 4,
    sentiment: 'POSITIVE',
    reviewText: 'Knee surgery went smoothly. Nursing care in Deluxe-204 was very prompt. Digital discharge summary arrived immediately on WhatsApp.',
    surveyTimestamp: '1 Hour Ago',
    waitAccuracyScore: 90,
    doctorAttentivenessScore: 95,
    cleanlinessScore: 98,
    status: 'PUBLISHED'
  },
  {
    id: 'FB-904',
    uhid: 'UHID-6631',
    patientName: 'Vimla Aggarwal',
    doctorName: 'Dr. Meera Sen',
    department: 'Pediatrics',
    visitType: 'OPD',
    starRating: 5,
    sentiment: 'POSITIVE',
    reviewText: 'Very gentle with my 2-year old daughter during vaccination. 0 tears! Highly recommend Dr. Meera.',
    surveyTimestamp: '3 Hours Ago',
    waitAccuracyScore: 95,
    doctorAttentivenessScore: 100,
    cleanlinessScore: 100,
    status: 'PUBLISHED'
  }
];

export const VerifiedPatientFeedbackSentimentView: React.FC = () => {
  const [feedbacks, setFeedbacks] = useState<PatientFeedback[]>(INITIAL_FEEDBACKS);
  const [filterSentiment, setFilterSentiment] = useState<'ALL' | 'CRITICAL_ALERT' | 'POSITIVE'>('ALL');
  const [dispatchPhone, setDispatchPhone] = useState('+91 98765 43210');
  const [dispatchPatient, setDispatchPatient] = useState('Rahul Verma');
  const [dispatchSuccess, setDispatchSuccess] = useState(false);

  const filtered = feedbacks.filter((f) => {
    if (filterSentiment === 'ALL') return true;
    return f.sentiment === filterSentiment;
  });

  const criticalCount = feedbacks.filter((f) => f.sentiment === 'CRITICAL_ALERT').length;
  const avgRating = (feedbacks.reduce((acc, f) => acc + f.starRating, 0) / feedbacks.length).toFixed(1);

  const handleSimulateDispatch = () => {
    setDispatchSuccess(true);
    setTimeout(() => {
      const newFeedback: PatientFeedback = {
        id: `FB-${Math.floor(910 + Math.random() * 50)}`,
        uhid: `UHID-${Math.floor(1000 + Math.random() * 9000)}`,
        patientName: dispatchPatient,
        doctorName: 'Dr. Vikram Malhotra',
        department: 'Cardiology',
        visitType: 'OPD',
        starRating: 5,
        sentiment: 'POSITIVE',
        reviewText: 'Received 1-tap WhatsApp survey. Rated 5 stars! The medicine reminder audio chime in Hindi is extremely helpful.',
        surveyTimestamp: 'Just Now (Live Ingested)',
        waitAccuracyScore: 100,
        doctorAttentivenessScore: 100,
        cleanlinessScore: 95,
        status: 'PUBLISHED'
      };
      setFeedbacks((prev) => [newFeedback, ...prev]);
      setDispatchSuccess(false);
    }, 1200);
  };

  const handleResolveAlert = (id: string) => {
    setFeedbacks((prev) =>
      prev.map((f) => (f.id === id ? { ...f, status: 'RESOLVED', sentiment: 'NEUTRAL' } : f))
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', minHeight: '100%' }}>
      {/* Top Header Card */}
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(30, 27, 75, 0.95) 0%, rgba(15, 23, 42, 0.95) 100%)',
          borderRadius: '20px',
          border: '1.5px solid rgba(56, 189, 248, 0.4)',
          padding: '20px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          boxShadow: '0 8px 30px rgba(0, 0, 0, 0.5)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              width: '54px',
              height: '54px',
              borderRadius: '16px',
              backgroundColor: 'rgba(56, 189, 248, 0.15)',
              border: '1px solid #38BDF8',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.8rem'
            }}
          >
            ⭐
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h2 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 900, color: '#F8FAFC' }}>
                Verified Patient Sentiment & Feedback Engine
              </h2>
              <Badge variant="success">Anti-Fake Review Protocol</Badge>
            </div>
            <p style={{ margin: '4px 0 0 0', fontSize: '0.82rem', color: '#CBD5E1' }}>
              Only patients who actually attended and paid for a consultation receive this 1-tap WhatsApp survey.
            </p>
          </div>
        </div>

        {/* Quality Metrics Highlights */}
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <div style={{ textAlign: 'center', backgroundColor: 'rgba(255, 255, 255, 0.05)', padding: '8px 16px', borderRadius: '12px' }}>
            <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#FBBF24' }}>★ {avgRating}</div>
            <div style={{ fontSize: '0.7rem', color: '#94A3B8' }}>Hospital Merit Score</div>
          </div>
          <div style={{ textAlign: 'center', backgroundColor: criticalCount > 0 ? 'rgba(239, 68, 68, 0.2)' : 'rgba(255, 255, 255, 0.05)', border: criticalCount > 0 ? '1px solid #EF4444' : 'none', padding: '8px 16px', borderRadius: '12px' }}>
            <div style={{ fontSize: '1.4rem', fontWeight: 900, color: criticalCount > 0 ? '#F87171' : '#34D399' }}>
              {criticalCount}
            </div>
            <div style={{ fontSize: '0.7rem', color: criticalCount > 0 ? '#FCA5A5' : '#94A3B8' }}>
              Critical Clinical Alerts
            </div>
          </div>
        </div>
      </div>

      {/* Dispatcher Simulator Ribbon */}
      <div
        style={{
          backgroundColor: '#1E293B',
          borderRadius: '16px',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          padding: '14px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '1.3rem' }}>📲</span>
          <div>
            <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#F8FAFC' }}>
              Automated WhatsApp Post-Visit Survey Dispatcher
            </div>
            <div style={{ fontSize: '0.72rem', color: '#94A3B8' }}>
              Triggers automatically upon consultation sign-off or IPD discharge.
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <input
            type="text"
            value={dispatchPatient}
            onChange={(e) => setDispatchPatient(e.target.value)}
            style={{ padding: '6px 12px', borderRadius: '8px', backgroundColor: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', color: '#FFFFFF', fontSize: '0.8rem', width: '130px' }}
          />
          <input
            type="text"
            value={dispatchPhone}
            onChange={(e) => setDispatchPhone(e.target.value)}
            style={{ padding: '6px 12px', borderRadius: '8px', backgroundColor: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', color: '#FFFFFF', fontSize: '0.8rem', width: '140px' }}
          />
          <Button variant="primary" size="sm" onClick={handleSimulateDispatch}>
            {dispatchSuccess ? '⚡ Ingesting...' : '🚀 Dispatch Test Survey & Ingest'}
          </Button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '8px' }}>
        {[
          { key: 'ALL', label: 'All Reviews', count: feedbacks.length },
          { key: 'CRITICAL_ALERT', label: '🚨 Critical Clinical Alerts', count: criticalCount },
          { key: 'POSITIVE', label: '⭐ Positive Ratings (4–5 ★)', count: feedbacks.filter((f) => f.sentiment === 'POSITIVE').length }
        ].map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setFilterSentiment(tab.key as any)}
            style={{
              padding: '8px 16px',
              borderRadius: '10px',
              border: 'none',
              backgroundColor: filterSentiment === tab.key ? '#0284C7' : '#1E293B',
              color: filterSentiment === tab.key ? '#FFFFFF' : '#94A3B8',
              fontWeight: 700,
              fontSize: '0.8rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <span>{tab.label}</span>
            <span style={{ backgroundColor: 'rgba(255, 255, 255, 0.15)', padding: '1px 6px', borderRadius: '8px', fontSize: '0.7rem' }}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Feedback Feed Cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {filtered.map((item) => (
          <div
            key={item.id}
            style={{
              backgroundColor: item.sentiment === 'CRITICAL_ALERT' ? 'rgba(239, 68, 68, 0.1)' : '#1E293B',
              border: `1.5px solid ${item.sentiment === 'CRITICAL_ALERT' ? '#EF4444' : 'rgba(255, 255, 255, 0.08)'}`,
              borderRadius: '16px',
              padding: '18px 20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '1.05rem', fontWeight: 900, color: '#F8FAFC' }}>
                    {item.patientName}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
                    ({item.uhid}) • {item.visitType} Visit
                  </span>
                  {item.sentiment === 'CRITICAL_ALERT' && (
                    <span style={{ backgroundColor: '#EF4444', color: '#FFFFFF', padding: '2px 8px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 900 }}>
                      🚨 ADVERSE EVENT ALERT
                    </span>
                  )}
                </div>
                <div style={{ fontSize: '0.8rem', color: '#38BDF8', fontWeight: 700, marginTop: '2px' }}>
                  Consultant: {item.doctorName} ({item.department})
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <div style={{ color: '#FBBF24', fontSize: '1.1rem', fontWeight: 900 }}>
                  {'★'.repeat(item.starRating)}{'☆'.repeat(5 - item.starRating)}
                </div>
                <div style={{ fontSize: '0.7rem', color: '#94A3B8' }}>{item.surveyTimestamp}</div>
              </div>
            </div>

            {/* Review text */}
            <div style={{ fontSize: '0.875rem', color: '#E2E8F0', fontStyle: 'italic', lineHeight: 1.4 }}>
              "{item.reviewText}"
            </div>

            {/* Sub-scores */}
            <div style={{ display: 'flex', gap: '16px', fontSize: '0.75rem', color: '#94A3B8', borderTop: '1px solid rgba(255, 255, 255, 0.06)', paddingTop: '8px' }}>
              <span>⏱️ Wait Time Accuracy: <strong style={{ color: '#F8FAFC' }}>{item.waitAccuracyScore}%</strong></span>
              <span>🩺 Doctor Attentiveness: <strong style={{ color: '#F8FAFC' }}>{item.doctorAttentivenessScore}%</strong></span>
              <span>🧼 Facility Cleanliness: <strong style={{ color: '#F8FAFC' }}>{item.cleanlinessScore}%</strong></span>
            </div>

            {/* Action for critical alert */}
            {item.sentiment === 'CRITICAL_ALERT' && item.status !== 'RESOLVED' && (
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
                <Button variant="danger" size="sm" onClick={() => handleResolveAlert(item.id)}>
                  ✓ Escalate to RMO / Quality Committee & Mark Handled
                </Button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
