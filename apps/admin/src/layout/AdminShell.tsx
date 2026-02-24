import { Outlet } from 'react-router-dom';

import { Topbar } from './Topbar';

export function AdminShell() {
  return (
    <main className="admin-layout">
      <Topbar />
      <section className="admin-body">
        <section className="admin-main">
          <div className="admin-content">
            <Outlet />
          </div>
        </section>
      </section>
    </main>
  );
}
