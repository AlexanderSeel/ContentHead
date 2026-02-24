import { Dropdown } from 'primereact/dropdown';
import { Menu } from 'primereact/menu';
import { Button } from 'primereact/button';
import { useMemo, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { useAdminContext } from '../app/AdminContext';
import { useAuth } from '../app/AuthContext';
import { useUi } from '../app/UiContext';
import { areaForPath, buildNavAreas } from './Nav';

export function Topbar({ isSecondaryPanelOpen, onToggleSecondaryPanel }: { isSecondaryPanelOpen: boolean; onToggleSecondaryPanel: () => void }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { username, logout } = useAuth();
  const { theme, themes, setTheme } = useUi();
  const { sites, siteId, setSiteId, combos, marketCode, localeCode, setMarketCode, setLocaleCode } = useAdminContext();
  const userMenuRef = useRef<Menu>(null);
  const areas = useMemo(() => buildNavAreas(import.meta.env.DEV), []);
  const currentArea = useMemo(() => areaForPath(location.pathname, areas), [areas, location.pathname]);

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
      <div className="admin-topbar-primary">
        <Button className="topbar-brand" label="ContentHead Studio" text onClick={() => navigate('/')} />
        <div className="topbar-area-selector">
          <span className="topbar-area-label">Area</span>
          <Dropdown
            value={currentArea.key}
            options={areas.map((entry) => ({ label: entry.label, value: entry.key }))}
            onChange={(event) => {
              const selectedArea = areas.find((entry) => entry.key === String(event.value));
              if (!selectedArea?.items[0]) {
                return;
              }
              navigate(selectedArea.items[0].to);
            }}
            className="topbar-control topbar-area-control"
          />
        </div>
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
          <Dropdown
            value={theme}
            options={themes}
            onChange={(event) => setTheme(String(event.value))}
            placeholder="Theme"
            className="topbar-control"
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
      </div>
      <div className="admin-topbar-secondary">
        <div className="topbar-subnav">
          {currentArea.items.map((item) => {
            const selected = location.pathname.startsWith(item.matchPrefix ?? item.to);
            return (
              <Button
                key={`${currentArea.key}-${item.label}`}
                label={item.label}
                size="small"
                text={!selected}
                severity={selected ? 'contrast' : undefined}
                onClick={() => navigate(item.to)}
              />
            );
          })}
        </div>
        <Button
          label={isSecondaryPanelOpen ? 'Hide Panel' : 'Show Panel'}
          icon={isSecondaryPanelOpen ? 'pi pi-angle-left' : 'pi pi-angle-right'}
          size="small"
          text
          onClick={onToggleSecondaryPanel}
        />
      </div>
    </header>
  );
}
