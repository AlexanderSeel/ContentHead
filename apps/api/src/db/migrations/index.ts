import { migration001 } from './001_initial.js';
import { migration002 } from './002_sites_markets_locales.js';
import { migration003 } from './003_cms_core.js';
import { migration004 } from './004_variants.js';
import { migration005 } from './005_forms_workflows.js';
import { migration006 } from './006_site_url_pattern_and_locale_overrides.js';
import { migration007 } from './007_connectors_assets_security.js';
import { migration008 } from './008_form_submissions.js';
import { migration009 } from './009_component_registry.js';
import { migration010 } from './010_extensions_demo_entities.js';
import { migration011 } from './011_content_item_hierarchy.js';
import { migration012 } from './012_entity_acl_and_targeting.js';
import { migration013 } from './013_fk_compatibility_fixes.js';
import { migration014 } from './014_asset_rendition_fit_mode.js';
import { migration015 } from './015_component_definition_overrides.js';
import { migration016 } from './016_component_default_props.js';
import { migration017 } from './017_component_preset_backfill.js';
import { migration018 } from './018_component_type_system_sync_flag.js';
import { migration019 } from './019_component_schema_type_normalization.js';
import { migration020 } from './020_feature_grid_items_component_ref.js';

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
  migration009,
  migration010,
  migration011,
  migration012,
  migration013,
  migration014,
  migration015,
  migration016,
  migration017,
  migration018,
  migration019,
  migration020
];
