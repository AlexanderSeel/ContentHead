import { useState, type ReactNode } from 'react';
import React from 'react';

export function TabItem({
  children
}: {
  header: string;
  children?: ReactNode;
}) {
  // Rendered by Tabs — this component is just a slot carrier
  return <>{children}</>;
}

export function Tabs({
  activeIndex,
  onTabChange,
  children
}: {
  activeIndex?: number;
  onTabChange?: (index: number) => void;
  children?: ReactNode;
}) {
  const [localIndex, setLocalIndex] = useState(0);
  const controlled = onTabChange !== undefined;
  const currentIndex = controlled ? (activeIndex ?? 0) : localIndex;

  const tabs = React.Children.toArray(children).filter(React.isValidElement) as React.ReactElement<{
    header: string;
    children?: ReactNode;
  }>[];

  const handleTabClick = (i: number) => {
    if (controlled) {
      onTabChange(i);
    } else {
      setLocalIndex(i);
    }
  };

  return (
    <div className="p-tabview p-component">
      <ul className="p-tabview-nav" role="tablist">
        {tabs.map((tab, i) => (
          <li
            key={i}
            className={`p-tabview-header${i === currentIndex ? ' p-highlight' : ''}`}
            role="presentation"
          >
            <a
              className="p-tabview-nav-link"
              role="tab"
              aria-selected={i === currentIndex}
              tabIndex={i === currentIndex ? 0 : -1}
              onClick={() => handleTabClick(i)}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleTabClick(i); } }}
              style={{ cursor: 'pointer' }}
            >
              {tab.props.header}
            </a>
          </li>
        ))}
      </ul>
      <div className="p-tabview-panels">
        {tabs.map((tab, i) => (
          <div
            key={i}
            className="p-tabview-panel"
            role="tabpanel"
            hidden={i !== currentIndex}
          >
            {tab.props.children}
          </div>
        ))}
      </div>
    </div>
  );
}
