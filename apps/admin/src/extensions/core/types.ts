import type { ReactNode } from 'react';
import type { CommandRegistration } from '../../ui/commands/types';

export type ExtensionMenuItem = {
  areaKey: string;
  areaLabel: string;
  label: string;
  to: string;
  matchPrefix?: string;
  /** PrimeIcons class string, e.g. "pi pi-calendar". Defaults to "pi pi-link". */
  icon?: string;
  /** Lower numbers sort first within their area. Defaults to 100. */
  order?: number;
};

export type ExtensionRoute = {
  path: string;
  element: ReactNode;
};

export type ExtensionInspectorPanelProps = {
  siteId: number;
  contentItemId: number | null;
  metadataJson: string;
  compositionJson: string;
  componentsJson: string;
};

export type ExtensionInspectorPanel = {
  id: string;
  label: string;
  render: (props: ExtensionInspectorPanelProps) => ReactNode;
};

export type AdminExtension = {
  id: string;
  label: string;
  menu?: ExtensionMenuItem[];
  routes?: ExtensionRoute[];
  inspectorPanels?: ExtensionInspectorPanel[];
  commands?: CommandRegistration[];
  permissions?: string[];
};
