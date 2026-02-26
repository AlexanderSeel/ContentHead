import type { ReactNode } from 'react';
import { WorkspacePaneLayout } from './WorkspacePanels';

export function SplitWorkspace({
  left,
  center,
  right,
  leftSize = 25,
  centerSize = 50,
  rightSize = 25,
  workspaceId = 'split-workspace',
  className
}: {
  left: ReactNode;
  center: ReactNode;
  right: ReactNode;
  leftSize?: number;
  centerSize?: number;
  rightSize?: number;
  workspaceId?: string;
  className?: string;
}) {
  return (
    <WorkspacePaneLayout
      workspaceId={workspaceId}
      {...(className ? { className } : {})}
      left={{
        id: 'left',
        label: 'Tree',
        defaultSize: leftSize,
        minSize: 15,
        collapsible: true,
        header: null,
        content: left
      }}
      center={{
        id: 'center',
        label: 'Editor',
        defaultSize: centerSize,
        minSize: 30,
        collapsible: false,
        header: null,
        content: center
      }}
      right={{
        id: 'right',
        label: 'Inspector',
        defaultSize: rightSize,
        minSize: 20,
        collapsible: true,
        header: null,
        content: right
      }}
    />
  );
}
