export const migration005 = {
  id: '005_forms_workflows',
  sql: `
CREATE TABLE IF NOT EXISTS forms (
  id INTEGER PRIMARY KEY,
  site_id INTEGER NOT NULL,
  name VARCHAR NOT NULL,
  description VARCHAR,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT current_timestamp,
  updated_at TIMESTAMP NOT NULL DEFAULT current_timestamp,
  FOREIGN KEY (site_id) REFERENCES sites(id)
);

CREATE TABLE IF NOT EXISTS form_steps (
  id INTEGER PRIMARY KEY,
  form_id INTEGER NOT NULL,
  name VARCHAR NOT NULL,
  position INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY (form_id) REFERENCES forms(id)
);

CREATE TABLE IF NOT EXISTS form_fields (
  id INTEGER PRIMARY KEY,
  step_id INTEGER NOT NULL,
  form_id INTEGER NOT NULL,
  key VARCHAR NOT NULL,
  label VARCHAR NOT NULL,
  field_type VARCHAR NOT NULL,
  position INTEGER NOT NULL DEFAULT 0,
  conditions_json VARCHAR NOT NULL DEFAULT '{}',
  validations_json VARCHAR NOT NULL DEFAULT '{}',
  ui_config_json VARCHAR NOT NULL DEFAULT '{}',
  active BOOLEAN NOT NULL DEFAULT TRUE,
  UNIQUE(form_id, key),
  FOREIGN KEY (step_id) REFERENCES form_steps(id),
  FOREIGN KEY (form_id) REFERENCES forms(id)
);

CREATE TABLE IF NOT EXISTS workflow_definitions (
  id INTEGER PRIMARY KEY,
  name VARCHAR NOT NULL,
  version INTEGER NOT NULL,
  graph_json VARCHAR NOT NULL,
  input_schema_json VARCHAR NOT NULL,
  permissions_json VARCHAR NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT current_timestamp,
  created_by VARCHAR NOT NULL,
  UNIQUE(name, version)
);

CREATE TABLE IF NOT EXISTS workflow_runs (
  id INTEGER PRIMARY KEY,
  definition_id INTEGER NOT NULL,
  status VARCHAR NOT NULL,
  context_json VARCHAR NOT NULL,
  current_node_id VARCHAR,
  logs_json VARCHAR NOT NULL,
  started_at TIMESTAMP NOT NULL DEFAULT current_timestamp,
  started_by VARCHAR NOT NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT current_timestamp,
  FOREIGN KEY (definition_id) REFERENCES workflow_definitions(id)
);

CREATE TABLE IF NOT EXISTS workflow_step_states (
  id INTEGER PRIMARY KEY,
  run_id INTEGER NOT NULL,
  node_id VARCHAR NOT NULL,
  status VARCHAR NOT NULL,
  payload_json VARCHAR NOT NULL DEFAULT '{}',
  updated_at TIMESTAMP NOT NULL DEFAULT current_timestamp,
  UNIQUE(run_id, node_id),
  FOREIGN KEY (run_id) REFERENCES workflow_runs(id)
);
`
};
