export const migration007 = {
  id: '007_connectors_assets_security',
  sql: `
ALTER TABLE users ADD COLUMN active BOOLEAN DEFAULT TRUE;

CREATE TABLE IF NOT EXISTS roles (
  id INTEGER PRIMARY KEY,
  name VARCHAR NOT NULL UNIQUE,
  description VARCHAR,
  created_at TIMESTAMP NOT NULL DEFAULT current_timestamp,
  updated_at TIMESTAMP NOT NULL DEFAULT current_timestamp
);

CREATE TABLE IF NOT EXISTS role_permissions (
  role_id INTEGER NOT NULL,
  permission_key VARCHAR NOT NULL,
  PRIMARY KEY (role_id, permission_key),
  FOREIGN KEY (role_id) REFERENCES roles(id)
);

CREATE TABLE IF NOT EXISTS user_roles (
  user_id INTEGER NOT NULL,
  role_id INTEGER NOT NULL,
  PRIMARY KEY (user_id, role_id),
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (role_id) REFERENCES roles(id)
);

CREATE TABLE IF NOT EXISTS connectors (
  id INTEGER PRIMARY KEY,
  domain VARCHAR NOT NULL,
  type VARCHAR NOT NULL,
  name VARCHAR NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  config_json VARCHAR NOT NULL DEFAULT '{}',
  created_at TIMESTAMP NOT NULL DEFAULT current_timestamp,
  updated_at TIMESTAMP NOT NULL DEFAULT current_timestamp
);

CREATE TABLE IF NOT EXISTS assets (
  id INTEGER PRIMARY KEY,
  site_id INTEGER NOT NULL,
  filename VARCHAR NOT NULL,
  original_name VARCHAR NOT NULL,
  mime_type VARCHAR NOT NULL,
  bytes BIGINT NOT NULL,
  width INTEGER,
  height INTEGER,
  duration INTEGER,
  checksum VARCHAR,
  storage_provider VARCHAR NOT NULL DEFAULT 'local',
  storage_path VARCHAR NOT NULL,
  cdn_url VARCHAR,
  title VARCHAR,
  alt_text VARCHAR,
  description VARCHAR,
  tags_json VARCHAR,
  folder_id INTEGER,
  created_at TIMESTAMP NOT NULL DEFAULT current_timestamp,
  created_by VARCHAR NOT NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT current_timestamp,
  updated_by VARCHAR NOT NULL,
  FOREIGN KEY (site_id) REFERENCES sites(id)
);

CREATE TABLE IF NOT EXISTS asset_folders (
  id INTEGER PRIMARY KEY,
  site_id INTEGER NOT NULL,
  parent_id INTEGER,
  name VARCHAR NOT NULL,
  path VARCHAR NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT current_timestamp,
  created_by VARCHAR NOT NULL,
  UNIQUE(site_id, path),
  FOREIGN KEY (site_id) REFERENCES sites(id)
);

CREATE TABLE IF NOT EXISTS asset_renditions (
  id INTEGER PRIMARY KEY,
  asset_id INTEGER NOT NULL,
  kind VARCHAR NOT NULL,
  width INTEGER NOT NULL,
  height INTEGER NOT NULL,
  fit_mode VARCHAR NOT NULL DEFAULT 'cover',
  storage_path VARCHAR NOT NULL,
  bytes BIGINT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT current_timestamp,
  UNIQUE(asset_id, kind, fit_mode, width),
  FOREIGN KEY (asset_id) REFERENCES assets(id)
);
`
};
