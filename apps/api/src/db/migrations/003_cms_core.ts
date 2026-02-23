export const migration003 = {
  id: '003_cms_core',
  sql: `
CREATE TABLE IF NOT EXISTS content_types (
  id INTEGER PRIMARY KEY,
  site_id INTEGER NOT NULL,
  name VARCHAR NOT NULL,
  description VARCHAR,
  fields_json VARCHAR NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT current_timestamp,
  created_by VARCHAR NOT NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT current_timestamp,
  updated_by VARCHAR NOT NULL,
  FOREIGN KEY (site_id) REFERENCES sites(id)
);

CREATE TABLE IF NOT EXISTS content_items (
  id INTEGER PRIMARY KEY,
  site_id INTEGER NOT NULL,
  content_type_id INTEGER NOT NULL,
  archived BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT current_timestamp,
  created_by VARCHAR NOT NULL,
  current_draft_version_id INTEGER,
  current_published_version_id INTEGER,
  FOREIGN KEY (site_id) REFERENCES sites(id),
  FOREIGN KEY (content_type_id) REFERENCES content_types(id)
);

CREATE TABLE IF NOT EXISTS content_versions (
  id INTEGER PRIMARY KEY,
  content_item_id INTEGER NOT NULL,
  version_number INTEGER NOT NULL,
  state VARCHAR NOT NULL,
  source_version_id INTEGER,
  fields_json VARCHAR NOT NULL,
  composition_json VARCHAR NOT NULL,
  components_json VARCHAR NOT NULL,
  metadata_json VARCHAR NOT NULL,
  comment VARCHAR,
  created_at TIMESTAMP NOT NULL DEFAULT current_timestamp,
  created_by VARCHAR NOT NULL,
  UNIQUE(content_item_id, version_number),
  FOREIGN KEY (content_item_id) REFERENCES content_items(id)
);

CREATE TABLE IF NOT EXISTS templates (
  id INTEGER PRIMARY KEY,
  site_id INTEGER NOT NULL,
  name VARCHAR NOT NULL,
  composition_json VARCHAR NOT NULL,
  components_json VARCHAR NOT NULL,
  constraints_json VARCHAR NOT NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT current_timestamp,
  FOREIGN KEY (site_id) REFERENCES sites(id)
);

CREATE TABLE IF NOT EXISTS content_routes (
  id INTEGER PRIMARY KEY,
  site_id INTEGER NOT NULL,
  content_item_id INTEGER NOT NULL,
  market_code VARCHAR NOT NULL,
  locale_code VARCHAR NOT NULL,
  slug VARCHAR NOT NULL,
  is_canonical BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT current_timestamp,
  UNIQUE(site_id, market_code, locale_code, slug),
  FOREIGN KEY (site_id) REFERENCES sites(id),
  FOREIGN KEY (content_item_id) REFERENCES content_items(id),
  FOREIGN KEY (site_id, market_code, locale_code)
    REFERENCES site_market_locales(site_id, market_code, locale_code)
);
`
};