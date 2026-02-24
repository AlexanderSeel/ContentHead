import { Dropdown } from 'primereact/dropdown';
import { Menu } from 'primereact/menu';
import { Menubar } from 'primereact/menubar';
import type { MenuItem } from 'primereact/menuitem';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import type { MouseEventHandler } from 'react';
import { useMemo, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { useAdminContext } from '../app/AdminContext';
import { useAuth } from '../app/AuthContext';
import { useUi } from '../app/UiContext';
import { buildNavAreas } from './Nav';

export function Topbar({
  isSecondaryPanelOpen,
  onToggleSecondaryPanel
}: {
  isSecondaryPanelOpen: boolean;
  onToggleSecondaryPanel: () => void;
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const { username, logout } = useAuth();
  const { theme, themes, setTheme } = useUi();
  const { sites, siteId, setSiteId, combos, marketCode, localeCode, setMarketCode, setLocaleCode } =
    useAdminContext();
  const userMenuRef = useRef<Menu>(null);
  const overflowMenuRef = useRef<Menu>(null);

  const areas = useMemo(() => buildNavAreas(import.meta.env.DEV), []);
  const marketOptions = useMemo(
    () => Array.from(new Set(combos.filter((entry) => entry.active).map((entry) => entry.marketCode))),
    [combos]
  );
  const localeOptions = useMemo(
    () =>
      Array.from(
        new Set(
          combos
            .filter((entry) => entry.active && entry.marketCode === marketCode)
            .map((entry) => entry.localeCode)
        )
      ),
    [combos, marketCode]
  );

  const navModel = useMemo<MenuItem[]>(
    () =>
      areas.map((area) => ({
        label: area.label,
        icon: area.icon,
        className: area.items.some((item) =>
          location.pathname.startsWith(item.matchPrefix ?? item.to)
        )
          ? 'ch-nav-root-active'
          : undefined,
        template: renderMenuItem,
        items: area.items.map((item) => ({
          label: item.label,
          icon: item.icon,
          template: renderMenuItem,
          command: () => navigate(item.to)
        }))
      })),
    [areas, location.pathname, navigate]
  );

  const overflowModel = useMemo<MenuItem[]>(
    () => [
      {
        label: isSecondaryPanelOpen ? 'Hide Sidebar Panel' : 'Show Sidebar Panel',
        icon: isSecondaryPanelOpen ? 'pi pi-angle-left' : 'pi pi-angle-right',
        command: onToggleSecondaryPanel
      },
      { label: 'Diagnostics', icon: 'pi pi-heart', command: () => navigate('/dev/diagnostics') },
      { label: 'Shortcuts', icon: 'pi pi-keyboard', command: () => navigate('/settings/preferences') },
      { label: 'Help', icon: 'pi pi-question-circle', command: () => navigate('/settings/preferences') }
    ],
    [isSecondaryPanelOpen, navigate, onToggleSecondaryPanel]
  );

  const userMenuModel = useMemo<MenuItem[]>(
    () => [
      { label: username ?? 'User', disabled: true },
      { label: 'Logout', icon: 'pi pi-sign-out', command: logout }
    ],
    [logout, username]
  );

  const start = (
    <div className="topbar-start">
      <Button className="topbar-brand" label="ContentHead Studio" text onClick={() => navigate('/')} />
      <span className="topbar-global-search">
        <i className="pi pi-search" />
        <InputText placeholder="Search (coming soon)" disabled />
      </span>
    </div>
  );

  const end = (
    <div className="topbar-end">
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
      <Dropdown
        value={theme}
        options={themes}
        onChange={(event) => setTheme(String(event.value))}
        placeholder="Theme"
        className="topbar-control"
      />
      <Menu popup ref={overflowMenuRef} model={overflowModel} />
      <Button
        icon="pi pi-ellipsis-h"
        text
        aria-label="More tools"
        onClick={(event) => overflowMenuRef.current?.toggle(event)}
      />
      <Menu popup ref={userMenuRef} model={userMenuModel} />
      <Button
        label={username ?? 'Account'}
        icon="pi pi-user"
        onClick={(event) => userMenuRef.current?.toggle(event)}
      />
    </div>
  );

  return (
    <header className="admin-topbar">
      <Menubar model={navModel} start={start} end={end} />
    </header>
  );
}

function renderMenuItem(
  item: MenuItem,
  options: { className?: string; onClick?: MouseEventHandler<HTMLElement> }
) {
  return (
    <a className={options.className} onClick={options.onClick}>
      {item.icon ? <span className={`${item.icon} ch-nav-icon`} /> : null}
      <span>{item.label}</span>
    </a>
  );
}
