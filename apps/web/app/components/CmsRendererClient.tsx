'use client';

import { type FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import {
  buildLocalizedPath,
  evaluateFieldConditions,
  type FormConditionSet,
  type FormEvaluationContext
} from '@contenthead/shared';

type ContentLink = {
  kind?: 'internal' | 'external';
  url?: string;
  contentItemId?: number;
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
type CmsActionId = 'edit' | 'inline_edit' | 'replace' | 'clear' | 'delete' | 'duplicate' | 'move_up' | 'move_down';
type CmsActionItem = { id: CmsActionId; label: string; primary?: boolean };
type CmsActionsPayload = {
  type: 'CMS_ACTIONS';
  contentItemId: number;
  versionId: number;
  componentId?: string;
  fieldPath?: string;
  targetType?: 'text' | 'richtext' | 'asset' | 'link' | 'form' | 'component' | 'unknown';
  actions?: CmsActionItem[];
};

function getAnnotatedTarget(element: Element | null): HTMLElement | null {
  if (!element) {
    return null;
  }
  return element.closest<HTMLElement>('[data-cms-component-id], [data-cms-field-path]');
}

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

function findByBridgeSelector(componentId?: string, fieldPath?: string): HTMLElement | null {
  if (fieldPath) {
    const field = document.querySelector<HTMLElement>(`[data-cms-field-path="${fieldPath}"]`);
    if (field) {
      return field;
    }
  }
  if (componentId) {
    return document.querySelector<HTMLElement>(`[data-cms-component-id="${componentId}"]`);
  }
  return null;
}

function normalizeType(type: string): string {
  return type.trim().toLowerCase().replace(/component$/i, '').replace(/\s+/g, '_');
}

function findDatasetValue(target: HTMLElement, key: string): string | undefined {
  let current: HTMLElement | null = target;
  while (current) {
    const value = current.dataset[key as keyof DOMStringMap];
    if (value) {
      return value;
    }
    current = current.parentElement;
  }
  return undefined;
}

function focusEditableTarget(target: HTMLElement): void {
  target.focus();
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

function emitSelect(target: HTMLElement) {
  const contentItemId = Number(findDatasetValue(target, 'cmsContentItemId') ?? '0');
  const versionId = Number(findDatasetValue(target, 'cmsVersionId') ?? '0');
  const payload = {
    type: 'CMS_SELECT',
    contentItemId,
    versionId,
    componentId: target.dataset.cmsComponentId ?? findDatasetValue(target, 'cmsComponentId'),
    componentType: target.dataset.cmsComponentType ?? findDatasetValue(target, 'cmsComponentType'),
    fieldPath: target.dataset.cmsFieldPath ?? findDatasetValue(target, 'cmsFieldPath'),
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
  const contentItemId = Number(findDatasetValue(target, 'cmsContentItemId') ?? '0');
  const versionId = Number(findDatasetValue(target, 'cmsVersionId') ?? '0');
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
      componentId: target.dataset.cmsComponentId ?? findDatasetValue(target, 'cmsComponentId'),
      componentType: target.dataset.cmsComponentType ?? findDatasetValue(target, 'cmsComponentType'),
      fieldPath: target.dataset.cmsFieldPath ?? findDatasetValue(target, 'cmsFieldPath')
    },
    '*'
  );
}

function linkHref(link?: ContentLink | null): string {
  if (!link) {
    return '#';
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

function CmsLink({
  link,
  className,
  fieldPath,
  bridgeAttrs
}: {
  link?: ContentLink | null;
  className?: string;
  fieldPath?: string;
  bridgeAttrs?: Record<string, string | number>;
}) {
  if (!link) {
    return null;
  }
  return (
    <a
      className={className}
      href={linkHref(link)}
      target={link.target ?? '_self'}
      rel={link.target === '_blank' ? 'noreferrer' : undefined}
      {...(bridgeAttrs ?? {})}
      {...(fieldPath ? { 'data-cms-field-path': fieldPath } : {})}
    >
      {link.text ?? link.url ?? 'Learn more'}
    </a>
  );
}

function CmsImage({
  assetId,
  asset,
  kind,
  altOverride,
  apiBaseUrl,
  fieldPath,
  bridgeAttrs
}: {
  assetId?: number | null;
  asset?: AssetPayload | null;
  kind?: 'thumb' | 'small' | 'medium' | 'large';
  altOverride?: string;
  apiBaseUrl: string;
  fieldPath?: string;
  bridgeAttrs?: Record<string, string | number>;
}) {
  if (!assetId) {
    return null;
  }
  const url = kind ? `${apiBaseUrl}/assets/${assetId}/rendition/${kind}` : `${apiBaseUrl}/assets/${assetId}`;
  const alt = altOverride ?? asset?.altText ?? asset?.title ?? `Asset ${assetId}`;
  return (
    <img
      src={url}
      alt={alt}
      loading="lazy"
      {...(bridgeAttrs ?? {})}
      {...(fieldPath ? { 'data-cms-field-path': fieldPath } : {})}
    />
  );
}

function NewsletterForm({
  siteId,
  marketCode,
  localeCode,
  routeSlug,
  contentItemId,
  formId,
  title,
  description,
  submitLabel,
  steps,
  fields,
  apiBaseUrl,
  fieldPathPrefix,
  bridgeAttrs
}: {
  siteId: number;
  marketCode: string;
  localeCode: string;
  routeSlug: string;
  contentItemId: number;
  formId?: number | null;
  title?: string;
  description?: string;
  submitLabel?: string;
  steps: FormStepPayload[];
  fields: FormFieldPayload[];
  apiBaseUrl: string;
  fieldPathPrefix?: string;
  bridgeAttrs?: Record<string, string | number>;
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
  const fieldAttrs = (suffix: string) => {
    if (!fieldPathPrefix) {
      return undefined;
    }
    return { ...(bridgeAttrs ?? {}), 'data-cms-field-path': `${fieldPathPrefix}.${suffix}` };
  };

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
      <h2 {...fieldAttrs('title')}>{title ?? 'Newsletter'}</h2>
      <p className="cms-muted" {...fieldAttrs('description')}>{description ?? 'Stay updated with product releases.'}</p>
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
        <button className="cms-btn primary" type="submit" {...fieldAttrs('submitLabel')}>
          {activeStepIndex < visibleStepIds.length - 1 ? 'Continue' : submitLabel ?? 'Submit'}
        </button>
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

function renderComponent(
  siteId: number,
  marketCode: string,
  localeCode: string,
  urlPattern: string,
  routeSlug: string,
  contentItemId: number,
  versionId: number,
  id: string,
  component: ComponentPayload | undefined,
  forms: Record<string, { fields: FormFieldPayload[]; steps?: FormStepPayload[] }>,
  assets: Record<string, AssetPayload>,
  apiBaseUrl: string
) {
  if (!component) {
    return <div key={id}>Missing component: {id}</div>;
  }

  const componentType = normalizeType(component.type);
  const props = componentProps(component);
  const wrapperProps = {
    'data-cms-content-item-id': contentItemId,
    'data-cms-version-id': versionId,
    'data-cms-component-id': id,
    'data-cms-component-type': component.type
  };
  const bridgeAttrs = {
    'data-cms-content-item-id': contentItemId,
    'data-cms-version-id': versionId
  };
  const fieldAttrs = (path: string) => ({
    ...bridgeAttrs,
    'data-cms-field-path': path
  });

  if (componentType === 'hero' || componentType === 'hero_component') {
    const backgroundAssetRef = typeof props.backgroundAssetRef === 'number' ? props.backgroundAssetRef : null;
    const primaryCta = (props.primaryCta as ContentLink | undefined) ?? null;
    const secondaryCta = (props.secondaryCta as ContentLink | undefined) ?? null;

    return (
      <section key={id} {...wrapperProps} className="cms-section cms-hero">
        {backgroundAssetRef ? (
          <div style={{ position: 'absolute', inset: 0, opacity: 0.2 }}>
            <CmsImage
              assetId={backgroundAssetRef}
              asset={assets[String(backgroundAssetRef)] ?? null}
              kind="large"
              apiBaseUrl={apiBaseUrl}
              fieldPath={`components.${id}.props.backgroundAssetRef`}
              bridgeAttrs={bridgeAttrs}
            />
          </div>
        ) : null}
        <div style={{ position: 'relative', zIndex: 1 }}>
          <h1 {...fieldAttrs(`components.${id}.props.title`)}>{String(props.title ?? 'Demo hero')}</h1>
          <p {...fieldAttrs(`components.${id}.props.subtitle`)}>{String(props.subtitle ?? '')}</p>
          <div className="cms-buttons">
            <CmsLink link={primaryCta} className="cms-btn primary" fieldPath={`components.${id}.props.primaryCta`} bridgeAttrs={bridgeAttrs} />
            <CmsLink link={secondaryCta} className="cms-btn secondary" fieldPath={`components.${id}.props.secondaryCta`} bridgeAttrs={bridgeAttrs} />
          </div>
        </div>
      </section>
    );
  }

  if (componentType === 'feature_grid') {
    const items = Array.isArray(props.items) ? (props.items as Array<{ icon?: string; title?: string; description?: string }>) : [];
    return (
      <section key={id} {...wrapperProps} className="cms-section" id="features">
        <h2 {...fieldAttrs(`components.${id}.props.title`)}>{String(props.title ?? 'Features')}</h2>
        <div className="cms-grid features">
          {items.map((item, index) => (
            <article key={`${id}-${index}`} className="cms-card" {...fieldAttrs(`components.${id}.props.items`)}>
              <h3>{item.icon ? <i className={`pi ${item.icon}`} style={{ marginRight: 6 }} /> : null}{item.title ?? `Feature ${index + 1}`}</h3>
              <p className="cms-muted">{item.description ?? ''}</p>
            </article>
          ))}
        </div>
      </section>
    );
  }

  if (componentType === 'image_text') {
    const imageAssetRef = typeof props.imageAssetRef === 'number' ? props.imageAssetRef : null;
    const invert = Boolean(props.invert);
    const cta = (props.cta as ContentLink | undefined) ?? null;
    return (
      <section key={id} {...wrapperProps} className={`cms-section cms-image-row${invert ? ' invert' : ''}`}>
        <div className="cms-image-wrap">
          <CmsImage
            assetId={imageAssetRef}
            asset={imageAssetRef ? assets[String(imageAssetRef)] ?? null : null}
            kind="medium"
            apiBaseUrl={apiBaseUrl}
            fieldPath={`components.${id}.props.imageAssetRef`}
            bridgeAttrs={bridgeAttrs}
          />
        </div>
        <div>
          <h2 {...fieldAttrs(`components.${id}.props.title`)}>{String(props.title ?? '')}</h2>
          <p className="cms-muted" {...fieldAttrs(`components.${id}.props.body`)}>{String(props.body ?? '')}</p>
          <CmsLink link={cta} className="cms-btn primary" fieldPath={`components.${id}.props.cta`} bridgeAttrs={bridgeAttrs} />
        </div>
      </section>
    );
  }

  if (componentType === 'pricing') {
    const tiers = Array.isArray(props.tiers) ? (props.tiers as Array<Record<string, unknown>>) : [];
    return (
      <section key={id} {...wrapperProps} className="cms-section" id="pricing">
        <h2 {...fieldAttrs(`components.${id}.props.title`)}>{String(props.title ?? 'Pricing')}</h2>
        <div className="cms-pricing-grid">
          {tiers.map((tier, index) => (
            <article key={`${id}-${index}`} className="cms-card cms-pricing-tier" {...fieldAttrs(`components.${id}.props.tiers`)}>
              <h3>{String(tier.name ?? `Tier ${index + 1}`)}</h3>
              <div className="cms-price">{String(tier.price ?? '')}</div>
              <p className="cms-muted">{String(tier.description ?? '')}</p>
              <ul>
                {(Array.isArray(tier.features) ? tier.features : []).map((feature, featureIndex) => (
                  <li key={`${id}-${index}-${featureIndex}`}>{String(feature)}</li>
                ))}
              </ul>
              <CmsLink
                link={(tier.cta as ContentLink | undefined) ?? null}
                className="cms-btn primary"
                fieldPath={`components.${id}.props.tiers`}
                bridgeAttrs={bridgeAttrs}
              />
            </article>
          ))}
        </div>
      </section>
    );
  }

  if (componentType === 'faq') {
    const items = Array.isArray(props.items)
      ? (props.items as Array<{ question?: string; answer?: string }>)
      : [];
    return (
      <section key={id} {...wrapperProps} className="cms-section" id="faq">
        <h2 {...fieldAttrs(`components.${id}.props.title`)}>{String(props.title ?? 'FAQ')}</h2>
        <div>
          {items.map((item, index) => (
            <details key={`${id}-${index}`} className="cms-faq-item" {...fieldAttrs(`components.${id}.props.items`)}>
              <summary>{item.question ?? `Question ${index + 1}`}</summary>
              <p className="cms-muted">{item.answer ?? ''}</p>
            </details>
          ))}
        </div>
      </section>
    );
  }

  if (componentType === 'newsletter_form') {
    const formId = typeof props.formId === 'number' ? props.formId : null;
    const title = typeof props.title === 'string' ? props.title : null;
    const description = typeof props.description === 'string' ? props.description : null;
    const submitLabel = typeof props.submitLabel === 'string' ? props.submitLabel : null;
    return (
      <div key={id} {...wrapperProps}>
        <NewsletterForm
          siteId={siteId}
          marketCode={marketCode}
          localeCode={localeCode}
          routeSlug={routeSlug}
          contentItemId={contentItemId}
          formId={formId}
          {...(title ? { title } : {})}
          {...(description ? { description } : {})}
          {...(submitLabel ? { submitLabel } : {})}
          steps={formId ? forms[String(formId)]?.steps ?? [] : []}
          fields={formId ? forms[String(formId)]?.fields ?? [] : []}
          apiBaseUrl={apiBaseUrl}
          fieldPathPrefix={`components.${id}.props`}
          bridgeAttrs={bridgeAttrs}
        />
      </div>
    );
  }

  if (componentType === 'footer') {
    const linkGroups = Array.isArray(props.linkGroups)
      ? (props.linkGroups as Array<{ title?: string; links?: ContentLink[] }>)
      : [];
    const socials = Array.isArray(props.socialLinks) ? (props.socialLinks as ContentLink[]) : [];
    return (
      <footer key={id} {...wrapperProps} className="cms-section cms-footer">
        <div className="cms-footer-grid">
          {linkGroups.map((group, index) => (
            <div key={`${id}-${index}`} {...fieldAttrs(`components.${id}.props.linkGroups`)}>
              <h4>{group.title ?? `Group ${index + 1}`}</h4>
              <div className="cms-grid">
                {(group.links ?? []).map((entry, linkIndex) => (
                  <CmsLink
                    key={`${id}-${index}-${linkIndex}`}
                    link={entry}
                    fieldPath={`components.${id}.props.linkGroups`}
                    bridgeAttrs={bridgeAttrs}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'space-between', gap: '0.8rem', flexWrap: 'wrap' }}>
          <small {...fieldAttrs(`components.${id}.props.copyright`)}>{String(props.copyright ?? '')}</small>
          <div className="cms-buttons" style={{ marginTop: 0 }}>
            {socials.map((entry, index) => (
              <CmsLink
                key={`${id}-social-${index}`}
                link={entry}
                className="cms-btn secondary"
                fieldPath={`components.${id}.props.socialLinks`}
                bridgeAttrs={bridgeAttrs}
              />
            ))}
          </div>
        </div>
      </footer>
    );
  }

  if (componentType === 'richtext' || componentType === 'text_block') {
    const html = String((props.html as string | undefined) ?? (props.body as string | undefined) ?? '');
    const sanitizedHtml = sanitizeRichTextHtml(html, { marketCode, localeCode, urlPattern, apiBaseUrl });
    return (
      <section key={id} {...wrapperProps} className="cms-section">
        <div
          {...fieldAttrs(`components.${id}.props.body`)}
          data-cms-field-type="richtext"
          dangerouslySetInnerHTML={{ __html: sanitizedHtml || '<p></p>' }}
        />
      </section>
    );
  }

  if (componentType === 'cta') {
    return (
      <section key={id} {...wrapperProps} className="cms-section">
        <a className="cms-btn primary" href={String(props.href ?? '#')} {...fieldAttrs(`components.${id}.props.text`)}>
          {String(props.text ?? 'CTA')}
        </a>
      </section>
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
  const inlineTargetRef = useRef<HTMLElement | null>(null);
  const inlineHandlersRef = useRef<{ blur: () => void; keydown: (event: KeyboardEvent) => void } | null>(null);
  const inlineFeaturesRef = useRef<string[]>([]);
  const actionItemsRef = useRef<CmsActionItem[]>([]);
  const selectedTargetTypeRef = useRef<CmsActionsPayload['targetType']>('unknown');
  const fieldEntries = useMemo(() => Object.entries(fields), [fields]);
  const fieldDefMap = useMemo(() => new Map(fieldDefs.map((def) => [def.key, def])), [fieldDefs]);
  const areas = composition.areas ?? [{ name: 'main', components: Object.keys(components) }];

  const clearInlineTarget = () => {
    const target = inlineTargetRef.current;
    const handlers = inlineHandlersRef.current;
    if (target && handlers) {
      target.removeEventListener('blur', handlers.blur);
      target.removeEventListener('keydown', handlers.keydown);
    }
    if (target) {
      target.removeAttribute('contenteditable');
      target.classList.remove('cms-inline-editing');
    }
    inlineTargetRef.current = null;
    inlineHandlersRef.current = null;
  };

  const postInlineEdit = (target: HTMLElement) => {
    const fieldPath = target.dataset.cmsFieldPath;
    if (!fieldPath) {
      return;
    }
    const html = target.innerHTML;
    window.parent?.postMessage(
      {
        type: 'CMS_INLINE_EDIT',
        fieldPath,
        html
      },
      '*'
    );
  };

  const enableInlineTarget = (target: HTMLElement | null) => {
    clearInlineTarget();
    if (!inlineModeRef.current || !target) {
      return;
    }
    if (target.dataset.cmsFieldType !== 'richtext') {
      return;
    }
    target.setAttribute('contenteditable', 'true');
    target.classList.add('cms-inline-editing');
    const blur = () => postInlineEdit(target);
    const keydown = (event: KeyboardEvent) => {
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
      if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
        event.preventDefault();
        postInlineEdit(target);
        (target as HTMLElement).blur();
      }
    };
    target.addEventListener('blur', blur);
    target.addEventListener('keydown', keydown);
    inlineTargetRef.current = target;
    inlineHandlersRef.current = { blur, keydown };
  };

  const runInlineEditAction = (target: HTMLElement | null) => {
    if (!target) {
      return;
    }
    const fieldPath = target.dataset.cmsFieldPath ?? findDatasetValue(target, 'cmsFieldPath');
    if (!fieldPath) {
      return;
    }
    const targetType = selectedTargetTypeRef.current;
    if (targetType === 'richtext') {
      const previous = inlineModeRef.current;
      inlineModeRef.current = true;
      enableInlineTarget(target);
      window.requestAnimationFrame(() => focusEditableTarget(target));
      if (!previous) {
        window.parent?.postMessage({ type: 'CMS_INLINE_MODE', enabled: true }, '*');
      }
      return;
    }
    if (targetType === 'text') {
      const current = target.textContent ?? '';
      const next = window.prompt('Edit text', current);
      if (next == null) {
        return;
      }
      target.textContent = next;
      window.parent?.postMessage({ type: 'CMS_INLINE_EDIT', fieldPath, html: next }, '*');
      return;
    }
    const currentHtml = target.innerHTML;
    const next = window.prompt('Edit value', currentHtml);
    if (next == null) {
      return;
    }
    target.innerHTML = next;
    window.parent?.postMessage({ type: 'CMS_INLINE_EDIT', fieldPath, html: next }, '*');
  };

  useEffect(() => {
    inlineModeRef.current = Boolean(cmsBridge && inlineEdit);
    if (!inlineModeRef.current) {
      clearInlineTarget();
      return;
    }
    if (selectedRef.current) {
      enableInlineTarget(selectedRef.current);
    }
  }, [cmsBridge, inlineEdit]);

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
      if (actionId === 'inline_edit') {
        runInlineEditAction(target);
      } else {
        emitActionRequest('run', target, actionId);
      }
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
    };

    const onPointerMove = (event: PointerEvent) => {
      const target = getAnnotatedTarget(document.elementFromPoint(event.clientX, event.clientY));
      hoverRef.current = target;
      syncOverlays();
    };

    const onClick = (event: MouseEvent) => {
      const target = getAnnotatedTarget(event.target as Element | null);
      if (!target) {
        return;
      }
      const isInlineRichText = inlineModeRef.current && target.dataset.cmsFieldType === 'richtext';
      if (!isInlineRichText) {
        event.preventDefault();
        event.stopPropagation();
      }
      selectedRef.current = target;
      hideMenus();
      syncOverlays();
      emitSelect(target);
      emitActionRequest('list', target);
      if (inlineModeRef.current) {
        enableInlineTarget(target);
        if (isInlineRichText) {
          window.requestAnimationFrame(() => focusEditableTarget(target));
        }
      }
    };

    const onContextMenu = (event: MouseEvent) => {
      if (event.target instanceof Node && (toolbar.contains(event.target) || overflowMenu.contains(event.target) || contextMenu.contains(event.target))) {
        return;
      }
      const target = getAnnotatedTarget(event.target as Element | null);
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
      const payload = event.data as { type?: string; componentId?: string; fieldPath?: string } | undefined;
      if (!payload?.type) {
        return;
      }
      if (payload.type === 'CMS_ACTIONS') {
        const actionsPayload = payload as CmsActionsPayload;
        actionItemsRef.current = Array.isArray(actionsPayload.actions) ? actionsPayload.actions : [];
        selectedTargetTypeRef.current = actionsPayload.targetType ?? 'unknown';
        renderToolbar();
        return;
      }
      if (payload.type === 'CMS_HIGHLIGHT') {
        inlineFeaturesRef.current = Array.isArray((payload as { richTextFeatures?: string[] }).richTextFeatures)
          ? ((payload as { richTextFeatures?: string[] }).richTextFeatures ?? [])
          : [];
        selectedRef.current = findByBridgeSelector(payload.componentId, payload.fieldPath);
        syncOverlays();
        if (selectedRef.current) {
          emitActionRequest('list', selectedRef.current);
        } else {
          actionItemsRef.current = [];
          selectedTargetTypeRef.current = 'unknown';
        }
        if (inlineModeRef.current) {
          enableInlineTarget(selectedRef.current);
        }
      }
      if (payload.type === 'CMS_SCROLL_TO' && payload.componentId) {
        const target = findByBridgeSelector(payload.componentId, undefined);
        target?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      if (payload.type === 'CMS_INLINE_MODE') {
        const enabled = Boolean((payload as { enabled?: boolean }).enabled);
        inlineModeRef.current = enabled;
        if (!enabled) {
          inlineFeaturesRef.current = [];
          clearInlineTarget();
        } else if (selectedRef.current) {
          enableInlineTarget(selectedRef.current);
        }
      }
      if (payload.type === 'CMS_REFRESH') {
        window.location.reload();
      }
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('click', onClick, true);
    window.addEventListener('contextmenu', onContextMenu, true);
    window.addEventListener('click', onWindowClick);
    window.addEventListener('resize', syncOverlays);
    window.addEventListener('scroll', syncOverlays, true);
    window.addEventListener('message', onMessage);

    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('click', onClick, true);
      window.removeEventListener('contextmenu', onContextMenu, true);
      window.removeEventListener('click', onWindowClick);
      window.removeEventListener('resize', syncOverlays);
      window.removeEventListener('scroll', syncOverlays, true);
      window.removeEventListener('message', onMessage);
      clearInlineTarget();
      hover.remove();
      selected.remove();
      toolbar.remove();
      overflowMenu.remove();
      contextMenu.remove();
      hoverRef.current = null;
      selectedRef.current = null;
      actionItemsRef.current = [];
      selectedTargetTypeRef.current = 'unknown';
    };
  }, [cmsBridge]);

  return (
    <main className="cms-page">
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
                <div
                  data-cms-field-path={`fields.${key}`}
                  data-cms-field-type="richtext"
                  data-cms-content-item-id={contentItemId}
                  data-cms-version-id={versionId}
                  dangerouslySetInnerHTML={{ __html: sanitizedHtml || '<p></p>' }}
                />
              </div>
            );
          }
          return (
            <div key={key} data-cms-field-path={`fields.${key}`} data-cms-content-item-id={contentItemId} data-cms-version-id={versionId}>
              <strong>{key}:</strong> <span className="cms-muted">{String(value ?? '')}</span>
            </div>
          );
        })}
      </section>
      {areas.map((area) => (
        <section key={area.name} style={{ display: 'grid', gap: '0.9rem' }}>
          {area.components.map((componentId) =>
            renderComponent(siteId, marketCode, localeCode, urlPattern, routeSlug, contentItemId, versionId, componentId, components[componentId], forms, assets, apiBaseUrl)
          )}
        </section>
      ))}
    </main>
  );
}
