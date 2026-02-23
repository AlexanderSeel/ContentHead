export const migration006 = {
  id: '006_site_url_pattern_and_locale_overrides',
  sql: `
ALTER TABLE sites ADD COLUMN url_pattern VARCHAR DEFAULT '/{market}/{locale}';

UPDATE sites
SET url_pattern = '/{market}/{locale}'
WHERE url_pattern IS NULL OR TRIM(url_pattern) = '';

CREATE TABLE IF NOT EXISTS site_locale_overrides (
  site_id INTEGER NOT NULL,
  locale_code VARCHAR NOT NULL,
  display_name VARCHAR,
  fallback_locale_code VARCHAR,
  PRIMARY KEY (site_id, locale_code),
  FOREIGN KEY (site_id) REFERENCES sites(id),
  FOREIGN KEY (locale_code) REFERENCES locales(code),
  FOREIGN KEY (fallback_locale_code) REFERENCES locales(code)
);
`
};
