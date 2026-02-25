import type { ReactNode } from 'react';
import { Splitter, SplitterPanel } from 'primereact/splitter';

import { useUi } from '../../app/UiContext';

export function SplitWorkspace({
  left,
  center,
  right,
  leftSize = 22,
  centerSize = 48,
  rightSize = 30,
  className
}: {
  left: ReactNode;
  center: ReactNode;
  right: ReactNode;
  leftSize?: number;
  centerSize?: number;
  rightSize?: number;
  className?: string;
}) {
  const { layoutPreferences } = useUi();
  const showLeftPanel = layoutPreferences.showWorkspacePanel;
  return (
    <Splitter className={className ?? 'splitFill'}>
      <SplitterPanel size={showLeftPanel ? leftSize : 0} minSize={showLeftPanel ? 15 : 0}>
        <div className="pane paneScroll">{showLeftPanel ? left : null}</div>
      </SplitterPanel>
      <SplitterPanel size={centerSize} minSize={30}>
        <div className="pane paneScroll">{center}</div>
      </SplitterPanel>
      <SplitterPanel size={rightSize} minSize={20}>
        <div className="pane paneScroll">{right}</div>
      </SplitterPanel>
    </Splitter>
  );
}
