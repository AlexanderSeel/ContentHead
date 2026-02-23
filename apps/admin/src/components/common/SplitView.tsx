import { Splitter, SplitterPanel } from 'primereact/splitter';
import type { ReactNode } from 'react';

export function SplitView({
  left,
  right,
  leftSize = 30,
  rightSize = 70
}: {
  left: ReactNode;
  right: ReactNode;
  leftSize?: number;
  rightSize?: number;
}) {
  return (
    <Splitter className="split-view">
      <SplitterPanel size={leftSize} minSize={20}>
        <div className="split-pane">{left}</div>
      </SplitterPanel>
      <SplitterPanel size={rightSize} minSize={30}>
        <div className="split-pane">{right}</div>
      </SplitterPanel>
    </Splitter>
  );
}
