import type { ReactNode } from 'react';
import { TabView, TabPanel } from 'primereact/tabview';

export function Tabs({
  activeIndex,
  onTabChange,
  children
}: {
  activeIndex?: number;
  onTabChange?: (index: number) => void;
  children?: ReactNode;
}) {
  return (
    <TabView
      activeIndex={activeIndex}
      onTabChange={onTabChange ? (event) => onTabChange(event.index) : undefined}
    >
      {children}
    </TabView>
  );
}

export function TabItem({
  header,
  children
}: {
  header: string;
  children?: ReactNode;
}) {
  return <TabPanel header={header}>{children}</TabPanel>;
}
