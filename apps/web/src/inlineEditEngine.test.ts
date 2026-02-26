import { describe, expect, it } from 'vitest';

import {
  findEditableWrapper,
  parseEditMeta,
  readTargetValue,
  resolveEditTarget,
  resolveEditableSelection,
  shouldCommit
} from './inlineEditEngine';

describe('inlineEditEngine', () => {
  it('selects editable wrapper from nested click target', () => {
    const wrapper = { dataset: { cmsEditable: 'true' } } as unknown as HTMLElement;
    const child = {
      closest: (selector: string) => (selector === '[data-cms-editable="true"]' ? wrapper : null)
    } as unknown as Element;
    expect(findEditableWrapper(child)).toBe(wrapper);
  });

  it('resolves editable selection metadata', () => {
    const wrapper = {
      dataset: {
        cmsContentItemId: '42',
        cmsVersionId: '7',
        cmsFieldPath: 'fields.title',
        cmsComponentId: 'hero_1',
        cmsComponentType: 'hero',
        cmsEditKind: 'text',
        cmsEditTargetId: '42|7|hero_1|fields.title|text|value|0'
      }
    } as unknown as HTMLElement;

    expect(resolveEditableSelection(wrapper)).toEqual({
      editTargetId: '42|7|hero_1|fields.title|text|value|0',
      contentItemId: 42,
      versionId: 7,
      fieldPath: 'fields.title',
      componentId: 'hero_1',
      componentType: 'hero',
      mode: 'text'
    });
  });

  it('finds the explicit edit target inside wrapper', () => {
    const targetA = { dataset: { cmsEditTargetId: 'a' } } as unknown as HTMLElement;
    const targetB = { dataset: { cmsEditTargetId: 'b' } } as unknown as HTMLElement;
    const wrapper = {
      dataset: { cmsEditTargetId: 'b' },
      querySelectorAll: () => [targetA, targetB]
    } as unknown as HTMLElement;

    expect(resolveEditTarget(wrapper)).toBe(targetB);
  });

  it('reads text and richtext values and commit keys', () => {
    const textTarget = { textContent: 'Headline', innerHTML: '<p>Headline</p>' } as unknown as HTMLElement;
    expect(readTargetValue(textTarget, 'text')).toBe('Headline');
    expect(readTargetValue(textTarget, 'richtext')).toBe('<p>Headline</p>');

    expect(shouldCommit('text', parseEditMeta('{"commit":"enter"}'), { key: 'Enter' })).toBe(true);
    expect(shouldCommit('text', parseEditMeta('{"commit":"enter"}'), { key: 'Enter', shiftKey: true })).toBe(false);
    expect(shouldCommit('richtext', parseEditMeta('{"commit":"ctrl_enter"}'), { key: 'Enter', ctrlKey: true })).toBe(true);
    expect(shouldCommit('richtext', parseEditMeta('{"commit":"ctrl_enter"}'), { key: 'Enter' })).toBe(false);
  });
});
