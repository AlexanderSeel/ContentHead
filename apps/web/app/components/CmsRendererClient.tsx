'use client';

import { useEffect, useMemo, useRef } from 'react';

type ComponentPayload = {
  type: string;
  title?: string;
  subtitle?: string;
  body?: string;
  text?: string;
  html?: string;
  href?: string;
  items?: Array<{ title: string; href: string }>;
};

type AreaPayload = {
  name: string;
  components: string[];
};

type CmsRendererClientProps = {
  contentItemId: number;
  versionId: number;
  fields: Record<string, unknown>;
  composition: { areas?: AreaPayload[] };
  components: Record<string, ComponentPayload>;
  cmsBridge: boolean;
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
  return type.trim().toLowerCase();
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

function FieldText({
  contentItemId,
  versionId,
  fieldPath,
  value
}: {
  contentItemId: number;
  versionId: number;
  fieldPath: string;
  value: string;
}) {
  return (
    <span
      data-cms-content-item-id={contentItemId}
      data-cms-version-id={versionId}
      data-cms-field-path={fieldPath}
      data-cms-component-type="field"
    >
      {value}
    </span>
  );
}

function renderComponent(
  contentItemId: number,
  versionId: number,
  id: string,
  component: ComponentPayload | undefined
) {
  if (!component) {
    return <div key={id}>Missing component: {id}</div>;
  }

  const componentType = normalizeType(component.type);
  const wrapperProps = {
    'data-cms-content-item-id': contentItemId,
    'data-cms-version-id': versionId,
    'data-cms-component-id': id,
    'data-cms-component-type': component.type
  };

  if (componentType === 'hero') {
    return (
      <section key={id} {...wrapperProps} style={{ padding: '2rem', border: '1px solid #cbd5e1', borderRadius: 8 }}>
        <h1>
          <FieldText contentItemId={contentItemId} versionId={versionId} fieldPath={`components.${id}.props.title`} value={String(component.title ?? '')} />
        </h1>
        <p>
          <FieldText contentItemId={contentItemId} versionId={versionId} fieldPath={`components.${id}.props.subtitle`} value={String(component.subtitle ?? '')} />
        </p>
      </section>
    );
  }

  if (componentType === 'richtext' || componentType === 'text_block') {
    const html = String(component.html ?? component.body ?? component.text ?? '');
    return (
      <section key={id} {...wrapperProps} style={{ padding: '1rem 0' }}>
        <div
          data-cms-content-item-id={contentItemId}
          data-cms-version-id={versionId}
          data-cms-component-id={id}
          data-cms-component-type={component.type}
          data-cms-field-path={`components.${id}.props.body`}
          dangerouslySetInnerHTML={{ __html: html || '<p></p>' }}
        />
      </section>
    );
  }

  if (componentType === 'teasergrid') {
    return (
      <section key={id} {...wrapperProps}>
        <div style={{ display: 'grid', gap: '0.75rem', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))' }}>
          {(component.items ?? []).map((item, index) => (
            <a
              key={`${id}-${index}`}
              href={item.href}
              style={{ border: '1px solid #cbd5e1', borderRadius: 8, padding: '1rem', textDecoration: 'none', color: '#0f172a' }}
              data-cms-content-item-id={contentItemId}
              data-cms-version-id={versionId}
              data-cms-component-id={id}
              data-cms-component-type={component.type}
              data-cms-field-path={`components.${id}.props.items.${index}.title`}
            >
              {item.title}
            </a>
          ))}
        </div>
      </section>
    );
  }

  if (componentType === 'cta') {
    return (
      <section key={id} {...wrapperProps} style={{ padding: '0.5rem 0' }}>
        <a
          href={component.href ?? '#'}
          data-cms-content-item-id={contentItemId}
          data-cms-version-id={versionId}
          data-cms-component-id={id}
          data-cms-component-type={component.type}
          data-cms-field-path={`components.${id}.props.text`}
          style={{ display: 'inline-block', border: '1px solid #0f172a', borderRadius: 999, padding: '0.4rem 0.9rem', textDecoration: 'none', color: '#0f172a' }}
        >
          {String(component.text ?? 'CTA')}
        </a>
      </section>
    );
  }

  return <div key={id}>Unsupported component type: {component.type}</div>;
}

export function CmsRendererClient({ contentItemId, versionId, fields, composition, components, cmsBridge }: CmsRendererClientProps) {
  const hoverRef = useRef<HTMLElement | null>(null);
  const selectedRef = useRef<HTMLElement | null>(null);
  const hoverOverlayRef = useRef<HTMLDivElement | null>(null);
  const selectedOverlayRef = useRef<HTMLDivElement | null>(null);
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
    hoverOverlayRef.current = hover;

    const selected = document.createElement('div');
    selected.style.position = 'fixed';
    selected.style.pointerEvents = 'none';
    selected.style.zIndex = '2147483647';
    selected.style.border = '2px solid transparent';
    selected.style.borderRadius = '6px';
    selected.style.display = 'none';
    document.body.appendChild(selected);
    selectedOverlayRef.current = selected;

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
      hoverOverlayRef.current = null;
      selectedOverlayRef.current = null;
      hoverRef.current = null;
      selectedRef.current = null;
    };
  }, [cmsBridge]);

  return (
    <main style={{ maxWidth: 960, margin: '0 auto', padding: '2rem' }}>
      <h2>Preview Item #{contentItemId}</h2>
      <p style={{ color: '#64748b' }}>Version #{versionId}</p>
      <section style={{ marginBottom: '1rem' }}>
        {fieldEntries.map(([key, value]) => (
          <div
            key={key}
            style={{ marginBottom: '0.25rem' }}
            data-cms-content-item-id={contentItemId}
            data-cms-version-id={versionId}
            data-cms-field-path={`fields.${key}`}
            data-cms-component-type="field"
          >
            <strong>{key}:</strong> {String(value ?? '')}
          </div>
        ))}
      </section>
      {areas.map((area) => (
        <section key={area.name} style={{ marginBottom: '1.5rem', display: 'grid', gap: '1rem' }}>
          {area.components.map((componentId) => renderComponent(contentItemId, versionId, componentId, components[componentId]))}
        </section>
      ))}
    </main>
  );
}
