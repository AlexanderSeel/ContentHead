import { Outlet } from 'react-router-dom';
import { useState } from 'react';

import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';

export function AdminShell() {
  const [isSecondaryPanelOpen, setIsSecondaryPanelOpen] = useState(false);

  return (
    <main className="admin-layout">
      <Topbar isSecondaryPanelOpen={isSecondaryPanelOpen} onToggleSecondaryPanel={() => setIsSecondaryPanelOpen((prev) => !prev)} />
      <section className="admin-body">
        {isSecondaryPanelOpen ? <Sidebar onClose={() => setIsSecondaryPanelOpen(false)} /> : null}
        <section className="admin-main">
          <div className="admin-content">
            <Outlet />
          </div>
        </section>
      </section>
    </main>
  );
}
