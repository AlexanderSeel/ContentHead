export const migration018 = {
  id: '018_component_type_system_sync_flag',
  sql: `
UPDATE component_type_settings
SET updated_by = 'system'
WHERE component_type_id IN (
  'hero',
  'feature_grid_item',
  'feature_grid',
  'image_text',
  'pricing',
  'faq',
  'newsletter_form',
  'footer',
  'text_block',
  'cta'
)
AND (updated_by IS NULL OR TRIM(updated_by) = '');
`
};
