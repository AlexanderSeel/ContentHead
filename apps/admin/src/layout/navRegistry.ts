/**
 * navRegistry — runtime nav item registration for extensions.
 *
 * Extensions can register items either declaratively (via the `menu` field on
 * `AdminExtension`) or imperatively by calling `navRegistry.register()` from
 * their entry point. Both paths feed into `buildNavAreas()` in Nav.ts.
 *
 * All registrations happen eagerly at module-init time (before first render),
 * so `LeftNav` can safely read from `getAll()` in a `useMemo([])`.
 */

export type NavRegistryItem = {
  /** Unique id — prevents duplicate registration. */
  id: string;
  /** Key of an existing NavArea to inject into, or a new area key. */
  areaKey: string;
  /** Label used when creating a new NavArea (ignored if area already exists). */
  areaLabel: string;
  /** Nav item label. */
  label: string;
  /** Route path. */
  to: string;
  /** Prefix used for active-state matching (defaults to `to`). */
  matchPrefix?: string;
  /** PrimeIcons class string, e.g. "pi pi-calendar". Defaults to "pi pi-link". */
  icon?: string;
  /** Lower numbers sort first within their area. Defaults to 100. */
  order?: number;
};

const items: NavRegistryItem[] = [];

export const navRegistry = {
  /**
   * Register a nav item. Idempotent — duplicate `id` values are ignored.
   */
  register(item: NavRegistryItem): void {
    if (items.some((i) => i.id === item.id)) return;
    items.push(item);
  },

  /**
   * Returns all registered items sorted by `order` (ascending).
   */
  getAll(): NavRegistryItem[] {
    return [...items].sort((a, b) => (a.order ?? 100) - (b.order ?? 100));
  }
};
