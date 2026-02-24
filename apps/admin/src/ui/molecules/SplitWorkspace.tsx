import type { ReactNode } from 'react';
import { Splitter, SplitterPanel } from 'primereact/splitter';

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
  return (
    <Splitter className={className ?? 'splitFill'} style={{ width: '100%' }}>
      <SplitterPanel size={leftSize} minSize={15}>
        <div className="pane paneScroll">{left}</div>
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
