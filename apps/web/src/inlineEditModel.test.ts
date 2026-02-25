import { describe, expect, it } from 'vitest';

import { resolveInlineFieldPath, resolveInlineMode, shouldCommit } from './inlineEditModel';

describe('inlineEditModel', () => {
  it('resolves inline mode from inlineKind and field type', () => {
    expect(resolveInlineMode({ inlineKind: 'text' })).toBe('text');
    expect(resolveInlineMode({ fieldType: 'richtext' })).toBe('richtext');
    expect(resolveInlineMode({ inlineKind: 'asset' })).toBeNull();
  });

  it('resolves component prop path when fieldPath is missing', () => {
    expect(resolveInlineFieldPath({ componentId: 'hero_1', propPath: 'title' })).toBe('components.hero_1.props.title');
  });

  it('commits text with Enter and richtext with Ctrl+Enter', () => {
    expect(shouldCommit('text', { key: 'Enter' })).toBe(true);
    expect(shouldCommit('text', { key: 'Enter', shiftKey: true })).toBe(false);
    expect(shouldCommit('richtext', { key: 'Enter', ctrlKey: true })).toBe(true);
    expect(shouldCommit('richtext', { key: 'Enter' })).toBe(false);
  });
});
