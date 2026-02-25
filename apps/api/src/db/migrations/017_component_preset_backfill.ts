export const migration017 = {
  id: '017_component_preset_backfill',
  sql: `
UPDATE component_type_settings
SET
  label = 'Feature Grid',
  group_name = 'Marketing',
  schema_json = '[{"key":"title","label":"Title","type":"string","required":false,"defaultValue":"Why teams choose ContentHead","control":"InputText"},{"key":"items","label":"Items","type":"objectList","required":false,"defaultValue":"","control":"InputText","itemLabelKey":"title","fields":[{"key":"icon","label":"Icon","type":"string","required":false,"defaultValue":"pi-bolt","control":"InputText"},{"key":"title","label":"Title","type":"string","required":true,"defaultValue":"","control":"InputText"},{"key":"description","label":"Description","type":"string","required":false,"defaultValue":"","control":"InputText"}]}]',
  default_props_json = '{"title":"Why teams choose ContentHead","items":[{"icon":"pi-bolt","title":"Fast authoring","description":"Live preview and on-page editing for rapid iteration."},{"icon":"pi-globe","title":"Market ready","description":"Built-in market and locale routing with overrides."},{"icon":"pi-sliders-h","title":"Variants","description":"Personalize with variant sets and deterministic rules."}]}',
  updated_at = current_timestamp,
  updated_by = 'system'
WHERE component_type_id = 'feature_grid'
  AND (updated_by = 'system' OR updated_by IS NULL);
`
};
