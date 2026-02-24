import { migration001 } from './001_initial.js';
import { migration002 } from './002_sites_markets_locales.js';
import { migration003 } from './003_cms_core.js';
import { migration004 } from './004_variants.js';
import { migration005 } from './005_forms_workflows.js';
import { migration006 } from './006_site_url_pattern_and_locale_overrides.js';
import { migration007 } from './007_connectors_assets_security.js';
import { migration008 } from './008_form_submissions.js';
import { migration009 } from './009_component_registry.js';

export type Migration = {
  id: string;
  sql: string;
};

export const migrations: Migration[] = [
  migration001,
  migration002,
  migration003,
  migration004,
  migration005,
  migration006,
  migration007,
  migration008,
  migration009
];
