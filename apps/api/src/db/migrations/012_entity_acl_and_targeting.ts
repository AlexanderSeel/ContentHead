export const migration012 = {
  id: '012_entity_acl_and_targeting',
  sql: `
CREATE TABLE IF NOT EXISTS principal_groups (
  id INTEGER PRIMARY KEY,
  name VARCHAR NOT NULL UNIQUE,
  description VARCHAR,
  created_at TIMESTAMP NOT NULL DEFAULT current_timestamp,
  updated_at TIMESTAMP NOT NULL DEFAULT current_timestamp
);

CREATE TABLE IF NOT EXISTS user_groups (
  user_id INTEGER NOT NULL,
  group_id INTEGER NOT NULL,
  PRIMARY KEY (user_id, group_id),
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (group_id) REFERENCES principal_groups(id)
);

CREATE TABLE IF NOT EXISTS entity_acls (
  id INTEGER PRIMARY KEY,
  entity_type VARCHAR NOT NULL,
  entity_id VARCHAR NOT NULL,
  principal_type VARCHAR NOT NULL,
  principal_id VARCHAR NOT NULL,
  permission_key VARCHAR NOT NULL,
  effect VARCHAR NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT current_timestamp,
  updated_at TIMESTAMP NOT NULL DEFAULT current_timestamp,
  UNIQUE(entity_type, entity_id, principal_type, principal_id, permission_key)
);

CREATE INDEX IF NOT EXISTS idx_entity_acls_entity
  ON entity_acls(entity_type, entity_id, permission_key);

CREATE TABLE IF NOT EXISTS page_acl_settings (
  content_item_id INTEGER PRIMARY KEY,
  inherit_from_parent BOOLEAN NOT NULL DEFAULT TRUE,
  updated_at TIMESTAMP NOT NULL DEFAULT current_timestamp,
  FOREIGN KEY (content_item_id) REFERENCES content_items(id)
);

CREATE TABLE IF NOT EXISTS visitor_groups (
  id INTEGER PRIMARY KEY,
  site_id INTEGER NOT NULL,
  name VARCHAR NOT NULL,
  rule_json VARCHAR NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT current_timestamp,
  updated_at TIMESTAMP NOT NULL DEFAULT current_timestamp,
  UNIQUE(site_id, name),
  FOREIGN KEY (site_id) REFERENCES sites(id)
);

CREATE TABLE IF NOT EXISTS page_targeting (
  content_item_id INTEGER PRIMARY KEY,
  inherit_from_parent BOOLEAN NOT NULL DEFAULT TRUE,
  allow_visitor_group_ids_json VARCHAR NOT NULL DEFAULT '[]',
  deny_visitor_group_ids_json VARCHAR NOT NULL DEFAULT '[]',
  deny_behavior VARCHAR NOT NULL DEFAULT 'NOT_FOUND',
  fallback_content_item_id INTEGER,
  updated_at TIMESTAMP NOT NULL DEFAULT current_timestamp,
  FOREIGN KEY (content_item_id) REFERENCES content_items(id),
  FOREIGN KEY (fallback_content_item_id) REFERENCES content_items(id)
);
`
};
