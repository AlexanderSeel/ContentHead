import { Dropdown } from 'primereact/dropdown';
import { Menu } from 'primereact/menu';
import { Button } from 'primereact/button';
import { useMemo, useRef } from 'react';

import { useAdminContext } from '../app/AdminContext';
import { useAuth } from '../app/AuthContext';

export function Topbar() {
  const { username, logout } = useAuth();
  const { sites, siteId, setSiteId, combos, marketCode, localeCode, setMarketCode, setLocaleCode } = useAdminContext();
  const userMenuRef = useRef<Menu>(null);

  const marketOptions = useMemo(
    () => Array.from(new Set(combos.filter((entry) => entry.active).map((entry) => entry.marketCode))),
    [combos]
  );
  const localeOptions = useMemo(
    () =>
      Array.from(
        new Set(combos.filter((entry) => entry.active && entry.marketCode === marketCode).map((entry) => entry.localeCode))
      ),
    [combos, marketCode]
  );

  return (
    <header className="admin-topbar">
      <div className="topbar-brand">ContentHead Studio</div>
      <div className="topbar-controls">
        <Dropdown
          value={siteId}
          options={sites.map((entry) => ({ label: `${entry.id}: ${entry.name}`, value: entry.id }))}
          onChange={(event) => setSiteId(Number(event.value))}
          placeholder="Site"
          className="topbar-control"
          filter
        />
        <Dropdown
          value={marketCode}
          options={marketOptions.map((entry) => ({ label: entry, value: entry }))}
          onChange={(event) => setMarketCode(String(event.value))}
          placeholder="Market"
          className="topbar-control"
          filter
        />
        <Dropdown
          value={localeCode}
          options={localeOptions.map((entry) => ({ label: entry, value: entry }))}
          onChange={(event) => setLocaleCode(String(event.value))}
          placeholder="Locale"
          className="topbar-control"
          filter
        />
        <Menu
          popup
          ref={userMenuRef}
          model={[
            { label: username ?? 'User', disabled: true },
            { label: 'Logout', icon: 'pi pi-sign-out', command: logout }
          ]}
        />
        <Button label={username ?? 'Account'} icon="pi pi-user" onClick={(event) => userMenuRef.current?.toggle(event)} />
      </div>
    </header>
  );
}
