import { migration001 } from './001_initial.js';
import { migration002 } from './002_sites_markets_locales.js';
import { migration003 } from './003_cms_core.js';

export type Migration = {
  id: string;
  sql: string;
};

export const migrations: Migration[] = [migration001, migration002, migration003];
