export const migration014 = {
  id: '014_asset_rendition_fit_mode',
  sql: `
ALTER TABLE asset_renditions ADD COLUMN IF NOT EXISTS fit_mode VARCHAR DEFAULT 'cover';
`
};
