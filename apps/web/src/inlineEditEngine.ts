export type CmsEditKind = 'text' | 'richtext' | 'link' | 'asset' | 'list';
export type CmsEditRole = 'value' | 'label' | 'item';
export type CmsEditCommit = 'enter' | 'ctrl_enter' | 'none';

export type CmsEditMeta = {
  multiline?: boolean;
  maxLen?: number;
  commit?: CmsEditCommit;
  allowHtml?: boolean;
};

export type CmsEditableDataset = {
  contentItemId: number;
  versionId: number;
  fieldPath: string;
  kind: CmsEditKind;
  editTargetId: string;
  metaJson: string;
  componentId?: string;
  componentType?: string;
  role?: CmsEditRole;
};

export type CmsInlineEditMode = 'text' | 'richtext';

export type EditableSelection = {
  editTargetId: string;
  contentItemId: number;
  versionId: number;
  fieldPath?: string;
  componentId?: string;
  componentType?: string;
  mode: CmsInlineEditMode;
};

export function parseEditMeta(raw: string | null | undefined): CmsEditMeta {
  if (!raw) {
    return {};
  }
  try {
    const parsed = JSON.parse(raw) as CmsEditMeta;
    if (!parsed || typeof parsed !== 'object') {
      return {};
    }
    return {
      ...(typeof parsed.multiline === 'boolean' ? { multiline: parsed.multiline } : {}),
      ...(typeof parsed.maxLen === 'number' && Number.isFinite(parsed.maxLen) ? { maxLen: parsed.maxLen } : {}),
      ...(parsed.commit === 'enter' || parsed.commit === 'ctrl_enter' || parsed.commit === 'none' ? { commit: parsed.commit } : {}),
      ...(typeof parsed.allowHtml === 'boolean' ? { allowHtml: parsed.allowHtml } : {})
    };
  } catch {
    return {};
  }
}

export function resolveInlineMode(kind: string | null | undefined): CmsInlineEditMode | null {
  if (kind === 'text' || kind === 'richtext') {
    return kind;
  }
  return null;
}

export function shouldCommit(
  mode: CmsInlineEditMode,
  meta: CmsEditMeta,
  event: { key: string; ctrlKey?: boolean; metaKey?: boolean; shiftKey?: boolean }
): boolean {
  const commitRule = meta.commit ?? (mode === 'richtext' ? 'ctrl_enter' : 'enter');
  if (commitRule === 'none') {
    return false;
  }
  if (event.key !== 'Enter') {
    return false;
  }
  if (commitRule === 'enter') {
    return !event.shiftKey && !event.ctrlKey && !event.metaKey;
  }
  return Boolean(event.ctrlKey || event.metaKey);
}

export function findEditableWrapper(target: EventTarget | Node | Element | null): HTMLElement | null {
  if (!target) {
    return null;
  }
  if (typeof Element !== 'undefined' && target instanceof Element) {
    return target.closest<HTMLElement>('[data-cms-editable="true"]');
  }
  if (typeof Node !== 'undefined' && target instanceof Node) {
    return target.parentElement?.closest<HTMLElement>('[data-cms-editable="true"]') ?? null;
  }
  const maybe = target as { closest?: (selector: string) => HTMLElement | null };
  if (typeof maybe.closest === 'function') {
    return maybe.closest('[data-cms-editable="true"]');
  }
  return null;
}

export function resolveEditableSelection(wrapper: HTMLElement): EditableSelection | null {
  const contentItemId = Number(wrapper.dataset.cmsContentItemId ?? '0');
  const versionId = Number(wrapper.dataset.cmsVersionId ?? '0');
  const kind = wrapper.dataset.cmsEditKind;
  const editTargetId = wrapper.dataset.cmsEditTargetId;
  if (!contentItemId || !versionId || !editTargetId) {
    return null;
  }
  const mode = resolveInlineMode(kind);
  if (!mode) {
    return null;
  }
  return {
    editTargetId,
    contentItemId,
    versionId,
    ...(wrapper.dataset.cmsFieldPath ? { fieldPath: wrapper.dataset.cmsFieldPath } : {}),
    ...(wrapper.dataset.cmsComponentId ? { componentId: wrapper.dataset.cmsComponentId } : {}),
    ...(wrapper.dataset.cmsComponentType ? { componentType: wrapper.dataset.cmsComponentType } : {}),
    mode
  };
}

export function readTargetValue(target: HTMLElement, mode: CmsInlineEditMode): string {
  return mode === 'richtext' ? target.innerHTML : target.textContent ?? '';
}

export function resolveEditTarget(wrapper: HTMLElement): HTMLElement | null {
  const editTargetId = wrapper.dataset.cmsEditTargetId;
  if (!editTargetId) {
    return null;
  }
  const targets = wrapper.querySelectorAll<HTMLElement>('[data-cms-edit-target="true"]');
  for (const target of Array.from(targets)) {
    if (target.dataset.cmsEditTargetId === editTargetId) {
      return target;
    }
  }
  return null;
}

export function buildEditTargetId(input: {
  contentItemId: number;
  versionId: number;
  fieldPath: string;
  kind: CmsEditKind;
  componentId?: string;
  role?: CmsEditRole;
  key?: string;
}): string {
  const parts = [
    String(input.contentItemId),
    String(input.versionId),
    input.componentId?.trim() || 'page',
    input.fieldPath.trim(),
    input.kind,
    input.role ?? 'value',
    input.key ?? '0'
  ];
  return parts
    .join('|')
    .replace(/\s+/g, '_')
    .replace(/[^a-zA-Z0-9_|.-]/g, '_');
}

export function toDataset(input: {
  contentItemId: number;
  versionId: number;
  fieldPath: string;
  kind: CmsEditKind;
  editTargetId: string;
  meta?: CmsEditMeta;
  componentId?: string;
  componentType?: string;
  role?: CmsEditRole;
}): CmsEditableDataset {
  const meta: CmsEditMeta = input.meta ?? {};
  return {
    contentItemId: input.contentItemId,
    versionId: input.versionId,
    fieldPath: input.fieldPath,
    kind: input.kind,
    editTargetId: input.editTargetId,
    metaJson: JSON.stringify(meta),
    ...(input.componentId ? { componentId: input.componentId } : {}),
    ...(input.componentType ? { componentType: input.componentType } : {}),
    ...(input.role ? { role: input.role } : {})
  };
}
