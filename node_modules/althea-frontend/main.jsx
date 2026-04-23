import React from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import App from './App.jsx';
import './styles/global.css';
import { I18nProvider } from './contexts/I18nContext.jsx';

const container = document.getElementById('root');

if (container) {
  const root = createRoot(container);
  root.render(
    <React.StrictMode>
      <HashRouter>
        <I18nProvider>
          <App />
        </I18nProvider>
      </HashRouter>
    </React.StrictMode>
  );
}
