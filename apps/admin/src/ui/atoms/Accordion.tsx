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

  return (
    <div className={['ch-accordion', className].filter(Boolean).join(' ')}>
      {tabs.map((tab, i) => {
        const open = isOpen(i);
        return (
          <div key={i} className={`ch-accordion-tab${open ? ' ch-accordion-tab-open' : ''}`}>
            <button
              type="button"
              className="ch-accordion-trigger"
              aria-expanded={open}
              onClick={() => handleTabClick(i)}
            >
              <span className={`pi ${open ? 'pi-chevron-down' : 'pi-chevron-right'} ch-accordion-icon`} aria-hidden="true" />
              <span className="ch-accordion-label">{tab.props.header}</span>
            </button>
            {open && (
              <div className="ch-accordion-content">
                {tab.props.children}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
