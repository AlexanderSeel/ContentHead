export type CmsSelectMessage = {
  type: 'CMS_SELECT';
  contentItemId: number;
  versionId: number;
  componentId?: string | undefined;
  componentType?: string | undefined;
  fieldPath?: string | undefined;
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

export type CmsInlineEditMessage = {
  type: 'CMS_INLINE_EDIT';
  fieldPath: string;
  html: string;
};

export type CmsBridgeMessage =
  | CmsSelectMessage
  | CmsHighlightMessage
  | CmsScrollToMessage
  | CmsRefreshMessage
  | CmsInlineModeMessage
  | CmsInlineEditMessage;
