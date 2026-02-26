import { Dropdown } from 'primereact/dropdown';
import { Menu } from 'primereact/menu';
import { Menubar } from 'primereact/menubar';
import { OverlayPanel } from 'primereact/overlaypanel';
import type { MenuItem } from 'primereact/menuitem';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
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
  const { theme, themes, setTheme, layoutPreferences, setLayoutPreferences } = useUi();
  const { sites, siteId, setSiteId, combos, marketCode, localeCode, setMarketCode, setLocaleCode } =
    useAdminContext();
  const accountMenuRef = useRef<Menu>(null);
  const preferencesMenuRef = useRef<Menu>(null);
  const contextMenuRef = useRef<OverlayPanel>(null);
  const quickSearchRef = useRef<OverlayPanel>(null);

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

  const preferenceMenuModel = useMemo<MenuItem[]>(
    () => [
      {
        label: 'Density',
        items: [
          {
            label: 'Comfortable',
            icon: layoutPreferences.density === 'comfortable' ? 'pi pi-check' : undefined,
            command: () => setLayoutPreferences({ density: 'comfortable' })
          },
          {
            label: 'Compact',
            icon: layoutPreferences.density === 'compact' ? 'pi pi-check' : undefined,
            command: () => setLayoutPreferences({ density: 'compact' })
          }
        ]
      }
    ],
    [layoutPreferences.density, setLayoutPreferences]
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
        className="topbar-search-toggle"
        icon="pi pi-search"
        rounded
        text
        aria-label="Search"
        onClick={(event) => quickSearchRef.current?.toggle(event)}
      />
      <OverlayPanel ref={quickSearchRef} className="topbar-search-panel" dismissable>
        <span className="p-input-icon-left w-full">
          <i className="pi pi-search" />
          <InputText className="w-full" placeholder="Quick search pages, routes, assets..." />
        </span>
      </OverlayPanel>
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
              optionLabel="label"
              optionValue="value"
              onChange={(event) => setTheme(String(event.value))}
              placeholder="Theme"
              className="topbar-control"
              filter
            />
          </label>
        </div>
      </OverlayPanel>
      <Menu popup model={preferenceMenuModel} ref={preferencesMenuRef} />
      <Button
        className="topbar-layout-preferences"
        icon="pi pi-cog"
        text
        aria-label="Layout preferences"
        onClick={(event) => preferencesMenuRef.current?.toggle(event)}
      />
      <Menu popup ref={accountMenuRef} model={userMenuModel} />
      <Button
        label={username ?? 'Account'}
        icon="pi pi-user"
        onClick={(event) => accountMenuRef.current?.toggle(event)}
      />
    </div>
  );

  return (
    <header className="admin-topbar">
      <Menubar model={navModel} start={start} end={end} />
    </header>
  );
}
