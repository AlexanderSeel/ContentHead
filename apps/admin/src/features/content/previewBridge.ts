export type CmsSelectMessage = {
  type: 'CMS_SELECT';
  contentItemId: number;
  versionId: number;
  componentId?: string | undefined;
  componentType?: string | undefined;
  fieldPath?: string | undefined;
  propPath?: string | undefined;
  rect?: { top: number; left: number; width: number; height: number };
};

export type CmsHighlightMessage = {
  type: 'CMS_HIGHLIGHT';
  componentId?: string | undefined;
  fieldPath?: string | undefined;
  richTextFeatures?: string[] | undefined;
};

export type CmsScrollToMessage = {
  type: 'CMS_SCROLL_TO';
  componentId: string;
};

export type CmsRefreshMessage = {
  type: 'CMS_REFRESH';
};

export type CmsInlineModeMessage = {
  type: 'CMS_INLINE_MODE';
  enabled: boolean;
};

export type CmsInlineEditMode = 'text' | 'richtext';

export type CmsInlineEditBaseMessage = {
  contentItemId: number;
  versionId: number;
  fieldPath?: string | undefined;
  componentId?: string | undefined;
  propPath?: string | undefined;
  mode: CmsInlineEditMode;
  value: string;
};

export type CmsInlineEditPatchMessage = CmsInlineEditBaseMessage & {
  type: 'CMS_INLINE_EDIT_PATCH';
};

export type CmsInlineEditCommitMessage = CmsInlineEditBaseMessage & {
  type: 'CMS_INLINE_EDIT_COMMIT';
};

export type CmsInlineEditCancelMessage = {
  type: 'CMS_INLINE_EDIT_CANCEL';
  contentItemId: number;
  versionId: number;
  fieldPath?: string | undefined;
  componentId?: string | undefined;
  propPath?: string | undefined;
};

export type CmsInlineEditErrorMessage = {
  type: 'CMS_INLINE_EDIT_ERROR';
  fieldPath?: string | undefined;
  componentId?: string | undefined;
  propPath?: string | undefined;
  message?: string | undefined;
};

export type CmsActionId =
  | 'replace'
  | 'clear'
  | 'delete'
  | 'duplicate'
  | 'move_up'
  | 'move_down';

export type CmsActionRequestMessage = {
  type: 'CMS_ACTION_REQUEST';
  mode: 'list' | 'run';
  action?: CmsActionId;
  contentItemId: number;
  versionId: number;
  componentId?: string | undefined;
  componentType?: string | undefined;
  fieldPath?: string | undefined;
  propPath?: string | undefined;
};

export type CmsActionsMessage = {
  type: 'CMS_ACTIONS';
  contentItemId: number;
  versionId: number;
  componentId?: string | undefined;
  fieldPath?: string | undefined;
  targetType?: 'text' | 'richtext' | 'asset' | 'link' | 'form' | 'component' | 'unknown';
  actions: Array<{
    id: CmsActionId;
    label: string;
    primary?: boolean;
  }>;
};

export type CmsBridgeMessage =
  | CmsSelectMessage
  | CmsHighlightMessage
  | CmsScrollToMessage
  | CmsRefreshMessage
  | CmsInlineModeMessage
  | CmsInlineEditPatchMessage
  | CmsInlineEditCommitMessage
  | CmsInlineEditCancelMessage
  | CmsInlineEditErrorMessage
  | CmsActionRequestMessage
  | CmsActionsMessage;
