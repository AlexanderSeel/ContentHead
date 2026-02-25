export const migration020 = {
  id: '020_feature_grid_items_component_ref',
  sql: `
UPDATE component_type_settings
SET
  schema_json = '[{"key":"title","label":"Title","type":"text","required":false,"defaultValue":"Why teams choose ContentHead","control":"InputText"},{"key":"items","label":"Items","type":"objectList","required":false,"defaultValue":"","control":"InputText","itemLabelKey":"item","fields":[{"key":"item","label":"Item Component","type":"componentRef","required":false,"defaultValue":"","control":"Dropdown","refComponentTypes":["feature_grid_item"]}]}]',
  default_props_json = CASE
    WHEN default_props_json IS NULL OR TRIM(default_props_json) = '' THEN '{"title":"Why teams choose ContentHead","items":[]}'
    ELSE default_props_json
  END,
  updated_at = current_timestamp
WHERE component_type_id = 'feature_grid'
  AND schema_json IS NOT NULL
  AND (
    schema_json LIKE '%"key":"items"%'
    AND (
      schema_json LIKE '%"type":"text"%'
      OR schema_json LIKE '%"type":"multiline"%'
    )
  );
`
};
