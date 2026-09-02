import React from 'react';
import ReactDOM from 'react-dom/client';
import { ThemeProvider, themes } from '@docsearch/ui-kit';
import { DocSearchLandingPage } from './components/DocSearchLandingPage.js';
import '../../../packages/ui-kit/src/styles/themes.css';
import '../../../packages/ui-kit/src/styles/base.css';

const rootElement = document.getElementById('root');

if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <ThemeProvider defaultTheme={themes.AURORA_GLOW}>
        <DocSearchLandingPage />
      </ThemeProvider>
    </React.StrictMode>
  );
}
