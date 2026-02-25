export const migration016 = {
  id: '016_component_default_props',
  sql: `
ALTER TABLE component_type_settings ADD COLUMN IF NOT EXISTS default_props_json VARCHAR;
`
};
