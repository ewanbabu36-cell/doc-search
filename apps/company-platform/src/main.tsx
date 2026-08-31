import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';
import { ThemeProvider } from '@docsearch/ui-kit';
import { CompanyShell } from './components/CompanyShell.js';
import { FounderLogin, type FounderAuthUser } from './components/auth/FounderLogin.js';
import '../../../packages/ui-kit/src/styles/themes.css';
import '../../../packages/ui-kit/src/styles/base.css';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<FounderAuthUser | null>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('docsearch_company_founder_auth');
      const token = localStorage.getItem('docsearch_company_token');
      if (stored && token) {
        try {
          return JSON.parse(stored);
        } catch (e) {}
      }
    }
    return null;
  });

  const handleLogin = (user: FounderAuthUser) => {
    setCurrentUser(user);
    localStorage.setItem('docsearch_company_founder_auth', JSON.stringify(user));
  };

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem('docsearch_company_token');
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
      localStorage.removeItem('docsearch_company_founder_auth');
      localStorage.removeItem('docsearch_company_token');
      localStorage.removeItem('docsearch_company_session');
    }
  };

  return (
    <ThemeProvider>
      {currentUser ? (
        <CompanyShell currentUser={currentUser} onLogout={handleLogout} />
      ) : (
        <FounderLogin onLoginSuccess={handleLogin} />
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
