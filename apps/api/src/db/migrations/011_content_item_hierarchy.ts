export const migration011 = {
  id: '011_content_item_hierarchy',
  sql: `
ALTER TABLE content_items ADD COLUMN IF NOT EXISTS parent_id INTEGER;
ALTER TABLE content_items ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;

UPDATE content_items
SET sort_order = 0
WHERE sort_order IS NULL;

CREATE INDEX IF NOT EXISTS idx_content_items_site_parent_sort
  ON content_items(site_id, parent_id, sort_order, id);
`
};
