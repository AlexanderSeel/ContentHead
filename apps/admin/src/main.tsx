import React from 'react';
import ReactDOM from 'react-dom/client';

import 'primeicons/primeicons.css';
import './styles/tokens.css';
import './styles/components.css';
import './styles/utilities.css';
import 'graphiql/setup-workers/vite';

import { AdminApp } from './app/AdminApp';
import { UiProvider } from './app/UiContext';
import { initializeIssueCollector } from './lib/issueCollectorBootstrap';
import './styles/layout.css';
import './styles.css';

initializeIssueCollector();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <UiProvider>
      <AdminApp />
    </UiProvider>
  </React.StrictMode>
);
