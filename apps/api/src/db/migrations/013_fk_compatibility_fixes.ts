export const migration013 = {
  id: '013_fk_compatibility_fixes',
  sql: `
CREATE TABLE IF NOT EXISTS page_acl_settings_new (
  content_item_id INTEGER PRIMARY KEY,
  inherit_from_parent BOOLEAN NOT NULL DEFAULT TRUE,
  updated_at TIMESTAMP NOT NULL DEFAULT current_timestamp
);

INSERT INTO page_acl_settings_new(content_item_id, inherit_from_parent, updated_at)
SELECT
  content_item_id,
  COALESCE(inherit_from_parent, TRUE),
  COALESCE(updated_at, current_timestamp)
FROM page_acl_settings;

DROP TABLE IF EXISTS page_acl_settings;
ALTER TABLE page_acl_settings_new RENAME TO page_acl_settings;

CREATE TABLE IF NOT EXISTS page_targeting_new (
  content_item_id INTEGER PRIMARY KEY,
  inherit_from_parent BOOLEAN NOT NULL DEFAULT TRUE,
  allow_visitor_group_ids_json VARCHAR NOT NULL DEFAULT '[]',
  deny_visitor_group_ids_json VARCHAR NOT NULL DEFAULT '[]',
  deny_behavior VARCHAR NOT NULL DEFAULT 'NOT_FOUND',
  fallback_content_item_id INTEGER,
  updated_at TIMESTAMP NOT NULL DEFAULT current_timestamp
);

INSERT INTO page_targeting_new(
  content_item_id,
  inherit_from_parent,
  allow_visitor_group_ids_json,
  deny_visitor_group_ids_json,
  deny_behavior,
  fallback_content_item_id,
  updated_at
)
SELECT
  content_item_id,
  COALESCE(inherit_from_parent, TRUE),
  COALESCE(allow_visitor_group_ids_json, '[]'),
  COALESCE(deny_visitor_group_ids_json, '[]'),
  COALESCE(deny_behavior, 'NOT_FOUND'),
  fallback_content_item_id,
  COALESCE(updated_at, current_timestamp)
FROM page_targeting;

DROP TABLE IF EXISTS page_targeting;
ALTER TABLE page_targeting_new RENAME TO page_targeting;
`
};
