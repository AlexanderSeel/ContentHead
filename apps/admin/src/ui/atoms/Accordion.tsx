import { useState, type ReactNode } from 'react';
import React from 'react';

export function AccordionItem({
  children
}: {
  header: string;
  children?: ReactNode;
}) {
  // Rendered by Accordion — this component is just a slot carrier
  return <>{children}</>;
}

export function Accordion({
  multiple,
  activeIndex,
  onTabChange,
  className,
  children
}: {
  multiple?: boolean;
  activeIndex?: number | number[] | null;
  onTabChange?: (index: number | number[]) => void;
  className?: string;
  children?: ReactNode;
}) {
  const [localIndex, setLocalIndex] = useState<number | number[]>(multiple ? [] : -1);
  const controlled = onTabChange !== undefined;
  const currentIndex = controlled ? (activeIndex ?? (multiple ? [] : -1)) : localIndex;

  const isOpen = (i: number): boolean => {
    if (Array.isArray(currentIndex)) return currentIndex.includes(i);
    return currentIndex === i;
  };

  const handleTabClick = (i: number) => {
    let next: number | number[];
    if (multiple) {
      const arr = Array.isArray(currentIndex) ? currentIndex : [];
      next = arr.includes(i) ? arr.filter((x) => x !== i) : [...arr, i];
    } else {
      next = currentIndex === i ? -1 : i;
    }
    if (controlled) {
      onTabChange(next);
    } else {
      setLocalIndex(next);
    }
  };

  const tabs = React.Children.toArray(children).filter(React.isValidElement) as React.ReactElement<{
    header: string;
    children?: ReactNode;
  }>[];

  const rootClass = ['p-accordion', 'p-component', className].filter(Boolean).join(' ');

  return (
    <div className={rootClass}>
      {tabs.map((tab, i) => {
        const open = isOpen(i);
        return (
          <div key={i} className={`p-accordion-tab${open ? ' p-accordion-tab-active' : ''}`}>
            <div className={`p-accordion-header${open ? ' p-highlight' : ''}`}>
              <a
                className="p-accordion-header-link"
                role="button"
                aria-expanded={open}
                tabIndex={0}
                onClick={() => handleTabClick(i)}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleTabClick(i); } }}
                style={{ cursor: 'pointer' }}
              >
                <span className={`p-accordion-toggle-icon pi ${open ? 'pi-chevron-down' : 'pi-chevron-right'}`} />
                <span className="p-accordion-header-text">{tab.props.header}</span>
              </a>
            </div>
            {open && (
              <div className="p-toggleable-content">
                <div className="p-accordion-content">{tab.props.children}</div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
