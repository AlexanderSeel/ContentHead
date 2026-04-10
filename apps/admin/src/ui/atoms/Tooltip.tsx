import { Tooltip as PrimeTooltip } from 'primereact/tooltip';

export function Tooltip({
  target,
  content,
  position
}: {
  target: string;
  content: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
}) {
  return <PrimeTooltip target={target} content={content} position={position} />;
}
