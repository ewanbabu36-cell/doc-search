import React from 'react';
import ReactDOM from 'react-dom/client';
import { ThemeProvider, themes, EwanSystemTrainer, EffectIntensityProvider } from '@docsearch/ui-kit';
import { DocSearchLandingPage } from './components/DocSearchLandingPage.js';
import { LandingI18nProvider } from './i18n/LandingI18nContext.js';
import '../../../packages/ui-kit/src/styles/themes.css';
import '../../../packages/ui-kit/src/styles/base.css';

const rootElement = document.getElementById('root');

if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <ThemeProvider defaultTheme={themes.AURORA_GLOW}>
        <EffectIntensityProvider initialIntensity="command">
          <LandingI18nProvider>
            <DocSearchLandingPage />
            <EwanSystemTrainer currentPlatform="LANDING_PAGE" />
          </LandingI18nProvider>
        </EffectIntensityProvider>
      </ThemeProvider>
    </React.StrictMode>
  );
}
