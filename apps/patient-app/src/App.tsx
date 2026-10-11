import React, { useState, useEffect } from 'react';
import { type Language } from './i18n.js';
import { patientApiService, type PatientProfile } from './services/patient-api.js';
import { PatientLoginScreen } from './components/PatientLoginScreen.js';
import { PatientHomeScreen } from './components/PatientHomeScreen.js';
import { MyTokenQueueScreen } from './components/MyTokenQueueScreen.js';
import { MeriParchiScreen } from './components/MeriParchiScreen.js';
import { DawaReminderScreen } from './components/DawaReminderScreen.js';
import { VideoConsultationScreen } from './components/VideoConsultationScreen.js';

export type PatientScreen = 'HOME' | 'QUEUE' | 'PARCHI' | 'DAWA' | 'VIDEO';

export const App: React.FC = () => {
  const [language, setLanguage] = useState<Language>('hi');
  const [currentPatient, setCurrentPatient] = useState<PatientProfile | null>(null);
  const [activeScreen, setActiveScreen] = useState<PatientScreen>('HOME');

  useEffect(() => {
    const p = patientApiService.getCurrentPatient();
    if (p) {
      setCurrentPatient(p);
    }
  }, []);

  const handleLanguageToggle = () => {
    setLanguage((prev) => (prev === 'hi' ? 'en' : 'hi'));
  };

  const handleLogout = () => {
    patientApiService.setPatient(null);
    setCurrentPatient(null);
    setActiveScreen('HOME');
  };

  if (!currentPatient) {
    return (
      <PatientLoginScreen
        language={language}
        onLanguageToggle={handleLanguageToggle}
        onLoginSuccess={(p) => {
          patientApiService.setPatient(p);
          setCurrentPatient(p);
          setActiveScreen('HOME');
        }}
      />
    );
  }

  return (
    <div style={{ maxWidth: '480px', margin: '0 auto', minHeight: '100vh', backgroundColor: '#0B0F19', boxShadow: '0 0 40px rgba(0,0,0,0.8)' }}>
      {activeScreen === 'HOME' && (
        <PatientHomeScreen
          language={language}
          onLanguageToggle={handleLanguageToggle}
          patient={currentPatient}
          onNavigate={(screen) => setActiveScreen(screen)}
          onLogout={handleLogout}
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
    </div>
  );
};
