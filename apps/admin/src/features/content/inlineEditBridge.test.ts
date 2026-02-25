import { describe, expect, it, vi } from 'vitest';

import { handleInlineEditPatchMessage, resolveInlineEditFieldPath } from './inlineEditBridge';

describe('inlineEditBridge', () => {
  it('resolves a component prop path when fieldPath is missing', () => {
    expect(
      resolveInlineEditFieldPath({
        componentId: 'hero_1',
        propPath: 'title'
      })
    ).toBe('components.hero_1.props.title');
  });

  it('applies PATCH and schedules debounced save', () => {
    const applyValueByPath = vi.fn().mockReturnValue(true);
    const scheduleSave = vi.fn();

    const result = handleInlineEditPatchMessage({
      selectedItemId: 42,
      hasDraft: true,
      message: {
        type: 'CMS_INLINE_EDIT_PATCH',
        contentItemId: 42,
        versionId: 7,
        mode: 'text',
        value: 'Hello',
        fieldPath: 'fields.title'
      },
      applyValueByPath,
      scheduleSave
    });

    expect(result).toEqual({
      handled: true,
      applied: true,
      fieldPath: 'fields.title'
    });
    expect(applyValueByPath).toHaveBeenCalledWith('fields.title', 'Hello');
    expect(scheduleSave).toHaveBeenCalledWith({
      force: false,
      delay: 900,
      fieldPath: 'fields.title'
    });
  });

  it('forces immediate save for COMMIT', () => {
    const applyValueByPath = vi.fn().mockReturnValue(true);
    const scheduleSave = vi.fn();

    handleInlineEditPatchMessage({
      selectedItemId: 42,
      hasDraft: true,
      message: {
        type: 'CMS_INLINE_EDIT_COMMIT',
        contentItemId: 42,
        versionId: 7,
        mode: 'richtext',
        value: '<p>Hello</p>',
        componentId: 'hero_1',
        propPath: 'subtitle'
      },
      applyValueByPath,
      scheduleSave
    });

    expect(applyValueByPath).toHaveBeenCalledWith('components.hero_1.props.subtitle', '<p>Hello</p>');
    expect(scheduleSave).toHaveBeenCalledWith({
      force: true,
      delay: 20,
      fieldPath: 'components.hero_1.props.subtitle'
    });
  });
});
