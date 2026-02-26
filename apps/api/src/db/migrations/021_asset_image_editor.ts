export const migration021 = {
  id: '021_asset_image_editor',
  sql: `
ALTER TABLE assets ADD COLUMN IF NOT EXISTS focal_x DOUBLE;
ALTER TABLE assets ADD COLUMN IF NOT EXISTS focal_y DOUBLE;
ALTER TABLE assets ADD COLUMN IF NOT EXISTS pois_json VARCHAR;
ALTER TABLE assets ADD COLUMN IF NOT EXISTS rendition_presets_json VARCHAR;

ALTER TABLE asset_renditions ADD COLUMN IF NOT EXISTS preset_id VARCHAR;
ALTER TABLE asset_renditions ADD COLUMN IF NOT EXISTS crop_json VARCHAR;
ALTER TABLE asset_renditions ADD COLUMN IF NOT EXISTS focal_x DOUBLE;
ALTER TABLE asset_renditions ADD COLUMN IF NOT EXISTS focal_y DOUBLE;
ALTER TABLE asset_renditions ADD COLUMN IF NOT EXISTS format VARCHAR;
ALTER TABLE asset_renditions ADD COLUMN IF NOT EXISTS quality INTEGER;
ALTER TABLE asset_renditions ADD COLUMN IF NOT EXISTS mode VARCHAR;
`
};
