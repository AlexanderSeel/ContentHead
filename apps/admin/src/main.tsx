import React from 'react';
import ReactDOM from 'react-dom/client';
import { PrimeReactProvider } from 'primereact/api';

import 'primereact/resources/primereact.min.css';
import 'primeicons/primeicons.css';
import 'primeflex/primeflex.css';
import 'graphiql/setup-workers/vite';

import { AdminApp } from './app/AdminApp';
import { UiProvider } from './app/UiContext';
import { initializeIssueCollector } from './lib/issueCollectorBootstrap';
import './styles/layout.css';
import './styles.css';

initializeIssueCollector();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <PrimeReactProvider>
      <UiProvider>
        <AdminApp />
      </UiProvider>
    </PrimeReactProvider>
  </React.StrictMode>
);
