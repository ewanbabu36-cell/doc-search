import React, { createContext, useContext, useState, useEffect } from 'react';

export interface WhiteLabelConfig {
  hospitalName: string;
  brandTagline: string;
  logoUrl: string;
  primaryColorHex: string;
  accentColorHex: string;
  customCnameDomain: string;
  sslStatus: 'PROVISIONED_ACTIVE' | 'PENDING_DNS_VERIFICATION';
  smsSenderId: string;
  supportEmail: string;
  isPublished: boolean;
  applyToShell: boolean;
}

export const DEFAULT_WHITE_LABEL: WhiteLabelConfig = {
  hospitalName: 'DocSearch Healthcare Platform',
  brandTagline: 'Empowering Healthcare Excellence',
  logoUrl: '',
  primaryColorHex: '#0284C7',
  accentColorHex: '#38BDF8',
  customCnameDomain: 'portal.docsearch.health',
  sslStatus: 'PROVISIONED_ACTIVE',
  smsSenderId: 'DOCSRH',
  supportEmail: 'support@docsearch.health',
  isPublished: false,
  applyToShell: false
};

interface GlobalWhiteLabelContextType {
  whiteLabelConfig: WhiteLabelConfig;
  updateWhiteLabel: (c: Partial<WhiteLabelConfig>) => void;
  toggleShellApplication: (enabled: boolean) => void;
}

const GlobalWhiteLabelContext = createContext<GlobalWhiteLabelContextType | undefined>(undefined);

export const GlobalWhiteLabelProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [whiteLabelConfig, setWhiteLabelConfig] = useState<WhiteLabelConfig>(() => {
    try {
      const saved = localStorage.getItem('ds_whitelabel_config');
      if (saved) return JSON.parse(saved);
    } catch {}
    return DEFAULT_WHITE_LABEL;
  });

  useEffect(() => {
    try {
      localStorage.setItem('ds_whitelabel_config', JSON.stringify(whiteLabelConfig));
    } catch {}

    if (whiteLabelConfig.applyToShell) {
      document.documentElement.style.setProperty('--ds-color-primary', whiteLabelConfig.primaryColorHex);
    } else {
      document.documentElement.style.removeProperty('--ds-color-primary');
    }
  }, [whiteLabelConfig]);

  const updateWhiteLabel = (updates: Partial<WhiteLabelConfig>) => {
    setWhiteLabelConfig((prev) => ({ ...prev, ...updates }));
  };

  const toggleShellApplication = (enabled: boolean) => {
    setWhiteLabelConfig((prev) => ({ ...prev, applyToShell: enabled }));
  };

  return (
    <GlobalWhiteLabelContext.Provider
      value={{
        whiteLabelConfig,
        updateWhiteLabel,
        toggleShellApplication
      }}
    >
      {children}
    </GlobalWhiteLabelContext.Provider>
  );
};

export const useGlobalWhiteLabel = () => {
  const context = useContext(GlobalWhiteLabelContext);
  if (!context) {
    throw new Error('useGlobalWhiteLabel must be used within GlobalWhiteLabelProvider');
  }
  return context;
};
