import { Dropdown } from 'primereact/dropdown';
import { Menu } from 'primereact/menu';
import { Menubar } from 'primereact/menubar';
import { OverlayPanel } from 'primereact/overlaypanel';
import type { MenuItem } from 'primereact/menuitem';
import { Button } from 'primereact/button';
import { useMemo, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { useAdminContext } from '../app/AdminContext';
import { useAuth } from '../app/AuthContext';
import { useUi } from '../app/UiContext';
import { buildNavAreas } from './Nav';

export function Topbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { username, logout } = useAuth();
  const { theme, themes, setTheme } = useUi();
  const { sites, siteId, setSiteId, combos, marketCode, localeCode, setMarketCode, setLocaleCode } =
    useAdminContext();
  const userMenuRef = useRef<Menu>(null);
  const contextMenuRef = useRef<OverlayPanel>(null);

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
  const activeSite = useMemo(
    () => sites.find((entry) => entry.id === siteId) ?? null,
    [siteId, sites]
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
        items: area.items.map((item) => ({
          label: item.label,
          icon: item.icon,
          command: () => navigate(item.to)
        }))
      })),
    [areas, location.pathname, navigate]
  );

  const userMenuModel = useMemo<MenuItem[]>(
    () => [
      { label: username ?? 'User', disabled: true },
      { label: 'Logout', icon: 'pi pi-sign-out', command: logout }
    ],
    [logout, username]
  );

  const start = (
    <Button
      className="topbar-brand"
      icon="pi pi-compass"
      text
      rounded
      tooltip="ContentHead Studio"
      tooltipOptions={{ position: 'bottom' }}
      aria-label="ContentHead Studio"
      onClick={() => navigate('/')}
    />
  );

  const end = (
    <div className="topbar-end-controls">
      <Button
        className="topbar-context-trigger"
        icon="pi pi-sliders-h"
        label={`${activeSite?.id ?? siteId} ${marketCode}/${localeCode}`}
        text
        onClick={(event) => contextMenuRef.current?.toggle(event)}
      />
      <OverlayPanel ref={contextMenuRef} className="topbar-context-panel" dismissable showCloseIcon>
        <div className="topbar-context-grid">
          <label className="topbar-context-field">
            <span>Site</span>
            <Dropdown
              value={siteId}
              options={sites.map((entry) => ({ label: `${entry.id}: ${entry.name}`, value: entry.id }))}
              onChange={(event) => setSiteId(Number(event.value))}
              placeholder="Site"
              className="topbar-control"
              filter
            />
          </label>
          <label className="topbar-context-field">
            <span>Market</span>
            <Dropdown
              value={marketCode}
              options={marketOptions.map((entry) => ({ label: entry, value: entry }))}
              onChange={(event) => setMarketCode(String(event.value))}
              placeholder="Market"
              className="topbar-control"
              filter
            />
          </label>
          <label className="topbar-context-field">
            <span>Locale</span>
            <Dropdown
              value={localeCode}
              options={localeOptions.map((entry) => ({ label: entry, value: entry }))}
              onChange={(event) => setLocaleCode(String(event.value))}
              placeholder="Locale"
              className="topbar-control"
              filter
            />
          </label>
          <label className="topbar-context-field">
            <span>Theme</span>
            <Dropdown
              value={theme}
              options={themes}
              onChange={(event) => setTheme(String(event.value))}
              placeholder="Theme"
              className="topbar-control"
            />
          </label>
        </div>
      </OverlayPanel>
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
