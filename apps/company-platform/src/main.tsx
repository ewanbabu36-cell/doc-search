import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';
import { ThemeProvider, EffectIntensityProvider } from '@docsearch/ui-kit';
import { CompanyShell } from './components/CompanyShell.js';
import { FounderLogin, type FounderAuthUser } from './components/auth/FounderLogin.js';
import '../../../packages/ui-kit/src/styles/themes.css';
import '../../../packages/ui-kit/src/styles/base.css';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<FounderAuthUser | null>(() => {
    if (typeof window !== 'undefined') {
      // Check if token was dispatched from Landing Page SSO Login
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const tokenParam = urlParams.get('token');
        if (tokenParam) {
          localStorage.setItem('docsearch_company_token', tokenParam);
          window.history.replaceState({}, document.title, window.location.pathname);
        }
      } catch (e) {
        console.error('Error parsing token param:', e);
      }

      // Check existing local storage
      const stored = localStorage.getItem('docsearch_company_founder_auth');
      const token = localStorage.getItem('docsearch_company_token');
      if (stored && token && token.includes('.')) {
        try {
          return JSON.parse(stored);
        } catch (e) {}
      }
    }
    return null;
  });

  // Cryptographically verify session with central API gateway
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('docsearch_company_token');
      if (token && token.includes('.')) {
        fetch('/api/v1/auth/me', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
          .then((res) => res.json())
          .then((json) => {
            if (json.success && json.data) {
              const verifiedUser: FounderAuthUser = {
                name: `${json.data.firstName || ''} ${json.data.lastName || ''}`.trim() || json.data.email,
                email: json.data.email,
                role: json.data.roles?.[0] || 'SUPER_ADMIN',
                roleTitle: `${json.data.roles?.[0] || 'Executive'} (Verified Session)`,
                clearanceLevel: 'Executive Access'
              };
              setCurrentUser(verifiedUser);
              localStorage.setItem('docsearch_company_founder_auth', JSON.stringify(verifiedUser));
            } else {
              localStorage.removeItem('docsearch_company_token');
              localStorage.removeItem('docsearch_company_founder_auth');
              localStorage.removeItem('docsearch_company_session');
              setCurrentUser(null);
            }
          })
          .catch(() => {});
      }
    }
  }, []);

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
        <EffectIntensityProvider initialIntensity="command">
          <FounderLogin onLoginSuccess={handleLogin} />
        </EffectIntensityProvider>
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
