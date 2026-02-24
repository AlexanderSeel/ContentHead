import type { ReactNode } from 'react';
import type { CommandRegistration } from '../../ui/commands/types';

export type ExtensionMenuItem = {
  areaKey: string;
  areaLabel: string;
  label: string;
  to: string;
  matchPrefix?: string;
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
