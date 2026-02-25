export const migration015 = {
  id: '015_component_definition_overrides',
  sql: `
ALTER TABLE component_type_settings ADD COLUMN IF NOT EXISTS label VARCHAR;
ALTER TABLE component_type_settings ADD COLUMN IF NOT EXISTS schema_json VARCHAR;
ALTER TABLE component_type_settings ADD COLUMN IF NOT EXISTS ui_meta_json VARCHAR;
`
};
