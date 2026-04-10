import type { ReactNode } from 'react';
import { Accordion as PrimeAccordion, AccordionTab } from 'primereact/accordion';

export function Accordion({
  multiple,
  activeIndex,
  onTabChange,
  children
}: {
  multiple?: boolean;
  activeIndex?: number | number[];
  onTabChange?: (index: number | number[]) => void;
  children?: ReactNode;
}) {
  return (
    <PrimeAccordion
      multiple={multiple}
      activeIndex={activeIndex}
      onTabChange={onTabChange ? (event) => onTabChange(event.index) : undefined}
    >
      {children}
    </PrimeAccordion>
  );
}

export function AccordionItem({
  header,
  children
}: {
  header: string;
  children?: ReactNode;
}) {
  return <AccordionTab header={header}>{children}</AccordionTab>;
}
