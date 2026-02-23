export const migration002 = {
  id: '002_sites_markets_locales',
  sql: `
CREATE TABLE IF NOT EXISTS markets (
  code VARCHAR PRIMARY KEY,
  name VARCHAR NOT NULL,
  currency VARCHAR,
  timezone VARCHAR,
  active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS locales (
  code VARCHAR PRIMARY KEY,
  name VARCHAR NOT NULL,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  fallback_locale_code VARCHAR,
  FOREIGN KEY (fallback_locale_code) REFERENCES locales(code)
);

CREATE TABLE IF NOT EXISTS sites (
  id INTEGER PRIMARY KEY,
  name VARCHAR NOT NULL,
  active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS site_markets (
  site_id INTEGER NOT NULL,
  market_code VARCHAR NOT NULL,
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  PRIMARY KEY (site_id, market_code),
  UNIQUE(site_id, market_code),
  FOREIGN KEY (site_id) REFERENCES sites(id),
  FOREIGN KEY (market_code) REFERENCES markets(code)
);

CREATE TABLE IF NOT EXISTS site_locales (
  site_id INTEGER NOT NULL,
  locale_code VARCHAR NOT NULL,
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  PRIMARY KEY (site_id, locale_code),
  UNIQUE(site_id, locale_code),
  FOREIGN KEY (site_id) REFERENCES sites(id),
  FOREIGN KEY (locale_code) REFERENCES locales(code)
);

CREATE TABLE IF NOT EXISTS site_market_locales (
  site_id INTEGER NOT NULL,
  market_code VARCHAR NOT NULL,
  locale_code VARCHAR NOT NULL,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  is_default_for_market BOOLEAN NOT NULL DEFAULT FALSE,
  PRIMARY KEY (site_id, market_code, locale_code),
  UNIQUE(site_id, market_code, locale_code),
  FOREIGN KEY (site_id, market_code) REFERENCES site_markets(site_id, market_code),
  FOREIGN KEY (site_id, locale_code) REFERENCES site_locales(site_id, locale_code)
);

INSERT INTO sites(id, name, active)
SELECT 1, 'Main Site', TRUE
WHERE NOT EXISTS (SELECT 1 FROM sites WHERE id = 1);
`
};