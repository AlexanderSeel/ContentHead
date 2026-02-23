export const migration008 = {
  id: '008_form_submissions',
  sql: `
CREATE TABLE IF NOT EXISTS form_submissions (
  id INTEGER PRIMARY KEY,
  site_id INTEGER NOT NULL,
  form_id INTEGER NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT current_timestamp,
  submitted_by_user_id VARCHAR,
  market_code VARCHAR NOT NULL,
  locale_code VARCHAR NOT NULL,
  page_content_item_id INTEGER,
  page_route_slug VARCHAR,
  status VARCHAR NOT NULL DEFAULT 'new',
  data_json VARCHAR NOT NULL,
  meta_json VARCHAR NOT NULL DEFAULT '{}',
  FOREIGN KEY (site_id) REFERENCES sites(id),
  FOREIGN KEY (form_id) REFERENCES forms(id),
  FOREIGN KEY (page_content_item_id) REFERENCES content_items(id)
);
`
};
