import React from 'react';
import ReactDOM from 'react-dom/client';
import { PrimeReactProvider } from 'primereact/api';

import 'primereact/resources/primereact.min.css';
import 'primeicons/primeicons.css';
import 'primeflex/primeflex.css';

import { AdminApp } from './app/AdminApp';
import { UiProvider } from './app/UiContext';
import './styles/layout.css';
import './styles.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <PrimeReactProvider>
      <UiProvider>
        <AdminApp />
      </UiProvider>
    </PrimeReactProvider>
  </React.StrictMode>
);
