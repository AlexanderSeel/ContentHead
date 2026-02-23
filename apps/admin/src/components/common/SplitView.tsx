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
    <Splitter style={{ height: 'calc(100vh - 220px)' }}>
      <SplitterPanel size={leftSize} minSize={20}>
        {left}
      </SplitterPanel>
      <SplitterPanel size={rightSize} minSize={30}>
        {right}
      </SplitterPanel>
    </Splitter>
  );
}
