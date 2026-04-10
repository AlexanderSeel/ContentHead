import type { ReactNode } from 'react';
import { Card as PrimeCard } from 'primereact/card';

export function Card({
  title,
  subTitle,
  className,
  children
}: {
  title?: string;
  subTitle?: string;
  className?: string;
  children?: ReactNode;
}) {
  return (
    <PrimeCard title={title} subTitle={subTitle} className={className}>
      {children}
    </PrimeCard>
  );
}
