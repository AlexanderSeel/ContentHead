'use client';

import { type FormEvent, type MouseEvent as ReactMouseEvent, type ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import {
  buildLocalizedPath,
  evaluateFieldConditions,
  type FormConditionSet,
  type FormEvaluationContext
} from '@contenthead/shared';
import { CmsEditable } from './CmsEditable';
import { CmsImage as CmsImageView } from './CmsImage';
import {
  findEditableWrapper,
  parseEditMeta,
  readTargetValue,
  resolveEditTarget,
  resolveEditableSelection,
  shouldCommit,
  type CmsEditKind,
  type CmsEditMeta,
  type CmsInlineEditMode
} from '../../src/inlineEditEngine';

type ContentLink = {
  kind?: 'internal' | 'external';
  url?: string;
  contentItemId?: number;
  routeSlug?: string;
  anchor?: string;
  text?: string;
  target?: '_self' | '_blank';
};

type ComponentPayload = {
  type: string;
  props?: Record<string, unknown>;
  [key: string]: unknown;
};

type AreaPayload = {
  name: string;
  components: string[];
};

type FormFieldPayload = {
  id: number;
  stepId?: number | null;
  key: string;
  label: string;
  fieldType: string;
  conditionsJson?: string | null;
  validationsJson?: string | null;
  uiConfigJson?: string | null;
  active: boolean;
};

type FormStepPayload = {
  id: number;
  name: string;
  position?: number | null;
};

type AssetPayload = {
  id: number;
  title?: string | null;
  altText?: string | null;
  description?: string | null;
  pois?: Array<{
    id: string;
    x: number;
    y: number;
    label?: string | null;
    visible?: boolean | null;
    link?: ContentLink | null;
  }> | null;
};

type FieldDef = {
  key: string;
  type: string;
  uiConfig?: Record<string, unknown> | null;
};

type CmsRendererClientProps = {
  contentItemId: number;
  versionId: number;
  siteId?: number;
  marketCode?: string;
  localeCode?: string;
  urlPattern?: string;
  routeSlug?: string;
  fields: Record<string, unknown>;
  fieldDefs?: FieldDef[];
  composition: { areas?: AreaPayload[] };
  components: Record<string, ComponentPayload>;
  cmsBridge: boolean;
  inlineEdit?: boolean;
  forms?: Record<string, { fields: FormFieldPayload[]; steps?: FormStepPayload[] }>;
  assets?: Record<string, AssetPayload>;
  apiBaseUrl?: string;
};

type CmsRect = { top: number; left: number; width: number; height: number };
type CmsActionId = 'replace' | 'open' | 'unlink' | 'manage_items' | 'clear' | 'delete' | 'duplicate' | 'move_up' | 'move_down';
type CmsActionItem = { id: CmsActionId; label: string; primary?: boolean };
type CmsActionsPayload = {
  type: 'CMS_ACTIONS';
  contentItemId: number;
  versionId: number;
  editTargetId?: string;
  componentId?: string;
  fieldPath?: string;
  targetType?: 'text' | 'richtext' | 'asset' | 'link' | 'form' | 'component' | 'unknown';
  actions?: CmsActionItem[];
};
type CmsInlineEditPayload = {
  contentItemId: number;
  versionId: number;
  editTargetId: string;
  fieldPath?: string;
  componentId?: string;
  mode: CmsInlineEditMode;
  value: string;
};

function toRect(element: HTMLElement): CmsRect {
  const rect = element.getBoundingClientRect();
  return {
    top: rect.top,
    left: rect.left,
    width: rect.width,
    height: rect.height
  };
}

function drawOverlay(overlay: HTMLDivElement, element: HTMLElement | null, color: string, fill: string): void {
  if (!element) {
    overlay.style.display = 'none';
    return;
  }

  const rect = element.getBoundingClientRect();
  overlay.style.display = 'block';
  overlay.style.top = `${rect.top}px`;
  overlay.style.left = `${rect.left}px`;
  overlay.style.width = `${rect.width}px`;
  overlay.style.height = `${rect.height}px`;
  overlay.style.borderColor = color;
  overlay.style.background = fill;
}

function findByBridgeSelector(editTargetId?: string, componentId?: string, fieldPath?: string): HTMLElement | null {
  if (editTargetId) {
    const target = document.querySelector<HTMLElement>(`[data-cms-editable="true"][data-cms-edit-target-id="${editTargetId}"]`);
    if (target) {
      return target;
    }
  }
  if (fieldPath) {
    const field = document.querySelector<HTMLElement>(`[data-cms-editable="true"][data-cms-field-path="${fieldPath}"]`);
    if (field) {
      return field;
    }
  }
  if (componentId) {
    return document.querySelector<HTMLElement>(`[data-cms-editable="true"][data-cms-component-id="${componentId}"]`);
  }
  return null;
}

function normalizeType(type: string): string {
  return type.trim().toLowerCase().replace(/component$/i, '').replace(/\s+/g, '_');
}

function focusEditableTarget(target: HTMLElement): void {
  target.setAttribute('tabindex', '-1');
  target.focus();
  if (document.activeElement !== target) {
    target.focus({ preventScroll: true });
  }
  const selection = window.getSelection();
  if (!selection) {
    return;
  }
  const range = document.createRange();
  range.selectNodeContents(target);
  range.collapse(false);
  selection.removeAllRanges();
  selection.addRange(range);
}

function insertTextAtSelection(target: HTMLElement, text: string): void {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) {
    target.append(document.createTextNode(text));
    focusEditableTarget(target);
    return;
  }
  let range = selection.getRangeAt(0);
  if (!target.contains(range.startContainer)) {
    focusEditableTarget(target);
    const refreshed = window.getSelection();
    if (!refreshed || refreshed.rangeCount === 0) {
      target.append(document.createTextNode(text));
      return;
    }
    range = refreshed.getRangeAt(0);
  }
  range.deleteContents();
  const node = document.createTextNode(text);
  range.insertNode(node);
  range.setStartAfter(node);
  range.collapse(true);
  selection.removeAllRanges();
  selection.addRange(range);
}

function emitSelect(target: HTMLElement) {
  const contentItemId = Number(target.dataset.cmsContentItemId ?? '0');
  const versionId = Number(target.dataset.cmsVersionId ?? '0');
  const payload = {
    type: 'CMS_SELECT',
    contentItemId,
    versionId,
    editTargetId: target.dataset.cmsEditTargetId,
    editKind: target.dataset.cmsEditKind,
    editRole: target.dataset.cmsEditRole,
    componentId: target.dataset.cmsComponentId,
    componentType: target.dataset.cmsComponentType,
    fieldPath: target.dataset.cmsFieldPath,
    rect: toRect(target)
  };

  if (window.parent && window.parent !== window) {
    window.parent.postMessage(payload, '*');
  }
}

function emitActionRequest(
  mode: 'list' | 'run',
  target: HTMLElement,
  action?: CmsActionId
) {
  const contentItemId = Number(target.dataset.cmsContentItemId ?? '0');
  const versionId = Number(target.dataset.cmsVersionId ?? '0');
  if (!window.parent || window.parent === window) {
    return;
  }
  window.parent.postMessage(
    {
      type: 'CMS_ACTION_REQUEST',
      mode,
      ...(action ? { action } : {}),
      contentItemId,
      versionId,
      editTargetId: target.dataset.cmsEditTargetId,
      editKind: target.dataset.cmsEditKind,
      editRole: target.dataset.cmsEditRole,
      editMeta: target.dataset.cmsEditMeta,
      componentId: target.dataset.cmsComponentId,
      componentType: target.dataset.cmsComponentType,
      fieldPath: target.dataset.cmsFieldPath
    },
    '*'
  );
}

function normalizeRouteSlugFromUrl(rawUrl: string): { slug: string; anchor: string } {
  const trimmed = rawUrl.trim();
  if (!trimmed) {
    return { slug: '', anchor: '' };
  }
  const [pathPartRaw, anchorPart] = trimmed.split('#', 2);
  const pathPart = pathPartRaw ?? '';
  const pathOnly = pathPart.split('?')[0] ?? '';
  const cleanedPath = pathOnly
    .replace(/^\/+/, '')
    .replace(/\/+$/, '');
  const segments = cleanedPath ? cleanedPath.split('/').filter(Boolean) : [];
  if (
    segments.length >= 2 &&
    /^[A-Z]{2}$/.test(segments[0] ?? '') &&
    /^[a-z]{2}-[A-Z]{2}$/.test(segments[1] ?? '')
  ) {
    return {
      slug: segments.slice(2).join('/'),
      anchor: anchorPart?.replace(/^#/, '') ?? ''
    };
  }
  return { slug: cleanedPath, anchor: anchorPart?.replace(/^#/, '') ?? '' };
}

function linkHref(
  link: ContentLink | null | undefined,
  options?: { marketCode: string; localeCode: string; urlPattern: string }
): string {
  if (!link) {
    return '#';
  }
  if (link.kind === 'internal' && options) {
    const explicitSlug =
      typeof link.routeSlug === 'string' && link.routeSlug.trim()
        ? link.routeSlug.trim().replace(/^\/+/, '')
        : '';
    const fromUrl =
      typeof link.url === 'string' && link.url.trim()
        ? normalizeRouteSlugFromUrl(link.url)
        : { slug: '', anchor: '' };
    const chosenSlug = explicitSlug || fromUrl.slug;
    const chosenAnchor =
      typeof link.anchor === 'string' && link.anchor.trim()
        ? link.anchor.trim().replace(/^#/, '')
        : fromUrl.anchor;
    const localized = buildLocalizedPath(
      options.urlPattern,
      options.marketCode,
      options.localeCode,
      chosenSlug
    );
    return chosenAnchor ? `${localized}#${chosenAnchor}` : localized;
  }
  if (link.url) {
    return link.url;
  }
  if (link.contentItemId) {
    return `#content-${link.contentItemId}`;
  }
  return '#';
}

function sanitizeRichTextHtml(
  input: string,
  options: { marketCode: string; localeCode: string; urlPattern: string; apiBaseUrl: string }
): string {
  const html = input || '';
  // Next.js can evaluate client modules during server rendering where DOMParser is not available.
  // Use a conservative string-based fallback to avoid runtime crashes.
  if (typeof DOMParser === 'undefined') {
    return html
      .replace(/<\s*script[\s\S]*?>[\s\S]*?<\s*\/\s*script\s*>/gi, '')
      .replace(/<\s*style[\s\S]*?>[\s\S]*?<\s*\/\s*style\s*>/gi, '')
      .replace(/\son[a-z]+\s*=\s*(['"]).*?\1/gi, '')
      .replace(/\son[a-z]+\s*=\s*[^\s>]+/gi, '')
      .replace(/\s(href|src)\s*=\s*(['"])\s*javascript:[\s\S]*?\2/gi, ' $1="#"');
  }
  const parser = new DOMParser();
  const doc = parser.parseFromString(`<div>${html}</div>`, 'text/html');
  const root = doc.body.firstElementChild;
  if (!root) {
    return '';
  }
  const allowedTags = new Set([
    'a',
    'p',
    'br',
    'strong',
    'em',
    'u',
    's',
    'blockquote',
    'code',
    'pre',
    'ul',
    'ol',
    'li',
    'h1',
    'h2',
    'h3',
    'table',
    'thead',
    'tbody',
    'tr',
    'th',
    'td',
    'img',
    'span',
    'div'
  ]);
  const allowedAttrs = new Set([
    'href',
    'src',
    'target',
    'rel',
    'alt',
    'title',
    'data-cms-link-kind',
    'data-cms-content-item-id',
    'data-cms-route',
    'data-cms-anchor',
    'data-cms-asset-id'
  ]);

  const clean = (node: Node) => {
    if (node.nodeType === Node.ELEMENT_NODE) {
      const element = node as HTMLElement;
      const tag = element.tagName.toLowerCase();
      if (!allowedTags.has(tag)) {
        element.replaceWith(...Array.from(element.childNodes));
        return;
      }
      for (const attr of Array.from(element.attributes)) {
        if (!allowedAttrs.has(attr.name) || attr.name.startsWith('on')) {
          element.removeAttribute(attr.name);
        }
      }
      if (tag === 'a') {
        const kind = element.getAttribute('data-cms-link-kind');
        const route = element.getAttribute('data-cms-route');
        const anchor = element.getAttribute('data-cms-anchor');
        const currentHref = element.getAttribute('href') ?? '';
        if (kind === 'internal') {
          const cleanSlug = (route ?? currentHref).replace(/^\/+/, '').split('#')[0] ?? '';
          const localized = buildLocalizedPath(options.urlPattern, options.marketCode, options.localeCode, cleanSlug);
          element.setAttribute('href', anchor ? `${localized}#${anchor.replace(/^#/, '')}` : localized);
          element.setAttribute('target', '_self');
          element.removeAttribute('rel');
        } else if (element.getAttribute('data-cms-asset-id')) {
          const assetId = element.getAttribute('data-cms-asset-id');
          element.setAttribute('href', `${options.apiBaseUrl}/assets/${assetId}`);
          element.setAttribute('target', '_blank');
          element.setAttribute('rel', 'noreferrer');
        } else {
          if (/^\s*javascript:/i.test(currentHref)) {
            element.setAttribute('href', '#');
          }
          if (element.getAttribute('target') === '_blank') {
            element.setAttribute('rel', 'noreferrer');
          }
        }
      }
      if (tag === 'img') {
        const assetId = element.getAttribute('data-cms-asset-id');
        const src = element.getAttribute('src') ?? '';
        if (assetId) {
          element.setAttribute('src', `${options.apiBaseUrl}/assets/${assetId}/rendition/medium`);
        } else if (/^\s*javascript:/i.test(src)) {
          element.removeAttribute('src');
        }
      }
    }
    for (const child of Array.from(node.childNodes)) {
      clean(child);
    }
  };
  clean(root);
  return root.innerHTML;
}

function CmsImage({
  assetId,
  asset,
  kind,
  fitMode,
  customWidth,
  presetId,
  showPois,
  altOverride,
  apiBaseUrl,
  marketCode,
  localeCode,
  urlPattern
}: {
  assetId?: number | null;
  asset?: AssetPayload | null;
  kind?: 'thumb' | 'small' | 'medium' | 'large';
  fitMode?: 'cover' | 'contain';
  customWidth?: number;
  presetId?: string;
  showPois?: boolean;
  altOverride?: string;
  apiBaseUrl: string;
  marketCode: string;
  localeCode: string;
  urlPattern: string;
}) {
  return (
    <CmsImageView
      assetId={assetId}
      asset={asset}
      kind={kind}
      fitMode={fitMode}
      customWidth={customWidth}
      presetId={presetId}
      showPois={showPois}
      altOverride={altOverride}
      apiBaseUrl={apiBaseUrl}
      marketCode={marketCode}
      localeCode={localeCode}
      urlPattern={urlPattern}
    />
  );
}

function parseAssetRef(value: unknown): { assetId: number | null; kind?: 'thumb' | 'small' | 'medium' | 'large'; fitMode?: 'cover' | 'contain'; customWidth?: number; presetId?: string; showPois?: boolean } {
  if (typeof value === 'number') {
    return { assetId: value };
  }
  if (!value || typeof value !== 'object') {
    return { assetId: null };
  }
  const rec = value as Record<string, unknown>;
  const kind = rec.renditionKind === 'thumb' || rec.renditionKind === 'small' || rec.renditionKind === 'medium' || rec.renditionKind === 'large'
    ? rec.renditionKind
    : null;
  const fitMode = rec.fitMode === 'contain' ? 'contain' : rec.fitMode === 'cover' ? 'cover' : null;
  const customWidth = typeof rec.customWidth === 'number' ? rec.customWidth : null;
  const presetId = typeof rec.presetId === 'string' && rec.presetId.trim() ? rec.presetId.trim() : null;
  const showPois = typeof rec.showPois === 'boolean' ? rec.showPois : null;
  return {
    assetId: typeof rec.assetId === 'number' ? rec.assetId : null,
    ...(kind ? { kind } : {}),
    ...(fitMode ? { fitMode } : {}),
    ...(customWidth ? { customWidth } : {}),
    ...(presetId ? { presetId } : {}),
    ...(showPois != null ? { showPois } : {})
  };
}

function NewsletterForm({
  editableEnabled,
  siteId,
  marketCode,
  localeCode,
  routeSlug,
  contentItemId,
  versionId,
  componentId,
  componentType,
  formId,
  title,
  description,
  submitLabel,
  steps,
  fields,
  apiBaseUrl
}: {
  editableEnabled: boolean;
  siteId: number;
  marketCode: string;
  localeCode: string;
  routeSlug: string;
  contentItemId: number;
  versionId: number;
  componentId: string;
  componentType: string;
  formId?: number | null;
  title?: string;
  description?: string;
  submitLabel?: string;
  steps: FormStepPayload[];
  fields: FormFieldPayload[];
  apiBaseUrl: string;
}) {
  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const [status, setStatus] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [activeStepIndex, setActiveStepIndex] = useState(0);

  const parsedSteps = useMemo(() => {
    const normalized = (steps ?? [])
      .filter((entry) => typeof entry.id === 'number')
      .sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
    if (normalized.length > 0) {
      return normalized;
    }
    return [{ id: 0, name: 'Step 1', position: 1 }];
  }, [steps]);

  const parsedFields = useMemo(
    () => fields.filter((field) => field.active !== false),
    [fields]
  );

  const evalContext = useMemo<FormEvaluationContext>(
    () => ({
      country: marketCode,
      referrer: typeof document !== 'undefined' ? document.referrer || null : null,
      answers
    }),
    [answers, marketCode]
  );

  const evaluatedFields = useMemo(() => {
    return parsedFields.map((field) => {
      let conditions: FormConditionSet = {};
      try {
        if (field.conditionsJson?.trim()) {
          conditions = JSON.parse(field.conditionsJson) as FormConditionSet;
        }
      } catch {
        conditions = {};
      }
      const behavior = evaluateFieldConditions(conditions, evalContext);
      return { ...field, behavior };
    });
  }, [parsedFields, evalContext]);

  const visibleStepIds = useMemo(() => {
    const ids = new Set<number>();
    for (const field of evaluatedFields) {
      const stepId = typeof field.stepId === 'number' ? field.stepId : parsedSteps[0]?.id ?? 0;
      if (field.behavior.visible) {
        ids.add(stepId);
      }
    }
    return parsedSteps.filter((step) => ids.has(step.id)).map((step) => step.id);
  }, [evaluatedFields, parsedSteps]);

  useEffect(() => {
    if (activeStepIndex >= visibleStepIds.length) {
      setActiveStepIndex(Math.max(visibleStepIds.length - 1, 0));
    }
  }, [activeStepIndex, visibleStepIds.length]);

  const currentStepId = visibleStepIds[activeStepIndex] ?? visibleStepIds[0] ?? parsedSteps[0]?.id ?? 0;
  const currentFields = evaluatedFields.filter((field) => {
    const stepId = typeof field.stepId === 'number' ? field.stepId : parsedSteps[0]?.id ?? 0;
    return stepId === currentStepId && field.behavior.visible;
  });
  const fieldPath = (suffix: string) => `components.${componentId}.props.${suffix}`;

  const parseUiConfig = (field: FormFieldPayload): Record<string, unknown> => {
    try {
      if (field.uiConfigJson?.trim()) {
        const parsed = JSON.parse(field.uiConfigJson);
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
          return parsed as Record<string, unknown>;
        }
      }
    } catch {
      // ignore invalid config
    }
    return {};
  };

  const renderFieldInput = (field: FormFieldPayload & { behavior: { enabled: boolean; required: boolean } }) => {
    const uiConfig = parseUiConfig(field);
    const disabled = !field.behavior.enabled;
    const required = field.behavior.required;
    const placeholder = typeof uiConfig.placeholder === 'string' ? uiConfig.placeholder : undefined;
    const value = answers[field.key];

    if (field.fieldType === 'checkbox' || field.fieldType === 'boolean') {
      return (
        <input
          type="checkbox"
          checked={Boolean(value)}
          disabled={disabled}
          onChange={(event) => setAnswers((prev) => ({ ...prev, [field.key]: event.target.checked }))}
        />
      );
    }

    if (field.fieldType === 'multiselect') {
      const options = Array.isArray(uiConfig.options)
        ? uiConfig.options
            .filter((entry) => entry && typeof entry === 'object')
            .map((entry) => {
              const typed = entry as Record<string, unknown>;
              return {
                label: String(typed.label ?? typed.value ?? ''),
                value: String(typed.value ?? '')
              };
            })
            .filter((entry) => entry.value)
        : [];
      const selected = Array.isArray(value) ? value.map((entry) => String(entry)) : [];
      return (
        <select
          multiple
          value={selected}
          disabled={disabled}
          required={required}
          onChange={(event) => {
            const selectedValues = Array.from(event.target.selectedOptions).map((option) => option.value);
            setAnswers((prev) => ({ ...prev, [field.key]: selectedValues }));
          }}
        >
          {options.map((option) => (
            <option key={`${field.key}-${option.value}`} value={option.value}>{option.label}</option>
          ))}
        </select>
      );
    }

    if (field.fieldType === 'select') {
      const options = Array.isArray(uiConfig.options)
        ? uiConfig.options
            .filter((entry) => entry && typeof entry === 'object')
            .map((entry) => {
              const typed = entry as Record<string, unknown>;
              return {
                label: String(typed.label ?? typed.value ?? ''),
                value: String(typed.value ?? '')
              };
            })
            .filter((entry) => entry.value)
        : [];
      return (
        <select
          value={typeof value === 'string' ? value : ''}
          disabled={disabled}
          required={required}
          onChange={(event) => setAnswers((prev) => ({ ...prev, [field.key]: event.target.value }))}
        >
          <option value="">Select</option>
          {options.map((option) => (
            <option key={`${field.key}-${option.value}`} value={option.value}>{option.label}</option>
          ))}
        </select>
      );
    }

    if (field.fieldType === 'textarea' || field.fieldType === 'multiline') {
      return (
        <textarea
          value={typeof value === 'string' ? value : ''}
          disabled={disabled}
          required={required}
          placeholder={placeholder}
          onChange={(event) => setAnswers((prev) => ({ ...prev, [field.key]: event.target.value }))}
        />
      );
    }

    const typeMap: Record<string, string> = {
      email: 'email',
      number: 'number',
      date: 'date',
      datetime: 'datetime-local',
      time: 'time'
    };
    const inputType = typeMap[field.fieldType] ?? 'text';

    return (
      <input
        type={inputType}
        value={typeof value === 'string' || typeof value === 'number' ? String(value) : ''}
        disabled={disabled}
        required={required}
        placeholder={placeholder}
        onChange={(event) => setAnswers((prev) => ({ ...prev, [field.key]: event.target.value }))}
      />
    );
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!formId) {
      setStatus('No form connected.');
      return;
    }
    setStatus('');
    setFieldErrors({});

    const requiredMissing = currentFields
      .filter((field) => field.behavior.required)
      .filter((field) => {
        const value = answers[field.key];
        if (Array.isArray(value)) {
          return value.length === 0;
        }
        return value == null || value === '';
      });
    if (requiredMissing.length > 0) {
      const mapped = Object.fromEntries(requiredMissing.map((field) => [field.key, 'Required field is missing']));
      setFieldErrors(mapped);
      setStatus('Please complete required fields.');
      return;
    }

    if (activeStepIndex < visibleStepIds.length - 1) {
      setActiveStepIndex((prev) => prev + 1);
      return;
    }

    const body = {
      query:
        'mutation SubmitForm($siteId:Int!,$formId:Int!,$marketCode:String!,$localeCode:String!,$pageContentItemId:Int,$pageRouteSlug:String,$submittedByUserId:String,$answersJson:String!,$contextJson:String,$metaJson:String){ submitForm(siteId:$siteId,formId:$formId,marketCode:$marketCode,localeCode:$localeCode,pageContentItemId:$pageContentItemId,pageRouteSlug:$pageRouteSlug,submittedByUserId:$submittedByUserId,answersJson:$answersJson,contextJson:$contextJson,metaJson:$metaJson){ id status } }',
      variables: {
        siteId,
        formId,
        marketCode,
        localeCode,
        pageContentItemId: contentItemId || null,
        pageRouteSlug: routeSlug || null,
        submittedByUserId: null,
        answersJson: JSON.stringify(answers),
        contextJson: JSON.stringify({ source: 'web-demo', country: marketCode }),
        metaJson: JSON.stringify({
          source: 'web',
          userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
          referrer: typeof document !== 'undefined' ? document.referrer || null : null
        })
      }
    };

    const response = await fetch(`${apiBaseUrl}/graphql`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body)
    });

    const json = (await response.json()) as {
      data?: { submitForm?: { id: number; status: string } };
      errors?: Array<{ message?: string; extensions?: { errorsJson?: string } }>;
    };

    if (json.errors?.length) {
      const firstError = json.errors[0];
      if (firstError?.extensions?.errorsJson) {
        try {
          const parsed = JSON.parse(firstError.extensions.errorsJson) as Array<{ key: string; message: string }>;
          setFieldErrors(Object.fromEntries(parsed.map((entry) => [entry.key, entry.message])));
          setStatus('Please fix highlighted fields.');
          return;
        } catch {
          // ignore parsing failures
        }
      }
      setStatus(firstError?.message ?? 'Submission failed');
      return;
    }

    const result = json.data?.submitForm;
    if (!result) {
      setStatus('No submission result');
      return;
    }

    setStatus(`Thanks! Submission #${result.id} saved.`);
    setAnswers({});
    setActiveStepIndex(0);
  };

  return (
    <section className="cms-section cms-newsletter">
      <CmsEditable
        enabled={editableEnabled}
        contentItemId={contentItemId}
        versionId={versionId}
        componentId={componentId}
        componentType={componentType}
        fieldPath={fieldPath('title')}
        kind="text"
        wrapperAs="h2"
        value={title ?? 'Newsletter'}
        meta={{ multiline: false, commit: 'enter', allowHtml: false }}
      />
      <CmsEditable
        enabled={editableEnabled}
        contentItemId={contentItemId}
        versionId={versionId}
        componentId={componentId}
        componentType={componentType}
        fieldPath={fieldPath('description')}
        kind="text"
        wrapperAs="p"
        className="cms-muted"
        value={description ?? 'Stay updated with product releases.'}
        meta={{ multiline: true, commit: 'enter', allowHtml: false }}
      />
      <form onSubmit={submit}>
        {visibleStepIds.length > 1 ? (
          <small className="cms-muted">Step {activeStepIndex + 1} of {visibleStepIds.length}</small>
        ) : null}
        {(currentFields.length > 0 ? currentFields : [{
          id: 0, key: 'email', label: 'Email', fieldType: 'email', active: true, behavior: { visible: true, enabled: true, required: true }
        }]).map((field) => (
          <label key={field.id || field.key}>
            <div>{field.label}{field.behavior.required ? ' *' : ''}</div>
            {renderFieldInput(field)}
            {fieldErrors[field.key] ? <small style={{ color: '#dc2626' }}>{fieldErrors[field.key]}</small> : null}
          </label>
        ))}
        <CmsEditable
          enabled={editableEnabled}
          contentItemId={contentItemId}
          versionId={versionId}
          componentId={componentId}
          componentType={componentType}
          fieldPath={fieldPath('submitLabel')}
          kind="text"
          wrapperAs="button"
          className="cms-btn primary"
          wrapperProps={{ type: 'submit' }}
          value={activeStepIndex < visibleStepIds.length - 1 ? 'Continue' : submitLabel ?? 'Submit'}
          meta={{ multiline: false, commit: 'enter', allowHtml: false }}
        />
        {activeStepIndex > 0 ? (
          <button className="cms-btn secondary" type="button" onClick={() => setActiveStepIndex((prev) => Math.max(prev - 1, 0))}>
            Back
          </button>
        ) : null}
      </form>
      {status ? <small className="cms-muted">{status}</small> : null}
    </section>
  );
}

function componentProps(component: ComponentPayload | undefined): Record<string, unknown> {
  if (!component) {
    return {};
  }
  if (component.props && typeof component.props === 'object' && !Array.isArray(component.props)) {
    return component.props;
  }
  const rest = { ...component };
  delete (rest as { type?: unknown }).type;
  return rest;
}

function sectionIdFromProps(props: Record<string, unknown>, fallback?: string): string | undefined {
  const customId = typeof props.sectionId === 'string' ? props.sectionId.trim() : '';
  if (customId) {
    return customId.replace(/^#/, '');
  }
  return fallback;
}

type ScrollCarouselSlide = {
  key: string;
  label: string;
  content: ReactNode;
};

function ScrollSnapCarousel({
  className,
  ariaLabel,
  slides,
  autoplay,
  showArrows,
  showDots
}: {
  className?: string;
  ariaLabel: string;
  slides: ScrollCarouselSlide[];
  autoplay: boolean;
  showArrows: boolean;
  showDots: boolean;
}) {
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const scrollTo = (index: number) => {
    const viewport = viewportRef.current;
    if (!viewport) {
      return;
    }
    const children = Array.from(viewport.children) as HTMLElement[];
    const target = children[index];
    if (!target) {
      return;
    }
    target.scrollIntoView({ behavior: 'smooth', inline: 'start', block: 'nearest' });
  };

  const shift = (direction: -1 | 1) => {
    if (slides.length === 0) {
      return;
    }
    const next = (activeIndex + direction + slides.length) % slides.length;
    scrollTo(next);
  };

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) {
      return;
    }
    const onScroll = () => {
      const children = Array.from(viewport.children) as HTMLElement[];
      if (children.length === 0) {
        setActiveIndex(0);
        return;
      }
      const scrollLeft = viewport.scrollLeft;
      let closest = 0;
      let closestDistance = Number.POSITIVE_INFINITY;
      for (let i = 0; i < children.length; i += 1) {
        const distance = Math.abs(children[i]!.offsetLeft - scrollLeft);
        if (distance < closestDistance) {
          closestDistance = distance;
          closest = i;
        }
      }
      setActiveIndex(closest);
    };
    viewport.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => viewport.removeEventListener('scroll', onScroll);
  }, [slides.length]);

  useEffect(() => {
    if (!autoplay || slides.length <= 1) {
      return;
    }
    const id = window.setInterval(() => {
      const viewport = viewportRef.current;
      if (!viewport) {
        return;
      }
      const children = Array.from(viewport.children) as HTMLElement[];
      if (children.length === 0) {
        return;
      }
      const next = (activeIndex + 1) % children.length;
      children[next]?.scrollIntoView({ behavior: 'smooth', inline: 'start', block: 'nearest' });
    }, 5200);
    return () => window.clearInterval(id);
  }, [activeIndex, autoplay, slides.length]);

  if (slides.length === 0) {
    return <p className="cms-muted">No items configured yet.</p>;
  }

  return (
    <div className={`cms-carousel${className ? ` ${className}` : ''}`}>
      {showArrows ? (
        <div className="cms-carousel-nav">
          <button type="button" className="cms-btn secondary" onClick={() => shift(-1)} aria-label={`Previous ${ariaLabel}`}>
            Previous
          </button>
          <button type="button" className="cms-btn secondary" onClick={() => shift(1)} aria-label={`Next ${ariaLabel}`}>
            Next
          </button>
        </div>
      ) : null}
      <div ref={viewportRef} className="cms-carousel-viewport" role="region" aria-label={ariaLabel}>
        {slides.map((slide, index) => (
          <section
            key={slide.key}
            className="cms-carousel-slide"
            aria-label={slide.label}
            aria-current={activeIndex === index ? 'true' : 'false'}
          >
            {slide.content}
          </section>
        ))}
      </div>
      {showDots && slides.length > 1 ? (
        <div className="cms-carousel-dots" role="tablist" aria-label={`${ariaLabel} pagination`}>
          {slides.map((slide, index) => (
            <button
              key={`dot-${slide.key}`}
              type="button"
              role="tab"
              aria-selected={activeIndex === index}
              aria-label={`Show ${slide.label}`}
              className={`cms-carousel-dot${activeIndex === index ? ' active' : ''}`}
              onClick={() => scrollTo(index)}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function renderComponent(
  siteId: number,
  marketCode: string,
  localeCode: string,
  urlPattern: string,
  routeSlug: string,
  contentItemId: number,
  versionId: number,
  editableEnabled: boolean,
  id: string,
  component: ComponentPayload | undefined,
  allComponents: Record<string, ComponentPayload>,
  forms: Record<string, { fields: FormFieldPayload[]; steps?: FormStepPayload[] }>,
  assets: Record<string, AssetPayload>,
  apiBaseUrl: string
) {
  if (!component) {
    return <div key={id}>Missing component: {id}</div>;
  }

  const componentType = normalizeType(component.type);
  const props = componentProps(component);
  const editableBase = {
    enabled: editableEnabled,
    contentItemId,
    versionId,
    componentId: id,
    componentType: component.type
  } as const;
  const path = (key: string) => `components.${id}.props.${key}`;
  const rootPath = `components.${id}`;

  if (componentType === 'main_menu') {
    const items = Array.isArray(props.items) ? (props.items as Array<Record<string, unknown>>) : [];
    const cta = (props.cta as ContentLink | undefined) ?? null;
    const localeLinks = Array.isArray(props.localeLinks) ? (props.localeLinks as ContentLink[]) : [];
    const brandLink = (props.brandLink as ContentLink | undefined) ?? null;
    const sticky = Boolean(props.sticky ?? true);
    return (
      <CmsEditable
        key={id}
        {...editableBase}
        kind="list"
        role="item"
        fieldPath={rootPath}
        wrapperAs="header"
        className={`cms-site-header${sticky ? ' sticky' : ''}`}
        value={component.type}
        keySuffix="root"
        meta={{ commit: 'none' }}
      >
        <div className="cms-site-header-inner">
          <a
            className="cms-site-brand"
            href={linkHref(brandLink, { marketCode, localeCode, urlPattern })}
            target={brandLink?.target ?? '_self'}
            rel={brandLink?.target === '_blank' ? 'noreferrer' : undefined}
          >
            <CmsEditable
              {...editableBase}
              kind="text"
              fieldPath={path('brandLabel')}
              wrapperAs="span"
              value={String(props.brandLabel ?? 'ContentHead')}
              meta={{ multiline: false, commit: 'enter', allowHtml: false }}
            />
          </a>
          <nav className="cms-site-nav" aria-label="Main">
            {items.map((item, index) => {
              const label = String(item.label ?? `Item ${index + 1}`);
              const description = String(item.description ?? '');
              const itemLink = (item.link as ContentLink | undefined) ?? null;
              const subLinks = Array.isArray(item.subLinks) ? (item.subLinks as ContentLink[]) : [];
              const groupTitle = String(item.groupTitle ?? '');
              if (subLinks.length === 0) {
                return (
                  <a
                    key={`${id}-menu-${index}`}
                    className="cms-site-nav-link"
                    href={linkHref(itemLink, { marketCode, localeCode, urlPattern })}
                    target={itemLink?.target ?? '_self'}
                    rel={itemLink?.target === '_blank' ? 'noreferrer' : undefined}
                  >
                    <CmsEditable
                      {...editableBase}
                      kind="text"
                      fieldPath={path(`items.${index}.label`)}
                      wrapperAs="span"
                      value={label}
                      keySuffix={`menu-item-${index}`}
                      meta={{ multiline: false, commit: 'enter', allowHtml: false }}
                    />
                  </a>
                );
              }
              return (
                <details className="cms-mega-nav-item" key={`${id}-menu-${index}`}>
                  <summary className="cms-site-nav-link">
                    <CmsEditable
                      {...editableBase}
                      kind="text"
                      fieldPath={path(`items.${index}.label`)}
                      wrapperAs="span"
                      value={label}
                      keySuffix={`menu-item-${index}`}
                      meta={{ multiline: false, commit: 'enter', allowHtml: false }}
                    />
                  </summary>
                  <div className="cms-mega-panel">
                    <CmsEditable
                      {...editableBase}
                      kind="text"
                      fieldPath={path(`items.${index}.groupTitle`)}
                      wrapperAs="h4"
                      value={groupTitle || label}
                      keySuffix={`menu-group-title-${index}`}
                      meta={{ multiline: false, commit: 'enter', allowHtml: false }}
                    />
                    <CmsEditable
                      {...editableBase}
                      kind="text"
                      fieldPath={path(`items.${index}.description`)}
                      wrapperAs="p"
                      className="cms-muted"
                      value={description}
                      keySuffix={`menu-group-description-${index}`}
                      meta={{ multiline: true, commit: 'enter', allowHtml: false }}
                    />
                    <div className="cms-grid">
                      {subLinks.map((entry, childIndex) => (
                        <CmsEditable
                          key={`${id}-menu-${index}-${childIndex}`}
                          {...editableBase}
                          kind="link"
                          role="item"
                          fieldPath={path(`items.${index}.subLinks.${childIndex}`)}
                          wrapperAs="a"
                          className="cms-btn secondary"
                          wrapperProps={{
                            href: linkHref(entry, { marketCode, localeCode, urlPattern }),
                            target: entry?.target ?? '_self',
                            rel: entry?.target === '_blank' ? 'noreferrer' : undefined
                          }}
                          value={entry?.text ?? entry?.url ?? 'Learn more'}
                          keySuffix={`menu-group-link-${index}-${childIndex}`}
                          meta={{ commit: 'none' }}
                        />
                      ))}
                    </div>
                  </div>
                </details>
              );
            })}
          </nav>
          <div className="cms-site-actions">
            {localeLinks.map((entry, index) => (
              <CmsEditable
                key={`${id}-locale-${index}`}
                {...editableBase}
                kind="link"
                role="item"
                fieldPath={path(`localeLinks.${index}`)}
                wrapperAs="a"
                className="cms-btn secondary"
                wrapperProps={{
                  href: linkHref(entry, { marketCode, localeCode, urlPattern }),
                  target: entry?.target ?? '_self',
                  rel: entry?.target === '_blank' ? 'noreferrer' : undefined
                }}
                value={entry?.text ?? entry?.url ?? 'Locale'}
                keySuffix={`locale-link-${index}`}
                meta={{ commit: 'none' }}
              />
            ))}
            <CmsEditable
              {...editableBase}
              kind="link"
              fieldPath={path('cta')}
              wrapperAs="a"
              className="cms-btn primary"
              wrapperProps={{
                href: linkHref(cta, { marketCode, localeCode, urlPattern }),
                target: cta?.target ?? '_self',
                rel: cta?.target === '_blank' ? 'noreferrer' : undefined
              }}
              value={cta?.text ?? cta?.url ?? 'Get started'}
              meta={{ commit: 'none' }}
            />
          </div>
        </div>
      </CmsEditable>
    );
  }

  if (componentType === 'anchor_nav') {
    const sections = Array.isArray(props.sections)
      ? (props.sections as Array<{ label?: string; anchorId?: string }>)
      : [];
    const smoothScroll = Boolean(props.smoothScroll ?? true);
    const sticky = Boolean(props.sticky ?? true);
    const onAnchorClick = (event: ReactMouseEvent, anchorId: string) => {
      if (!smoothScroll || !anchorId) {
        return;
      }
      const target = document.getElementById(anchorId.replace(/^#/, ''));
      if (!target) {
        return;
      }
      event.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      window.history.replaceState(null, '', `#${anchorId.replace(/^#/, '')}`);
    };
    return (
      <CmsEditable
        key={id}
        {...editableBase}
        kind="list"
        role="item"
        fieldPath={rootPath}
        wrapperAs="section"
        className={`cms-section cms-anchor-nav${sticky ? ' sticky' : ''}`}
        value={component.type}
        keySuffix="root"
        meta={{ commit: 'none' }}
      >
        <CmsEditable
          {...editableBase}
          kind="text"
          fieldPath={path('title')}
          wrapperAs="p"
          className="cms-anchor-nav-title"
          value={String(props.title ?? 'On this page')}
          meta={{ multiline: false, commit: 'enter', allowHtml: false }}
        />
        <nav className="cms-anchor-nav-links" aria-label="On this page">
          {sections.map((section, index) => {
            const anchorId = String(section.anchorId ?? '').replace(/^#/, '');
            return (
              <CmsEditable
                key={`${id}-anchor-${index}`}
                {...editableBase}
                kind="text"
                role="item"
                fieldPath={path(`sections.${index}.label`)}
                wrapperAs="a"
                className="cms-anchor-nav-link"
                wrapperProps={{
                  href: `#${anchorId}`,
                  onClick: (event: ReactMouseEvent) => onAnchorClick(event, anchorId)
                }}
                value={String(section.label ?? `Section ${index + 1}`)}
                keySuffix={`anchor-label-${index}`}
                meta={{ multiline: false, commit: 'enter', allowHtml: false }}
              />
            );
          })}
        </nav>
      </CmsEditable>
    );
  }

  if (componentType === 'hero' || componentType === 'hero_component') {
    const backgroundAssetSelection = parseAssetRef(props.backgroundAssetRef);
    const primaryCta = (props.primaryCta as ContentLink | undefined) ?? null;
    const secondaryCta = (props.secondaryCta as ContentLink | undefined) ?? null;

    return (
      <CmsEditable
        key={id}
        {...editableBase}
        kind="list"
        role="item"
        fieldPath={rootPath}
        wrapperAs="section"
        className="cms-section cms-hero"
        wrapperProps={{ id: sectionIdFromProps(props, 'hero') }}
        value={component.type}
        keySuffix="root"
        meta={{ commit: 'none' }}
      >
        {backgroundAssetSelection.assetId ? (
          <CmsEditable
            {...editableBase}
            kind="asset"
            fieldPath={path('backgroundAssetRef')}
            wrapperAs="div"
            value={String(backgroundAssetSelection.assetId)}
            style={{ position: 'absolute', inset: 0, opacity: 0.2 }}
            keySuffix="background"
            meta={{ commit: 'none' }}
          >
            <CmsImage
              assetId={backgroundAssetSelection.assetId}
              asset={assets[String(backgroundAssetSelection.assetId)] ?? null}
              kind={backgroundAssetSelection.kind ?? 'large'}
              {...(backgroundAssetSelection.fitMode ? { fitMode: backgroundAssetSelection.fitMode } : {})}
              {...(backgroundAssetSelection.customWidth ? { customWidth: backgroundAssetSelection.customWidth } : {})}
              {...(backgroundAssetSelection.presetId ? { presetId: backgroundAssetSelection.presetId } : {})}
              {...(backgroundAssetSelection.showPois ? { showPois: backgroundAssetSelection.showPois } : {})}
              apiBaseUrl={apiBaseUrl}
              marketCode={marketCode}
              localeCode={localeCode}
              urlPattern={urlPattern}
            />
          </CmsEditable>
        ) : null}
        <div style={{ position: 'relative', zIndex: 1 }}>
          <CmsEditable
            {...editableBase}
            kind="text"
            fieldPath={path('title')}
            wrapperAs="h1"
            value={String(props.title ?? 'Demo hero')}
            meta={{ multiline: false, commit: 'enter', allowHtml: false }}
          />
          <CmsEditable
            {...editableBase}
            kind="text"
            fieldPath={path('subtitle')}
            wrapperAs="p"
            value={String(props.subtitle ?? '')}
            meta={{ multiline: true, commit: 'enter', allowHtml: false }}
          />
          <div className="cms-buttons">
            <CmsEditable
              {...editableBase}
              kind="link"
              fieldPath={path('primaryCta')}
              wrapperAs="a"
              className="cms-btn primary"
              wrapperProps={{
                href: linkHref(primaryCta, { marketCode, localeCode, urlPattern }),
                target: primaryCta?.target ?? '_self',
                rel: primaryCta?.target === '_blank' ? 'noreferrer' : undefined
              }}
              value={primaryCta?.text ?? primaryCta?.url ?? 'Learn more'}
              meta={{ commit: 'none' }}
            />
            <CmsEditable
              {...editableBase}
              kind="link"
              fieldPath={path('secondaryCta')}
              wrapperAs="a"
              className="cms-btn secondary"
              wrapperProps={{
                href: linkHref(secondaryCta, { marketCode, localeCode, urlPattern }),
                target: secondaryCta?.target ?? '_self',
                rel: secondaryCta?.target === '_blank' ? 'noreferrer' : undefined
              }}
              value={secondaryCta?.text ?? secondaryCta?.url ?? 'Learn more'}
              meta={{ commit: 'none' }}
            />
          </div>
        </div>
      </CmsEditable>
    );
  }

  if (componentType === 'feature_grid') {
    const items = Array.isArray(props.items) ? (props.items as Array<Record<string, unknown>>) : [];
    return (
      <CmsEditable
        key={id}
        {...editableBase}
        kind="list"
        role="item"
        fieldPath={rootPath}
        wrapperAs="section"
        className="cms-section"
        wrapperProps={{ id: sectionIdFromProps(props, 'features') }}
        value={component.type}
        keySuffix="root"
        meta={{ commit: 'none' }}
      >
        <CmsEditable
          {...editableBase}
          kind="text"
          fieldPath={path('title')}
          wrapperAs="h2"
          value={String(props.title ?? 'Features')}
          meta={{ multiline: false, commit: 'enter', allowHtml: false }}
        />
        <div className="cms-grid features">
          {items.map((item, index) => {
            const itemRef = typeof item.item === 'string' ? item.item : '';
            const referenced = itemRef ? allComponents[itemRef] : undefined;
            const referencedProps = componentProps(referenced);
            const referencedType = referenced?.type ? normalizeType(referenced.type) : '';
            const icon =
              typeof referencedProps.icon === 'string'
                ? referencedProps.icon
                : typeof item.icon === 'string'
                  ? item.icon
                  : '';
            const title =
              typeof referencedProps.title === 'string'
                ? referencedProps.title
                : typeof item.title === 'string'
                  ? item.title
                  : `Feature ${index + 1}`;
            const description =
              typeof referencedProps.description === 'string'
                ? referencedProps.description
                : typeof item.description === 'string'
                  ? item.description
                  : '';

            return (
              <CmsEditable
                key={`${id}-${index}`}
                {...editableBase}
                kind="list"
                role="item"
                fieldPath={path(`items.${index}`)}
                wrapperAs="article"
                className="cms-card"
                value={`item-${index + 1}`}
                keySuffix={`item-${index}`}
                meta={{ commit: 'none' }}
              >
                <CmsEditable
                  {...editableBase}
                  kind="text"
                  fieldPath={path(`items.${index}.title`)}
                  wrapperAs="h3"
                  value={title}
                  keySuffix={`title-${index}`}
                  meta={{ multiline: false, commit: 'enter', allowHtml: false }}
                />
                {icon ? <i className={`pi ${icon}`} style={{ marginRight: 6 }} /> : null}
                <CmsEditable
                  {...editableBase}
                  kind="text"
                  fieldPath={path(`items.${index}.description`)}
                  wrapperAs="p"
                  className="cms-muted"
                  value={description}
                  keySuffix={`desc-${index}`}
                  meta={{ multiline: true, commit: 'enter', allowHtml: false }}
                />
                {itemRef && referencedType !== 'feature_grid_item' ? (
                  <small className="cms-muted">Unsupported ref type: {referenced?.type ?? 'missing'}</small>
                ) : null}
              </CmsEditable>
            );
          })}
        </div>
      </CmsEditable>
    );
  }

  if (componentType === 'stats_strip') {
    const items = Array.isArray(props.items)
      ? (props.items as Array<{ value?: string; label?: string; suffix?: string }>)
      : [];
    return (
      <CmsEditable
        key={id}
        {...editableBase}
        kind="list"
        role="item"
        fieldPath={rootPath}
        wrapperAs="section"
        className="cms-section cms-stats-strip"
        wrapperProps={{ id: sectionIdFromProps(props, 'stats') }}
        value={component.type}
        keySuffix="root"
        meta={{ commit: 'none' }}
      >
        <CmsEditable
          {...editableBase}
          kind="text"
          fieldPath={path('title')}
          wrapperAs="h2"
          value={String(props.title ?? 'At a glance')}
          meta={{ multiline: false, commit: 'enter', allowHtml: false }}
        />
        <div className="cms-stats-grid">
          {items.map((item, index) => (
            <CmsEditable
              key={`${id}-stat-${index}`}
              {...editableBase}
              kind="list"
              role="item"
              fieldPath={path(`items.${index}`)}
              wrapperAs="article"
              className="cms-card"
              value={`stat-${index + 1}`}
              keySuffix={`stat-${index}`}
              meta={{ commit: 'none' }}
            >
              <div className="cms-stat-value">
                <CmsEditable
                  {...editableBase}
                  kind="text"
                  fieldPath={path(`items.${index}.value`)}
                  wrapperAs="span"
                  value={String(item.value ?? '0')}
                  keySuffix={`stat-value-${index}`}
                  meta={{ multiline: false, commit: 'enter', allowHtml: false }}
                />
                <CmsEditable
                  {...editableBase}
                  kind="text"
                  fieldPath={path(`items.${index}.suffix`)}
                  wrapperAs="span"
                  value={String(item.suffix ?? '')}
                  keySuffix={`stat-suffix-${index}`}
                  meta={{ multiline: false, commit: 'enter', allowHtml: false }}
                />
              </div>
              <CmsEditable
                {...editableBase}
                kind="text"
                fieldPath={path(`items.${index}.label`)}
                wrapperAs="p"
                className="cms-muted"
                value={String(item.label ?? `KPI ${index + 1}`)}
                keySuffix={`stat-label-${index}`}
                meta={{ multiline: false, commit: 'enter', allowHtml: false }}
              />
            </CmsEditable>
          ))}
        </div>
      </CmsEditable>
    );
  }

  if (componentType === 'card_slider') {
    const cards = Array.isArray(props.cards)
      ? (props.cards as Array<Record<string, unknown>>)
      : [];
    const autoplay = Boolean(props.autoplay);
    const showArrows = props.showArrows !== false;
    const showDots = props.showDots !== false;
    return (
      <CmsEditable
        key={id}
        {...editableBase}
        kind="list"
        role="item"
        fieldPath={rootPath}
        wrapperAs="section"
        className="cms-section"
        wrapperProps={{ id: sectionIdFromProps(props, 'highlights') }}
        value={component.type}
        keySuffix="root"
        meta={{ commit: 'none' }}
      >
        <CmsEditable
          {...editableBase}
          kind="text"
          fieldPath={path('title')}
          wrapperAs="h2"
          value={String(props.title ?? 'Highlights')}
          meta={{ multiline: false, commit: 'enter', allowHtml: false }}
        />
        <ScrollSnapCarousel
          ariaLabel={String(props.title ?? 'Highlights')}
          autoplay={autoplay}
          showArrows={showArrows}
          showDots={showDots}
          slides={cards.map((card, index) => {
            const assetSelection = parseAssetRef(card.imageAssetRef);
            const link = (card.link as ContentLink | undefined) ?? null;
            return {
              key: `${id}-card-${index}`,
              label: String(card.title ?? `Card ${index + 1}`),
              content: (
                <CmsEditable
                  {...editableBase}
                  kind="list"
                  role="item"
                  fieldPath={path(`cards.${index}`)}
                  wrapperAs="article"
                  className="cms-card cms-slider-card"
                  value={`card-${index + 1}`}
                  keySuffix={`card-${index}`}
                  meta={{ commit: 'none' }}
                >
                  {assetSelection.assetId ? (
                    <CmsEditable
                      {...editableBase}
                      kind="asset"
                      fieldPath={path(`cards.${index}.imageAssetRef`)}
                      wrapperAs="div"
                      className="cms-slider-image"
                      value={String(assetSelection.assetId)}
                      keySuffix={`card-image-${index}`}
                      meta={{ commit: 'none' }}
                    >
                      <CmsImage
                        assetId={assetSelection.assetId}
                        asset={assets[String(assetSelection.assetId)] ?? null}
                        kind={assetSelection.kind ?? 'medium'}
                        {...(assetSelection.fitMode ? { fitMode: assetSelection.fitMode } : {})}
                        {...(assetSelection.customWidth ? { customWidth: assetSelection.customWidth } : {})}
                        {...(assetSelection.presetId ? { presetId: assetSelection.presetId } : {})}
                        {...(assetSelection.showPois ? { showPois: assetSelection.showPois } : {})}
                        apiBaseUrl={apiBaseUrl}
                        marketCode={marketCode}
                        localeCode={localeCode}
                        urlPattern={urlPattern}
                      />
                    </CmsEditable>
                  ) : null}
                  <CmsEditable
                    {...editableBase}
                    kind="text"
                    fieldPath={path(`cards.${index}.title`)}
                    wrapperAs="h3"
                    value={String(card.title ?? `Card ${index + 1}`)}
                    keySuffix={`card-title-${index}`}
                    meta={{ multiline: false, commit: 'enter', allowHtml: false }}
                  />
                  <CmsEditable
                    {...editableBase}
                    kind="text"
                    fieldPath={path(`cards.${index}.text`)}
                    wrapperAs="p"
                    className="cms-muted"
                    value={String(card.text ?? '')}
                    keySuffix={`card-text-${index}`}
                    meta={{ multiline: true, commit: 'enter', allowHtml: false }}
                  />
                  <CmsEditable
                    {...editableBase}
                    kind="link"
                    fieldPath={path(`cards.${index}.link`)}
                    wrapperAs="a"
                    className="cms-btn primary"
                    wrapperProps={{
                      href: linkHref(link, { marketCode, localeCode, urlPattern }),
                      target: link?.target ?? '_self',
                      rel: link?.target === '_blank' ? 'noreferrer' : undefined
                    }}
                    value={link?.text ?? link?.url ?? 'Read more'}
                    keySuffix={`card-link-${index}`}
                    meta={{ commit: 'none' }}
                  />
                </CmsEditable>
              )
            };
          })}
        />
      </CmsEditable>
    );
  }

  if (componentType === 'testimonials_slider') {
    const items = Array.isArray(props.items)
      ? (props.items as Array<Record<string, unknown>>)
      : [];
    const autoplay = Boolean(props.autoplay ?? true);
    return (
      <CmsEditable
        key={id}
        {...editableBase}
        kind="list"
        role="item"
        fieldPath={rootPath}
        wrapperAs="section"
        className="cms-section"
        wrapperProps={{ id: sectionIdFromProps(props, 'testimonials') }}
        value={component.type}
        keySuffix="root"
        meta={{ commit: 'none' }}
      >
        <CmsEditable
          {...editableBase}
          kind="text"
          fieldPath={path('title')}
          wrapperAs="h2"
          value={String(props.title ?? 'What teams say')}
          meta={{ multiline: false, commit: 'enter', allowHtml: false }}
        />
        <ScrollSnapCarousel
          className="cms-testimonial-carousel"
          ariaLabel={String(props.title ?? 'Testimonials')}
          autoplay={autoplay}
          showArrows
          showDots
          slides={items.map((item, index) => {
            const avatarSelection = parseAssetRef(item.avatarAssetRef);
            return {
              key: `${id}-quote-${index}`,
              label: String(item.name ?? `Quote ${index + 1}`),
              content: (
                <CmsEditable
                  {...editableBase}
                  kind="list"
                  role="item"
                  fieldPath={path(`items.${index}`)}
                  wrapperAs="article"
                  className="cms-card cms-testimonial-card"
                  value={`quote-${index + 1}`}
                  keySuffix={`quote-${index}`}
                  meta={{ commit: 'none' }}
                >
                  <CmsEditable
                    {...editableBase}
                    kind="text"
                    fieldPath={path(`items.${index}.quote`)}
                    wrapperAs="blockquote"
                    value={String(item.quote ?? '')}
                    keySuffix={`quote-text-${index}`}
                    meta={{ multiline: true, commit: 'enter', allowHtml: false }}
                  />
                  <div className="cms-testimonial-meta">
                    {avatarSelection.assetId ? (
                      <CmsEditable
                        {...editableBase}
                        kind="asset"
                        fieldPath={path(`items.${index}.avatarAssetRef`)}
                        wrapperAs="div"
                        value={String(avatarSelection.assetId)}
                        keySuffix={`quote-avatar-${index}`}
                        meta={{ commit: 'none' }}
                      >
                        <CmsImage
                          assetId={avatarSelection.assetId}
                          asset={assets[String(avatarSelection.assetId)] ?? null}
                          kind={avatarSelection.kind ?? 'thumb'}
                          {...(avatarSelection.fitMode ? { fitMode: avatarSelection.fitMode } : {})}
                          {...(avatarSelection.customWidth ? { customWidth: avatarSelection.customWidth } : {})}
                          {...(avatarSelection.presetId ? { presetId: avatarSelection.presetId } : {})}
                          {...(avatarSelection.showPois ? { showPois: avatarSelection.showPois } : {})}
                          apiBaseUrl={apiBaseUrl}
                          marketCode={marketCode}
                          localeCode={localeCode}
                          urlPattern={urlPattern}
                        />
                      </CmsEditable>
                    ) : null}
                    <div>
                      <CmsEditable
                        {...editableBase}
                        kind="text"
                        fieldPath={path(`items.${index}.name`)}
                        wrapperAs="strong"
                        value={String(item.name ?? '')}
                        keySuffix={`quote-name-${index}`}
                        meta={{ multiline: false, commit: 'enter', allowHtml: false }}
                      />
                      <CmsEditable
                        {...editableBase}
                        kind="text"
                        fieldPath={path(`items.${index}.role`)}
                        wrapperAs="p"
                        className="cms-muted"
                        value={String(item.role ?? '')}
                        keySuffix={`quote-role-${index}`}
                        meta={{ multiline: false, commit: 'enter', allowHtml: false }}
                      />
                    </div>
                  </div>
                </CmsEditable>
              )
            };
          })}
        />
      </CmsEditable>
    );
  }

  if (componentType === 'content_teasers') {
    const items = Array.isArray(props.items)
      ? (props.items as Array<Record<string, unknown>>)
      : [];
    return (
      <CmsEditable
        key={id}
        {...editableBase}
        kind="list"
        role="item"
        fieldPath={rootPath}
        wrapperAs="section"
        className="cms-section"
        wrapperProps={{ id: sectionIdFromProps(props, 'resources') }}
        value={component.type}
        keySuffix="root"
        meta={{ commit: 'none' }}
      >
        <CmsEditable
          {...editableBase}
          kind="text"
          fieldPath={path('title')}
          wrapperAs="h2"
          value={String(props.title ?? 'From the resource hub')}
          meta={{ multiline: false, commit: 'enter', allowHtml: false }}
        />
        <CmsEditable
          {...editableBase}
          kind="text"
          fieldPath={path('intro')}
          wrapperAs="p"
          className="cms-muted"
          value={String(props.intro ?? '')}
          meta={{ multiline: true, commit: 'enter', allowHtml: false }}
        />
        <div className="cms-grid features">
          {items.map((item, index) => {
            const assetSelection = parseAssetRef(item.imageAssetRef);
            const link = (item.link as ContentLink | undefined) ?? null;
            return (
              <CmsEditable
                key={`${id}-teaser-${index}`}
                {...editableBase}
                kind="list"
                role="item"
                fieldPath={path(`items.${index}`)}
                wrapperAs="article"
                className="cms-card cms-teaser-card"
                value={`teaser-${index + 1}`}
                keySuffix={`teaser-${index}`}
                meta={{ commit: 'none' }}
              >
                {assetSelection.assetId ? (
                  <CmsEditable
                    {...editableBase}
                    kind="asset"
                    fieldPath={path(`items.${index}.imageAssetRef`)}
                    wrapperAs="div"
                    className="cms-slider-image"
                    value={String(assetSelection.assetId)}
                    keySuffix={`teaser-image-${index}`}
                    meta={{ commit: 'none' }}
                  >
                    <CmsImage
                      assetId={assetSelection.assetId}
                      asset={assets[String(assetSelection.assetId)] ?? null}
                      kind={assetSelection.kind ?? 'small'}
                      {...(assetSelection.fitMode ? { fitMode: assetSelection.fitMode } : {})}
                      {...(assetSelection.customWidth ? { customWidth: assetSelection.customWidth } : {})}
                      {...(assetSelection.presetId ? { presetId: assetSelection.presetId } : {})}
                      {...(assetSelection.showPois ? { showPois: assetSelection.showPois } : {})}
                      apiBaseUrl={apiBaseUrl}
                      marketCode={marketCode}
                      localeCode={localeCode}
                      urlPattern={urlPattern}
                    />
                  </CmsEditable>
                ) : null}
                <CmsEditable
                  {...editableBase}
                  kind="text"
                  fieldPath={path(`items.${index}.tag`)}
                  wrapperAs="small"
                  className="cms-muted"
                  value={String(item.tag ?? '')}
                  keySuffix={`teaser-tag-${index}`}
                  meta={{ multiline: false, commit: 'enter', allowHtml: false }}
                />
                <CmsEditable
                  {...editableBase}
                  kind="text"
                  fieldPath={path(`items.${index}.title`)}
                  wrapperAs="h3"
                  value={String(item.title ?? `Teaser ${index + 1}`)}
                  keySuffix={`teaser-title-${index}`}
                  meta={{ multiline: false, commit: 'enter', allowHtml: false }}
                />
                <CmsEditable
                  {...editableBase}
                  kind="text"
                  fieldPath={path(`items.${index}.summary`)}
                  wrapperAs="p"
                  className="cms-muted"
                  value={String(item.summary ?? '')}
                  keySuffix={`teaser-summary-${index}`}
                  meta={{ multiline: true, commit: 'enter', allowHtml: false }}
                />
                <CmsEditable
                  {...editableBase}
                  kind="link"
                  fieldPath={path(`items.${index}.link`)}
                  wrapperAs="a"
                  className="cms-btn primary"
                  wrapperProps={{
                    href: linkHref(link, { marketCode, localeCode, urlPattern }),
                    target: link?.target ?? '_self',
                    rel: link?.target === '_blank' ? 'noreferrer' : undefined
                  }}
                  value={link?.text ?? link?.url ?? 'Read'}
                  keySuffix={`teaser-link-${index}`}
                  meta={{ commit: 'none' }}
                />
              </CmsEditable>
            );
          })}
        </div>
      </CmsEditable>
    );
  }

  if (componentType === 'image_text') {
    const imageAssetSelection = parseAssetRef(props.imageAssetRef);
    const invert = Boolean(props.invert);
    const cta = (props.cta as ContentLink | undefined) ?? null;
    return (
      <CmsEditable
        key={id}
        {...editableBase}
        kind="list"
        role="item"
        fieldPath={rootPath}
        wrapperAs="section"
        className={`cms-section cms-image-row${invert ? ' invert' : ''}`}
        wrapperProps={{ id: sectionIdFromProps(props) }}
        value={component.type}
        keySuffix="root"
        meta={{ commit: 'none' }}
      >
        <div className="cms-image-wrap">
          <CmsEditable
            {...editableBase}
            kind="asset"
            fieldPath={path('imageAssetRef')}
            wrapperAs="div"
            value={String(imageAssetSelection.assetId ?? '')}
            meta={{ commit: 'none' }}
          >
            <CmsImage
              assetId={imageAssetSelection.assetId}
              asset={imageAssetSelection.assetId ? assets[String(imageAssetSelection.assetId)] ?? null : null}
              kind={imageAssetSelection.kind ?? 'medium'}
              {...(imageAssetSelection.fitMode ? { fitMode: imageAssetSelection.fitMode } : {})}
              {...(imageAssetSelection.customWidth ? { customWidth: imageAssetSelection.customWidth } : {})}
              {...(imageAssetSelection.presetId ? { presetId: imageAssetSelection.presetId } : {})}
              {...(imageAssetSelection.showPois ? { showPois: imageAssetSelection.showPois } : {})}
              apiBaseUrl={apiBaseUrl}
              marketCode={marketCode}
              localeCode={localeCode}
              urlPattern={urlPattern}
            />
          </CmsEditable>
        </div>
        <div>
          <CmsEditable
            {...editableBase}
            kind="text"
            fieldPath={path('title')}
            wrapperAs="h2"
            value={String(props.title ?? '')}
            meta={{ multiline: false, commit: 'enter', allowHtml: false }}
          />
          <CmsEditable
            {...editableBase}
            kind="text"
            fieldPath={path('body')}
            wrapperAs="p"
            className="cms-muted"
            value={String(props.body ?? '')}
            meta={{ multiline: true, commit: 'enter', allowHtml: false }}
          />
          <CmsEditable
            {...editableBase}
            kind="link"
            fieldPath={path('cta')}
            wrapperAs="a"
            className="cms-btn primary"
            wrapperProps={{
              href: linkHref(cta, { marketCode, localeCode, urlPattern }),
              target: cta?.target ?? '_self',
              rel: cta?.target === '_blank' ? 'noreferrer' : undefined
            }}
            value={cta?.text ?? cta?.url ?? 'Learn more'}
            meta={{ commit: 'none' }}
          />
        </div>
      </CmsEditable>
    );
  }

  if (componentType === 'pricing') {
    const tiers = Array.isArray(props.tiers) ? (props.tiers as Array<Record<string, unknown>>) : [];
    return (
      <CmsEditable
        key={id}
        {...editableBase}
        kind="list"
        role="item"
        fieldPath={rootPath}
        wrapperAs="section"
        className="cms-section"
        wrapperProps={{ id: sectionIdFromProps(props, 'pricing') }}
        value={component.type}
        keySuffix="root"
        meta={{ commit: 'none' }}
      >
        <CmsEditable
          {...editableBase}
          kind="text"
          fieldPath={path('title')}
          wrapperAs="h2"
          value={String(props.title ?? 'Pricing')}
          meta={{ multiline: false, commit: 'enter', allowHtml: false }}
        />
        <div className="cms-pricing-grid">
          {tiers.map((tier, index) => {
            const tierCta = (tier.cta as ContentLink | undefined) ?? null;
            return (
              <CmsEditable
                key={`${id}-${index}`}
                {...editableBase}
                kind="list"
                role="item"
                fieldPath={path(`tiers.${index}`)}
                wrapperAs="article"
                className="cms-card cms-pricing-tier"
                value={`tier-${index + 1}`}
                keySuffix={`tier-${index}`}
                meta={{ commit: 'none' }}
              >
                <CmsEditable
                  {...editableBase}
                  kind="text"
                  fieldPath={path(`tiers.${index}.name`)}
                  wrapperAs="h3"
                  value={String(tier.name ?? `Tier ${index + 1}`)}
                  keySuffix={`tier-name-${index}`}
                  meta={{ multiline: false, commit: 'enter', allowHtml: false }}
                />
                <CmsEditable
                  {...editableBase}
                  kind="text"
                  fieldPath={path(`tiers.${index}.price`)}
                  wrapperAs="div"
                  className="cms-price"
                  value={String(tier.price ?? '')}
                  keySuffix={`tier-price-${index}`}
                  meta={{ multiline: false, commit: 'enter', allowHtml: false }}
                />
                <CmsEditable
                  {...editableBase}
                  kind="text"
                  fieldPath={path(`tiers.${index}.description`)}
                  wrapperAs="p"
                  className="cms-muted"
                  value={String(tier.description ?? '')}
                  keySuffix={`tier-description-${index}`}
                  meta={{ multiline: true, commit: 'enter', allowHtml: false }}
                />
                <CmsEditable
                  {...editableBase}
                  kind="list"
                  fieldPath={path(`tiers.${index}.features`)}
                  wrapperAs="ul"
                  value="features"
                  keySuffix={`tier-features-${index}`}
                  meta={{ commit: 'none' }}
                >
                  {(Array.isArray(tier.features) ? tier.features : []).map((feature, featureIndex) => (
                    <CmsEditable
                      key={`${id}-${index}-${featureIndex}`}
                      {...editableBase}
                      kind="text"
                      fieldPath={path(`tiers.${index}.features.${featureIndex}`)}
                      wrapperAs="li"
                      role="item"
                      value={String(feature)}
                      keySuffix={`tier-feature-${index}-${featureIndex}`}
                      meta={{ multiline: false, commit: 'enter', allowHtml: false }}
                    />
                  ))}
                </CmsEditable>
                <CmsEditable
                  {...editableBase}
                  kind="link"
                  fieldPath={path(`tiers.${index}.cta`)}
                  wrapperAs="a"
                  className="cms-btn primary"
                  wrapperProps={{
                    href: linkHref(tierCta, { marketCode, localeCode, urlPattern }),
                    target: tierCta?.target ?? '_self',
                    rel: tierCta?.target === '_blank' ? 'noreferrer' : undefined
                  }}
                  value={tierCta?.text ?? tierCta?.url ?? 'Learn more'}
                  keySuffix={`tier-cta-${index}`}
                  meta={{ commit: 'none' }}
                />
              </CmsEditable>
            );
          })}
        </div>
      </CmsEditable>
    );
  }

  if (componentType === 'faq') {
    const items = Array.isArray(props.items)
      ? (props.items as Array<{ question?: string; answer?: string }>)
      : [];
    return (
      <CmsEditable
        key={id}
        {...editableBase}
        kind="list"
        role="item"
        fieldPath={rootPath}
        wrapperAs="section"
        className="cms-section"
        wrapperProps={{ id: sectionIdFromProps(props, 'faq') }}
        value={component.type}
        keySuffix="root"
        meta={{ commit: 'none' }}
      >
        <CmsEditable
          {...editableBase}
          kind="text"
          fieldPath={path('title')}
          wrapperAs="h2"
          value={String(props.title ?? 'FAQ')}
          meta={{ multiline: false, commit: 'enter', allowHtml: false }}
        />
        <div>
          {items.map((item, index) => (
            <CmsEditable
              key={`${id}-${index}`}
              {...editableBase}
              kind="list"
              role="item"
              fieldPath={path(`items.${index}`)}
              wrapperAs="details"
              className="cms-faq-item"
              value={`faq-${index + 1}`}
              keySuffix={`faq-item-${index}`}
              meta={{ commit: 'none' }}
            >
              <CmsEditable
                {...editableBase}
                kind="text"
                fieldPath={path(`items.${index}.question`)}
                wrapperAs="summary"
                value={item.question ?? `Question ${index + 1}`}
                keySuffix={`faq-q-${index}`}
                meta={{ multiline: false, commit: 'enter', allowHtml: false }}
              />
              <CmsEditable
                {...editableBase}
                kind="text"
                fieldPath={path(`items.${index}.answer`)}
                wrapperAs="p"
                className="cms-muted"
                value={item.answer ?? ''}
                keySuffix={`faq-a-${index}`}
                meta={{ multiline: true, commit: 'enter', allowHtml: false }}
              />
            </CmsEditable>
          ))}
        </div>
      </CmsEditable>
    );
  }

  if (componentType === 'newsletter_form') {
    const formId = typeof props.formId === 'number' ? props.formId : null;
    const title = typeof props.title === 'string' ? props.title : null;
    const description = typeof props.description === 'string' ? props.description : null;
    const submitLabel = typeof props.submitLabel === 'string' ? props.submitLabel : null;
    return (
      <CmsEditable
        key={id}
        {...editableBase}
        kind="list"
        role="item"
        fieldPath={rootPath}
        wrapperAs="div"
        wrapperProps={{ id: sectionIdFromProps(props, 'newsletter') }}
        value={component.type}
        keySuffix="root"
        meta={{ commit: 'none' }}
      >
        <NewsletterForm
          editableEnabled={editableEnabled}
          siteId={siteId}
          marketCode={marketCode}
          localeCode={localeCode}
          routeSlug={routeSlug}
          contentItemId={contentItemId}
          versionId={versionId}
          componentId={id}
          componentType={component.type}
          formId={formId}
          {...(title ? { title } : {})}
          {...(description ? { description } : {})}
          {...(submitLabel ? { submitLabel } : {})}
          steps={formId ? forms[String(formId)]?.steps ?? [] : []}
          fields={formId ? forms[String(formId)]?.fields ?? [] : []}
          apiBaseUrl={apiBaseUrl}
        />
      </CmsEditable>
    );
  }

  if (componentType === 'footer') {
    const linkGroups = Array.isArray(props.linkGroups)
      ? (props.linkGroups as Array<{ title?: string; links?: ContentLink[] }>)
      : [];
    const socials = Array.isArray(props.socialLinks) ? (props.socialLinks as ContentLink[]) : [];
    return (
      <CmsEditable
        key={id}
        {...editableBase}
        kind="list"
        role="item"
        fieldPath={rootPath}
        wrapperAs="footer"
        className="cms-section cms-footer"
        wrapperProps={{ id: sectionIdFromProps(props, 'footer') }}
        value={component.type}
        keySuffix="root"
        meta={{ commit: 'none' }}
      >
        <div className="cms-footer-grid">
          {linkGroups.map((group, index) => (
            <CmsEditable
              key={`${id}-${index}`}
              {...editableBase}
              kind="list"
              role="item"
              fieldPath={path(`linkGroups.${index}`)}
              wrapperAs="div"
              value={`group-${index + 1}`}
              keySuffix={`group-${index}`}
              meta={{ commit: 'none' }}
            >
              <CmsEditable
                {...editableBase}
                kind="text"
                fieldPath={path(`linkGroups.${index}.title`)}
                wrapperAs="h4"
                value={group.title ?? `Group ${index + 1}`}
                keySuffix={`group-title-${index}`}
                meta={{ multiline: false, commit: 'enter', allowHtml: false }}
              />
              <div className="cms-grid">
                {(group.links ?? []).map((entry, linkIndex) => (
                  <CmsEditable
                    key={`${id}-${index}-${linkIndex}`}
                    {...editableBase}
                    kind="link"
                    role="item"
                    fieldPath={path(`linkGroups.${index}.links.${linkIndex}`)}
                    wrapperAs="a"
                    wrapperProps={{
                      href: linkHref(entry, { marketCode, localeCode, urlPattern }),
                      target: entry?.target ?? '_self',
                      rel: entry?.target === '_blank' ? 'noreferrer' : undefined
                    }}
                    value={entry?.text ?? entry?.url ?? 'Learn more'}
                    keySuffix={`group-link-${index}-${linkIndex}`}
                    meta={{ commit: 'none' }}
                  />
                ))}
              </div>
            </CmsEditable>
          ))}
        </div>
        <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'space-between', gap: '0.8rem', flexWrap: 'wrap' }}>
          <CmsEditable
            {...editableBase}
            kind="text"
            fieldPath={path('copyright')}
            wrapperAs="small"
            value={String(props.copyright ?? '')}
            meta={{ multiline: false, commit: 'enter', allowHtml: false }}
          />
          <div className="cms-buttons" style={{ marginTop: 0 }}>
            {socials.map((entry, index) => (
              <CmsEditable
                key={`${id}-social-${index}`}
                {...editableBase}
                kind="link"
                role="item"
                fieldPath={path(`socialLinks.${index}`)}
                wrapperAs="a"
                className="cms-btn secondary"
                wrapperProps={{
                  href: linkHref(entry, { marketCode, localeCode, urlPattern }),
                  target: entry?.target ?? '_self',
                  rel: entry?.target === '_blank' ? 'noreferrer' : undefined
                }}
                value={entry?.text ?? entry?.url ?? 'Learn more'}
                keySuffix={`social-${index}`}
                meta={{ commit: 'none' }}
              />
            ))}
          </div>
        </div>
      </CmsEditable>
    );
  }

  if (componentType === 'richtext' || componentType === 'text_block') {
    const html = String((props.html as string | undefined) ?? (props.body as string | undefined) ?? '');
    const sanitizedHtml = sanitizeRichTextHtml(html, { marketCode, localeCode, urlPattern, apiBaseUrl });
    const richPath = typeof props.html === 'string' ? path('html') : path('body');
    return (
      <CmsEditable
        key={id}
        {...editableBase}
        kind="list"
        role="item"
        fieldPath={rootPath}
        wrapperAs="section"
        className="cms-section"
        value={component.type}
        keySuffix="root"
        meta={{ commit: 'none' }}
      >
        <CmsEditable
          {...editableBase}
          kind="richtext"
          fieldPath={richPath}
          wrapperAs="div"
          html={sanitizedHtml || '<p></p>'}
          meta={{ multiline: true, commit: 'ctrl_enter', allowHtml: true }}
        />
      </CmsEditable>
    );
  }

  if (componentType === 'feature_grid_item') {
    return null;
  }

  if (componentType === 'cta') {
    const href = String(props.href ?? '#');
    return (
      <CmsEditable
        key={id}
        {...editableBase}
        kind="list"
        role="item"
        fieldPath={rootPath}
        wrapperAs="section"
        className="cms-section"
        value={component.type}
        keySuffix="root"
        meta={{ commit: 'none' }}
      >
        <CmsEditable
          {...editableBase}
          kind="link"
          fieldPath={path('href')}
          wrapperAs="a"
          className="cms-btn primary"
          wrapperProps={{ href }}
          value={String(props.text ?? 'CTA')}
          meta={{ commit: 'none' }}
        />
      </CmsEditable>
    );
  }

  return <div key={id}>Unsupported component type: {component.type}</div>;
}

export function CmsRendererClient({
  contentItemId,
  versionId,
  siteId = 1,
  marketCode = 'US',
  localeCode = 'en-US',
  urlPattern = '/{market}/{locale}',
  routeSlug = '',
  fields,
  fieldDefs = [],
  composition,
  components,
  cmsBridge,
  inlineEdit = false,
  forms = {},
  assets = {},
  apiBaseUrl = 'http://localhost:4000'
}: CmsRendererClientProps) {
  const hoverRef = useRef<HTMLElement | null>(null);
  const selectedRef = useRef<HTMLElement | null>(null);
  const inlineModeRef = useRef(Boolean(cmsBridge && inlineEdit));
  const inlineSessionRef = useRef<{
    wrapper: HTMLElement;
    target: HTMLElement;
    payload: Omit<CmsInlineEditPayload, 'value'>;
    mode: CmsInlineEditMode;
    meta: CmsEditMeta;
    originalValue: string;
    input: () => void;
    keydown: (event: KeyboardEvent) => void;
    blur: () => void;
    timerId: number | null;
  } | null>(null);
  const inlineHintRef = useRef<HTMLDivElement | null>(null);
  const inlineFeaturesRef = useRef<string[]>([]);
  const actionItemsRef = useRef<CmsActionItem[]>([]);
  const debugPanelRef = useRef<HTMLDivElement | null>(null);
  const debugEnabledRef = useRef(false);
  const lastStatusRef = useRef('idle');
  const fieldEntries = useMemo(() => Object.entries(fields), [fields]);
  const fieldDefMap = useMemo(() => new Map(fieldDefs.map((def) => [def.key, def])), [fieldDefs]);
  const areas = composition.areas ?? [{ name: 'main', components: Object.keys(components) }];

  const updateDebugPanel = () => {
    const panel = debugPanelRef.current;
    if (!panel) {
      return;
    }
    if (!debugEnabledRef.current) {
      panel.style.display = 'none';
      return;
    }
    panel.style.display = 'block';
    const selected = selectedRef.current;
    panel.innerHTML = [
      `<strong>CMS Debug</strong>`,
      `wrapper: ${selected?.dataset.cmsEditTargetId ?? 'none'}`,
      `editTargetId: ${selected?.dataset.cmsEditTargetId ?? 'none'}`,
      `fieldPath: ${selected?.dataset.cmsFieldPath ?? 'none'}`,
      `componentId: ${selected?.dataset.cmsComponentId ?? 'none'}`,
      `lastStatus: ${lastStatusRef.current}`
    ].join('<br/>');
  };

  const toInlinePayload = (wrapper: HTMLElement, mode: CmsInlineEditMode): Omit<CmsInlineEditPayload, 'value'> | null => {
    const selection = resolveEditableSelection(wrapper);
    if (!selection) {
      return null;
    }
    return {
      contentItemId: selection.contentItemId,
      versionId: selection.versionId,
      editTargetId: selection.editTargetId,
      ...(selection.fieldPath ? { fieldPath: selection.fieldPath } : {}),
      ...(selection.componentId ? { componentId: selection.componentId } : {}),
      mode
    };
  };

  const postInlineEditMessage = (type: 'CMS_INLINE_EDIT_PATCH' | 'CMS_INLINE_EDIT_COMMIT', payload: CmsInlineEditPayload) => {
    if (!window.parent || window.parent === window) {
      return;
    }
    window.parent.postMessage({ type, ...payload }, '*');
  };

  const teardownInlineSession = () => {
    const session = inlineSessionRef.current;
    if (!session) {
      return;
    }
    if (session.timerId != null) {
      window.clearTimeout(session.timerId);
    }
    session.target.removeEventListener('input', session.input);
    session.target.removeEventListener('keydown', session.keydown);
    session.target.removeEventListener('blur', session.blur);
    session.target.removeAttribute('contenteditable');
    session.target.removeAttribute('tabindex');
    session.target.classList.remove('cms-inline-editing');
    session.wrapper.dataset.cmsEditing = 'false';
    inlineSessionRef.current = null;
    if (inlineHintRef.current) {
      inlineHintRef.current.remove();
      inlineHintRef.current = null;
    }
    updateDebugPanel();
  };

  const cancelInlineSession = () => {
    const session = inlineSessionRef.current;
    if (!session) {
      return;
    }
    if (session.mode === 'richtext') {
      session.target.innerHTML = session.originalValue;
    } else {
      session.target.textContent = session.originalValue;
    }
    if (window.parent && window.parent !== window) {
      window.parent.postMessage(
        {
          type: 'CMS_INLINE_EDIT_CANCEL',
          ...session.payload
        },
        '*'
      );
    }
    lastStatusRef.current = `cancel:${session.payload.editTargetId}`;
    updateDebugPanel();
    teardownInlineSession();
  };

  const commitInlineSession = () => {
    const session = inlineSessionRef.current;
    if (!session) {
      return;
    }
    const value = readTargetValue(session.target, session.mode);
    postInlineEditMessage('CMS_INLINE_EDIT_COMMIT', {
      ...session.payload,
      value
    });
    lastStatusRef.current = `commit:${session.payload.editTargetId}`;
    updateDebugPanel();
    teardownInlineSession();
  };

  const schedulePatchMessage = () => {
    const session = inlineSessionRef.current;
    if (!session) {
      return;
    }
    if (session.timerId != null) {
      window.clearTimeout(session.timerId);
    }
    session.timerId = window.setTimeout(() => {
      const active = inlineSessionRef.current;
      if (!active) {
        return;
      }
      postInlineEditMessage('CMS_INLINE_EDIT_PATCH', {
        ...active.payload,
        value: readTargetValue(active.target, active.mode)
      });
      lastStatusRef.current = `patch:${active.payload.editTargetId}`;
      updateDebugPanel();
    }, 900);
  };

  const startInlineSession = (wrapper: HTMLElement | null) => {
    if (!inlineModeRef.current || !wrapper) {
      return;
    }
    const kind = wrapper.dataset.cmsEditKind;
    const mode = (kind === 'text' || kind === 'richtext' ? kind : null) as CmsInlineEditMode | null;
    if (!mode) {
      return;
    }
    const target = resolveEditTarget(wrapper);
    if (!target) {
      return;
    }
    const payload = toInlinePayload(wrapper, mode);
    if (!payload) {
      return;
    }
    const meta = parseEditMeta(wrapper.dataset.cmsEditMeta);
    teardownInlineSession();
    wrapper.dataset.cmsEditing = 'true';
    target.setAttribute('contenteditable', mode === 'text' ? 'plaintext-only' : 'true');
    target.contentEditable = mode === 'text' ? 'plaintext-only' : 'true';
    target.classList.add('cms-inline-editing');
    target.style.outline = 'none';
    target.style.background = 'transparent';
    if (mode === 'richtext') {
      const hint = document.createElement('div');
      hint.textContent = 'Ctrl+Enter to save, Esc to cancel';
      hint.style.position = 'fixed';
      hint.style.zIndex = '2147483647';
      hint.style.padding = '4px 8px';
      hint.style.borderRadius = '8px';
      hint.style.fontSize = '11px';
      hint.style.background = 'rgba(15, 23, 42, 0.92)';
      hint.style.color = '#f8fafc';
      const rect = target.getBoundingClientRect();
      hint.style.left = `${Math.max(8, rect.left)}px`;
      hint.style.top = `${Math.max(8, rect.top - 28)}px`;
      document.body.appendChild(hint);
      inlineHintRef.current = hint;
    }
    const input = () => {
      schedulePatchMessage();
    };
    const keydown = (event: KeyboardEvent) => {
      if (document.activeElement !== target) {
        focusEditableTarget(target);
      }
      if (
        mode === 'text' &&
        event.defaultPrevented &&
        event.key.length === 1 &&
        !event.ctrlKey &&
        !event.metaKey &&
        !event.altKey
      ) {
        event.preventDefault();
        insertTextAtSelection(target, event.key);
        schedulePatchMessage();
        return;
      }
      const allowed = new Set(inlineFeaturesRef.current);
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'b' && !allowed.has('bold')) {
        event.preventDefault();
        return;
      }
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'i' && !allowed.has('italic')) {
        event.preventDefault();
        return;
      }
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'u' && !allowed.has('underline')) {
        event.preventDefault();
        return;
      }
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k' && !allowed.has('link')) {
        event.preventDefault();
        return;
      }
      if (event.key === 'Escape') {
        event.preventDefault();
        cancelInlineSession();
        return;
      }
      if (shouldCommit(mode, meta, event)) {
        event.preventDefault();
        commitInlineSession();
      }
    };
    const blur = () => {
      commitInlineSession();
    };
    target.addEventListener('input', input);
    target.addEventListener('keydown', keydown);
    target.addEventListener('blur', blur);
    inlineSessionRef.current = {
      wrapper,
      target,
      payload,
      mode,
      meta,
      originalValue: readTargetValue(target, mode),
      input,
      keydown,
      blur,
      timerId: null
    };
    lastStatusRef.current = `editing:${payload.editTargetId}`;
    updateDebugPanel();
    window.requestAnimationFrame(() => focusEditableTarget(target));
  };

  useEffect(() => {
    inlineModeRef.current = Boolean(cmsBridge && inlineEdit);
    if (!inlineModeRef.current) {
      teardownInlineSession();
    }
  }, [cmsBridge, inlineEdit]);

  useEffect(() => {
    return () => {
      teardownInlineSession();
    };
  }, []);

  useEffect(() => {
    if (!cmsBridge) {
      return;
    }

    const hover = document.createElement('div');
    hover.style.position = 'fixed';
    hover.style.pointerEvents = 'none';
    hover.style.zIndex = '2147483646';
    hover.style.border = '1px solid transparent';
    hover.style.borderRadius = '6px';
    hover.style.display = 'none';
    document.body.appendChild(hover);

    const selected = document.createElement('div');
    selected.style.position = 'fixed';
    selected.style.pointerEvents = 'none';
    selected.style.zIndex = '2147483647';
    selected.style.border = '2px solid transparent';
    selected.style.borderRadius = '6px';
    selected.style.display = 'none';
    document.body.appendChild(selected);

    const toolbar = document.createElement('div');
    toolbar.style.position = 'fixed';
    toolbar.style.zIndex = '2147483647';
    toolbar.style.display = 'none';
    toolbar.style.pointerEvents = 'auto';
    toolbar.style.background = 'rgba(15, 23, 42, 0.94)';
    toolbar.style.border = '1px solid rgba(148, 163, 184, 0.45)';
    toolbar.style.borderRadius = '10px';
    toolbar.style.padding = '6px';
    toolbar.style.maxWidth = 'calc(100vw - 16px)';
    toolbar.style.boxShadow = '0 10px 28px rgba(2, 6, 23, 0.4)';
    document.body.appendChild(toolbar);

    const overflowMenu = document.createElement('div');
    overflowMenu.style.position = 'fixed';
    overflowMenu.style.zIndex = '2147483647';
    overflowMenu.style.display = 'none';
    overflowMenu.style.pointerEvents = 'auto';
    overflowMenu.style.background = 'rgba(15, 23, 42, 0.98)';
    overflowMenu.style.border = '1px solid rgba(148, 163, 184, 0.45)';
    overflowMenu.style.borderRadius = '10px';
    overflowMenu.style.padding = '4px';
    overflowMenu.style.minWidth = '160px';
    overflowMenu.style.boxShadow = '0 10px 28px rgba(2, 6, 23, 0.45)';
    document.body.appendChild(overflowMenu);

    const contextMenu = document.createElement('div');
    contextMenu.style.position = 'fixed';
    contextMenu.style.zIndex = '2147483647';
    contextMenu.style.display = 'none';
    contextMenu.style.pointerEvents = 'auto';
    contextMenu.style.background = 'rgba(15, 23, 42, 0.98)';
    contextMenu.style.border = '1px solid rgba(148, 163, 184, 0.45)';
    contextMenu.style.borderRadius = '10px';
    contextMenu.style.padding = '4px';
    contextMenu.style.minWidth = '180px';
    contextMenu.style.boxShadow = '0 10px 28px rgba(2, 6, 23, 0.45)';
    document.body.appendChild(contextMenu);

    const debugPanel = document.createElement('div');
    debugPanel.style.position = 'fixed';
    debugPanel.style.left = '10px';
    debugPanel.style.bottom = '10px';
    debugPanel.style.zIndex = '2147483647';
    debugPanel.style.background = 'rgba(15, 23, 42, 0.95)';
    debugPanel.style.color = '#e2e8f0';
    debugPanel.style.border = '1px solid rgba(148, 163, 184, 0.45)';
    debugPanel.style.borderRadius = '8px';
    debugPanel.style.padding = '8px 10px';
    debugPanel.style.fontSize = '11px';
    debugPanel.style.lineHeight = '1.35';
    debugPanel.style.maxWidth = '320px';
    debugPanel.style.display = 'none';
    document.body.appendChild(debugPanel);
    debugPanelRef.current = debugPanel;

    const debugToggle = document.createElement('button');
    debugToggle.type = 'button';
    debugToggle.textContent = 'Debug';
    debugToggle.style.position = 'fixed';
    debugToggle.style.left = '10px';
    debugToggle.style.bottom = '10px';
    debugToggle.style.zIndex = '2147483647';
    debugToggle.style.border = '1px solid rgba(148, 163, 184, 0.45)';
    debugToggle.style.borderRadius = '8px';
    debugToggle.style.padding = '6px 10px';
    debugToggle.style.fontSize = '11px';
    debugToggle.style.background = 'rgba(15, 23, 42, 0.9)';
    debugToggle.style.color = '#e2e8f0';
    debugToggle.style.cursor = 'pointer';
    debugToggle.onclick = () => {
      debugEnabledRef.current = !debugEnabledRef.current;
      debugToggle.style.bottom = debugEnabledRef.current ? '138px' : '10px';
      updateDebugPanel();
    };
    document.body.appendChild(debugToggle);

    const showStatusBadge = (text: string, ok: boolean) => {
      const badge = document.createElement('div');
      badge.textContent = text;
      badge.style.position = 'fixed';
      badge.style.right = '12px';
      badge.style.bottom = '12px';
      badge.style.zIndex = '2147483647';
      badge.style.padding = '6px 10px';
      badge.style.borderRadius = '8px';
      badge.style.background = ok ? 'rgba(22, 163, 74, 0.95)' : 'rgba(185, 28, 28, 0.95)';
      badge.style.color = '#fff';
      badge.style.fontSize = '12px';
      document.body.appendChild(badge);
      window.setTimeout(() => badge.remove(), 1400);
    };

    const hideMenus = () => {
      overflowMenu.style.display = 'none';
      contextMenu.style.display = 'none';
    };

    const createActionButton = (action: CmsActionItem, compact = false) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = action.label;
      button.style.background = action.id === 'delete' ? 'rgba(185, 28, 28, 0.2)' : 'transparent';
      button.style.border = compact ? 'none' : '1px solid rgba(148, 163, 184, 0.4)';
      button.style.borderRadius = '8px';
      button.style.color = '#f8fafc';
      button.style.cursor = 'pointer';
      button.style.fontSize = '12px';
      button.style.lineHeight = '1.2';
      button.style.padding = compact ? '7px 9px' : '6px 10px';
      button.style.whiteSpace = 'nowrap';
      button.onmouseenter = () => {
        button.style.background = action.id === 'delete' ? 'rgba(185, 28, 28, 0.35)' : 'rgba(148, 163, 184, 0.2)';
      };
      button.onmouseleave = () => {
        button.style.background = action.id === 'delete' ? 'rgba(185, 28, 28, 0.2)' : 'transparent';
      };
      return button;
    };

    const positionFloating = (node: HTMLElement, anchorRect: DOMRect, mode: 'toolbar' | 'menu', x?: number, y?: number) => {
      if (mode === 'menu' && x != null && y != null) {
        const maxLeft = Math.max(8, window.innerWidth - node.offsetWidth - 8);
        const maxTop = Math.max(8, window.innerHeight - node.offsetHeight - 8);
        node.style.left = `${Math.max(8, Math.min(x, maxLeft))}px`;
        node.style.top = `${Math.max(8, Math.min(y, maxTop))}px`;
        return;
      }
      const topSpace = anchorRect.top;
      const belowTop = anchorRect.bottom + 10;
      const aboveTop = anchorRect.top - node.offsetHeight - 10;
      const preferredTop = topSpace > node.offsetHeight + 20 ? aboveTop : belowTop;
      const maxLeft = Math.max(8, window.innerWidth - node.offsetWidth - 8);
      const centered = anchorRect.left + anchorRect.width / 2 - node.offsetWidth / 2;
      node.style.left = `${Math.max(8, Math.min(centered, maxLeft))}px`;
      node.style.top = `${Math.max(8, Math.min(preferredTop, window.innerHeight - node.offsetHeight - 8))}px`;
    };

    const runAction = (actionId: CmsActionId) => {
      const target = selectedRef.current;
      if (!target) {
        return;
      }
      emitActionRequest('run', target, actionId);
      hideMenus();
    };

    const fillMenu = (node: HTMLElement, actions: CmsActionItem[], compact = false) => {
      node.innerHTML = '';
      node.style.display = 'none';
      if (!selectedRef.current || actions.length === 0) {
        return;
      }
      node.style.display = 'grid';
      node.style.gap = compact ? '2px' : '6px';
      for (const action of actions) {
        const button = createActionButton(action, compact);
        button.onclick = (event) => {
          event.preventDefault();
          event.stopPropagation();
          runAction(action.id);
        };
        node.appendChild(button);
      }
    };

    const renderToolbar = () => {
      const target = selectedRef.current;
      if (!target) {
        toolbar.style.display = 'none';
        hideMenus();
        return;
      }
      const actions = actionItemsRef.current;
      if (actions.length === 0) {
        toolbar.style.display = 'none';
        return;
      }

      const preferred = actions.filter((entry) => entry.primary);
      const primaryActions = (preferred.length > 0 ? preferred : actions).slice(0, 4);
      const overflowActions = actions.filter((entry) => !primaryActions.some((primary) => primary.id === entry.id));
      toolbar.innerHTML = '';
      toolbar.style.display = 'flex';
      toolbar.style.gap = '6px';
      toolbar.style.alignItems = 'center';

      for (const action of primaryActions) {
        const button = createActionButton(action);
        button.onclick = (event) => {
          event.preventDefault();
          event.stopPropagation();
          runAction(action.id);
        };
        toolbar.appendChild(button);
      }

      if (overflowActions.length > 0) {
        const overflow = document.createElement('button');
        overflow.type = 'button';
        overflow.textContent = '...';
        overflow.style.border = '1px solid rgba(148, 163, 184, 0.4)';
        overflow.style.borderRadius = '8px';
        overflow.style.background = 'transparent';
        overflow.style.color = '#f8fafc';
        overflow.style.cursor = 'pointer';
        overflow.style.padding = '6px 10px';
        overflow.style.fontSize = '12px';
        overflow.onclick = (event) => {
          event.preventDefault();
          event.stopPropagation();
          fillMenu(overflowMenu, overflowActions, true);
          if (overflowMenu.style.display === 'none') {
            return;
          }
          const rect = overflow.getBoundingClientRect();
          positionFloating(overflowMenu, rect, 'menu', rect.left, rect.bottom + 6);
        };
        toolbar.appendChild(overflow);
      }

      positionFloating(toolbar, target.getBoundingClientRect(), 'toolbar');
    };

    const syncOverlays = () => {
      drawOverlay(hover, hoverRef.current, '#2563eb', 'rgba(37, 99, 235, 0.08)');
      drawOverlay(selected, selectedRef.current, '#f97316', 'rgba(249, 115, 22, 0.08)');
      renderToolbar();
      updateDebugPanel();
    };

    const onPointerMove = (event: PointerEvent) => {
      const target = findEditableWrapper(document.elementFromPoint(event.clientX, event.clientY));
      hoverRef.current = target;
      syncOverlays();
    };

    const onPointerDown = (event: PointerEvent) => {
      const target = findEditableWrapper(event.target);
      if (!target) {
        return;
      }
      const activeInline = inlineSessionRef.current;
      if (activeInline?.wrapper === target) {
        return;
      }
      const kind = target.dataset.cmsEditKind;
      if (kind === 'text' || kind === 'richtext') {
        // UX fix: prevent native caret/selection on single click so users aren't misled.
        // Editing still starts on explicit double-click.
        event.preventDefault();
      }
    };

    const onClick = (event: MouseEvent) => {
      const target = findEditableWrapper(event.target);
      if (!target) {
        return;
      }
      const activeInline = inlineSessionRef.current;
      if (!activeInline || activeInline.wrapper !== target) {
        event.preventDefault();
        event.stopPropagation();
      }
      selectedRef.current = target;
      hideMenus();
      syncOverlays();
      emitSelect(target);
      emitActionRequest('list', target);
    };

    const onDoubleClick = (event: MouseEvent) => {
      const target = findEditableWrapper(event.target);
      if (!target) {
        return;
      }
      selectedRef.current = target;
      syncOverlays();
      startInlineSession(target);
      if (inlineSessionRef.current?.wrapper === target) {
        emitSelect(target);
        event.preventDefault();
        event.stopPropagation();
        return;
      }
      emitSelect(target);
    };

    const onContextMenu = (event: MouseEvent) => {
      if (event.target instanceof Node && (toolbar.contains(event.target) || overflowMenu.contains(event.target) || contextMenu.contains(event.target))) {
        return;
      }
      const target = findEditableWrapper(event.target);
      if (!target) {
        contextMenu.style.display = 'none';
        return;
      }
      event.preventDefault();
      selectedRef.current = target;
      emitSelect(target);
      emitActionRequest('list', target);
      syncOverlays();
      fillMenu(contextMenu, actionItemsRef.current, true);
      if (contextMenu.style.display !== 'none') {
        positionFloating(contextMenu, target.getBoundingClientRect(), 'menu', event.clientX, event.clientY);
      }
    };

    const onWindowClick = (event: MouseEvent) => {
      if (event.target instanceof Node && (toolbar.contains(event.target) || overflowMenu.contains(event.target) || contextMenu.contains(event.target))) {
        return;
      }
      hideMenus();
    };

    const onMessage = (event: MessageEvent<unknown>) => {
      const payload = event.data as {
        type?: string;
        editTargetId?: string;
        componentId?: string;
        fieldPath?: string;
        richTextFeatures?: string[];
        enabled?: boolean;
        ok?: boolean;
        message?: string;
        requestType?: string;
      } | undefined;
      if (!payload?.type) {
        return;
      }
      if (payload.type === 'CMS_ACTIONS') {
        const actionsPayload = payload as CmsActionsPayload;
        actionItemsRef.current = Array.isArray(actionsPayload.actions) ? actionsPayload.actions : [];
        renderToolbar();
        return;
      }
      if (payload.type === 'CMS_HIGHLIGHT') {
        inlineFeaturesRef.current = Array.isArray(payload.richTextFeatures)
          ? (payload.richTextFeatures ?? [])
          : [];
        selectedRef.current = findByBridgeSelector(payload.editTargetId, payload.componentId, payload.fieldPath);
        syncOverlays();
        if (selectedRef.current) {
          emitActionRequest('list', selectedRef.current);
        } else {
          actionItemsRef.current = [];
        }
      }
      if (payload.type === 'CMS_SCROLL_TO' && payload.componentId) {
        const target = findByBridgeSelector(undefined, payload.componentId, undefined);
        target?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      if (payload.type === 'CMS_INLINE_MODE') {
        const enabled = Boolean(payload.enabled);
        inlineModeRef.current = enabled;
        if (!enabled) {
          inlineFeaturesRef.current = [];
          teardownInlineSession();
        }
      }
      if (payload.type === 'CMS_ACTION_RESULT') {
        const ok = Boolean(payload.ok);
        const message = payload.message?.trim() || (ok ? 'Saved' : 'Not saved');
        showStatusBadge(message, ok);
        lastStatusRef.current = `${payload.requestType ?? 'action'}:${ok ? 'ok' : 'error'}:${payload.editTargetId ?? ''}`;
        updateDebugPanel();
      }
      if (payload.type === 'CMS_INLINE_EDIT_ERROR') {
        showStatusBadge(payload.message?.trim() || 'Not saved', false);
        lastStatusRef.current = `error:${payload.editTargetId ?? payload.fieldPath ?? ''}`;
        updateDebugPanel();
      }
      if (payload.type === 'CMS_REFRESH') {
        window.location.reload();
      }
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerdown', onPointerDown, true);
    window.addEventListener('click', onClick, true);
    window.addEventListener('dblclick', onDoubleClick, true);
    window.addEventListener('contextmenu', onContextMenu, true);
    window.addEventListener('click', onWindowClick);
    window.addEventListener('resize', syncOverlays);
    window.addEventListener('scroll', syncOverlays, true);
    window.addEventListener('message', onMessage);

    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerdown', onPointerDown, true);
      window.removeEventListener('click', onClick, true);
      window.removeEventListener('dblclick', onDoubleClick, true);
      window.removeEventListener('contextmenu', onContextMenu, true);
      window.removeEventListener('click', onWindowClick);
      window.removeEventListener('resize', syncOverlays);
      window.removeEventListener('scroll', syncOverlays, true);
      window.removeEventListener('message', onMessage);
      teardownInlineSession();
      hover.remove();
      selected.remove();
      toolbar.remove();
      overflowMenu.remove();
      contextMenu.remove();
      debugPanel.remove();
      debugToggle.remove();
      debugPanelRef.current = null;
      hoverRef.current = null;
      selectedRef.current = null;
      actionItemsRef.current = [];
    };
  }, [cmsBridge]);

  return (
    <main className="cms-page">
      {cmsBridge ? (
        <section className="cms-section" style={{ marginBottom: '0.9rem' }}>
          {fieldEntries.map(([key, value]) => {
            const fieldDef = fieldDefMap.get(key);
            const isRichText = fieldDef?.type === 'richtext';
            if (isRichText) {
              const html = String(value ?? '');
              const sanitizedHtml = sanitizeRichTextHtml(html, { marketCode, localeCode, urlPattern, apiBaseUrl });
              return (
                <div key={key} className="cms-field-block">
                  <small className="cms-field-label">{key}</small>
                  <CmsEditable
                    enabled={cmsBridge}
                    contentItemId={contentItemId}
                    versionId={versionId}
                    fieldPath={`fields.${key}`}
                    kind="richtext"
                    wrapperAs="div"
                    html={sanitizedHtml || '<p></p>'}
                    meta={{ multiline: true, commit: 'ctrl_enter', allowHtml: true }}
                  />
                </div>
              );
            }
            const fieldType = fieldDef?.type ?? '';
            const kind: CmsEditKind =
              fieldType === 'contentLink' || fieldType === 'contentLinkList'
                ? 'link'
                : fieldType === 'assetRef' || fieldType === 'assetList'
                  ? 'asset'
                  : Array.isArray(value)
                    ? 'list'
                    : 'text';
            const displayValue =
              kind === 'link'
                ? (() => {
                    if (value && typeof value === 'object' && !Array.isArray(value)) {
                      const link = value as ContentLink;
                      return link.text ?? link.url ?? '';
                    }
                    if (Array.isArray(value) && value.length > 0) {
                      const first = value[0];
                      if (first && typeof first === 'object') {
                        const link = first as ContentLink;
                        return link.text ?? link.url ?? '';
                      }
                    }
                    return String(value ?? '');
                  })()
                : kind === 'asset'
                  ? String(
                      typeof value === 'number'
                        ? value
                        : value && typeof value === 'object' && !Array.isArray(value)
                          ? ((value as { assetId?: unknown }).assetId ?? '')
                          : ''
                    )
                  : String(value ?? '');
            return (
              <div key={key}>
                <strong>{key}:</strong>{' '}
                <CmsEditable
                  enabled={cmsBridge}
                  contentItemId={contentItemId}
                  versionId={versionId}
                  fieldPath={`fields.${key}`}
                  kind={kind}
                  wrapperAs="span"
                  className="cms-muted"
                  value={displayValue}
                  meta={{ multiline: fieldType === 'multiline', commit: 'enter', allowHtml: false }}
                />
              </div>
            );
          })}
        </section>
      ) : null}
      {areas.map((area) => (
        <section key={area.name} style={{ display: 'grid', gap: '0.9rem' }}>
          {area.components.map((componentId) =>
            renderComponent(
              siteId,
              marketCode,
              localeCode,
              urlPattern,
              routeSlug,
              contentItemId,
              versionId,
              cmsBridge,
              componentId,
              components[componentId],
              components,
              forms,
              assets,
              apiBaseUrl
            )
          )}
        </section>
      ))}
    </main>
  );
}
