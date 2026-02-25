export type InlineMode = 'text' | 'richtext';

export type InlineTargetData = {
  inlineKind?: string | null | undefined;
  fieldType?: string | null | undefined;
  fieldPath?: string | null | undefined;
  componentId?: string | null | undefined;
  propPath?: string | null | undefined;
};

export function resolveInlineMode(data: InlineTargetData): InlineMode | null {
  if (data.inlineKind === 'text' || data.inlineKind === 'richtext') {
    return data.inlineKind;
  }
  if (data.fieldType === 'richtext') {
    return 'richtext';
  }
  return null;
}

export function resolveInlineFieldPath(data: InlineTargetData): string | null {
  const fieldPath = data.fieldPath?.trim();
  if (fieldPath) {
    return fieldPath;
  }
  const componentId = data.componentId?.trim();
  const propPath = data.propPath?.trim();
  if (!componentId || !propPath) {
    return null;
  }
  return `components.${componentId}.props.${propPath}`;
}

export function shouldCommit(mode: InlineMode, event: { key: string; shiftKey?: boolean; ctrlKey?: boolean; metaKey?: boolean }): boolean {
  if (mode === 'text') {
    return event.key === 'Enter' && !event.shiftKey && !event.ctrlKey && !event.metaKey;
  }
  return event.key === 'Enter' && Boolean(event.ctrlKey || event.metaKey);
}
