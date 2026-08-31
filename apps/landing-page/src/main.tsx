import React from 'react';
import ReactDOM from 'react-dom/client';
import { ThemeProvider } from '@docsearch/ui-kit';
import { DocSearchLandingPage } from './components/DocSearchLandingPage.js';
import '../../../packages/ui-kit/src/styles/themes.css';
import '../../../packages/ui-kit/src/styles/base.css';

const rootElement = document.getElementById('root');

if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <ThemeProvider>
        <DocSearchLandingPage />
      </ThemeProvider>
    </React.StrictMode>
  );
}
