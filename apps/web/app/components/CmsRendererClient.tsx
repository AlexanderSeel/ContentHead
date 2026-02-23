'use client';

import { type FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { evaluateFieldConditions, type FormConditionSet, type FormEvaluationContext } from '@contenthead/shared';

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

type CmsRendererClientProps = {
  contentItemId: number;
  versionId: number;
  siteId?: number;
  marketCode?: string;
  localeCode?: string;
  routeSlug?: string;
  fields: Record<string, unknown>;
  composition: { areas?: AreaPayload[] };
  components: Record<string, ComponentPayload>;
  cmsBridge: boolean;
  forms?: Record<string, { fields: FormFieldPayload[]; steps?: FormStepPayload[] }>;
  assets?: Record<string, AssetPayload>;
  apiBaseUrl?: string;
};

type CmsRect = { top: number; left: number; width: number; height: number };

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

function emitSelect(target: HTMLElement) {
  const contentItemId = Number(target.dataset.cmsContentItemId ?? '0');
  const versionId = Number(target.dataset.cmsVersionId ?? '0');
  const payload = {
    type: 'CMS_SELECT',
    contentItemId,
    versionId,
    componentId: target.dataset.cmsComponentId,
    componentType: target.dataset.cmsComponentType,
    fieldPath: target.dataset.cmsFieldPath,
    rect: toRect(target)
  };

  if (window.parent && window.parent !== window) {
    window.parent.postMessage(payload, '*');
  }
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

function CmsLink({ link, className }: { link?: ContentLink | null; className?: string }) {
  if (!link) {
    return null;
  }
  return (
    <a className={className} href={linkHref(link)} target={link.target ?? '_self'} rel={link.target === '_blank' ? 'noreferrer' : undefined}>
      {link.text ?? link.url ?? 'Learn more'}
    </a>
  );
}

function CmsImage({
  assetId,
  asset,
  kind,
  altOverride,
  apiBaseUrl
}: {
  assetId?: number | null;
  asset?: AssetPayload | null;
  kind?: 'thumb' | 'small' | 'medium' | 'large';
  altOverride?: string;
  apiBaseUrl: string;
}) {
  if (!assetId) {
    return null;
  }
  const url = kind ? `${apiBaseUrl}/assets/${assetId}/rendition/${kind}` : `${apiBaseUrl}/assets/${assetId}`;
  const alt = altOverride ?? asset?.altText ?? asset?.title ?? `Asset ${assetId}`;
  return <img src={url} alt={alt} loading="lazy" />;
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
  apiBaseUrl
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
      <h2>{title ?? 'Newsletter'}</h2>
      <p className="cms-muted">{description ?? 'Stay updated with product releases.'}</p>
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
        <button className="cms-btn primary" type="submit">
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

  if (componentType === 'hero' || componentType === 'hero_component') {
    const backgroundAssetRef = typeof props.backgroundAssetRef === 'number' ? props.backgroundAssetRef : null;
    const primaryCta = (props.primaryCta as ContentLink | undefined) ?? null;
    const secondaryCta = (props.secondaryCta as ContentLink | undefined) ?? null;

    return (
      <section key={id} {...wrapperProps} className="cms-section cms-hero">
        {backgroundAssetRef ? (
          <div style={{ position: 'absolute', inset: 0, opacity: 0.2 }}>
            <CmsImage assetId={backgroundAssetRef} asset={assets[String(backgroundAssetRef)] ?? null} kind="large" apiBaseUrl={apiBaseUrl} />
          </div>
        ) : null}
        <div style={{ position: 'relative', zIndex: 1 }}>
          <h1 data-cms-field-path={`components.${id}.props.title`}>{String(props.title ?? 'Demo hero')}</h1>
          <p data-cms-field-path={`components.${id}.props.subtitle`}>{String(props.subtitle ?? '')}</p>
          <div className="cms-buttons">
            <CmsLink link={primaryCta} className="cms-btn primary" />
            <CmsLink link={secondaryCta} className="cms-btn secondary" />
          </div>
        </div>
      </section>
    );
  }

  if (componentType === 'feature_grid') {
    const items = Array.isArray(props.items) ? (props.items as Array<{ icon?: string; title?: string; description?: string }>) : [];
    return (
      <section key={id} {...wrapperProps} className="cms-section" id="features">
        <h2>{String(props.title ?? 'Features')}</h2>
        <div className="cms-grid features">
          {items.map((item, index) => (
            <article key={`${id}-${index}`} className="cms-card" data-cms-field-path={`components.${id}.props.items.${index}.title`}>
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
          <CmsImage assetId={imageAssetRef} asset={imageAssetRef ? assets[String(imageAssetRef)] ?? null : null} kind="medium" apiBaseUrl={apiBaseUrl} />
        </div>
        <div>
          <h2>{String(props.title ?? '')}</h2>
          <p className="cms-muted">{String(props.body ?? '')}</p>
          <CmsLink link={cta} className="cms-btn primary" />
        </div>
      </section>
    );
  }

  if (componentType === 'pricing') {
    const tiers = Array.isArray(props.tiers) ? (props.tiers as Array<Record<string, unknown>>) : [];
    return (
      <section key={id} {...wrapperProps} className="cms-section" id="pricing">
        <h2>{String(props.title ?? 'Pricing')}</h2>
        <div className="cms-pricing-grid">
          {tiers.map((tier, index) => (
            <article key={`${id}-${index}`} className="cms-card cms-pricing-tier">
              <h3>{String(tier.name ?? `Tier ${index + 1}`)}</h3>
              <div className="cms-price">{String(tier.price ?? '')}</div>
              <p className="cms-muted">{String(tier.description ?? '')}</p>
              <ul>
                {(Array.isArray(tier.features) ? tier.features : []).map((feature, featureIndex) => (
                  <li key={`${id}-${index}-${featureIndex}`}>{String(feature)}</li>
                ))}
              </ul>
              <CmsLink link={(tier.cta as ContentLink | undefined) ?? null} className="cms-btn primary" />
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
        <h2>{String(props.title ?? 'FAQ')}</h2>
        <div>
          {items.map((item, index) => (
            <details key={`${id}-${index}`} className="cms-faq-item">
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
            <div key={`${id}-${index}`}>
              <h4>{group.title ?? `Group ${index + 1}`}</h4>
              <div className="cms-grid">
                {(group.links ?? []).map((entry, linkIndex) => (
                  <CmsLink key={`${id}-${index}-${linkIndex}`} link={entry} />
                ))}
              </div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'space-between', gap: '0.8rem', flexWrap: 'wrap' }}>
          <small>{String(props.copyright ?? '')}</small>
          <div className="cms-buttons" style={{ marginTop: 0 }}>
            {socials.map((entry, index) => (
              <CmsLink key={`${id}-social-${index}`} link={entry} className="cms-btn secondary" />
            ))}
          </div>
        </div>
      </footer>
    );
  }

  if (componentType === 'richtext' || componentType === 'text_block') {
    const html = String((props.html as string | undefined) ?? (props.body as string | undefined) ?? '');
    return (
      <section key={id} {...wrapperProps} className="cms-section">
        <div data-cms-field-path={`components.${id}.props.body`} dangerouslySetInnerHTML={{ __html: html || '<p></p>' }} />
      </section>
    );
  }

  if (componentType === 'cta') {
    return (
      <section key={id} {...wrapperProps} className="cms-section">
        <a className="cms-btn primary" href={String(props.href ?? '#')}>
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
  routeSlug = '',
  fields,
  composition,
  components,
  cmsBridge,
  forms = {},
  assets = {},
  apiBaseUrl = 'http://localhost:4000'
}: CmsRendererClientProps) {
  const hoverRef = useRef<HTMLElement | null>(null);
  const selectedRef = useRef<HTMLElement | null>(null);
  const fieldEntries = useMemo(() => Object.entries(fields), [fields]);
  const areas = composition.areas ?? [{ name: 'main', components: Object.keys(components) }];

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

    const syncOverlays = () => {
      drawOverlay(hover, hoverRef.current, '#2563eb', 'rgba(37, 99, 235, 0.08)');
      drawOverlay(selected, selectedRef.current, '#f97316', 'rgba(249, 115, 22, 0.08)');
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
      event.preventDefault();
      event.stopPropagation();
      selectedRef.current = target;
      syncOverlays();
      emitSelect(target);
    };

    const onMessage = (event: MessageEvent<unknown>) => {
      const payload = event.data as { type?: string; componentId?: string; fieldPath?: string } | undefined;
      if (!payload?.type) {
        return;
      }
      if (payload.type === 'CMS_HIGHLIGHT') {
        selectedRef.current = findByBridgeSelector(payload.componentId, payload.fieldPath);
        syncOverlays();
      }
      if (payload.type === 'CMS_SCROLL_TO' && payload.componentId) {
        const target = findByBridgeSelector(payload.componentId, undefined);
        target?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      if (payload.type === 'CMS_REFRESH') {
        window.location.reload();
      }
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('click', onClick, true);
    window.addEventListener('resize', syncOverlays);
    window.addEventListener('scroll', syncOverlays, true);
    window.addEventListener('message', onMessage);

    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('click', onClick, true);
      window.removeEventListener('resize', syncOverlays);
      window.removeEventListener('scroll', syncOverlays, true);
      window.removeEventListener('message', onMessage);
      hover.remove();
      selected.remove();
      hoverRef.current = null;
      selectedRef.current = null;
    };
  }, [cmsBridge]);

  return (
    <main className="cms-page">
      <section className="cms-section" style={{ marginBottom: '0.9rem' }}>
        {fieldEntries.map(([key, value]) => (
          <div key={key} data-cms-field-path={`fields.${key}`} data-cms-content-item-id={contentItemId} data-cms-version-id={versionId}>
            <strong>{key}:</strong> <span className="cms-muted">{String(value ?? '')}</span>
          </div>
        ))}
      </section>
      {areas.map((area) => (
        <section key={area.name} style={{ display: 'grid', gap: '0.9rem' }}>
          {area.components.map((componentId) =>
            renderComponent(siteId, marketCode, localeCode, routeSlug, contentItemId, versionId, componentId, components[componentId], forms, assets, apiBaseUrl)
          )}
        </section>
      ))}
    </main>
  );
}
