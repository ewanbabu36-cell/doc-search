import React, { useState, useEffect } from 'react';
import { type Language } from '../i18n.js';
import { patientApiService, type ScheduledDose, type MedicationScheduleResponse } from '../services/patient-api.js';
import { speakAdvice } from '../utils/voice-assistant.js';

interface Props {
  language: Language;
  onBack: () => void;
}

export const DawaReminderScreen: React.FC<Props> = ({ language, onBack }) => {
  const [scheduleData, setScheduleData] = useState<MedicationScheduleResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);
  const [refillSuccessMessage, setRefillSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    patientApiService.getMedicationSchedule().then((data) => {
      if (mounted) {
        setScheduleData(data);
        setIsLoading(false);
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  const handleToggleDose = async (dose: ScheduledDose) => {
    if (!scheduleData) return;
    const newStatus = dose.status === 'TAKEN' ? 'PENDING' : 'TAKEN';
    const timeStr = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

    // Optimistic UI update
    const updatedDoses = scheduleData.scheduledDoses.map((d) =>
      d.id === dose.id ? { ...d, status: newStatus as any, takenAt: newStatus === 'TAKEN' ? timeStr : null } : d
    );
    const takenCount = updatedDoses.filter((d) => d.status === 'TAKEN').length;
    const newAdherence = Math.round((takenCount / updatedDoses.length) * 100);

    setScheduleData({
      ...scheduleData,
      adherenceScore: newAdherence,
      scheduledDoses: updatedDoses
    });

    await patientApiService.logMedicationDose(dose.id, newStatus as any);
  };

  const handleSnooze = async (e: React.MouseEvent, doseId: string) => {
    e.stopPropagation();
    if (!scheduleData) return;
    const updatedDoses = scheduleData.scheduledDoses.map((d) =>
      d.id === doseId ? { ...d, status: 'SNOOZED' as const } : d
    );
    setScheduleData({ ...scheduleData, scheduledDoses: updatedDoses });
    await patientApiService.logMedicationDose(doseId, 'SNOOZED');
  };

  const handlePlayVoice = (e: React.MouseEvent, dose: ScheduledDose) => {
    e.stopPropagation();
    setPlayingVoiceId(dose.id);
    speakAdvice(dose.voiceAdvice, language);
    setTimeout(() => setPlayingVoiceId(null), 6000);
  };

  const handleRequestRefill = async (medName: string) => {
    const res = await patientApiService.requestMedicationRefill(medName, 5);
    setRefillSuccessMessage(res.message);
    setTimeout(() => setRefillSuccessMessage(null), 5000);
  };

  if (isLoading || !scheduleData) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#0B0F19', color: '#F8FAFC', padding: '24px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontSize: '2rem', marginBottom: '12px' }}>💊</span>
        <div style={{ fontSize: '0.9375rem', fontWeight: 700, color: '#94A3B8' }}>
          {language === 'hi' ? 'दवाइयों का टाइम-टेबल लोड हो रहा है...' : 'Loading Doctor Medication Schedule...'}
        </div>
      </div>
    );
  }

  const { scheduledDoses, adherenceScore, streakDays, caregiverAlertContact, nextDueDose } = scheduleData;
  const takenCount = scheduledDoses.filter((d) => d.status === 'TAKEN').length;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0B0F19', color: '#F8FAFC', padding: '16px 16px 100px 16px', display: 'flex', flexDirection: 'column' }}>
      {/* 1. Header with Back Button */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <button
          type="button"
          onClick={onBack}
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.08)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            color: '#F8FAFC',
            padding: '8px 14px',
            borderRadius: '12px',
            fontSize: '0.875rem',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <span>←</span>
          <span>{language === 'hi' ? 'वापस' : 'Back'}</span>
        </button>

        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '1rem', fontWeight: 900, color: '#38BDF8' }}>
            💊 {language === 'hi' ? 'दवा का टाइम-टेबल & अलर्ट' : 'Doctor Dose & Alert System'}
          </div>
          <div style={{ fontSize: '0.6875rem', color: '#94A3B8' }}>
            {scheduleData.prescriptionId} • {scheduleData.doctorName}
          </div>
        </div>

        <div style={{ width: '60px' }} />
      </div>

      {/* Refill Success Toast */}
      {refillSuccessMessage && (
        <div
          style={{
            backgroundColor: 'rgba(16, 185, 129, 0.2)',
            border: '1px solid #10B981',
            borderRadius: '12px',
            padding: '12px 14px',
            marginBottom: '16px',
            color: '#34D399',
            fontSize: '0.8125rem',
            fontWeight: 800,
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <span>✓</span>
          <span>{refillSuccessMessage}</span>
        </div>
      )}

      {/* 2. Next Due Dose Live Hero Alarm Banner */}
      {nextDueDose && (
        <div
          style={{
            background: 'linear-gradient(135deg, #1E293B 0%, #0F172A 100%)',
            border: '2px solid #EF4444',
            borderRadius: '20px',
            padding: '18px',
            marginBottom: '16px',
            boxShadow: '0 8px 24px rgba(239, 68, 68, 0.25)',
            position: 'relative'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
            <span style={{ backgroundColor: 'rgba(239, 68, 68, 0.2)', color: '#F87171', fontSize: '0.6875rem', fontWeight: 900, padding: '3px 8px', borderRadius: '6px', letterSpacing: '0.05em' }}>
              🔔 {language === 'hi' ? 'अगली दवा का समय' : 'NEXT DUE DOSE'}
            </span>
            <span style={{ fontSize: '1.25rem', fontWeight: 900, color: '#FCA5A5', fontFamily: 'monospace' }}>
              {nextDueDose.exactTime}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                backgroundColor: 'rgba(239, 68, 68, 0.15)',
                border: '2px solid #EF4444',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.5rem'
              }}
            >
              💊
            </div>
            <div>
              <div style={{ fontSize: '1.125rem', fontWeight: 900, color: '#FFFFFF' }}>
                {nextDueDose.medicationName}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#CBD5E1' }}>
                {nextDueDose.instruction} • {language === 'hi' ? `लगभग ${nextDueDose.minsRemaining} मिनट में` : `in ~${nextDueDose.minsRemaining} mins`}
              </div>
            </div>
          </div>

          {/* Quick Voice Playback & Action */}
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                speakAdvice(nextDueDose.voiceAdvice, language);
              }}
              style={{
                flex: 1,
                backgroundColor: 'rgba(56, 189, 248, 0.15)',
                border: '1px solid rgba(56, 189, 248, 0.35)',
                color: '#38BDF8',
                borderRadius: '12px',
                padding: '10px',
                fontSize: '0.8125rem',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px'
              }}
            >
              <span>🔊</span>
              <span>{language === 'hi' ? 'डॉक्टर की सलाह सुनें' : 'Listen Advice'}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                const pending = scheduledDoses.find((d) => d.id === nextDueDose.id);
                if (pending) handleToggleDose(pending);
              }}
              style={{
                flex: 1,
                backgroundColor: '#10B981',
                border: 'none',
                color: '#FFFFFF',
                borderRadius: '12px',
                padding: '10px',
                fontSize: '0.8125rem',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px'
              }}
            >
              <span>✓</span>
              <span>{language === 'hi' ? 'अभी ले ली (Taken)' : 'Mark Taken'}</span>
            </button>
          </div>
        </div>
      )}

      {/* 3. Daily Adherence Ring & Streak Card */}
      <div
        style={{
          backgroundColor: '#1E293B',
          borderRadius: '18px',
          padding: '16px',
          marginBottom: '16px',
          border: '1px solid rgba(255, 255, 255, 0.08)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <div>
            <div style={{ fontSize: '0.875rem', fontWeight: 800, color: '#F8FAFC' }}>
              {language === 'hi' ? 'आज की दवाइयों का स्कोर' : "Today's Adherence Score"}
            </div>
            <div style={{ fontSize: '0.6875rem', color: '#94A3B8' }}>
              {takenCount} of {scheduledDoses.length} {language === 'hi' ? 'खुराक ली गई' : 'doses completed'}
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '1.25rem', fontWeight: 900, color: adherenceScore >= 66 ? '#10B981' : '#F59E0B' }}>
              {adherenceScore}%
            </span>
            <div style={{ fontSize: '0.6875rem', color: '#F59E0B', fontWeight: 700 }}>
              🔥 {streakDays} {language === 'hi' ? 'दिन की स्ट्रीक' : 'Days Streak'}
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div style={{ height: '8px', backgroundColor: 'rgba(255, 255, 255, 0.1)', borderRadius: '4px', overflow: 'hidden' }}>
          <div
            style={{
              width: `${adherenceScore}%`,
              height: '100%',
              backgroundColor: adherenceScore === 100 ? '#10B981' : '#0284C7',
              transition: 'width 0.4s ease'
            }}
          />
        </div>
      </div>

      {/* 4. Caregiver "Beta Buddy" Accountability Sync */}
      <div
        style={{
          backgroundColor: 'rgba(56, 189, 248, 0.08)',
          border: '1px solid rgba(56, 189, 248, 0.25)',
          borderRadius: '14px',
          padding: '12px 14px',
          marginBottom: '18px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '1.25rem' }}>👨‍👩‍👧</span>
          <div>
            <div style={{ fontSize: '0.8125rem', fontWeight: 800, color: '#38BDF8' }}>
              {language === 'hi' ? 'पारिवारिक केयरगिवर कनेक्ट' : 'Caregiver Sync Active'}
            </div>
            <div style={{ fontSize: '0.6875rem', color: '#94A3B8' }}>
              {caregiverAlertContact}
            </div>
          </div>
        </div>

        <span style={{ fontSize: '0.625rem', fontWeight: 800, color: '#34D399', backgroundColor: 'rgba(16, 185, 129, 0.2)', padding: '3px 8px', borderRadius: '6px' }}>
          ✓ SYNCED
        </span>
      </div>

      {/* 5. Detailed Scheduled Doses List with Visual Pill Recognition */}
      <div style={{ fontSize: '0.875rem', fontWeight: 800, color: '#E2E8F0', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
        <span>📋</span>
        <span>{language === 'hi' ? 'डॉक्टर का निर्धारित शेड्यूल:' : 'Doctor Prescribed Doses:'}</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
        {scheduledDoses.map((dose) => {
          const isTaken = dose.status === 'TAKEN';
          const isSnoozed = dose.status === 'SNOOZED';

          return (
            <div
              key={dose.id}
              onClick={() => handleToggleDose(dose)}
              style={{
                backgroundColor: isTaken ? 'rgba(16, 185, 129, 0.08)' : '#1E293B',
                border: isTaken ? '2px solid rgba(16, 185, 129, 0.4)' : isSnoozed ? '2px solid #F59E0B' : '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '16px',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                position: 'relative'
              }}
            >
              {/* Top Row: Pill Indicator, Name, Time */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  {/* Visual Pill Color & Shape Badge */}
                  <div
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: dose.pillShape === 'ROUND' ? '50%' : '10px',
                      backgroundColor: `${dose.pillColor}25`,
                      border: `2px solid ${dose.pillColor}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.25rem',
                      flexShrink: 0
                    }}
                  >
                    {dose.pillShape === 'CAPSULE' ? '💊' : '🟡'}
                  </div>

                  <div>
                    <div style={{ fontSize: '1rem', fontWeight: 900, color: isTaken ? '#94A3B8' : '#FFFFFF', textDecoration: isTaken ? 'line-through' : 'none' }}>
                      {dose.medicationName}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '2px' }}>
                      {dose.dosage} • {dose.frequency}
                    </div>
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.9375rem', fontWeight: 900, color: '#38BDF8', fontFamily: 'monospace' }}>
                    {dose.exactTime}
                  </div>
                  <span
                    style={{
                      fontSize: '0.625rem',
                      fontWeight: 800,
                      padding: '2px 6px',
                      borderRadius: '4px',
                      backgroundColor: dose.timeSlot === 'MORNING' ? 'rgba(245, 158, 11, 0.2)' : dose.timeSlot === 'AFTERNOON' ? 'rgba(56, 189, 248, 0.2)' : 'rgba(139, 92, 246, 0.2)',
                      color: dose.timeSlot === 'MORNING' ? '#FBBF24' : dose.timeSlot === 'AFTERNOON' ? '#38BDF8' : '#A78BFA'
                    }}
                  >
                    {dose.timeSlot === 'MORNING' ? '🌅 Morning' : dose.timeSlot === 'AFTERNOON' ? '🍽️ Lunch' : '🌙 Night'}
                  </span>
                </div>
              </div>

              {/* Purpose & Meal Instruction in Simple Vernacular */}
              <div style={{ backgroundColor: 'rgba(0, 0, 0, 0.25)', borderRadius: '10px', padding: '8px 10px', fontSize: '0.75rem' }}>
                <div style={{ color: '#E2E8F0', fontWeight: 700 }}>
                  🎯 {dose.clinicalPurpose}
                </div>
                <div style={{ color: '#94A3B8', marginTop: '2px' }}>
                  🍽️ {dose.mealInstruction}
                </div>
                <div style={{ color: '#FCD34D', fontSize: '0.6875rem', marginTop: '4px', fontWeight: 600 }}>
                  {dose.foodWarning}
                </div>
              </div>

              {/* Bottom Action Row: Checkmark, Voice, Snooze, Refill */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '4px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {isTaken ? (
                    <span style={{ fontSize: '0.75rem', color: '#10B981', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span>✓</span>
                      <span>{language === 'hi' ? `ली गई (${dose.takenAt || 'Taken'})` : `Taken (${dose.takenAt || 'Taken'})`}</span>
                    </span>
                  ) : (
                    <span style={{ fontSize: '0.75rem', color: '#F59E0B', fontWeight: 700 }}>
                      ⏱️ {isSnoozed ? (language === 'hi' ? 'स्नूज़ (15 मि. बाद)' : 'Snoozed') : (language === 'hi' ? 'लंबित (Pending)' : 'Due')}
                    </span>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {/* Voice Button */}
                  <button
                    type="button"
                    onClick={(e) => handlePlayVoice(e, dose)}
                    style={{
                      backgroundColor: playingVoiceId === dose.id ? '#0284C7' : 'rgba(255, 255, 255, 0.08)',
                      border: 'none',
                      color: '#F8FAFC',
                      padding: '6px 10px',
                      borderRadius: '8px',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                    title="बोलकर सुनाओ"
                  >
                    <span>🔊</span>
                    <span>{playingVoiceId === dose.id ? 'बोल रहा है...' : 'Voice'}</span>
                  </button>

                  {/* Snooze Button */}
                  {!isTaken && (
                    <button
                      type="button"
                      onClick={(e) => handleSnooze(e, dose.id)}
                      style={{
                        backgroundColor: 'rgba(245, 158, 11, 0.15)',
                        border: '1px solid rgba(245, 158, 11, 0.3)',
                        color: '#F59E0B',
                        padding: '6px 10px',
                        borderRadius: '8px',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      ⏱️ 15m
                    </button>
                  )}

                  {/* Refill Button if stock is <= 2 days */}
                  {dose.isRefillDue && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRequestRefill(dose.medicationName);
                      }}
                      style={{
                        backgroundColor: '#DC2626',
                        border: 'none',
                        color: '#FFFFFF',
                        padding: '6px 10px',
                        borderRadius: '8px',
                        fontSize: '0.75rem',
                        fontWeight: 800,
                        cursor: 'pointer'
                      }}
                      title="दवा खत्म होने वाली है"
                    >
                      📦 Refill
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 6. Hospital Chemist Bedside Refill Dispatch Bar */}
      <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
        <button
          type="button"
          onClick={() => handleRequestRefill('Entire Prescription Refill Pack')}
          style={{
            width: '100%',
            backgroundColor: '#0284C7',
            color: '#F8FAFC',
            border: 'none',
            borderRadius: '16px',
            padding: '16px',
            fontSize: '1rem',
            fontWeight: 800,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            boxShadow: '0 4px 16px rgba(2, 132, 199, 0.35)'
          }}
        >
          <span>💊</span>
          <span>{language === 'hi' ? 'हॉस्पिटल केमिस्ट से पूरा पर्चा ऑर्डर करें (1-Click)' : '1-Click Refill All from Hospital Chemist'}</span>
        </button>
      </div>
    </div>
  );
};
