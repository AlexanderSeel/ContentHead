import { Chips as PrimeChips } from 'primereact/chips';
import type { ChipsProps, ChipsChangeEvent } from 'primereact/chips';

export type { ChipsProps, ChipsChangeEvent };

export type ChipsBaseProps = Pick<ChipsProps, 'value' | 'onChange' | 'separator' | 'placeholder' | 'className'>;

export function Chips(props: ChipsBaseProps) {
  return <PrimeChips {...props} />;
}
