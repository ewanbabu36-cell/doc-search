import React, { useState } from 'react';
import { type Language, translations } from '../i18n.js';

interface Props {
  language: Language;
  onBack: () => void;
}

interface DoseItem {
  id: string;
  name: string;
  dosage: string;
  instruction: string;
  timeSlot: 'MORNING' | 'AFTERNOON' | 'NIGHT';
  taken: boolean;
}

export const DawaReminderScreen: React.FC<Props> = ({ language, onBack }) => {
  const t = translations[language];
  const [doses, setDoses] = useState<DoseItem[]>([
    { id: '1', name: 'Pantoprazole 40mg', dosage: '1 Tab', instruction: 'Empty Stomach (30 mins before tea)', timeSlot: 'MORNING', taken: true },
    { id: '2', name: 'Paracetamol 650mg', dosage: '1 Tab', instruction: 'After Food (Lunch)', timeSlot: 'AFTERNOON', taken: false },
    { id: '3', name: 'Cetirizine 10mg', dosage: '1 Tab', instruction: 'At Bedtime', timeSlot: 'NIGHT', taken: false },
    { id: '4', name: 'Metformin 500mg PR', dosage: '1 Tab', instruction: 'With Dinner', timeSlot: 'NIGHT', taken: false }
  ]);
  const [isOrdered, setIsOrdered] = useState(false);

  const toggleDose = (id: string) => {
    setDoses(doses.map((d) => (d.id === id ? { ...d, taken: !d.taken } : d)));
  };

  const completedCount = doses.filter((d) => d.taken).length;
  const progressPercent = Math.round((completedCount / doses.length) * 100);

  const handleOrderChemist = () => {
    setIsOrdered(true);
    alert('Order sent to Hospital Chemist! Delivery dispatched.');
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0B0F19', color: '#F8FAFC', padding: '20px 16px', display: 'flex', flexDirection: 'column' }}>
      {/* Top Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <button
          type="button"
          onClick={onBack}
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.08)',
            border: 'none',
            color: '#F8FAFC',
            padding: '8px 14px',
            borderRadius: '12px',
            fontSize: '0.9375rem',
            fontWeight: 700,
            cursor: 'pointer'
          }}
        >
          ← {language === 'hi' ? 'वापस' : 'Back'}
        </button>
        <span style={{ fontSize: '1rem', fontWeight: 800, color: '#38BDF8' }}>
          {t.medicines}
        </span>
        <div style={{ width: '60px' }} />
      </div>

      {/* Daily Adherence Progress Card */}
      <div
        style={{
          backgroundColor: '#1E293B',
          borderRadius: '20px',
          padding: '20px',
          marginBottom: '20px',
          border: '1px solid rgba(255, 255, 255, 0.08)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <span style={{ fontSize: '0.9375rem', fontWeight: 800 }}>Today's Medicine Schedule</span>
          <span style={{ fontSize: '0.875rem', fontWeight: 800, color: progressPercent === 100 ? '#10B981' : '#38BDF8' }}>
            {completedCount} of {doses.length} Taken ({progressPercent}%)
          </span>
        </div>
        <div style={{ height: '8px', backgroundColor: 'rgba(255, 255, 255, 0.1)', borderRadius: '4px', overflow: 'hidden' }}>
          <div style={{ width: `${progressPercent}%`, height: '100%', backgroundColor: progressPercent === 100 ? '#10B981' : '#0284C7', transition: 'width 0.3s ease' }} />
        </div>
      </div>

      {/* Doses List by Time Slot */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', flex: 1 }}>
        {doses.map((dose) => (
          <div
            key={dose.id}
            onClick={() => toggleDose(dose.id)}
            style={{
              backgroundColor: dose.taken ? 'rgba(16, 185, 129, 0.08)' : '#1E293B',
              border: dose.taken ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '16px',
              padding: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: dose.taken ? '#10B981' : 'rgba(255, 255, 255, 0.1)',
                  color: '#F8FAFC',
                  fontSize: '1rem',
                  fontWeight: 900
                }}
              >
                {dose.taken ? '✓' : ''}
              </div>
              <div>
                <div style={{ fontSize: '1rem', fontWeight: 800, color: dose.taken ? '#E2E8F0' : '#F8FAFC', textDecoration: dose.taken ? 'line-through' : 'none' }}>
                  {dose.name}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '2px' }}>
                  {dose.dosage} • {dose.instruction}
                </div>
              </div>
            </div>

            <span
              style={{
                fontSize: '0.6875rem',
                fontWeight: 700,
                padding: '4px 8px',
                borderRadius: '6px',
                backgroundColor: dose.timeSlot === 'MORNING' ? 'rgba(245, 158, 11, 0.15)' : dose.timeSlot === 'AFTERNOON' ? 'rgba(56, 189, 248, 0.15)' : 'rgba(139, 92, 246, 0.15)',
                color: dose.timeSlot === 'MORNING' ? '#FBBF24' : dose.timeSlot === 'AFTERNOON' ? '#38BDF8' : '#A78BFA'
              }}
            >
              {dose.timeSlot === 'MORNING' ? '☀️ Morning' : dose.timeSlot === 'AFTERNOON' ? '🌤️ Noon' : '🌙 Night'}
            </span>
          </div>
        ))}
      </div>

      {/* Hospital Chemist 1-Click Order */}
      <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
        <button
          type="button"
          onClick={handleOrderChemist}
          disabled={isOrdered}
          style={{
            width: '100%',
            backgroundColor: isOrdered ? '#10B981' : '#0284C7',
            color: '#F8FAFC',
            border: 'none',
            borderRadius: '16px',
            padding: '16px',
            fontSize: '1rem',
            fontWeight: 800,
            cursor: isOrdered ? 'default' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            boxShadow: '0 4px 16px rgba(2, 132, 199, 0.35)'
          }}
        >
          <span>💊</span>
          <span>{isOrdered ? '✓ Ordered from Chemist' : t.orderMedicines}</span>
        </button>
      </div>
    </div>
  );
};
