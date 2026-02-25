# Preview / Visivic Bridge Protocol

## Transport

- Admin embeds web preview in iframe.
- Communication uses `window.postMessage` between admin and preview.

## Message types

### Preview -> Admin

- `CMS_ACTION_REQUEST`
  - mode `list`: asks admin for available actions for selected target.
  - mode `execute`: asks admin to execute selected action.
  - payload includes `contentItemId`, `versionId`, optional `componentId`, optional `fieldPath`.

- `CMS_INLINE_EDIT`
  - emitted when inline edit updates text/richtext content in preview.
  - admin applies patch by path and schedules draft save.

### Admin -> Preview

- `CMS_ACTIONS`
  - returns resolved available actions for the requested target.
  - includes target metadata and action list.

- selection/highlight synchronization messages (admin-selected field/component reflected in preview).

## Editing loop

1. User selects element in preview.
2. Preview requests actions (`CMS_ACTION_REQUEST` list mode).
3. Admin resolves target type and sends `CMS_ACTIONS`.
4. User executes action; preview sends execute request.
5. Admin mutates draft state and persists using scheduled save.
6. Preview reload/highlight stays in sync with selected target.

## Safety constraints

- Inline editing is disabled for published-only context.
- Raw JSON editing is advanced-only and gated behind confirm dialog.
- Asset/link/form replacement routes through existing picker dialogs.
