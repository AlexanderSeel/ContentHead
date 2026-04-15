import { useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import * as Popover from '@radix-ui/react-popover';

import { Button } from '../ui/atoms';
import { useAuth } from '../app/AuthContext';
import { useUi } from '../app/UiContext';
import { useNav } from './NavContext';
import { breadcrumbItems } from './routeMeta';
import { HelpIcon } from '../help/HelpIcon';
import { HelpDialog } from '../help/HelpDialog';

function Breadcrumb() {
  const location = useLocation();
  const items = useMemo(() => breadcrumbItems(location.pathname), [location.pathname]);

  return (
    <nav className="topbar-breadcrumb" aria-label="Breadcrumb">
      <ol className="topbar-breadcrumb-list">
        {items.map((item, index) => (
          <li key={index} className="topbar-breadcrumb-item">
            {index > 0 && <span className="topbar-breadcrumb-sep pi pi-angle-right" aria-hidden />}
            <span className="topbar-breadcrumb-label">{item.label}</span>
          </li>
        ))}
      </ol>
    </nav>
  );
}

function UserMenu() {
  const { username, logout } = useAuth();
  const { layoutPreferences, setLayoutPreferences } = useUi();

  return (
    <Popover.Root>
      <Popover.Trigger asChild>
        <Button label={username ?? 'Account'} icon="pi pi-user" />
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content className="p-menu p-component topbar-popup-menu" sideOffset={8} align="end">
          <ul className="p-menu-list">
            <li className="p-menuitem">
              <span className="p-menuitem-link p-disabled">
                <span className="p-menuitem-text">{username ?? 'User'}</span>
              </span>
            </li>
            <li className="p-menuitem-separator" role="separator" />
            <li className="p-menuitem p-menuitem-separator-label">
              <span className="p-menuitem-text">Density</span>
            </li>
            {(['comfortable', 'compact'] as const).map((d) => (
              <li key={d} className="p-menuitem">
                <Popover.Close asChild>
                  <button
                    type="button"
                    className="p-menuitem-link"
                    onClick={() => setLayoutPreferences({ density: d })}
                  >
                    {layoutPreferences.density === d
                      ? <span className="pi pi-check p-menuitem-icon" aria-hidden />
                      : <span className="p-menuitem-icon" />}
                    <span className="p-menuitem-text">{d.charAt(0).toUpperCase() + d.slice(1)}</span>
                  </button>
                </Popover.Close>
              </li>
            ))}
            <li className="p-menuitem-separator" role="separator" />
            <li className="p-menuitem">
              <Popover.Close asChild>
                <button type="button" className="p-menuitem-link" onClick={() => void logout()}>
                  <span className="pi pi-sign-out p-menuitem-icon" aria-hidden />
                  <span className="p-menuitem-text">Logout</span>
                </button>
              </Popover.Close>
            </li>
          </ul>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}

export function Topbar() {
  const { toggleCollapsed } = useNav();
  const [helpVisible, setHelpVisible] = useState(false);

  return (
    <header className="admin-topbar">
      <button
        type="button"
        className="topbar-nav-toggle"
        onClick={toggleCollapsed}
        aria-label="Toggle navigation"
      >
        <span className="pi pi-bars" aria-hidden />
      </button>

      <Breadcrumb />

      <div className="topbar-end-controls">
        <HelpIcon tooltip="Help" onClick={() => setHelpVisible(true)} />
        <UserMenu />
      </div>

      <HelpDialog topicKey={null} visible={helpVisible} onHide={() => setHelpVisible(false)} />
    </header>
  );
}
