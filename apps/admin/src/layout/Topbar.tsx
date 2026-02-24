import { Dropdown } from 'primereact/dropdown';
import { Menu } from 'primereact/menu';
import { Menubar } from 'primereact/menubar';
import type { MenuItem } from 'primereact/menuitem';
import { Button } from 'primereact/button';
import { AutoComplete } from 'primereact/autocomplete';
import type { MouseEventHandler } from 'react';
import { useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { useAdminContext } from '../app/AdminContext';
import { useAuth } from '../app/AuthContext';
import { useUi } from '../app/UiContext';
import { buildNavAreas, type NavItem } from './Nav';

type SearchOption = {
  label: string;
  to: string;
  group: string;
};

export function Topbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { username, logout } = useAuth();
  const { theme, themes, setTheme } = useUi();
  const { sites, siteId, setSiteId, combos, marketCode, localeCode, setMarketCode, setLocaleCode } =
    useAdminContext();
  const userMenuRef = useRef<Menu>(null);
  const overflowMenuRef = useRef<Menu>(null);
  const [searchValue, setSearchValue] = useState<SearchOption | null>(null);
  const [searchSuggestions, setSearchSuggestions] = useState<SearchOption[]>([]);

  const areas = useMemo(() => buildNavAreas(import.meta.env.DEV), []);
  const searchableRoutes = useMemo<SearchOption[]>(
    () =>
      areas.flatMap((area) =>
        area.items.map((item: NavItem) => ({
          label: item.label,
          to: item.to,
          group: area.label
        }))
      ),
    [areas]
  );
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
      { label: 'Diagnostics', icon: 'pi pi-heart', command: () => navigate('/dev/diagnostics') },
      { label: 'Shortcuts', icon: 'pi pi-keyboard', command: () => navigate('/settings/preferences') },
      { label: 'Help', icon: 'pi pi-question-circle', command: () => navigate('/settings/preferences') }
    ],
    [navigate]
  );

  const userMenuModel = useMemo<MenuItem[]>(
    () => [
      { label: username ?? 'User', disabled: true },
      { label: 'Logout', icon: 'pi pi-sign-out', command: logout }
    ],
    [logout, username]
  );

  return (
    <header className="admin-topbar">
      <div className="topbar-utility">
        <div className="topbar-utility-left">
          <Button className="topbar-brand" label="ContentHead Studio" text onClick={() => navigate('/')} />
          <span className="topbar-global-search">
            <i className="pi pi-search" />
            <AutoComplete
              inputId="topbar-route-search"
              value={searchValue}
              suggestions={searchSuggestions}
              field="label"
              dropdown
              placeholder="Search routes"
              onChange={(event) => setSearchValue((event.value as SearchOption) ?? null)}
              completeMethod={(event) => {
                const query = String(event.query ?? '').toLowerCase().trim();
                setSearchSuggestions(
                  searchableRoutes
                    .filter((entry) =>
                      query.length === 0
                        ? true
                        : `${entry.group} ${entry.label} ${entry.to}`.toLowerCase().includes(query)
                    )
                    .slice(0, 12)
                );
              }}
              onSelect={(event) => {
                const selected = event.value as SearchOption;
                navigate(selected.to);
                setSearchValue(selected);
              }}
              itemTemplate={(item) => (
                <div className="topbar-search-item">
                  <strong>{item?.label ?? ''}</strong>
                  <small>{item?.group ?? ''}</small>
                </div>
              )}
            />
          </span>
        </div>
        <div className="topbar-utility-right">
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
      </div>
      <Menubar model={navModel} />
    </header>
  );
}

function renderMenuItem(
  item: MenuItem,
  options: { className?: string; onClick?: MouseEventHandler<HTMLElement> }
) {
  const showIcon = Boolean(item.icon) && !Array.isArray(item.items);
  return (
    <a className={options.className} onClick={options.onClick}>
      {showIcon ? <span className={`${item.icon} ch-nav-icon`} /> : null}
      <span>{item.label}</span>
    </a>
  );
}
