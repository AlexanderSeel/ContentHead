export const migration010 = {
  id: '010_extensions_demo_entities',
  sql: `
CREATE TABLE IF NOT EXISTS ext_organisations (
  id INTEGER PRIMARY KEY,
  site_id INTEGER NOT NULL,
  name VARCHAR NOT NULL,
  website VARCHAR,
  notes VARCHAR,
  created_at TIMESTAMP NOT NULL DEFAULT current_timestamp,
  updated_at TIMESTAMP NOT NULL DEFAULT current_timestamp
);

CREATE TABLE IF NOT EXISTS ext_customers (
  id INTEGER PRIMARY KEY,
  site_id INTEGER NOT NULL,
  organisation_id INTEGER,
  display_name VARCHAR NOT NULL,
  email VARCHAR,
  phone VARCHAR,
  content_item_id INTEGER,
  notes VARCHAR,
  created_at TIMESTAMP NOT NULL DEFAULT current_timestamp,
  updated_at TIMESTAMP NOT NULL DEFAULT current_timestamp
);

CREATE TABLE IF NOT EXISTS ext_bookings (
  id INTEGER PRIMARY KEY,
  site_id INTEGER NOT NULL,
  booking_at TIMESTAMP NOT NULL,
  customer_id INTEGER,
  content_item_id INTEGER,
  status VARCHAR NOT NULL,
  notes VARCHAR,
  created_at TIMESTAMP NOT NULL DEFAULT current_timestamp,
  updated_at TIMESTAMP NOT NULL DEFAULT current_timestamp
);
`
};
