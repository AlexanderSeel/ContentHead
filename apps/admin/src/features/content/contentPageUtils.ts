import type { ContentLinkValue } from './fieldRenderers/LinkSelectorDialog';
import type { CompositionArea, ComponentRecord, ComponentInstance } from './contentPageTypes';

// ── JSON helpers ─────────────────────────────────────────────────────────────

export const parseJson = <T,>(value: string, fallback: T): T => {
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
};

export const parseGraphqlErrorCode = (error: unknown): string => {
  const candidate = error as {
    response?: { errors?: Array<{ extensions?: { code?: string } }> };
    failure?: { codes?: string[] };
  };
  const directCode = candidate?.response?.errors?.[0]?.extensions?.code;
  if (typeof directCode === 'string' && directCode.trim()) {
    return directCode;
  }
  const wrappedCode = candidate?.failure?.codes?.[0];
  if (typeof wrappedCode === 'string' && wrappedCode.trim()) {
    return wrappedCode;
  }
  return '';
};

// ── Component serialization ──────────────────────────────────────────────────

export function parseComponentInstances(componentsJson: string): ComponentInstance[] {
  const parsed = parseJson<unknown>(componentsJson, []);
  if (!Array.isArray(parsed)) {
    return [];
  }
  return parsed
    .filter((entry) => entry && typeof entry === 'object' && !Array.isArray(entry))
    .map((entry) => {
      const typed = entry as Record<string, unknown>;
      const props = typed.props;
      return {
        instanceId: typeof typed.instanceId === 'string' ? typed.instanceId : '',
        componentTypeId: typeof typed.componentTypeId === 'string' ? typed.componentTypeId : 'text_block',
        area: typeof typed.area === 'string' && typed.area.trim() ? typed.area : 'main',
        sortOrder: typeof typed.sortOrder === 'number' && Number.isFinite(typed.sortOrder) ? typed.sortOrder : 0,
        props: props && typeof props === 'object' && !Array.isArray(props) ? (props as Record<string, unknown>) : {}
      };
    })
    .filter((entry) => entry.instanceId.length > 0);
}

export function parseLegacyComponentMap(componentsJson: string): Record<string, ComponentRecord> {
  const parsed = parseJson<Record<string, { type?: string; props?: Record<string, unknown> }>>(componentsJson, {});
  const mapped: Record<string, ComponentRecord> = {};
  for (const [id, value] of Object.entries(parsed)) {
    mapped[id] = {
      id,
      type: typeof value?.type === 'string' ? value.type : 'text_block',
      props: value?.props && typeof value.props === 'object' ? value.props : {}
    };
  }
  return mapped;
}

export function componentMapFromInstances(instances: ComponentInstance[]): Record<string, ComponentRecord> {
  const mapped: Record<string, ComponentRecord> = {};
  for (const instance of instances) {
    mapped[instance.instanceId] = {
      id: instance.instanceId,
      type: instance.componentTypeId,
      props: instance.props
    };
  }
  return mapped;
}

export function compositionFromInstances(instances: ComponentInstance[]): { areas: CompositionArea[] } {
  const grouped = new Map<string, Array<{ id: string; sortOrder: number }>>();
  for (const instance of instances) {
    const bucket = grouped.get(instance.area) ?? [];
    bucket.push({ id: instance.instanceId, sortOrder: instance.sortOrder });
    grouped.set(instance.area, bucket);
  }
  return {
    areas: Array.from(grouped.entries()).map(([name, rows]) => ({
      name,
      components: rows.sort((a, b) => a.sortOrder - b.sortOrder).map((entry) => entry.id)
    }))
  };
}

export function serializeComponentInstances(areas: CompositionArea[], componentMap: Record<string, ComponentRecord>): string {
  const instances: ComponentInstance[] = [];
  areas.forEach((area) => {
    area.components.forEach((id, index) => {
      const component = componentMap[id];
      if (!component) {
        return;
      }
      instances.push({
        instanceId: id,
        componentTypeId: component.type,
        area: area.name,
        sortOrder: index,
        props: component.props
      });
    });
  });
  return JSON.stringify(instances);
}

// ── URL / path helpers ───────────────────────────────────────────────────────

export function buildContentEditorUrl(contentItemId: number, marketCode: string, localeCode: string): string {
  return `/content/pages/${contentItemId}?market=${encodeURIComponent(marketCode)}&locale=${encodeURIComponent(localeCode)}`;
}

// ── Status helpers ───────────────────────────────────────────────────────────

export function getItemStatus(item: { currentDraftVersionId?: number | null; currentPublishedVersionId?: number | null } | undefined): 'Draft' | 'Published' | 'New' {
  if (item?.currentDraftVersionId) {
    return 'Draft';
  }
  if (item?.currentPublishedVersionId) {
    return 'Published';
  }
  return 'New';
}

// ── Field path helpers ───────────────────────────────────────────────────────

export function fieldPathToKey(path: string | null): string | null {
  if (!path || !path.startsWith('fields.')) {
    return null;
  }
  return path.slice('fields.'.length);
}

export function parseComponentFieldPath(path: string | null): { componentId: string; key: string } | null {
  const parsed = parseComponentPath(path);
  if (!parsed?.propPath) {
    return null;
  }
  return { componentId: parsed.componentId, key: parsed.propPath };
}

export function parseComponentPath(path: string | null): { componentId: string; propPath: string | null } | null {
  if (!path || !path.startsWith('components.')) {
    return null;
  }
  const parts = path.split('.');
  const componentId = parts[1];
  if (!componentId) {
    return null;
  }
  if (parts.length === 2) {
    return { componentId, propPath: null };
  }
  if (parts.length === 3 && parts[2] === 'props') {
    return { componentId, propPath: null };
  }
  if (parts.length < 4 || parts[2] !== 'props') {
    return null;
  }
  const key = parts.slice(3).join('.');
  if (!key) {
    return null;
  }
  return { componentId, propPath: key };
}

// ── Nested value utilities ───────────────────────────────────────────────────

export function setNestedValue<T>(input: T, path: string, value: unknown): T {
  const parts = path.split('.').filter(Boolean);
  if (parts.length === 0) {
    return input;
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const clone: any = Array.isArray(input)
    ? [...(input as unknown[])]
    : input && typeof input === 'object'
      ? { ...(input as Record<string, unknown>) }
      : {};
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let cursor: any = clone;

  for (let i = 0; i < parts.length - 1; i += 1) {
    const raw = parts[i] ?? '';
    const key: string | number = /^\d+$/.test(raw) ? Number(raw) : raw;
    const current = cursor[key];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let next: any;
    if (Array.isArray(current)) {
      next = [...current];
    } else if (current && typeof current === 'object') {
      next = { ...current };
    } else {
      const nextRaw = parts[i + 1] ?? '';
      next = /^\d+$/.test(nextRaw) ? [] : {};
    }
    cursor[key] = next;
    cursor = next;
  }

  const lastRaw = parts[parts.length - 1] ?? '';
  const lastKey: string | number = /^\d+$/.test(lastRaw) ? Number(lastRaw) : lastRaw;
  cursor[lastKey] = value;
  return clone as T;
}

export function getNestedValue(input: unknown, path: string): unknown {
  const parts = path.split('.').filter(Boolean);
  let cursor: unknown = input;
  for (const part of parts) {
    if (Array.isArray(cursor)) {
      const index = Number(part);
      if (!Number.isFinite(index)) {
        return undefined;
      }
      cursor = cursor[index];
      continue;
    }
    if (cursor && typeof cursor === 'object') {
      cursor = (cursor as Record<string, unknown>)[part];
      continue;
    }
    return undefined;
  }
  return cursor;
}

// ── Type guards ──────────────────────────────────────────────────────────────

export function looksLikeContentLinkValue(value: unknown): value is Partial<ContentLinkValue> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return false;
  }
  const candidate = value as Record<string, unknown>;
  const kind = candidate.kind;
  if (kind === 'internal' || kind === 'external') {
    return true;
  }
  return (
    typeof candidate.url === 'string' ||
    typeof candidate.text === 'string' ||
    typeof candidate.target === 'string' ||
    typeof candidate.contentItemId === 'number' ||
    typeof candidate.routeSlug === 'string'
  );
}

export function sanitizeForAttribute(value: string): string {
  return value.replace(/"/g, '\\"');
}

// ── Metadata helpers ─────────────────────────────────────────────────────────

export function parseTemplateIdFromMetadata(metadataJson: string): number | null {
  try {
    const parsed = JSON.parse(metadataJson) as { templateId?: unknown };
    return typeof parsed.templateId === 'number' ? parsed.templateId : null;
  } catch {
    return null;
  }
}
