import { Outlet } from 'react-router-dom';

import { NavProvider } from './NavContext';
import { LeftNav } from './LeftNav';
import { Topbar } from './Topbar';

export function AdminShell() {
  return (
    <NavProvider>
      <div className="admin-layout">
        <LeftNav />
        <div className="admin-main-area">
          <Topbar />
          <div className="admin-body">
            <main className="admin-main">
              <div className="admin-content">
                <Outlet />
              </div>
            </main>
          </div>
        </div>
      </div>
    </NavProvider>
  );
}
