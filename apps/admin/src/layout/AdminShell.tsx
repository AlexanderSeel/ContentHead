import { Outlet } from 'react-router-dom';

import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';

export function AdminShell() {
  return (
    <main className="admin-layout">
      <Sidebar showDevTools={import.meta.env.DEV} />
      <section className="admin-main">
        <Topbar />
        <div className="admin-content">
          <Outlet />
        </div>
      </section>
    </main>
  );
}
