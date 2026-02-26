import type {
  CmsInlineEditCommitMessage,
  CmsInlineEditPatchMessage
} from './previewBridge';

type InlinePatchMessage = Partial<CmsInlineEditPatchMessage> | Partial<CmsInlineEditCommitMessage>;

export type InlineSaveRequest = {
  force: boolean;
  delay: number;
  fieldPath: string;
  editTargetId?: string;
};

export type HandleInlineEditPatchOptions = {
  selectedItemId: number | null;
  hasDraft: boolean;
  message: InlinePatchMessage;
  applyValueByPath: (fieldPath: string, value: string) => boolean;
  scheduleSave: (request: InlineSaveRequest) => void;
};

export function resolveInlineEditFieldPath(input: {
  fieldPath?: string | null | undefined;
  componentId?: string | null | undefined;
  propPath?: string | null | undefined;
}): string | null {
  const fieldPath = input.fieldPath?.trim();
  if (fieldPath) {
    return fieldPath;
  }
  const componentId = input.componentId?.trim();
  const propPath = input.propPath?.trim();
  if (!componentId || !propPath) {
    return null;
  }
  return `components.${componentId}.props.${propPath}`;
}

export function handleInlineEditPatchMessage(options: HandleInlineEditPatchOptions): {
  handled: boolean;
  applied: boolean;
  reason?: 'missing_draft' | 'content_item_mismatch' | 'invalid_path' | 'apply_failed';
  fieldPath?: string;
  editTargetId?: string;
} {
  const editTargetId = typeof options.message.editTargetId === 'string' ? options.message.editTargetId : undefined;
  if (!options.hasDraft) {
    return { handled: false, applied: false, reason: 'missing_draft' };
  }
  if (
    !options.selectedItemId ||
    typeof options.message.contentItemId !== 'number' ||
    options.selectedItemId !== Number(options.message.contentItemId)
  ) {
    return { handled: false, applied: false, reason: 'content_item_mismatch' };
  }

  const fieldPath = resolveInlineEditFieldPath({
    fieldPath: options.message.fieldPath,
    componentId: options.message.componentId,
    propPath: options.message.propPath
  });
  if (!fieldPath) {
    return { handled: false, applied: false, reason: 'invalid_path', ...(editTargetId ? { editTargetId } : {}) };
  }

  if (typeof options.message.value !== 'string') {
    return { handled: false, applied: false, reason: 'invalid_path', ...(editTargetId ? { editTargetId } : {}) };
  }
  const applied = options.applyValueByPath(fieldPath, options.message.value);
  if (!applied) {
    return { handled: true, applied: false, reason: 'apply_failed', fieldPath, ...(editTargetId ? { editTargetId } : {}) };
  }

  options.scheduleSave({
    force: options.message.type === 'CMS_INLINE_EDIT_COMMIT',
    delay: options.message.type === 'CMS_INLINE_EDIT_COMMIT' ? 20 : 900,
    fieldPath,
    ...(editTargetId ? { editTargetId } : {})
  });
  return { handled: true, applied: true, fieldPath, ...(editTargetId ? { editTargetId } : {}) };
}
