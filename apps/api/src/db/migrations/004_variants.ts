export const migration004 = {
  id: '004_variants',
  sql: `
CREATE TABLE IF NOT EXISTS variant_sets (
  id INTEGER PRIMARY KEY,
  site_id INTEGER NOT NULL,
  content_item_id INTEGER NOT NULL,
  market_code VARCHAR NOT NULL,
  locale_code VARCHAR NOT NULL,
  fallback_variant_set_id INTEGER,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  UNIQUE(site_id, content_item_id, market_code, locale_code),
  FOREIGN KEY (site_id) REFERENCES sites(id),
  FOREIGN KEY (content_item_id) REFERENCES content_items(id),
  FOREIGN KEY (fallback_variant_set_id) REFERENCES variant_sets(id),
  FOREIGN KEY (site_id, market_code, locale_code)
    REFERENCES site_market_locales(site_id, market_code, locale_code)
);

CREATE TABLE IF NOT EXISTS variants (
  id INTEGER PRIMARY KEY,
  variant_set_id INTEGER NOT NULL,
  key VARCHAR NOT NULL,
  priority INTEGER NOT NULL DEFAULT 0,
  rule_json VARCHAR NOT NULL,
  state VARCHAR NOT NULL,
  traffic_allocation INTEGER,
  content_version_id INTEGER NOT NULL,
  UNIQUE(variant_set_id, key),
  FOREIGN KEY (variant_set_id) REFERENCES variant_sets(id),
  FOREIGN KEY (content_version_id) REFERENCES content_versions(id)
);
`
};