export const migration009 = {
  id: '009_component_registry',
  sql: `
ALTER TABLE content_types
  ADD COLUMN IF NOT EXISTS allowed_components_json VARCHAR DEFAULT '[]';

ALTER TABLE content_types
  ADD COLUMN IF NOT EXISTS component_area_restrictions_json VARCHAR DEFAULT '{}';

UPDATE content_types
SET allowed_components_json = COALESCE(allowed_components_json, '[]');

UPDATE content_types
SET component_area_restrictions_json = COALESCE(component_area_restrictions_json, '{}');

CREATE TABLE IF NOT EXISTS component_type_settings (
  site_id INTEGER,
  component_type_id VARCHAR,
  enabled BOOLEAN DEFAULT TRUE,
  group_name VARCHAR,
  updated_at TIMESTAMP,
  updated_by VARCHAR,
  FOREIGN KEY (site_id) REFERENCES sites(id)
);

ALTER TABLE component_type_settings ADD COLUMN IF NOT EXISTS component_type_id VARCHAR;
ALTER TABLE component_type_settings ADD COLUMN IF NOT EXISTS enabled BOOLEAN DEFAULT TRUE;
ALTER TABLE component_type_settings ADD COLUMN IF NOT EXISTS group_name VARCHAR;
ALTER TABLE component_type_settings ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP;
ALTER TABLE component_type_settings ADD COLUMN IF NOT EXISTS updated_by VARCHAR;
`
};
