import { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import * as Popover from '@radix-ui/react-popover';

import { Button, Select } from '../ui/atoms';
import { useAdminContext } from '../app/AdminContext';
import { useAuth } from '../app/AuthContext';
import { useUi } from '../app/UiContext';
import { buildNavAreas } from './Nav';
import type { NavArea } from './Nav';

function NavAreaDropdown({ area }: { area: NavArea }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const isActive = area.items.some((item) =>
    location.pathname.startsWith(item.matchPrefix ?? item.to)
  );

  return (
    <li className={`p-menuitem${isActive ? ' p-menuitem-active' : ''}`}>
      <Popover.Root open={open} onOpenChange={setOpen}>
        <Popover.Trigger asChild>
          <button type="button" className="p-menuitem-link topbar-nav-trigger">
            {area.icon ? <span className={`p-menuitem-icon ${area.icon}`} aria-hidden /> : null}
            <span className="p-menuitem-text">{area.label}</span>
            <span className="p-submenu-icon pi pi-angle-down" aria-hidden />
          </button>
        </Popover.Trigger>
        <Popover.Portal>
          <Popover.Content className="p-menubar-panel topbar-nav-panel" sideOffset={6} align="start">
            <ul className="p-submenu-list topbar-nav-list">
              {area.items.map((item) => (
                <li key={item.to} className="p-menuitem">
                  <Popover.Close asChild>
                    <button
                      type="button"
                      className="p-menuitem-link"
                      onClick={() => navigate(item.to)}
                    >
                      {item.icon ? <span className={`p-menuitem-icon ${item.icon}`} aria-hidden /> : null}
                      <span className="p-menuitem-text">{item.label}</span>
                    </button>
                  </Popover.Close>
                </li>
              ))}
            </ul>
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>
    </li>
  );
}

export function Topbar() {
  const navigate = useNavigate();
  const { username, logout } = useAuth();
  const { theme, themes, setTheme, layoutPreferences, setLayoutPreferences } = useUi();
  const { sites, siteId, setSiteId, combos, marketCode, localeCode, setMarketCode, setLocaleCode } =
    useAdminContext();

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

  const siteOptions = useMemo(
    () => sites.map((entry) => ({ label: `${entry.id}: ${entry.name}`, value: String(entry.id) })),
    [sites]
  );
  const themeOptions = useMemo(
    () => themes.map((entry) => ({ label: entry.label, value: entry.value })),
    [themes]
  );

  const brandButton = (
    <Button
      className="topbar-brand"
      icon="pi pi-compass"
      text
      rounded
      aria-label="ContentHead Studio"
      onClick={() => navigate('/')}
    />
  );

  const endControls = (
    <div className="topbar-end-controls">
      {/* Quick search */}
      <Popover.Root>
        <Popover.Trigger asChild>
          <Button
            className="topbar-search-toggle"
            icon="pi pi-search"
            rounded
            text
            aria-label="Search"
          />
        </Popover.Trigger>
        <Popover.Portal>
          <Popover.Content className="topbar-search-panel" sideOffset={8} align="end">
            <span className="p-input-icon-left w-full">
              <i className="pi pi-search" aria-hidden />
              <input className="p-inputtext p-component w-full" placeholder="Quick search pages, routes, assets..." />
            </span>
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>

      {/* Context switcher (site / market / locale / theme) */}
      <Popover.Root>
        <Popover.Trigger asChild>
          <Button
            className="topbar-context-trigger"
            icon="pi pi-sliders-h"
            label={`${activeSite?.id ?? siteId} ${marketCode}/${localeCode}`}
            text
          />
        </Popover.Trigger>
        <Popover.Portal>
          <Popover.Content className="topbar-context-panel" sideOffset={8} align="end">
            <div className="topbar-context-grid">
              <label className="topbar-context-field">
                <span>Site</span>
                <Select
                  value={String(siteId)}
                  options={siteOptions}
                  onChange={(v) => { if (v != null) setSiteId(Number(v)); }}
                  className="topbar-control"
                  filter
                />
              </label>
              <label className="topbar-context-field">
                <span>Market</span>
                <Select
                  value={marketCode}
                  options={marketOptions.map((entry) => ({ label: entry, value: entry }))}
                  onChange={(v) => { if (v != null) setMarketCode(v); }}
                  className="topbar-control"
                  filter
                />
              </label>
              <label className="topbar-context-field">
                <span>Locale</span>
                <Select
                  value={localeCode}
                  options={localeOptions.map((entry) => ({ label: entry, value: entry }))}
                  onChange={(v) => { if (v != null) setLocaleCode(v); }}
                  className="topbar-control"
                  filter
                />
              </label>
              <label className="topbar-context-field">
                <span>Theme</span>
                <Select
                  value={theme}
                  options={themeOptions}
                  onChange={(v) => { if (v != null) setTheme(v); }}
                  className="topbar-control"
                  filter
                />
              </label>
            </div>
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>

      {/* Preferences (density) */}
      <Popover.Root>
        <Popover.Trigger asChild>
          <Button
            className="topbar-layout-preferences"
            icon="pi pi-cog"
            text
            aria-label="Layout preferences"
          />
        </Popover.Trigger>
        <Popover.Portal>
          <Popover.Content className="p-menu p-component topbar-popup-menu" sideOffset={8} align="end">
            <ul className="p-menu-list">
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
            </ul>
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>

      {/* Account menu */}
      <Popover.Root>
        <Popover.Trigger asChild>
          <Button
            label={username ?? 'Account'}
            icon="pi pi-user"
          />
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
    </div>
  );

  return (
    <header className="admin-topbar">
      <div className="p-menubar p-component">
        <div className="p-menubar-start">{brandButton}</div>
        <ul className="p-menubar-root-list">
          {areas.map((area) => (
            <NavAreaDropdown key={area.key} area={area} />
          ))}
        </ul>
        <div className="p-menubar-end">{endControls}</div>
      </div>
    </header>
  );
}
