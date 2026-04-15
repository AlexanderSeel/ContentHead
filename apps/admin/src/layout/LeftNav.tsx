import { useState, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import * as Popover from '@radix-ui/react-popover';

import { Select } from '../ui/atoms';
import { useAdminContext } from '../app/AdminContext';
import { useUi } from '../app/UiContext';
import { buildNavAreas } from './Nav';
import type { NavArea, NavItem } from './Nav';
import { useNav } from './NavContext';

// ── NavItem ──────────────────────────────────────────────────────────────────

function NavLink({ item, collapsed }: { item: NavItem; collapsed: boolean }) {
  const location = useLocation();
  const navigate = useNavigate();
  const isActive = location.pathname.startsWith(item.matchPrefix ?? item.to);

  return (
    <li className={`leftnav-item${isActive ? ' leftnav-item--active' : ''}`}>
      <button
        type="button"
        className="leftnav-item-link"
        onClick={() => navigate(item.to)}
        title={collapsed ? item.label : undefined}
        aria-current={isActive ? 'page' : undefined}
      >
        {item.icon ? <span className={`leftnav-item-icon ${item.icon}`} aria-hidden /> : null}
        {!collapsed && <span className="leftnav-item-label">{item.label}</span>}
      </button>
    </li>
  );
}

// ── NavGroup ─────────────────────────────────────────────────────────────────

function NavGroup({ area, collapsed }: { area: NavArea; collapsed: boolean }) {
  const location = useLocation();
  const hasActiveItem = area.items.some((item) =>
    location.pathname.startsWith(item.matchPrefix ?? item.to)
  );
  const [open, setOpen] = useState(hasActiveItem);

  if (collapsed) {
    return (
      <li className="leftnav-group leftnav-group--collapsed">
        <Popover.Root>
          <Popover.Trigger asChild>
            <button
              type="button"
              className={`leftnav-group-trigger leftnav-group-trigger--icon-only${hasActiveItem ? ' leftnav-group-trigger--active' : ''}`}
              title={area.label}
              aria-label={area.label}
            >
              <span className={`leftnav-group-icon ${area.icon}`} aria-hidden />
            </button>
          </Popover.Trigger>
          <Popover.Portal>
            <Popover.Content className="leftnav-flyout" side="right" sideOffset={4} align="start">
              <div className="leftnav-flyout-label">{area.label}</div>
              <ul className="leftnav-flyout-list">
                {area.items.map((item) => (
                  <NavLink key={item.to} item={item} collapsed={false} />
                ))}
              </ul>
            </Popover.Content>
          </Popover.Portal>
        </Popover.Root>
      </li>
    );
  }

  return (
    <li className={`leftnav-group${open ? ' leftnav-group--open' : ''}`}>
      <button
        type="button"
        className={`leftnav-group-trigger${hasActiveItem ? ' leftnav-group-trigger--active' : ''}`}
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <span className={`leftnav-group-icon ${area.icon}`} aria-hidden />
        <span className="leftnav-group-label">{area.label}</span>
        <span className={`leftnav-group-chevron pi pi-angle-${open ? 'down' : 'right'}`} aria-hidden />
      </button>
      {open && (
        <ul className="leftnav-group-items">
          {area.items.map((item) => (
            <NavLink key={item.to} item={item} collapsed={false} />
          ))}
        </ul>
      )}
    </li>
  );
}

// ── Context Switcher ─────────────────────────────────────────────────────────

function ContextSwitcher({ collapsed }: { collapsed: boolean }) {
  const { sites, siteId, setSiteId, combos, marketCode, localeCode, setMarketCode, setLocaleCode } =
    useAdminContext();
  const { theme, themes, setTheme } = useUi();

  const siteOptions = useMemo(
    () => sites.map((entry) => ({ label: `${entry.id}: ${entry.name}`, value: String(entry.id) })),
    [sites]
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
  const themeOptions = useMemo(
    () => themes.map((entry) => ({ label: entry.label, value: entry.value })),
    [themes]
  );

  const summary = `${marketCode}/${localeCode}`;

  if (collapsed) {
    return (
      <Popover.Root>
        <Popover.Trigger asChild>
          <button
            type="button"
            className="leftnav-context-trigger leftnav-context-trigger--icon-only"
            title={summary}
            aria-label="Switch context"
          >
            <span className="pi pi-sliders-h" aria-hidden />
          </button>
        </Popover.Trigger>
        <Popover.Portal>
          <Popover.Content className="leftnav-context-panel" side="right" sideOffset={4} align="start">
            <ContextFields
              siteId={siteId}
              siteOptions={siteOptions}
              setSiteId={setSiteId}
              marketCode={marketCode}
              marketOptions={marketOptions}
              setMarketCode={setMarketCode}
              localeCode={localeCode}
              localeOptions={localeOptions}
              setLocaleCode={setLocaleCode}
              theme={theme}
              themeOptions={themeOptions}
              setTheme={setTheme}
            />
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>
    );
  }

  return (
    <div className="leftnav-context-inline">
      <ContextFields
        siteId={siteId}
        siteOptions={siteOptions}
        setSiteId={setSiteId}
        marketCode={marketCode}
        marketOptions={marketOptions}
        setMarketCode={setMarketCode}
        localeCode={localeCode}
        localeOptions={localeOptions}
        setLocaleCode={setLocaleCode}
        theme={theme}
        themeOptions={themeOptions}
        setTheme={setTheme}
      />
    </div>
  );
}

type ContextFieldsProps = {
  siteId: number;
  siteOptions: { label: string; value: string }[];
  setSiteId: (id: number) => void;
  marketCode: string;
  marketOptions: string[];
  setMarketCode: (v: string) => void;
  localeCode: string;
  localeOptions: string[];
  setLocaleCode: (v: string) => void;
  theme: string;
  themeOptions: { label: string; value: string }[];
  setTheme: (v: string) => void;
};

function ContextFields({
  siteId,
  siteOptions,
  setSiteId,
  marketCode,
  marketOptions,
  setMarketCode,
  localeCode,
  localeOptions,
  setLocaleCode,
  theme,
  themeOptions,
  setTheme
}: ContextFieldsProps) {
  return (
    <div className="leftnav-context-grid">
      <label className="leftnav-context-field">
        <span className="leftnav-context-field-label">Site</span>
        <Select
          value={String(siteId)}
          options={siteOptions}
          onChange={(v) => { if (v != null) setSiteId(Number(v)); }}
          className="leftnav-control"
          filter
        />
      </label>
      <label className="leftnav-context-field">
        <span className="leftnav-context-field-label">Market</span>
        <Select
          value={marketCode}
          options={marketOptions.map((entry) => ({ label: entry, value: entry }))}
          onChange={(v) => { if (v != null) setMarketCode(v); }}
          className="leftnav-control"
          filter
        />
      </label>
      <label className="leftnav-context-field">
        <span className="leftnav-context-field-label">Locale</span>
        <Select
          value={localeCode}
          options={localeOptions.map((entry) => ({ label: entry, value: entry }))}
          onChange={(v) => { if (v != null) setLocaleCode(v); }}
          className="leftnav-control"
          filter
        />
      </label>
      <label className="leftnav-context-field">
        <span className="leftnav-context-field-label">Theme</span>
        <Select
          value={theme}
          options={themeOptions}
          onChange={(v) => { if (v != null) setTheme(v); }}
          className="leftnav-control"
          filter
        />
      </label>
    </div>
  );
}

// ── LeftNav ──────────────────────────────────────────────────────────────────

export function LeftNav() {
  const { collapsed, toggleCollapsed } = useNav();
  const navigate = useNavigate();
  const areas = useMemo(() => buildNavAreas(import.meta.env.DEV), []);

  return (
    <nav className={`admin-leftnav${collapsed ? ' admin-leftnav--collapsed' : ''}`} aria-label="Main navigation">
      {/* Brand */}
      <div className="leftnav-brand">
        <button
          type="button"
          className="leftnav-brand-btn"
          onClick={() => navigate('/')}
          aria-label="ContentHead Studio — go to dashboard"
        >
          <span className="pi pi-compass leftnav-brand-icon" aria-hidden />
          {!collapsed && <span className="leftnav-brand-label">ContentHead</span>}
        </button>
      </div>

      {/* Context switcher */}
      <div className="leftnav-context-section">
        <ContextSwitcher collapsed={collapsed} />
      </div>

      <hr className="leftnav-divider" />

      {/* Nav groups */}
      <ul className="leftnav-groups">
        {areas.map((area) => (
          <NavGroup key={area.key} area={area} collapsed={collapsed} />
        ))}
      </ul>

      {/* Collapse toggle */}
      <button
        type="button"
        className="leftnav-collapse-btn"
        onClick={toggleCollapsed}
        aria-label={collapsed ? 'Expand navigation' : 'Collapse navigation'}
        title={collapsed ? 'Expand navigation' : 'Collapse navigation'}
      >
        <span className={`pi pi-angle-${collapsed ? 'right' : 'left'}`} aria-hidden />
        {!collapsed && <span className="leftnav-collapse-label">Collapse</span>}
      </button>
    </nav>
  );
}
