'use client';

import { useMemo } from 'react';
import type { ReactNode } from 'react';

type ComponentPayload = {
  type: string;
  title?: string;
  subtitle?: string;
  html?: string;
  items?: Array<{ title: string; href: string }>;
};

type AreaPayload = {
  name: string;
  components: string[];
};

type PreviewClientProps = {
  contentItemId: number;
  versionId: number;
  fields: Record<string, unknown>;
  composition: { areas?: AreaPayload[] };
  components: Record<string, ComponentPayload>;
};

function emitSelection(payload: {
  fieldPath: string;
  componentId?: string;
  contentItemId: number;
  versionId: number;
}): void {
  if (typeof window === 'undefined') {
    return;
  }

  window.parent?.postMessage(
    {
      type: 'cms-preview-select',
      ...payload
    },
    '*'
  );
}

function AnnotatedField({
  contentItemId,
  versionId,
  fieldPath,
  children
}: {
  contentItemId: number;
  versionId: number;
  fieldPath: string;
  children: ReactNode;
}) {
  return (
    <span
      data-cms-content-item-id={contentItemId}
      data-cms-version-id={versionId}
      data-cms-field-path={fieldPath}
      onMouseEnter={() => emitSelection({ fieldPath, contentItemId, versionId })}
      onClick={() => emitSelection({ fieldPath, contentItemId, versionId })}
      style={{ outline: '1px dashed transparent' }}
    >
      {children}
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

  const baseProps = {
    'data-cms-content-item-id': contentItemId,
    'data-cms-version-id': versionId,
    'data-cms-component-id': id,
    onMouseEnter: () => emitSelection({ fieldPath: `components.${id}`, componentId: id, contentItemId, versionId }),
    onClick: () => emitSelection({ fieldPath: `components.${id}`, componentId: id, contentItemId, versionId })
  };

  if (component.type === 'Hero') {
    return (
      <section key={id} {...baseProps} style={{ padding: '2rem', border: '1px solid #cbd5e1', borderRadius: 8 }}>
        <h1>
          <AnnotatedField contentItemId={contentItemId} versionId={versionId} fieldPath={`components.${id}.title`}>
            {component.title ?? 'Hero Title'}
          </AnnotatedField>
        </h1>
        <p>
          <AnnotatedField contentItemId={contentItemId} versionId={versionId} fieldPath={`components.${id}.subtitle`}>
            {component.subtitle ?? ''}
          </AnnotatedField>
        </p>
      </section>
    );
  }

  if (component.type === 'RichText') {
    return (
      <section key={id} {...baseProps} style={{ padding: '1rem 0' }}>
        <div
          data-cms-content-item-id={contentItemId}
          data-cms-version-id={versionId}
          data-cms-field-path={`components.${id}.html`}
          onMouseEnter={() => emitSelection({ fieldPath: `components.${id}.html`, componentId: id, contentItemId, versionId })}
          onClick={() => emitSelection({ fieldPath: `components.${id}.html`, componentId: id, contentItemId, versionId })}
          dangerouslySetInnerHTML={{ __html: component.html ?? '<p></p>' }}
        />
      </section>
    );
  }

  if (component.type === 'TeaserGrid') {
    return (
      <section key={id} {...baseProps}>
        <div style={{ display: 'grid', gap: '0.75rem', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))' }}>
          {(component.items ?? []).map((item, index) => (
            <a
              key={`${id}-${index}`}
              href={item.href}
              style={{ border: '1px solid #cbd5e1', borderRadius: 8, padding: '1rem', textDecoration: 'none', color: '#0f172a' }}
              data-cms-content-item-id={contentItemId}
              data-cms-version-id={versionId}
              data-cms-field-path={`components.${id}.items.${index}.title`}
              onMouseEnter={() =>
                emitSelection({
                  fieldPath: `components.${id}.items.${index}.title`,
                  componentId: id,
                  contentItemId,
                  versionId
                })
              }
              onClick={() =>
                emitSelection({
                  fieldPath: `components.${id}.items.${index}.title`,
                  componentId: id,
                  contentItemId,
                  versionId
                })
              }
            >
              {item.title}
            </a>
          ))}
        </div>
      </section>
    );
  }

  return <div key={id}>Unsupported component type: {component.type}</div>;
}

export function PreviewClient({ contentItemId, versionId, fields, composition, components }: PreviewClientProps) {
  const fieldEntries = useMemo(() => Object.entries(fields), [fields]);
  const areas = composition.areas ?? [{ name: 'main', components: Object.keys(components) }];

  return (
    <main style={{ maxWidth: 960, margin: '0 auto', padding: '2rem' }}>
      <h2>Preview Item #{contentItemId}</h2>
      <p style={{ color: '#64748b' }}>Version #{versionId}</p>
      <section style={{ marginBottom: '1rem' }}>
        {fieldEntries.map(([key, value]) => (
          <div key={key} style={{ marginBottom: '0.25rem' }}>
            <strong>{key}:</strong>{' '}
            <AnnotatedField contentItemId={contentItemId} versionId={versionId} fieldPath={`fields.${key}`}>
              {String(value ?? '')}
            </AnnotatedField>
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
