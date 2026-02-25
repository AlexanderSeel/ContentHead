export const migration017 = {
  id: '017_component_preset_backfill',
  sql: `
UPDATE component_type_settings
SET
  label = 'Feature Grid',
  group_name = 'Marketing',
  schema_json = '[{"key":"title","label":"Title","type":"text","required":false,"defaultValue":"Why teams choose ContentHead","control":"InputText"},{"key":"items","label":"Items","type":"objectList","required":false,"defaultValue":"","control":"InputText","itemLabelKey":"item","fields":[{"key":"item","label":"Item Component","type":"componentRef","required":false,"defaultValue":"","control":"InputText","refComponentTypes":["feature_grid_item"]}]}]',
  default_props_json = '{"title":"Why teams choose ContentHead","items":[]}',
  updated_at = current_timestamp,
  updated_by = 'system'
WHERE component_type_id = 'feature_grid'
  AND (updated_by = 'system' OR updated_by IS NULL);
`
};
