export const migration001 = {
  id: '001_initial',
  sql: `
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY,
  username VARCHAR NOT NULL UNIQUE,
  password_hash VARCHAR NOT NULL,
  display_name VARCHAR NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT current_timestamp
);
`
};