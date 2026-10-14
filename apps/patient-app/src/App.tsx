import React, { useState, useEffect } from 'react';
import { type Language } from './i18n.js';
import { patientApiService, type PatientProfile } from './services/patient-api.js';
import { PatientLoginScreen } from './components/PatientLoginScreen.js';
import { PatientHomeScreen } from './components/PatientHomeScreen.js';
import { MyTokenQueueScreen } from './components/MyTokenQueueScreen.js';
import { MeriParchiScreen } from './components/MeriParchiScreen.js';
import { DawaReminderScreen } from './components/DawaReminderScreen.js';
import { VideoConsultationScreen } from './components/VideoConsultationScreen.js';
import { PatientProfileScreen } from './components/PatientProfileScreen.js';
import { BookOpdModal } from './components/BookOpdModal.js';
import { MeritDoctorMarketplaceScreen } from './components/MeritDoctorMarketplaceScreen.js';

export type PatientScreen = 'HOME' | 'QUEUE' | 'PARCHI' | 'DAWA' | 'VIDEO' | 'BOOK' | 'PROFILE' | 'MARKETPLACE' | 'PLUS';

export const App: React.FC = () => {
  const [language, setLanguage] = useState<Language>('hi');
  const [currentPatient, setCurrentPatient] = useState<PatientProfile | null>(null);
  const [activeScreen, setActiveScreen] = useState<PatientScreen>('HOME');
  const [showBookModal, setShowBookModal] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [basementSimulated, setBasementSimulated] = useState(false);
  const [showSyncReconnectToast, setShowSyncReconnectToast] = useState(false);

  const triggerHaptic = (ms = 12) => {
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(ms);
      } catch {}
    }
  };

  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      setShowSyncReconnectToast(true);
      triggerHaptic(20);
      const timer = setTimeout(() => setShowSyncReconnectToast(false), 4500);
      return () => clearTimeout(timer);
    };
    const handleOffline = () => {
      setIsOffline(true);
      triggerHaptic(30);
    };
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const effectiveOffline = isOffline || basementSimulated;

  useEffect(() => {
    const p = patientApiService.getCurrentPatient();
    if (p) {
      setCurrentPatient(p);
    }
  }, []);

  const handleLanguageToggle = () => {
    triggerHaptic(8);
    setLanguage((prev) => (prev === 'hi' ? 'en' : 'hi'));
  };

  const handleLogout = () => {
    triggerHaptic(15);
    patientApiService.setPatient(null);
    setCurrentPatient(null);
    setActiveScreen('HOME');
  };

  const navigateToScreen = (screen: PatientScreen) => {
    triggerHaptic(10);
    setActiveScreen(screen);
  };

  if (!currentPatient) {
    return (
      <div style={{ maxWidth: '480px', margin: '0 auto', minHeight: '100vh', backgroundColor: '#0B0F19', position: 'relative' }}>
        {effectiveOffline && (
          <div
            style={{
              background: 'linear-gradient(135deg, #78350F 0%, #B45309 100%)',
              color: '#FEF3C7',
              padding: '10px 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '0.8125rem',
              fontWeight: 700,
              borderBottom: '1px solid rgba(251, 191, 36, 0.4)',
              position: 'sticky',
              top: 0,
              zIndex: 200
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '1.2rem' }}>📶🚫</span>
              <div>
                <div style={{ fontWeight: 800 }}>
                  {language === 'hi' ? 'अस्पताल बेसमेंट मोड सक्रिय (Offline Vault)' : 'Hospital Basement Mode Active (Offline Vault)'}
                </div>
                <div style={{ fontSize: '0.6875rem', opacity: 0.9, fontWeight: 500 }}>
                  {language === 'hi' ? 'टोकन, क्यूआर पास और पर्चे सुरक्षित ऑफलाइन तिजोरी में उपलब्ध हैं' : 'Token pass & prescriptions 100% available offline'}
                </div>
              </div>
            </div>
            {basementSimulated && (
              <button
                type="button"
                onClick={() => setBasementSimulated(false)}
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  border: '1px solid rgba(255, 255, 255, 0.4)',
                  color: '#FFFFFF',
                  padding: '4px 8px',
                  borderRadius: '6px',
                  fontSize: '0.6875rem',
                  fontWeight: 800,
                  cursor: 'pointer'
                }}
              >
                {language === 'hi' ? 'ऑनलाइन' : 'Online'}
              </button>
            )}
          </div>
        )}
        <PatientLoginScreen
          language={language}
          onLanguageToggle={handleLanguageToggle}
          onLoginSuccess={(p) => {
            patientApiService.setPatient(p);
            setCurrentPatient(p);
            setActiveScreen('HOME');
          }}
        />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '480px', margin: '0 auto', minHeight: '100vh', backgroundColor: '#0B0F19', boxShadow: '0 0 40px rgba(0,0,0,0.8)', position: 'relative' }}>
      {/* Hospital Basement / Offline Vault Sticky Banner */}
      {effectiveOffline && (
        <div
          style={{
            background: 'linear-gradient(135deg, #78350F 0%, #B45309 100%)',
            color: '#FEF3C7',
            padding: '10px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '0.8125rem',
            fontWeight: 700,
            borderBottom: '1px solid rgba(251, 191, 36, 0.4)',
            position: 'sticky',
            top: 0,
            zIndex: 200,
            boxShadow: '0 4px 16px rgba(180, 83, 9, 0.35)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '1.2rem' }}>📶🚫</span>
            <div>
              <div style={{ fontWeight: 800 }}>
                {language === 'hi' ? 'अस्पताल बेसमेंट मोड सक्रिय (Offline Vault)' : 'Hospital Basement Mode Active (Offline Vault)'}
              </div>
              <div style={{ fontSize: '0.6875rem', opacity: 0.9, fontWeight: 500 }}>
                {language === 'hi'
                  ? 'टोकन, क्यूआर पास और पर्चे सुरक्षित ऑफलाइन तिजोरी में उपलब्ध हैं'
                  : 'Token pass, QR & prescriptions remain 100% available offline'}
              </div>
            </div>
          </div>
          {basementSimulated && (
            <button
              type="button"
              onClick={() => setBasementSimulated(false)}
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                border: '1px solid rgba(255, 255, 255, 0.4)',
                color: '#FFFFFF',
                padding: '4px 8px',
                borderRadius: '8px',
                fontSize: '0.6875rem',
                fontWeight: 800,
                cursor: 'pointer'
              }}
            >
              {language === 'hi' ? 'ऑनलाइन लौटें' : 'Go Online'}
            </button>
          )}
        </div>
      )}
      {activeScreen === 'HOME' && (
        <PatientHomeScreen
          language={language}
          onLanguageToggle={handleLanguageToggle}
          patient={currentPatient}
          onNavigate={(screen) => {
            if (screen === 'BOOK') {
              setShowBookModal(true);
            } else {
              setActiveScreen(screen);
            }
          }}
          onSelectPatient={(p) => setCurrentPatient(p)}
        />
      )}

      {activeScreen === 'QUEUE' && (
        <MyTokenQueueScreen
          language={language}
          patient={currentPatient}
          onBack={() => setActiveScreen('HOME')}
        />
      )}

      {activeScreen === 'PARCHI' && (
        <MeriParchiScreen
          language={language}
          onBack={() => setActiveScreen('HOME')}
        />
      )}

      {activeScreen === 'DAWA' && (
        <DawaReminderScreen
          language={language}
          onBack={() => setActiveScreen('HOME')}
        />
      )}

      {activeScreen === 'VIDEO' && (
        <VideoConsultationScreen
          language={language}
          onBack={() => setActiveScreen('HOME')}
        />
      )}

      {activeScreen === 'PROFILE' && (
        <PatientProfileScreen
          language={language}
          onLanguageToggle={handleLanguageToggle}
          patient={currentPatient}
          onSelectPatient={(p) => setCurrentPatient(p)}
          onLogout={handleLogout}
          onBack={() => setActiveScreen('HOME')}
        />
      )}

      {activeScreen === 'MARKETPLACE' && (
        <MeritDoctorMarketplaceScreen
          language={language}
          patient={currentPatient}
          onBack={() => setActiveScreen('HOME')}
          onBookOpdSuccess={(updated) => setCurrentPatient(updated)}
          onLaunchVideoConsult={() => setActiveScreen('VIDEO')}
        />
      )}

      {/* Sticky Native Bottom Navigation Bar */}
      <nav
        style={{
          position: 'fixed',
          bottom: 0,
          left: '50%',
          transform: 'translateX(-50%)',
          width: '100%',
          maxWidth: '480px',
          backgroundColor: '#0F172A',
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          display: 'grid',
          gridTemplateColumns: 'repeat(5, 1fr)',
          padding: '8px 0',
          zIndex: 150,
          boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.6)'
        }}
      >
        <button
          type="button"
          onClick={() => navigateToScreen('HOME')}
          style={{
            background: 'none',
            border: 'none',
            color: activeScreen === 'HOME' ? '#38BDF8' : '#94A3B8',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '4px',
            fontSize: '0.6875rem',
            fontWeight: 800,
            cursor: 'pointer'
          }}
        >
          <span style={{ fontSize: '1.25rem' }}>🏠</span>
          <span>{language === 'hi' ? 'होम' : 'Home'}</span>
        </button>

        <button
          type="button"
          onClick={() => navigateToScreen('QUEUE')}
          style={{
            background: 'none',
            border: 'none',
            color: activeScreen === 'QUEUE' ? '#38BDF8' : '#94A3B8',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '4px',
            fontSize: '0.6875rem',
            fontWeight: 800,
            cursor: 'pointer',
            position: 'relative'
          }}
        >
          <span style={{ fontSize: '1.25rem' }}>🎫</span>
          <span>{language === 'hi' ? 'टोकन' : 'Token'}</span>
          {currentPatient.activeToken && (
            <span
              style={{
                position: 'absolute',
                top: '-2px',
                right: '18px',
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: '#10B981'
              }}
            />
          )}
        </button>

        <button
          type="button"
          onClick={() => navigateToScreen('PARCHI')}
          style={{
            background: 'none',
            border: 'none',
            color: activeScreen === 'PARCHI' ? '#38BDF8' : '#94A3B8',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '4px',
            fontSize: '0.6875rem',
            fontWeight: 800,
            cursor: 'pointer'
          }}
        >
          <span style={{ fontSize: '1.25rem' }}>📄</span>
          <span>{language === 'hi' ? 'पर्ची' : 'Records'}</span>
        </button>

        <button
          type="button"
          onClick={() => navigateToScreen('DAWA')}
          style={{
            background: 'none',
            border: 'none',
            color: activeScreen === 'DAWA' ? '#38BDF8' : '#94A3B8',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '4px',
            fontSize: '0.6875rem',
            fontWeight: 800,
            cursor: 'pointer'
          }}
        >
          <span style={{ fontSize: '1.25rem' }}>💊</span>
          <span>{language === 'hi' ? 'दवा' : 'Dawa'}</span>
        </button>

        <button
          type="button"
          onClick={() => navigateToScreen('PROFILE')}
          style={{
            background: 'none',
            border: 'none',
            color: activeScreen === 'PROFILE' ? '#38BDF8' : '#94A3B8',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '4px',
            fontSize: '0.6875rem',
            fontWeight: 800,
            cursor: 'pointer'
          }}
        >
          <span style={{ fontSize: '1.25rem' }}>👤</span>
          <span>{language === 'hi' ? 'प्रोफाइल' : 'Profile'}</span>
        </button>
      </nav>

      {/* Dynamic Network Sync Reconnection Floating Pill */}
      {showSyncReconnectToast && (
        <div
          role="status"
          aria-live="polite"
          style={{
            position: 'fixed',
            top: '16px',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: '#064E3B',
            border: '1px solid #10B981',
            color: '#D1FAE5',
            padding: '8px 18px',
            borderRadius: '9999px',
            fontSize: '0.75rem',
            fontWeight: 800,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            zIndex: 9999,
            boxShadow: '0 10px 25px -5px rgba(0,0,0,0.5)',
            letterSpacing: '0.2px'
          }}
        >
          <span style={{ fontSize: '0.9rem' }}>🟢</span>
          <span>
            {language === 'hi'
              ? 'इंटरनेट पुनः कनेक्ट हो गया • सभी पर्चे और टोकन सिंक हैं'
              : 'Back Online • Prescriptions & Live Token Synchronized'}
          </span>
        </div>
      )}

      {/* Book OPD Modal */}
      {showBookModal && (
        <BookOpdModal
          language={language}
          patient={currentPatient}
          onClose={() => setShowBookModal(false)}
          onSuccess={(updated) => {
            setCurrentPatient(updated);
            navigateToScreen('QUEUE');
          }}
        />
      )}
    </div>
  );
};
