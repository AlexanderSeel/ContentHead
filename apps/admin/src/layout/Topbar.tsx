import { BreadCrumb } from 'primereact/breadcrumb';
import { Dropdown } from 'primereact/dropdown';
import { Menu } from 'primereact/menu';
import { Button } from 'primereact/button';
import { useMemo, useRef } from 'react';
import { useLocation } from 'react-router-dom';

import { breadcrumbItems } from './routeMeta';
import { useAdminContext } from '../app/AdminContext';
import { useAuth } from '../app/AuthContext';

export function Topbar() {
  const location = useLocation();
  const { username, logout } = useAuth();
  const { sites, siteId, setSiteId, combos, marketCode, localeCode, setMarketCode, setLocaleCode } = useAdminContext();
  const userMenuRef = useRef<Menu>(null);

  const breadcrumbModel = useMemo(() => breadcrumbItems(location.pathname), [location.pathname]);
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
      <BreadCrumb model={breadcrumbModel} home={{ icon: 'pi pi-home' }} />
      <div className="topbar-controls">
        <Dropdown
          value={siteId}
          options={sites.map((entry) => ({ label: `${entry.id}: ${entry.name}`, value: entry.id }))}
          onChange={(event) => setSiteId(Number(event.value))}
          placeholder="Site"
        />
        <Dropdown
          value={marketCode}
          options={marketOptions.map((entry) => ({ label: entry, value: entry }))}
          onChange={(event) => setMarketCode(String(event.value))}
          placeholder="Market"
        />
        <Dropdown
          value={localeCode}
          options={localeOptions.map((entry) => ({ label: entry, value: entry }))}
          onChange={(event) => setLocaleCode(String(event.value))}
          placeholder="Locale"
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
