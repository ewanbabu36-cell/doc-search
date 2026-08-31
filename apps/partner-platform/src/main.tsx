import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';
import { ThemeProvider } from '@docsearch/ui-kit';
import { PartnerPlatformShell } from './components/PartnerPlatformShell.js';
import { HospitalStaffLogin, type HospitalStaffUser } from './components/auth/HospitalStaffLogin.js';
import '../../../packages/ui-kit/src/styles/themes.css';
import '../../../packages/ui-kit/src/styles/base.css';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<HospitalStaffUser | null>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('docsearch_partner_staff_auth');
      const token = localStorage.getItem('docsearch_auth_token');
      if (stored && token) {
        try {
          return JSON.parse(stored);
        } catch (e) {}
      }
    }
    return null; // Zero default fake auto-login
  });

  const handleLogin = (user: HospitalStaffUser) => {
    setCurrentUser(user);
    localStorage.setItem('docsearch_partner_staff_auth', JSON.stringify(user));
  };

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem('docsearch_auth_token');
      if (token) {
        await fetch('/api/v1/auth/logout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });
      }
    } catch (e) {
      console.error('Logout error:', e);
    } finally {
      setCurrentUser(null);
      localStorage.removeItem('docsearch_partner_staff_auth');
      localStorage.removeItem('docsearch_auth_token');
      localStorage.removeItem('docsearch_user_session');
    }
  };

  return (
    <ThemeProvider>
      {currentUser ? (
        <PartnerPlatformShell currentUser={currentUser} onLogout={handleLogout} />
      ) : (
        <HospitalStaffLogin onLoginSuccess={handleLogin} />
      )}
    </ThemeProvider>
  );
};

const rootElement = document.getElementById('root');

if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}
