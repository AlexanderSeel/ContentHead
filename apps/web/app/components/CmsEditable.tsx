'use client';

import { Fragment, createElement, type CSSProperties, type ReactNode, useLayoutEffect, useMemo, useRef } from 'react';

import {
  buildEditTargetId,
  type CmsEditKind,
  type CmsEditMeta,
  type CmsEditRole,
  toDataset
} from '../../src/inlineEditEngine';

type TargetElement = 'span' | 'div';
type WrapperElement = keyof JSX.IntrinsicElements;

type CmsEditableProps = {
  enabled: boolean;
  contentItemId: number;
  versionId: number;
  fieldPath: string;
  kind: CmsEditKind;
  value?: string;
  html?: string;
  role?: CmsEditRole;
  componentId?: string;
  componentType?: string;
  meta?: CmsEditMeta;
  keySuffix?: string;
  wrapperAs?: WrapperElement;
  targetAs?: TargetElement;
  className?: string;
  style?: CSSProperties;
  targetClassName?: string;
  targetStyle?: CSSProperties;
  wrapperProps?: Record<string, unknown>;
  targetProps?: Record<string, unknown>;
  children?: ReactNode;
};

export function CmsEditable({
  enabled,
  contentItemId,
  versionId,
  fieldPath,
  kind,
  value,
  html,
  role,
  componentId,
  componentType,
  meta,
  keySuffix,
  wrapperAs = 'span',
  targetAs,
  className,
  style,
  targetClassName,
  targetStyle,
  wrapperProps,
  targetProps,
  children
}: CmsEditableProps) {
  const resolvedTargetAs = targetAs ?? (kind === 'richtext' ? 'div' : 'span');
  const editTargetId = useMemo(
    () =>
      buildEditTargetId({
        contentItemId,
        versionId,
        fieldPath,
        kind,
        ...(componentId ? { componentId } : {}),
        ...(role ? { role } : {}),
        ...(keySuffix ? { key: keySuffix } : {})
      }),
    [contentItemId, versionId, fieldPath, kind, componentId, role, keySuffix]
  );
  const targetRef = useRef<HTMLElement | null>(null);

  useLayoutEffect(() => {
    const target = targetRef.current;
    if (!target) {
      return;
    }
    const wrapper = target.closest<HTMLElement>('[data-cms-editable="true"]');
    const editing = wrapper?.dataset.cmsEditing === 'true' || target.getAttribute('contenteditable') === 'true';
    if (editing) {
      return;
    }
    // Root cause fix: React reconciliation can replace mutable contentEditable text after bridge messages.
    // We keep the editable target DOM unmanaged while editing, and only sync content when not editing.
    if (kind === 'richtext') {
      const nextHtml = html ?? value ?? '';
      if (target.innerHTML !== nextHtml) {
        target.innerHTML = nextHtml;
      }
      return;
    }
    const nextText = value ?? '';
    if (target.textContent !== nextText) {
      target.textContent = nextText;
    }
  }, [kind, html, value]);

  if (!enabled) {
    return createElement(
      wrapperAs,
      {
        ...(wrapperProps ?? {}),
        className,
        style
      },
      kind === 'richtext'
        ? createElement(resolvedTargetAs, {
            ...(targetProps ?? {}),
            className: targetClassName,
            style: targetStyle,
            dangerouslySetInnerHTML: { __html: html ?? value ?? '' }
          })
        : children ??
            createElement(
              resolvedTargetAs,
              {
                ...(targetProps ?? {}),
                className: targetClassName,
                style: targetStyle
              },
              value ?? ''
            )
    );
  }

  const dataset = toDataset({
    contentItemId,
    versionId,
    fieldPath,
    kind,
    editTargetId,
    ...(meta ? { meta } : {}),
    ...(componentId ? { componentId } : {}),
    ...(componentType ? { componentType } : {}),
    ...(role ? { role } : {})
  });

  const wrapperDatasetProps: Record<string, string | number> = {
    'data-cms-editable': 'true',
    'data-cms-content-item-id': dataset.contentItemId,
    'data-cms-version-id': dataset.versionId,
    'data-cms-field-path': dataset.fieldPath,
    'data-cms-edit-kind': dataset.kind,
    'data-cms-edit-target-id': dataset.editTargetId,
    'data-cms-edit-meta': dataset.metaJson,
    ...(dataset.componentId ? { 'data-cms-component-id': dataset.componentId } : {}),
    ...(dataset.componentType ? { 'data-cms-component-type': dataset.componentType } : {}),
    ...(dataset.role ? { 'data-cms-edit-role': dataset.role } : {})
  };

  const targetNode =
    kind === 'richtext'
      ? createElement(resolvedTargetAs, {
          ...(targetProps ?? {}),
          ref: targetRef,
          className: targetClassName,
          style: targetStyle,
          'data-cms-edit-target': 'true',
          'data-cms-edit-target-id': editTargetId,
          dangerouslySetInnerHTML: { __html: html ?? value ?? '' }
        })
      : createElement(
          resolvedTargetAs,
          {
            ...(targetProps ?? {}),
            ref: targetRef,
            className: targetClassName,
            style: targetStyle,
            'data-cms-edit-target': 'true',
            'data-cms-edit-target-id': editTargetId
          },
          value ?? ''
        );

  return createElement(
    wrapperAs,
    {
      ...(wrapperProps ?? {}),
      ...wrapperDatasetProps,
      className,
      style
    },
    children && kind !== 'text' && kind !== 'richtext'
      ? createElement(
          Fragment,
          null,
          children,
          createElement(
            'span',
            {
              key: `target-${editTargetId}`,
              style: {
                position: 'absolute',
                width: '1px',
                height: '1px',
                margin: '-1px',
                border: 0,
                padding: 0,
                overflow: 'hidden',
                clipPath: 'inset(100%)'
              }
            },
            targetNode
          )
        )
      : targetNode
  );
}
